from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import LearningRoadmap

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

    existing = list(LearningRoadmap.objects(user_id=user_id).order_by('step_order'))
    if not existing:
        for step in DEFAULT_ROADMAP:
            LearningRoadmap(
                user_id=user_id,
                step_name=step["name"],
                step_order=step["order"],
                is_completed=False
            ).save()
        existing = list(LearningRoadmap.objects(user_id=user_id).order_by('step_order'))

    res = [{"id": str(r.id), "step_name": r.step_name, "step_order": r.step_order, "is_completed": r.is_completed} for r in existing]
    return jsonify({"roadmap": res}), 200


@roadmap_bp.route('/complete/<string:step_id>', methods=['POST'])
@jwt_required()
def complete_step(step_id):
    user_id = get_jwt_identity()
    step = LearningRoadmap.objects(id=step_id, user_id=user_id).first()
    if not step:
        return jsonify({"error": "Step not found"}), 404

    step.is_completed = True
    step.save()

    return jsonify({"message": "Step marked as complete", "step_id": str(step.id)}), 200
