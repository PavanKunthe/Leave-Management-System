from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
import hashlib
from jose import JWTError, jwt
from datetime import date, datetime, timedelta
from typing import Optional
import os
from dotenv import load_dotenv
from prometheus_fastapi_instrumentator import Instrumentator

# ─── Load Environment Variables ───────────────────────────────────────────────
load_dotenv()

# ─── Database ─────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./leave_management.db")

# SQLite needs check_same_thread=False; PostgreSQL does not
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ─── JWT Config ───────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "leave-management-secret-2026")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
TOKEN_EXPIRE_HOURS = int(os.getenv("TOKEN_EXPIRE_HOURS", "24"))

# ─── Password Hashing ─────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

# ─── SQLAlchemy Models ────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String)
    email      = Column(String, unique=True, index=True)
    password   = Column(String)
    role       = Column(String, default="employee")   # "employee" | "admin"
    department = Column(String, default="General")
    created_at = Column(DateTime, default=datetime.utcnow)

    leave_requests = relationship("LeaveRequest", back_populates="user")
    leave_balances = relationship("LeaveBalance",  back_populates="user")
    notifications  = relationship("Notification",  back_populates="user")


class LeaveType(Base):
    __tablename__ = "leave_types"
    id       = Column(Integer, primary_key=True)
    name     = Column(String)
    max_days = Column(Integer)

    requests = relationship("LeaveRequest", back_populates="leave_type")
    balances = relationship("LeaveBalance",  back_populates="leave_type")


class LeaveBalance(Base):
    __tablename__ = "leave_balance"
    id            = Column(Integer, primary_key=True)
    user_id       = Column(Integer, ForeignKey("users.id"))
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"))
    used_days     = Column(Integer, default=0)
    remaining     = Column(Integer)

    user       = relationship("User",      back_populates="leave_balances")
    leave_type = relationship("LeaveType", back_populates="balances")


class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    id            = Column(Integer, primary_key=True)
    user_id       = Column(Integer, ForeignKey("users.id"))
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"))
    start_date    = Column(Date)
    end_date      = Column(Date)
    total_days    = Column(Integer)
    reason        = Column(String)
    status        = Column(String, default="pending")   # pending|approved|rejected|cancelled
    admin_comment = Column(String, nullable=True)
    applied_on    = Column(DateTime, default=datetime.utcnow)

    user       = relationship("User",      back_populates="leave_requests")
    leave_type = relationship("LeaveType", back_populates="requests")


class Notification(Base):
    __tablename__ = "notifications"
    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"))
    message    = Column(String)
    is_read    = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


Base.metadata.create_all(bind=engine)

# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(title="Leave Management API", version="1.0.0")

