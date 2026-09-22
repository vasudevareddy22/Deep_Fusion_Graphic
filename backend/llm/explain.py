import os
import json
import requests
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.config import Config

class ThreatExplainer:
    def __init__(self):
        self.provider = Config.LLM_PROVIDER
        self.gemini_key = Config.GEMINI_API_KEY
        self.openai_key = Config.OPENAI_API_KEY

    def explain(self, threat_data: dict) -> dict:
        """
        Generates structured threat explanation using configured LLM API (Gemini/OpenAI),
        or falls back gracefully to the expert SOC rule engine.
        """
        attack_type = threat_data.get('attack_type', 'Normal')
        ml_conf = float(threat_data.get('ml_confidence', 0.5))
        graph_risk = float(threat_data.get('graph_risk', 0.5))
        final_score = float(threat_data.get('final_risk_score', 0.5))
        severity = threat_data.get('severity', 'LOW')
        src_ip = threat_data.get('source_ip', '192.168.1.100')
        dst_ip = threat_data.get('destination_ip', '10.0.0.5')
        protocol = threat_data.get('protocol', 'tcp')
        service = threat_data.get('service', 'http')

        # If Gemini API key is configured
        if self.gemini_key:
            try:
                explanation = self._call_gemini_api(threat_data)
                if explanation:
                    explanation['engine'] = 'Google Gemini AI'
                    return explanation
            except Exception as e:
                print(f"[!] Gemini API explanation call failed: {e}. Falling back to SOC rule engine.")

        # If OpenAI API key is configured
        if self.openai_key:
            try:
                explanation = self._call_openai_api(threat_data)
                if explanation:
                    explanation['engine'] = 'OpenAI GPT'
                    return explanation
            except Exception as e:
                print(f"[!] OpenAI API explanation call failed: {e}. Falling back to SOC rule engine.")

        # Default: Expert Rule-Based SOC Fallback Engine
        explanation = self._generate_rule_based_explanation(threat_data)
        explanation['engine'] = 'DeepFusionGuard SOC Expert Knowledge Base (Local Rule Engine)'
        return explanation

    def _generate_rule_based_explanation(self, data: dict) -> dict:
        attack = data.get('attack_type', 'Normal')
        src = data.get('source_ip', '192.168.1.100')
        dst = data.get('destination_ip', '10.0.0.5')
        proto = data.get('protocol', 'tcp')
        service = data.get('service', 'http')
        conf = int(float(data.get('ml_confidence', 0.85)) * 100)
        g_risk = float(data.get('graph_risk', 0.80))
        final_score = float(data.get('final_risk_score', 0.82))

        if attack == 'DoS':
            return {
                "what_happened": f"A coordinated Denial of Service (DoS) assault was detected targeting server {dst} via {proto.upper()}/{service}.",
                "why_suspicious": f"Traffic patterns demonstrate a sudden abnormal surge in packet volume with high topological fan-in (Graph Risk: {g_risk:.2f}) and an elevated SYN/error rate. The ML classifier identified signature DoS traffic with {conf}% confidence.",
                "potential_impact": f"Target infrastructure {dst} risks resource exhaustion, connection backlog saturation, high CPU latency, and potential service unavailability for legitimate users.",
                "recommended_action": f"1. Apply rate-limiting on border firewall for source {src}.\n2. Activate SYN-cookie protection on host {dst}.\n3. Divert anomalous volumetric bursts through scrubbing center.",
                "mitre_technique": "T1498 (Network Denial of Service - Direct Network Flooding)",
                "confidence": conf,
                "severity": data.get('severity', 'HIGH'),
                "final_threat_score": final_score
            }

        elif attack == 'Probe':
            return {
                "what_happened": f"Network reconnaissance and service probing detected originating from host {src} directed at internal infrastructure.",
                "why_suspicious": f"Host {src} initiated sequential scans across multiple ports and services in rapid bursts (Graph Risk: {g_risk:.2f}). ML model flagged anomalous port-scanning behavior with {conf}% confidence.",
                "potential_impact": "Adversary is performing reconnaissance to map active internal services, uncover software versions, and identify unpatched vulnerabilities for secondary exploitation.",
                "recommended_action": f"1. Drop all unsolicited ingress traffic from IP {src}.\n2. Configure intrusion prevention rules to auto-quarantine scanning hosts.\n3. Audit exposed listening ports on subnet {dst}.",
                "mitre_technique": "T1046 (Network Service Discovery & Port Scanning)",
                "confidence": conf,
                "severity": data.get('severity', 'HIGH'),
                "final_threat_score": final_score
            }

        elif attack == 'R2L':
            return {
                "what_happened": f"Remote-to-Local (R2L) unauthorized access attempt detected targeting service {service.upper()} on destination {dst}.",
                "why_suspicious": f"Repeated unauthorized authentication failures and anomalous payload sizes observed from {src}. ML detection identified remote credential access indicators with {conf}% confidence.",
                "potential_impact": f"Possible unauthorized remote access, credential cracking, or compromise of service account credentials on {dst}.",
                "recommended_action": f"1. Temporarily isolate host {dst} and reset affected service credentials.\n2. Enforce multi-factor authentication (MFA) and lock IP {src}.\n3. Review SSH/FTP authorization logs for suspicious interactive sessions.",
                "mitre_technique": "T1110 (Brute Force - Password Spraying & Credential Access)",
                "confidence": conf,
                "severity": data.get('severity', 'HIGH'),
                "final_threat_score": final_score
            }

        elif attack == 'U2R':
            return {
                "what_happened": f"User-to-Root (U2R) local privilege escalation exploit attempt detected on node {dst}.",
                "why_suspicious": f"Non-privileged session invoked abnormal binary execution, root shell invocation, or buffer overflow patterns. The ML ensemble flagged high-confidence ({conf}%) privilege violation markers.",
                "potential_impact": "Critical threat: Complete host takeover, administrative privilege acquisition, defense evasion, and unauthorized root access to kernel subsystems.",
                "recommended_action": f"1. Immediately revoke active session tokens for {src}.\n2. Isolate node {dst} from the production VLAN.\n3. Run memory forensics and audit su/sudo execution logs for unpatched vulnerability exploitation.",
                "mitre_technique": "T1068 (Exploitation for Privilege Escalation)",
                "confidence": conf,
                "severity": "CRITICAL",
                "final_threat_score": final_score
            }

        else: # Normal
            return {
                "what_happened": f"Standard legitimate communication verified between {src} and {dst} over {proto.upper()}/{service}.",
                "why_suspicious": f"Traffic strictly adheres to standard baseline behaviors: normal payload size, expected handshake flow, and low structural graph risk ({g_risk:.2f}).",
                "potential_impact": "Zero malicious impact detected. Session operational integrity intact.",
                "recommended_action": "No remediation necessary. Continue standard passive telemetry monitoring.",
                "mitre_technique": "None (Authorized Benign Flow)",
                "confidence": conf,
                "severity": "LOW",
                "final_threat_score": final_score
            }

    def _call_gemini_api(self, data: dict) -> dict:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_key}"
        prompt = f"""
You are a senior SOC analyst for DeepFusionGuard. Analyze this cybersecurity telemetry and provide a JSON response with exact keys:
- what_happened: (2 sentences summarizing the attack)
- why_suspicious: (technical explanation referencing ML confidence and graph risk)
- potential_impact: (business and infrastructure risk)
- recommended_action: (concrete numbered triage steps)
- mitre_technique: (MITRE ATT&CK identifier e.g. T1498)

Telemetry Data:
Attack Type: {data.get('attack_type')}
Source IP: {data.get('source_ip')}
Destination IP: {data.get('destination_ip')}
Protocol: {data.get('protocol')}
Service: {data.get('service')}
ML Model Confidence: {data.get('ml_confidence')}
Graph Topological Risk: {data.get('graph_risk')}
Final Fused Risk Score: {data.get('final_risk_score')}
Severity: {data.get('severity')}

Respond strictly with valid JSON only.
"""
        resp = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=8)
        if resp.status_code == 200:
            result = resp.json()
            raw_text = result['candidates'][0]['content']['parts'][0]['text']
            # Clean markdown fences if any
            clean_text = raw_text.replace('```json', '').replace('```', '').strip()
            parsed = json.loads(clean_text)
            parsed['confidence'] = int(float(data.get('ml_confidence', 0.85)) * 100)
            parsed['severity'] = data.get('severity', 'HIGH')
            parsed['final_threat_score'] = float(data.get('final_risk_score', 0.82))
            return parsed
        return None

    def _call_openai_api(self, data: dict) -> dict:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openai_key}",
            "Content-Type": "application/json"
        }
        prompt = f"Analyze network attack: {json.dumps(data)}. Return JSON with keys: what_happened, why_suspicious, potential_impact, recommended_action, mitre_technique."
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "You are a cybersecurity expert. Output JSON only."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3
        }
        resp = requests.post(url, headers=headers, json=payload, timeout=8)
        if resp.status_code == 200:
            res = resp.json()
            content = res['choices'][0]['message']['content'].strip()
            parsed = json.loads(content)
            parsed['confidence'] = int(float(data.get('ml_confidence', 0.85)) * 100)
            parsed['severity'] = data.get('severity', 'HIGH')
            parsed['final_threat_score'] = float(data.get('final_risk_score', 0.82))
            return parsed
        return None

threat_explainer = ThreatExplainer()
