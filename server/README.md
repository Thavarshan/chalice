# Chat Server - Express.js with Azure WebPubSub

## Overview

This is a Node.js Express server that provides real-time chat functionality with dual-mode support:
- **Azure WebPubSub Mode**: Production-ready managed WebSocket service
- **Mock WebSocket Mode**: Local development with native WebSocket server

The server demonstrates modern Express.js patterns, TypeScript integration, and Azure cloud services architecture.

## Architecture

### Dual-Mode Design
```
┌─────────────────┐    ┌──────────────────┐
│   React Client  │    │   Express Server │
└─────────────────┘    └──────────────────┘
         │                       │
         │ 1. GET /negotiate     │
         │ ←──────────────────── │
         │                       │
         │ 2. WebSocket Connect  │
         ├───────────────────────┼─────────┐
         │                       │         │
    ┌────▼────┐             ┌────▼────┐   │
    │ Azure   │    OR       │ Mock WS │   │
    │ WebPubSub│             │ Server  │   │
    └─────────┘             └─────────┘   │
                                          │
         │ 3. POST /chat (optional)       │
         │ ←──────────────────────────────┘
```

### Connection Flow
1. **Negotiate**: Client calls `/negotiate` to get WebSocket URL and access token
2. **Connect**: Client connects to WebSocket (Azure or Mock)
3. **Join**: Client joins a chat room/group
4. **Broadcast**: Messages are broadcasted to all room members

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- TypeScript knowledge
- Optional: Azure WebPubSub service

### Installation
```bash
cd server
npm install
```

### Environment Setup
Create a `.env` file:
```env
# Azure WebPubSub (optional - leave commented for mock mode)
# AZURE_WEB_PUBSUB_CONNECTION=Endpoint=https://your-service.webpubsub.azure.com;AccessKey=your-key;Version=1.0;

# Server Configuration
HUB=chat
PORT=3001
WS_PORT=3002
```

### Development
```bash
# Start development server with auto-reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start
```

## Project Structure

```
server/
├── src/
│   └── index.ts          # Main server file
├── dist/                 # Compiled JavaScript (after build)
├── package.json
├── tsconfig.json
├── .env                  # Environment variables
└── README.md
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AZURE_WEB_PUBSUB_CONNECTION` | Azure connection string | `undefined` | No |
| `HUB` | WebPubSub hub name | `chat` | No |
| `PORT` | Express server port | `3001` | No |
| `WS_PORT` | Mock WebSocket port | `3002` | No |

### Azure WebPubSub Setup
1. Create Azure WebPubSub service in Azure Portal
2. Get connection string from Keys section
3. Set `AZURE_WEB_PUBSUB_CONNECTION` in `.env`
4. Restart server

## API Endpoints

### GET `/negotiate`
**Purpose**: Establishes WebSocket connection parameters

**Headers**:
- `x-user-id` (optional): User identifier

**Response**:
```json
{
  "url": "wss://service.webpubsub.azure.com/client/hubs/chat?access_token=...",
  "mode": "azure"
}
```
OR
```json
{
  "url": "ws://localhost:3002?user=anon-123",
  "mode": "mock"
}
```

**Example Usage**:
```javascript
const response = await fetch('/negotiate');
const { url, mode } = await response.json();
// Use url to connect WebSocket client
```

### POST `/chat`
**Purpose**: Broadcast message to chat room

**Body**:
```json
{
  "room": "lobby",
  "user": "John",
  "text": "Hello world!"
}
```

**Response**:
```json
{
  "ok": true
}
```

**Example Usage**:
```javascript
await fetch('/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    room: 'lobby',
    user: 'John',
    text: 'Hello world!'
  })
});
```

## WebSocket Communication

### Mock Mode Messages

#### Client → Server
```json
// Join a room
{ "type": "join", "room": "lobby" }

// Send message (alternative to HTTP)
{ 
  "type": "send", 
  "room": "lobby", 
  "user": "John", 
  "text": "Hello!" 
}
```

#### Server → Client
```json
// Join confirmation
{ "type": "joined", "room": "lobby" }

// Broadcast message
{
  "type": "group-message",
  "room": "lobby",
  "message": {
    "data": {
      "user": "John",
      "text": "Hello!",
      "ts": 1625097600000
    }
  }
}
```

