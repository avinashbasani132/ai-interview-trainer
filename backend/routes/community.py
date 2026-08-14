from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import CommunityPost, CommunityReply, User

community_bp = Blueprint('community', __name__)


@community_bp.route('/posts', methods=['GET'])
@jwt_required()
def get_posts():
    posts = CommunityPost.objects.order_by('-created_at')
    res = []
    for p in posts:
        author = User.objects(id=p.user_id).first()
        replies_count = CommunityReply.objects(post_id=str(p.id)).count()
        res.append({
            "id": str(p.id),
            "title": p.title,
            "content": p.content,
            "author": (author.username if author and author.username else f"User {str(p.user_id)[-6:]}"),
            "upvotes": p.upvotes,
            "created_at": p.created_at.isoformat(),
            "replies_count": replies_count
        })
    return jsonify({"posts": res}), 200


@community_bp.route('/post', methods=['POST'])
@jwt_required()
def create_post():
    user_id = get_jwt_identity()
    data = request.json

    title = data.get("title")
    content = data.get("content")
    if not title or not content:
        return jsonify({"error": "Title and content required"}), 400

    post = CommunityPost(user_id=user_id, title=title, content=content)
    post.save()
    return jsonify({"message": "Post created successfully", "post_id": str(post.id)}), 201


@community_bp.route('/reply', methods=['POST'])
@jwt_required()
def create_reply():
    user_id = get_jwt_identity()
    data = request.json

    post_id = data.get("post_id")
    content = data.get("content")
    if not post_id or not content:
        return jsonify({"error": "Post ID and content required"}), 400

    reply = CommunityReply(user_id=user_id, post_id=post_id, content=content)
    reply.save()
    return jsonify({"message": "Reply added successfully"}), 201


@community_bp.route('/posts/<string:post_id>/replies', methods=['GET'])
@jwt_required()
def get_replies(post_id):
    post = CommunityPost.objects(id=post_id).first()
    if not post:
        return jsonify({"error": "Post not found"}), 404

    replies = CommunityReply.objects(post_id=post_id)
    res = []
    for r in replies:
        author = User.objects(id=r.user_id).first()
        res.append({
            "id": str(r.id),
            "content": r.content,
            "author": (author.username if author and author.username else f"User {str(r.user_id)[-6:]}"),
            "created_at": r.created_at.isoformat()
        })
    return jsonify({"replies": res}), 200
