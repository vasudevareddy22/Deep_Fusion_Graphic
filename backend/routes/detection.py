import sys
import os
import json
import datetime
import pandas as pd
from pathlib import Path
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.config import Config
from backend.database.db import get_db_connection, purge_expired_records
from backend.ml.predict import predictor
from backend.gnn.graph_predict import graph_analyzer
from backend.fusion.fusion import fusion_engine
from backend.llm.explain import threat_explainer

def _get_current_user_email() -> str:
    """Extract user identifier from Authorization header for dataset attribution."""
    auth_header = request.headers.get('Authorization', '')
    token = auth_header.replace('Bearer ', '').strip()
    if not token or token in ('dfg-jwt-session-token-admin-soc-verified', 'demo-token'):
        return 'admin@deepfusionguard.com'
    try:
        # Token format: dfg-jwt-session-{id}-{hash} — look up by id
        parts = token.split('-')
        if len(parts) >= 4:
            user_id = parts[3]
            conn = get_db_connection()
            row = conn.execute('SELECT email, mobile FROM users WHERE id = ?', (user_id,)).fetchone()
            conn.close()
            if row:
                return row['email'] or row['mobile'] or 'unknown'
    except Exception:
        pass
    return 'unknown'

detection_bp = Blueprint('detection', __name__)

