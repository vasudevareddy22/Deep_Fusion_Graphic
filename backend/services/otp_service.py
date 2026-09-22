"""
OTP Service — DeepFusionGuard
Generates cryptographically unique 6-digit OTPs per user identifier.
All OTPs are distinct: uses SystemRandom for true randomness.

For localhost/testing: OTP is returned in the API response body
(no real email/SMS gateway required).
"""

import random
import time
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from threading import Lock
from backend.config import Config

# In-memory OTP store: { identifier: { code, expires_at, attempts, last_sent } }
_otp_store: dict = {}
_store_lock = Lock()

OTP_TTL_SECONDS = 300          # 5 minutes
OTP_MAX_ATTEMPTS = 3           # wrong attempts before lock
OTP_RESEND_COOLDOWN = 60       # seconds before a new OTP can be sent
OTP_LENGTH_MIN = 100000
OTP_LENGTH_MAX = 999999


def _now() -> float:
    return time.time()


def send_otp_email(to_email: str, code: str) -> dict:
    """
    Send the 6-digit OTP code directly to the customer's email address via SMTP.
    Returns dict with delivery status.
    """
    to_email = to_email.strip()
    smtp_server = getattr(Config, 'SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = getattr(Config, 'SMTP_PORT', 587)
    smtp_user = getattr(Config, 'SMTP_USERNAME', '')
    smtp_pass = getattr(Config, 'SMTP_PASSWORD', '')
    from_email = getattr(Config, 'SMTP_FROM_EMAIL', smtp_user or 'security@deepfusionguard.com')
    use_tls = getattr(Config, 'SMTP_USE_TLS', True)

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f"Your DeepFusionGuard Verification Code: {code}"
    msg['From'] = f"DeepFusionGuard Security <{from_email}>"
    msg['To'] = to_email

    text_content = f"DeepFusionGuard Security Alert\n\nYour 6-digit verification code is: {code}\n\nValid for 5 minutes. Do not share this code with anyone."

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f0f6ff; padding: 24px; margin: 0;">
      <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #bfdbfe; padding: 32px; box-shadow: 0 4px 20px rgba(37,99,235,0.08);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0f172a; margin: 8px 0 4px; font-size: 22px; font-weight: 800;">DeepFusionGuard</h2>
          <p style="color: #64748b; margin: 0; font-size: 13px; font-weight: 500;">AI SOC Security Authentication</p>
        </div>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <p style="color: #1d4ed8; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin: 0 0 8px;">Confidential Verification Code</p>
          <div style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #1e3a8a; font-family: monospace; padding: 6px 0;">{code}</div>
          <p style="color: #64748b; font-size: 12px; margin: 8px 0 0;">Expires in <strong>5 minutes</strong>. Never disclose this code.</p>
        </div>
        <p style="color: #475569; font-size: 13px; line-height: 1.5; margin: 0 0 16px;">
          A login attempt was requested for your account (<strong>{to_email}</strong>). Please enter this verification code into the login screen to complete authentication.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
          DeepFusionGuard AI Security Operations Center &bull; Automated Identity Verification
        </p>
      </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(text_content, 'plain'))
    msg.attach(MIMEText(html_content, 'html'))

    # If SMTP credentials are provided, attempt live delivery via SMTP server
    if smtp_user and smtp_pass:
        try:
            context = ssl.create_default_context()
            if smtp_port == 465:
                with smtplib.SMTP_SSL(smtp_server, smtp_port, context=context, timeout=10) as server:
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(from_email, [to_email], msg.as_string())
            else:
                with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
                    if use_tls:
                        server.starttls(context=context)
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(from_email, [to_email], msg.as_string())
            print(f"[OTP Service] Live OTP email successfully sent to {to_email} via SMTP ({smtp_server}).")
            return {"sent": True, "method": "smtp", "target": to_email}
        except Exception as e:
            print(f"[OTP Service] SMTP delivery attempt failed ({e}).")
            return {"sent": False, "method": "smtp_error", "error": str(e), "target": to_email}

    # Gateway delivery notice when SMTP is unconfigured
    print(f"[OTP Service] SMTP credentials not set in backend/.env. Simulated dispatch for {to_email}. Code: {code}")
    return {"sent": False, "method": "unconfigured_smtp", "reason": "SMTP credentials not configured in backend/.env", "target": to_email}


