from __future__ import annotations
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import User
from app.auth.service import hash_password, verify_password, create_access_token
from app.auth.schemas import RegisterRequest, LoginRequest, UserResponse, TokenResponse, UpdateProfileRequest
from app.auth.dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        logger.warning("注册失败: 邮箱已注册 %s / Registration failed: email already registered %s", req.email, req.email)
        raise HTTPException(status_code=400, detail="邮箱已注册 / Email already registered")
    if db.query(User).filter(User.username == req.username).first():
        logger.warning("注册失败: 用户名已占用 %s / Registration failed: username already taken %s", req.username, req.username)
        raise HTTPException(status_code=400, detail="用户名已被占用 / Username already taken")

    user = User(
        username=req.username,
        email=req.email,
        hashed_password=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.role)
    logger.info("用户注册成功: %s (id=%d) / User registered: %s (id=%d)", user.username, user.id, user.username, user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        logger.warning("登录失败: 邮箱或密码错误 %s / Login failed: invalid email or password %s", req.email, req.email)
        raise HTTPException(status_code=401, detail="邮箱或密码错误 / Invalid email or password")
    if not user.is_active:
        logger.warning("登录失败: 账号已停用 %s (id=%d) / Login failed: account deactivated %s (id=%d)", user.email, user.id, user.email, user.id)
        raise HTTPException(status_code=403, detail="账号已停用 / Account is deactivated")

    token = create_access_token(user.id, user.role)
    logger.info("用户登录成功: %s (id=%d) / User logged in: %s (id=%d)", user.username, user.id, user.username, user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
def update_me(req: UpdateProfileRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req.username and req.username != current_user.username:
        if db.query(User).filter(User.username == req.username).first():
            raise HTTPException(status_code=400, detail="用户名已被占用 / Username already taken")
        current_user.username = req.username
    if req.email and req.email != current_user.email:
        if db.query(User).filter(User.email == req.email).first():
            raise HTTPException(status_code=400, detail="邮箱已注册 / Email already registered")
        current_user.email = req.email
    if req.mimo_api_key is not None:
        current_user.mimo_api_key = req.mimo_api_key

    db.commit()
    db.refresh(current_user)
    logger.info("用户资料已更新: %s (id=%d) / User profile updated: %s (id=%d)", current_user.username, current_user.id, current_user.username, current_user.id)
    return UserResponse.model_validate(current_user)
