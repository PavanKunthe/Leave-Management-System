# Cloud-Native Employee Leave Management System

A production-grade, containerized Employee Leave Management System built with React and FastAPI. This project demonstrates advanced cloud-native DevOps practices including Docker, Kubernetes, GitHub Actions CI/CD, Nginx API Gateways, and Prometheus/Grafana observability.

---

## ✨ Application Features (Software Engineering)

*   **Role-Based Access Control (RBAC):** Secure JWT-based authentication distinguishing between `Admin` and `Employee` roles.
*   **Employee Portal:** Employees can submit leave requests, view their historical requests, and check their real-time leave balances.
*   **Admin Dashboard:** Administrators can view all pending organization-wide leave requests and approve/reject them with comments.
*   **Secure Architecture:** Passwords are mathematically hashed (bcrypt), and role assignment is strictly controlled by the backend to prevent privilege escalation.

---

## 🛠️ DevOps & Cloud-Native Architecture

*   **Containerization:** Docker & Docker Compose (Multi-stage builds for minimal image sizes).
*   **API Gateway:** Nginx Reverse Proxy (Routes `/api` to the backend, `/` to the frontend, and completely isolates internal ports from the public internet).
*   **Monitoring & Observability:** Prometheus (metrics scraping) and Grafana (data visualization).
*   **CI/CD:** GitHub Actions (Automated build and test pipelines).
*   **AI Automation:** Automated Webhooks triggered on pipeline execution for AI summarization.
*   **Orchestration:** Kubernetes (Deployments, Services, ConfigMaps, Secrets, Ingress, Persistent Volumes).
*   **Database:** PostgreSQL.

---

## 🏛️ System Architecture

```text
                  [ User Browser ]
                         │
                   ( HTTP Port 80 )
                         │
                         ▼
                [ Nginx API Gateway ]
                ├── /api  ──►  [ Backend Service (FastAPI) ] ◄──┐
                │                     ├── Replicas: 2           │
                │                     └── Health Probes         │
                │                                               │ (Scrapes /metrics)
                └── /     ──►  [ Frontend Service (React) ]     │
                                      ├── Replicas: 2           │
                                      └── SPA Routing           │
                                                                │
                                   [ PostgreSQL Database ]      │
                                              │                 │
                                    (Persistent Storage)        │
                                                                │
                 [ Grafana ] ◄──── [ Prometheus ] ──────────────┘
                (Port 3000)      (Metrics Aggregator)
```

---

## 🐳 Quick Start: Running Locally (Docker Compose)

Get the entire frontend, backend, database, gateway, and monitoring stack up with a single command:

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/PavanKunthe/Leave-Management-System.git
    cd Leave-Management-System
    ```

2.  **Spin up the Containers:**
    ```bash
    docker compose up --build
    ```

3.  **Access the Application:**
    *   **Main Application (Frontend routed via Nginx):** `http://localhost`
    *   **Monitoring Dashboard (Grafana):** `http://localhost:3000` *(Login: admin / admin)*
    *   **Raw Backend API Metrics:** `http://localhost:8000/metrics`
    *   **API Documentation:** `http://localhost/api/docs`

---

## ☸️ Kubernetes Deployment Guide

To deploy this application to a Kubernetes cluster (e.g. AWS EKS, Google Cloud GKE, minikube):

1.  **Create the Namespace:**
    ```bash
    kubectl apply -f k8s/namespace.yaml
    ```

2.  **Deploy Configs and Secrets:**
    *   Generate Base64 encoded values for the secret credentials and inject them into `k8s/secret.yaml`.
    *   Apply configurations:
        ```bash
        kubectl apply -f k8s/configmap.yaml
        kubectl apply -f k8s/secret.yaml
        ```

3.  **Apply Database Storage & Pods:**
    ```bash
    kubectl apply -f k8s/postgres-pv.yaml
    kubectl apply -f k8s/postgres-service.yaml
    kubectl apply -f k8s/postgres-deployment.yaml
    ```

4.  **Deploy the Application Pods (Frontend & Backend):**
    ```bash
    kubectl apply -f k8s/backend-deployment.yaml
    kubectl apply -f k8s/backend-service.yaml
    kubectl apply -f k8s/frontend-deployment.yaml
    kubectl apply -f k8s/frontend-service.yaml
    ```

5.  **Expose the cluster using Ingress:**
    ```bash
    kubectl apply -f k8s/ingress.yaml
    ```

---

## 🚀 CI/CD Pipeline (GitHub Actions)

A fully automated CI/CD pipeline is configured in `.github/workflows/ci-cd.yml`:

*   **Trigger:** Pushes to the `main` branch.
*   **Job 1:** Checks out the code and builds the Backend Docker image to ensure the Python environment compiles successfully.
*   **Job 2:** Builds the Frontend Docker image to ensure the Node.js React bundle compiles successfully.
*   **Job 3:** Fires an external Webhook (N8n) to trigger downstream AI automation pipelines based on the job status.

---

## 🔑 Default Credentials

Use the following seeded administrator credentials for the initial login check:

*   **Admin Email:** `admin@company.com`
*   **Admin Password:** `admin123`
