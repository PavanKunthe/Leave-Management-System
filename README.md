# Employee Leave Management System
## Project Documentation

---

## What Is This Project?

A full-stack web application with two roles:
- **Employee** — apply for leaves, track balance, view history
- **Admin** — approve/reject requests, view dashboard stats

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + React Router + Axios |
| Backend | FastAPI + SQLAlchemy |
| Database | SQLite |
| Auth | JWT (python-jose) + bcrypt |

---

## Project Structure

```
leave-management/
├── backend/
│   ├── main.py          ← All APIs (auth + employee + admin + notifications)
│   ├── requirements.txt ← Python dependencies
│   └── myenv/           ← Virtual environment
└── frontend/
    └── src/
        ├── api/axios.js              ← Axios instance with token
        ├── context/AuthContext.jsx   ← Global user state
        ├── components/
        │   ├── Layout.jsx            ← Sidebar + Topbar
        │   ├── ProtectedRoute.jsx    ← Role-based route guard
        │   └── StatusBadge.jsx       ← Colored status pill
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── EmployeeDashboard.jsx
            ├── ApplyLeave.jsx
            ├── MyRequests.jsx
            ├── AdminDashboard.jsx
            └── ManageRequests.jsx
```

---

## Database Tables (5)

1. **users** — id, name, email, password (hashed), role, department
2. **leave_types** — id, name (Casual/Sick/Earned), max_days
3. **leave_balance** — id, user_id, leave_type_id, used_days, remaining
4. **leave_requests** — id, user_id, leave_type_id, start_date, end_date, total_days, reason, status, admin_comment
5. **notifications** — id, user_id, message, is_read, created_at

---

## API Routes

### Auth
- `POST /auth/register` — Create account
- `POST /auth/login` — Login → returns JWT token
- `GET /auth/me` — Get current user info

### Employee
- `GET /leave/types` — Get all leave types
- `GET /leave/balance` — My remaining days per type
- `POST /leave/apply` — Submit leave request
- `GET /leave/my-requests` — All my requests
- `PUT /leave/cancel/{id}` — Cancel pending request

### Admin
- `GET /admin/dashboard` — Stats + who's on leave today
- `GET /admin/requests` — All pending requests
- `GET /admin/all-requests` — All requests (any status)
- `PUT /admin/approve/{id}` — Approve → deduct balance
- `PUT /admin/reject/{id}` — Reject → save reason

### Notifications
- `GET /notifications` — My notifications + unread count
- `PUT /notifications/read` — Mark all as read

---

## Business Logic (Key Rules)

### Apply Leave (3 Policy Checks):
1. `start_date >= today` — no past dates
2. No overlapping pending/approved leave
3. `remaining >= total_days` — enough balance

### Approve Leave:
- Status → "approved"
- `balance.used_days += total_days`
- `balance.remaining -= total_days`
- Notify employee

### Reject Leave:
- Status → "rejected"
- Save admin_comment
- Do NOT touch balance
- Notify employee

### Cancel Leave:
- Only if status = "pending"
- Status → "cancelled"
- Balance unchanged

---

## How to Run

### Backend
```powershell
cd C:\Users\Win\Desktop\leave-management\backend
.\myenv\Scripts\uvicorn main:app --reload
```
Opens at: http://localhost:8000
API docs: http://localhost:8000/docs

### Frontend
```powershell
cd C:\Users\Win\Desktop\leave-management\frontend
npm run dev
```
Opens at: http://localhost:5173

---

## Default Admin Account
- Email: `admin@company.com`
- Password: `admin123`

---

## Resume Line

> "Developed a full-stack Employee Leave Management System with role-based access control, automated balance tracking, and a DB-driven notification system using React, FastAPI, and SQLAlchemy."

---

## Interview Explanation

**One-liner:**
> "I built a Leave Management System where employees apply for leaves and admins approve or reject them, with automatic balance tracking and role-based access."

**Technical:**
> "The backend uses FastAPI with SQLAlchemy — 5 related tables connected via foreign keys. JWT tokens carry the user's role. When an admin approves a request, the backend automatically deducts from the employee's leave balance. I also implemented 3 policy checks on the backend to prevent invalid applications."
