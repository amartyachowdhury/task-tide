# Task-Tide Frontend/Backend Architecture

## 🏗️ **Full-Stack Architecture Overview**

Task-Tide has been reorganized into a proper full-stack application with clear separation between frontend and backend components.

## 📁 **Directory Structure**

```
task-tide/
├── backend/                   # Backend API Server
│   ├── src/                   # Source code
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Custom middleware
│   │   ├── models/            # Data models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   └── server.js          # Main server file
│   ├── config/                # Configuration files
│   │   └── database.js        # Database config
│   ├── tests/                 # Test files
│   ├── package.json           # Backend dependencies
│   └── env.example            # Environment variables template
├── frontend/                  # Frontend Application
│   ├── public/                # Public web assets
│   │   └── index.html         # Main HTML file
│   ├── src/                   # Source code
│   │   ├── assets/            # Static assets
│   │   │   └── images/        # Image files
│   │   ├── scripts/           # JavaScript files
│   │   │   ├── api.js         # API service
│   │   │   └── script.js      # Main application logic
│   │   └── styles/            # CSS files
│   │       └── style.css      # Main stylesheet
│   └── package.json           # Frontend dependencies
├── config/                    # Docker & deployment configs
│   ├── docker-compose.yml     # Multi-service orchestration
│   ├── Dockerfile             # Frontend container
│   ├── Dockerfile.backend     # Backend container
│   ├── Dockerfile.dev         # Development container
│   └── nginx.conf             # Nginx configuration
├── docs/                      # Documentation
├── scripts/                   # Build & deployment scripts
├── package.json               # Root package configuration
├── .gitignore                 # Git ignore patterns
└── .dockerignore              # Docker ignore patterns
```

## 🔧 **Backend Architecture**

### **Technology Stack**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Security**: Helmet, CORS
- **Validation**: Joi
- **Logging**: Morgan
- **Environment**: dotenv

### **API Endpoints**

#### **Task Management**
- `GET /api/tasks` - Get all tasks (with filtering)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/toggle` - Toggle completion

#### **AI Features**
- `GET /api/ai/suggestions` - Get AI suggestions
- `GET /api/ai/analytics` - Get productivity analytics
- `POST /api/ai/prioritize` - AI-powered prioritization

#### **Health & Status**
- `GET /health` - Health check endpoint
- `GET /` - API information

### **Key Features**
- **RESTful API Design**: Clean, consistent endpoints
- **Input Validation**: Joi schema validation
- **Error Handling**: Centralized error middleware
- **CORS Support**: Cross-origin resource sharing
- **Security Headers**: Helmet for security
- **Request Logging**: Morgan for HTTP logging
- **Health Monitoring**: Built-in health checks

## 🎨 **Frontend Architecture**

### **Technology Stack**
- **Core**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 with CSS Variables
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Inter)
- **API Communication**: Fetch API

### **Key Components**
- **TaskTideApp Class**: Main application controller
- **API Service**: Backend communication layer
- **Task Management**: CRUD operations
- **AI Integration**: Smart suggestions and analytics
- **Calendar View**: Monthly task calendar
- **Theme System**: Dark/light mode support

### **Features**
- **Responsive Design**: Mobile-first approach
- **Real-time Updates**: Live data synchronization
- **AI-Powered Insights**: Smart suggestions and analytics
- **Calendar Integration**: Visual task scheduling
- **Theme Support**: Dark/light mode toggle
- **Local Storage**: Offline capability fallback

## 🐳 **Docker Architecture**

### **Multi-Service Setup**
- **Backend Service**: Node.js API server (port 3001)
- **Frontend Service**: Nginx static file server (port 8080)
- **Development Service**: Hot-reload development setup

### **Container Configuration**
- **Backend**: Node.js Alpine with health checks
- **Frontend**: Nginx Alpine with optimized static serving
- **Networking**: Internal Docker network for service communication
- **Volumes**: Persistent data storage
- **Health Checks**: Automated container health monitoring

## 🚀 **Development Workflow**

### **Local Development**
```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend
npm run dev

# Start individual services
npm run dev:backend    # Backend only (port 3001)
npm run dev:frontend   # Frontend only (port 3000)
```

### **Production Deployment**
```bash
# Build and deploy with Docker
npm run docker:build
npm run docker:up

# Or use the deployment script
./scripts/deploy.sh
```

### **API Development**
- Backend runs on `http://localhost:3001`
- Frontend runs on `http://localhost:8080`
- API endpoints available at `http://localhost:3001/api`

## 🔄 **Data Flow**

### **Request Flow**
1. **Frontend** → User interaction
2. **API Service** → HTTP request to backend
3. **Backend** → Process request, validate data
4. **Response** → JSON data back to frontend
5. **Frontend** → Update UI with new data

### **AI Processing**
1. **Task Data** → Sent to AI endpoints
2. **AI Analysis** → Smart prioritization and suggestions
3. **Insights** → Returned to frontend
4. **UI Update** → Display AI recommendations

## 🛡️ **Security Features**

### **Backend Security**
- **Helmet**: Security headers
- **CORS**: Cross-origin protection
- **Input Validation**: Joi schema validation
- **Error Handling**: Secure error responses
- **Environment Variables**: Sensitive data protection

### **Frontend Security**
- **Content Security Policy**: XSS protection
- **Input Sanitization**: Client-side validation
- **Secure API Calls**: HTTPS-ready communication

## 📊 **Monitoring & Health**

### **Health Checks**
- **Backend**: `GET /health` endpoint
- **Frontend**: Nginx health endpoint
- **Docker**: Container health monitoring
- **Logging**: Request and error logging

### **Analytics**
- **Productivity Metrics**: Task completion rates
- **AI Insights**: Smart suggestions and patterns
- **Performance**: Response times and error rates

## 🔮 **Future Enhancements**

### **Backend Improvements**
- **Database Integration**: PostgreSQL/MongoDB
- **Authentication**: JWT-based user system
- **Real-time Updates**: WebSocket support
- **Advanced AI**: Machine learning integration
- **Caching**: Redis for performance

### **Frontend Improvements**
- **Framework Migration**: React/Vue.js
- **State Management**: Redux/Vuex
- **Testing**: Jest/Cypress
- **PWA Features**: Offline support
- **Advanced UI**: Component library

This architecture provides a solid foundation for a scalable, maintainable full-stack application with clear separation of concerns and modern development practices.
