# Chalice - Real-Time Chat Application

## Project Overview

Chalice is a modern, full-stack real-time chat application built with **React**, **Node.js**, **TypeScript**, and **Azure WebPubSub**. This project demonstrates professional-grade development practices and serves as an excellent learning resource for developers transitioning from **Vue.js/Laravel** to **React/Node.js** ecosystems.

### Key Features

- **Real-time messaging** with WebSocket connectivity
- **Dual-mode architecture** (Azure WebPubSub + Mock WebSocket)
- **Responsive design** with modern UI components
- **Type-safe development** with comprehensive TypeScript
- **Monorepo structure** with separate frontend/backend
- **Production-ready patterns** with error handling and optimization
- **Educational codebase** with detailed documentation and comments

## Architecture Overview

### High-Level Architecture
```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│                     │    │                     │    │                     │
│   React Frontend    │◄──►│   Express Backend   │◄──►│   Azure WebPubSub   │
│                     │    │                     │    │   (or Mock Server)  │
│   • TypeScript      │    │   • TypeScript      │    │                     │
│   • Styled Comps    │    │   • WebSocket       │    │   • Managed Service │
│   • Custom Hooks    │    │   • Dual Mode       │    │   • Auto Scaling    │
│   • Vite Bundler    │    │   • REST API        │    │   • Group Messaging │
│                     │    │                     │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
        Port 5173                   Port 3001                 Azure Cloud
```

### Technology Stack

#### Frontend (`/web`)
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Styled Components** for CSS-in-JS styling
- **Custom Hooks** for WebSocket management
- **Azure WebPubSub Client** for real-time messaging

#### Backend (`/server`) 
- **Node.js 18+** with Express.js
- **TypeScript** for type safety
- **Azure WebPubSub SDK** for managed WebSocket service
- **Native WebSocket** fallback for local development
- **CORS** configured for cross-origin requests

#### Development Tools
- **ESLint** for code quality
- **TypeScript** compiler with strict mode
- **tsx** for development with hot reload
- **Comprehensive documentation** and code comments

## Quick Start

### Prerequisites
- **Node.js 18+** 
- **npm** or **yarn**
- **Git** for version control
- Optional: **Azure WebPubSub service** for cloud mode

### 1. Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd chalice

# Install root dependencies
npm install

# Install server dependencies  
cd server && npm install && cd ..

# Install web dependencies
cd web && npm install && cd ..
```

### 2. Environment Setup
```bash
# Server configuration
cd server
cp .env.example .env

# For local development (mock mode), comment out Azure connection:
# AZURE_WEB_PUBSUB_CONNECTION=Endpoint=...;AccessKey=...;Version=1.0;
HUB=chat
PORT=3001
WS_PORT=3002
```

### 3. Start Development Servers
```bash
# Terminal 1: Start backend server
cd server
npm run dev

# Terminal 2: Start frontend server  
cd web
npm run dev
```

### 4. Open Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Mock WebSocket**: ws://localhost:3002

## Project Structure

```
chalice/
├── server/                    # Backend Express.js application
│   ├── src/
│   │   └── index.ts              # Main server file with dual-mode support
│   ├── dist/                  # Compiled JavaScript output
│   ├── package.json              # Server dependencies and scripts
│   ├── tsconfig.json             # TypeScript configuration
│   ├── .env                      # Environment variables
│   └── README.md                 # Server-specific documentation
│
├── web/                       # Frontend React application  
│   ├── src/
│   │   ├── App.tsx               # Main React component
│   │   ├── main.tsx              # React app entry point
│   │   ├── hooks/
│   │   │   └── useWebPubSub.ts   # Custom WebSocket hook
│   │   ├── types.ts              # Shared TypeScript types
│   │   └── assets/            # Static assets
│   ├── public/                # Public static files
│   ├── dist/                  # Production build output
│   ├── package.json              # Frontend dependencies and scripts
│   ├── vite.config.ts            # Vite bundler configuration
│   ├── tsconfig.json             # TypeScript configuration
│   └── README.md                 # Frontend-specific documentation
│
├── package.json                  # Root package.json for monorepo
├── INTERVIEW_GUIDE.md            # Comprehensive interview preparation
└── README.md                     # This file - project overview
```

## Development Workflow

### Available Scripts

#### Root Level Commands
```bash
# Install all dependencies
npm install

