# RideFlow Complete Production Deployment Guide 🚀

This document covers all options for taking **RideFlow** from your local machine to live public production on the internet.

---

## Architecture Overview

* **Frontend**: React SPA (Single Page Application)
* **Backend**: Spring Boot 3.2.x (Java 17/21) REST API
* **Database**: MongoDB (Local or MongoDB Atlas Cloud)
* **Mail Service**: Gmail SMTP with App Password (`kengarritesh3@gmail.com`)

---

## 🌟 Method 1: Free Cloud Deployment (Recommended)

Deploy everything for free using **MongoDB Atlas + Render (Backend) + Vercel (Frontend)**.

```text
[ Users & Drivers ]
        │
        ▼ (HTTPS)
 [ Vercel: React Frontend ]
        │
        ▼ (REST API / HTTPS)
 [ Render: Spring Boot Backend ]
        │
        ▼ (MongoDB Wire Protocol)
 [ MongoDB Atlas Cloud Database ]
```

---

### Step 1: Create Free Cloud Database (MongoDB Atlas)

1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and register for a free account.
2. Click **Create Deployment** and choose the **M0 Free Tier** (512 MB storage, shared cluster).
3. Under **Security Quickstart**:
   * Create a database user (e.g., Username: `rideflow_admin`, Password: `YourStrongPassword123!`).
   * Under **Network Access**, add IP `0.0.0.0/0` (Allow Access from Anywhere) so Render can reach it.
4. Click **Connect** > **Drivers** > copy your connection string:
   ```text
   mongodb+srv://rideflow_admin:YourStrongPassword123!@cluster0.abcde.mongodb.net/rideflow?retryWrites=true&w=majority
   ```

---

### Step 2: Push Your Project to GitHub

Initialize Git in `C:\Users\shrad\Desktop\RideFlow` if not already done:

```bash
git init
git add .
git commit -m "RideFlow production release with full-stack capabilities"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/RideFlow.git
git push -u origin main
```

*(Note: Secrets inside `.env` are automatically ignored by `.gitignore`)*

---

### Step 3: Deploy Backend on Render (Free)

1. Sign in to [https://render.com](https://render.com) using your GitHub account.
2. Click **New +** > **Web Service**.
3. Select your **RideFlow** GitHub repository.
4. Configure service settings:
   * **Name**: `rideflow-backend`
   * **Region**: Oregon (or Singapore / Frankfurt closest to your users)
   * **Root Directory**: `backend`
   * **Runtime**: `Docker` (Render will automatically detect `backend/Dockerfile`)
     * *Or using Java Native*:
       * **Runtime**: `Java`
       * **Build Command**: `./mvnw clean package -DskipTests` (or `mvn clean package -DskipTests`)
       * **Start Command**: `java -jar target/rideflow-backend-0.0.1-SNAPSHOT.jar`
   * **Instance Type**: `Free`
5. Click **Environment Variables** and add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `RIDEFLOW_MONGODB_URI` | `mongodb+srv://...` | Your Atlas MongoDB URI from Step 1 |
| `RIDEFLOW_ADMIN_EMAIL` | `admin@rideflow.com` | Fixed admin login email |
| `RIDEFLOW_ADMIN_PASSWORD` | `Admin@123` | Secure admin login password |
| `RIDEFLOW_ENCRYPTION_KEY` | `RideFlowSuperSecure256BitKey!Dev` | 256-bit encryption key |
| `RIDEFLOW_EMAIL_HOST` | `smtp.gmail.com` | Gmail SMTP host |
| `RIDEFLOW_EMAIL_PORT` | `587` | STARTTLS port |
| `RIDEFLOW_EMAIL_USERNAME` | `kengarritesh3@gmail.com` | Your configured email |
| `RIDEFLOW_EMAIL_PASSWORD` | `xmbpffvzgzyyphip` | Your Google App Password |

6. Click **Deploy Web Service**.
7. Once deployed, copy your public backend URL (e.g. `https://rideflow-backend.onrender.com`).

---

### Step 4: Deploy Frontend on Netlify (Free)

#### Option A: Drag & Drop (Fastest — 30 Seconds)
1. Go to **[https://app.netlify.com/drop](https://app.netlify.com/drop)** and log in.
2. In File Explorer, navigate to:
   ```text
   C:\Users\shrad\Desktop\RideFlow\frontend
   ```
3. Drag the **`build`** folder into the browser drop box.
4. Netlify immediately publishes your live site with HTTPS and a free domain:
   ```text
   https://rideflow-xxxx.netlify.app
   ```
5. In Netlify Site Settings > **Environment Variables**, add:
   * **Key**: `REACT_APP_API_URL`
   * **Value**: `https://rideflow-backend.onrender.com/api` *(Your Render backend URL)*

#### Option B: Connect via GitHub (Continuous Deployment)
1. Sign in to **[https://app.netlify.com](https://app.netlify.com)**.
2. Click **Add new site** > **Import an existing project** > **GitHub**.
3. Select your **RideFlow** repository.
4. Netlify will automatically detect settings from our included `netlify.toml`:
   * **Base directory**: `frontend`
   * **Build command**: `npm run build`
   * **Publish directory**: `frontend/build`
5. Click **Add environment variable**:
   * **Key**: `REACT_APP_API_URL`
   * **Value**: `https://rideflow-backend.onrender.com/api`
6. Click **Deploy RideFlow**.

---

### Step 5: (Optional) Alternative Frontend on Vercel

If you also wish to deploy on Vercel:
1. Sign in to [https://vercel.com](https://vercel.com) using GitHub.
2. Click **Add New...** > **Project** and select **RideFlow**.
3. Set **Root Directory** to `frontend`.
4. Add environment variable: `REACT_APP_API_URL=https://rideflow-backend.onrender.com/api`.
5. Click **Deploy**.

---

## 🐳 Method 2: Docker Compose (Single VPS / Cloud Server)

If you have a Linux VPS (AWS EC2, DigitalOcean Droplet, Linode, Hostinger VPS, or Ubuntu Server):

1. **Install Docker & Docker Compose on your server**:
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-v2
   ```

2. **Clone your repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/RideFlow.git
   cd RideFlow
   ```

3. **Start the complete stack**:
   ```bash
   docker compose up -d --build
   ```

This spins up:
* `rideflow-mongodb` on port `27017` with persistent data volume
* `rideflow-backend` on port `8080`
* `rideflow-frontend` with Nginx on port `3000`

---

## 🛡️ Production Security Checklist

* [x] **Password Hashing**: Passwords stored as one-way BCrypt hashes.
* [x] **CORS Configuration**: Handles production origins and pre-flight requests.
* [x] **Dynamic Port Binding**: `server.port=${PORT:8080}` adapts to cloud hosts.
* [x] **Protected API Base**: `process.env.REACT_APP_API_URL` allows instant pointing to production backend.
* [x] **SPA Routing Rewrites**: Pre-configured `vercel.json` and `_redirects` prevent 404s on browser reload.
* [x] **Driver & Customer Privacy**: Phone masking enforced at API level until driver accepts ride.
