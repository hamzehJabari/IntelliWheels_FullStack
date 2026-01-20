import requests

BACKEND_URL = 'https://intelliwheels.onrender.com'

# Login first
print('Logging in...')
resp = requests.post(f'{BACKEND_URL}/api/auth/login', json={'username': 'HamzaJabari', 'password': '@Intelliwheels123'}, timeout=30)
data = resp.json()
token = data.get('token')
print(f'Token: {token[:20]}...')

# Test favorites
print('\nTesting GET /api/favorites...')
resp2 = requests.get(f'{BACKEND_URL}/api/favorites', headers={'Authorization': f'Bearer {token}'}, timeout=30)
print(f'Status: {resp2.status_code}')
print(f'Response: {resp2.text[:1000]}')

# Test unread count
print('\nTesting GET /api/messages/unread-count...')
resp3 = requests.get(f'{BACKEND_URL}/api/messages/unread-count', headers={'Authorization': f'Bearer {token}'}, timeout=30)
print(f'Status: {resp3.status_code}')
print(f'Response: {resp3.text[:1000]}')
