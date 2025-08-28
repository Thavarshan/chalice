# React + Azure WebPubSub Interview Guide

## Project Overview
This is a real-time chat application demonstrating React patterns and Azure WebPubSub integration, specifically designed for Vue/Laravel developers transitioning to React.

## Architecture Deep Dive

### **Monorepo Structure**
```
chalice/
├── server/          # Node.js Express backend
│   ├── src/index.ts # Main server file with dual-mode support
│   └── .env         # Environment configuration
└── web/             # React frontend
    ├── src/
    │   ├── App.tsx                  # Main React component
    │   ├── hooks/useWebPubSub.ts    # Custom WebSocket hook
    │   └── types.ts                 # TypeScript definitions
    └── package.json
```

### **Dual Architecture Pattern**
The application supports two modes:

1. **Azure WebPubSub Mode** (Production)
   - Uses Microsoft's managed WebSocket service
   - Automatic scaling and connection management
   - Built-in authentication and group management

2. **Mock WebSocket Mode** (Development)
   - Native Node.js WebSocket server
   - Simulates Azure WebPubSub behavior
   - No cloud dependencies for local development

## Key React Concepts for Interview

### 1. **Hooks Deep Dive** 

#### `useState` - State Management
```javascript
const [messages, setMessages] = useState<ChatMsg[]>([]);

// Vue equivalent:
// const messages = ref<ChatMsg[]>([]);
```
**Interview Points:**
- Returns array with [value, setter]
- Updates are asynchronous and batched
- Functional updates for complex state: `setMessages(prev => [...prev, newMsg])`

#### `useEffect` - Side Effects
```javascript
useEffect(() => {
  // Setup WebSocket connection
  return () => {
    // Cleanup on unmount or dependency change
  };
}, [room]); // Dependency array
```
**Interview Points:**
- Runs after render (not during)
- Cleanup function prevents memory leaks
- Dependencies control when effect re-runs
- Empty deps `[]` = runs once (componentDidMount)

#### `useMemo` - Performance Optimization
```javascript
const sorted = useMemo(
  () => [...messages].sort((a, b) => a.ts - b.ts),
  [messages]
);
```
**Interview Points:**
- Memoizes expensive computations
- Only recalculates when dependencies change
- Different from useCallback (memoizes values vs functions)

#### Custom Hooks - Logic Reuse
```javascript
function useWebPubSub(room: string) {
  // Encapsulates WebSocket logic
  return { connected, messages };
}
```
**Interview Points:**
- Extract reusable stateful logic
- Must start with "use" (React convention)
- Can use other hooks internally
- Similar to Vue composables

### 2. **Component Patterns**

#### Functional Components
```javascript
export default function App() {
  // Modern React pattern
  // Cleaner than class components
  // Works with hooks
}
```

#### Controlled Components
```javascript
<input
  value={text}                           // Single source of truth
  onChange={(e) => setText(e.target.value)} // Manual sync
/>
```
**Interview Points:**
- React doesn't have two-way binding like Vue's v-model
- Component state controls input value
- onChange handler updates state

### 3. **Event Handling**
```javascript
// Synthetic events (cross-browser compatible)
onKeyDown={(e) => e.key === "Enter" && send()}
onClick={send}
```

### 4. **List Rendering & Keys**
```javascript
{messages.map((msg, index) => (
  <MessageBubble key={index}>  {/* Key for React's reconciliation */}
    {msg.text}
  </MessageBubble>
))}
```

## Azure WebPubSub Concepts

### 1. **Connection Flow**
1. Client calls `/negotiate` endpoint
2. Server returns WebSocket URL + access token
3. Client connects to Azure WebPubSub with token
4. Client joins groups for room-based messaging

### 2. **Group Management**
```javascript
// Server-side: Send to all clients in a group
await azureService.group(room).sendToAll(message);

// Client-side: Join a group
await client.joinGroup(room);
```

### 3. **Event Types**
- `connected` - Successfully connected to service
- `disconnected` - Connection lost
- `group-data-message` - Message from group members
- `server-data-message` - Server-initiated messages

## TypeScript Integration

### Type Safety Benefits
```typescript
type ChatMsg = {
  user: string;
  text: string; 
  ts: number;
};

// Ensures consistency across:
// - React components
// - API endpoints  
// - WebSocket messages
```

### Generic Types
```typescript
const [messages, setMessages] = useState<ChatMsg[]>([]);
//                                        ^^^^^^^^^ Generic type
```

## Performance Considerations

### 1. **Memo and Optimization**
```javascript
// Prevent unnecessary re-sorts
const sorted = useMemo(() => 
  [...messages].sort((a, b) => a.ts - b.ts), 
  [messages]
);
```

### 2. **WebSocket Management**
- Connection cleanup in useEffect return
- Prevent state updates after unmount
- Automatic reconnection on failures

### 3. **State Updates**
```javascript
// ✅ Correct: Creates new array
setMessages(prev => [...prev, newMessage]);

// ❌ Wrong: Mutates existing array  
setMessages(prev => { prev.push(newMessage); return prev; });
```

## Common Interview Questions & Answers

### Q: "How does React's useState differ from Vue's ref?"
**A:** React's useState returns an array `[value, setter]` and updates are asynchronous. Vue's ref returns a reactive object where you access/modify the `.value` property. React requires explicit setter calls, while Vue's reactivity is automatic.

### Q: "Explain React's useEffect hook"
**A:** useEffect handles side effects like API calls, subscriptions, and cleanup. It runs after rendering, takes a dependency array to control re-runs, and can return a cleanup function. It's similar to combining Vue's onMounted, onUnmounted, and watchEffect.

### Q: "What are controlled vs uncontrolled components?"
**A:** Controlled components have their value controlled by React state (single source of truth). Uncontrolled components manage their own state internally. This example uses controlled inputs where `value={state}` and `onChange` handler updates state.

### Q: "How do you optimize React performance?"
**A:** Use useMemo for expensive computations, useCallback for function references, React.memo for component memoization, proper key props for lists, and avoid creating objects/functions in render.

### Q: "Explain Azure WebPubSub's benefits"
**A:** Managed scaling, automatic connection handling, built-in authentication, group management, message delivery guarantees, and global distribution. It removes the complexity of managing WebSocket infrastructure.

### Q: "How do you handle WebSocket connections in React?"
**A:** Use useEffect for connection setup/cleanup, useRef to store connection instance without causing re-renders, useState for connection status, and cleanup functions to prevent memory leaks.

## Key Differences: Vue vs React

| Concept | Vue | React |
|---------|-----|-------|
| State | `ref()` | `useState()` |
| Effects | `watchEffect()` | `useEffect()` |
| Computed | `computed()` | `useMemo()` |
| Templates | Template syntax | JSX |
| Events | `@click` | `onClick` |
| Two-way binding | `v-model` | Controlled components |
| Loops | `v-for` | `.map()` |
| Conditionals | `v-if` | `{condition && <Component />}` |

## Best Practices Demonstrated

1. **Custom Hooks**: Extract complex logic (WebSocket management)
2. **TypeScript**: Type safety across the application
3. **Error Handling**: Try-catch blocks, connection resilience
4. **Cleanup**: Prevent memory leaks with proper useEffect cleanup
5. **Performance**: Memoization for expensive operations
6. **Architecture**: Separation of concerns between UI and business logic
7. **Dual-Mode**: Support both production (Azure) and development (mock) environments

This project demonstrates production-ready patterns for building scalable real-time applications with React and Azure services.