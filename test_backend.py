import sys
from pathlib import Path
import json

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.app import create_app
from backend.database.db import init_db

def test_all():
    print("[*] Initializing test...")
    init_db()
    app = create_app()
    client = app.test_client()

    # 1. Health
    res = client.get('/api/health')
    assert res.status_code == 200, f"Health check failed: {res.data}"
    print("[+] Health check OK:", res.get_json())

    # 2. Login
    res = client.post('/api/login', json={'email': 'admin@deepfusionguard.com', 'password': 'admin123'})
    assert res.status_code == 200, f"Login failed: {res.data}"
    print("[+] Login OK. User:", res.get_json()['user']['name'])

    # 3. Dashboard
    res = client.get('/api/dashboard')
    assert res.status_code == 200, f"Dashboard failed: {res.data}"
    data = res.get_json()
    print(f"[+] Dashboard OK. Total Events: {data['kpi']['total_events']}, Attacks: {data['kpi']['total_attacks']}")

    # 4. Load Demo Data
    res = client.post('/api/load-demo')
    assert res.status_code == 200, f"Load demo failed: {res.data}"
    demo_res = res.get_json()
    print(f"[+] Load Demo OK. Total Records Processed: {demo_res['summary']['total_records']}, Attacks: {demo_res['summary']['attack_records']}")

    # 5. Network Graph
    res = client.get('/api/graph')
    assert res.status_code == 200, f"Graph failed: {res.data}"
    graph_res = res.get_json()
    print(f"[+] Graph OK. Nodes: {len(graph_res['nodes'])}, Edges: {len(graph_res['edges'])}, Suspicious: {graph_res['summary']['suspicious_nodes']}")

    # 6. AI Explanation
    res = client.post('/api/explain', json={})
    assert res.status_code == 200, f"Explain failed: {res.data}"
    exp_res = res.get_json()
    print(f"[+] AI Explanation OK. Technique: {exp_res['explanation']['mitre_technique']}, Engine: {exp_res['explanation']['engine']}")

    # 7. History
    res = client.get('/api/history?limit=10')
    assert res.status_code == 200, f"History failed: {res.data}"
    hist = res.get_json()
    print(f"[+] History OK. Records retrieved: {len(hist['records'])}")

    # 8. Report
    res = client.get('/api/report')
    assert res.status_code == 200, f"Report failed: {res.data}"
    rep = res.get_json()
    print(f"[+] Report OK. ID: {rep['report_id']}")

    print("\n[SUCCESS] ALL BACKEND TESTS PASSED WITH 100% SUCCESS!\n")

if __name__ == '__main__':
    test_all()
