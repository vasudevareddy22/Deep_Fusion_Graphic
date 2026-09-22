import pandas as pd
import numpy as np
import random
from pathlib import Path

def generate_all_datasets():
    random.seed(1337)
    np.random.seed(1337)

    output_dir = Path("backend/sample_data")
    output_dir.mkdir(parents=True, exist_ok=True)
    dataset_dir = Path("dataset")
    dataset_dir.mkdir(parents=True, exist_ok=True)

    # Core Infrastructure IPs
    servers = [
        "10.0.0.5",   # Core Web Application Cluster (Nginx/Apache)
        "10.0.0.8",   # Primary Active Directory & DNS Server
        "10.0.0.12",  # Secure Gateway / Bastion Host (SSH)
        "10.0.0.15",  # Enterprise Backup & FTP Storage
        "10.0.0.22",  # PostgreSQL / MySQL Production DB
        "10.0.0.1",   # Management Core & Gateway Router
        "10.0.0.50",  # API Microservices Gateway
        "10.0.0.60"   # Corporate Mail Server (SMTP)
    ]

    # Threat Actor Pools
    botnet_ips = [f"192.168.1.{100 + i}" for i in range(40)] + [f"198.51.100.{10 + i}" for i in range(25)]
    probe_ips = ["192.168.1.201", "192.168.1.202", "192.168.1.205", "172.16.0.99", "203.0.113.44", "198.51.100.89"]
    r2l_ips = ["172.16.0.45", "172.16.0.70", "172.16.0.88", "198.51.100.14", "198.51.100.77", "203.0.113.102"]
    u2r_ips = ["10.0.0.88", "10.0.0.92", "10.0.0.104", "192.168.1.55"]
    normal_ips = [f"192.168.1.{10 + i}" for i in range(50)] + [f"172.16.1.{10 + i}" for i in range(40)] + [f"10.10.5.{10 + i}" for i in range(30)]

    def make_record(cat, specific_src=None, specific_dst=None):
        if cat == "Normal":
            src = specific_src or random.choice(normal_ips)
            dst = specific_dst or random.choice(servers)
            proto = random.choice(["tcp", "tcp", "tcp", "udp", "icmp"])
            service = random.choice(["http", "http", "domain", "smtp", "ftp_data", "private", "ssl", "api"])
            flag = "SF"
            duration = random.randint(0, 45)
            src_bytes = random.randint(180, 6000)
            dst_bytes = random.randint(400, 18000)
            count = random.randint(1, 15)
            srv_count = random.randint(1, 15)
            serror_rate = 0.0
            same_srv_rate = round(random.uniform(0.85, 1.0), 2)
            diff_srv_rate = round(random.uniform(0.0, 0.1), 2)
            dst_host_count = random.randint(5, 60)
            dst_host_srv_count = random.randint(15, 100)
            logged_in = 1 if service in ["http", "smtp", "ftp_data", "ssl", "api"] else 0
            num_failed_logins = 0
            root_shell = 0
            num_compromised = 0

        elif cat == "DoS":
            src = specific_src or random.choice(botnet_ips)
            dst = specific_dst or "10.0.0.5" # Concentrated attack on primary web server
            proto = random.choice(["tcp", "tcp", "icmp"])
            service = random.choice(["http", "private", "eco_i", "api"])
            flag = random.choice(["S0", "S0", "REJ", "RSTO"])
            duration = 0
            src_bytes = random.randint(0, 64)
            dst_bytes = 0
            count = random.randint(180, 511)
            srv_count = random.randint(150, 511)
            serror_rate = round(random.uniform(0.88, 1.0), 2)
            same_srv_rate = round(random.uniform(0.92, 1.0), 2)
            diff_srv_rate = round(random.uniform(0.0, 0.04), 2)
            dst_host_count = 255
            dst_host_srv_count = random.randint(1, 15)
            logged_in = 0
            num_failed_logins = 0
            root_shell = 0
            num_compromised = 0

        elif cat == "Probe":
            src = specific_src or random.choice(probe_ips)
            dst = specific_dst or random.choice(servers)
            proto = random.choice(["tcp", "icmp", "udp"])
            service = random.choice(["private", "eco_i", "other", "telnet", "finger", "ssh", "domain"])
            flag = random.choice(["RSTR", "REJ", "SH", "RSTO"])
            duration = random.randint(0, 4)
            src_bytes = random.randint(0, 120)
            dst_bytes = 0
            count = random.randint(35, 180)
            srv_count = random.randint(1, 4)
            serror_rate = round(random.uniform(0.15, 0.6), 2)
            same_srv_rate = round(random.uniform(0.0, 0.25), 2)
            diff_srv_rate = round(random.uniform(0.65, 1.0), 2)
            dst_host_count = random.randint(120, 255)
            dst_host_srv_count = random.randint(1, 8)
            logged_in = 0
            num_failed_logins = 0
            root_shell = 0
            num_compromised = 0

        elif cat == "R2L":
            src = specific_src or random.choice(r2l_ips)
            dst = specific_dst or random.choice(["10.0.0.12", "10.0.0.15", "10.0.0.22"])
            proto = "tcp"
            service = random.choice(["ssh", "ftp", "telnet", "imap", "smtp"])
            flag = "SF"
            duration = random.randint(15, 180)
            src_bytes = random.randint(150, 950)
            dst_bytes = random.randint(60, 550)
            count = random.randint(1, 12)
            srv_count = random.randint(1, 6)
            serror_rate = 0.0
            same_srv_rate = 1.0
            diff_srv_rate = 0.0
            dst_host_count = random.randint(1, 15)
            dst_host_srv_count = random.randint(1, 15)
            logged_in = random.choice([0, 0, 0, 1])
            num_failed_logins = random.randint(3, 8)
            root_shell = 0
            num_compromised = random.choice([0, 1, 2])

        elif cat == "U2R":
            src = specific_src or random.choice(u2r_ips)
            dst = specific_dst or "10.0.0.1" # Core Management / Domain Controller
            proto = "tcp"
            service = random.choice(["telnet", "ssh", "private"])
            flag = "SF"
            duration = random.randint(35, 450)
            src_bytes = random.randint(2200, 9500)
            dst_bytes = random.randint(4500, 24000)
            count = random.randint(1, 5)
            srv_count = random.randint(1, 3)
            serror_rate = 0.0
            same_srv_rate = 1.0
            diff_srv_rate = 0.0
            dst_host_count = random.randint(1, 6)
            dst_host_srv_count = random.randint(1, 6)
            logged_in = 1
            num_failed_logins = 0
            root_shell = 1
            num_compromised = random.randint(3, 12)

        return {
            "src_ip": src,
            "dst_ip": dst,
            "duration": duration,
            "protocol_type": proto,
            "service": service,
            "flag": flag,
            "src_bytes": src_bytes,
            "dst_bytes": dst_bytes,
            "count": count,
            "srv_count": srv_count,
            "serror_rate": serror_rate,
            "same_srv_rate": same_srv_rate,
            "diff_srv_rate": diff_srv_rate,
            "dst_host_count": dst_host_count,
            "dst_host_srv_count": dst_host_srv_count,
            "logged_in": logged_in,
            "num_failed_logins": num_failed_logins,
            "root_shell": root_shell,
            "num_compromised": num_compromised,
            "label": cat
        }

    # 1. Primary Full Dataset (1,500 samples: 50% Normal, 25% DoS, 13% Probe, 8% R2L, 4% U2R)
    primary_classes = ["Normal"] * 750 + ["DoS"] * 375 + ["Probe"] * 195 + ["R2L"] * 120 + ["U2R"] * 60
    random.shuffle(primary_classes)
    primary_rows = [make_record(c) for c in primary_classes]
    df_primary = pd.DataFrame(primary_rows)
    df_primary.to_csv(output_dir / "sample_network_traffic.csv", index=False)
    df_primary.to_csv(dataset_dir / "nsl_kdd_subset.csv", index=False)
    df_primary.to_csv(dataset_dir / "nsl_kdd_full.csv", index=False)
    print(f"[+] Created primary dataset with {len(df_primary)} rows.")

    # 2. Scenario: DDoS Storm (400 samples: 320 DoS SYN floods against 10.0.0.5, 80 Normal)
    ddos_classes = ["DoS"] * 320 + ["Normal"] * 80
    random.shuffle(ddos_classes)
    df_ddos = pd.DataFrame([make_record(c, specific_dst="10.0.0.5") for c in ddos_classes])
    df_ddos.to_csv(output_dir / "scenario_ddos_storm.csv", index=False)
    print(f"[+] Created DDoS Storm scenario with {len(df_ddos)} rows.")

    # 3. Scenario: APT Network Reconnaissance (350 samples: 250 Probes scanning subnets, 100 Normal)
    probe_classes = ["Probe"] * 250 + ["Normal"] * 100
    random.shuffle(probe_classes)
    df_probe = pd.DataFrame([make_record(c) for c in probe_classes])
    df_probe.to_csv(output_dir / "scenario_apt_reconnaissance.csv", index=False)
    print(f"[+] Created APT Recon scenario with {len(df_probe)} rows.")

    # 4. Scenario: Credential Stuffing & R2L Brute Force (300 samples: 200 R2L against SSH/FTP, 100 Normal)
    r2l_classes = ["R2L"] * 200 + ["Normal"] * 100
    random.shuffle(r2l_classes)
    df_r2l = pd.DataFrame([make_record(c) for c in r2l_classes])
    df_r2l.to_csv(output_dir / "scenario_brute_force_r2l.csv", index=False)
    print(f"[+] Created Brute Force scenario with {len(df_r2l)} rows.")

    # 5. Scenario: Privilege Escalation & Host Takeover (200 samples: 80 U2R root-shell exploits, 120 Normal)
    u2r_classes = ["U2R"] * 80 + ["Normal"] * 120
    random.shuffle(u2r_classes)
    df_u2r = pd.DataFrame([make_record(c, specific_dst="10.0.0.1") for c in u2r_classes])
    df_u2r.to_csv(output_dir / "scenario_privilege_escalation.csv", index=False)
    print(f"[+] Created Privilege Escalation scenario with {len(df_u2r)} rows.")

if __name__ == "__main__":
    generate_all_datasets()
