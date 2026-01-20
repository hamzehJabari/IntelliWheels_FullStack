import requests

BACKEND_URL = 'https://intelliwheels.onrender.com'

# Fresh login
print('Fresh login...')
resp = requests.post(f'{BACKEND_URL}/api/auth/login', json={'username': 'HamzaJabari', 'password': '@Intelliwheels123'}, timeout=30)
data = resp.json()
token = data.get('token')
print(f'Login status: {resp.status_code}')
print(f'Token received: {token}')

# Check sessions to verify it was stored
print('\nChecking sessions...')
resp2 = requests.get(f'{BACKEND_URL}/api/debug-sessions', timeout=30)
sessions = resp2.json()
print(f'Session count: {sessions["session_count"]}')
print(f'Latest session: {sessions["sessions"][0]}')

# Test verify with the token
print('\nTesting verify with token...')
resp3 = requests.get(f'{BACKEND_URL}/api/auth/verify', headers={'Authorization': f'Bearer {token}'}, timeout=30)
print(f'Verify status: {resp3.status_code}')
print(f'Verify response: {resp3.text}')
