/**
 * Azure WebPubSub Chat Server
 * 
 * This Express.js server provides a real-time chat backend that can operate in two modes:
 * 1. Azure WebPubSub mode: Uses Microsoft Azure's managed WebSocket service
 * 2. Mock WebSocket mode: Uses native Node.js WebSocket for local development
 * 
 * Key concepts for React developers coming from Vue/Laravel:
 * - Express.js is similar to Laravel's routing but more minimal
 * - WebSockets provide persistent bidirectional communication (like Laravel WebSockets/Pusher)
 * - Azure WebPubSub is a managed service that handles WebSocket scaling and reliability
 */

// Load environment variables from .env file (similar to Laravel's .env)
import "dotenv/config";
// Express.js - Node.js web framework (similar to Laravel's HTTP layer)
import express from "express";
// CORS middleware - handles Cross-Origin Resource Sharing (allows frontend to connect)
import cors from "cors";
// Crypto utility for generating unique user IDs
import { randomUUID } from "crypto";
// Native Node.js WebSocket implementation for mock mode
import { WebSocketServer, WebSocket } from "ws";

// Create Express application instance
const app = express();

// Configure CORS middleware
// In production, you'd restrict this to your actual frontend domain
app.use(cors({ 
  origin: "http://localhost:5173", // Vite's default dev server port
  credentials: true // Allow cookies/auth headers
}));

// Parse JSON request bodies (similar to Laravel's automatic JSON parsing)
app.use(express.json());

// Environment configuration
// Azure WebPubSub connection string - if undefined, server runs in mock mode
const conn = process.env.AZURE_WEB_PUBSUB_CONNECTION; // undefined in mock mode
// Hub name - Azure WebPubSub concept for message routing/grouping
const hubName = process.env.HUB || "chat";
// Server port
const port = Number(process.env.PORT || 3001);

/**
 * AZURE WEBPUBSUB SERVICE INITIALIZATION
 * 
 * Azure WebPubSub is Microsoft's managed WebSocket service that provides:
 * - Automatic scaling and load balancing
 * - Built-in connection management
 * - Group-based message broadcasting
 * - Authentication and authorization
 * - High availability and reliability
 * 
 * This is similar to Laravel's broadcasting with Pusher, but more powerful
 * for real-time applications that need to scale.
 */
// Define Azure WebPubSub service type for type safety
type AzureWebPubSubService = {
  getClientAccessToken(options: { userId: string }): Promise<{ url: string }>;
  group(groupName: string): {
    sendToAll(data: unknown): Promise<void>;
  };
};

let azureService: AzureWebPubSubService | null = null;

if (conn) {
  // Dynamic import - only load Azure SDK if we have credentials
  // This allows the app to work in mock mode without Azure dependencies
  const { WebPubSubServiceClient } = await import("@azure/web-pubsub");
  
  // Initialize Azure WebPubSub service client
  // This client handles server-side operations like sending messages to groups
  azureService = new WebPubSubServiceClient(conn, hubName) as AzureWebPubSubService;
  console.log("Azure Web PubSub mode ON");
} else {
  // Fallback to mock mode for local development
  console.log("DEV WS Mock mode ON (no Azure connection string)");
}

/**
 * MOCK WEBSOCKET SERVER FOR LOCAL DEVELOPMENT
 * 
 * This section implements a basic WebSocket server that mimics Azure WebPubSub's
 * functionality for local development. It's a simplified version that helps
 * developers work without Azure credentials.
 * 
 * Key concepts:
 * - ClientInfo: Tracks each connected client with their socket, ID, and joined rooms
 * - rooms Map: Groups clients by chat room (similar to Laravel's broadcasting channels)
 * - Set data structures: Efficient for managing collections of unique items
 */

// TypeScript interface defining the structure of each connected client
type ClientInfo = { 
  socket: WebSocket;        // The actual WebSocket connection
  userId: string;           // Unique identifier for the user
  rooms: Set<string>;       // Set of room names this client has joined
};

// Global state for mock server (in production, this would be in Redis or similar)
const clients = new Set<ClientInfo>();                    // All connected clients
const rooms = new Map<string, Set<ClientInfo>>();         // room name -> set of clients in that room

// Mock WebSocket server instance
let wss: WebSocketServer | null = null;
const WS_PORT = Number(process.env.WS_PORT || 3002);

