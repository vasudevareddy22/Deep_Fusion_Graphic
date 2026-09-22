import requests
import json
import time

BASE_URL = "http://127.0.0.1:5000/api"

def run_e2e_tests():
    print("====================================================")
    print("      DEEPFUSIONGUARD END-TO-END VERIFICATION       ")
    print("====================================================")

    # 1. Health Check
    print("\n[1] Testing GET /api/health...")
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200, f"Health failed: {res.status_code}"
    health = res.json()
    print(f"    -> Status: {health['status']}, Defense Level: {health['defense_level']}")

    # 2. Authentication
    print("\n[2] Testing POST /api/login (Demo Credentials)...")
    res = requests.post(f"{BASE_URL}/login", json={
        "email": "admin@deepfusionguard.com",
        "password": "admin123"
    })
    assert res.status_code == 200, f"Login failed: {res.status_code}"
    auth = res.json()
    token = auth["token"]
    print(f"    -> Auth Success! Token: {token[:25]}..., User: {auth['user']['name']}")

    # 3. Dashboard Data
    print("\n[3] Testing GET /api/dashboard...")
    res = requests.get(f"{BASE_URL}/dashboard")
    assert res.status_code == 200, f"Dashboard failed: {res.status_code}"
    dash = res.json()
    print(f"    -> Total Events: {dash['kpi']['total_events']}, Attacks: {dash['kpi']['total_attacks']}, Detection Rate: {dash['kpi']['detection_rate']}%")

    # 4. Load Demo Data (Full Multi-Modal Pipeline)
    print("\n[4] Testing POST /api/load-demo (Pipeline Execution)...")
    res = requests.post(f"{BASE_URL}/load-demo")
    assert res.status_code == 200, f"Load demo failed: {res.status_code}"
    demo = res.json()
    summary = demo["summary"]
    print(f"    -> Processed {summary['total_records']} records. Attacks: {summary['attack_records']}, Normal: {summary['normal_records']}")
    print(f"    -> Attack Vectors: {summary['attack_types']}")
    print(f"    -> Avg Confidence: {summary['average_confidence']}%, Highest Risk: {summary['highest_risk_score']} ({summary['highest_severity']})")
    if demo.get("top_threat"):
        top = demo["top_threat"]
        print(f"    -> Top Threat: {top['attack_type']} from {top['source_ip']} to {top['destination_ip']} (Risk: {top['final_risk_score']})")

    # 5. Network Graph Data (React Flow format)
    print("\n[5] Testing GET /api/graph...")
    res = requests.get(f"{BASE_URL}/graph?limit=50")
    assert res.status_code == 200, f"Graph failed: {res.status_code}"
    graph = res.json()
    print(f"    -> Graph Nodes: {len(graph['nodes'])}, Edges: {len(graph['edges'])}")
    print(f"    -> Suspicious Nodes Identified: {graph['summary']['suspicious_nodes']}")
    print(f"    -> GNN Model Architecture: {graph['gnn_info']['model_type']} ({graph['gnn_info']['status']})")

    # 6. AI Threat Explanation
    print("\n[6] Testing POST /api/explain (LLM / Expert Rule Engine)...")
    res = requests.post(f"{BASE_URL}/explain", json={
        "attack_type": "DoS",
        "source_ip": "192.168.1.105",
        "destination_ip": "10.0.0.5",
        "protocol": "tcp",
        "service": "http",
        "ml_confidence": 0.96,
        "graph_risk": 0.88,
        "final_risk_score": 0.93,
        "severity": "CRITICAL"
    })
    assert res.status_code == 200, f"Explain failed: {res.status_code}"
    exp = res.json()["explanation"]
    print(f"    -> Reasoning Engine: {exp['engine']}")
    print(f"    -> MITRE Technique: {exp['mitre_technique']}")
    print(f"    -> What happened: {exp['what_happened'][:80]}...")
    print(f"    -> Action: {exp['recommended_action'][:80]}...")

    # 7. File Upload Simulation
    print("\n[7] Testing POST /api/upload (Multipart CSV Ingestion)...")
    csv_sample_path = "backend/sample_data/sample_network_traffic.csv"
    with open(csv_sample_path, "rb") as f:
        res = requests.post(f"{BASE_URL}/upload", files={"file": ("test_traffic.csv", f, "text/csv")})
    assert res.status_code == 200, f"Upload failed: {res.status_code}"
    upload_res = res.json()
    print(f"    -> Upload Success! Saved as: {upload_res['filename']}, Rows: {upload_res['total_rows']}")

    # 8. Detection on Uploaded Dataset
    print("\n[8] Testing POST /api/detect on uploaded dataset...")
    res = requests.post(f"{BASE_URL}/detect", json={"filename": upload_res["filename"]})
    assert res.status_code == 200, f"Detect failed: {res.status_code}"
    detect_res = res.json()
    print(f"    -> Detected: {detect_res['summary']['attack_records']} attacks out of {detect_res['summary']['total_records']} flows.")

    # 9. Detection History Filtering
    print("\n[9] Testing GET /api/history (Filter by Type & Search)...")
    res = requests.get(f"{BASE_URL}/history?type=DoS&limit=5")
    assert res.status_code == 200, f"History failed: {res.status_code}"
    hist = res.json()
    print(f"    -> Filtered DoS history retrieved: {len(hist['records'])} entries.")

    # 10. Audit Report
    print("\n[10] Testing GET /api/report...")
    res = requests.get(f"{BASE_URL}/report")
    assert res.status_code == 200, f"Report failed: {res.status_code}"
    rep = res.json()
    print(f"    -> Report ID: {rep['report_id']}")
    print(f"    -> Compliance: {rep['framework_compliance']['mitre_framework']}")

    # 11. Report CSV Download
    print("\n[11] Testing GET /api/report/download (CSV streaming)...")
    res = requests.get(f"{BASE_URL}/report/download")
    assert res.status_code == 200, f"Report download failed: {res.status_code}"
    assert "text/csv" in res.headers.get("Content-Type", ""), "Response is not CSV"
    print(f"    -> CSV Report download verified ({len(res.content)} bytes).")

    print("\n====================================================")
    print(" [SUCCESS] ALL 11 VERIFICATION STAGES PASSED!")
    print("====================================================")

if __name__ == "__main__":
    run_e2e_tests()
