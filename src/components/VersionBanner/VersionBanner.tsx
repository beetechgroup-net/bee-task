import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Gift } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { versionConfig } from "../../config/version";

export const VersionBanner: React.FC = () => {
  const { dismissVersionBanner, checkVersionBanner } = useStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen this version
    if (checkVersionBanner(versionConfig.version)) {
      setOpen(true);
    }
  }, [versionConfig.version, checkVersionBanner]);

  const handleClose = () => {
    setOpen(false);
    dismissVersionBanner(versionConfig.version);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            animation: "overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
        <Dialog.Content
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            borderRadius: "var(--radius-lg)",
            boxShadow:
              "hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px",
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90vw",
            maxWidth: "500px",
            maxHeight: "85vh",
            padding: "1.5rem",
            zIndex: 9999,
            animation: "contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
            border: "1px solid var(--color-bg-tertiary)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <Dialog.Title
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--color-accent)",
              }}
            >
              <Gift size={24} />
              New Version: {versionConfig.version} Available!
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                style={{
                  color: "var(--color-text-secondary)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div
            style={{
              marginBottom: "1.5rem",
              lineHeight: 1.6,
              color: "var(--color-text-primary)",
            }}
          >
            <div>
              <h4
                style={{
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                  color: "var(--color-accent)",
                }}
              >
                🚀 What's New:
              </h4>
              <ul
                style={{
                  paddingLeft: "1.2rem",
                  marginBottom: "1rem",
                  listStyleType: "disc",
                }}
              >
                {versionConfig.features.map(
                  (feature: string, index: number) => (
                    <li key={index} style={{ marginBottom: "0.5rem" }}>
                      {feature}
                    </li>
                  ),
                )}
              </ul>
              <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                Enjoy the new update! 🐝
              </p>
            </div>
          </div>

          <div
            style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}
          >
            <button
              onClick={handleClose}
              style={{
                backgroundColor: "var(--color-accent)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius-md)",
                padding: "0.5rem 1rem",
                fontSize: "0.9rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
