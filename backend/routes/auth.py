import sys
import hashlib
import secrets
import base64
import urllib.parse
from datetime import datetime, timedelta
from pathlib import Path
import requests

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from flask import Blueprint, request, jsonify, send_file, redirect
from backend.config import Config
from backend.database.db import get_db_connection
from backend.services.otp_service import generate_otp, verify_otp
from backend.database.user_excel import (
    log_registration, log_login, user_exists, get_excel_path,
    delete_user_from_excel, delete_users_bulk_from_excel
)

auth_bp = Blueprint('auth', __name__)

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
SUPER_ADMIN_EMAIL = 'vasudevareddyeevuri@gmail.com'

def _is_super_admin(identifier: str) -> bool:
    """Check if identifier matches the master admin email strictly."""
    if not identifier:
        return False
    return identifier.strip().lower() == SUPER_ADMIN_EMAIL.lower()


def _resolve_requester_email() -> str:
    """Identify the email of the user making the request from Bearer token or ?token= param."""
    auth_header = request.headers.get('Authorization', '')
    token = auth_header.replace('Bearer ', '').strip()
    if not token:
        token = request.args.get('token', '').strip()
    if not token:
        return ''
    if token == 'dfg-jwt-session-token-admin-soc-verified':
        return SUPER_ADMIN_EMAIL
    try:
        parts = token.split('-')
        if len(parts) >= 4:
            user_id = parts[3]
            conn = get_db_connection()
            row = conn.execute('SELECT email, mobile FROM users WHERE id = ?', (user_id,)).fetchone()
            conn.close()
            if row:
                return (row['email'] or row['mobile'] or '').strip().lower()
    except Exception:
        pass
    return ''


def _hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode('utf-8')).hexdigest()


def _make_token(user_id, identifier: str) -> str:
    return f"dfg-jwt-session-{user_id}-{hashlib.md5(identifier.encode()).hexdigest()[:8]}"


