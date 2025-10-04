# NSFW Detector Backend

Backend API untuk aplikasi NSFW Content Detector menggunakan Node.js, Express, dan MySQL.

## 🚀 Features

- **Authentication & Authorization** - JWT-based dengan refresh token
- **NSFW Detection API** - Endpoint untuk analisis konten dari extension
- **User Management** - Registrasi, login, profile management
- **Detection Logging** - Simpan history deteksi dan aksi user
- **Statistics & Reports** - API untuk analytics dashboard
- **Rate Limiting** - Proteksi dari spam requests
- **Security** - Helmet, CORS, validation, dll

## 📦 Tech Stack

- **Framework**: Express.js
- **Database**: MySQL dengan Sequelize ORM
- **Authentication**: JWT (Access + Refresh Token)
- **Validation**: Express Validator
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## 🛠️ Setup Development

### 1. Prerequisites

```bash
# Install Node.js (v18+)
node --version
npm --version

# Install MySQL
mysql --version
```

### 2. Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 3. Environment Configuration

Edit `.env` file:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nsfw_detector
DB_USER=root
DB_PASS=your_password

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# Server
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 4. Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE nsfw_detector;
exit;

# Run migrations (auto-sync in development)
npm run dev
```

### 5. Start Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:5000`

## 📋 API Endpoints

### Authentication

```
POST /api/auth/register     - Register user baru
POST /api/auth/login        - Login user
POST /api/auth/refresh      - Refresh access token
POST /api/auth/logout       - Logout user
GET  /api/auth/profile      - Get user profile
PUT  /api/auth/profile      - Update user profile
GET  /api/auth/verify       - Verify token
```

### Extension (Protected)

```
POST /api/extension/analyze-element  - Analisis image/video
POST /api/extension/log-action       - Log aksi user
GET  /api/extension/detections       - Get detection history
GET  /api/extension/stats            - Get statistics
GET  /api/extension/config           - Get extension config
```

### Health Check

```
GET /health                 - Server health status
```

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── config/             # Database & logger config
│   ├── controllers/        # Request handlers
│   ├── middlewares/        # Auth, error handling, dll
│   ├── models/             # Sequelize models
│   ├── routes/             # Route definitions
│   ├── utils/              # Helper functions
│   ├── app.js              # Express app setup
│   └── server.js           # Server entry point
├── config/                 # Sequelize CLI config
├── logs/                   # Log files
├── .env                    # Environment variables
└── package.json
```

## 🔒 Security Features

- **JWT Authentication** dengan refresh token
- **Password Hashing** menggunakan bcryptjs
- **Rate Limiting** untuk mencegah spam
- **Input Validation** dengan express-validator
- **CORS** configuration
- **Helmet** untuk security headers
- **SQL Injection** protection via Sequelize

## 📊 Database Schema

### Users

- id, name, email, password
- is_active, last_login, email_verified_at
- timestamps

### Detections

- id, user_id, domain, url
- element_type, file_size, detection_level
- confidence_score, action_taken, metadata
- timestamps

### User Sessions

- id, user_id, refresh_token
- device_info, ip_address, user_agent
- is_active, expires_at, timestamps

## 🚀 Production Deployment

1. **Environment Setup**:

   ```bash
   NODE_ENV=production
   # Set production database credentials
   # Set strong JWT_SECRET
   ```

2. **Build & Start**:

   ```bash
   npm start
   ```

3. **Process Manager** (PM2):
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name nsfw-api
   pm2 startup
   pm2 save
   ```

## 🧪 Testing API

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"123456"}'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

### Analyze Element (dengan token)

```bash
curl -X POST http://localhost:5000/api/extension/analyze-element \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"domain":"example.com","url":"https://example.com/image.jpg","elementType":"image"}'
```

## 📝 Notes

- Development mode menggunakan auto-sync database
- Production harus setup migrations manual
- Log files disimpan di folder `logs/`
- Rate limiting: 100 requests per 15 menit per IP
- File upload limit: 10MB

## 🤝 Integration dengan Frontend

Backend ini dirancang untuk berintegrasi dengan:

- **React Frontend** (port 3000)
- **Chrome Extension** (via REST API)

CORS sudah dikonfigurasi untuk development di `localhost:3000`.