/**
 * BROADCAST MESSAGE TO ALL CLIENTS IN A ROOM
 * 
 * This function demonstrates a key real-time chat concept: broadcasting messages
 * to all users in a specific room/channel. In Azure WebPubSub, this is handled
 * automatically by the service. Here we implement it manually for the mock server.
 * 
 * @param room - The room/channel name to broadcast to
 * @param payload - The message data to send
 */
// Define the structure of a chat message payload for type safety
type ChatMessagePayload = {
  user: string;
  text: string;
  ts: number;
};

function broadcastToRoom(room: string, payload: ChatMessagePayload) {
  // Get the set of clients in this room
  const set = rooms.get(room);
  if (!set) return; // Room doesn't exist or has no clients
  
  // Create message in Azure WebPubSub format for consistency
  // This matches the format that Azure WebPubSub sends to clients
  const msg = JSON.stringify({ 
    type: "group-message", 
    room, 
    message: { data: payload } 
  });
  
  // Send message to all clients in the room
  for (const c of set) {
    try { 
      c.socket.send(msg); 
    } catch { 
      // Socket might be closed - ignore errors
      // In production, you'd clean up dead connections here
    }
  }
}

/**
 * INITIALIZE MOCK WEBSOCKET SERVER
 * 
 * This function sets up a WebSocket server that mimics Azure WebPubSub's behavior.
 * It only runs when not using Azure (local development mode).
 * 
 * WebSocket Event Handling (important for React developers):
 * - 'connection': New client connects
 * - 'message': Client sends data 
 * - 'close': Client disconnects
 * 
 * This is similar to Laravel's WebSocket events but with different syntax.
 */
function ensureMockServer() {
  // Only create mock server if we're not using Azure and haven't created one yet
  if (wss || azureService) return; 
  
  // Create WebSocket server on specified port
  wss = new WebSocketServer({ port: WS_PORT });
  
  // Handle new client connections
  wss.on("connection", (socket: WebSocket, req: { url?: string; }) => {
    // Extract user ID from query parameters or generate anonymous ID
    // URL parsing: ws://localhost:3002?user=john -> gets "john"
    const userId =
      new URL(req.url ?? "", `ws://localhost:${WS_PORT}`).searchParams.get("user") ||
      `anon-${randomUUID()}`; // Fallback to anonymous ID
    
    // Create client info object and track it
    const client: ClientInfo = { socket, userId, rooms: new Set() };
    clients.add(client);

    /**
     * HANDLE INCOMING MESSAGES FROM CLIENT
     * 
     * Clients can send different types of messages:
     * - { type: "join", room: "roomName" } - Join a chat room
     * - { type: "send", room: "roomName", text: "message", user: "username" } - Send message
     */
    socket.on("message", (data: string) => {
      try {
        const msg = JSON.parse(data) as {
          type?: string;
          room?: string;
          user?: string;
          text?: string;
        };
        
        // Handle room join requests
        if (msg.type === "join" && msg.room) {
          // Get or create room's client set
          let set = rooms.get(msg.room);
          if (!set) rooms.set(msg.room, (set = new Set()));
          
          // Add client to room
          set.add(client);
          client.rooms.add(msg.room);
          
          // Acknowledge successful join
          socket.send(JSON.stringify({ type: "joined", room: msg.room }));
        } 
        // Handle message sending
        else if (msg.type === "send" && msg.room && msg.text && msg.user) {
          // Broadcast message to all clients in the room
          const messagePayload: ChatMessagePayload = { 
            user: msg.user, 
            text: msg.text, 
            ts: Date.now() 
          };
          broadcastToRoom(msg.room, messagePayload);
        }
      } catch { 
        // Ignore malformed JSON messages
      }
    });

    /**
     * HANDLE CLIENT DISCONNECTION
     * 
     * Clean up when client disconnects - remove from all rooms and client list
     * This prevents memory leaks and ensures accurate room membership
     */
    socket.on("close", () => {
      // Remove client from all rooms they joined
      for (const r of client.rooms) {
        rooms.get(r)?.delete(client);
      }
      // Remove client from global client list
      clients.delete(client);
    });
  });

  console.log(`WS mock server on ws://localhost:${WS_PORT}`);
}

// Initialize the mock server immediately
ensureMockServer();

