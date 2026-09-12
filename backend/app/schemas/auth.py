from typing import Optional
from pydantic import BaseModel, EmailStr

class UserLoginRequest(BaseModel):
    username: str
    password: str

class UserRegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = "Leslie Raymond"
    phone: Optional[str] = "(405) 439 - 3985"
    birthday: Optional[str] = "July 17, 1989"

class UserProfileResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    phone: str
    birthday: str
    notifications_enabled: bool = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse
