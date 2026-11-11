import sys
from pathlib import Path
from flask import Blueprint, request, jsonify

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.services.live_sniffer import live_sniffer

live_bp = Blueprint('live', __name__)

@live_bp.route('/api/live/status', methods=['GET'])
@live_bp.route('/live/status', methods=['GET'])
def get_live_status():
    """Returns real-time host network sniffer state and packet counters."""
    try:
        status = live_sniffer.get_status()
        return jsonify({'success': True, 'status': status}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@live_bp.route('/api/live/start', methods=['POST'])
@live_bp.route('/live/start', methods=['POST'])
def start_live_sniffer():
    """Activates the background live host network sniffer."""
    try:
        data = request.get_json(silent=True) or {}
        interval = float(data.get('interval', 2.0))
        started = live_sniffer.start(interval=interval)
        return jsonify({
            'success': True,
            'started': started,
            'message': 'Real-time Live Network Sniffer is running.',
            'status': live_sniffer.get_status()
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@live_bp.route('/api/live/stop', methods=['POST'])
@live_bp.route('/live/stop', methods=['POST'])
def stop_live_sniffer():
    """Pauses the real-time live host network sniffer."""
    try:
        stopped = live_sniffer.stop()
        return jsonify({
            'success': True,
            'stopped': stopped,
            'message': 'Real-time Live Network Sniffer paused.',
            'status': live_sniffer.get_status()
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@live_bp.route('/api/live/feed', methods=['GET'])
@live_bp.route('/live/feed', methods=['GET'])
def get_live_feed():
    """Returns the latest live inspected network connections and threat classifications."""
    try:
        limit = int(request.args.get('limit', 50))
        threat_only = request.args.get('threat_only', 'false').lower() == 'true'
        records = live_sniffer.get_live_records(limit=limit, threat_only=threat_only)
        status = live_sniffer.get_status()

        return jsonify({
            'success': True,
            'total': len(records),
            'records': records,
            'status': status
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@live_bp.route('/api/live/inject', methods=['POST'])
@live_bp.route('/live/inject', methods=['POST'])
def inject_test_traffic():
    """Simulates an active attack (DoS, Probe, R2L, U2R) against the host to verify live detection."""
    try:
        data = request.get_json(silent=True) or {}
        attack_type = data.get('attack_type', 'DoS')
        threat = live_sniffer.inject_test_attack(attack_type=attack_type)

        return jsonify({
            'success': True,
            'message': f"Injected live {attack_type} test attack into host network monitor.",
            'threat': threat,
            'status': live_sniffer.get_status()
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