# Start both server and web in development mode
npm run dev

# Build both applications for production
npm run build
```

#### Server Commands (`cd server`)
```bash
npm run dev      # Start development server with hot reload
npm run build    # Compile TypeScript to JavaScript
npm start        # Run production server
npm test         # Run test suite (when implemented)
```

#### Web Commands (`cd web`)  
```bash
npm run dev      # Start Vite development server
npm run build    # Build production bundle
npm run preview  # Preview production build locally
npm run lint     # Run ESLint for code quality
```

### Development Features
- **Hot Module Replacement** for instant updates
- **TypeScript compilation** with strict type checking  
- **Auto-reconnection** for WebSocket connections
- **CORS configuration** for cross-origin development
- **Environment-based configuration** for different deployment targets

## Deployment Options

### Local Development (Mock Mode)
- Uses native WebSocket server on port 3002
- No external dependencies or cloud services required
- Perfect for local development and testing

### Azure Cloud (Production Mode)
1. Create Azure WebPubSub service in Azure Portal
2. Get connection string from service keys
3. Set `AZURE_WEB_PUBSUB_CONNECTION` environment variable
4. Deploy applications to preferred hosting service

### Docker Deployment
```dockerfile
# Example Dockerfile for server
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3001
CMD ["npm", "start"]
```

### Popular Hosting Options
- **Frontend**: Vercel, Netlify, Azure Static Web Apps
- **Backend**: Azure App Service, AWS Lambda, Railway, Heroku
- **WebSocket**: Azure WebPubSub, AWS API Gateway WebSocket, self-hosted

## Learning Objectives

This project is designed to teach modern web development concepts:

### React Development
- **Functional components** with hooks
- **Custom hooks** for reusable logic
- **State management** patterns
- **TypeScript integration** with React
- **Performance optimization** techniques
- **Real-time data** handling

### Node.js Backend
- **Express.js** REST API development
- **WebSocket** server implementation
- **Azure cloud services** integration
- **Environment-based configuration**
- **Error handling** and resilience patterns

### Full-Stack Integration
- **API design** and consumption
- **Real-time communication** patterns
- **Type safety** across frontend/backend
- **Development vs production** configuration
- **Monorepo** project structure

## For Vue.js/Laravel Developers

This project includes extensive comparisons and explanations for developers transitioning from:

### Vue.js → React
- **Composition API ↔ React Hooks** patterns
- **Template syntax ↔ JSX** differences  
- **Reactivity ↔ State management** approaches
- **Component architecture** comparisons

### Laravel → Node.js/Express
- **Routing** pattern differences
- **Middleware** implementation
- **Environment configuration** 
- **API development** practices

### Key Documentation
- **INTERVIEW_GUIDE.md** - Comprehensive technical interview preparation
- **server/README.md** - Backend architecture and Express.js patterns
- **web/README.md** - Frontend architecture and React patterns
- **Inline comments** - Detailed explanations throughout the codebase

## Key Features Explained

### Dual-Mode Architecture
```typescript
// Automatic environment detection
if (process.env.AZURE_WEB_PUBSUB_CONNECTION) {
  // Production: Use Azure WebPubSub
  azureService = new WebPubSubServiceClient(connectionString, hubName);
} else {
  // Development: Use mock WebSocket server
  mockWebSocketServer.start();
}
```

### Custom React Hook
```typescript
// Encapsulates WebSocket logic in reusable hook
function useWebPubSub(room: string) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  
  useEffect(() => {
    // Connection setup and cleanup
  }, [room]);
  
  return { connected, messages };
}
```

### Type-Safe Communication
```typescript
// Shared types ensure consistency
type ChatMsg = {
  user: string;
  text: string;
  ts: number;
};

// Used across frontend, backend, and WebSocket messages
```

## Testing Strategy

### Unit Testing (Planned)
- **React components** with React Testing Library
- **Custom hooks** with testing utilities
- **API endpoints** with supertest
- **WebSocket functionality** with mock clients

### Integration Testing (Planned)
- **Full chat flow** end-to-end
- **Connection fallback** testing
- **Error scenarios** validation

### Manual Testing
```bash
# Test REST endpoints
curl http://localhost:3001/negotiate
curl -X POST http://localhost:3001/chat -d '{"room":"test","user":"Test","text":"Hello"}'

