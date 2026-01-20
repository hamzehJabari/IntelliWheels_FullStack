import requests

BACKEND_URL = 'https://intelliwheels.onrender.com'

# Login first
print('Logging in...')
resp = requests.post(f'{BACKEND_URL}/api/auth/login', json={'username': 'HamzaJabari', 'password': '@Intelliwheels123'}, timeout=30)
data = resp.json()
token = data.get('token')
print(f'Token: {token[:20]}...')
headers = {'Authorization': f'Bearer {token}'}

# Test conversations (returns JSON error)
print('\nTesting GET /api/messages/conversations...')
resp2 = requests.get(f'{BACKEND_URL}/api/messages/conversations', headers=headers, timeout=30)
print(f'Status: {resp2.status_code}')
print(f'Response: {resp2.text[:1000]}')

# Test unread count
print('\nTesting GET /api/messages/unread-count...')
resp3 = requests.get(f'{BACKEND_URL}/api/messages/unread-count', headers=headers, timeout=30)
print(f'Status: {resp3.status_code}')
print(f'Response: {resp3.text[:1000]}')