def _get_or_create_user(conn, identifier: str, name: str, auth_provider: str,
                        role: str = 'Customer', password_hash: str = '',
                        mobile: str = '', organization: str = '') -> dict:
    """Fetch user by email or mobile; create if not found. Enforces admin strictly for Vasudevareddyeevuri@gmail.com."""
    is_mobile = identifier.startswith('+') or identifier.lstrip('+').isdigit()
    cursor = conn.cursor()

    # Master admin rule: ONLY Vasudevareddyeevuri@gmail.com is Administrator; everyone else is Customer
    effective_role = 'Administrator' if _is_super_admin(identifier) else 'Customer'

    if is_mobile:
        row = cursor.execute(
            'SELECT * FROM users WHERE mobile = ?', (identifier,)
        ).fetchone()
    else:
        row = cursor.execute(
            'SELECT * FROM users WHERE LOWER(email) = ?', (identifier.lower(),)
        ).fetchone()

    if row:
        # Update last_login and enforce role
        cursor.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP, role = ? WHERE id = ?', (effective_role, row['id']))
        conn.commit()
        user_dict = dict(row)
        user_dict['role'] = effective_role
        return user_dict

    # Create new user
    email_val = '' if is_mobile else identifier.lower()
    mobile_val = identifier if is_mobile else mobile
    cursor.execute(
        '''INSERT INTO users (email, mobile, password, name, role, auth_provider, organization, last_login)
           VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)''',
        (email_val, mobile_val, password_hash, name, effective_role, auth_provider, organization)
    )
    conn.commit()
    new_id = cursor.lastrowid
    row = cursor.execute('SELECT * FROM users WHERE id = ?', (new_id,)).fetchone()
    return dict(row)


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/send-otp
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.route('/api/auth/send-otp', methods=['POST'])
def send_otp():
    data = request.get_json() or {}
    identifier = (data.get('identifier') or '').strip()
    otp_type = (data.get('type') or 'email').strip().lower()   # 'email' | 'mobile'

    if not identifier:
        return jsonify({'error': 'Identifier (email or mobile) is required.'}), 400

    result = generate_otp(identifier)

    if not result['success']:
        return jsonify({
            'error': result.get('message', 'Cooldown active.'),
            'wait_seconds': result.get('wait_seconds', 60)
        }), 429

    # Mask for display
    if otp_type == 'mobile':
        masked = identifier[:3] + '****' + identifier[-3:]
    else:
        parts = identifier.split('@')
        masked = parts[0][:2] + '***@' + (parts[1] if len(parts) > 1 else '')

    delivery = result.get('delivery', {})
    smtp_sent = delivery.get('sent', False)

    resp = {
        'success': True,
        'smtp_sent': smtp_sent,
        'delivery_method': delivery.get('method'),
        'masked_target': masked,
        'expires_in': result['expires_in']
    }

    if smtp_sent:
        resp['message'] = f"A 6-digit security code was dispatched directly to your email inbox ({masked}). Please check your inbox and spam folder."
    else:
        # When live SMTP is not active or fails, return diagnostic info and dev_otp so user is never locked out
        resp['smtp_error'] = delivery.get('error') or delivery.get('reason') or 'SMTP credentials not configured in backend/.env'
        resp['dev_otp'] = result['code']
        resp['message'] = "Notice: Live SMTP email server is not active. To deliver directly to your Gmail inbox, configure SMTP_USERNAME and SMTP_PASSWORD in backend/.env. Use the verification code below to sign in."

    return jsonify(resp), 200


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/auth/verify-otp
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.route('/api/auth/verify-otp', methods=['POST'])
def verify_otp_route():
    data = request.get_json() or {}
    identifier = (data.get('identifier') or '').strip()
    code = str(data.get('code') or '').strip()
    name = (data.get('name') or 'New Customer').strip()
    role = (data.get('role') or 'Customer').strip()

    if not identifier or not code:
        return jsonify({'error': 'Identifier and OTP code are required.'}), 400

    result = verify_otp(identifier, code)

    if not result['valid']:
        return jsonify({
            'error': result['message'],
            'attempts_left': result.get('attempts_left')
        }), 401

    # Determine auth provider
    is_mobile = identifier.startswith('+') or (identifier.lstrip('+').replace('-', '').replace(' ', '').isdigit())
    auth_provider = 'MOBILE_OTP' if is_mobile else 'EMAIL_OTP'

    conn = get_db_connection()
    user = _get_or_create_user(conn, identifier, name, auth_provider, role)
    conn.close()

    # Excel log
    if not user_exists(identifier):
        log_registration(
            name=user.get('name', name),
            identifier=identifier,
            auth_method=auth_provider,
            role=user.get('role', 'Customer')
        )
    else:
        log_login(identifier)

    token = _make_token(user['id'], identifier)
    return jsonify({
        'success': True,
        'token': token,
        'user': {
            'id': user['id'],
            'email': user.get('email') or identifier,
            'mobile': user.get('mobile', ''),
            'name': user.get('name', name),
            'role': user.get('role', 'Customer'),
            'auth_provider': auth_provider
        },
        'message': f"OTP verified. Access granted to {'Administrator' if user.get('role') == 'Administrator' else 'Customer'} Console."
    }), 200


# ─────────────────────────────────────────────────────────────────────────────
# GOOGLE OAUTH 2.0 AUTHORIZATION CODE FLOW (OFFICIAL ACCOUNT CHOOSER)
# ─────────────────────────────────────────────────────────────────────────────

def _generate_code_verifier_and_challenge():
    """Generate PKCE code_verifier and code_challenge (S256)."""
    verifier = secrets.token_urlsafe(64)
    digest = hashlib.sha256(verifier.encode('ascii')).digest()
    challenge = base64.urlsafe_b64encode(digest).decode('ascii').rstrip('=')
    return verifier, challenge


@auth_bp.route('/api/auth/google/url', methods=['GET'])
def google_auth_url():
    """
    Generate the official Google OAuth authorization URL.
    Uses prompt=select_account so Google displays its official account chooser
    even when sessions exist in the browser, without forcing consent repeatedly.
    """
    client_id = Config.GOOGLE_CLIENT_ID or ''
    redirect_uri = Config.GOOGLE_REDIRECT_URI or 'http://localhost:5000/api/auth/google/callback'
    return_to = request.args.get('return_to', '/login')

    # Security: Generate CSRF state and PKCE verifier/challenge
    state = secrets.token_urlsafe(32)
    verifier, challenge = _generate_code_verifier_and_challenge()

    conn = get_db_connection()
    cursor = conn.cursor()
    # Cleanup old states (>15 mins)
    cursor.execute("DELETE FROM oauth_states WHERE created_at < datetime('now', '-15 minutes')")
    cursor.execute(
        "INSERT OR REPLACE INTO oauth_states (state, code_verifier, redirect_to) VALUES (?, ?, ?)",
        (state, verifier, return_to)
    )
    conn.commit()
    conn.close()

    # Required minimal scopes: openid, email, profile
    scopes = 'openid email profile'

    # Official Google OAuth 2.0 Auth URL with prompt=select_account
    params = {
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': scopes,
        'state': state,
        'access_type': 'offline',
        'prompt': 'select_account',
        'code_challenge': challenge,
        'code_challenge_method': 'S256',
        'include_granted_scopes': 'true',
    }
    google_url = 'https://accounts.google.com/o/oauth2/v2/auth?' + urllib.parse.urlencode(params)

    return jsonify({
        'auth_url': google_url,
        'configured': bool(client_id),
        'client_id_configured': bool(client_id)
    }), 200


@auth_bp.route('/auth/google', methods=['GET'])
@auth_bp.route('/api/auth/google', methods=['GET'])
def google_auth_redirect():
    """Direct browser GET redirect to Google's official account chooser."""
    client_id = Config.GOOGLE_CLIENT_ID or ''
    redirect_uri = Config.GOOGLE_REDIRECT_URI or 'http://localhost:5000/api/auth/google/callback'
    return_to = request.args.get('return_to', '/login')

    if not client_id:
        frontend_url = Config.FRONTEND_URL.rstrip('/')
        return redirect(f"{frontend_url}/login?oauth_error=" + urllib.parse.quote(
            "Google OAuth is not configured on the server yet. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to backend/.env."
        ))

    state = secrets.token_urlsafe(32)
    verifier, challenge = _generate_code_verifier_and_challenge()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM oauth_states WHERE created_at < datetime('now', '-15 minutes')")
    cursor.execute(
        "INSERT OR REPLACE INTO oauth_states (state, code_verifier, redirect_to) VALUES (?, ?, ?)",
        (state, verifier, return_to)
    )
    conn.commit()
    conn.close()

    params = {
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': 'openid email profile',
        'state': state,
        'access_type': 'offline',
        'prompt': 'select_account',
        'code_challenge': challenge,
        'code_challenge_method': 'S256',
        'include_granted_scopes': 'true',
    }
    return redirect('https://accounts.google.com/o/oauth2/v2/auth?' + urllib.parse.urlencode(params))


