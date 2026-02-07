import { useEffect, useRef, useState } from "react";
import { db } from "../lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

// Helper to get or create a stable User ID for this browser
export const getUserId = () => {
  let uid = window.localStorage.getItem("bee_task_user_id");
  if (!uid) {
    uid = uuidv4();
    window.localStorage.setItem("bee_task_user_id", uid);
  }
  return uid;
};

export const useFirestoreSync = <T>(
  collectionName: string,
  localData: T,
  setLocalData: (data: T) => void,
  explicitUserId?: string,
  options?: { isGlobal?: boolean },
) => {
  const userId = explicitUserId;
  const isGlobal = options?.isGlobal;
  const isRemoteUpdate = useRef(false);
  const localDataRef = useRef(localData);
  const [isSynchronized, setIsSynchronized] = useState(false);

  // Keep ref in sync with latest localData
  useEffect(() => {
    localDataRef.current = localData;
  }, [localData]);

  // 1. Real-time Sync: Listen to Firestore changes
  useEffect(() => {
    if (!userId && !isGlobal) {
      setIsSynchronized(false);
      return;
    }

    // Reset sync state when user/collection changes
    setIsSynchronized(false);

    const targetName = isGlobal ? "GLOBAL" : userId;
    console.log(
      `[Firestore] Subscribing to ${collectionName} for ${targetName}...`,
    );

    const docRef = isGlobal
      ? doc(db, "global_data", collectionName)
      : doc(db, "users", userId!, "data", collectionName);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data().items as T;
          const currentLocal = localDataRef.current;

          // Deep compare to avoid loops.
          const serverJson = JSON.stringify(data);
          const localJson = JSON.stringify(currentLocal);

          if (serverJson !== localJson) {
            console.log(
              `[Firestore] Remote update received for ${collectionName}. Updating local...`,
            );
            isRemoteUpdate.current = true;
            setLocalData(data);
          } else {
            console.log(
              `[Firestore] Remote data matches local for ${collectionName}. Skipping update.`,
            );
          }
        } else {
          console.log(
            `[Firestore] No data found on server for ${collectionName}.`,
          );
        }
        setIsSynchronized(true);
      },
      (error) => {
        console.error(
          `[Firestore] Error listening to ${collectionName}:`,
          error,
        );
      },
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, collectionName, isGlobal]);

  // 2. Sync: Save to Firestore whenever localData changes
  useEffect(() => {
    const saveData = async () => {
      if (!userId && !isGlobal) return;

      // Block saving until we have synced with server at least once
      if (!isSynchronized) {
        // console.log(`[Firestore] Waiting for initial sync for ${collectionName}...`);
        return;
      }

      // If this change was caused by a remote update, don't write it back
      if (isRemoteUpdate.current) {
        console.log(
          `[Firestore] Skipping save for ${collectionName} (remote update detected)`,
        );
        isRemoteUpdate.current = false;
        return;
      }

      try {
        console.log(
          `[Firestore] Saving ${collectionName} (${Array.isArray(localData) ? localData.length : 0} items)`,
        );
        const docRef = isGlobal
          ? doc(db, "global_data", collectionName)
          : doc(db, "users", userId!, "data", collectionName);

        await setDoc(docRef, { items: localData }, { merge: true });
        console.log(`[Firestore] Saved ${collectionName} successfully.`);
      } catch (e) {
        console.error("Error saving to Firestore:", e);
      }
    };

    if (localData && (userId || isGlobal)) {
      saveData();
    }
  }, [localData, collectionName, userId, isSynchronized, isGlobal]);
};
