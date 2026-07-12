# EcoSphere ESG Management Platform

EcoSphere is a comprehensive, production-style ESG (Environmental, Social, Governance) Management Platform that helps organizations calculate and track carbon emissions, monitor sustainability goals, manage CSR activities, audit compliance directives, and engage employees via gamification metrics (XP/Badges).

---

## 🛠️ Technology Stack
* **Backend:** Node.js, Express, MongoDB (Mongoose), JWT Session Cookies, `node-cron`, `json2csv`, `pdfkit`.
* **Frontend:** React, Vite, React Router v6, Tailwind CSS, Recharts, Lucide Icons, React Hot Toast.

---

## 🚀 Setup & Execution Guide

Follow these steps to run both the backend server and frontend application locally:

### 1. Database Configuration
Ensure you have a MongoDB instance running locally (default: `mongodb://127.0.0.1:27017/ecosphere`) or configure a cloud connection URI.

### 2. Environment Configuration
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ecosphere
JWT_SECRET=super_secret_esg_jwt_key_987654321
JWT_EXPIRE=24h
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Backend Setup & Data Seeding
Open your terminal, navigate to the `backend` folder, install packages, and seed the demo data:
```bash
cd backend
npm install
npm run seed
```
This drops the database, registers 4 demo roles (Admin, Manager, Employee, Auditor), creates electricity/fuel emission factors, sets up historical scorecard charts, and publishes policy documents.

**Demo Login Credentials:**
* **Administrator:** `admin@ecosphere.com` / `Admin@123`
* **ESG Manager:** `manager@ecosphere.com` / `Manager@123`
* **Jane Employee:** `employee@ecosphere.com` / `Employee@123`
* **Audit Reviewer:** `auditor@ecosphere.com` / `Auditor@123`

### 4. Run Backend Server
```bash
npm run dev
# or
npm start
```
The API server will listen on `http://localhost:5000`. Daily cron jobs (compliance alerts, goal limits checking, scores calculations) will automatically schedule.

### 5. Frontend Setup & Run
Open a second terminal window, navigate to the `frontend` folder, install packages, and boot up the Vite dev client:
```bash
cd ../frontend
npm install
npm run dev
```
The React frontend client will start on `http://localhost:5173`. Proxies for `/api` and `/uploads` requests to the local backend are pre-configured.

---

## 🌟 Key Features
1. **Weighted ESG Index Score:** Dynamically computed compound scores based on custom ESG configuration percentages (e.g. 40% E, 30% S, 30% G) configured dynamically inside settings.
2. **Tabular Carbon Tracker:** Raw log inputs (electricity, travel flights, combustion fuels) computed dynamically against verified DEFRA/IEA emission factors to output equivalent kgCO2e.
3. **Audit Compliance Flow:** Audits mapped to specific compliance issues with remediation deadline warnings and reviewer approvals.
4. **Gamification Ranks:** Complete CSR activities or challenges to gain XP, climb the organization leaderboard, unlock achievements badges, and redeem points for sustainable gifts.
5. **PDF & CSV Exporters:** Clean on-demand table data generation using `json2csv` and structural PDF documents built with `pdfkit`.
