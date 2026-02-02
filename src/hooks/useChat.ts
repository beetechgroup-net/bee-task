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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { generateColorFromString } from "../utils/colorUtils";

export interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userEmail: string;
  color: string;
  createdAt: any; // Firestore Timestamp
  replyTo?: {
    id: string;
    userName: string;
    text: string;
  };
  attachmentUrl?: string;
  attachmentType?: "image" | "video" | "audio" | "document";
  attachmentName?: string;
}

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [limitCount, setLimitCount] = useState(50);
  const { user } = useAuth();

  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(msgs.reverse());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [limitCount]);

  const loadMoreMessages = () => {
    setLimitCount((prev) => prev + 50);
  };

  const uploadFile = async (file: File): Promise<string> => {
    if (!user) throw new Error("User not authenticated");
    const storageRef = ref(
      storage,
      `chat-attachments/${Date.now()}_${file.name}`,
    );
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const sendMessage = async (
    text: string,
    replyTo?: ChatMessage["replyTo"],
    attachment?: { file: File; type: "image" | "video" | "audio" | "document" },
  ) => {
    if (!user || (!text.trim() && !attachment)) return;

    try {
      let attachmentUrl = "";
      let attachmentName = "";

      if (attachment) {
        attachmentUrl = await uploadFile(attachment.file);
        attachmentName = attachment.file.name;
      }

      await addDoc(collection(db, "messages"), {
        text: text.trim(),
        userId: user.uid,
        userEmail: user.email || "Anonymous",
        color: generateColorFromString(user.email || user.uid),
        createdAt: serverTimestamp(),
        replyTo: replyTo || null,
        attachmentUrl: attachmentUrl || null,
        attachmentType: attachment?.type || null,
        attachmentName: attachmentName || null,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message.");
    }
  };

  return {
    messages,
    sendMessage,
    loading,
    user,
    loadMoreMessages,
    hasMore: messages.length >= limitCount,
  };
};
