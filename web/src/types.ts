/**
 * TYPESCRIPT TYPE DEFINITIONS FOR CHAT APPLICATION
 * 
 * TypeScript provides compile-time type checking that helps catch errors
 * before runtime. This is especially valuable in larger applications.
 * 
 * BENEFITS FOR VUE/LARAVEL DEVELOPERS:
 * - Similar to Laravel's type hints and validation rules
 * - Catches errors at compile time (not runtime)
 * - Better IDE support (autocomplete, refactoring)
 * - Self-documenting code
 * - Easier refactoring and maintenance
 * 
 * TYPE vs INTERFACE:
 * - type: Can represent primitives, unions, intersections
 * - interface: Better for object shapes, can be extended
 * - Use 'type' for simple shapes, 'interface' for complex objects
 */

/**
 * CHAT MESSAGE TYPE DEFINITION
 * 
 * This type defines the structure of a chat message throughout the application.
 * It ensures consistency between:
 * - Frontend React components
 * - Backend Express endpoints  
 * - WebSocket message format
 * - Database storage (if added)
 * 
 * @property user - Display name of the message sender
 * @property text - The actual message content
 * @property ts - Unix timestamp (milliseconds) for message ordering
 */
export type ChatMsg = { 
  user: string;   // Message sender's display name
  text: string;   // Message content
  ts: number;     // Timestamp in milliseconds (Date.now())
};

/**
 * AZURE WEBPUBSUB EVENT TYPES
 * 
 * These types define the structure of events from Azure WebPubSub service.
 * They ensure type safety when handling WebSocket events.
 */

/**
 * Server data message event from Azure WebPubSub
 */
export interface AzureServerDataMessageEvent {
  data?: {
    type?: string;
    message?: string;
  };
}

/**
 * Group data message event from Azure WebPubSub
 */
export interface AzureGroupDataMessageEvent {
  data: ChatMsg;
}

/**
 * Mock WebSocket message formats for local development
 */
export interface MockWebSocketMessage {
  type: 'join' | 'send' | 'joined' | 'group-message';
  room?: string;
  user?: string;
  text?: string;
  message?: {
    data: ChatMsg;
  };
}

/**
 * Negotiate endpoint response format
 */
export interface NegotiateResponse {
  url: string;
  mode: 'azure' | 'mock';
}
