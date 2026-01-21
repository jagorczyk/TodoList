from app.extensions import db
from datetime import datetime
from typing import Optional


class Task(db.Model):
    """
    Model reprezentujący pojedyncze zadanie (To-Do).

    Attributes:
        id (int): Unikalny identyfikator zadania.
        title (str): Tytuł zadania.
        is_completed (bool): Status wykonania zadania.
        created_at (datetime): Data i czas utworzenia zadania.
        due_date (datetime): Termin wykonania zadania (opcjonalny).
        user_id (int): Klucz obcy wskazujący na właściciela zadania.
    """
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    due_date = db.Column(db.DateTime, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
