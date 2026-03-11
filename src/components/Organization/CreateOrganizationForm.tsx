import React, { useState } from "react";
import { useOrganizations } from "../../hooks/useOrganizations";

interface CreateOrganizationFormProps {
  onCreated: () => void;
}

export const CreateOrganizationForm: React.FC<CreateOrganizationFormProps> = ({
  onCreated,
}) => {
  const { createOrganization } = useOrganizations();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await createOrganization(name, description);
      setName("");
      setDescription("");
      onCreated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create organization",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        backgroundColor: "var(--color-bg-secondary)",
        padding: "2rem",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <h2 style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}>
        Create New Organization
      </h2>
      {error && (
        <div style={{ color: "var(--color-danger)", marginBottom: "1rem" }}>
          {error}
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label
            htmlFor="orgName"
            style={{ fontSize: "0.875rem", fontWeight: 500 }}
          >
            Name
          </label>
          <input
            id="orgName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bee Tech"
            required
            style={{
              padding: "0.75rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-bg-tertiary)",
              backgroundColor: "var(--color-bg-primary)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <label
            htmlFor="orgDesc"
            style={{ fontSize: "0.875rem", fontWeight: 500 }}
          >
            Description (Optional)
          </label>
          <textarea
            id="orgDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does your organization do?"
            rows={4}
            style={{
              padding: "0.75rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-bg-tertiary)",
              backgroundColor: "var(--color-bg-primary)",
              color: "var(--color-text-primary)",
              resize: "vertical",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          style={{
            padding: "0.75rem",
            backgroundColor: "var(--color-accent)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-md)",
            cursor: isSubmitting || !name.trim() ? "not-allowed" : "pointer",
            fontWeight: 500,
            marginTop: "1rem",
            opacity: isSubmitting || !name.trim() ? 0.7 : 1,
          }}
        >
          {isSubmitting ? "Creating..." : "Create Organization"}
        </button>
      </form>
    </div>
  );
};