# Test WebSocket with wscat
npm install -g wscat
wscat -c "ws://localhost:3002?user=TestUser"
```

## Performance Considerations

### Frontend Optimization
- **useMemo** for expensive computations
- **Component memoization** for stable renders
- **Bundle splitting** with Vite
- **Tree shaking** for minimal bundle size

### Backend Optimization  
- **Connection pooling** for WebSocket clients
- **Memory-efficient** data structures (Set/Map)
- **Automatic cleanup** of dead connections
- **Horizontal scaling** ready architecture

### WebSocket Optimization
- **Automatic reconnection** on connection loss
- **Message queuing** during disconnections
- **Connection state management**
- **Graceful error handling**

## Security Considerations

### Authentication (Ready for Implementation)
- **JWT token** support in negotiate endpoint
- **User identity** validation
- **Rate limiting** for API endpoints
- **CORS** properly configured

### Input Validation
- **TypeScript** compile-time validation
- **Runtime validation** for API inputs
- **XSS prevention** with proper escaping
- **Message sanitization**

### Production Security
- **Environment variables** for secrets
- **HTTPS/WSS** for encrypted communication
- **Azure managed identity** for cloud resources
- **Access key rotation** best practices

## Troubleshooting

### Common Issues

**Connection Refused**
```bash
# Check if servers are running
curl http://localhost:3001/negotiate
lsof -i :3001  # Check port usage
```

**WebSocket Connection Failed**
```bash
# Verify mock server
lsof -i :3002
# Check browser console for connection errors
```

**TypeScript Compilation Errors**
```bash
# Check TypeScript configuration
npm run build
# Verify all imports and type definitions
```

**Azure WebPubSub Issues**
- Verify connection string format
- Check service status in Azure Portal  
- Validate access key permissions
- Review service logs

### Debug Mode
```bash
# Enable verbose logging
DEBUG=* npm run dev

# TypeScript watch mode
npx tsc --watch
```

## Additional Resources

### Official Documentation
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Azure WebPubSub Docs](https://docs.microsoft.com/en-us/azure/azure-web-pubsub/)
- [Express.js Guide](https://expressjs.com/)

### Learning Materials
- [React Hooks Guide](https://react.dev/reference/react)
- [WebSocket API Reference](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Node.js Best Practices](https://nodejs.dev/learn/)
- [TypeScript with React](https://react-typescript-cheatsheet.netlify.app/)

### Community Resources
- [React Community](https://reactjs.org/community/support.html)
- [Node.js Community](https://nodejs.org/en/get-involved/)
- [Azure Developer Community](https://techcommunity.microsoft.com/t5/azure-developer-community-blog/bg-p/AzureDevCommunityBlog)

## Contributing

We welcome contributions! This project serves as a learning resource, so contributions that improve documentation, add educational value, or demonstrate best practices are especially appreciated.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes with proper TypeScript types
4. Add/update documentation and comments
5. Test your changes thoroughly
6. Submit a pull request

### Code Style
- Use **TypeScript** with strict mode
- Follow **ESLint** recommendations
- Add **comprehensive comments** for educational value
- Include **type definitions** for all interfaces
- Write **self-documenting code** with clear naming

## License

This project is open source and available under the [MIT License](LICENSE).

---

## Getting Started Checklist

- [ ] **Clone repository** and install dependencies
- [ ] **Start both servers** (backend + frontend)  
- [ ] **Open application** in browser (localhost:5173)
- [ ] **Send first message** to test real-time functionality
- [ ] **Review code structure** and documentation
- [ ] **Explore INTERVIEW_GUIDE.md** for technical deep-dive
- [ ] **Experiment with features** and code modifications
- [ ] **Deploy to cloud** (optional) with Azure WebPubSub

Welcome to **Chalice** - your gateway to modern full-stack development with React and Azure!

---

*This project is designed to be educational, production-ready, and a great addition to your portfolio. Happy coding!*