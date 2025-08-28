# Chat Frontend - React with TypeScript

## Overview

This is a modern React frontend for a real-time chat application, built with TypeScript, Vite, and Styled Components. It demonstrates key React patterns including hooks, custom hooks, component architecture, and real-time WebSocket integration.

Perfect for Vue.js developers learning React concepts and Azure WebPubSub integration.

## Architecture

### Component Hierarchy
```
App.tsx (Root Component)
├── Custom Hook: useWebPubSub
├── Styled Components:
│   ├── Wrap (Main container)
│   ├── Row (Flexbox layout)
│   ├── Input (Form inputs)
│   ├── Btn (Button styling)
│   └── Bubble (Message display)
└── State Management:
    ├── room (current chat room)
    ├── name (user display name)
    ├── text (message input)
    └── messages (from WebSocket)
```

### Data Flow
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Input    │    │  React State     │    │   WebSocket     │
│                 │───▶│                  │───▶│                 │
│ • Name/Room     │    │ • useState       │    │ • useWebPubSub  │
│ • Message Text  │    │ • useMemo        │    │ • Connection    │
│ • Send Button   │    │ • Event Handlers │    │ • Message Sync  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn  
- Basic React knowledge
- Running backend server (see `../server/README.md`)

### Installation
```bash
cd web
npm install
```

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

The development server runs on `http://localhost:5173` (Vite default).

## Project Structure

```
web/
├── src/
│   ├── App.tsx              # Main React component
│   ├── main.tsx             # React app entry point  
│   ├── index.css            # Global styles
│   ├── hooks/
│   │   └── useWebPubSub.ts  # Custom WebSocket hook
│   ├── types.ts             # TypeScript definitions
│   └── assets/              # Static assets
├── public/                  # Public assets
├── package.json
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite bundler config
└── README.md
```

## React Hooks Deep Dive

### Built-in Hooks Used

#### `useState` - State Management
```typescript
const [room, setRoom] = useState("lobby");
const [name, setName] = useState("Jerome");  
const [text, setText] = useState("");

// Vue equivalent:
// const room = ref("lobby");
// const name = ref("Jerome");
// const text = ref("");
```

**Key Differences from Vue:**
- Returns array: `[value, setter]`
- Updates are asynchronous and batched
- Functional updates: `setState(prev => newValue)`

#### `useMemo` - Performance Optimization
```typescript
const sorted = useMemo(
  () => [...messages].sort((a, b) => a.ts - b.ts),
  [messages]
);

// Vue equivalent:
// const sorted = computed(() => 
//   [...messages.value].sort((a, b) => a.ts - b.ts)
// );
```

**Purpose:**
- Memoizes expensive computations
- Only recalculates when dependencies change
- Prevents unnecessary re-renders

### Custom Hook: `useWebPubSub`

#### Hook Structure
```typescript
function useWebPubSub(room: string) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const clientRef = useRef<WebPubSubClient | WebSocket | null>(null);
  
  useEffect(() => {
    // WebSocket connection logic
    return () => {
      // Cleanup logic
    };
  }, [room]);
  
  return { connected, messages };
}
```

**Key Concepts:**
- **useRef**: Stores mutable values without triggering re-renders
- **useEffect**: Manages side effects and cleanup
- **Dependency Array**: `[room]` means effect re-runs when room changes
- **Cleanup Function**: Prevents memory leaks

#### Connection Management
```typescript
// Negotiate connection
const resp = await fetch("/negotiate");
const { url, mode } = await resp.json();

// Dual-mode support
if (mode === "azure") {
  // Azure WebPubSub client
} else {
  // Native WebSocket
}
```

## Styling with Styled Components

### CSS-in-JS Approach
```typescript
const Bubble = styled.div`
  padding: .5rem .75rem;
  border-radius: .75rem; 
  background: #f2f2f2;
  margin: .25rem 0;
`;
```

**Benefits over traditional CSS:**
- Component-scoped styles (no global conflicts)
- Dynamic styling with props
- Automatic vendor prefixing
- Dead code elimination
- TypeScript integration