# Setup Prometheus Instrumentator
Instrumentator().instrument(app).expose(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic Schemas ─────────────────────────────────────────────────────────
class RegisterSchema(BaseModel):
    name:       str
    email:      str
    password:   str
    role:       str = "employee"
    department: str = "General"

class LoginSchema(BaseModel):
    email:    str
    password: str

class LeaveApplySchema(BaseModel):
    leave_type_id: int
    start_date:    date
    end_date:      date
    reason:        str

class RejectSchema(BaseModel):
    comment: str

# ─── Helpers ──────────────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    token = authorization[7:]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def admin_required(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def create_notification(db: Session, user_id: int, message: str):
    db.add(Notification(user_id=user_id, message=message))
    db.commit()

# ─── Seed Data ────────────────────────────────────────────────────────────────
def seed():
    db = SessionLocal()
    try:
        if db.query(LeaveType).count() == 0:
            db.add_all([
                LeaveType(name="Casual Leave",  max_days=12),
                LeaveType(name="Sick Leave",    max_days=10),
                LeaveType(name="Earned Leave",  max_days=15),
            ])
            db.commit()

        if not db.query(User).filter(User.email == "admin@company.com").first():
            admin = User(
                name="Admin", email="admin@company.com",
                password=hash_password("admin123"),
                role="admin", department="HR"
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()

seed()

# ─── Auth Routes ──────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "Leave Management API is running"}

@app.post("/auth/register", status_code=201)
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=data.name, email=data.email,
        password=hash_password(data.password),
        role="employee", department=data.department    # Always register as employee (admin created via seed only)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    # Give the new user a balance for each leave type
    for lt in db.query(LeaveType).all():
        db.add(LeaveBalance(user_id=user.id, leave_type_id=lt.id, used_days=0, remaining=lt.max_days))
    db.commit()
    return {"message": "Registered successfully"}

@app.post("/auth/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    token = create_token({"sub": str(user.id), "role": user.role})
    return {
        "token": token,
        "user": {"id": user.id, "name": user.name, "email": user.email,
                 "role": user.role, "department": user.department}
    }

@app.get("/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "name": current_user.name,
            "email": current_user.email, "role": current_user.role,
            "department": current_user.department}

# ─── Leave Types ──────────────────────────────────────────────────────────────
@app.get("/leave/types")
def get_leave_types(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [{"id": t.id, "name": t.name, "max_days": t.max_days} for t in db.query(LeaveType).all()]

# ─── Employee Routes ──────────────────────────────────────────────────────────
@app.get("/leave/balance")
def leave_balance(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    balances = db.query(LeaveBalance).filter(LeaveBalance.user_id == current_user.id).all()
    return [{"id": b.id, "leave_type": b.leave_type.name,
             "max_days": b.leave_type.max_days, "used_days": b.used_days,
             "remaining": b.remaining} for b in balances]

@app.post("/leave/apply")
def apply_leave(data: LeaveApplySchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()

    # Policy 1 – no past dates
    if data.start_date < today:
        raise HTTPException(status_code=400, detail="Cannot apply leave for past dates")

    # Policy 2 – valid range
    if data.end_date < data.start_date:
        raise HTTPException(status_code=400, detail="End date must be after start date")

    total_days = (data.end_date - data.start_date).days + 1

    # Policy 3 – balance check
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.user_id == current_user.id,
        LeaveBalance.leave_type_id == data.leave_type_id
    ).first()
    if not balance or balance.remaining < total_days:
        avail = balance.remaining if balance else 0
        raise HTTPException(status_code=400, detail=f"Insufficient balance. Available: {avail} days")

    # Policy 4 – overlap check
    overlap = db.query(LeaveRequest).filter(
        LeaveRequest.user_id == current_user.id,
        LeaveRequest.status.in_(["pending", "approved"]),
        LeaveRequest.start_date <= data.end_date,
        LeaveRequest.end_date   >= data.start_date,
    ).first()
    if overlap:
        raise HTTPException(status_code=400, detail="You already have a leave overlapping these dates")

    req = LeaveRequest(
        user_id=current_user.id, leave_type_id=data.leave_type_id,
        start_date=data.start_date, end_date=data.end_date,
        total_days=total_days, reason=data.reason, status="pending"
    )
    db.add(req)
    db.commit()

    # Notify admin
    admin = db.query(User).filter(User.role == "admin").first()
    if admin:
        create_notification(db, admin.id,
            f"📋 New leave request from {current_user.name} — {total_days} day(s)")
    return {"message": "Leave request submitted successfully"}

@app.get("/leave/my-requests")
def my_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reqs = db.query(LeaveRequest).filter(
        LeaveRequest.user_id == current_user.id
    ).order_by(LeaveRequest.applied_on.desc()).all()
    return [{
        "id": r.id, "leave_type": r.leave_type.name,
        "start_date": str(r.start_date), "end_date": str(r.end_date),
        "total_days": r.total_days, "reason": r.reason,
        "status": r.status, "admin_comment": r.admin_comment,
        "applied_on": str(r.applied_on.date())
    } for r in reqs]

@app.put("/leave/cancel/{request_id}")
def cancel_leave(request_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(LeaveRequest).filter(
        LeaveRequest.id == request_id,
        LeaveRequest.user_id == current_user.id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be cancelled")
    req.status = "cancelled"
    db.commit()
    return {"message": "Leave cancelled"}

# ─── Admin Routes ─────────────────────────────────────────────────────────────
@app.get("/admin/dashboard")
def admin_dashboard(current_user: User = Depends(admin_required), db: Session = Depends(get_db)):
    today = date.today()
    on_leave = db.query(LeaveRequest).filter(
        LeaveRequest.status == "approved",
        LeaveRequest.start_date <= today,
        LeaveRequest.end_date   >= today,
    ).all()
    return {
        "pending":          db.query(LeaveRequest).filter(LeaveRequest.status == "pending").count(),
        "approved":         db.query(LeaveRequest).filter(LeaveRequest.status == "approved").count(),
        "rejected":         db.query(LeaveRequest).filter(LeaveRequest.status == "rejected").count(),
        "total_employees":  db.query(User).filter(User.role == "employee").count(),
        "on_leave_today":  [{"name": r.user.name, "department": r.user.department,
                              "leave_type": r.leave_type.name, "end_date": str(r.end_date)}
                            for r in on_leave],
        "on_leave_count":  len(on_leave),
    }

@app.get("/admin/requests")
def pending_requests(current_user: User = Depends(admin_required), db: Session = Depends(get_db)):
    reqs = db.query(LeaveRequest).filter(
        LeaveRequest.status == "pending"
    ).order_by(LeaveRequest.applied_on.desc()).all()
    return [{
        "id": r.id, "employee_name": r.user.name,
        "employee_email": r.user.email, "department": r.user.department,
        "leave_type": r.leave_type.name,
        "start_date": str(r.start_date), "end_date": str(r.end_date),
        "total_days": r.total_days, "reason": r.reason,
        "applied_on": str(r.applied_on.date())
    } for r in reqs]

@app.get("/admin/all-requests")
def all_requests(current_user: User = Depends(admin_required), db: Session = Depends(get_db)):
    reqs = db.query(LeaveRequest).order_by(LeaveRequest.applied_on.desc()).all()
    return [{
        "id": r.id, "employee_name": r.user.name, "department": r.user.department,
        "leave_type": r.leave_type.name,
        "start_date": str(r.start_date), "end_date": str(r.end_date),
        "total_days": r.total_days, "status": r.status,
        "admin_comment": r.admin_comment, "applied_on": str(r.applied_on.date())
    } for r in reqs]

@app.get("/admin/employees")
def all_employees(current_user: User = Depends(admin_required), db: Session = Depends(get_db)):
    users = db.query(User).filter(User.role == "employee").all()
    result = []
    for u in users:
        balances = [{"leave_type": b.leave_type.name, "remaining": b.remaining} for b in u.leave_balances]
        result.append({
            "id": u.id, "name": u.name, "email": u.email, "department": u.department, "balances": balances
        })
    return result

@app.delete("/admin/employees/{user_id}")
def drop_employee(user_id: int, current_user: User = Depends(admin_required), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.role == "employee").first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Manually delete dependent records
    db.query(LeaveRequest).filter(LeaveRequest.user_id == user_id).delete()
    db.query(LeaveBalance).filter(LeaveBalance.user_id == user_id).delete()
    db.query(Notification).filter(Notification.user_id == user_id).delete()
    
    db.delete(user)
    db.commit()
    return {"message": "Employee removed successfully"}

@app.put("/admin/approve/{request_id}")
def approve(request_id: int, current_user: User = Depends(admin_required), db: Session = Depends(get_db)):
    req = db.query(LeaveRequest).filter(LeaveRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request is not pending")
    req.status = "approved"
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.user_id       == req.user_id,
        LeaveBalance.leave_type_id == req.leave_type_id
    ).first()
    if balance:
        balance.used_days += req.total_days
        balance.remaining -= req.total_days
    db.commit()
    create_notification(db, req.user_id,
        f"✅ Your {req.leave_type.name} ({req.total_days} days) has been approved!")
    return {"message": "Leave approved"}

@app.put("/admin/reject/{request_id}")
def reject(request_id: int, data: RejectSchema, current_user: User = Depends(admin_required), db: Session = Depends(get_db)):
    req = db.query(LeaveRequest).filter(LeaveRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request is not pending")
    req.status        = "rejected"
    req.admin_comment = data.comment
    db.commit()
    create_notification(db, req.user_id,
        f"❌ Your {req.leave_type.name} request was rejected: {data.comment}")
    return {"message": "Leave rejected"}

# ─── Notifications ────────────────────────────────────────────────────────────
@app.get("/notifications")
def get_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(20).all()
    unread = sum(1 for n in notifs if not n.is_read)
    return {
        "unread_count": unread,
        "notifications": [{
            "id": n.id, "message": n.message,
            "is_read": n.is_read, "created_at": str(n.created_at)
        } for n in notifs]
    }

@app.put("/notifications/read")
def mark_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}
