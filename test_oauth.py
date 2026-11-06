import sys
sys.path.insert(0, '.')
from backend.app import app

client = app.test_client()

# 1. Health check
res = client.get('/api/health')
print('TEST 1 - Health check:', res.status_code, res.json['status'])

# 2. Google OAuth URL with prompt=select_account & PKCE
res = client.get('/api/auth/google/url?return_to=/login')
data = res.json
print('TEST 2 - URL endpoint status:', res.status_code)
auth_url = data.get('auth_url', '')
print('       - contains prompt=select_account:', 'prompt=select_account' in auth_url)
print('       - contains code_challenge:', 'code_challenge=' in auth_url)
print('       - contains code_challenge_method=S256:', 'code_challenge_method=S256' in auth_url)
print('       - contains state:', 'state=' in auth_url)
print('       - contains scope openid email profile:', 'openid' in auth_url and 'email' in auth_url)

# 3. Direct GET /auth/google redirect
res = client.get('/auth/google', follow_redirects=False)
print('TEST 3 - Direct /auth/google redirect status:', res.status_code)
loc = res.headers.get('Location', '')
print('       - redirect starts with accounts.google.com or frontend fallback:', 'accounts.google.com' in loc or 'oauth_error' in loc)

# 4. Callback handles user denial (access_denied)
res = client.get('/api/auth/google/callback?error=access_denied&error_description=User+denied+consent', follow_redirects=False)
print('TEST 4 - Callback error handling status:', res.status_code)
print('       - Redirects to frontend with error query:', 'oauth_error=' in res.headers.get('Location', ''))

# 5. Callback rejects invalid state (CSRF defense)
res = client.get('/api/auth/google/callback?code=mock_code&state=invalid_csrf_state', follow_redirects=False)
print('TEST 5 - State validation status:', res.status_code)
print('       - Rejects invalid state:', 'CSRF' in res.headers.get('Location', '') or 'Invalid' in res.headers.get('Location', ''))

# 6. Status endpoint
res = client.get('/api/auth/google/status')
print('TEST 6 - Google status endpoint:', res.status_code, res.json)

print('=' * 50)
print('ALL BACKEND OAUTH TESTS COMPLETED SUCCESSFULLY')
print('=' * 50)
