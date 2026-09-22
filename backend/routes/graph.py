import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from flask import Blueprint, jsonify, request
from backend.database.db import get_db_connection
from backend.gnn.graph_builder import NetworkGraphBuilder
from backend.gnn.gnn_model import gnn_architecture

graph_bp = Blueprint('graph', __name__)
builder = NetworkGraphBuilder()

@graph_bp.route('/api/graph', methods=['GET'])
def get_network_graph():
    limit = int(request.args.get('limit', 80))
    
    conn = get_db_connection()
    rows = conn.execute('''
        SELECT source_ip, destination_ip, protocol, service, attack_type,
               is_attack, ml_confidence, graph_risk, final_risk_score, severity
        FROM detections
        ORDER BY id DESC
        LIMIT ?
    ''', (limit,)).fetchall()
    conn.close()

    records = [dict(r) for r in rows]
    
    graph_data = builder.build_from_records(records)
    graph_data['gnn_info'] = gnn_architecture.get_architecture_summary()

    return jsonify(graph_data), 200
