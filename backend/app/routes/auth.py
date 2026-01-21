from flask import Blueprint, request, jsonify, Response
from app.extensions import db, jwt
from app.models.user import User
from flask_jwt_extended import create_access_token
from typing import Tuple

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register() -> Tuple[Response, int]:
    """
    Rejestruje nowego użytkownika.

    Pobiera 'username' i 'password' z ciała żądania JSON.
    Sprawdza, czy użytkownik już istnieje.

    Returns:
        tuple: Obiekt JSON z komunikatem oraz kod HTTP statusu.
    """
    data = request.get_json()
    username: str = data.get('username')
    password: str = data.get('password')

    if not username or not password:
        return jsonify({"msg": "Brakuje nazwy użytkownika lub hasła"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "Użytkownik już istnieje"}), 400

    new_user = User(username=username)
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"msg": "Użytkownik utworzony pomyślnie"}), 201


@auth_bp.route('/login', methods=['POST'])
def login() -> Tuple[Response, int]:
    """
    Loguje użytkownika i zwraca token JWT.

    Pobiera 'username' i 'password' z ciała żądania JSON.

    Returns:
        tuple: Obiekt JSON z tokenem dostępu lub błędem oraz kod HTTP statusu.
    """
    data = request.get_json()
    username: str = data.get('username')
    password: str = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        access_token = create_access_token(identity=str(user.id))
        return jsonify(access_token=access_token), 200

    return jsonify({"msg": "Błędny login lub hasło"}), 401
