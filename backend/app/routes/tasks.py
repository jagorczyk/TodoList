from flask import Blueprint, request, jsonify, Response
from app.extensions import db
from app.models.task import Task
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from typing import Tuple, List, Dict, Any

tasks_bp = Blueprint('tasks', __name__)


@tasks_bp.route('', methods=['GET'])
@jwt_required()
def get_tasks() -> Tuple[Response, int]:
    """
    Pobiera listę zadań zalogowanego użytkownika.

    Returns:
        tuple: Lista zadań w formacie JSON oraz kod 200.
    """
    current_user_id: int = int(get_jwt_identity())
    tasks: List[Task] = Task.query.filter_by(
        user_id=current_user_id).order_by(
        Task.due_date.asc()).all()

    output: List[Dict[str, Any]] = []
    for task in tasks:
        output.append({
            "id": task.id,
            "title": task.title,
            "is_completed": task.is_completed,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "end_time": task.end_time.isoformat() if task.end_time else None,
            "recurrence_type": task.recurrence_type,
            "recurrence_interval": task.recurrence_interval,
            "recurrence_end_date": task.recurrence_end_date.isoformat() if task.recurrence_end_date else None,
            "parent_task_id": task.parent_task_id
        })
    return jsonify(output), 200


@tasks_bp.route('', methods=['POST'])
@jwt_required()
def create_task() -> Tuple[Response, int]:
    """
    Tworzy nowe zadanie dla zalogowanego użytkownika.

    Wymaga podania 'title'. Opcjonalnie przyjmuje 'due_date', 'recurrence_type', 
    'recurrence_interval', 'recurrence_end_date'.

    Returns:
        tuple: Komunikat sukcesu i ID zadania oraz kod 201.
    """
    current_user_id: int = int(get_jwt_identity())
    data: Dict[str, Any] = request.get_json()

    if not data.get('title'):
        return jsonify({"msg": "Tytuł jest wymagany"}), 400

    due_date: datetime | None = None
    if data.get('due_date'):
        try:
            due_date = datetime.fromisoformat(
                data['due_date'].replace('Z', '+00:00'))
        except ValueError:
            pass

    end_time: datetime | None = None
    if data.get('end_time'):
        try:
            end_time = datetime.fromisoformat(
                data['end_time'].replace('Z', '+00:00'))
        except ValueError:
            pass


    recurrence_type = data.get('recurrence_type', 'none')
    recurrence_interval = data.get('recurrence_interval', 1)
    recurrence_end_date: datetime | None = None
    
    if data.get('recurrence_end_date'):
        try:
            recurrence_end_date = datetime.fromisoformat(
                data['recurrence_end_date'].replace('Z', '+00:00'))
        except ValueError:
            pass

    new_task = Task(
        title=data['title'],
        user_id=current_user_id,
        due_date=due_date,
        end_time=end_time,
        recurrence_type=recurrence_type,
        recurrence_interval=recurrence_interval,
        recurrence_end_date=recurrence_end_date
    )

    db.session.add(new_task)
    db.session.commit()


    if recurrence_type != 'none' and due_date:
        created_tasks = generate_recurring_tasks(new_task, current_user_id)
    
    return jsonify({
        "msg": "Zadanie dodane", 
        "id": new_task.id,
        "recurrence_type": new_task.recurrence_type
    }), 201


def generate_recurring_tasks(parent_task: Task, user_id: int, max_occurrences: int = 52) -> List[Task]:
    """
    Generuje zadania powtarzające się na podstawie zadania rodzica.
    
    Args:
        parent_task: Zadanie rodzic z ustawioną powtarzalnością.
        user_id: ID użytkownika.
        max_occurrences: Maksymalna liczba wystąpień (domyślnie 52 - rok tygodni).
    
    Returns:
        Lista utworzonych zadań potomnych.
    """
    created_tasks = []
    current_date = parent_task.get_next_due_date()
    count = 0
    
    while current_date and count < max_occurrences:
        if parent_task.recurrence_end_date and current_date > parent_task.recurrence_end_date:
            break
        
        child_end_time = None
        if parent_task.end_time and parent_task.due_date:
            time_diff = parent_task.end_time - parent_task.due_date
            child_end_time = current_date + time_diff
        
        child_task = Task(
            title=parent_task.title,
            user_id=user_id,
            due_date=current_date,
            end_time=child_end_time,
            recurrence_type=parent_task.recurrence_type,
            recurrence_interval=parent_task.recurrence_interval,
            recurrence_end_date=parent_task.recurrence_end_date,
            parent_task_id=parent_task.id
        )
        
        db.session.add(child_task)
        created_tasks.append(child_task)
        

        temp_task = Task(
            due_date=current_date,
            recurrence_type=parent_task.recurrence_type,
            recurrence_interval=parent_task.recurrence_interval
        )
        current_date = temp_task.get_next_due_date()
        count += 1
    
    db.session.commit()
    return created_tasks


@tasks_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_task(id: int) -> Tuple[Response, int]:
    """
    Usuwa zadanie o podanym ID.

    Args:
        id (int): ID zadania do usunięcia.

    Returns:
        tuple: Komunikat statusu oraz kod 200 lub 404.
    """
    current_user_id: int = int(get_jwt_identity())
    task = Task.query.filter_by(id=id, user_id=current_user_id).first()

    if not task:
        return jsonify({"msg": "Zadanie nie znalezione"}), 404

    db.session.delete(task)
    db.session.commit()

    return jsonify({"msg": "Zadanie usunięte"}), 200


@tasks_bp.route('/<int:id>', methods=['PATCH'])
@jwt_required()
def update_task(id: int) -> Tuple[Response, int]:
    """
    Aktualizuje istniejące zadanie (status lub tytuł).

    Args:
        id (int): ID zadania do edycji.

    Returns:
        tuple: Zaktualizowane dane zadania oraz kod 200 lub 404.
    """
    current_user_id: int = int(get_jwt_identity())
    task = Task.query.filter_by(id=id, user_id=current_user_id).first()

    if not task:
        return jsonify({"msg": "Zadanie nie znalezione"}), 404

    data: Dict[str, Any] = request.get_json()

    if 'is_completed' in data:
        task.is_completed = data['is_completed']

    if 'title' in data:
        task.title = data['title']

    db.session.commit()

    return jsonify({
        "msg": "Zadanie zaktualizowane",
        "id": task.id,
        "is_completed": task.is_completed,
        "title": task.title
    }), 200
