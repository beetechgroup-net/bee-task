import React, { useState } from "react";
import type { Organization, OrganizationMember } from "../../types";
import { useAuth } from "../../context/AuthContext";

interface OrganizationListProps {
  organizations: Organization[];
  showRequestBtn?: boolean;
  onRequestJoin?: (orgId: string) => Promise<void>;
  onRemoveMember?: (orgId: string, member: OrganizationMember) => Promise<void>;
  emptyMessage: string;
}

export const OrganizationList: React.FC<OrganizationListProps> = ({
  organizations,
  showRequestBtn,
  onRequestJoin,
  onRemoveMember,
  emptyMessage,
}) => {
  const { user } = useAuth();
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);

  if (organizations.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "3rem",
          color: "var(--color-text-secondary)",
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  const handleRequestJoin = async (orgId: string) => {
    if (!onRequestJoin) return;
    setRequestingId(orgId);
    try {
      await onRequestJoin(orgId);
    } catch (error) {
      console.error(error);
      alert("Failed to send request.");
    } finally {
      setRequestingId(null);
    }
  };

  const handleRemoveMember = async (
    orgId: string,
    member: OrganizationMember,
  ) => {
    if (!onRemoveMember) return;
    if (
      !window.confirm(
        `Are you sure you want to remove ${member.userName || member.userEmail}?`,
      )
    )
      return;

    setRemovingId(`${orgId}-${member.userId}`);
    try {
      await onRemoveMember(orgId, member);
    } catch (error) {
      console.error(error);
      alert("Failed to remove member.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "1.5rem",
        alignItems: "start",
      }}
    >
      {organizations.map((org) => {
        const hasRequested = org.pendingRequests.some(
          (req) => req.userId === user?.uid,
        );
        const isOwner = org.ownerId === user?.uid;

        let role = "Member";
        if (isOwner) role = "Owner";

        return (
          <div
            key={org.id}
            style={{
              backgroundColor: "var(--color-bg-secondary)",
              padding: "1.5rem",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-bg-tertiary)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem 0" }}>
              {org.name}
            </h3>
            {org.description && (
              <p
                style={{
                  color: "var(--color-text-secondary)",
                  fontSize: "0.875rem",
                  marginBottom: "1rem",
                }}
              >
                {org.description}
              </p>
            )}

            <div
              style={{
                marginTop: "auto",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                {org.members.length}{" "}
                {org.members.length === 1 ? "member" : "members"}
              </span>

              {!showRequestBtn ? (
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--color-accent)",
                    backgroundColor: "var(--color-accent-transparent)",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "1rem",
                  }}
                >
                  {role}
                </span>
              ) : (
                <button
                  onClick={() => handleRequestJoin(org.id)}
                  disabled={hasRequested || requestingId === org.id}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: hasRequested
                      ? "var(--color-bg-tertiary)"
                      : "var(--color-accent)",
                    color: hasRequested
                      ? "var(--color-text-secondary)"
                      : "white",
                    border: "none",
                    borderRadius: "var(--radius-md)",
                    cursor: hasRequested ? "not-allowed" : "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  {requestingId === org.id
                    ? "Requesting..."
                    : hasRequested
                      ? "Request Sent"
                      : "Request to Join"}
                </button>
              )}
            </div>

            {/* Members List Toggle for "My Organizations" */}
            {!showRequestBtn && (
              <div
                style={{
                  marginTop: "1rem",
                  borderTop: "1px solid var(--color-bg-tertiary)",
                  paddingTop: "1rem",
                }}
              >
                <button
                  onClick={() =>
                    setExpandedOrgId(expandedOrgId === org.id ? null : org.id)
                  }
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-accent)",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    padding: 0,
                  }}
                >
                  {expandedOrgId === org.id ? "Hide Members" : "View Members"}
                </button>

                {expandedOrgId === org.id && (
                  <div
                    style={{
                      marginTop: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    {org.members.map((member) => {
                      const isMemberOwner = member.userId === org.ownerId;
                      const isRemoving =
                        removingId === `${org.id}-${member.userId}`;

                      return (
                        <div
                          key={member.userId}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.75rem",
                            backgroundColor: "var(--color-bg-primary)",
                            borderRadius: "var(--radius-md)",
                            fontSize: "0.875rem",
                          }}
                        >
                          <div
                            style={{ display: "flex", flexDirection: "column" }}
                          >
                            <span style={{ fontWeight: 500 }}>
                              {member.userName || member.userEmail || "Unknown"}
                              {isMemberOwner && (
                                <span
                                  style={{
                                    marginLeft: "0.5rem",
                                    fontSize: "0.7rem",
                                    color: "var(--color-accent)",
                                    backgroundColor:
                                      "var(--color-accent-transparent)",
                                    padding: "0.1rem 0.3rem",
                                    borderRadius: "0.5rem",
                                  }}
                                >
                                  Owner
                                </span>
                              )}
                            </span>
                            <span
                              style={{
                                color: "var(--color-text-secondary)",
                                fontSize: "0.75rem",
                              }}
                            >
                              {member.userEmail}
                            </span>
                          </div>

                          {isOwner && !isMemberOwner && (
                            <button
                              onClick={() => handleRemoveMember(org.id, member)}
                              disabled={isRemoving}
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--color-danger)",
                                cursor: isRemoving ? "not-allowed" : "pointer",
                                fontSize: "0.875rem",
                                opacity: isRemoving ? 0.5 : 1,
                                padding: "0.25rem 0.5rem",
                              }}
                            >
                              {isRemoving ? "..." : "Remove"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
