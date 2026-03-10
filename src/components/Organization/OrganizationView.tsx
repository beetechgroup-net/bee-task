import React, { useState } from "react";
import { CreateOrganizationForm } from "./CreateOrganizationForm";
import { OrganizationList } from "./OrganizationList";
import { OrganizationRequests } from "./OrganizationRequests";
import { useOrganizations } from "../../hooks/useOrganizations";
import { useAuth } from "../../context/AuthContext";

type Tab = "my-orgs" | "explore" | "requests" | "create";

export const OrganizationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("my-orgs");
  const {
    organizations,
    loading,
    error,
    requestJoinOrganization,
    acceptRequest,
    rejectRequest,
    removeMember,
  } = useOrganizations();
  const { user } = useAuth();

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading organizations...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", color: "var(--color-danger)" }}>
        {error}
      </div>
    );
  }

  const myOrgs = organizations.filter(
    (org) =>
      org.ownerId === user?.uid ||
      org.members.some((m) => m.userId === user?.uid),
  );

  const exploreOrgs = organizations.filter(
    (org) =>
      org.ownerId !== user?.uid &&
      !org.members.some((m) => m.userId === user?.uid),
  );

  const orgsWithRequests = organizations.filter(
    (org) => org.ownerId === user?.uid && org.pendingRequests.length > 0,
  );

  return (
    <div style={{ padding: "1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Organizations</h1>
        <button
          onClick={() => setActiveTab("create")}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "var(--color-accent)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Create Organization
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "2rem",
          borderBottom: "1px solid var(--color-bg-tertiary)",
        }}
      >
        <button
          onClick={() => setActiveTab("my-orgs")}
          style={{
            padding: "0.5rem 1rem",
            background: "none",
            border: "none",
            borderBottom:
              activeTab === "my-orgs"
                ? "2px solid var(--color-accent)"
                : "2px solid transparent",
            color:
              activeTab === "my-orgs"
                ? "var(--color-accent)"
                : "var(--color-text-secondary)",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          My Organizations ({myOrgs.length})
        </button>
        <button
          onClick={() => setActiveTab("explore")}
          style={{
            padding: "0.5rem 1rem",
            background: "none",
            border: "none",
            borderBottom:
              activeTab === "explore"
                ? "2px solid var(--color-accent)"
                : "2px solid transparent",
            color:
              activeTab === "explore"
                ? "var(--color-accent)"
                : "var(--color-text-secondary)",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Explore ({exploreOrgs.length})
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          style={{
            padding: "0.5rem 1rem",
            background: "none",
            border: "none",
            borderBottom:
              activeTab === "requests"
                ? "2px solid var(--color-accent)"
                : "2px solid transparent",
            color:
              activeTab === "requests"
                ? "var(--color-accent)"
                : "var(--color-text-secondary)",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Requests (
          {orgsWithRequests.reduce(
            (acc, org) => acc + org.pendingRequests.length,
            0,
          )}
          )
        </button>
      </div>

      <div>
        {activeTab === "create" && (
          <CreateOrganizationForm onCreated={() => setActiveTab("my-orgs")} />
        )}
        {activeTab === "my-orgs" && (
          <OrganizationList
            organizations={myOrgs}
            showRequestBtn={false}
            onRemoveMember={removeMember}
            emptyMessage="You are not part of any organization yet."
          />
        )}
        {activeTab === "explore" && (
          <OrganizationList
            organizations={exploreOrgs}
            showRequestBtn={true}
            onRequestJoin={requestJoinOrganization}
            emptyMessage="No new organizations to explore."
          />
        )}
        {activeTab === "requests" && (
          <OrganizationRequests
            organizations={orgsWithRequests}
            onAccept={acceptRequest}
            onReject={rejectRequest}
          />
        )}
      </div>
    </div>
  );
};