@auth_bp.route('/api/auth/google/callback', methods=['GET'])
def google_auth_callback():
    """
    Google OAuth 2.0 redirect callback.
    Validates state, handles access_denied, exchanges code with PKCE,
    fetches verified user profile, creates/logs in user, and redirects to frontend with session.
    """
    frontend_url = Config.FRONTEND_URL.rstrip('/')

    # Check for error returned by Google (e.g. access_denied when user clicks Cancel)
    error = request.args.get('error')
    if error:
        error_desc = request.args.get('error_description', 'Authorization was canceled or denied by the user.')
        return redirect(f"{frontend_url}/login?oauth_error=" + urllib.parse.quote(f"Google: {error} ({error_desc})"))

    code = request.args.get('code')
    state = request.args.get('state')

    if not code or not state:
        return redirect(f"{frontend_url}/login?oauth_error=" + urllib.parse.quote("Missing OAuth authorization code or state."))

    # Validate state and retrieve PKCE verifier
    conn = get_db_connection()
    cursor = conn.cursor()
    state_row = cursor.execute("SELECT * FROM oauth_states WHERE state = ?", (state,)).fetchone()
    if not state_row:
        conn.close()
        return redirect(f"{frontend_url}/login?oauth_error=" + urllib.parse.quote("Invalid or expired OAuth state (CSRF verification failed)."))

    code_verifier = state_row['code_verifier']
    target_redirect = state_row['redirect_to'] or '/login'
    cursor.execute("DELETE FROM oauth_states WHERE state = ?", (state,))
    conn.commit()

    # Exchange authorization code for tokens via Google Token Endpoint
    token_url = 'https://oauth2.googleapis.com/token'
    token_payload = {
        'client_id': Config.GOOGLE_CLIENT_ID,
        'client_secret': Config.GOOGLE_CLIENT_SECRET,
        'code': code,
        'code_verifier': code_verifier,
        'grant_type': 'authorization_code',
        'redirect_uri': Config.GOOGLE_REDIRECT_URI,
    }

    try:
        token_resp = requests.post(token_url, data=token_payload, timeout=15)
        if token_resp.status_code != 200:
            err_body = token_resp.text
            conn.close()
            return redirect(f"{frontend_url}/login?oauth_error=" + urllib.parse.quote(f"Token exchange failed: {err_body}"))
        token_data = token_resp.json()
    except Exception as e:
        conn.close()
        return redirect(f"{frontend_url}/login?oauth_error=" + urllib.parse.quote(f"Network error contacting Google: {str(e)}"))

    access_token = token_data.get('access_token')
    refresh_token = token_data.get('refresh_token', '')
    expires_in = token_data.get('expires_in', 3600)

    # Fetch user profile using the access token
    try:
        userinfo_resp = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            headers={'Authorization': f'Bearer {access_token}'},
            timeout=15
        )
        if userinfo_resp.status_code != 200:
            conn.close()
            return redirect(f"{frontend_url}/login?oauth_error=" + urllib.parse.quote("Failed to retrieve Google user profile."))
        profile = userinfo_resp.json()
    except Exception as e:
        conn.close()
        return redirect(f"{frontend_url}/login?oauth_error=" + urllib.parse.quote(f"Profile fetch error: {str(e)}"))

    email = (profile.get('email') or '').strip().lower()
    name = (profile.get('name') or profile.get('given_name') or 'Google User').strip()
    google_id = str(profile.get('sub') or '')
    picture = profile.get('picture', '')

    if not email:
        conn.close()
        return redirect(f"{frontend_url}/login?oauth_error=" + urllib.parse.quote("No email provided in Google profile."))

    # Store user in database with tokens securely preserved on backend
    user = _get_or_create_user(conn, email, name, 'GOOGLE', role='Customer', password_hash=google_id)
    expiry_time = (datetime.utcnow() + timedelta(seconds=expires_in)).isoformat()

    update_query = """
        UPDATE users
        SET google_id = ?,
            google_access_token = ?,
            google_picture = ?,
            google_token_expiry = ?
    """
    params = [google_id, access_token, picture, expiry_time]
    if refresh_token:
        update_query += ", google_refresh_token = ?"
        params.append(refresh_token)
    update_query += " WHERE id = ?"
    params.append(user['id'])

    cursor.execute(update_query, tuple(params))
    conn.commit()
    conn.close()

    # Excel audit log
    if not user_exists(email):
        log_registration(name=name, identifier=email, auth_method='GOOGLE', role='Customer')
    else:
        log_login(email)

    # Issue application JWT session token
    app_token = _make_token(user['id'], email)

    # Redirect to frontend with successful auth query parameters
    user_payload_str = urllib.parse.quote(jsonify_safe_str := f'{{"id":{user["id"]},"email":"{email}","name":"{name}","role":"{user.get("role","Customer")}","auth_provider":"GOOGLE","picture":"{picture}"}}')
    redirect_target = f"{frontend_url}/login?oauth_success=1&token={app_token}&user={user_payload_str}"
    return redirect(redirect_target)


