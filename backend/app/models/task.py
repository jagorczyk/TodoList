from app.extensions import db
from datetime import datetime, timedelta
from typing import Optional
from dateutil.relativedelta import relativedelta


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
        recurrence_type (str): Typ powtarzalności (none, daily, weekly, monthly, custom).
        recurrence_interval (int): Interwał dla niestandardowej powtarzalności (np. co 3 dni).
        recurrence_end_date (datetime): Data końca powtarzalności (opcjonalny).
        parent_task_id (int): ID zadania rodzica (dla zadań powtarzających się).
    """
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    due_date = db.Column(db.DateTime, nullable=True)
    end_time = db.Column(db.DateTime, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    

    recurrence_type = db.Column(db.String(20), default='none')
    recurrence_interval = db.Column(db.Integer, default=1)
    recurrence_end_date = db.Column(db.DateTime, nullable=True)
    parent_task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=True)
    

    child_tasks = db.relationship('Task', backref=db.backref('parent_task', remote_side=[id]), lazy='dynamic')

    def get_next_due_date(self) -> Optional[datetime]:
        """Oblicza następną datę wykonania na podstawie typu powtarzalności."""
        if not self.due_date or self.recurrence_type == 'none':
            return None
        
        if self.recurrence_type == 'daily':
            return self.due_date + timedelta(days=1)
        elif self.recurrence_type == 'weekly':
            return self.due_date + timedelta(weeks=1)
        elif self.recurrence_type == 'monthly':
            return self.due_date + relativedelta(months=1)
        elif self.recurrence_type == 'custom':
            return self.due_date + timedelta(days=self.recurrence_interval)
        
        return None
