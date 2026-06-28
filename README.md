# Cloud-Native Employee Leave Management System

A production-grade, containerized Employee Leave Management System deployed using cloud-native DevOps practices including Docker, Docker Compose, Kubernetes, and GitHub Actions CI/CD.

---

## 🏛️ Application Architecture

```
                 [ User Browser ]
                        │
                  ( HTTP Port 80 )
                        │
                        ▼
               [ Nginx Ingress Route ]
               ├── /api  ──►  [ Backend Service (Port 8000) ]
               │                     ├── Replicas: 2
               │                     └── Health Probes: Liveness & Readiness
               │
               └── /     ──►  [ Frontend Service (Port 80) ]
                                     ├── Replicas: 2
                                     └── SPA Routing (Nginx Server)
                                     
                                     Backend Services
                                             │
                                             ▼
                                  [ PostgreSQL Service ]
                                             │
                                   (Persistent Storage)
                                             │
                                             ▼
                                     [ postgres-pvc ]
```

---

## 🛠️ DevOps Tech Stack

*   **Containerization:** Docker, Docker Compose (Multi-stage builds)
*   **Orchestration:** Kubernetes (Deployments, Services, ConfigMaps, Secrets, StatefulSets, Ingress, Persistent Volumes)
*   **CI/CD:** GitHub Actions
*   **Web Server / Reverse Proxy:** Nginx (custom routing configuration for React single-page app)
*   **Database:** PostgreSQL (with persistent volumes)
*   **Backend Framework:** FastAPI (Python)
*   **Frontend Library:** React (Vite)

---

## 📁 Repository Structure

```
leave-management/
├── frontend/
│   ├── src/                    # React codebase
│   ├── Dockerfile              # Multi-stage container builds (Node -> Nginx)
│   ├── nginx.conf              # SPA-routing and API-reverse-proxy configuration
│   └── package.json
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── Dockerfile              # Python slim image build instructions
│   ├── .env.example            # Environment variables template
│   └── requirements.txt
├── k8s/                        # Kubernetes manifest configurations
│   ├── namespace.yaml          # Isolated namespace config
│   ├── configmap.yaml          # App non-secret configs
│   ├── secret.yaml             # Credentials (encoded)
│   ├── postgres-pv.yaml        # Persistent volume claim for database durability
│   ├── postgres-deployment.yaml# Postgres StatefulSet and Service
│   ├── postgres-service.yaml
│   ├── backend-deployment.yaml # Two replica backend pods with health checks
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml# Two replica frontend pods
│   ├── frontend-service.yaml
│   └── ingress.yaml            # Host/Path router
├── .github/
│   └── workflows/
│       └── ci-cd.yml           # GitHub Actions test, build, and publish workflow
└── docker-compose.yml          # Local multi-container development orchestration
```

---

## 🐳 Quick Start: Running Locally (Docker Compose)

Get the entire frontend, backend, and PostgreSQL database up with a single command:

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
    *   **Frontend:** `http://localhost:3000`
    *   **Backend API:** `http://localhost:8000`
    *   **API Documentation:** `http://localhost:8000/docs`

---

## ☸️ Kubernetes Deployment Guide

To deploy this application to a Kubernetes cluster (e.g. AWS EKS, Google Cloud GKE, minikube, or Docker Desktop Kubernetes):

1.  **Create the Namespace:**
    ```bash
    kubectl apply -f k8s/namespace.yaml
    ```

2.  **Deploy Configs and Secrets:**
    *   Generate Base64 encoded values for the secret credentials (e.g. `[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("yourpassword"))` on Windows Powershell).
    *   Inject them into `k8s/secret.yaml`.
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

```
               [ Push to main / Open PR ]
                           │
                           ▼
                  [ Job 1: Build Test ]
         ├── Setup Python & check server dependencies
         └── Setup Node.js & build frontend bundle
                           │
                 (If successful push)
                           │
                           ▼
               [ Job 2: Build & Push Images ]
         ├── Authenticate against Docker Hub
         └── Build and push tagged frontend & backend images
```

To configure this for your own Docker Hub:
1. Add `DOCKER_USERNAME` and `DOCKER_PASSWORD` to your GitHub Repository Secrets (**Settings -> Secrets and variables -> Actions**).
2. The workflow will automatically publish new container images to Docker Hub on every push to the `main` branch.

---

## 🔑 Default Credentials

Use the following seeded administrator credentials for the initial login check:

*   **Admin Email:** `admin@company.com`
*   **Admin Password:** `admin123`
