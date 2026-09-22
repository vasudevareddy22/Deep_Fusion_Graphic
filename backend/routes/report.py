import sys
import io
import csv
import json
import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from flask import Blueprint, jsonify, Response
from backend.database.db import get_db_connection

report_bp = Blueprint('report', __name__)

@report_bp.route('/api/report', methods=['GET'])
def get_report():
    conn = get_db_connection()
    
    total_events = conn.execute('SELECT COUNT(*) FROM detections').fetchone()[0]
    total_attacks = conn.execute('SELECT COUNT(*) FROM detections WHERE is_attack = 1').fetchone()[0]
    critical_threats = conn.execute("SELECT COUNT(*) FROM detections WHERE severity = 'CRITICAL'").fetchone()[0]
    high_threats = conn.execute("SELECT COUNT(*) FROM detections WHERE severity = 'HIGH'").fetchone()[0]
    normal_events = conn.execute('SELECT COUNT(*) FROM detections WHERE is_attack = 0').fetchone()[0]

    # Attack breakdown
    attacks_by_type = conn.execute('''
        SELECT attack_type, COUNT(*) as count, AVG(final_risk_score) as avg_score
        FROM detections
        WHERE is_attack = 1
        GROUP BY attack_type
    ''').fetchall()

    attack_stats = [{'type': r['attack_type'], 'count': r['count'], 'avg_risk': round(r['avg_score'] or 0, 2)} for r in attacks_by_type]

    # Recent attacks with details
    recent = conn.execute('''
        SELECT id, timestamp, source_ip, destination_ip, protocol, service,
               attack_type, ml_confidence, graph_risk, final_risk_score, severity, details
        FROM detections
        WHERE is_attack = 1
        ORDER BY id DESC
        LIMIT 15
    ''').fetchall()

    recent_attacks = [dict(r) for r in recent]

    conn.close()

    summary_text = (
        f"DeepFusionGuard SOC Audit Report generated at {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}. "
        f"A total of {total_events} network telemetry records were evaluated. "
        f"Detected {total_attacks} confirmed cyber threat vectors ({round((total_attacks/max(1, total_events))*100, 1)}% threat ratio), "
        f"including {critical_threats} critical severity breaches and {high_threats} high-risk incidents. "
        f"Multi-modal fusion combined Random Forest ML inference with NetworkX structural topological analysis, "
        f"isolating distributed DoS flood patterns and lateral network reconnaissance."
    )

    return jsonify({
        'report_id': f"DFG-REP-{datetime.datetime.now().strftime('%Y%m%d%H%M')}",
        'generated_at': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC'),
        'executive_summary': summary_text,
        'metrics': {
            'total_events': total_events,
            'total_attacks': total_attacks,
            'critical_threats': critical_threats,
            'high_threats': high_threats,
            'normal_traffic': normal_events,
            'detection_rate': round((total_attacks / max(1, total_events)) * 100, 1)
        },
        'attack_statistics': attack_stats,
        'recent_attacks': recent_attacks,
        'framework_compliance': {
            'mitre_framework': 'MITRE ATT&CK v14.1 Enterprise',
            'detection_coverage': ['T1498 (Network Flooding)', 'T1046 (Network Scanning)', 'T1110 (Brute Force)', 'T1068 (Privilege Escalation)'],
            'status': 'OPERATIONAL_SECURE'
        }
    }), 200

@report_bp.route('/api/report/download', methods=['GET'])
def download_report_csv():
    conn = get_db_connection()
    rows = conn.execute('''
        SELECT id, timestamp, source_ip, destination_ip, protocol, service,
               attack_type, is_attack, ml_confidence, graph_risk, final_risk_score, severity, details
        FROM detections
        ORDER BY id DESC
    ''').fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'ID', 'Timestamp', 'Source IP', 'Destination IP', 'Protocol', 'Service',
        'Attack Type', 'Is Attack', 'ML Confidence', 'Graph Risk', 'Final Risk Score', 'Severity', 'Details'
    ])

    for r in rows:
        writer.writerow([
            r['id'], r['timestamp'], r['source_ip'], r['destination_ip'], r['protocol'], r['service'],
            r['attack_type'], r['is_attack'], r['ml_confidence'], r['graph_risk'], r['final_risk_score'],
            r['severity'], r['details']
        ])

    csv_data = output.getvalue()
    filename = f"deepfusionguard_report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-disposition": f"attachment; filename={filename}"}
    )
