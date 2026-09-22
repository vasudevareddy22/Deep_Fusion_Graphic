import sys
import json
import random
import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.database.db import get_db_connection

def seed_extensive_history():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Clear existing detections to cleanly repopulate with rich multi-day timeline
    cursor.execute('DELETE FROM detections')

    now = datetime.datetime.now()
    # Anchor to start of today so calendar dates are stable
    today = now.replace(hour=23, minute=59, second=59, microsecond=0)

    servers = ["10.0.0.5", "10.0.0.8", "10.0.0.12", "10.0.0.15", "10.0.0.22", "10.0.0.1"]
    botnet_ips = [f"192.168.1.{100 + i}" for i in range(25)]
    probe_ips = ["192.168.1.201", "192.168.1.202", "192.168.1.205", "172.16.0.99"]
    r2l_ips = ["172.16.0.45", "172.16.0.70", "198.51.100.14", "203.0.113.102"]
    u2r_ips = ["10.0.0.88", "10.0.0.92", "192.168.1.55"]
    normal_ips = [f"192.168.1.{10 + i}" for i in range(40)] + [f"172.16.1.{10 + i}" for i in range(30)]

    events = []

    # Generate 500 events spread across 30 days (today and 29 days back)
    # Weight: more events on recent days via exponential distribution
    TOTAL = 500
    for i in range(TOTAL):
        # Pick a day: exponential bias towards recent days
        day_offset = int(random.expovariate(0.15))  # mean ~6.7 days ago
        day_offset = min(day_offset, 29)             # cap at 30 days
        # Random hour within that day
        hour = random.randint(0, 23)
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        ts_dt = (today - datetime.timedelta(days=day_offset)).replace(
            hour=hour, minute=minute, second=second
        )
        ts = ts_dt.strftime('%Y-%m-%d %H:%M:%S')

        # Attack Distribution: 40% Normal, 32% DoS, 14% Probe, 10% R2L, 4% U2R
        roll = random.random()
        if roll < 0.40:
            cat = "Normal"
            src = random.choice(normal_ips)
            dst = random.choice(servers)
            proto = random.choice(["tcp", "tcp", "udp", "icmp"])
            srv = random.choice(["http", "domain", "smtp", "ftp_data", "ssl", "https"])
            is_atk = 0
            ml_conf = round(random.uniform(0.01, 0.12), 3)
            g_risk = round(random.uniform(0.04, 0.22), 2)
            f_score = round(random.uniform(0.02, 0.25), 2)
            sev = "LOW"
            details = f"Verified benign {proto.upper()}/{srv} transaction."
            exp = {
                "what_happened": f"Authorized network flow between {src} and {dst} over {srv}.",
                "why_suspicious": "Telemetry strictly matches normal operational parameters.",
                "potential_impact": "Zero malicious impact detected.",
                "recommended_action": "Maintain standard telemetry monitoring.",
                "mitre_technique": "None (Authorized Benign Flow)"
            }
        elif roll < 0.72:
            cat = "DoS"
            src = random.choice(botnet_ips)
            dst = "10.0.0.5"
            proto = "tcp"
            srv = random.choice(["http", "private", "api", "https"])
            is_atk = 1
            ml_conf = round(random.uniform(0.92, 0.99), 3)
            g_risk = round(random.uniform(0.82, 0.96), 2)
            f_score = round(random.uniform(0.88, 0.98), 2)
            sev = "CRITICAL" if f_score >= 0.90 else "HIGH"
            details = "Synchronized SYN flood anomaly targeting port 80/443."
            exp = {
                "what_happened": f"Volumetric DoS attack flood targeting web cluster {dst} from bot host {src}.",
                "why_suspicious": f"High fan-in ratio ({g_risk}) and anomalous SYN/error bursts flagged with {int(ml_conf*100)}% ML confidence.",
                "potential_impact": "Web service starvation and potential connection pool exhaustion.",
                "recommended_action": f"Apply rate limiting at border ingress for IP {src} and activate SYN cookies.",
                "mitre_technique": "T1498 (Network Denial of Service)"
            }
        elif roll < 0.86:
            cat = "Probe"
            src = random.choice(probe_ips)
            dst = random.choice(servers)
            proto = random.choice(["tcp", "icmp", "udp"])
            srv = random.choice(["private", "eco_i", "telnet", "finger", "snmp"])
            is_atk = 1
            ml_conf = round(random.uniform(0.84, 0.94), 3)
            g_risk = round(random.uniform(0.68, 0.85), 2)
            f_score = round(random.uniform(0.72, 0.88), 2)
            sev = "HIGH"
            details = "Horizontal port scanning and service probing."
            exp = {
                "what_happened": f"Host {src} scanning ports on internal infrastructure {dst}.",
                "why_suspicious": f"Rapid fan-out reconnaissance across unassigned port listeners (Graph Risk: {g_risk}).",
                "potential_impact": "Exposes vulnerable daemon versions for subsequent targeted exploit attempts.",
                "recommended_action": f"Drop unsolicited traffic from {src} and review border firewall rules.",
                "mitre_technique": "T1046 (Network Service Discovery)"
            }
        elif roll < 0.96:
            cat = "R2L"
            src = random.choice(r2l_ips)
            dst = random.choice(["10.0.0.12", "10.0.0.15", "10.0.0.22"])
            proto = "tcp"
            srv = random.choice(["ssh", "ftp", "telnet", "rdp"])
            is_atk = 1
            ml_conf = round(random.uniform(0.86, 0.95), 3)
            g_risk = round(random.uniform(0.70, 0.86), 2)
            f_score = round(random.uniform(0.78, 0.90), 2)
            sev = "HIGH" if f_score < 0.90 else "CRITICAL"
            details = "Brute-force credential spraying attempt."
            exp = {
                "what_happened": f"Repeated unauthorized authentication bursts against {srv.upper()} on {dst}.",
                "why_suspicious": "Abnormal failure count and anomalous authentication packet headers.",
                "potential_impact": "Unauthorized system logon and potential credential compromise.",
                "recommended_action": f"Lock host {src} in fail2ban and enforce MFA verification.",
                "mitre_technique": "T1110 (Brute Force)"
            }
        else:
            cat = "U2R"
            src = random.choice(u2r_ips)
            dst = "10.0.0.1"
            proto = "tcp"
            srv = "telnet"
            is_atk = 1
            ml_conf = round(random.uniform(0.92, 0.98), 3)
            g_risk = round(random.uniform(0.88, 0.97), 2)
            f_score = round(random.uniform(0.91, 0.99), 2)
            sev = "CRITICAL"
            details = "Local root privilege escalation attempt."
            exp = {
                "what_happened": f"Non-privileged entity {src} attempted kernel buffer overflow on administrative node {dst}.",
                "why_suspicious": "Anomalous root shell execution invocation and memory space corruption.",
                "potential_impact": "Complete administrative node takeover and root credential harvest.",
                "recommended_action": "Sever network session immediately and execute memory forensics.",
                "mitre_technique": "T1068 (Privilege Escalation)"
            }

        events.append((
            ts, src, dst, proto, srv, cat, is_atk, ml_conf, g_risk, f_score, sev, details, json.dumps(exp)
        ))

    # Sort chronologically
    events.sort(key=lambda x: x[0])

    cursor.executemany('''
        INSERT INTO detections (
            timestamp, source_ip, destination_ip, protocol, service,
            attack_type, is_attack, ml_confidence, graph_risk,
            final_risk_score, severity, details, explanation_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', events)

    conn.commit()
    conn.close()
    print(f"[+] Successfully seeded {len(events)} rich historical detection records across 30 days!")

if __name__ == "__main__":
    seed_extensive_history()
