import sys
import json
import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from flask import Blueprint, jsonify, request
from backend.database.db import get_db_connection

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    conn = get_db_connection()
    
    # 1. KPIs
    total_events = conn.execute('SELECT COUNT(*) FROM detections').fetchone()[0]
    total_attacks = conn.execute('SELECT COUNT(*) FROM detections WHERE is_attack = 1').fetchone()[0]
    critical_threats = conn.execute("SELECT COUNT(*) FROM detections WHERE severity = 'CRITICAL'").fetchone()[0]
    high_threats = conn.execute("SELECT COUNT(*) FROM detections WHERE severity = 'HIGH'").fetchone()[0]
    normal_traffic = conn.execute('SELECT COUNT(*) FROM detections WHERE is_attack = 0').fetchone()[0]
    
    detection_rate = round((total_attacks / max(1, total_events)) * 100, 1)
    
    # 2. Attack Distribution
    attack_rows = conn.execute('''
        SELECT attack_type, COUNT(*) as count 
        FROM detections 
        GROUP BY attack_type
    ''').fetchall()
    attack_distribution = [{'name': r['attack_type'], 'value': r['count']} for r in attack_rows]

    # 3. Severity Distribution
    sev_rows = conn.execute('''
        SELECT severity, COUNT(*) as count 
        FROM detections 
        GROUP BY severity
    ''').fetchall()
    sev_order = {'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4}
    sev_sorted = sorted([{'name': r['severity'], 'count': r['count']} for r in sev_rows], key=lambda x: sev_order.get(x['name'], 0))

    # 4. Recent Threats (last 10 attacks)
    recent_rows = conn.execute('''
        SELECT id, timestamp, source_ip, destination_ip, protocol, service,
               attack_type, ml_confidence, graph_risk, final_risk_score, severity, details
        FROM detections
        WHERE is_attack = 1
        ORDER BY id DESC
        LIMIT 10
    ''').fetchall()

    recent_threats = []
    for r in recent_rows:
        recent_threats.append({
            'id': r['id'],
            'timestamp': str(r['timestamp']),
            'source_ip': r['source_ip'],
            'destination_ip': r['destination_ip'],
            'protocol': r['protocol'],
            'service': r['service'],
            'attack_type': r['attack_type'],
            'ml_confidence': round(r['ml_confidence'] * 100, 1),
            'graph_risk': round(r['graph_risk'], 2),
            'final_risk_score': round(r['final_risk_score'], 2),
            'severity': r['severity'],
            'details': r['details']
        })

    # 5. Activity Timeline (simulated or grouped by hour)
    timeline_rows = conn.execute('''
        SELECT strftime('%H:00', timestamp) as hour,
               SUM(CASE WHEN is_attack = 1 THEN 1 ELSE 0 END) as attacks,
               SUM(CASE WHEN is_attack = 0 THEN 1 ELSE 0 END) as normal
        FROM detections
        GROUP BY hour
        ORDER BY hour ASC
        LIMIT 12
    ''').fetchall()

    timeline = []
    for r in timeline_rows:
        timeline.append({
            'time': r['hour'] or 'Now',
            'attacks': r['attacks'],
            'normal': r['normal']
        })
    if not timeline:
        timeline = [
            {'time': '10:00', 'attacks': 2, 'normal': 14},
            {'time': '11:00', 'attacks': 5, 'normal': 20},
            {'time': '12:00', 'attacks': 12, 'normal': 18},
            {'time': '13:00', 'attacks': 8, 'normal': 25},
            {'time': '14:00', 'attacks': 19, 'normal': 22},
            {'time': '15:00', 'attacks': 15, 'normal': 28}
        ]

    conn.close()

    return jsonify({
        'kpi': {
            'total_events': total_events,
            'total_attacks': total_attacks,
            'critical_threats': critical_threats,
            'high_threats': high_threats,
            'normal_traffic': normal_traffic,
            'detection_rate': detection_rate
        },
        'attack_distribution': attack_distribution,
        'severity_distribution': sev_sorted,
        'recent_threats': recent_threats,
        'timeline': timeline,
        'system_status': 'PROTECTED',
        'active_defcon': 'DEFCON 4' if critical_threats < 10 else 'DEFCON 2'
    }), 200

@dashboard_bp.route('/api/statistics', methods=['GET'])
def get_statistics():
    conn = get_db_connection()
    total_events = conn.execute('SELECT COUNT(*) FROM detections').fetchone()[0]
    total_attacks = conn.execute('SELECT COUNT(*) FROM detections WHERE is_attack = 1').fetchone()[0]
    
    top_sources = conn.execute('''
        SELECT source_ip, COUNT(*) as incidents, attack_type, MAX(final_risk_score) as max_risk
        FROM detections
        WHERE is_attack = 1
        GROUP BY source_ip
        ORDER BY incidents DESC
        LIMIT 5
    ''').fetchall()
    
    conn.close()

    return jsonify({
        'total_events': total_events,
        'total_attacks': total_attacks,
        'top_attacking_sources': [dict(r) for r in top_sources],
        'model_architecture': {
            'primary_classifier': 'Random Forest Classifier (120 Estimators, Balanced Class Weights)',
            'graph_engine': 'NetworkX Directed Graph + GNN Structural Topological Anomaly Analyzer',
            'fusion_model': 'Adaptive Multi-Modal Threat Fusion (60% ML + 40% Graph Risk)',
            'threat_explainer': 'LLM Augmented SOC Threat Explainer (MITRE ATT&CK Mapping)'
        }
    }), 200


@dashboard_bp.route('/api/calendar', methods=['GET'])
def get_calendar():
    """Return per-day event/attack counts for a given year+month."""
    try:
        year = int(request.args.get('year', datetime.datetime.now().year))
        month = int(request.args.get('month', datetime.datetime.now().month))
    except ValueError:
        return jsonify({'error': 'Invalid year/month'}), 400

    conn = get_db_connection()
    rows = conn.execute('''
        SELECT
            strftime('%Y-%m-%d', timestamp) as day,
            COUNT(*) as total,
            SUM(CASE WHEN is_attack = 1 THEN 1 ELSE 0 END) as attacks,
            SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical
        FROM detections
        WHERE strftime('%Y', timestamp) = ? AND strftime('%m', timestamp) = ?
        GROUP BY day
        ORDER BY day ASC
    ''', (str(year), f'{month:02d}')).fetchall()
    conn.close()

    data = {}
    for r in rows:
        data[r['day']] = {
            'total': r['total'],
            'attacks': r['attacks'],
            'critical': r['critical']
        }
    return jsonify({'year': year, 'month': month, 'days': data}), 200


@dashboard_bp.route('/api/chart-data', methods=['GET'])
def get_chart_data():
    """Return time-series data for charts based on period (day/week/month/year)."""
    period = request.args.get('period', 'week')
    date_str = request.args.get('date', datetime.datetime.now().strftime('%Y-%m-%d'))

    try:
        anchor = datetime.datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError:
        anchor = datetime.datetime.now()

    conn = get_db_connection()
    series = []

    if period == 'day':
        # Hourly breakdown for anchor date
        rows = conn.execute('''
            SELECT strftime('%H', timestamp) as slot,
                   COUNT(*) as total,
                   SUM(CASE WHEN is_attack = 1 THEN 1 ELSE 0 END) as attacks,
                   SUM(CASE WHEN is_attack = 0 THEN 1 ELSE 0 END) as normal
            FROM detections
            WHERE strftime('%Y-%m-%d', timestamp) = ?
            GROUP BY slot ORDER BY slot ASC
        ''', (anchor.strftime('%Y-%m-%d'),)).fetchall()
        series = [{'label': f"{r['slot']}:00", 'total': r['total'], 'attacks': r['attacks'], 'normal': r['normal']} for r in rows]

    elif period == 'week':
        # Daily breakdown for 7 days ending at anchor
        for i in range(6, -1, -1):
            d = (anchor - datetime.timedelta(days=i)).strftime('%Y-%m-%d')
            r = conn.execute('''
                SELECT COUNT(*) as total,
                       SUM(CASE WHEN is_attack = 1 THEN 1 ELSE 0 END) as attacks,
                       SUM(CASE WHEN is_attack = 0 THEN 1 ELSE 0 END) as normal
                FROM detections WHERE strftime('%Y-%m-%d', timestamp) = ?
            ''', (d,)).fetchone()
            label = (anchor - datetime.timedelta(days=i)).strftime('%a %d')
            series.append({'label': label, 'total': r['total'] or 0, 'attacks': r['attacks'] or 0, 'normal': r['normal'] or 0})

    elif period == 'month':
        # Daily breakdown for the calendar month of anchor
        y, m = anchor.year, anchor.month
        rows = conn.execute('''
            SELECT strftime('%d', timestamp) as day,
                   COUNT(*) as total,
                   SUM(CASE WHEN is_attack = 1 THEN 1 ELSE 0 END) as attacks,
                   SUM(CASE WHEN is_attack = 0 THEN 1 ELSE 0 END) as normal
            FROM detections
            WHERE strftime('%Y', timestamp) = ? AND strftime('%m', timestamp) = ?
            GROUP BY day ORDER BY day ASC
        ''', (str(y), f'{m:02d}')).fetchall()
        series = [{'label': f"Day {r['day']}", 'total': r['total'], 'attacks': r['attacks'], 'normal': r['normal']} for r in rows]

    elif period == 'year':
        # Monthly breakdown for anchor year
        for mo in range(1, 13):
            r = conn.execute('''
                SELECT COUNT(*) as total,
                       SUM(CASE WHEN is_attack = 1 THEN 1 ELSE 0 END) as attacks,
                       SUM(CASE WHEN is_attack = 0 THEN 1 ELSE 0 END) as normal
                FROM detections
                WHERE strftime('%Y', timestamp) = ? AND strftime('%m', timestamp) = ?
            ''', (str(anchor.year), f'{mo:02d}')).fetchone()
            mo_name = datetime.date(anchor.year, mo, 1).strftime('%b')
            series.append({'label': mo_name, 'total': r['total'] or 0, 'attacks': r['attacks'] or 0, 'normal': r['normal'] or 0})

    conn.close()
    return jsonify({'period': period, 'date': date_str, 'series': series}), 200
