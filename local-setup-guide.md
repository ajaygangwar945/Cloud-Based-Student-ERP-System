# Local Setup & Developer Guide — Student ERP System

Your Cloud-Based Student ERP System has been successfully configured and launched locally using **Option 1: Docker Compose**. This runs all components (MySQL, Express Backend, and React Frontend) inside containerized services, mimicking your cloud infrastructure while exposing necessary ports to your local host.

---

## 🚀 Port Mappings & Services

Here is where each service can be accessed on your local machine:

| Component | Service Name | Internal Port | Local (Host) URL / Port | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `erp-frontend` | `5173` | [http://localhost:5173](http://localhost:5173) | Vite + React.js Web Application |
| **Backend** | `erp-backend` | `5000` | [http://localhost:5000](http://localhost:5000) | Node.js + Express REST API Server |
| **Database** | `erp-mysql` | `3306` | `localhost:3307` | MySQL 8.0 Relational Database |

---

## 🔑 Pre-Seeded Demo Accounts

The local database has been fully initialized and pre-seeded with sample records (departments, students, faculty, attendance, marks, and fees). You can log in using these demo credentials:

*   **Admin Dashboard:**
    *   **Username:** `admin_user`
    *   **Password:** `password123`
*   **Student Portal:**
    *   **Username:** `student_john`
    *   **Password:** `password123`
*   **Faculty Portal:**
    *   **Username:** `faculty_smith`
    *   **Password:** `password123`

---

## 🛠️ How to Manage Your Local Stack

Since you prefer not to use batch scripts, you can run these simple commands directly in your PowerShell or terminal from the project's root folder:

### 1. Start the entire ERP system
To spin up all containers in the background, run:
```powershell
docker compose up -d
```

### 2. Stop the entire ERP system
To stop all services and keep the database volume intact, run:
```powershell
docker compose down
```

### 3. Reset the database completely (Wipe & Re-seed)
If you want to clear out any simulated data and restore the original seeded records, run:
```powershell
docker compose down -v
docker compose up -d
```
> [!WARNING]
> This will destroy your local MySQL database volume and re-run the `init.sql` script on next boot.

### 4. View Real-time Logs
To stream live logs from all services, run:
```powershell
docker compose logs -f
```
Or view logs for a specific service (e.g., the backend):
```powershell
docker compose logs -f backend
```

---

## 🔍 Architecture & Connection Flow

The system interacts dynamically just as it does in your Kubernetes cloud cluster:

1.  **Vite Frontend** loads on [http://localhost:5173](http://localhost:5173). It detects the hostname `localhost` and routes API requests to the backend API at `http://localhost:5000`.
2.  **Express Backend** handles business logic and routes requests to the database service named `mysql` within the Docker internal network.
3.  **MySQL Database** runs on the internal port `3306`, initialized by [database/init.sql](file:///c:/Users/ajayg/College/SEM%206/INT%20377/Project/Cloud-Based-Student-ERP-System/database/init.sql). It exposes port `3307` externally, allowing you to connect standard database clients (like DBeaver or MySQL Workbench) using:
    *   **Host:** `localhost`
    *   **Port:** `3307`
    *   **User:** `root`
    *   **Password:** `2112`
    *   **Database:** `student_erp`
