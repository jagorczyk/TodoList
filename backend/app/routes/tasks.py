from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.task import Task
from flask_jwt_extended import jwt_required, get_jwt_identity

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/', methods=['GET'])
@jwt_required()
def get_tasks():
    current_user_id = get_jwt_identity()
    tasks = Task.query.filter_by(user_id=current_user_id).all()
    
    output = []
    for task in tasks:
        output.append({
            "id": task.id,
            "title": task.title,
            "is_completed": task.is_completed
        })
    return jsonify(output), 200

@tasks_bp.route('/', methods=['POST'])
@jwt_required()
def create_task():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data.get('title'):
        return jsonify({"msg": "Tytuł jest wymagany"}), 400

    new_task = Task(
        title=data['title'],
        user_id=current_user_id
    )
    
    db.session.add(new_task)
    db.session.commit()
    
    return jsonify({"msg": "Zadanie dodane", "id": new_task.id}), 201

@tasks_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_task(id):
    current_user_id = get_jwt_identity()
    task = Task.query.filter_by(id=id, user_id=current_user_id).first()
    
    if not task:
        return jsonify({"msg": "Zadanie nie znalezione lub brak uprawnień"}), 404
        
    db.session.delete(task)
    db.session.commit()
    
    return jsonify({"msg": "Zadanie usunięte"}), 200