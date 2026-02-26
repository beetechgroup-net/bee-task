import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface BeeDevViewProps {
  onClose: () => void;
}

export const BeeDevView: React.FC<BeeDevViewProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "95vw",
          height: "95vh",
          backgroundColor: isLoading ? "#000" : "#fff",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {isLoading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              zIndex: 5,
            }}
          >
            <style>
              {`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}
            </style>
            <Loader2
              size={48}
              style={{
                animation: "spin 1s linear infinite",
                marginBottom: "1rem",
              }}
            />
            <span style={{ fontSize: "1.2rem", fontWeight: 500 }}>
              Loading...
            </span>
          </div>
        )}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            zIndex: 10,
            background: "rgba(0,0,0,0.5)",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={20} />
        </button>
        <iframe
          src="https://beedev.beetechgroup.net/#content"
          title="Bee Dev"
          onLoad={() => setIsLoading(false)}
          scrolling="no"
          style={{
            width: "100%",
            flex: 1,
            border: "none",
            overflow: "hidden",
            opacity: isLoading ? 0 : 1,
            transition: "opacity 0.3s ease-in-out",
          }}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </div>
  );
};
