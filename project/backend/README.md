# NSFW Detection Backend API

A comprehensive REST API backend for the NSFW Content Detection system, built with Node.js, Express, and MySQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens
- **Real-time Detection**: Queue-based image analysis with NudeNet AI
- **Analytics Dashboard**: Comprehensive statistics and reporting
- **Activity Logging**: Detailed user activity tracking
- **Rate Limiting**: Built-in protection against abuse
- **Data Export**: CSV/JSON export functionality
- **Admin Features**: System monitoring and management
- **Scalable Architecture**: Queue system for processing heavy workloads

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Chrome Extension│───▶│  Backend API    │───▶│   NudeNet AI    │
│                 │    │                 │    │    Service      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   MySQL DB      │
                       │                 │
                       └─────────────────┘
```

## 📋 Prerequisites

- Node.js 16+ and npm
- MySQL 8.0+
- NudeNet AI Service running on port 8000

## 🛠️ Installation

1. **Clone and navigate to backend directory**:

   ```bash
   cd project/backend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment**:

   ```bash
   cp .env.example .env
   # Edit .env with your database and service configurations
   ```

4. **Set up database**:
   ```bash
   # Create database tables and seed with initial data
   npm run reset
   ```

## 🚀 Quick Start

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Database Management

```bash
# Run migrations only
npm run migrate

# Seed database with sample data
npm run seed

# Full reset (migrate + seed)
npm run reset
```

### Testing

```bash
# Run all tests
npm test

# Test specific components
npm run test:api
npm run test:rate
npm run test:error
```

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Detection

- `POST /api/detection/analyze` - Analyze image for NSFW content
- `GET /api/detection/history` - Get detection history
- `GET /api/detection/stats` - Get detection statistics
- `DELETE /api/detection/:id` - Delete detection record

### User Management

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `PUT /api/user/password` - Change password
- `GET /api/user/settings` - Get user settings
- `PUT /api/user/settings` - Update user settings
- `DELETE /api/user/account` - Delete user account

### Analytics

- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics` - Detailed analytics data
- `POST /api/analytics/export` - Export data (CSV/JSON)

### Activity Logs

- `GET /api/activity` - Get activity logs
- `GET /api/activity/stats` - Activity statistics
- `POST /api/activity` - Log new activity
- `DELETE /api/activity/clear` - Clear activity logs

### System

- `GET /api/system/health` - Health check
- `GET /api/system/info` - API information
- `GET /api/system/stats` - System statistics
- `GET /api/system/logs` - Server logs
- `POST /api/system/cache/clear` - Clear cache
- `POST /api/system/cleanup` - Database cleanup

## 🔧 Configuration

### Environment Variables

| Variable          | Description         | Default                 |
| ----------------- | ------------------- | ----------------------- |
| `NODE_ENV`        | Environment mode    | `development`           |
| `PORT`            | Server port         | `3001`                  |
| `DB_HOST`         | MySQL host          | `localhost`             |
| `DB_PORT`         | MySQL port          | `3306`                  |
| `DB_NAME`         | Database name       | `nsfw_detection`        |
| `DB_USER`         | Database user       | `root`                  |
| `DB_PASSWORD`     | Database password   | ``                      |
| `JWT_SECRET`      | JWT secret key      | Required                |
| `NUDENET_API_URL` | NudeNet service URL | `http://localhost:8000` |

### Database Schema

**Users Table**:

- `id`, `email`, `passwordHash`, `firstName`, `lastName`
- `isVerified`, `settings`, `createdAt`, `updatedAt`

**Detections Table**:

- `id`, `userId`, `imageUrl`, `pageUrl`, `domain`
- `riskLevel`, `confidence`, `nudityScores`, `isBlocked`
- `createdAt`, `updatedAt`

**ActivityLogs Table**:

- `id`, `userId`, `type`, `action`, `domain`, `pageUrl`
- `metadata`, `createdAt`, `updatedAt`

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Per-IP request limiting
- **Input Validation**: Comprehensive data validation
- **SQL Injection Protection**: Parameterized queries with Sequelize
- **CORS Configuration**: Configurable cross-origin policies
- **Helmet.js**: Security headers and protection

## 📊 Queue System

The backend uses an in-memory queue system for processing detection requests:

- **Concurrent Processing**: Configurable concurrency limit
- **Retry Logic**: Automatic retry with exponential backoff
- **Status Tracking**: Real-time job status monitoring
- **Error Handling**: Comprehensive error tracking and recovery

## 🧪 Testing

The API includes comprehensive testing utilities:

```bash
# Test all endpoints
npm run test

# Test specific areas
npm run test:api      # API functionality
npm run test:rate     # Rate limiting
npm run test:error    # Error handling
```

## 📈 Monitoring

### Health Check

```bash
curl http://localhost:3001/health
```

### System Statistics

```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:3001/api/system/stats
```

### View Logs

```bash
npm run logs
```

## 🔄 Development Workflow

1. **Start development server**:

   ```bash
   npm run dev
   ```

2. **Make changes to code**

3. **Test your changes**:

   ```bash
   npm run test:api
   ```

4. **Check logs**:
   ```bash
   npm run logs
   ```

## 🚀 Deployment

### Production Setup

1. **Set environment to production**:

   ```bash
   export NODE_ENV=production
   ```

2. **Update environment variables**:

   ```bash
   # Set secure JWT secrets
   # Configure production database
   # Set CORS origins
   ```

3. **Run production server**:
   ```bash
   npm run production
   ```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 📝 API Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional message",
  "pagination": {
    // Pagination info for list endpoints
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -am 'Add new feature'`
5. Push to the branch: `git push origin feature/new-feature`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Check the API documentation at `/api/system/info`
- Review the logs with `npm run logs`
- Test the API with `npm run test`

## 🔗 Related Projects

- **Chrome Extension**: Frontend extension for browser integration
- **React Dashboard**: Admin dashboard for analytics and management
- **NudeNet Service**: AI service for content analysis
