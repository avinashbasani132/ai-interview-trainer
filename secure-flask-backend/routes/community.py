from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, CommunityPost, CommunityReply

community_bp = Blueprint('community', __name__)

@community_bp.route('/posts', methods=['GET'])
@jwt_required()
def get_posts():
    posts = CommunityPost.query.order_by(CommunityPost.created_at.desc()).all()
    res = []
    for p in posts:
        res.append({
            "id": p.id,
            "title": p.title,
            "content": p.content,
            "author": p.author.username or f"User {p.user_id}",
            "upvotes": p.upvotes,
            "created_at": p.created_at.isoformat(),
            "replies_count": len(p.replies)
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
    db.session.add(post)
    db.session.commit()
    return jsonify({"message": "Post created successfully", "post_id": post.id}), 201

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
    db.session.add(reply)
    db.session.commit()
    return jsonify({"message": "Reply added successfully"}), 201
