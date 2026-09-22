import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder

# Standard column mapping to handle different dataset column conventions
COLUMN_ALIASES = {
    'src_ip': ['source_ip', 'srcip', 'src_addr', 'source', 'src'],
    'dst_ip': ['destination_ip', 'dstip', 'dst_addr', 'destination', 'dst', 'target_ip'],
    'protocol_type': ['protocol', 'proto', 'proto_type'],
    'service': ['srv', 'service_type', 'port_service'],
    'flag': ['status_flag', 'connection_flag'],
    'duration': ['conn_duration', 'time_sec'],
    'src_bytes': ['source_bytes', 'bytes_in', 'sbytes'],
    'dst_bytes': ['dest_bytes', 'bytes_out', 'dbytes'],
    'count': ['connection_count', 'pkt_count'],
    'label': ['class', 'attack', 'attack_type', 'target', 'threat_type']
}

NUMERIC_FEATURES = [
    'duration', 'src_bytes', 'dst_bytes', 'count', 'srv_count',
    'serror_rate', 'same_srv_rate', 'diff_srv_rate',
    'dst_host_count', 'dst_host_srv_count', 'logged_in',
    'num_failed_logins', 'root_shell', 'num_compromised'
]

CATEGORICAL_FEATURES = ['protocol_type', 'service', 'flag']

class CyberDataPreprocessor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.encoders = {}
        self.fitted = False
        self.expected_columns = NUMERIC_FEATURES + CATEGORICAL_FEATURES

    def normalize_column_names(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        # Lowercase and strip whitespace
        rename_map = {}
        curr_cols = {c.lower().strip(): c for c in df.columns}
        
        for std_col, aliases in COLUMN_ALIASES.items():
            if std_col in curr_cols:
                rename_map[curr_cols[std_col]] = std_col
            else:
                for alias in aliases:
                    if alias in curr_cols:
                        rename_map[curr_cols[alias]] = std_col
                        break
        
        return df.rename(columns=rename_map)

    def fill_defaults(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        # Synthetic IP fallback if missing in custom datasets
        if 'src_ip' not in df.columns:
            df['src_ip'] = [f"192.168.1.{10 + (i % 200)}" for i in range(len(df))]
        if 'dst_ip' not in df.columns:
            df['dst_ip'] = [f"10.0.0.{5 if (i % 3 == 0) else (10 + (i % 10))}" for i in range(len(df))]
            
        # Defaults for numeric
        for col in NUMERIC_FEATURES:
            if col not in df.columns:
                df[col] = 0
            else:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
                
        # Defaults for categorical
        for col in CATEGORICAL_FEATURES:
            if col not in df.columns:
                df[col] = 'unknown'
            else:
                df[col] = df[col].astype(str).str.lower().fillna('unknown')
                
        return df

    def fit(self, df: pd.DataFrame):
        df_norm = self.normalize_column_names(df)
        df_filled = self.fill_defaults(df_norm)
        
        # Fit encoders for categorical features
        for col in CATEGORICAL_FEATURES:
            le = LabelEncoder()
            # Add 'unknown' token
            vals = list(df_filled[col].unique())
            if 'unknown' not in vals:
                vals.append('unknown')
            le.fit(vals)
            self.encoders[col] = le
            
        # Fit scaler on numeric features
        self.scaler.fit(df_filled[NUMERIC_FEATURES])
        self.fitted = True
        return self

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        df_norm = self.normalize_column_names(df)
        df_filled = self.fill_defaults(df_norm)
        
        # Scale numerics
        if self.fitted:
            scaled_num = self.scaler.transform(df_filled[NUMERIC_FEATURES])
        else:
            scaled_num = df_filled[NUMERIC_FEATURES].values

        # Encode categoricals
        cat_encoded_list = []
        for col in CATEGORICAL_FEATURES:
            vals = df_filled[col].tolist()
            if col in self.encoders:
                le = self.encoders[col]
                known_classes = set(le.classes_)
                encoded_col = [le.transform([v])[0] if v in known_classes else le.transform(['unknown'])[0] for v in vals]
            else:
                encoded_col = [0] * len(vals)
            cat_encoded_list.append(np.array(encoded_col).reshape(-1, 1))

        encoded_matrix = np.hstack([scaled_num] + cat_encoded_list)
        return encoded_matrix

    def get_feature_names(self):
        return NUMERIC_FEATURES + CATEGORICAL_FEATURES
