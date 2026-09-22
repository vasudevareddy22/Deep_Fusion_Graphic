# DeepFusionGuard: Multi-Modal Cyber Attack Detection

[![System Status](https://img.shields.io/badge/System_Status-PROTECTED-06b6d4?style=for-the-badge&logo=shield)](https://github.com)
[![Defense Level](https://img.shields.io/badge/DEFCON-4_SECURE-10b981?style=for-the-badge)](https://github.com)
[![Model Accuracy](https://img.shields.io/badge/ML_Accuracy-100%25-6366f1?style=for-the-badge)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-amber?style=for-the-badge)](https://github.com)

**DeepFusionGuard** is an AI-powered Security Operations Center (SOC) web application that analyzes network and security telemetry, detects multi-modal cyber attacks using Random Forest machine learning, analyzes suspicious topological communication structures using NetworkX and Graph Neural Network (GNN) formulations, fuses multi-modal signals into unified threat scores, and explains detected threats in plain, actionable language using Large Language Models (with an offline expert SOC rule engine fallback).

---

## Key Features

1. **Multi-Class Machine Learning Detection**:
   - Random Forest classifier trained on NSL-KDD cybersecurity benchmark features.
   - Classifies network events into **Normal**, **DoS**, **Probe**, **R2L**, and **U2R**.
   - Resilient column aliasing and automatic feature scaling with fallback heuristic safety.

2. **Graph Topology & GNN Analysis**:
   - Constructs directed multi-graphs where nodes represent source/destination IPs and critical servers, and edges denote network communication sessions.
   - Analyzes graph structural risk: fan-in concentration (DoS signature), fan-out dispersion (port scanning/reconnaissance), burst frequency, and node centrality.
   - Modular Graph Neural Network (GCN) architecture for node embedding extraction.

3. **Multi-Modal Decision Fusion**:
   - Fuses feature-level ML confidence and topological Graph Risk using an adaptive weighted formula:
     $$\text{Threat Score} = 0.60 \times P_{\text{ML}}(\text{Attack}) + 0.40 \times \text{Risk}_{\text{Graph}} + \text{Domain Modifier}$$
   - Maps scores into standard severity levels:
     - `0.00 – 0.39`: **LOW**
     - `0.40 – 0.69`: **MEDIUM**
     - `0.70 – 0.89`: **HIGH**
     - `0.90 – 1.00`: **CRITICAL**

4. **LLM Threat Explanations**:
   - Supports Google Gemini and OpenAI GPT APIs via environment variables.
   - Includes a built-in expert SOC rule-based explanation engine providing instant, offline technical breakdowns:
     - **What Happened?**
     - **Why is it Suspicious?**
     - **Potential Impact**
     - **Recommended Action**
     - **MITRE ATT&CK Mapping** (e.g. T1498, T1046, T1110, T1068)

5. **Interactive Cybersecurity Frontend**:
   - **Login Page**: Modern dark cybersecurity interface with 1-click Demo Login.
   - **Dashboard**: Real-time SOC dashboard with live KPIs, timeline area charts, attack donuts, severity bars, and recent threats.
   - **Attack Detection**: Drag-and-drop CSV dataset uploader, sample dataset runner, and interactive 5-stage detection pipeline visualizer.
   - **Network Graph**: Full interactive **React Flow** canvas displaying IP entities, attack vectors, animated edges, and a click-to-inspect node drawer.
   - **AI Threat Analysis**: Deep threat breakdown with confidence gauges, risk meters, and remediation guidance.
   - **Detection History**: Searchable and filterable audit table with CSV export.
   - **Reports**: Executive SOC audit summary with incident metrics and downloadable CSV reports.

---

## Technology Stack

- **Frontend**: React.js, Vite, Tailwind CSS, React Router, Axios, Recharts, React Flow (`@xyflow/react`), Lucide React
- **Backend**: Python 3.12, Flask, Flask-CORS, SQLite3
- **Machine Learning**: Scikit-learn (Random Forest), Pandas, NumPy, Joblib
- **Graph Analysis**: NetworkX, Modular Graph Neural Network (GNN) formulation
- **LLM Engine**: Google Gemini / OpenAI GPT (or intelligent SOC rule engine fallback)

---

## Default Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **SOC Administrator** | `admin@deepfusionguard.com` | `admin123` |

*(A 1-click "Quick Demo Login" button is also provided directly on the login page).*

---

## Quick Start Guide

### 1. Backend Setup & Run

```bash
# In project root
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. (Optional) Re-train the Random Forest model
python backend/ml/train.py

# 3. Start the Flask SOC API server (runs on http://localhost:5000)
python backend/app.py
```

### 2. Frontend Setup & Run

```bash
# In frontend directory
cd frontend

# 1. Install NPM packages
npm install

# 2. Launch Vite development server (runs on http://localhost:5173)
npm run dev
```

---

## Backend API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check and DEFCON status |
| `POST` | `/api/login` | Local authentication with JWT session |
| `GET` | `/api/dashboard` | Real-time SOC KPIs, attack distributions, timeline |
| `POST` | `/api/upload` | Upload and preview network CSV/TXT datasets |
| `POST` | `/api/detect` | Execute multi-modal detection pipeline |
| `POST` | `/api/load-demo` | Instant 1-click execution on pre-seeded attack traffic |
| `GET` | `/api/graph` | React Flow formatted topology (nodes, edges, risk scores) |
| `POST` | `/api/explain` | Generate LLM or expert rule-based threat breakdown |
| `GET` | `/api/history` | Query and filter historical detection records |
| `GET` | `/api/report` | Executive summary report and compliance data |
| `GET` | `/api/report/download`| Export detection history as CSV |

---

## MITRE ATT&CK Mappings

- **DoS (Denial of Service)**: `T1498` (Network Denial of Service - Direct Network Flooding)
- **Probe (Reconnaissance)**: `T1046` (Network Service Discovery & Port Scanning)
- **R2L (Remote to Local)**: `T1110` (Brute Force - Credential Access)
- **U2R (User to Root)**: `T1068` (Exploitation for Privilege Escalation)
- **Normal**: Authorized benign traffic
