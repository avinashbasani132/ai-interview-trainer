from flask import Blueprint, request, jsonify
from models import db, User
from flask_jwt_extended import create_access_token
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Input validation
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({
            "success": False,
            "message": "Validation Failed",
            "error": "Email and password are required"
        }), 400
        
    email = data['email']
    password = data['password']
    
    if User.query.filter_by(email=email).first():
        return jsonify({
            "success": False,
            "message": "Conflict",
            "error": "User with this email already exists"
        }), 409
        
    try:
        new_user = User(email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "Database Error",
            "error": "Failed to create user."
        }), 500

    # Generate JWT token upon successful registration
    access_token = create_access_token(identity=str(new_user.id))
    return jsonify({
        "success": True,
        "message": "User registered successfully",
        "data": {
            "access_token": access_token,
            "user_id": new_user.id
        }
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({
            "success": False,
            "message": "Validation Failed",
            "error": "Email and password are required"
        }), 400
        
    email = data['email']
    password = data['password']
    
    user = User.query.filter_by(email=email).first()
    
    if user and user.check_password(password):
        # Update last_login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Generate new JWT token
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            "success": True,
            "message": "Login successful",
            "data": {
                "access_token": access_token,
                "user_id": user.id,
                "is_admin": user.is_admin
            }
        }), 200
        
    return jsonify({
        "success": False,
        "message": "Unauthorized",
        "error": "Invalid email or password"
    }), 401
