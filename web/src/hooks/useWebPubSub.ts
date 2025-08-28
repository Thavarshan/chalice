/**
 * CUSTOM REACT HOOK: useWebPubSub
 * 
 * This is a custom React hook that encapsulates WebSocket connection logic.
 * Custom hooks are a key React pattern for sharing stateful logic between components.
 * 
 * IMPORTANT REACT CONCEPTS FOR VUE DEVELOPERS:
 * - Hooks are React's way of managing state and side effects (similar to Vue's Composition API)
 * - Custom hooks let you extract component logic into reusable functions
 * - Hook names must start with 'use' (React convention)
 * - Hooks can only be called at the top level of components or other hooks
 * 
 * This hook handles:
 * - WebSocket connection management
 * - Message state management  
 * - Connection status tracking
 * - Automatic reconnection
 * - Cleanup on unmount
 */
import { useEffect, useRef, useState } from "react";
import { WebPubSubClient } from "@azure/web-pubsub-client";
import type { 
  ChatMsg, 
  AzureServerDataMessageEvent, 
  AzureGroupDataMessageEvent,
  MockWebSocketMessage,
  NegotiateResponse 
} from "../types";

/**
 * CUSTOM HOOK DEFINITION
 * 
 * @param room - The chat room name to connect to
 * @returns {connected: boolean, messages: ChatMsg[], isMock: boolean}
 */
