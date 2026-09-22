import sys
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from flask import Blueprint, request, jsonify
from backend.database.db import get_db_connection
from backend.llm.explain import threat_explainer

explain_bp = Blueprint('explain', __name__)

@explain_bp.route('/api/explain', methods=['POST'])
def explain_threat():
    data = request.get_json() or {}
    detection_id = data.get('detection_id')

    if detection_id:
        conn = get_db_connection()
        row = conn.execute('SELECT * FROM detections WHERE id = ?', (detection_id,)).fetchone()
        conn.close()

        if row:
            threat_payload = {
                'attack_type': row['attack_type'],
                'ml_confidence': row['ml_confidence'],
                'graph_risk': row['graph_risk'],
                'final_risk_score': row['final_risk_score'],
                'severity': row['severity'],
                'source_ip': row['source_ip'],
                'destination_ip': row['destination_ip'],
                'protocol': row['protocol'],
                'service': row['service']
            }
            explanation = threat_explainer.explain(threat_payload)
            return jsonify({'success': True, 'explanation': explanation, 'incident': threat_payload}), 200

    # If payload passed directly
    if 'attack_type' in data:
        explanation = threat_explainer.explain(data)
        return jsonify({'success': True, 'explanation': explanation, 'incident': data}), 200

    # Default fallback: fetch latest attack
    conn = get_db_connection()
    row = conn.execute('SELECT * FROM detections WHERE is_attack = 1 ORDER BY id DESC LIMIT 1').fetchone()
    conn.close()

    if row:
        threat_payload = {
            'attack_type': row['attack_type'],
            'ml_confidence': row['ml_confidence'],
            'graph_risk': row['graph_risk'],
            'final_risk_score': row['final_risk_score'],
            'severity': row['severity'],
            'source_ip': row['source_ip'],
            'destination_ip': row['destination_ip'],
            'protocol': row['protocol'],
            'service': row['service']
        }
        explanation = threat_explainer.explain(threat_payload)
        return jsonify({'success': True, 'explanation': explanation, 'incident': threat_payload}), 200

    # Default template
    default_payload = {
        'attack_type': 'DoS',
        'ml_confidence': 0.94,
        'graph_risk': 0.88,
        'final_risk_score': 0.91,
        'severity': 'CRITICAL',
        'source_ip': '192.168.1.105',
        'destination_ip': '10.0.0.5',
        'protocol': 'tcp',
        'service': 'http'
    }
    explanation = threat_explainer.explain(default_payload)
    return jsonify({'success': True, 'explanation': explanation, 'incident': default_payload}), 200
