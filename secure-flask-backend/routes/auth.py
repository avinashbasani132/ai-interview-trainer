from flask import Blueprint, request, jsonify
from models import db, User
from flask_jwt_extended import create_access_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Input validation
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password are required"}), 400
        
    email = data['email']
    password = data['password']
    
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "User with this email already exists"}), 409
        
    try:
        new_user = User(email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create user."}), 500

    # Generate JWT token upon successful registration
    access_token = create_access_token(identity=str(new_user.id))
    return jsonify({
        "message": "User registered successfully",
        "access_token": access_token
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email and password are required"}), 400
        
    email = data['email']
    password = data['password']
    
    user = User.query.filter_by(email=email).first()
    
    if user and user.check_password(password):
        # Generate new JWT token
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            "message": "Login successful",
            "access_token": access_token
        }), 200
        
    return jsonify({"error": "Invalid email or password"}), 401