/**
 * NEGOTIATE ENDPOINT - CLIENT CONNECTION SETUP
 * 
 * This is a critical endpoint in Azure WebPubSub architecture. Clients first call
 * this endpoint to get connection information before establishing WebSocket connection.
 * 
 * Flow:
 * 1. Client calls GET /negotiate
 * 2. Server returns WebSocket URL and access token
 * 3. Client uses this URL to connect to WebSocket
 * 
 * This pattern is common in Azure services for security and routing.
 * Similar to Laravel's broadcasting auth endpoints.
 * 
 * @route GET /negotiate
 * @header x-user-id Optional user identifier
 * @returns {url: string, mode: 'azure'|'mock'} Connection information
 */
app.get("/negotiate", async (req, res) => {
  try {
    // Extract user ID from header or generate anonymous ID
    // In production, you'd get this from JWT token or session
    const userId = (req.header("x-user-id") as string) || `anon-${randomUUID()}`;

    if (azureService) {
      /**
       * AZURE WEBPUBSUB MODE
       * 
       * Generate access token for client to connect directly to Azure WebPubSub.
       * The token contains:
       * - User ID
       * - Hub name  
       * - Permissions (send/receive messages)
       * - Expiration time
       */
      const token = await azureService.getClientAccessToken({ userId });
      return res.json({ url: token.url, mode: "azure" });
    } else {
      /**
       * MOCK WEBSOCKET MODE
       * 
       * Return URL to our local mock WebSocket server.
       * Include user ID as query parameter for identification.
       */
      const wsUrl = `ws://localhost:${WS_PORT}?user=${encodeURIComponent(userId)}`;
      return res.json({ url: wsUrl, mode: "mock" });
    }
  } catch (error) {
    console.error("Error generating negotiate token:", error);
    res.status(500).json({ error: "Failed to generate negotiate token." });
  }
});

/**
 * CHAT MESSAGE BROADCAST ENDPOINT
 * 
 * This endpoint receives chat messages from clients and broadcasts them to all
 * other clients in the same room. This is an alternative to sending messages
 * directly through WebSocket (some architectures prefer HTTP for message sending).
 * 
 * Benefits of HTTP endpoint for messages:
 * - Better error handling and validation
 * - Easier to add middleware (auth, rate limiting, etc.)
 * - Can be cached or queued
 * - Simpler client code
 * 
 * Similar to Laravel's broadcasting events via HTTP.
 * 
 * @route POST /chat
 * @body {room: string, user: string, text: string} Message data
 * @returns {ok: boolean} Success status
 */
app.post("/chat", async (req, res) => {
  try {
    // Extract message data from request body (TypeScript type assertion)
    const { room, user, text } = req.body as { room: string; user: string; text: string; };
    
    // Validate required fields
    if (!room || !text) {
      return res.status(400).json({ error: "room/text required" });
    }

    // Create message payload with timestamp
    const messagePayload: ChatMessagePayload = { user, text, ts: Date.now() };

    if (azureService) {
      /**
       * AZURE WEBPUBSUB BROADCASTING
       * 
       * Send message to all clients in the specified group (room).
       * Azure handles the distribution to all connected clients automatically.
       * 
       * azureService.group(room) - targets specific group
       * .sendToAll() - broadcasts to all clients in that group
       */
      await azureService.group(room).sendToAll(messagePayload);
    } else {
      /**
       * MOCK BROADCASTING
       * 
       * Use our custom broadcast function to send to all clients
       * in the room using the mock WebSocket server.
       */
      broadcastToRoom(room, messagePayload);
    }
    
    // Return success response
    res.json({ ok: true });
  } catch (error) {
    console.error("Error broadcasting message:", error);
    res.status(500).json({ error: "Failed to broadcast message." });
  }
});

/**
 * START THE EXPRESS SERVER
 * 
 * This starts the HTTP server that handles:
 * - /negotiate endpoint for WebSocket connection setup
 * - /chat endpoint for message broadcasting
 * - CORS headers for frontend communication
 * 
 * The server runs alongside the WebSocket server (in mock mode) or
 * works with Azure WebPubSub service (in Azure mode).
 */
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Mode: ${azureService ? 'Azure WebPubSub' : 'Mock WebSocket'}`);
  if (!azureService) {
    console.log(`Mock WebSocket server: ws://localhost:${WS_PORT}`);
  }
});
