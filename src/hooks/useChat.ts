import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { generateColorFromString } from "../utils/colorUtils";

export interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userEmail: string;
  color: string;
  createdAt: any; // Firestore Timestamp
}

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      orderBy("createdAt", "desc"),
      limit(50),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      // Reverse to show oldest at top if we render bottom-up, or keep desc.
      // Usually chat renders bottom-up (newest at bottom).
      // If we fetch desc (newest first), we should reverse it for display.
      setMessages(msgs.reverse());
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async (text: string) => {
    if (!user || !text.trim()) return;

    try {
      await addDoc(collection(db, "messages"), {
        text: text.trim(),
        userId: user.uid,
        userEmail: user.email || "Anonymous",
        color: generateColorFromString(user.email || user.uid),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Check your permissions.");
    }
  };

  return { messages, sendMessage, loading, user };
};
