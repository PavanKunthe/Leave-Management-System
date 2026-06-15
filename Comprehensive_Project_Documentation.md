# Complete Project Documentation: Employee Leave Management System

## 1. Project Overview
A full-stack, 3-tier enterprise web application designed to handle employee leave requests with role-based access control (RBAC), automated balance tracking, and a database-driven notification system.

### User Roles
- **Employee**: Apply for leaves, track leave balance, view request history, and cancel pending requests.
- **Admin**: Approve or reject leave requests, view dashboard statistics, and manage employees.

## 2. Architecture Overview
The system follows a typical client-server-database architecture:

- **Frontend (React + Vite)**: Handles the UI. Communicates with the backend via Axios, passing a JWT token for authorization.
- **Backend (FastAPI)**: Contains the core logic and exposes 17 REST API endpoints. Interfaces with the database using the SQLAlchemy ORM.
- **Database (SQLite)**: Stores all persistent data in a local file (`users.db`).

## 3. Technology Stack
- **Frontend**: React, React Router, Axios, Vite
- **Backend**: Python, FastAPI, SQLAlchemy (ORM), Pydantic (validation), Uvicorn (ASGI Server)
- **Database**: SQLite
- **Security/Auth**: JWT (python-jose), bcrypt (password hashing), CORS configured

## 4. Database Schema (5 Tables)
The system uses relational tables connected via Foreign Keys:

1. **`users`**: `id` (PK), `name`, `email` (unique), `password` (hashed), `role` (employee/admin), `department`, `created_at`.
2. **`leave_types`**: Pre-seeded data containing `id`, `name` (Casual/Sick/Earned), `max_days` (12, 10, 15 respectively).
3. **`leave_balance`**: Tracks balances. Links to `user_id` and `leave_type_id`. Contains `used_days` and `remaining`.
4. **`leave_requests`**: Stores the actual leave applications. Contains `start_date`, `end_date`, `total_days`, `reason`, `status` (pending/approved/rejected/cancelled), and `admin_comment`.
5. **`notifications`**: System notifications for users. Contains `message` and `is_read` boolean.

## 5. Security: Authentication & Authorization (RBAC)
- **Password Hashing**: Plain text passwords are never stored. They are hashed using `bcrypt` before being saved to the database.
- **JWT (JSON Web Tokens)**: Upon successful login, the server generates a JWT containing the user's ID and role, signed with a secret key.
- **Axios Interceptors**: The React frontend intercepts every outgoing API request to automatically attach the JWT in the `Authorization` header (`Bearer <token>`).
- **Role-Based Access Control**: Protected routes on the frontend and dependency injection on the backend (`Depends(admin_required)`) ensure that employees cannot access admin pages/APIs.

## 6. Core Business Logic & Validations
When an employee applies for a leave, 4 backend policy checks are executed:
1. **No Past Dates**: `start_date` must be >= today.
2. **Valid Range**: `end_date` must be >= `start_date`.
3. **Sufficient Balance**: The employee's `remaining` days for the selected leave type must be >= the requested `total_days`.
4. **No Overlaps**: The requested dates must not overlap with any existing pending or approved leaves for that user.

### Request Lifecycles
- **On Registration**: The system automatically creates 3 leave balance records for the new user, initialized to the maximum allowed days.
- **On Approve**: Request status changes to `approved`. The user's `leave_balance` is updated (`used_days` increases, `remaining` decreases). A notification is sent.
- **On Reject**: Request status changes to `rejected`. An admin comment is saved. Balances remain untouched. A notification is sent.
- **On Cancel**: Employees can cancel a `pending` request. Balances remain untouched.

## 7. API Endpoints
The backend exposes 17 routes across 4 main areas:

### Auth APIs
- `POST /auth/register`: Create account
- `POST /auth/login`: Authenticate and receive JWT
- `GET /auth/me`: Retrieve current user profile

### Employee APIs
- `GET /leave/types`: List available leave categories
- `GET /leave/balance`: View remaining leave days
- `POST /leave/apply`: Submit a new request
- `GET /leave/my-requests`: View personal history
- `PUT /leave/cancel/{id}`: Cancel a pending request

### Admin APIs
- `GET /admin/dashboard`: Global statistics
- `GET /admin/requests`: List pending requests
- `GET /admin/all-requests`: List all requests
- `GET /admin/employees`: Employee directory and their balances
- `DELETE /admin/employees/{id}`: Remove an employee
- `PUT /admin/approve/{id}`: Approve a request
- `PUT /admin/reject/{id}`: Reject a request

### Notification APIs
- `GET /notifications`: Retrieve unread/read notifications
- `PUT /notifications/read`: Mark all notifications as read

## 8. How to Run Locally

### Backend Setup
```powershell
cd backend
.\myenv\Scripts\activate
uvicorn main:app --reload
```
*API is accessible at `http://localhost:8000` (Swagger Docs at `/docs`)*

### Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```
*App is accessible at `http://localhost:5173`*

### Default Admin Credentials
- **Email**: `admin@company.com`
- **Password**: `admin123`
```
