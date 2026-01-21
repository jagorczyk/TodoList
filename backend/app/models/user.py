from app.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from typing import Optional


class User(db.Model):
    """
    Model reprezentujący użytkownika systemu.

    Attributes:
        id (int): Unikalny identyfikator użytkownika.
        username (str): Nazwa użytkownika (unikalna).
        password_hash (str): Zahaszowane hasło użytkownika.
        tasks (list[Task]): Lista zadań przypisanych do użytkownika.
    """
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)

    tasks = db.relationship('Task', backref='author', lazy=True)

    def set_password(self, password: str) -> None:
        """
        Ustawia hasło użytkownika, zapisując jego hash.

        Args:
            password (str): Hasło w postaci jawnej.
        """
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """
        Sprawdza zgodność podanego hasła z zapisanym hashem.

        Args:
            password (str): Hasło do weryfikacji.

        Returns:
            bool: True jeśli hasło jest poprawne, False w przeciwnym razie.
        """
        return check_password_hash(self.password_hash, password)
