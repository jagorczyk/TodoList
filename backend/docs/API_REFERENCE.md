# Dokumentacja API TodoList

Projekt implementuje proste API do zarządzania listą zadań.

## Uruchamianie
1. Zainstaluj zależności: `pip install -r requirements.txt`
2. Uruchom serwer: `python run.py`

## Endpointy

### Auth

#### `POST /auth/register`
Rejestruje nowego użytkownika.
- **Body**: `{ "username": "...", "password": "..." }`
- **Odpowiedź**: 201 Created

#### `POST /auth/login`
Loguje użytkownika i zwraca token JWT.
- **Body**: `{ "username": "...", "password": "..." }`
- **Odpowiedź**: 200 OK + `{ "access_token": "..." }`

### Tasks
Wszystkie endpointy wymagają nagłówka `Authorization: Bearer <token>`.

#### `GET /tasks`
Pobiera listę zadań zalogowanego użytkownika.

#### `POST /tasks`
Tworzy nowe zadanie.
- **Body**: `{ "title": "...", "due_date": "ISO8601 (opcjonalnie)" }`

#### `DELETE /tasks/<id>`
Usuwa zadanie o podanym ID.

#### `PATCH /tasks/<id>`
Aktualizuje zadanie.
- **Body**: `{ "is_completed": true/false, "title": "..." }`