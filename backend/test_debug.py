import requests

BACKEND_URL = 'https://intelliwheels.onrender.com'

# Fresh login
print('Fresh login...')
resp = requests.post(f'{BACKEND_URL}/api/auth/login', json={'username': 'HamzaJabari', 'password': '@Intelliwheels123'}, timeout=30)
data = resp.json()
token = data.get('token')
print(f'Login status: {resp.status_code}')
print(f'Token received: {token}')
print(f'Token length: {len(token) if token else 0}')

# Test the debug-verify endpoint
print('\nTesting debug-verify endpoint...')
resp2 = requests.get(f'{BACKEND_URL}/api/debug-verify/{token}', timeout=30)
print(f'Debug status: {resp2.status_code}')
print('Debug response:')
import json
print(json.dumps(resp2.json(), indent=2))

# Test actual verify
print('\nTesting actual verify...')
resp3 = requests.get(f'{BACKEND_URL}/api/auth/verify', headers={'Authorization': f'Bearer {token}'}, timeout=30)
print(f'Verify status: {resp3.status_code}')
print(f'Verify response: {resp3.text}')
