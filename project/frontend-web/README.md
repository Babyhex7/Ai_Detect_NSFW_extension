# NSFW Detector Frontend

Modern minimalist React frontend for the NSFW Detection Chrome Extension.

## Features

- ✨ Modern minimalist design with Tailwind CSS
- 🔐 Complete authentication system (login/register)
- 📊 Interactive dashboard with analytics
- 🎯 Real-time content detection monitoring
- 📱 Responsive design for all devices
- 🚀 Fast performance with Vite
- 🎨 Beautiful UI components
- 🔄 Real-time data updates

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router 6** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Hot Toast** - Beautiful notifications
- **Lucide React** - Modern icon library
- **JS Cookie** - Cookie management

## Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend server running on port 5000

### Installation

1. Navigate to the frontend directory:
```bash
cd project/frontend-web
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── UI.jsx          # Base UI components
│   ├── Navbar.jsx      # Navigation component
│   └── ProtectedRoute.jsx
├── pages/              # Page components
│   ├── LandingPage.jsx # Public landing page
│   ├── LoginPage.jsx   # Login form
│   ├── RegisterPage.jsx # Registration form
│   └── Dashboard.jsx   # Main dashboard
├── context/            # React context providers
│   └── AuthContext.jsx # Authentication context
├── services/           # API services
│   └── api.js         # API client and endpoints
├── hooks/              # Custom React hooks
│   └── useCommon.js   # Common utility hooks
└── App.jsx            # Main app component
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME="NSFW Detector"
VITE_APP_VERSION="1.0.0"
```

### API Integration

The frontend communicates with the backend through REST API endpoints:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/detection/history` - Detection history

## Features Overview

### Authentication System
- User registration with validation
- Secure login with JWT tokens
- Password strength indicator
- Remember me functionality
- Protected routes

### Dashboard
- Real-time statistics
- Recent detection history
- System status monitoring
- Quick actions panel
- Responsive charts and graphs

### User Experience
- Minimalist, clean design
- Fast loading times
- Smooth animations
- Mobile-responsive
- Accessibility features

## Styling

The project uses Tailwind CSS for styling with custom configurations:

- Custom color palette
- Extended animations
- Responsive breakpoints
- Custom component classes
- Dark mode support (future)

## Security

- JWT token management
- Secure cookie storage
- CSRF protection
- Input validation
- XSS prevention

## Performance

- Code splitting with React.lazy
- Image optimization
- Bundle size optimization
- Caching strategies
- Progressive loading

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request

## License

MIT License - see LICENSE file for details