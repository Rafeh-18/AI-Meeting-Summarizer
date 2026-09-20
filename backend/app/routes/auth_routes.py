from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
    jwt_required,
    get_jwt_identity,
)
from app.controllers.auth_controller import register_user, authenticate_user
from app.models.user import User

auth_bp = Blueprint("auth", __name__)

from app.controllers.auth_controller import update_profile, change_password 


@auth_bp.put("/me")
@jwt_required()
def update_me():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"errors": {"general": "User not found."}}), 404

    updated_user, errors = update_profile(user, request.get_json(silent=True) or {})
    if errors:
        return jsonify({"errors": errors}), 400
    return jsonify({"user": updated_user.to_dict()}), 200


@auth_bp.post("/me/password")
@jwt_required()
def update_password():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"errors": {"general": "User not found."}}), 404

    error = change_password(user, request.get_json(silent=True) or {})
    if error:
        return jsonify({"errors": error}), 400
    return jsonify({"message": "Password updated."}), 200


@auth_bp.post("/register")
def register():
    body, status = register_user(request.get_json(silent=True) or {})
    if status != 201:
        return jsonify(body), status

    user = body["user"]
    access_token = create_access_token(identity=str(user["id"]))
    refresh_token = create_refresh_token(identity=str(user["id"]))

    resp = jsonify({"user": user})
    set_access_cookies(resp, access_token)
    set_refresh_cookies(resp, refresh_token)
    return resp, 201


@auth_bp.post("/login")
def login():
    user, error_body, status = authenticate_user(request.get_json(silent=True) or {})
    if error_body:
        return jsonify(error_body), status

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    resp = jsonify({"user": user.to_dict()})
    set_access_cookies(resp, access_token)
    set_refresh_cookies(resp, refresh_token)
    return resp, 200


@auth_bp.post("/logout")
def logout():
    resp = jsonify({"message": "Logged out"})
    unset_jwt_cookies(resp)
    return resp, 200


@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({"errors": {"general": "User not found."}}), 404
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    resp = jsonify({"message": "Refreshed"})
    set_access_cookies(resp, access_token)
    return resp, 200