### Azure Mode
Azure WebPubSub handles message formatting automatically. The server uses:
- `client.joinGroup(room)` - Join chat room
- `azureService.group(room).sendToAll(data)` - Broadcast to room

## Development Guide

### Key Technologies
- **Express.js**: Web framework for API endpoints
- **WebSocket**: Real-time bidirectional communication
- **TypeScript**: Type safety and better developer experience
- **Azure WebPubSub**: Managed WebSocket service for production

### Code Organization
```typescript
// Main server setup
const app = express();
app.use(cors());
app.use(express.json());

// Dual-mode initialization
let azureService = null;
if (process.env.AZURE_WEB_PUBSUB_CONNECTION) {
  // Azure mode
} else {
  // Mock mode
}
```

### TypeScript Configuration
The `tsconfig.json` uses modern settings:
- **Target**: ES2022 for modern JavaScript features
- **Module**: NodeNext for ESM support
- **Strict**: True for maximum type safety
- **Output**: Compiled to `dist/` directory

### Error Handling
```typescript
app.post('/chat', async (req, res) => {
  try {
    // Business logic
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## Testing

### Manual Testing
```bash
# Test negotiate endpoint
curl http://localhost:3001/negotiate

# Test chat endpoint
curl -X POST http://localhost:3001/chat \
  -H "Content-Type: application/json" \
  -d '{"room":"test","user":"TestUser","text":"Hello"}'
```

### WebSocket Testing
Use a WebSocket client like `wscat`:
```bash
npm install -g wscat

# Connect to mock server
wscat -c "ws://localhost:3002?user=TestUser"

# Send join message
{"type":"join","room":"test"}
```

## Performance Considerations

### Connection Management
- **Mock Mode**: Tracks connections in memory (Set/Map)
- **Azure Mode**: Managed by Azure service
- **Cleanup**: Removes dead connections automatically

### Scaling
- **Mock Mode**: Single server instance, good for development
- **Azure Mode**: Automatic scaling, handles thousands of connections
- **State**: Stateless server design for horizontal scaling

### Memory Usage
```typescript
// Efficient data structures
const clients = new Set<ClientInfo>();           // O(1) add/remove
const rooms = new Map<string, Set<ClientInfo>>(); // O(1) room lookup
```

## Security Considerations

### CORS Configuration
```typescript
app.use(cors({ 
  origin: "http://localhost:5173",  // Restrict to frontend
  credentials: true                 // Allow auth headers
}));
```

### Input Validation
```typescript
const { room, user, text } = req.body;
if (!room || !text) {
  return res.status(400).json({ error: "room/text required" });
}
```

### Azure Authentication
Azure WebPubSub handles authentication via access tokens:
- Tokens have expiration time
- User identity embedded in token
- Service validates tokens automatically

## Production Deployment

### Environment Setup
```env
# Production environment
AZURE_WEB_PUBSUB_CONNECTION=Endpoint=https://prod-service.webpubsub.azure.com;AccessKey=...
HUB=chat
PORT=80
NODE_ENV=production
```

### Build Process
```bash
npm run build  # Compile TypeScript
npm start      # Run production server
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3001
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

**Connection Refused**
- Check if server is running: `curl http://localhost:3001/negotiate`
- Verify port is not in use: `lsof -i :3001`

**Mock WebSocket Fails**
- Check WS_PORT is available: `lsof -i :3002`
- Verify WebSocket URL format: `ws://localhost:3002?user=...`

**Azure Connection Issues**
- Validate connection string format
- Check Azure WebPubSub service status
- Verify access key permissions

**TypeScript Compilation Errors**
- Run `npm run build` to see detailed errors
- Check imports and type definitions
- Verify tsconfig.json settings

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# TypeScript compilation watch mode
npx tsc --watch
```

## Learning Resources

### Express.js
- [Express.js Guide](https://expressjs.com/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

### Azure WebPubSub
- [Azure WebPubSub Documentation](https://docs.microsoft.com/en-us/azure/azure-web-pubsub/)
- [WebPubSub SDK for JavaScript](https://docs.microsoft.com/en-us/javascript/api/@azure/web-pubsub/)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js TypeScript Guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

### WebSockets
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [WebSocket Protocol RFC](https://tools.ietf.org/html/rfc6455)

---

This server provides a solid foundation for real-time applications with the flexibility to develop locally and scale in production using Azure's managed services.