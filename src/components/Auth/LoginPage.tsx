import React from "react";
import { useAuth } from "../../context/AuthContext";
import { LogIn } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { signInWithGoogle } = useAuth();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "var(--color-bg-primary)",
        color: "var(--color-text-primary)",
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--color-bg-secondary)",
          padding: "2.5rem",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        <img
          src="/logo.png"
          alt="BeeTask Logo"
          style={{ width: "80px", height: "80px", objectFit: "contain" }}
        />
        <div>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
            BeeTask
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Sign in to access your tasks and projects.
          </p>
        </div>

        <button
          onClick={signInWithGoogle}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            width: "100%",
            padding: "0.875rem",
            backgroundColor: "var(--color-accent)",
            color: "#fff",
            borderRadius: "var(--radius-md)",
            fontSize: "1rem",
            fontWeight: 500,
            transition: "background-color 0.2s",
            cursor: "pointer",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor =
              "var(--color-accent-hover)")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--color-accent)")
          }
        >
          <LogIn size={20} />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};
