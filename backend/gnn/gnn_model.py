"""
DeepFusionGuard: Graph Neural Network (GNN) Architecture Module
--------------------------------------------------------------
This module defines the Graph Neural Network architecture for network entity classification.
In this prototype:
- Active working pipeline uses NetworkX-based topological analysis (in graph_predict.py).
- This module provides the modular PyTorch / NumPy Graph Convolutional Network (GCN) definition
  and mathematical formulation for academic inspection and future trained weights integration.
"""

import numpy as np

class LightweightGCNLayer:
    """
    Lightweight Graph Convolutional Network (GCN) Layer
    Formulation: H^{(l+1)} = ReLU( D_tilde^{-1/2} * A_tilde * D_tilde^{-1/2} * H^{(l)} * W^{(l)} )
    where A_tilde = A + I_N (Adjacency with added self-loops)
          D_tilde = Degree matrix of A_tilde
    """
    def __init__(self, in_features: int, out_features: int, random_state=42):
        rng = np.random.RandomState(random_state)
        # Xavier / Glorot uniform initialization
        limit = np.sqrt(6.0 / (in_features + out_features))
        self.weights = rng.uniform(-limit, limit, (in_features, out_features))
        self.bias = np.zeros(out_features)

    def forward(self, node_features: np.ndarray, adj_matrix: np.ndarray) -> np.ndarray:
        # 1. Add self-loops to Adjacency Matrix
        n_nodes = adj_matrix.shape[0]
        a_tilde = adj_matrix + np.eye(n_nodes)

        # 2. Compute symmetric normalized Laplacian
        row_sum = np.array(a_tilde.sum(axis=1)).flatten()
        d_inv_sqrt = np.power(row_sum, -0.5, where=row_sum > 0)
        d_inv_sqrt[row_sum <= 0] = 0.0
        d_mat_inv_sqrt = np.diag(d_inv_sqrt)

        # Normalized adjacency: D_tilde^{-1/2} * A_tilde * D_tilde^{-1/2}
        norm_adj = d_mat_inv_sqrt @ a_tilde @ d_mat_inv_sqrt

        # 3. Message passing & Feature transformation: A_norm * X * W + b
        support = node_features @ self.weights
        output = norm_adj @ support + self.bias

        # 4. Activation (ReLU)
        return np.maximum(0, output)


class DeepFusionGNN:
    """
    Two-layer GCN for Network Node Embeddings and Node Anomaly Detection.
    Produces low-dimensional latent representations for IPs based on connection graph topology.
    """
    def __init__(self, in_features=6, hidden_dim=16, out_dim=2):
        self.in_features = in_features
        self.hidden_dim = hidden_dim
        self.out_dim = out_dim
        self.layer1 = LightweightGCNLayer(in_features, hidden_dim, random_state=101)
        self.layer2 = LightweightGCNLayer(hidden_dim, out_dim, random_state=202)
        self.status = "MODULAR_PROTOTYPE_READY"

    def extract_node_embeddings(self, node_features: np.ndarray, adj_matrix: np.ndarray):
        """
        Executes 2-hop message passing aggregation across the network graph.
        Returns node embeddings matrix of shape [N, out_dim].
        """
        h1 = self.layer1.forward(node_features, adj_matrix)
        embeddings = self.layer2.forward(h1, adj_matrix)
        return embeddings

    def get_architecture_summary(self):
        return {
            "model_type": "2-Layer Graph Convolutional Network (GCN)",
            "message_passing": "Symmetric normalized Laplacian neighborhood aggregation",
            "layers": [
                {"layer": 1, "in_features": self.in_features, "out_features": self.hidden_dim, "activation": "ReLU"},
                {"layer": 2, "in_features": self.hidden_dim, "out_features": self.out_dim, "activation": "Softmax/Sigmoid ready"}
            ],
            "status": self.status,
            "note": "Modular component ready for deep GNN fine-tuning with PyTorch Geometric."
        }

gnn_architecture = DeepFusionGNN()