**Vue Equivalent:**
```vue
<style scoped>
.bubble {
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  background: #f2f2f2;
  margin: 0.25rem 0;
}
</style>
```

### Responsive Design
```typescript
const Wrap = styled.div`
  margin: 2rem auto;
  max-width: 720px;
  font-family: system-ui, sans-serif;
  
  @media (max-width: 768px) {
    margin: 1rem;
    max-width: 100%;
  }
`;
```

## Event Handling

### Form Events
```typescript
// Controlled input
<Input
  value={text}
  onChange={(e) => setText(e.target.value)}
  onKeyDown={(e) => e.key === "Enter" && send()}
/>

// Vue equivalent:
// <input v-model="text" @keydown.enter="send" />
```

### Synthetic Events
React wraps native events in `SyntheticEvent` for:
- Cross-browser compatibility
- Consistent behavior
- Performance optimization

### Event Handler Patterns
```typescript
// Inline handler (re-creates function on each render)
onClick={(e) => handleClick(e)}

// Optimized with useCallback (for performance-critical cases)
const handleClick = useCallback((e) => {
  // Handle click
}, [dependencies]);
```

## State Management Patterns

### Local State
```typescript
// Simple values
const [loading, setLoading] = useState(false);

// Objects (must create new object)
const [user, setUser] = useState({ name: "", room: "" });
setUser(prev => ({ ...prev, name: "John" }));

// Arrays (must create new array) 
const [items, setItems] = useState([]);
setItems(prev => [...prev, newItem]);
```

### Derived State
```typescript
// Computed values with useMemo
const sortedMessages = useMemo(
  () => messages.sort((a, b) => a.ts - b.ts),
  [messages]
);

// Simple derivation (no memo needed for cheap operations)
const messageCount = messages.length;
const isOnline = connected && messages.length > 0;
```

## WebSocket Integration

### Connection States
```typescript
// Connection status tracking
const [connected, setConnected] = useState(false);

// Connection establishment
useEffect(() => {
  async function connect() {
    try {
      const { url } = await negotiate();
      const client = new WebPubSubClient(url);
      
      client.on("connected", () => setConnected(true));
      client.on("disconnected", () => setConnected(false));
      
      await client.start();
    } catch (error) {
      console.error("Connection failed:", error);
    }
  }
  
  connect();
}, [room]);
```

### Message Handling
```typescript
// Receive messages
client.on("group-data-message", (e) => {
  const message = e.data as ChatMsg;
  setMessages(prev => [...prev, message]);
});

// Send messages (HTTP endpoint)
async function send() {
  await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ room, user: name, text })
  });
  setText(""); // Clear input
}
```

## Component Patterns

### Functional Components
```typescript
// Modern React pattern
export default function App() {
  // All logic using hooks
  const [state, setState] = useState();
  
  return (
    <div>
      {/* JSX content */}
    </div>
  );
}
```

### Controlled Components
```typescript
// React pattern for form inputs
<input 
  value={text}                           // State controls value
  onChange={(e) => setText(e.target.value)} // Manual state update
/>

// Vue equivalent uses v-model for two-way binding
// <input v-model="text" />
```

### Conditional Rendering
```typescript
// Conditional display
{connected ? (
  <span style={{ color: "green" }}>● online</span>
) : (
  <span style={{ color: "red" }}>● offline</span>
)}

// List rendering
{messages.map((msg, index) => (
  <Bubble key={index}>
    <strong>{msg.user}:</strong> {msg.text}
  </Bubble>
))}
```

## TypeScript Integration

### Type Definitions
```typescript
// Message type
type ChatMsg = {
  user: string;
  text: string; 
  ts: number;
};

// Hook return type
function useWebPubSub(room: string): {
  connected: boolean;
  messages: ChatMsg[];
  isMock: boolean;
} {
  // Implementation
}
```

### Generic Types
```typescript
// State with type parameter
const [messages, setMessages] = useState<ChatMsg[]>([]);

// Event handler typing
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // Handle form submission
};
```

