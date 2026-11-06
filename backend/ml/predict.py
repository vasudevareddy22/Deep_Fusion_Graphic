import sys
from pathlib import Path

# Ensure project root is on sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import joblib
import pandas as pd
import numpy as np
from backend.config import Config
from backend.ml.preprocess import CyberDataPreprocessor

class CyberPredictor:
    def __init__(self, model_path=None):
        self.model_path = Path(model_path or Config.MODEL_PATH)
        self.bundle = None
        self.model = None
        self.preprocessor = None
        self.classes = ['Normal', 'DoS', 'Probe', 'R2L', 'U2R']
        self._load_model()

    def _load_model(self):
        if self.model_path.exists():
            try:
                self.bundle = joblib.load(str(self.model_path))
                self.model = self.bundle.get('model')
                self.preprocessor = self.bundle.get('preprocessor')
                self.classes = self.bundle.get('classes', self.classes)
                print(f"[+] Loaded ML model from {self.model_path} with classes: {self.classes}")
            except Exception as e:
                print(f"[!] Warning loading model: {e}. Using fallback heuristic predictor.")
                self.model = None
        else:
            print(f"[*] No trained model found at {self.model_path}. Fallback predictor active.")

    def predict_dataframe(self, df: pd.DataFrame):
        """
        Runs prediction on a DataFrame and returns enriched list of results.
        """
        if df.empty:
            return []

        # If trained model is available
        if self.model is not None and self.preprocessor is not None:
            try:
                X = self.preprocessor.transform(df)
                preds = self.model.predict(X)
                probas = self.model.predict_proba(X)
                
                results = []
                for idx, (_, row) in enumerate(df.iterrows()):
                    pred_label = preds[idx]
                    class_idx = list(self.model.classes_).index(pred_label)
                    confidence = float(probas[idx][class_idx])
                    is_attack = 0 if pred_label == 'Normal' else 1
                    
                    proba_dict = {
                        cls_name: float(probas[idx][c_idx])
                        for c_idx, cls_name in enumerate(self.model.classes_)
                    }
                    
                    src = str(row.get('src_ip') or row.get('source_ip') or f"192.168.1.{10 + (idx % 50)}")
                    dst = str(row.get('dst_ip') or row.get('destination_ip') or "10.0.0.5")
                    proto = str(row.get('protocol_type') or row.get('protocol') or 'tcp')
                    srv = str(row.get('service') or 'http')

                    results.append({
                        'attack_type': str(pred_label),
                        'is_attack': is_attack,
                        'confidence': round(confidence, 4),
                        'ml_confidence': round(confidence, 4),
                        'probabilities': proba_dict,
                        'source_ip': src,
                        'destination_ip': dst,
                        'protocol': proto,
                        'service': srv
                    })
                return results
            except Exception as e:
                print(f"[!] Model prediction failed: {e}. Falling back to rule heuristics.")

        # Heuristic Rule-Based Fallback
        return self._heuristic_predict(df)

    def _heuristic_predict(self, df: pd.DataFrame):
        def _to_float(v, default=0.0):
            try:
                return float(v)
            except (ValueError, TypeError):
                return default

        results = []
        for idx, (_, row) in enumerate(df.iterrows()):
            src_ip = str(row.get('src_ip') or row.get('source_ip') or f"192.168.1.{10 + (idx % 50)}")
            dst_ip = str(row.get('dst_ip') or row.get('destination_ip') or "10.0.0.5")
            proto = str(row.get('protocol_type') or row.get('protocol') or 'tcp')
            service = str(row.get('service') or 'http')
            
            count = _to_float(row.get('count', 0))
            serror = _to_float(row.get('serror_rate', 0.0))
            failed_logins = _to_float(row.get('num_failed_logins', 0))
            root_shell = _to_float(row.get('root_shell', 0))
            diff_srv = _to_float(row.get('diff_srv_rate', 0.0))

            if root_shell > 0:
                label = 'U2R'
                conf = 0.94
            elif failed_logins >= 2:
                label = 'R2L'
                conf = 0.88
            elif count > 100 or serror > 0.5:
                label = 'DoS'
                conf = 0.95
            elif diff_srv > 0.4:
                label = 'Probe'
                conf = 0.86
            else:
                label = 'Normal'
                conf = 0.92

            is_attack = 0 if label == 'Normal' else 1
            probas = {c: (conf if c == label else round((1 - conf) / 4, 3)) for c in self.classes}

            results.append({
                'attack_type': label,
                'is_attack': is_attack,
                'confidence': round(conf, 4),
                'ml_confidence': round(conf, 4),
                'probabilities': probas,
                'source_ip': src_ip,
                'destination_ip': dst_ip,
                'protocol': proto,
                'service': service
            })
        return results

# Global predictor instance
predictor = CyberPredictor()
