"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { auditLogsApi, type AuditLog, type Pagination } from "@/services/api";

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

function getUser(log: AuditLog): string {
  if (typeof log.userId === "object" && log.userId !== null) {
    return `${log.userId.name} (${log.userId.email})`;
  }
  return String(log.userId);
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 20,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await auditLogsApi.list({ page, limit: 20 });
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch {
      setError("Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (user?.role !== "admin") {
    return (
      <div>
        <p style={{ color: "var(--danger)", fontSize: "0.875rem" }}>
          Access denied. Admin only.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Audit Logs</h1>
        <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
          {pagination.total} total entries
        </p>
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

      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Loading...</p>
      ) : (
        <>
          <div className="card table-wrap" style={{ marginBottom: "1rem" }}>
            <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>User</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Action</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Resource</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr
                    key={log._id}
                    style={{
                      borderTop: "1px solid var(--border)",
                      background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)",
                    }}
                  >
                    <td style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>
                      {getUser(log)}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.125rem 0.5rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          borderRadius: 4,
                          fontFamily: "var(--font-mono, monospace)",
                          background:
                            log.action.startsWith("DELETE")
                              ? "rgba(220,38,38,0.1)"
                              : log.action.startsWith("CREATE") || log.action === "REGISTER"
                              ? "rgba(22,163,74,0.1)"
                              : log.action.startsWith("UPDATE")
                              ? "rgba(37,99,235,0.1)"
                              : "rgba(107,114,128,0.1)",
                          color:
                            log.action.startsWith("DELETE")
                              ? "var(--danger)"
                              : log.action.startsWith("CREATE") || log.action === "REGISTER"
                              ? "var(--success)"
                              : log.action.startsWith("UPDATE")
                              ? "var(--accent)"
                              : "var(--muted)",
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        color: "var(--muted)",
                        fontFamily: "var(--font-mono, monospace)",
                        fontSize: "0.8rem",
                      }}
                    >
                      {log.resource}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {formatTimestamp(log.timestamp)}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        padding: "2rem 1rem",
                        textAlign: "center",
                        color: "var(--muted)",
                        fontSize: "0.875rem",
                      }}
                    >
                      No audit logs yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchLogs(pagination.page - 1)}
                className="btn btn-secondary"
                style={{ opacity: pagination.page <= 1 ? 0.5 : 1 }}
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLogs(pagination.page + 1)}
                className="btn btn-secondary"
                style={{ opacity: pagination.page >= pagination.totalPages ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
