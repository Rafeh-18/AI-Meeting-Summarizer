import re
from app.extensions import db, bcrypt
from app.models.user import User

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate_register(data):
    errors = {}
    full_name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not full_name:
        errors["full_name"] = "Full name is required."
    if not email or not EMAIL_RE.match(email):
        errors["email"] = "A valid email is required."
    if len(password) < 8:
        errors["password"] = "Password must be at least 8 characters."
    elif not re.search(r"\d", password) or not re.search(r"[^A-Za-z0-9]", password):
        errors["password"] = "Password must include a number and a symbol."

    return errors, {"full_name": full_name, "email": email, "password": password}


def register_user(data):
    errors, clean = validate_register(data)
    if errors:
        return {"errors": errors}, 400

    if User.query.filter_by(email=clean["email"]).first():
        return {"errors": {"email": "An account with this email already exists."}}, 409

    password_hash = bcrypt.generate_password_hash(clean["password"]).decode("utf-8")
    user = User(full_name=clean["full_name"], email=clean["email"], password_hash=password_hash)
    db.session.add(user)
    db.session.commit()

    return {"user": user.to_dict()}, 201


def authenticate_user(data):
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return None, {"errors": {"general": "Email and password are required."}}, 400

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return None, {"errors": {"general": "Invalid email or password."}}, 401

    return user, None, 200

def update_profile(user, data):
    full_name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip().lower()

    errors = {}
    if not full_name:
        errors["full_name"] = "Full name is required."
    if not email or not EMAIL_RE.match(email):
        errors["email"] = "A valid email is required."

    if not errors and email != user.email:
        existing = User.query.filter_by(email=email).first()
        if existing and existing.id != user.id:
            errors["email"] = "An account with this email already exists."

    if errors:
        return None, errors

    user.full_name = full_name
    user.email = email
    db.session.commit()
    return user, None


def change_password(user, data):
    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""

    if not bcrypt.check_password_hash(user.password_hash, current_password):
        return {"current_password": "Current password is incorrect."}

    if len(new_password) < 8 or not re.search(r"\d", new_password) or not re.search(r"[^A-Za-z0-9]", new_password):
        return {"new_password": "Password must be at least 8 characters with a number and a symbol."}

    user.password_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")
    db.session.commit()
    return None