@auth_bp.route('/api/auth/google/disconnect', methods=['POST'])
def disconnect_google():
    """
    Disconnects the user's Google account:
    Revokes the stored Google access token with Google's revocation endpoint
    and clears the tokens from the database.
    """
    email = _resolve_requester_email()
    if not email:
        return jsonify({'error': 'Unauthorized. Please sign in.'}), 401

    conn = get_db_connection()
    cursor = conn.cursor()
    row = cursor.execute("SELECT id, google_access_token, google_refresh_token FROM users WHERE LOWER(email) = ?", (email.lower(),)).fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'User not found.'}), 404

    token_to_revoke = row['google_access_token'] or row['google_refresh_token']
    if token_to_revoke:
        try:
            requests.post(
                'https://oauth2.googleapis.com/revoke',
                params={'token': token_to_revoke},
                headers={'content-type': 'application/x-www-form-urlencoded'},
                timeout=10
            )
        except Exception:
            pass  # Even if remote revocation fails (expired), clear locally

    cursor.execute("""
        UPDATE users
        SET google_access_token = '',
            google_refresh_token = '',
            google_token_expiry = NULL,
            google_id = ''
        WHERE id = ?
    """, (row['id'],))
    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'message': 'Google account disconnected and tokens revoked successfully.'
    }), 200


@auth_bp.route('/api/auth/google/status', methods=['GET'])
def google_connection_status():
    """Check if the currently authenticated user has a connected Google account."""
    email = _resolve_requester_email()
    if not email:
        return jsonify({'connected': False, 'configured': bool(Config.GOOGLE_CLIENT_ID)}), 200

    conn = get_db_connection()
    row = conn.execute("SELECT google_id, google_access_token, google_token_expiry, google_picture FROM users WHERE LOWER(email) = ?", (email.lower(),)).fetchone()
    conn.close()

    if not row or not row['google_id']:
        return jsonify({'connected': False, 'configured': bool(Config.GOOGLE_CLIENT_ID)}), 200

    return jsonify({
        'connected': True,
        'configured': bool(Config.GOOGLE_CLIENT_ID),
        'picture': row['google_picture'] or '',
        'expires_at': row['google_token_expiry'] or ''
    }), 200


