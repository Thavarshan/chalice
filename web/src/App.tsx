import { useMemo, useState, type JSX } from "react";
import styled from "styled-components";
import { useWebPubSub } from "./hooks/useWebPubSub";
import type { ChatMsg } from "./types";

const Wrap = styled.div`
  margin: 2rem auto; max-width: 720px; font-family: system-ui, sans-serif;
`;
const Row = styled.div` display: flex; gap: .5rem; margin-bottom: 1rem; `;
const Input = styled.input` flex: 1; padding: .6rem .8rem; `;
const Btn = styled.button` padding: .6rem 1rem; `;
const Bubble = styled.div`
  padding: .5rem .75rem; border-radius: .75rem; background: #f2f2f2; margin: .25rem 0;
`;

/**
 * Main application component for the Azure PubSub Chat.
 *
 * This component provides a user interface for a chat application that connects to an Azure WebPubSub service.
 * Users can join a chat room, send messages, and view messages from other participants in real-time.
 *
 * @returns {JSX.Element} - The rendered chat application.
 */
export default function App(): JSX.Element {
  // State to store the current chat room name. Defaults to "lobby".
  const [room, setRoom] = useState("lobby");

  // State to store the user's name. Defaults to "Jerome".
  const [name, setName] = useState("Jerome");

  // State to store the text of the message being composed.
  const [text, setText] = useState("");

  // Custom hook to manage WebPubSub connection and messages for the specified room.
  const { connected, messages } = useWebPubSub(room);

  // Memoized array of messages, sorted by timestamp in ascending order.
  const sorted = useMemo(
    () => [...messages].sort((a, b) => a.ts - b.ts),
    [messages] // Recompute only when `messages` changes.
  );

  /**
   * Sends the current message to the server.
   *
   * This function constructs a message payload, sends it to the server via a POST request,
   * and clears the input field upon successful submission.
   */
  async function send() {
    if (!text.trim()) return; // Prevent sending empty messages.

    // Construct the message payload.
    const payload: ChatMsg = {
      user: name || "Anon", // Use the user's name or "Anon" if the name is empty.
      text: text.trim(), // Trim whitespace from the message text.
      ts: Date.now(), // Use the current timestamp.
    };

    // Send the message to the server.
    await fetch("http://localhost:3001/chat", {
      method: "POST", // HTTP POST request.
      headers: { "Content-Type": "application/json" }, // JSON content type.
      body: JSON.stringify({ room, user: payload.user, text: payload.text }), // Request body.
    });

    setText(""); // Clear the input field.
  }

  return (
    <Wrap>
      {/* Input fields for user name, room name, and connection status */}
      <Row>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)} // Update the user's name.
          placeholder="Your name" // Placeholder text.
        />
        <Input
          value={room}
          onChange={(e) => setRoom(e.target.value)} // Update the room name.
          placeholder="Room" // Placeholder text.
        />
        <span>• {connected ? "online" : "offline"}</span> {/* Connection status */}
      </Row>

      {/* Message display area */}
      <div style={{ border: "1px solid #ddd", padding: ".75rem", minHeight: 260 }}>
        {sorted.map((m, i) => (
          <Bubble key={i}>
            <strong>{m.user}:</strong> {m.text} {/* Display user and message text */}
          </Bubble>
        ))}
      </div>

      {/* Input field and button for sending messages */}
      <Row style={{ marginTop: ".75rem" }}>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)} // Update the message text.
          onKeyDown={(e) => e.key === "Enter" && send()} // Send message on Enter key press.
          placeholder="Type a message..." // Placeholder text.
        />
        <Btn onClick={send}>Send</Btn> {/* Send button */}
      </Row>
    </Wrap>
  );
}

/**
 * KEY TAKEAWAYS FOR VUE DEVELOPERS:
 *
 * 1. REACT HOOKS vs VUE COMPOSITION API:
 *    - useState ~ ref()
 *    - useEffect ~ watchEffect/onMounted/onUnmounted
 *    - useMemo ~ computed()
 *    - Custom hooks ~ composables
 *
 * 2. COMPONENT PATTERNS:
 *    - Functional components with hooks (modern React)
 *    - Props down, events up (similar to Vue)
 *    - Controlled components for form inputs
 *
 * 3. STYLING APPROACHES:
 *    - Styled Components (CSS-in-JS)
 *    - CSS Modules
 *    - Regular CSS classes
 *    - Inline styles (for dynamic styles)
 *
 * 4. STATE MANAGEMENT:
 *    - Local state: useState
 *    - Global state: Context API, Redux, Zustand
 *    - Server state: React Query, SWR
 *
 * 5. TYPESCRIPT INTEGRATION:
 *    - Type props and state
 *    - Use interfaces for complex objects
 *    - Generic components with <T>
 */
