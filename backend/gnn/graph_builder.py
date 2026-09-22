import networkx as nx
import math
import random

class NetworkGraphBuilder:
    def __init__(self):
        self.graph = nx.DiGraph()

    def build_from_records(self, records):
        """
        Builds a NetworkX directed graph from a list of traffic records/dictionaries.
        Computes topology metrics and returns React Flow formatted nodes and edges.
        """
        self.graph.clear()
        
        # Track node statistics
        node_stats = {}

        for rec in records:
            src = str(rec.get('source_ip') or rec.get('src_ip', '192.168.1.10'))
            dst = str(rec.get('destination_ip') or rec.get('dst_ip', '10.0.0.5'))
            proto = str(rec.get('protocol') or rec.get('protocol_type', 'tcp'))
            service = str(rec.get('service', 'http'))
            is_attack = int(rec.get('is_attack', 0))
            attack_type = str(rec.get('attack_type', 'Normal'))
            ml_conf = float(rec.get('ml_confidence') or rec.get('confidence', 0.5))

            # Init node tracking
            for ip in [src, dst]:
                if ip not in node_stats:
                    node_stats[ip] = {
                        'ip': ip,
                        'in_conns': 0,
                        'out_conns': 0,
                        'attack_conns': 0,
                        'total_conns': 0,
                        'attack_types': set(),
                        'role': 'Server' if ip.startswith('10.0.0.') else ('Attacker' if is_attack else 'Host')
                    }

            node_stats[src]['out_conns'] += 1
            node_stats[src]['total_conns'] += 1
            node_stats[dst]['in_conns'] += 1
            node_stats[dst]['total_conns'] += 1

            if is_attack:
                node_stats[src]['attack_conns'] += 1
                node_stats[src]['attack_types'].add(attack_type)
                node_stats[src]['role'] = 'Attacker'
                if node_stats[dst]['role'] == 'Server':
                    node_stats[dst]['role'] = 'Victim Server'

            # Add Edge to NetworkX
            if self.graph.has_edge(src, dst):
                self.graph[src][dst]['weight'] += 1
                self.graph[src][dst]['attacks'] += 1 if is_attack else 0
            else:
                self.graph.add_edge(src, dst, weight=1, protocol=proto, service=service, attacks=1 if is_attack else 0)

        # Compute Graph Centrality
        degree_centrality = nx.degree_centrality(self.graph) if len(self.graph) > 0 else {}
        try:
            pagerank = nx.pagerank(self.graph, alpha=0.85, max_iter=100) if len(self.graph) > 0 else {}
        except Exception:
            pagerank = degree_centrality

        # Format for React Flow
        rf_nodes = []
        rf_edges = []

        # Position nodes using spring layout or circular layout
        if len(self.graph.nodes) > 0:
            layout_pos = nx.spring_layout(self.graph, k=2.0, iterations=50, seed=42)
        else:
            layout_pos = {}

        # Scale coordinates for React Flow viewport (-500 to +500)
        scale_x = 750
        scale_y = 450

        for node_id in self.graph.nodes:
            stats = node_stats.get(node_id, {
                'ip': node_id, 'in_conns': 0, 'out_conns': 0, 'attack_conns': 0, 'total_conns': 1, 'role': 'Host', 'attack_types': set()
            })
            
            # Risk calculation per node
            attack_ratio = stats['attack_conns'] / max(1, stats['total_conns'])
            centrality = degree_centrality.get(node_id, 0.0)
            pr = pagerank.get(node_id, 0.0)
            
            # Heuristic node risk
            if stats['role'] in ['Attacker']:
                node_risk = min(1.0, 0.65 + (attack_ratio * 0.35))
            elif stats['role'] in ['Victim Server']:
                node_risk = min(1.0, 0.45 + (attack_ratio * 0.4))
            else:
                node_risk = round(min(0.35, centrality * 0.5), 3)

            pos = layout_pos.get(node_id, [random.uniform(-1, 1), random.uniform(-1, 1)])
            x_coord = float(pos[0]) * scale_x + 400
            y_coord = float(pos[1]) * scale_y + 300

            node_type = 'attacker' if stats['role'] == 'Attacker' else (
                'victim' if stats['role'] == 'Victim Server' else (
                    'server' if stats['role'] == 'Server' else 'normal'
                )
            )

            rf_nodes.append({
                'id': node_id,
                'type': 'cyberNode',
                'position': {'x': round(x_coord, 1), 'y': round(y_coord, 1)},
                'data': {
                    'label': node_id,
                    'ip': node_id,
                    'role': stats['role'],
                    'nodeType': node_type,
                    'inDegree': stats['in_conns'],
                    'outDegree': stats['out_conns'],
                    'totalConnections': stats['total_conns'],
                    'riskScore': round(node_risk, 3),
                    'isSuspicious': bool(node_risk > 0.50),
                    'pagerank': round(pr, 4),
                    'attacksDetected': list(stats['attack_types'])
                }
            })

        # Edges
        edge_index = 0
        for src, dst, data in self.graph.edges(data=True):
            edge_index += 1
            has_attacks = data.get('attacks', 0) > 0
            rf_edges.append({
                'id': f"e-{src}-{dst}-{edge_index}",
                'source': src,
                'target': dst,
                'animated': has_attacks,
                'style': {
                    'stroke': '#ef4444' if has_attacks else '#06b6d4',
                    'strokeWidth': min(6, 1.5 + math.log2(data.get('weight', 1) + 1)),
                    'strokeDasharray': '5,5' if has_attacks else None
                },
                'data': {
                    'weight': data.get('weight', 1),
                    'protocol': data.get('protocol', 'tcp'),
                    'service': data.get('service', 'http'),
                    'attacks': data.get('attacks', 0)
                }
            })

        return {
            'nodes': rf_nodes,
            'edges': rf_edges,
            'summary': {
                'total_nodes': len(rf_nodes),
                'total_edges': len(rf_edges),
                'suspicious_nodes': sum(1 for n in rf_nodes if n['data']['isSuspicious']),
                'density': round(nx.density(self.graph), 4) if len(self.graph) > 1 else 0.0
            }
        }