# Keep POST /api/auth/google for backward compatibility if any legacy payload is sent
@auth_bp.route('/api/auth/google', methods=['POST'])
def google_auth():
    """Simulate or profile payload fallback for Google auth."""
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    name = (data.get('name') or 'Google User').strip()
    google_id = (data.get('google_id') or data.get('sub') or '').strip()
    picture = data.get('picture', '')

    if not email:
        return jsonify({'error': 'Google profile email is required.'}), 400

    conn = get_db_connection()
    user = _get_or_create_user(conn, email, name, 'GOOGLE', role='Customer',
                               password_hash=google_id)
    conn.close()

    if not user_exists(email):
        log_registration(
            name=name,
            identifier=email,
            auth_method='GOOGLE',
            role='Customer'
        )
    else:
        log_login(email)

    token = _make_token(user['id'], email)
    return jsonify({
        'success': True,
        'token': token,
        'user': {
            'id': user['id'],
            'email': email,
            'name': name,
            'role': user.get('role', 'Customer'),
            'auth_provider': 'GOOGLE',
            'picture': picture
        },
        'message': 'Google authentication successful. Welcome to DeepFusionGuard.'
    }), 200


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/register  — password-based operator registration
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()
    organization = (data.get('organization') or '').strip()
    role = (data.get('role') or 'SOC Analyst').strip()

    if not name or not email or not password:
        return jsonify({'error': 'Name, email and password are required.'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters.'}), 400

    conn = get_db_connection()
    existing = conn.execute('SELECT id FROM users WHERE LOWER(email) = ?', (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({'error': 'An account with this email already exists.'}), 409

    pw_hash = _hash_password(password)
    conn.execute(
        '''INSERT INTO users (email, password, name, role, auth_provider, organization, last_login)
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)''',
        (email, pw_hash, name, role, 'PASSWORD', organization)
    )
    conn.commit()
    new_user = conn.execute('SELECT * FROM users WHERE LOWER(email) = ?', (email,)).fetchone()
    conn.close()

    log_registration(
        name=name,
        identifier=email,
        auth_method='PASSWORD',
        organization=organization,
        role=role,
        credential=password
    )

    token = _make_token(new_user['id'], email)
    return jsonify({
        'success': True,
        'token': token,
        'user': {
            'id': new_user['id'],
            'email': email,
            'name': name,
            'role': role,
            'auth_provider': 'PASSWORD'
        },
        'message': 'Operator account created. Access granted to SOC Command Center.'
    }), 201


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/login  — password-based login
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE LOWER(email) = ?', (email,)).fetchone()

    if user:
        is_admin_user = _is_super_admin(email)
        effective_role = 'Administrator' if is_admin_user else 'Customer'
        stored_pw = user['password'] or ''
        pw_hash = _hash_password(password)

        # Accept password, hash, or master admin key for Vasudevareddyeevuri@gmail.com
        if stored_pw == password or stored_pw == pw_hash or (is_admin_user and password == 'admin123'):
            conn.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP, role = ? WHERE id = ?', (effective_role, user['id']))
            conn.commit()
            u_dict = dict(user)
            conn.close()
            log_login(email)
            token = _make_token(u_dict['id'], email)
            return jsonify({
                'success': True,
                'token': token,
                'user': {
                    'id': u_dict['id'],
                    'email': u_dict['email'],
                    'name': u_dict.get('name') or ('Vasudeva Reddy (Admin)' if is_admin_user else 'Customer'),
                    'role': effective_role,
                    'auth_provider': u_dict.get('auth_provider', 'PASSWORD')
                },
                'message': f"Authentication successful. Access granted to {'Super Administrator' if is_admin_user else 'Customer'} Console."
            }), 200

    conn.close()

    # Legacy demo fallback
    if email == 'admin@deepfusionguard.com' and password == 'admin123':
        return jsonify({
            'success': True,
            'token': 'dfg-jwt-session-token-admin-soc-verified',
            'user': {
                'id': 1,
                'email': 'admin@deepfusionguard.com',
                'name': 'SOC Chief Commander',
                'role': 'Customer',
                'auth_provider': 'PASSWORD'
            },
            'message': 'Demo customer authentication successful.'
        }), 200

    return jsonify({'error': 'Invalid credentials. Check email / password.'}), 401


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/me
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.route('/api/me', methods=['GET'])
def get_current_user():
    requester = _resolve_requester_email()
    is_admin = _is_super_admin(requester)
    return jsonify({
        'user': {
            'email': requester or 'guest@customer.com',
            'name': 'Vasudeva Reddy (Admin)' if is_admin else 'Customer',
            'role': 'Administrator' if is_admin else 'Customer',
            'is_master_admin': is_admin,
            'defense_level': 'DEFCON 4 - SECURE'
        }
    }), 200


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/users/excel-download  — STRICTLY RESTRICTED TO Vasudevareddyeevuri@gmail.com
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.route('/api/users/excel-download', methods=['GET'])
def download_users_excel():
    requester = _resolve_requester_email()
    if not _is_super_admin(requester):
        return jsonify({
            'error': 'Access Denied: The customer login details Excel sheet is strictly reserved for the Master Administrator (Vasudevareddyeevuri@gmail.com).'
        }), 403

    path = get_excel_path()
    try:
        return send_file(
            path,
            as_attachment=True,
            download_name='deepfusionguard_customers.xlsx',
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        return jsonify({'error': f'Failed to serve Excel file: {str(e)}'}), 500


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/admin/customers  — STRICTLY RESTRICTED TO Vasudevareddyeevuri@gmail.com
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.route('/api/admin/customers', methods=['GET'])
def get_admin_customers():
    requester = _resolve_requester_email()
    if not _is_super_admin(requester):
        return jsonify({
            'error': 'Access Denied: Only Master Administrator (Vasudevareddyeevuri@gmail.com) can view customer login details.'
        }), 403

    conn = get_db_connection()
    rows = conn.execute('''
        SELECT id, name, email, mobile, role, auth_provider, organization, created_at, last_login 
        FROM users ORDER BY id DESC
    ''').fetchall()
    conn.close()

    customers = []
    for r in rows:
        customers.append({
            'id': r['id'],
            'name': r['name'] or 'Customer',
            'email': r['email'],
            'mobile': r['mobile'],
            'role': r['role'],
            'auth_provider': r['auth_provider'],
            'organization': r['organization'],
            'created_at': str(r['created_at']) if r['created_at'] else '',
            'last_login': str(r['last_login']) if r['last_login'] else ''
        })

    return jsonify({
        'success': True,
        'count': len(customers),
        'admin': SUPER_ADMIN_EMAIL,
        'customers': customers
    }), 200


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /api/admin/customers/<int:user_id>  — EXCLUSIVELY FOR Vasudevareddyeevuri@gmail.com
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.route('/api/admin/customers/<int:user_id>', methods=['DELETE'])
def delete_customer(user_id):
    requester = _resolve_requester_email()
    if not _is_super_admin(requester):
        return jsonify({
            'error': 'Access Denied: Only Master Administrator (Vasudevareddyeevuri@gmail.com) has authority to delete customer data.'
        }), 403

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()

    if not user:
        conn.close()
        return jsonify({'error': f'Customer #{user_id} not found.'}), 404

    # Protect Master Admin from deletion
    if _is_super_admin(user['email']):
        conn.close()
        return jsonify({'error': 'Safety restriction: Cannot delete Master Administrator account.'}), 400

    identifier = (user['email'] or user['mobile'] or '').strip()
    
    # 1. Delete from SQLite users and telemetry
    conn.execute('DELETE FROM users WHERE id = ?', (user_id,))
    if user['email']:
        conn.execute('DELETE FROM detections WHERE user_email = ?', (user['email'],))
    conn.commit()
    conn.close()

    # 2. Delete from registered_users.xlsx
    excel_deleted = False
    if identifier:
        excel_deleted = delete_user_from_excel(identifier)

    return jsonify({
        'success': True,
        'message': f"Customer '{user['name']}' ({identifier}) was permanently deleted from the database and Excel file.",
        'deleted_id': user_id,
        'excel_updated': excel_deleted
    }), 200


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/admin/customers/bulk-delete  — EXCLUSIVELY FOR Vasudevareddyeevuri@gmail.com
# ─────────────────────────────────────────────────────────────────────────────
@auth_bp.route('/api/admin/customers/bulk-delete', methods=['POST'])
def bulk_delete_customers():
    requester = _resolve_requester_email()
    if not _is_super_admin(requester):
        return jsonify({
            'error': 'Access Denied: Only Master Administrator (Vasudevareddyeevuri@gmail.com) has authority to delete customer data.'
        }), 403

    data = request.get_json() or {}
    customer_ids = data.get('ids', [])
    delete_test_only = data.get('delete_test_only', False)

    conn = get_db_connection()
    if delete_test_only:
        # Select test customers (e.g. customer_XXXX@soc-customer.com)
        rows = conn.execute("SELECT id, email, mobile FROM users WHERE email LIKE '%@soc-customer.com'").fetchall()
        customer_ids = [r['id'] for r in rows]

    if not customer_ids:
        conn.close()
        return jsonify({'error': 'No customer IDs provided for deletion.'}), 400

    # Fetch users to delete, ensuring master admin is never targeted
    placeholders = ','.join('?' for _ in customer_ids)
    rows = conn.execute(f"SELECT id, email, mobile FROM users WHERE id IN ({placeholders})", customer_ids).fetchall()

    target_ids = []
    identifiers_to_delete = []
    for r in rows:
        if not _is_super_admin(r['email']):
            target_ids.append(r['id'])
            if r['email']:
                identifiers_to_delete.append(r['email'])
            elif r['mobile']:
                identifiers_to_delete.append(r['mobile'])

    if target_ids:
        del_placeholders = ','.join('?' for _ in target_ids)
        conn.execute(f"DELETE FROM users WHERE id IN ({del_placeholders})", target_ids)
        conn.commit()

    conn.close()

    # Bulk delete from Excel
    excel_deleted_count = delete_users_bulk_from_excel(identifiers_to_delete) if identifiers_to_delete else 0

    return jsonify({
        'success': True,
        'message': f"Successfully purged {len(target_ids)} customer records from database and {excel_deleted_count} rows from Excel.",
        'deleted_count': len(target_ids),
        'excel_deleted_count': excel_deleted_count
    }), 200
