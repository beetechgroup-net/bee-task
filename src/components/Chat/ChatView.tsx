import React, { useState, useRef, useEffect } from "react";
import { useChat } from "../../hooks/useChat";
import { Send, Volume2 } from "lucide-react";

export const ChatView: React.FC = () => {
  const { messages, sendMessage, user } = useChat();
  const [newMessage, setNewMessage] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      await sendMessage(newMessage);
      setNewMessage("");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 4rem)", // Adjust based on layout padding
        maxHeight: "800px",
        backgroundColor: "var(--color-bg-secondary)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-bg-tertiary)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "1rem",
          borderBottom: "1px solid var(--color-bg-tertiary)",
          backgroundColor: "rgba(15, 23, 42, 0.5)",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
          Global Team Chat
        </h2>
      </div>

      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {messages.map((msg) => {
          const isOwn = msg.userId === user?.uid;
          return (
            <div
              key={msg.id}
              style={{
                alignSelf: isOwn ? "flex-end" : "flex-start",
                maxWidth: "70%",
                display: "flex",
                flexDirection: "column",
                alignItems: isOwn ? "flex-end" : "flex-start",
              }}
            >
              {!isOwn && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: msg.color,
                    marginBottom: "0.25rem",
                    fontWeight: 500,
                  }}
                >
                  {msg.userEmail.split("@")[0]}
                </span>
              )}
              <div
                style={{
                  backgroundColor: isOwn
                    ? "var(--color-accent)"
                    : "var(--color-bg-tertiary)",
                  color: "#fff",
                  padding: "0.75rem 1rem",
                  borderRadius: "1rem",
                  borderTopRightRadius: isOwn ? "0" : "1rem",
                  borderTopLeftRadius: !isOwn ? "0" : "1rem",
                  boxShadow: "var(--shadow-sm)",
                  wordBreak: "break-word",
                  position: "relative",
                }}
                className="message-bubble"
              >
                {msg.text}
                <button
                  onClick={() => {
                    const utterance = new SpeechSynthesisUtterance(msg.text);
                    window.speechSynthesis.speak(utterance);
                  }}
                  style={{
                    position: "absolute",
                    top: "50%",
                    transform: "translateY(-50%)",
                    right: isOwn ? "100%" : "auto",
                    left: isOwn ? "auto" : "100%",
                    margin: "0 0.5rem",
                    opacity: 0,
                    transition: "opacity 0.2s",
                    color: "var(--color-text-secondary)",
                    cursor: "pointer",
                    padding: "0.25rem",
                  }}
                  className="tts-button"
                  title="Read aloud"
                >
                  <Volume2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSend}
        style={{
          padding: "1rem",
          borderTop: "1px solid var(--color-bg-tertiary)",
          display: "flex",
          gap: "0.75rem",
          backgroundColor: "var(--color-bg-secondary)",
        }}
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "0.75rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-bg-tertiary)",
            backgroundColor: "var(--color-bg-primary)",
            color: "var(--color-text-primary)",
          }}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          style={{
            backgroundColor: "var(--color-accent)",
            color: "#fff",
            padding: "0.75rem",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: newMessage.trim() ? 1 : 0.5,
          }}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};
