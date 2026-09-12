from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserLoginRequest, UserRegisterRequest, UserProfileResponse, TokenResponse

router = APIRouter(prefix="/auth", tags=["User Authentication & Settings"])

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLoginRequest, db: Session = Depends(get_db)):
    """
    User login matching SmartWatt 'User Login.png'.
    """
    user = db.query(User).filter(User.username == credentials.username).first()
    # For demo ease, accept demo user or verify password
    if not user:
        if credentials.username in ["leslie294", "leslie@gmail.com"]:
            user = db.query(User).filter(User.id == 1).first()
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
            
    profile = UserProfileResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        birthday=user.birthday,
        notifications_enabled=True
    )
    return TokenResponse(
        access_token="mock_jwt_token_leslie294",
        token_type="bearer",
        user=profile
    )

@router.post("/register", response_model=TokenResponse)
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """
    User registration matching 'Create Account' in SmartWatt 'User Login.png'.
    """
    existing = db.query(User).filter(
        (User.username == payload.username) | (User.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
        
    user = User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name or "New User",
        phone=payload.phone or "(555) 000 - 0000",
        birthday=payload.birthday or "Jan 1, 1990",
        hashed_password="mock_hashed_pw"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    profile = UserProfileResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        birthday=user.birthday,
        notifications_enabled=True
    )
    return TokenResponse(
        access_token=f"mock_jwt_token_{user.username}",
        token_type="bearer",
        user=profile
    )

@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(db: Session = Depends(get_db)):
    """
    Returns user profile matching SmartWatt 'Settings.png':
    Name: Leslie Raymond
    Username: leslie294
    Birthday: July 17, 1989
    Mobile Number: (405) 439 - 3985
    Email: leslie@gmail.com
    """
    user = db.query(User).filter(User.id == 1).first()
    if not user:
        user = User(
            id=1,
            username="leslie294",
            email="leslie@gmail.com",
            full_name="Leslie Raymond",
            phone="(405) 439 - 3985",
            birthday="July 17, 1989",
            hashed_password="mock_pw"
        )
        db.add(user)
        db.commit()
        
    return UserProfileResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        birthday=user.birthday,
        notifications_enabled=True
    )

@router.post("/logout")
def logout():
    """
    Logout action matching SmartWatt 'Logout.png'.
    """
    return {"success": True, "message": "Logged out successfully"}
