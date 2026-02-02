import React, { useState, useRef, useEffect } from "react";
import { useChat, type ChatMessage } from "../../hooks/useChat";
import {
  Send,
  Volume2,
  Mic,
  MicOff,
  User as UserIcon,
  Reply,
  X,
} from "lucide-react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatContext } from "../../context/ChatContext";

interface OnlineUser {
  uid: string;
  displayName: string;
  photoURL: string;
  lastSeen: number;
}

export const ChatView: React.FC = () => {
  const { messages, sendMessage, user } = useChat();
  const { setIsChatOpen } = useChatContext();
  const [newMessage, setNewMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Monitor Online Users
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("lastSeen", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const threshold = 10 * 60 * 1000; // 10 minutes

      const active = snapshot.docs
        .map((doc) => ({ uid: doc.id, ...doc.data() }) as OnlineUser)
        .filter((u) => u.lastSeen && now - u.lastSeen < threshold);

      setOnlineUsers(active);
    });

    return () => unsubscribe();
  }, []);

  // Mark chat as open immediately
  useEffect(() => {
    setIsChatOpen(true);
    return () => setIsChatOpen(false);
  }, []);

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
      await sendMessage(
        newMessage,
        replyingTo
          ? {
              id: replyingTo.id,
              userName: replyingTo.userEmail.split("@")[0],
              text: replyingTo.text,
            }
          : undefined,
      );

      setNewMessage("");
      setReplyingTo(null);
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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
          Global Team Chat
        </h2>
        <span style={{ fontSize: "0.8rem", color: "var(--color-success)" }}>
          {onlineUsers.length} Online
        </span>
      </div>

      {/* Online Users List */}
      <div
        style={{
          padding: "0.75rem 1rem",
          borderBottom: "1px solid var(--color-bg-tertiary)",
          display: "flex",
          gap: "1rem",
          overflowX: "auto",
          backgroundColor: "var(--color-bg-secondary)",
          minHeight: "85px",
        }}
      >
        {onlineUsers.map((u) => (
          <div
            key={u.uid}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: "60px",
            }}
          >
            <div style={{ position: "relative" }}>
              {u.photoURL ? (
                <img
                  src={u.photoURL}
                  alt={u.displayName}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "2px solid var(--color-bg-tertiary)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    backgroundColor: "var(--color-bg-tertiary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UserIcon size={20} />
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-success)",
                  border: "2px solid var(--color-bg-secondary)",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "0.7rem",
                marginTop: "0.25rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
              }}
            >
              {u.displayName?.split(" ")[0]}
            </span>
          </div>
        ))}
        {onlineUsers.length === 0 && (
          <div
            style={{
              color: "var(--color-text-tertiary)",
              fontSize: "0.8rem",
              fontStyle: "italic",
              margin: "auto",
            }}
          >
            No one else is online
          </div>
        )}
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
                position: "relative",
                marginBottom: "0.5rem",
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget.querySelector(
                  ".reply-btn",
                ) as HTMLElement;
                if (btn) btn.style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget.querySelector(
                  ".reply-btn",
                ) as HTMLElement;
                if (btn) btn.style.opacity = "0";
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
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "0.5rem",
                  flexDirection: isOwn ? "row-reverse" : "row",
                }}
              >
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
                    minWidth: "120px",
                  }}
                  className="message-bubble"
                >
                  {/* Quoted Message */}
                  {msg.replyTo && (
                    <div
                      style={{
                        backgroundColor: "rgba(0,0,0,0.2)",
                        borderRadius: "0.5rem",
                        padding: "0.5rem",
                        marginBottom: "0.5rem",
                        fontSize: "0.75rem",
                        borderLeft: "2px solid rgba(255,255,255,0.5)",
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: "0.1rem" }}>
                        {msg.replyTo.userName}
                      </div>
                      <div
                        style={{
                          fontStyle: "italic",
                          opacity: 0.9,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "200px",
                        }}
                      >
                        {msg.replyTo.text}
                      </div>
                    </div>
                  )}

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

                {/* Reply Button */}
                <button
                  className="reply-btn"
                  onClick={() => setReplyingTo(msg)}
                  style={{
                    background: "var(--color-bg-tertiary)",
                    border: "none",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    opacity: 0,
                    transition: "opacity 0.2s",
                    color: "var(--color-text-secondary)",
                  }}
                  title="Reply"
                >
                  <Reply size={14} />
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

      {/* Reply Banner */}
      {replyingTo && (
        <div
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "var(--color-bg-tertiary)",
            borderTop: "1px solid var(--color-bg-tertiary)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.85rem",
          }}
        >
          <div>
            <span style={{ color: "var(--color-text-secondary)" }}>
              Replying to{" "}
            </span>
            <span style={{ fontWeight: 600 }}>
              {replyingTo.userEmail.split("@")[0]}
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

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
