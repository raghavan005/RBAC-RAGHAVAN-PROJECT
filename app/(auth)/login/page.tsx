"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { authApi } from "@/services/api";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { data } = await authApi.login(form);
      setAuth(data.user, data.accessToken);
      router.push("/dashboard");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Login failed. Please try again.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100dvh",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "22rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              marginBottom: "0.5rem",
            }}
          >
            Welcome back
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
            Sign in to your account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card"
          style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          {error && (
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--danger)",
                padding: "0.5rem 0.75rem",
                background: "rgba(220,38,38,0.08)",
                borderRadius: 8,
              }}
            >
              {error}
            </p>
          )}

          <div>
            <label
              htmlFor="email"
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
              id="email"
              type="email"
              placeholder="you@example.com"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
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
              id="password"
              type="password"
              placeholder="Enter your password"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: "0.5rem" }}
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>

          <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--muted)" }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}
            >
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
