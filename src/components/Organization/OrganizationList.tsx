import React, { useState } from "react";
import type {
  Organization,
  OrganizationMember,
  OrganizationProject,
} from "../../types";
import { useAuth } from "../../context/AuthContext";

interface OrganizationListProps {
  organizations: Organization[];
  showRequestBtn?: boolean;
  onRequestJoin?: (orgId: string) => Promise<void>;
  onRemoveMember?: (orgId: string, member: OrganizationMember) => Promise<void>;
  onAddProject?: (orgId: string, name: string, color: string) => Promise<void>;
  onRemoveProject?: (
    orgId: string,
    project: OrganizationProject,
  ) => Promise<void>;
  emptyMessage: string;
}

export const OrganizationList: React.FC<OrganizationListProps> = ({
  organizations,
  showRequestBtn,
  onRequestJoin,
  onRemoveMember,
  onAddProject,
  onRemoveProject,
  emptyMessage,
}) => {
  const { user } = useAuth();
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);
  const [expandedProjectsOrgId, setExpandedProjectsOrgId] = useState<
    string | null
  >(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState("#94a3b8");
  const [isAddingProject, setIsAddingProject] = useState<string | null>(null);
  const [removingProjectId, setRemovingProjectId] = useState<string | null>(
    null,
  );

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

  const handleAddProject = async (orgId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddProject || !newProjectName.trim()) return;

    setIsAddingProject(orgId);
    try {
      await onAddProject(orgId, newProjectName, newProjectColor);
      setNewProjectName("");
      setNewProjectColor("#94a3b8");
    } catch (error) {
      console.error(error);
      alert("Failed to add project.");
    } finally {
      setIsAddingProject(null);
    }
  };

  const handleRemoveProject = async (
    orgId: string,
    project: OrganizationProject,
  ) => {
    if (!onRemoveProject) return;
    if (
      !window.confirm(
        `Are you sure you want to remove project "${project.name}"?`,
      )
    )
      return;

    setRemovingProjectId(`${orgId}-${project.id}`);
    try {
      await onRemoveProject(orgId, project);
    } catch (error) {
      console.error(error);
      alert("Failed to remove project.");
    } finally {
      setRemovingProjectId(null);
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

            {/* Projects List Toggle for "My Organizations" */}
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
                    setExpandedProjectsOrgId(
                      expandedProjectsOrgId === org.id ? null : org.id,
                    )
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
                  {expandedProjectsOrgId === org.id
                    ? "Hide Projects"
                    : `View Projects (${org.projects?.length || 0})`}
                </button>

                {expandedProjectsOrgId === org.id && (
                  <div
                    style={{
                      marginTop: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    {/* Add Project Form */}
                    <form
                      onSubmit={(e) => handleAddProject(org.id, e)}
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="color"
                        value={newProjectColor}
                        onChange={(e) => setNewProjectColor(e.target.value)}
                        style={{
                          width: "30px",
                          height: "30px",
                          padding: 0,
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      />
                      <input
                        type="text"
                        placeholder="New project name"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        required
                        style={{
                          flex: 1,
                          padding: "0.5rem",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--color-bg-tertiary)",
                          backgroundColor: "var(--color-bg-primary)",
                          color: "var(--color-text-primary)",
                          fontSize: "0.875rem",
                        }}
                      />
                      <button
                        type="submit"
                        disabled={
                          isAddingProject === org.id || !newProjectName.trim()
                        }
                        style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: "var(--color-accent)",
                          color: "white",
                          border: "none",
                          borderRadius: "var(--radius-md)",
                          cursor:
                            isAddingProject === org.id || !newProjectName.trim()
                              ? "not-allowed"
                              : "pointer",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          opacity:
                            isAddingProject === org.id || !newProjectName.trim()
                              ? 0.7
                              : 1,
                        }}
                      >
                        {isAddingProject === org.id ? "Adding..." : "Add"}
                      </button>
                    </form>

                    {/* Project List */}
                    {org.projects && org.projects.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.5rem",
                        }}
                      >
                        {org.projects.map((proj) => {
                          const isRemovingProj =
                            removingProjectId === `${org.id}-${proj.id}`;

                          return (
                            <div
                              key={proj.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "0.5rem 0.75rem",
                                backgroundColor: "var(--color-bg-primary)",
                                borderRadius: "var(--radius-md)",
                                borderLeft: `4px solid ${proj.color}`,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "0.875rem",
                                  fontWeight: 500,
                                }}
                              >
                                {proj.name}
                              </span>
                              <button
                                onClick={() =>
                                  handleRemoveProject(org.id, proj)
                                }
                                disabled={isRemovingProj}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "var(--color-danger)",
                                  cursor: isRemovingProj
                                    ? "not-allowed"
                                    : "pointer",
                                  fontSize: "0.75rem",
                                  opacity: isRemovingProj ? 0.5 : 1,
                                }}
                              >
                                {isRemovingProj ? "..." : "Remove"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--color-text-secondary)",
                          fontStyle: "italic",
                        }}
                      >
                        No projects yet. Add one above.
                      </div>
                    )}
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
