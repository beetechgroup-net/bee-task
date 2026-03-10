import React, { useState } from "react";
import type { Organization, OrganizationRequest } from "../../types";

interface OrganizationRequestsProps {
  organizations: Organization[];
  onAccept: (orgId: string, request: OrganizationRequest) => Promise<void>;
  onReject: (orgId: string, request: OrganizationRequest) => Promise<void>;
}

export const OrganizationRequests: React.FC<OrganizationRequestsProps> = ({
  organizations,
  onAccept,
  onReject,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (organizations.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "3rem",
          color: "var(--color-text-secondary)",
        }}
      >
        No pending requests.
      </div>
    );
  }

  const handleAction = async (
    orgId: string,
    request: OrganizationRequest,
    action: "accept" | "reject",
  ) => {
    setProcessingId(`${orgId}-${request.userId}`);
    try {
      if (action === "accept") {
        await onAccept(orgId, request);
      } else {
        await onReject(orgId, request);
      }
    } catch (error) {
      console.error(error);
      alert(`Failed to ${action} request.`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {organizations.map((org) => (
        <div
          key={org.id}
          style={{
            backgroundColor: "var(--color-bg-secondary)",
            padding: "1.5rem",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-bg-tertiary)",
          }}
        >
          <h3 style={{ fontSize: "1.25rem", margin: "0 0 1rem 0" }}>
            {org.name} - Pending Requests
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {org.pendingRequests.map((req) => {
              const isProcessing = processingId === `${org.id}-${req.userId}`;

              return (
                <div
                  key={req.userId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1rem",
                    backgroundColor: "var(--color-bg-primary)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-bg-tertiary)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>
                      {req.userName || req.userEmail || "Unknown User"}
                    </span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      Requested on{" "}
                      {new Date(req.requestedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => handleAction(org.id, req, "accept")}
                      disabled={isProcessing}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: "var(--color-success)",
                        color: "white",
                        border: "none",
                        borderRadius: "var(--radius-md)",
                        cursor: isProcessing ? "not-allowed" : "pointer",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        opacity: isProcessing ? 0.7 : 1,
                      }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleAction(org.id, req, "reject")}
                      disabled={isProcessing}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: "var(--color-danger)",
                        color: "white",
                        border: "none",
                        borderRadius: "var(--radius-md)",
                        cursor: isProcessing ? "not-allowed" : "pointer",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        opacity: isProcessing ? 0.7 : 1,
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
