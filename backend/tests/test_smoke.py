def test_smoke_app_starts(client):
    """Test na dym: sprawdza czy aplikacja odpowiada (np. 404 na nieznany URL)."""
    response = client.get('/random-url')
    assert response.status_code == 404

def test_register_and_login(client):
    """Test procesu rejestracji i logowania."""
    # 1. Rejestracja (prefix /api)
    response = client.post('/api/auth/register', json={
        "username": "testuser",
        "password": "password123"
    })
    assert response.status_code == 201

    # 2. Logowanie (prefix /api)
    response = client.post('/api/auth/login', json={
        "username": "testuser",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "access_token" in response.get_json()

def test_create_task(client):
    """Test tworzenia zadania (wymaga autoryzacji)."""
    # Rejestracja i logowanie pomocnicze
    client.post('/api/auth/register', json={"username": "user2", "password": "pw"})
    login_resp = client.post('/api/auth/login', json={"username": "user2", "password": "pw"})
    
    # Pobranie tokenu
    token = login_resp.get_json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    # Tworzenie zadania (prefix /api)
    response = client.post('/api/tasks', json={"title": "Testowe zadanie"}, headers=headers)
    assert response.status_code == 201
    assert response.get_json()['msg'] == "Zadanie dodane"