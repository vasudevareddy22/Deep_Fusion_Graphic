import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.config import Config

class ThreatFusionEngine:
    """
    Multi-Modal Threat Fusion Engine
    Combines:
      1. Machine Learning Confidence Score (Feature-level Random Forest)
      2. Graph Structural Risk Score (NetworkX / GNN Topology Analysis)
      3. Attack Vector Domain Severity Multiplier
    Produces:
      - Unified Threat Score [0.0 - 1.0]
      - Categorical Severity: LOW, MEDIUM, HIGH, CRITICAL
    """
    def __init__(self, ml_weight=None, graph_weight=None):
        self.ml_weight = ml_weight if ml_weight is not None else Config.ML_WEIGHT
        self.graph_weight = graph_weight if graph_weight is not None else Config.GRAPH_WEIGHT
        
        # Base severity adjustment factor based on attack impact
        self.attack_severity_weights = {
            'Normal': 0.05,
            'Probe': 0.65,
            'DoS': 0.85,
            'R2L': 0.88,
            'U2R': 0.95
        }

    def fuse(self, ml_confidence: float, graph_risk: float, attack_type: str = 'Normal') -> dict:
        """
        Computes weighted multi-modal fusion score.
        """
        # If ML classified as Normal, scale down score unless graph risk is overwhelmingly high
        if attack_type == 'Normal':
            base_score = (self.ml_weight * (1.0 - ml_confidence)) + (self.graph_weight * graph_risk)
            final_score = min(0.38, base_score * 0.4)
        else:
            # Attack detected: fuse ML confidence and Graph Risk
            combined = (self.ml_weight * ml_confidence) + (self.graph_weight * graph_risk)
            # Factor in attack class baseline
            sev_factor = self.attack_severity_weights.get(attack_type, 0.75)
            final_score = (0.85 * combined) + (0.15 * sev_factor)

        final_score = max(0.01, min(0.99, round(final_score, 3)))
        severity = self.get_severity_label(final_score)

        return {
            'final_threat_score': final_score,
            'severity': severity,
            'ml_confidence': round(ml_confidence, 3),
            'graph_risk': round(graph_risk, 3),
            'attack_type': attack_type,
            'fusion_weights': {
                'ml_weight': self.ml_weight,
                'graph_weight': self.graph_weight
            }
        }

    @staticmethod
    def get_severity_label(score: float) -> str:
        """
        Maps numerical score to standard cybersecurity risk tier.
        0 - 0.39 : LOW
        0.40 - 0.69 : MEDIUM
        0.70 - 0.89 : HIGH
        0.90 - 1.00 : CRITICAL
        """
        if score < 0.40:
            return 'LOW'
        elif score < 0.70:
            return 'MEDIUM'
        elif score < 0.90:
            return 'HIGH'
        else:
            return 'CRITICAL'

    def fuse_records(self, records):
        """
        Enriches a batch of records with fused threat scores and severity levels.
        """
        fused_records = []
        for r in records:
            rec = dict(r)
            ml_conf = float(rec.get('confidence') or rec.get('ml_confidence', 0.5))
            g_risk = float(rec.get('graph_risk', 0.2))
            atk_type = str(rec.get('attack_type', 'Normal'))
            
            fusion_result = self.fuse(ml_conf, g_risk, atk_type)
            rec.update({
                'final_risk_score': fusion_result['final_threat_score'],
                'severity': fusion_result['severity'],
                'ml_confidence': fusion_result['ml_confidence'],
                'graph_risk': fusion_result['graph_risk']
            })
            fused_records.append(rec)
        return fused_records

fusion_engine = ThreatFusionEngine()
