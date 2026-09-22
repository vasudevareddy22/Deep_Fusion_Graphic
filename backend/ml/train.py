import os
import sys
from pathlib import Path

# Ensure project root is on sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

from backend.ml.preprocess import CyberDataPreprocessor
from backend.config import Config

# Standard mapping for NSL-KDD specific sub-attacks to 5 broad classes
ATTACK_MAPPING = {
    'normal': 'Normal',
    # DoS
    'neptune': 'DoS', 'smurf': 'DoS', 'pod': 'DoS', 'teardrop': 'DoS', 'land': 'DoS',
    'back': 'DoS', 'apache2': 'DoS', 'udpstorm': 'DoS', 'processtable': 'DoS', 'mailbomb': 'DoS',
    'dos': 'DoS',
    # Probe
    'ipsweep': 'Probe', 'portsweep': 'Probe', 'nmap': 'Probe', 'satan': 'Probe',
    'saint': 'Probe', 'mscan': 'Probe', 'probe': 'Probe',
    # R2L
    'guess_passwd': 'R2L', 'ftp_write': 'R2L', 'imap': 'R2L', 'phf': 'R2L',
    'multihop': 'R2L', 'warezmaster': 'R2L', 'warezclient': 'R2L', 'spy': 'R2L',
    'xlock': 'R2L', 'xsnoop': 'R2L', 'snmpguess': 'R2L', 'snmpgetattack': 'R2L',
    'httptunnel': 'R2L', 'sendmail': 'R2L', 'named': 'R2L', 'r2l': 'R2L',
    # U2R
    'buffer_overflow': 'U2R', 'loadmodule': 'U2R', 'rootkit': 'U2R', 'perl': 'U2R',
    'sqlattack': 'U2R', 'xterm': 'U2R', 'ps': 'U2R', 'u2r': 'U2R'
}

def map_label(raw_label):
    val = str(raw_label).lower().strip()
    return ATTACK_MAPPING.get(val, 'DoS' if 'dos' in val else ('Probe' if 'probe' in val else 'Normal'))

def train_model(dataset_path=None, model_output_path=None):
    if dataset_path is None:
        dataset_path = Path(Config.SAMPLE_DATA_FOLDER) / "sample_network_traffic.csv"
    if model_output_path is None:
        model_output_path = Path(Config.MODEL_PATH)
        
    print(f"[*] Loading training dataset from: {dataset_path}")
    df = pd.read_csv(dataset_path)
    
    preprocessor = CyberDataPreprocessor()
    df_norm = preprocessor.normalize_column_names(df)
    
    # Clean label
    if 'label' not in df_norm.columns:
        raise ValueError("Dataset must contain a 'label' or 'class' column.")
        
    df_norm['mapped_label'] = df_norm['label'].apply(map_label)
    
    print("[*] Target Class Distribution:")
    print(df_norm['mapped_label'].value_counts())
    
    # Fit and transform features
    print("[*] Fitting preprocessor...")
    preprocessor.fit(df_norm)
    X = preprocessor.transform(df_norm)
    y = df_norm['mapped_label'].values
    
    classes = sorted(list(set(y)))
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )
    
    print(f"[*] Training Random Forest on {len(X_train)} samples with {X.shape[1]} features...")
    clf = RandomForestClassifier(
        n_estimators=120,
        max_depth=16,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    clf.fit(X_train, y_train)
    
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"[+] Model Training Completed. Accuracy: {acc * 100:.2f}%")
    print("\nClassification Report:\n", classification_report(y_test, y_pred, zero_division=0))
    
    # Feature importances
    feat_names = preprocessor.get_feature_names()
    importances = clf.feature_importances_
    feat_imp = sorted(zip(feat_names, importances), key=lambda x: x[1], reverse=True)
    print("[*] Top 5 Key Features:")
    for fn, imp in feat_imp[:5]:
        print(f"    - {fn}: {imp:.4f}")
        
    # Save bundle
    model_output_path.parent.mkdir(parents=True, exist_ok=True)
    bundle = {
        'model': clf,
        'preprocessor': preprocessor,
        'classes': clf.classes_.tolist(),
        'feature_names': feat_names,
        'accuracy': float(acc),
        'top_features': [f[0] for f in feat_imp[:8]]
    }
    joblib.dump(bundle, str(model_output_path))
    print(f"[+] Serialized model artifact saved to: {model_output_path}")
    return bundle

if __name__ == "__main__":
    train_model()
