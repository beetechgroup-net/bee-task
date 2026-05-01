import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Copy, Terminal, ExternalLink, Puzzle } from "lucide-react";

export const PluginSetup: React.FC = () => {
  const { user } = useAuth();
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Plugin Setup</h2>
        <p>Please sign in to configure your Bee Task plugins.</p>
      </div>
    );
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--color-bg-secondary)",
    padding: "1.5rem",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--color-bg-tertiary)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  };

  return (
    <div style={{ 
      padding: "2rem", 
      maxWidth: "900px", 
      margin: "0 auto", 
      display: "flex", 
      flexDirection: "column", 
      gap: "2rem" 
    }}>
      <header>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <Puzzle size={32} style={{ color: "var(--color-accent)" }} />
          <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Plugin Setup</h1>
        </div>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Extend Bee Task to your VS Code and Antigravity workflow.
        </p>
      </header>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
        gap: "1.5rem" 
      }}>
        <section style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-accent)", fontWeight: 600 }}>
            <Terminal size={20} />
            <h2>Your Credentials</h2>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
            You will need these to authenticate the VS Code extension and Antigravity plugin.
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--color-text-secondary)", fontWeight: 700, marginBottom: "0.25rem", display: "block" }}>
                User ID (UID)
              </label>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.5rem", 
                backgroundColor: "var(--color-bg-primary)", 
                padding: "0.5rem", 
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-bg-tertiary)"
              }}>
                <code style={{ fontSize: "0.75rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.uid}
                </code>
                <button 
                  onClick={() => copyToClipboard(user.uid)}
                  style={{ 
                    background: "none", 
                    border: "none", 
                    cursor: "pointer", 
                    color: "var(--color-text-secondary)",
                    display: "flex",
                    alignItems: "center"
                  }}
                  title="Copy UID"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>
          
          {copied && <p style={{ fontSize: "0.75rem", color: "#4ade80" }}>Copied to clipboard!</p>}
        </section>

        <section style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#3b82f6", fontWeight: 600 }}>
            <ExternalLink size={20} />
            <h2>Firebase Service Account</h2>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
            For security, you must use a Service Account to manage tasks from terminal or IDE.
          </p>
          <ol style={{ fontSize: "0.85rem", paddingLeft: "1.25rem", margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem", color: "var(--color-text-primary)" }}>
            <li>Go to Firebase Console &gt; Project Settings &gt; Service Accounts.</li>
            <li>Click "Generate new private key".</li>
            <li>Save the JSON file securely on your computer.</li>
          </ol>
        </section>
      </div>

      <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>1. Antigravity MCP Plugin</h2>
        <div style={cardStyle}>
          <p style={{ fontSize: "0.9rem" }}>
            To enable Antigravity to manage your tasks, add the following to your MCP configuration:
          </p>
          <pre style={{ 
            backgroundColor: "var(--color-bg-primary)", 
            padding: "1rem", 
            borderRadius: "var(--radius-md)", 
            fontSize: "0.75rem", 
            overflowX: "auto", 
            border: "1px solid var(--color-bg-tertiary)",
            fontFamily: "monospace"
          }}>
{`{
  "mcpServers": {
    "bee-task": {
      "command": "ts-node",
      "args": ["${window.location.origin}/plugins/mcp-server/index.ts"],
      "env": {
        "BEE_TASK_USER_ID": "${user.uid}",
        "BEE_TASK_SERVICE_ACCOUNT_PATH": "/path/to/your/service-account.json"
      }
    }
  }
}`}
          </pre>
          <p style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)" }}>
            Note: Replace the service account path with the actual file location.
          </p>
        </div>

        <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>2. VS Code Extension</h2>
        <div style={cardStyle}>
          <p style={{ fontSize: "0.9rem" }}>
            Install the local Bee Task extension and configure it in your User Settings:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem", color: "var(--color-text-primary)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "var(--color-bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>1</span>
              <span>Open Settings (Cmd + ,)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "var(--color-bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>2</span>
              <span>Search for "Bee Task"</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "var(--color-bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>3</span>
              <span>Paste your User ID and Service Account Path.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
