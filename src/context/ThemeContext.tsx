import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>("dark"); // Default to dark

  // Load theme from local storage or Firebase on mount
  useEffect(() => {
    const loadTheme = async () => {
      // 1. Check local storage first for immediate feedback
      const localTheme = localStorage.getItem("theme") as Theme;
      if (localTheme) {
        setTheme(localTheme);
        document.documentElement.setAttribute("data-theme", localTheme);
      }

      // 2. If user is logged in, check Firebase
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (
              userData.theme &&
              (userData.theme === "light" || userData.theme === "dark")
            ) {
              setTheme(userData.theme);
              localStorage.setItem("theme", userData.theme);
              document.documentElement.setAttribute(
                "data-theme",
                userData.theme,
              );
            }
          }
        } catch (error) {
          console.error("Error fetching theme from Firebase:", error);
        }
      }
    };

    loadTheme();
  }, [user]);

  const toggleTheme = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);

    // Save to Firebase if user is logged in
    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { theme: newTheme }, { merge: true });
      } catch (error) {
        console.error("Error saving theme to Firebase:", error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