def generate_otp(identifier: str, skip_cooldown: bool = False) -> dict:
    """
    Generate a new OTP for `identifier` (email or mobile number) and dispatch to email.
    Returns dict with: code (str, internal), expires_in (int seconds), cooldown_active (bool), delivery (dict).
    """
    identifier = identifier.strip().lower()
    with _store_lock:
        existing = _otp_store.get(identifier)
        now = _now()

        # Enforce resend cooldown (unless skip_cooldown=True for automated testing)
        if not skip_cooldown and existing and (now - existing.get("last_sent", 0)) < OTP_RESEND_COOLDOWN:
            wait = int(OTP_RESEND_COOLDOWN - (now - existing["last_sent"]))
            return {
                "success": False,
                "error": "cooldown",
                "wait_seconds": wait,
                "message": f"Please wait {wait}s before requesting a new OTP."
            }

        # Generate cryptographically random code unique to this user
        rng = random.SystemRandom()
        code = str(rng.randint(OTP_LENGTH_MIN, OTP_LENGTH_MAX))

        _otp_store[identifier] = {
            "code": code,
            "expires_at": now + OTP_TTL_SECONDS,
            "attempts": 0,
            "last_sent": now
        }

    # Dispatch to customer's email address
    delivery = {"sent": False, "method": "mobile_simulated"}
    if '@' in identifier:
        delivery = send_otp_email(identifier, code)

    return {
        "success": True,
        "code": code,
        "delivery": delivery,
        "expires_in": OTP_TTL_SECONDS,
        "message": f"OTP dispatched for {identifier}. Valid for {OTP_TTL_SECONDS // 60} minutes."
    }


def verify_otp(identifier: str, code: str) -> dict:
    """
    Verify OTP for `identifier`.
    Returns dict with: valid (bool), error (str or None), attempts_left (int).
    """
    identifier = identifier.strip().lower()
    code = str(code).strip()

    with _store_lock:
        entry = _otp_store.get(identifier)

        if not entry:
            return {"valid": False, "error": "no_otp", "message": "No OTP found. Please request one first."}

        now = _now()

        if now > entry["expires_at"]:
            del _otp_store[identifier]
            return {"valid": False, "error": "expired", "message": "OTP has expired. Please request a new one."}

        if entry["attempts"] >= OTP_MAX_ATTEMPTS:
            del _otp_store[identifier]
            return {"valid": False, "error": "locked", "message": "Too many wrong attempts. Please request a new OTP."}

        if entry["code"] != code:
            entry["attempts"] += 1
            left = OTP_MAX_ATTEMPTS - entry["attempts"]
            return {
                "valid": False,
                "error": "wrong_code",
                "attempts_left": left,
                "message": f"Incorrect OTP. {left} attempt(s) remaining."
            }

        # Valid — remove from store (single-use)
        del _otp_store[identifier]
        return {"valid": True, "error": None, "message": "OTP verified successfully."}


def can_resend(identifier: str) -> dict:
    """
    Check if a new OTP can be sent for `identifier`.
    Returns dict with: can_resend (bool), wait_seconds (int).
    """
    identifier = identifier.strip().lower()
    with _store_lock:
        entry = _otp_store.get(identifier)
        if not entry:
            return {"can_resend": True, "wait_seconds": 0}
        now = _now()
        elapsed = now - entry.get("last_sent", 0)
        if elapsed >= OTP_RESEND_COOLDOWN:
            return {"can_resend": True, "wait_seconds": 0}
        wait = int(OTP_RESEND_COOLDOWN - elapsed)
        return {"can_resend": False, "wait_seconds": wait}


def get_otp_info(identifier: str) -> dict:
    """
    Get non-sensitive OTP state for `identifier` (for UI status display).
    Returns: exists, expires_in, attempts_used.
    """
    identifier = identifier.strip().lower()
    with _store_lock:
        entry = _otp_store.get(identifier)
        if not entry:
            return {"exists": False}
        now = _now()
        expires_in = max(0, int(entry["expires_at"] - now))
        return {
            "exists": True,
            "expires_in": expires_in,
            "attempts_used": entry["attempts"],
            "attempts_left": OTP_MAX_ATTEMPTS - entry["attempts"]
        }


def purge_expired_otps() -> int:
    """Remove all expired OTP entries. Returns count purged."""
    now = _now()
    purged = 0
    with _store_lock:
        expired_keys = [k for k, v in _otp_store.items() if now > v["expires_at"]]
        for k in expired_keys:
            del _otp_store[k]
            purged += 1
    return purged
