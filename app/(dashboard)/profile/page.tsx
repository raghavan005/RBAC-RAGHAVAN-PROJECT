"use client";

import { useAuth } from "@/components/AuthProvider";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const fields = [
    { label: "Number", value: user.number ?? "-" },
    { label: "Name", value: user.name },
    { label: "Email", value: user.email },
    { label: "Phone", value: user.phone || "-" },
    { label: "Role", value: user.role },
    { label: "Status", value: user.status ? "Active" : "Inactive" },
  ];

  return (
    <div className="form-card">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
      </div>

      <div className="card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {fields.map((field) => (
            <div key={field.label}>
              <p
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.25rem",
                }}
              >
                {field.label}
              </p>
              <p style={{ fontWeight: 500, fontSize: "0.95rem" }}>{field.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