export function useWebPubSub(room: string) {
  /**
   * REACT STATE MANAGEMENT WITH HOOKS
   * 
   * useState is React's primary state management hook.
   * Similar to Vue's ref() but with different syntax:
   * 
   * Vue: const connected = ref(false)
   * React: const [connected, setConnected] = useState(false)
   * 
   * Key differences:
   * - React returns [value, setter] array (destructuring)
   * - Vue returns reactive object with .value property
   * - React state updates are batched and async
   */
  
  // Connection status state
  const [connected, setConnected] = useState(false);
  
  // Messages array state - stores all received messages
  // TypeScript generic <ChatMsg[]> ensures type safety
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  
  /**
   * REACT useRef HOOK
   * 
   * useRef creates a mutable reference that persists across re-renders.
   * Similar to Vue's ref() for DOM elements or storing values.
   * 
   * Key differences from useState:
   * - Changing .current doesn't trigger re-renders
   * - Perfect for storing WebSocket connections, timers, etc.
   * - Similar to Vue's template refs
   */
  
  // Store WebSocket client instance (Azure or native WebSocket)
  const clientRef = useRef<WebPubSubClient | WebSocket | null>(null);
  
  // Track whether we're in mock mode or Azure mode
  const mockModeRef = useRef(false);

  /**
   * REACT useEffect HOOK - THE HEART OF REACT SIDE EFFECTS
   * 
   * useEffect is React's way of handling side effects (similar to Vue's watchEffect/onMounted)
   * 
   * Key concepts:
   * - Runs after component renders
   * - Dependency array [room] means it re-runs when 'room' changes
   * - Return function is cleanup (like Vue's onUnmounted)
   * - Empty dependency [] would run once (like Vue's onMounted)
   * 
   * This useEffect handles:
   * - WebSocket connection setup
   * - Event listener registration
   * - Connection cleanup
   */
  useEffect(() => {
    // Flag to prevent state updates after component unmounts
    // This prevents "Can't perform a React state update on an unmounted component" warnings
    let disposed = false;

    /**
     * ASYNC CONNECTION FUNCTION
     * 
     * This function handles the WebSocket connection setup.
     * It's async because it needs to call the /negotiate endpoint first.
     */
    async function connect() {
      try {
        // Step 1: Call negotiate endpoint to get connection info
        // This follows Azure WebPubSub's connection pattern
        const resp = await fetch("http://localhost:3001/negotiate", { 
          credentials: "include" // Include cookies/auth headers
        });
        const { url, mode }: NegotiateResponse = await resp.json();
        
        // Store whether we're using mock or Azure mode
        mockModeRef.current = mode === "mock";

        if (!mockModeRef.current) {
          /**
           * AZURE WEBPUBSUB CLIENT SETUP
           * 
           * This branch handles Azure WebPubSub connections.
           * Azure WebPubSub provides a managed WebSocket service with:
           * - Automatic scaling
           * - Built-in authentication
           * - Group management
           * - Message delivery guarantees
           */
          
          // Create Azure WebPubSub client with the negotiated URL
          const client = new WebPubSubClient(url);
          clientRef.current = client;

          /**
           * EVENT LISTENERS FOR AZURE CLIENT
           * 
           * Azure WebPubSub uses event-driven architecture.
           * These are the key events we need to handle:
           */
          
          // When successfully connected to Azure WebPubSub
          client.on("connected", async () => {
            if (disposed) return; // Prevent updates after unmount
            setConnected(true);
            // Join the specified chat room/group
            await client.joinGroup(room);
          });
          
          // When disconnected from Azure WebPubSub
          client.on("disconnected", () => {
            if (disposed) return;
            setConnected(false);
          });

          // Handle server-to-client messages and errors  
          // Note: Using generic event handler due to Azure WebPubSub client type limitations
          (client as any).on("server-data-message", (e: AzureServerDataMessageEvent) => {
            if (e.data?.type === "error") {
              console.error("WebSocket error:", e.data);
              if (disposed) return;
              setConnected(false);
            }
          });

          /**
           * MESSAGE HANDLING
           * 
           * This is where we receive messages from other users.
           * Key React pattern: Using functional state updates.
           */
          // Handle group messages from other users
          // Note: Using generic event handler due to Azure WebPubSub client type limitations  
          (client as any).on("group-data-message", (e: AzureGroupDataMessageEvent) => {
            const data = e.data;
            
            // IMPORTANT REACT PATTERN: Functional state updates
            // setMessages(m => [...m, data]) is safer than setMessages(messages.push(data))
            // because it creates a new array, ensuring React detects the change
            setMessages((m) => [...m, data]);
          });

          // Start the Azure WebPubSub connection
          await client.start();
        } else {
          /**
           * MOCK WEBSOCKET CLIENT SETUP
           * 
           * This branch handles native WebSocket connections for local development.
           * We mimic Azure WebPubSub's behavior using standard WebSocket API.
           */
          
          // Create native WebSocket connection
          const ws = new WebSocket(url);
          clientRef.current = ws;

          /**
           * NATIVE WEBSOCKET EVENT HANDLERS
           * 
           * Native WebSocket API uses different event names than Azure WebPubSub:
           * - onopen (not 'connected')
           * - onmessage (not 'message')
           * - onclose (not 'disconnected')
           * - onerror (same as Azure)
           */
          
          // When WebSocket connection opens
          ws.onopen = () => {
            if (disposed) return;
            setConnected(true);
            // Send join message to mock server
            ws.send(JSON.stringify({ type: "join", room }));
          };

          // When WebSocket connection closes
          ws.onclose = () => !disposed && setConnected(false);

          /**
           * HANDLE INCOMING MESSAGES
           * 
           * Parse messages from mock server and update React state.
           * We filter for messages in our specific room.
           */
          ws.onmessage = (ev: MessageEvent<string>) => {
            try {
              const msg: MockWebSocketMessage = JSON.parse(String(ev.data));
              // Only process group messages for our room
              if (msg.type === "group-message" && msg.room === room && msg.message?.data) {
                const data: ChatMsg = msg.message.data;
                // Same functional update pattern as Azure client
                setMessages((m) => [...m, data]);
              }
            } catch {
              // Ignore malformed JSON messages
            }
          };

          // Handle WebSocket errors
          ws.onerror = (err) => {
            console.error("WebSocket error:", err);
            if (disposed) return;
            setConnected(false);
          };
        }
      } catch (err) {
        console.error("connect error", err);
        setConnected(false);
        
        /**
         * AUTOMATIC RECONNECTION
         * 
         * If connection fails, retry after 1.2 seconds.
         * This provides resilience against network issues.
         * In production, you might want exponential backoff.
         */
        setTimeout(connect, 1200);
      }
    }

    // Start the connection process
    connect();
    
    /**
     * CLEANUP FUNCTION (useEffect return)
     * 
     * This function runs when:
     * - Component unmounts
     * - Dependencies change (room changes)
     * - Before next effect runs
     * 
     * It's crucial for preventing memory leaks and zombie connections.
     * Similar to Vue's onUnmounted or watchEffect cleanup.
     */
    return () => {
      // Mark as disposed to prevent state updates
      disposed = true;
      
      const c = clientRef.current;
      if (!c) return;

      /**
       * POLYMORPHIC CLEANUP
       * 
       * We handle both Azure WebPubSub client and native WebSocket.
       * This demonstrates TypeScript's duck typing - we check for methods
       * rather than specific types.
       */
      
      // Check if the client is an Azure WebPubSubClient
      if ("stop" in c && typeof c.stop === "function") {
        c.stop();
      }
      // Check if the client is a native WebSocket
      else if ("close" in c && typeof c.close === "function") {
        c.close();
      }

      // Clear the reference
      clientRef.current = null;
    };
  }, [room]); // Dependency array: re-run effect when room changes

  /**
   * HOOK RETURN VALUE
   * 
   * Custom hooks return data and functions that components can use.
   * This follows React's convention of returning an object with named properties.
   * 
   * Alternative patterns:
   * - Array return: [connected, messages] (like useState)
   * - Object return: {connected, messages} (more readable for multiple values)
   */
  return { 
    connected,                    // Boolean: connection status
    messages,                     // Array: chat messages
    isMock: mockModeRef.current   // Boolean: whether using mock mode
  };
}

/**
 * TYPESCRIPT EVENT HANDLING NOTES
 * 
 * Azure WebPubSub client events are properly typed using the imported
 * interfaces from our types.ts file. This ensures type safety when
 * handling WebSocket events and prevents runtime errors.
 * 
 * The events we handle:
 * - connected: When WebSocket connection is established
 * - disconnected: When WebSocket connection is lost
 * - server-data-message: Server-to-client messages (errors, etc.)
 * - group-data-message: Messages broadcast to group members
 * 
 * This approach is more type-safe than Vue's $emit which is checked at runtime.
 */
