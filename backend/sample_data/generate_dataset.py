import pandas as pd
import numpy as np
import random
from pathlib import Path

def generate_cyber_dataset(num_samples=600, output_file="backend/sample_data/sample_network_traffic.csv"):
    random.seed(42)
    np.random.seed(42)

    rows = []
    
    # Target and Source IP Pools
    servers = ["10.0.0.5", "10.0.0.8", "10.0.0.12", "10.0.0.15", "10.0.0.22", "10.0.0.1"]
    botnet_ips = [f"192.168.1.{100 + i}" for i in range(15)]
    probe_ips = ["192.168.1.201", "192.168.1.202", "172.16.0.99"]
    r2l_ips = ["172.16.0.45", "172.16.0.70", "198.51.100.14"]
    u2r_ips = ["10.0.0.88", "10.0.0.92"]
    normal_ips = [f"192.168.1.{10 + i}" for i in range(30)] + [f"172.16.1.{10 + i}" for i in range(20)]

    # Proportions: Normal 50%, DoS 25%, Probe 15%, R2L 7%, U2R 3%
    classes = ["Normal"] * 300 + ["DoS"] * 150 + ["Probe"] * 90 + ["R2L"] * 42 + ["U2R"] * 18
    random.shuffle(classes)

    for cat in classes:
        if cat == "Normal":
            src_ip = random.choice(normal_ips)
            dst_ip = random.choice(servers)
            proto = random.choice(["tcp", "tcp", "tcp", "udp", "icmp"])
            service = random.choice(["http", "http", "domain", "smtp", "ftp_data", "private"])
            flag = "SF"
            duration = random.randint(0, 15)
            src_bytes = random.randint(150, 4500)
            dst_bytes = random.randint(300, 12000)
            count = random.randint(1, 15)
            srv_count = random.randint(1, 15)
            serror_rate = 0.0
            same_srv_rate = round(random.uniform(0.8, 1.0), 2)
            diff_srv_rate = round(random.uniform(0.0, 0.1), 2)
            dst_host_count = random.randint(5, 50)
            dst_host_srv_count = random.randint(10, 80)
            logged_in = 1 if service in ["http", "smtp", "ftp_data"] else 0
            num_failed_logins = 0
            root_shell = 0
            num_compromised = 0

        elif cat == "DoS":
            src_ip = random.choice(botnet_ips)
            dst_ip = "10.0.0.5" # Concentrated attack on primary web cluster
            proto = "tcp"
            service = random.choice(["http", "private", "eco_i"])
            flag = random.choice(["S0", "S0", "REJ"])
            duration = 0
            src_bytes = random.randint(0, 50)
            dst_bytes = 0
            count = random.randint(150, 511)
            srv_count = random.randint(120, 511)
            serror_rate = round(random.uniform(0.85, 1.0), 2)
            same_srv_rate = round(random.uniform(0.9, 1.0), 2)
            diff_srv_rate = round(random.uniform(0.0, 0.05), 2)
            dst_host_count = 255
            dst_host_srv_count = random.randint(1, 20)
            logged_in = 0
            num_failed_logins = 0
            root_shell = 0
            num_compromised = 0

        elif cat == "Probe":
            src_ip = random.choice(probe_ips)
            dst_ip = random.choice(servers)
            proto = random.choice(["tcp", "icmp", "udp"])
            service = random.choice(["private", "eco_i", "other", "telnet", "finger"])
            flag = random.choice(["RSTR", "REJ", "SH"])
            duration = random.randint(0, 3)
            src_bytes = random.randint(0, 100)
            dst_bytes = 0
            count = random.randint(40, 150)
            srv_count = random.randint(1, 5)
            serror_rate = round(random.uniform(0.1, 0.5), 2)
            same_srv_rate = round(random.uniform(0.0, 0.2), 2)
            diff_srv_rate = round(random.uniform(0.7, 1.0), 2)
            dst_host_count = random.randint(100, 255)
            dst_host_srv_count = random.randint(1, 10)
            logged_in = 0
            num_failed_logins = 0
            root_shell = 0
            num_compromised = 0

        elif cat == "R2L":
            src_ip = random.choice(r2l_ips)
            dst_ip = random.choice(["10.0.0.12", "10.0.0.15"])
            proto = "tcp"
            service = random.choice(["ssh", "ftp", "telnet", "imap"])
            flag = "SF"
            duration = random.randint(10, 120)
            src_bytes = random.randint(120, 800)
            dst_bytes = random.randint(50, 400)
            count = random.randint(1, 10)
            srv_count = random.randint(1, 5)
            serror_rate = 0.0
            same_srv_rate = 1.0
            diff_srv_rate = 0.0
            dst_host_count = random.randint(1, 10)
            dst_host_srv_count = random.randint(1, 10)
            logged_in = random.choice([0, 0, 1])
            num_failed_logins = random.randint(2, 6)
            root_shell = 0
            num_compromised = random.choice([0, 1])

        elif cat == "U2R":
            src_ip = random.choice(u2r_ips)
            dst_ip = "10.0.0.1" # Core Management / Domain Controller
            proto = "tcp"
            service = random.choice(["telnet", "ssh", "private"])
            flag = "SF"
            duration = random.randint(25, 300)
            src_bytes = random.randint(1500, 7000)
            dst_bytes = random.randint(3000, 15000)
            count = random.randint(1, 4)
            srv_count = random.randint(1, 3)
            serror_rate = 0.0
            same_srv_rate = 1.0
            diff_srv_rate = 0.0
            dst_host_count = random.randint(1, 5)
            dst_host_srv_count = random.randint(1, 5)
            logged_in = 1
            num_failed_logins = 0
            root_shell = 1
            num_compromised = random.randint(2, 8)

        row = {
            "src_ip": src_ip,
            "dst_ip": dst_ip,
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
        rows.append(row)

    df = pd.DataFrame(rows)
    Path(output_file).parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_file, index=False)
    print(f"Generated {len(df)} records in {output_file}")
    
    # Also save copy in dataset/
    dataset_copy = Path("dataset/nsl_kdd_subset.csv")
    dataset_copy.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(dataset_copy, index=False)
    print(f"Saved dataset copy to {dataset_copy}")

if __name__ == "__main__":
    generate_cyber_dataset()
