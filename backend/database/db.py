import sys
import sqlite3
import json
import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.config import Config

DB_FILE = Path(Config.DB_PATH)

def get_db_connection():
    conn = sqlite3.connect(str(DB_FILE))
    conn.row_factory = sqlite3.Row
    return conn

def _column_exists(cursor, table: str, column: str) -> bool:
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())

def init_db():
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT DEFAULT 'SOC Analyst',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Add new columns to users if they don't exist (safe migration)
    new_user_cols = [
        ("mobile", "TEXT DEFAULT ''"),
        ("auth_provider", "TEXT DEFAULT 'PASSWORD'"),
        ("organization", "TEXT DEFAULT ''"),
        ("last_login", "TIMESTAMP"),
    ]
    for col, col_def in new_user_cols:
        if not _column_exists(cursor, "users", col):
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {col_def}")

    # Detections table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            source_ip TEXT NOT NULL,
            destination_ip TEXT NOT NULL,
            protocol TEXT DEFAULT 'tcp',
            service TEXT DEFAULT 'http',
            attack_type TEXT NOT NULL,
            is_attack INTEGER DEFAULT 0,
            ml_confidence REAL NOT NULL,
            graph_risk REAL NOT NULL,
            final_risk_score REAL NOT NULL,
            severity TEXT NOT NULL,
            details TEXT,
            explanation_json TEXT
        )
    ''')

    # Add user_email column to detections if not present
    if not _column_exists(cursor, "detections", "user_email"):
        cursor.execute("ALTER TABLE detections ADD COLUMN user_email TEXT DEFAULT ''")

    # Reports table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            total_events INTEGER NOT NULL,
            attacks_detected INTEGER NOT NULL,
            critical_threats INTEGER NOT NULL,
            summary TEXT,
            status TEXT DEFAULT 'COMPLETED'
        )
    ''')

    # Seed Admin User if not present
    cursor.execute('SELECT id FROM users WHERE email = ?', ('admin@deepfusionguard.com',))
    if not cursor.fetchone():
        cursor.execute(
            'INSERT INTO users (email, password, name, role, auth_provider) VALUES (?, ?, ?, ?, ?)',
            ('admin@deepfusionguard.com', 'admin123', 'SOC Chief Commander', 'Administrator', 'PASSWORD')
        )

    # Seed realistic initial detection records if empty
    cursor.execute('SELECT COUNT(*) as count FROM detections')
    count = cursor.fetchone()['count']
    if count == 0:
        seed_initial_detections(cursor)

    # Seed initial sample report if empty
    cursor.execute('SELECT COUNT(*) as count FROM reports')
    rep_count = cursor.fetchone()['count']
    if rep_count == 0:
        cursor.execute('''
            INSERT INTO reports (title, total_events, attacks_detected, critical_threats, summary)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            "Automated Perimeter Security Audit - Cycle 442",
            124,
            47,
            16,
            "DeepFusionGuard detected distributed DoS synchronization against core web clusters (10.0.0.5) coupled with persistent lateral port probes from subnet 192.168.1.0/24. Immediate IP filtering applied."
        ))

    conn.commit()

    # Auto-purge records older than 365 days on startup
    purge_expired_records(conn=conn, retention_days=365)

    conn.close()


def purge_expired_records(conn=None, retention_days: int = 365) -> int:
    """
    Delete detection records older than `retention_days` days.
    Implements the 1-year auto-retention policy.
    Returns the number of records deleted.
    """
    close_after = False
    if conn is None:
        conn = get_db_connection()
        close_after = True

    cutoff = (datetime.datetime.now() - datetime.timedelta(days=retention_days)).strftime('%Y-%m-%d %H:%M:%S')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM detections WHERE timestamp < ?", (cutoff,))
    deleted = cursor.rowcount
    conn.commit()

    if close_after:
        conn.close()

    if deleted > 0:
        print(f"[DB] Auto-purged {deleted} detection record(s) older than {retention_days} days.")

    return deleted


def seed_initial_detections(cursor):
    base_time = datetime.datetime.now() - datetime.timedelta(hours=6)
    
    seeds = [
        # (src, dst, proto, service, attack_type, is_attack, ml_conf, graph_risk, final_score, severity, minutes_ago, explanation)
        ("192.168.1.105", "10.0.0.5", "tcp", "http", "DoS", 1, 0.96, 0.88, 0.93, "CRITICAL", 5, 
         "Synchronized TCP SYN flood detected targeting port 80/443 web services. Traffic volume exceeded baseline by 450% with high topological fan-in."),
        ("192.168.1.108", "10.0.0.5", "tcp", "http", "DoS", 1, 0.94, 0.85, 0.90, "CRITICAL", 8, 
         "Secondary botnet node participating in coordinated HTTP application layer exhaustion attack."),
        ("192.168.1.112", "10.0.0.5", "tcp", "http", "DoS", 1, 0.92, 0.81, 0.88, "HIGH", 12, 
         "Repeated packet bursts with spoofed sequence numbers directed at core API endpoints."),
        ("172.16.0.45", "10.0.0.12", "tcp", "ssh", "R2L", 1, 0.89, 0.76, 0.84, "HIGH", 25, 
         "Brute-force SSH dictionary attack identified. Rapid repeated authentication attempts with anomalous payload size."),
        ("192.168.1.201", "10.0.0.2", "tcp", "private", "Probe", 1, 0.85, 0.72, 0.80, "HIGH", 35, 
         "Aggressive Nmap SYN stealth scan traversing internal CIDR block attempting service enumeration."),
        ("192.168.1.201", "10.0.0.3", "tcp", "private", "Probe", 1, 0.83, 0.70, 0.78, "HIGH", 37, 
         "Continuous port sweeping behavior targeting ports 21, 22, 80, 445, 3389."),
        ("10.0.0.88", "10.0.0.1", "tcp", "telnet", "U2R", 1, 0.91, 0.93, 0.92, "CRITICAL", 45, 
         "Unauthorized privilege escalation attempt via buffer overflow targeting system administrative daemon."),
        ("192.168.1.15", "10.0.0.5", "tcp", "http", "Normal", 0, 0.05, 0.12, 0.08, "LOW", 50, 
         "Authorized customer HTTPS browsing session conforming to standard TLS handshake parameters."),
        ("192.168.1.22", "10.0.0.8", "udp", "domain", "Normal", 0, 0.02, 0.05, 0.03, "LOW", 55, 
         "Standard DNS lookup query resolved by local gateway resolver."),
        ("172.16.0.70", "10.0.0.15", "tcp", "ftp", "R2L", 1, 0.78, 0.65, 0.73, "HIGH", 70, 
         "FTP anonymous write exploitation attempt targeting backup storage node."),
        ("192.168.1.40", "10.0.0.5", "tcp", "http", "Normal", 0, 0.08, 0.15, 0.11, "LOW", 85, 
         "Regular REST API heartbeat polling from verified microservice."),
        ("192.168.1.201", "10.0.0.4", "tcp", "private", "Probe", 1, 0.82, 0.68, 0.76, "HIGH", 92, 
         "Portsweep reconnaissance probing core database listener."),
        ("192.168.1.60", "10.0.0.5", "tcp", "http", "Normal", 0, 0.03, 0.08, 0.05, "LOW", 110, 
         "Normal static asset delivery from CDN caching node."),
        ("10.0.0.99", "10.0.0.2", "tcp", "smtp", "Normal", 0, 0.04, 0.09, 0.06, "LOW", 125, 
         "Internal mail transfer between recognized corporate mail servers.")
    ]

    for item in seeds:
        src, dst, proto, srv, atype, is_atk, ml_c, g_risk, f_score, sev, m_ago, exp = item
        ts = (datetime.datetime.now() - datetime.timedelta(minutes=m_ago)).strftime('%Y-%m-%d %H:%M:%S')
        exp_data = json.dumps({
            "what_happened": exp,
            "why_suspicious": f"Feature anomaly detected (Confidence {int(ml_c*100)}%) with topological graph risk {g_risk:.2f}.",
            "potential_impact": "Service degradation or potential lateral reconnaissance into sensitive subnets." if is_atk else "No adverse impact detected.",
            "recommended_action": f"Quarantine source node {src} and review firewall ingress rules." if is_atk else "Maintain standard telemetry monitoring.",
            "mitre_technique": "T1498 (Network Denial of Service)" if atype == "DoS" else ("T1046 (Network Service Discovery)" if atype == "Probe" else ("T1110 (Brute Force)" if atype == "R2L" else ("T1068 (Privilege Escalation)" if atype == "U2R" else "N/A")))
        })

        cursor.execute('''
            INSERT INTO detections (
                timestamp, source_ip, destination_ip, protocol, service,
                attack_type, is_attack, ml_confidence, graph_risk,
                final_risk_score, severity, details, explanation_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            ts, src, dst, proto, srv,
            atype, is_atk, ml_c, g_risk,
            f_score, sev, exp, exp_data
        ))
