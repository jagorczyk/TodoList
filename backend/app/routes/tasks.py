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
            "due_date": task.due_date.isoformat() if task.due_date else None
        })
    return jsonify(output), 200


@tasks_bp.route('', methods=['POST'])
@jwt_required()
def create_task() -> Tuple[Response, int]:
    """
    Tworzy nowe zadanie dla zalogowanego użytkownika.

    Wymaga podania 'title'. Opcjonalnie przyjmuje 'due_date'.

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

    new_task = Task(
        title=data['title'],
        user_id=current_user_id,
        due_date=due_date
    )

    db.session.add(new_task)
    db.session.commit()

    return jsonify({"msg": "Zadanie dodane", "id": new_task.id}), 201


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
