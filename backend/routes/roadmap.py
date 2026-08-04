from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, LearningRoadmap

roadmap_bp = Blueprint('roadmap', __name__)

DEFAULT_ROADMAP = [
    {"name": "Python Basics", "order": 1},
    {"name": "Data Structures", "order": 2},
    {"name": "Algorithms", "order": 3},
    {"name": "System Design", "order": 4},
    {"name": "Mock Interviews", "order": 5}
]

@roadmap_bp.route('/', methods=['GET'])
@jwt_required()
def get_roadmap():
    user_id = get_jwt_identity()
    
    # Initialize roadmap if not exists
    existing = LearningRoadmap.query.filter_by(user_id=user_id).order_by(LearningRoadmap.step_order).all()
    if not existing:
        for step in DEFAULT_ROADMAP:
            new_step = LearningRoadmap(
                user_id=user_id,
                step_name=step["name"],
                step_order=step["order"],
                is_completed=False
            )
            db.session.add(new_step)
        db.session.commit()
        existing = LearningRoadmap.query.filter_by(user_id=user_id).order_by(LearningRoadmap.step_order).all()
        
    res = [{"id": r.id, "step_name": r.step_name, "step_order": r.step_order, "is_completed": r.is_completed} for r in existing]
    return jsonify({"roadmap": res}), 200

@roadmap_bp.route('/complete/<int:step_id>', methods=['POST'])
@jwt_required()
def complete_step(step_id):
    user_id = get_jwt_identity()
    step = LearningRoadmap.query.filter_by(id=step_id, user_id=user_id).first()
    if not step:
        return jsonify({"error": "Step not found"}), 404
        
    step.is_completed = True
    db.session.commit()
    
    return jsonify({"message": "Step marked as complete", "step_id": step.id}), 200
