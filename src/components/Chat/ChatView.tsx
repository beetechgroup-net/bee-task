import React, { useState, useRef, useEffect } from "react";
import { useChat } from "../../hooks/useChat";
import { Send, Volume2, Mic, MicOff } from "lucide-react";

export const ChatView: React.FC = () => {
  const { messages, sendMessage, user } = useChat();
  const [newMessage, setNewMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatMessageDate = (createdAt: any) => {
    if (!createdAt) return "";
    // Handle Firestore Timestamp or Date object
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    if (isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support Speech to Text.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR"; // Set to Portuguese
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      // We append final transcript to existing message
      if (finalTranscript) {
        setNewMessage((prev) => prev + (prev ? " " : "") + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      await sendMessage(newMessage);
      setNewMessage("");
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 4rem)",
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
                    utterance.lang = "pt-BR";
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
              <span
                style={{
                  fontSize: "0.65rem",
                  color: "var(--color-text-tertiary)",
                  marginTop: "0.2rem",
                  alignSelf: isOwn ? "flex-end" : "flex-start",
                  opacity: 0.8,
                }}
              >
                {formatMessageDate(msg.createdAt)}
              </span>
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
        <button
          type="button"
          onClick={toggleListening}
          style={{
            backgroundColor: isListening
              ? "var(--color-danger)"
              : "var(--color-bg-tertiary)",
            color: "#fff",
            padding: "0.75rem",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s",
          }}
          title={isListening ? "Stop listening" : "Start dictation"}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isListening ? "Listening..." : "Type a message..."}
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