### Props Interface
```typescript
interface MessageBubbleProps {
  message: ChatMsg;
  isCurrentUser: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isCurrentUser 
}) => {
  return (
    <Bubble isCurrentUser={isCurrentUser}>
      <strong>{message.user}:</strong> {message.text}
    </Bubble>
  );
};
```

## Performance Optimization

### Memoization
```typescript
// Expensive computations
const sortedMessages = useMemo(
  () => messages.sort((a, b) => a.ts - b.ts),
  [messages]
);

// Function memoization
const handleSend = useCallback(async () => {
  // Send logic
}, [room, name, text]);
```

### Component Memoization
```typescript
// Prevent unnecessary re-renders
const MessageList = React.memo(({ messages }: { messages: ChatMsg[] }) => {
  return (
    <div>
      {messages.map(msg => <MessageBubble key={msg.ts} message={msg} />)}
    </div>
  );
});
```

### Optimization Tips
1. **Keys for Lists**: Use unique, stable keys for list items
2. **Avoid Inline Objects**: Don't create objects in render
3. **Callback Optimization**: Use useCallback for event handlers passed to children
4. **State Structure**: Keep state flat and normalized
5. **Bundle Splitting**: Use dynamic imports for large components

## Testing Strategies

### Component Testing
```typescript
// Jest + React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('sends message on button click', () => {
  render(<App />);
  
  const input = screen.getByPlaceholderText('Type a message...');
  const button = screen.getByText('Send');
  
  fireEvent.change(input, { target: { value: 'Hello' } });
  fireEvent.click(button);
  
  // Assert message was sent
});
```

### Hook Testing
```typescript
import { renderHook, act } from '@testing-library/react';
import { useWebPubSub } from './hooks/useWebPubSub';

test('connects to WebSocket', async () => {
  const { result } = renderHook(() => useWebPubSub('test-room'));
  
  await act(async () => {
    // Wait for connection
  });
  
  expect(result.current.connected).toBe(true);
});
```

## Debugging

### React Developer Tools
- Install browser extension
- Inspect component state and props
- Profile performance
- Debug hooks

### Console Debugging
```typescript
// Debug state changes
useEffect(() => {
  console.log('Messages updated:', messages);
}, [messages]);

// Debug WebSocket events
client.on('group-data-message', (e) => {
  console.log('Received message:', e.data);
});
```

### Error Boundaries
```typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

## Production Build

### Build Process
```bash
# Create production build
npm run build

# Preview build locally
npm run preview
```

### Optimization Features
- **Tree Shaking**: Removes unused code
- **Code Splitting**: Loads components on demand
- **Minification**: Reduces bundle size
- **Asset Optimization**: Compresses images and fonts

### Environment Variables
```bash
# .env.production
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://ws.example.com
```

```typescript
// Access in code
const apiUrl = import.meta.env.VITE_API_URL;
```

## Configuration

### Vite Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Learning Resources

### React Fundamentals
- [React Official Tutorial](https://react.dev/learn)
- [React Hooks Documentation](https://react.dev/reference/react)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### TypeScript with React
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Styling
- [Styled Components Documentation](https://styled-components.com/docs)
- [CSS-in-JS Comparison](https://michelebertoli.github.io/css-in-js/)

### Performance
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Vite Performance Guide](https://vitejs.dev/guide/performance.html)

## Vue.js vs React Comparison

| Concept | Vue.js | React |
|---------|--------|-------|
| **State** | `ref()`, `reactive()` | `useState()` |
| **Effects** | `watchEffect()`, `onMounted()` | `useEffect()` |
| **Computed** | `computed()` | `useMemo()` |
| **Templates** | `<template>` with directives | JSX with expressions |
| **Events** | `@click="handler"` | `onClick={handler}` |
| **Two-way Binding** | `v-model="value"` | `value={value} onChange={setter}` |
| **Loops** | `v-for="item in items"` | `{items.map(item => ...)}` |
| **Conditionals** | `v-if="condition"` | `{condition && <Component />}` |
| **Styling** | `<style scoped>` | Styled Components |
| **Lifecycle** | `onMounted()`, `onUnmounted()` | `useEffect()` |

---

This React frontend demonstrates modern patterns and best practices for building real-time applications with TypeScript and WebSocket integration.