import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  onSnapshot,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { generateColorFromString } from "../utils/colorUtils";

export interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userEmail: string;
  userRole?: string;
  color: string;
  createdAt: any; // Firestore Timestamp
  replyTo?: {
    id: string;
    userName: string;
    text: string;
  };
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

  const sendMessage = async (
    text: string,
    replyTo?: ChatMessage["replyTo"],
  ) => {
    if (!user || !text.trim()) return;

    try {
      // Fetch user role
      let userRole = "";
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        userRole = userDoc.data().role || "";
      }

      await addDoc(collection(db, "messages"), {
        text: text.trim(),
        userId: user.uid,
        userEmail: user.email || "Anonymous",
        userRole: userRole,
        color: generateColorFromString(user.email || user.uid),
        createdAt: serverTimestamp(),
        replyTo: replyTo || null,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Check your permissions.");
    }
  };

  return { messages, sendMessage, loading, user };
};
