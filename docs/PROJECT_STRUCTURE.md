# Task-Tide Project Structure

This document describes the organized structure of the Task-Tide codebase following industry standards.

## 📁 Directory Structure

```
task-tide/
├── config/                    # Configuration files
│   ├── docker-compose.yml     # Docker orchestration
│   ├── Dockerfile             # Production Docker image
│   ├── Dockerfile.dev         # Development Docker image
│   └── nginx.conf             # Nginx configuration
├── docs/                      # Documentation
│   ├── README.md              # Main project documentation
│   └── PROJECT_STRUCTURE.md   # This file
├── public/                    # Public web assets
│   └── index.html             # Main HTML file
├── scripts/                   # Build and deployment scripts
│   ├── deploy.sh              # Deployment script
│   └── Makefile               # Build automation
├── src/                       # Source code
│   ├── assets/                # Static assets
│   │   └── images/            # Image files
│   │       ├── checked.png    # Checked task icon
│   │       ├── icon.png       # App icon
│   │       └── unchecked.png  # Unchecked task icon
│   ├── scripts/               # JavaScript files
│   │   └── script.js          # Main application logic
│   └── styles/                # CSS files
│       └── style.css          # Main stylesheet
├── .dockerignore              # Docker ignore file
├── .gitignore                 # Git ignore file
├── LICENSE                    # MIT License
└── package.json               # Node.js package configuration
```

## 🎯 Organization Principles

### 1. **Separation of Concerns**
- **`public/`**: Contains only the main HTML file that serves as the entry point
- **`src/`**: Contains all source code organized by type
- **`config/`**: Contains all configuration files
- **`docs/`**: Contains all documentation
- **`scripts/`**: Contains build and deployment automation

### 2. **Industry Standards**
- **`src/`** directory for source code (common in modern web projects)
- **`public/`** directory for public assets (React, Vue, Angular standard)
- **`config/`** directory for configuration files
- **`docs/`** directory for documentation
- **`scripts/`** directory for automation scripts

### 3. **Asset Organization**
- **Images**: `src/assets/images/` - All image files in one location
- **Styles**: `src/styles/` - All CSS files organized by purpose
- **Scripts**: `src/scripts/` - All JavaScript files organized by functionality

### 4. **Configuration Management**
- **Docker**: All Docker-related files in `config/`
- **Build**: All build scripts in `scripts/`
- **Documentation**: All docs in `docs/`

## 🔧 File Purposes

### Core Application Files
- **`public/index.html`**: Main HTML entry point
- **`src/scripts/script.js`**: Main JavaScript application logic
- **`src/styles/style.css`**: Main stylesheet with all CSS

### Configuration Files
- **`config/docker-compose.yml`**: Docker orchestration configuration
- **`config/Dockerfile`**: Production Docker image definition
- **`config/Dockerfile.dev`**: Development Docker image definition
- **`config/nginx.conf`**: Nginx web server configuration

### Build & Deployment
- **`scripts/deploy.sh`**: Automated deployment script
- **`scripts/Makefile`**: Build automation commands
- **`package.json`**: Node.js project configuration

### Documentation
- **`docs/README.md`**: Main project documentation
- **`docs/PROJECT_STRUCTURE.md`**: This structure documentation

### Assets
- **`src/assets/images/`**: All image assets (icons, graphics)
- **`.gitignore`**: Git ignore patterns
- **`.dockerignore`**: Docker ignore patterns

## 🚀 Benefits of This Structure

### 1. **Maintainability**
- Clear separation of concerns
- Easy to locate specific file types
- Logical grouping of related files

### 2. **Scalability**
- Easy to add new features in appropriate directories
- Clear structure for team collaboration
- Standard patterns familiar to developers

### 3. **Build Optimization**
- Clear distinction between source and build files
- Optimized Docker builds with proper context
- Efficient asset management

### 4. **Development Experience**
- Intuitive file organization
- Easy navigation for new developers
- Standard tooling compatibility

## 📝 Development Guidelines

### Adding New Files
- **HTML**: Add to `public/` directory
- **CSS**: Add to `src/styles/` directory
- **JavaScript**: Add to `src/scripts/` directory
- **Images**: Add to `src/assets/images/` directory
- **Config**: Add to `config/` directory
- **Docs**: Add to `docs/` directory

### Naming Conventions
- Use kebab-case for file names
- Use descriptive names that indicate purpose
- Group related files with consistent prefixes

### Import/Reference Paths
- HTML references: `../src/styles/style.css`, `../src/scripts/script.js`
- CSS references: `../assets/images/filename.png`
- Docker context: `config/` directory for Docker files

This structure follows modern web development best practices and makes the codebase easy to understand, maintain, and scale.
