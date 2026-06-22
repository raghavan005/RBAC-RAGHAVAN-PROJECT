"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/components/AuthProvider";
import { membersApi } from "@/services/api";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ total: 0, admins: 0, managers: 0, members: 0 });
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data } = await membersApi.list({ limit: 1000 });
        const list = data.members;
        setStats({
          total: list.length,
          admins: list.filter((m) => m.role === "admin").length,
          managers: list.filter((m) => m.role === "manager").length,
          members: list.filter((m) => m.role === "member").length,
        });
      } catch (err) {
        if (!axios.isAxiosError(err) || err.response?.status !== 401) {
          // silently ignore non-auth errors
        }
      }
    }
    fetchStats();
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.push("/login");
  }

  if (!user) return null;

  const cards = [
    { label: "Total Users", value: stats.total },
    { label: "Admins", value: stats.admins },
    { label: "Managers", value: stats.managers },
    { label: "Members", value: stats.members },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            Welcome back, <strong>{user.name}</strong>
            <span
              style={{
                marginLeft: "0.5rem",
                padding: "0.1rem 0.5rem",
                fontSize: "0.7rem",
                fontWeight: 600,
                textTransform: "capitalize",
                borderRadius: 9999,
                background: "rgba(37,99,235,0.1)",
                color: "var(--accent)",
              }}
            >
              {user.role}
            </span>
          </p>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="btn"
          style={{
            background: "transparent",
            border: "1px solid var(--danger)",
            color: "var(--danger)",
            opacity: loggingOut ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>

      <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
        {cards.map((card) => (
          <div key={card.label} className="card" style={{ padding: "1rem" }}>
            <p
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                lineHeight: 1.2,
                marginBottom: "0.25rem",
              }}
            >
              {card.value}
            </p>
            <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{card.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Link href="/members" className="btn btn-secondary">
          View Members
        </Link>
        {["admin", "manager"].includes(user.role) && (
          <Link href="/members/create" className="btn btn-primary">
            Add Member
          </Link>
        )}
        {user.role === "admin" && (
          <Link href="/audit-logs" className="btn btn-secondary">
            Audit Logs
          </Link>
        )}
        <Link href="/profile" className="btn btn-secondary">
          My Profile
        </Link>
      </div>
    </div>
  );
}
