"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { membersApi } from "@/services/api";

export default function CreateMemberPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "member",
    status: true,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await membersApi.create(form);
      router.push("/members");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Failed to create member.");
      } else {
        setError("Failed to create member.");
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="form-card-wide">
      <div className="page-header">
        <h1 className="page-title">Create Member</h1>
      </div>

      {error && (
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--danger)",
            padding: "0.5rem 0.75rem",
            background: "rgba(220,38,38,0.08)",
            borderRadius: 8,
            marginBottom: "1rem",
          }}
        >
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="card"
        style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.8rem",
              fontWeight: 500,
              color: "var(--muted)",
              marginBottom: "0.375rem",
            }}
          >
            Name
          </label>
          <input
            type="text"
            placeholder="Full name"
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.8rem",
              fontWeight: 500,
              color: "var(--muted)",
              marginBottom: "0.375rem",
            }}
          >
            Email
          </label>
          <input
            type="email"
            placeholder="Email address"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.8rem",
              fontWeight: 500,
              color: "var(--muted)",
              marginBottom: "0.375rem",
            }}
          >
            Password
          </label>
          <input
            type="password"
            placeholder="Set a password"
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.8rem",
              fontWeight: 500,
              color: "var(--muted)",
              marginBottom: "0.375rem",
            }}
          >
            Phone
          </label>
          <input
            type="text"
            placeholder="Phone number (optional)"
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.8rem",
              fontWeight: 500,
              color: "var(--muted)",
              marginBottom: "0.375rem",
            }}
          >
            Role
          </label>
          <select
            className="select"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="member">Member</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <label className="label-checkbox">
          <input
            type="checkbox"
            checked={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.checked })}
          />
          Active
        </label>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Creating..." : "Create"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => router.push("/members")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
