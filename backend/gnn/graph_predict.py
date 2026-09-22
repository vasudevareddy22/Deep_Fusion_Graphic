import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import networkx as nx
import numpy as np

class GraphRiskAnalyzer:
    def __init__(self):
        pass

    def evaluate_graph_risk(self, records):
        """
        Analyzes topological traffic patterns and assigns a structural risk score (0.0 - 1.0)
        to each record based on graph-level indicators:
        - Fan-in anomaly (DoS/DDoS targeting single IP)
        - Fan-out anomaly (Reconnaissance/Port Scanning)
        - Degree centrality & communication frequency
        """
        if not records:
            return []

        # Construct temporary multi-edge graph to analyze connection distributions
        G = nx.DiGraph()
        in_degrees = {}
        out_degrees = {}
        pair_counts = {}

        for r in records:
            src = str(r.get('source_ip') or r.get('src_ip', '192.168.1.10'))
            dst = str(r.get('destination_ip') or r.get('dst_ip', '10.0.0.5'))

            out_degrees[src] = out_degrees.get(src, 0) + 1
            in_degrees[dst] = in_degrees.get(dst, 0) + 1
            pair_counts[(src, dst)] = pair_counts.get((src, dst), 0) + 1
            G.add_edge(src, dst)

        # Baseline thresholds for anomaly detection
        max_in = max(in_degrees.values()) if in_degrees else 1
        max_out = max(out_degrees.values()) if out_degrees else 1
        total_records = len(records)

        results = []
        for r in records:
            rec = dict(r)
            src = str(rec.get('source_ip') or rec.get('src_ip', '192.168.1.10'))
            dst = str(rec.get('destination_ip') or rec.get('dst_ip', '10.0.0.5'))

            src_out = out_degrees.get(src, 1)
            dst_in = in_degrees.get(dst, 1)
            pair_cnt = pair_counts.get((src, dst), 1)

            # 1. Fan-in score: high concentration on target server (DoS signal)
            fan_in_ratio = dst_in / max(1, total_records)
            fan_in_score = min(1.0, fan_in_ratio * 1.8)

            # 2. Fan-out score: single source contacting many unique destinations (Probe signal)
            unique_targets = len([target for s, target in pair_counts.keys() if s == src])
            fan_out_score = min(1.0, (unique_targets / max(1, len(in_degrees))) * 2.0)

            # 3. Burst connection frequency
            burst_score = min(1.0, pair_cnt / max(5, total_records * 0.2))

            # Composite graph structural risk
            # Combine indicators with topological weights
            structural_risk = (0.45 * fan_in_score) + (0.35 * fan_out_score) + (0.20 * burst_score)
            
            # Dampen normal low-frequency single connections
            if unique_targets == 1 and pair_cnt <= 2 and dst_in < 5:
                structural_risk = max(0.05, structural_risk * 0.3)
                
            rec['graph_risk'] = round(float(np.clip(structural_risk, 0.02, 0.98)), 4)
            rec['graph_metrics'] = {
                'src_out_degree': src_out,
                'dst_in_degree': dst_in,
                'fan_in_ratio': round(fan_in_ratio, 3),
                'fan_out_unique_targets': unique_targets,
                'pair_connection_count': pair_cnt
            }
            results.append(rec)

        return results

graph_analyzer = GraphRiskAnalyzer()
