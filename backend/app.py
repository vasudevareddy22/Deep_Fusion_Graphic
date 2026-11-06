import sys
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from flask import Flask, jsonify
from flask_cors import CORS
from backend.config import Config
from backend.database.db import init_db

# Route blueprints
from backend.routes.auth import auth_bp
from backend.routes.dashboard import dashboard_bp
from backend.routes.detection import detection_bp
from backend.routes.graph import graph_bp
from backend.routes.explain import explain_bp
from backend.routes.report import report_bp

class PathRewriteMiddleware:
    """
    Ensures routes match whether called with /api/... or /...
    This handles Vercel serverless rewrites seamlessly where PATH_INFO might have /api stripped.
    """
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        path = environ.get('PATH_INFO', '')
        if path and not path.startswith('/api'):
            environ['PATH_INFO'] = '/api' + path
        return self.wsgi_app(environ, start_response)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for all routes (Vite frontend on 5173, Vercel preview/production domains)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(detection_bp)
    app.register_blueprint(graph_bp)
    app.register_blueprint(explain_bp)
    app.register_blueprint(report_bp)

    @app.route('/api/health', methods=['GET'])
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'ONLINE',
            'system': 'DeepFusionGuard SOC Engine',
            'version': '1.0.0-prototype',
            'defense_level': 'DEFCON 4'
        }), 200

    @app.route('/api/', methods=['GET'])
    @app.route('/', methods=['GET'])
    def api_root():
        return jsonify({
            'status': 'ONLINE',
            'system': 'DeepFusionGuard SOC Engine',
            'version': '1.0.0',
            'defense_level': 'DEFCON 4 - SECURE',
            'endpoints': [
                '/api/health',
                '/api/dashboard',
                '/api/history',
                '/api/detect',
                '/api/graph',
                '/api/explain',
                '/api/report',
                '/api/auth/send-otp'
            ]
        }), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Endpoint not found'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'error': f'Internal SOC server error: {str(e)}'}), 500

    # Wrap WSGI app with prefix middleware
    app.wsgi_app = PathRewriteMiddleware(app.wsgi_app)
    return app

# Initialize DB tables on startup safely
try:
    init_db()
except Exception as e:
    print(f"[!] Warning during init_db: {e}")

app = create_app()

if __name__ == '__main__':
    print(f"[*] DeepFusionGuard SOC backend starting on port {Config.PORT}...")
    app.run(host='0.0.0.0', port=Config.PORT, debug=False, use_reloader=False)