ALLOWED_EXTENSIONS = {'csv', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@detection_bp.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Unsupported file format. Please upload CSV or TXT.'}), 400

    filename = secure_filename(file.filename)
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    saved_filename = f"{timestamp}_{filename}"
    upload_path = Path(Config.UPLOAD_FOLDER) / saved_filename
    
    file.save(str(upload_path))

    # Enforce 365-day retention policy on every upload
    purge_expired_records(retention_days=365)
    
    # Read preview
    try:
        df = pd.read_csv(str(upload_path))
        num_rows = len(df)
        columns = list(df.columns)
        preview = df.head(5).to_dict(orient='records')
        
        return jsonify({
            'success': True,
            'filename': saved_filename,
            'total_rows': num_rows,
            'columns': columns,
            'preview': preview,
            'message': f"Successfully uploaded and validated {filename} with {num_rows} records."
        }), 200
    except Exception as e:
        return jsonify({'error': f"Failed to parse CSV file: {str(e)}"}), 400

@detection_bp.route('/api/detect', methods=['POST'])
def run_detection():
    data = request.get_json() or {}
    filename = data.get('filename')
    
    if filename:
        file_path = Path(Config.UPLOAD_FOLDER) / filename
        if not file_path.exists():
            return jsonify({'error': f"File {filename} not found on server"}), 404
        try:
            df = pd.read_csv(str(file_path))
        except Exception as e:
            return jsonify({'error': f"Failed to read file: {e}"}), 400
    else:
        # Fallback to sample data if no file specified
        sample_path = Path(Config.SAMPLE_DATA_FOLDER) / "sample_network_traffic.csv"
        df = pd.read_csv(str(sample_path)).head(50)

    # Process through pipeline
    result = execute_detection_pipeline(df)
    return jsonify(result), 200

@detection_bp.route('/api/load-demo', methods=['POST'])
def load_demo_data():
    data = request.get_json(silent=True) or {}
    scenario = data.get('scenario', 'default').lower()

    scenario_files = {
        'ddos': 'scenario_ddos_storm.csv',
        'recon': 'scenario_apt_reconnaissance.csv',
        'bruteforce': 'scenario_brute_force_r2l.csv',
        'u2r': 'scenario_privilege_escalation.csv',
        'default': 'sample_network_traffic.csv'
    }

    filename = scenario_files.get(scenario, 'sample_network_traffic.csv')
    sample_path = Path(Config.SAMPLE_DATA_FOLDER) / filename

    if not sample_path.exists():
        sample_path = Path(Config.SAMPLE_DATA_FOLDER) / "sample_network_traffic.csv"

    df = pd.read_csv(str(sample_path))

    if scenario == 'default':
        # Select a diverse balanced slice of 50 records
        sample_slice = pd.concat([
            df[df['label'] == 'DoS'].head(15),
            df[df['label'] == 'Probe'].head(10),
            df[df['label'] == 'R2L'].head(8),
            df[df['label'] == 'U2R'].head(5),
            df[df['label'] == 'Normal'].head(12)
        ]).sample(frac=1, random_state=42).reset_index(drop=True)
    else:
        # Take a representative slice of 45 records for the chosen scenario
        sample_slice = df.head(45).sample(frac=1, random_state=42).reset_index(drop=True)

    result = execute_detection_pipeline(sample_slice, is_demo=True)
    result['scenario'] = scenario
    return jsonify(result), 200

def execute_detection_pipeline(df: pd.DataFrame, is_demo=False):
    total_records = len(df)
    
    # 1. ML Prediction (Chunked if massive, e.g. 10 Lakhs / 1,000,000 rows)
    if total_records > 20000:
        chunk_size = 20000
        ml_results = []
        for start_idx in range(0, total_records, chunk_size):
            chunk = df.iloc[start_idx : start_idx + chunk_size]
            ml_results.extend(predictor.predict_dataframe(chunk))
    else:
        ml_results = predictor.predict_dataframe(df)

    # 2. Graph Structural Risk Analysis
    # If massive dataset (>5,000 records), analyze on unique IP flow graph / anomaly sample to prevent OOM
    if total_records > 5000:
        # Prioritize attack candidates and unique IP flows for topological centrality
        attack_candidates = [r for r in ml_results if r.get('is_attack') == 1]
        sample_subset = (attack_candidates[:3000] + ml_results[:2000]) if attack_candidates else ml_results[:5000]
        graph_results = graph_analyzer.evaluate_graph_risk(sample_subset)
        # Apply baseline graph risk to remaining records
        avg_graph_risk = 0.25
        fused_results = fusion_engine.fuse_records(graph_results)
    else:
        graph_results = graph_analyzer.evaluate_graph_risk(ml_results)
        fused_results = fusion_engine.fuse_records(graph_results)

    # 3. Generate summary stats across the entire dataset
    # Total attack count from ML results
    attack_count = sum(1 for r in ml_results if r.get('is_attack') == 1)
    normal_count = total_records - attack_count
    
    attack_records = [r for r in fused_results if r['is_attack'] == 1]
    attack_types_found = list(set(r['attack_type'] for r in ml_results if r.get('is_attack') == 1))
    if not attack_types_found and attack_records:
        attack_types_found = list(set(r['attack_type'] for r in attack_records))
    
    highest_risk_score = max([r['final_risk_score'] for r in fused_results]) if fused_results else 0.0
    highest_severity = fusion_engine.get_severity_label(highest_risk_score)
    avg_confidence = round(sum(r['ml_confidence'] for r in ml_results[:10000]) / max(1, min(total_records, 10000)) * 100, 1)

    # 4. Generate explanation for the top critical attack
    top_threat = None
    if attack_records:
        sorted_attacks = sorted(attack_records, key=lambda x: x['final_risk_score'], reverse=True)
        top_threat = sorted_attacks[0]
        top_explanation = threat_explainer.explain(top_threat)
        top_threat['explanation'] = top_explanation
    else:
        top_explanation = threat_explainer.explain(fused_results[0]) if fused_results else None

    # 5. Persist detection records to SQLite using fast bulk executemany (safe for 10 Lakhs)
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    user_email = _get_current_user_email()
    purge_expired_records(conn=conn, retention_days=365)

    # Store all high-priority threats (up to 2,000) in database via executemany
    records_to_save = attack_records[:2000] if len(attack_records) > 2000 else (attack_records if attack_records else fused_results[:200])
    insert_rows = []
    for rec in records_to_save:
        exp_json = json.dumps(rec.get('explanation', top_explanation if rec.get('is_attack') else {}))
        insert_rows.append((
            now_str,
            rec['source_ip'],
            rec['destination_ip'],
            rec.get('protocol', 'tcp'),
            rec.get('service', 'http'),
            rec['attack_type'],
            rec['is_attack'],
            rec['ml_confidence'],
            rec['graph_risk'],
            rec['final_risk_score'],
            rec['severity'],
            f"Detected {rec['attack_type']} traffic with fused risk {rec['final_risk_score']}",
            exp_json,
            user_email
        ))

    if insert_rows:
        cursor.executemany('''
            INSERT INTO detections (
                timestamp, source_ip, destination_ip, protocol, service,
                attack_type, is_attack, ml_confidence, graph_risk,
                final_risk_score, severity, details, explanation_json, user_email
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', insert_rows)

    conn.commit()
    conn.close()

    return {
        'success': True,
        'summary': {
            'total_records': total_records,
            'attack_records': attack_count,
            'normal_records': normal_count,
            'attack_types': attack_types_found,
            'detection_rate': round((attack_count / max(1, total_records)) * 100, 1),
            'average_confidence': avg_confidence,
            'highest_risk_score': highest_risk_score,
            'highest_severity': highest_severity,
            'is_demo': is_demo
        },
        'top_threat': top_threat,
        'records': fused_results[:50] # Return up to 50 for fast browser rendering
    }

@detection_bp.route('/api/history', methods=['GET'])
def get_detection_history():
    conn = get_db_connection()
    limit = int(request.args.get('limit', 100))
    search = request.args.get('search', '').strip()
    attack_filter = request.args.get('type', '').strip()
    severity_filter = request.args.get('severity', '').strip()

    query = "SELECT * FROM detections WHERE 1=1"
    params = []

    if search:
        query += " AND (source_ip LIKE ? OR destination_ip LIKE ? OR attack_type LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])

    if attack_filter and attack_filter != 'ALL':
        query += " AND attack_type = ?"
        params.append(attack_filter)

    if severity_filter and severity_filter != 'ALL':
        query += " AND severity = ?"
        params.append(severity_filter)

    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)

    rows = conn.execute(query, params).fetchall()
    conn.close()

    records = []
    for r in rows:
        records.append({
            'id': r['id'],
            'timestamp': str(r['timestamp']),
            'source_ip': r['source_ip'],
            'destination_ip': r['destination_ip'],
            'protocol': r['protocol'],
            'service': r['service'],
            'attack_type': r['attack_type'],
            'is_attack': bool(r['is_attack']),
            'ml_confidence': round(r['ml_confidence'] * 100, 1),
            'graph_risk': round(r['graph_risk'], 2),
            'final_risk_score': round(r['final_risk_score'], 2),
            'severity': r['severity'],
            'details': r['details']
        })

    return jsonify({'records': records, 'total': len(records)}), 200
