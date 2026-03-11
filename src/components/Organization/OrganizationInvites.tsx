import React, { useState } from "react";
import type { OrganizationInvite } from "../../types";

interface OrganizationInvitesProps {
  invites: OrganizationInvite[];
  onAccept: (invite: OrganizationInvite) => Promise<void>;
  onDecline: (invite: OrganizationInvite) => Promise<void>;
}

export const OrganizationInvites: React.FC<OrganizationInvitesProps> = ({
  invites,
  onAccept,
  onDecline,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (invites.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "3rem",
          color: "var(--color-text-secondary)",
        }}
      >
        You have no pending invitations.
      </div>
    );
  }

  const handleAccept = async (invite: OrganizationInvite) => {
    setProcessingId(invite.id);
    try {
      await onAccept(invite);
    } catch (err) {
      alert("Failed to accept invitation.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invite: OrganizationInvite) => {
    setProcessingId(invite.id);
    try {
      await onDecline(invite);
    } catch (err) {
      alert("Failed to decline invitation.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {invites.map((invite) => (
        <div
          key={invite.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem 1.5rem",
            backgroundColor: "var(--color-bg-secondary)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-bg-tertiary)",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
          >
            <span style={{ fontWeight: 600, fontSize: "1rem" }}>
              {invite.orgName}
            </span>
            <span
              style={{
                fontSize: "0.85rem",
                color: "var(--color-text-secondary)",
              }}
            >
              Invited you to join their organization
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => handleAccept(invite)}
              disabled={processingId === invite.id}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "var(--color-accent)",
                color: "white",
                border: "none",
                borderRadius: "var(--radius-md)",
                cursor: processingId === invite.id ? "not-allowed" : "pointer",
                fontWeight: 500,
                opacity: processingId === invite.id ? 0.7 : 1,
              }}
            >
              {processingId === invite.id ? "Processing..." : "Accept"}
            </button>
            <button
              onClick={() => handleDecline(invite)}
              disabled={processingId === invite.id}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "transparent",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-bg-tertiary)",
                borderRadius: "var(--radius-md)",
                cursor: processingId === invite.id ? "not-allowed" : "pointer",
                fontWeight: 500,
                opacity: processingId === invite.id ? 0.7 : 1,
              }}
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
