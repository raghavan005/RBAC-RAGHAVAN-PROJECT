"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useAuth } from "@/components/AuthProvider";
import { membersApi, type Member, type Pagination } from "@/services/api";

export default function MembersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const { data } = await membersApi.list({
          page,
          limit: 10,
          sortBy,
          sortOrder,
          search: search || undefined,
        });
        setMembers(data.members ?? []);
        setPagination(data.pagination);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    },
    [router, search, sortBy, sortOrder]
  );

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchMembers(1);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this member?")) return;
    try {
      await membersApi.delete(id);
      fetchMembers(pagination.page);
    } catch {
      // silently fail
    }
  }

  const canEdit = ["admin", "manager"].includes(user?.role ?? "");
  const canDelete = user?.role === "admin";

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Members</h1>
        {canEdit && (
          <Link href="/members/create" className="btn btn-primary">
            Add Member
          </Link>
        )}
      </div>

      <form
        onSubmit={handleSearch}
        style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}
      >
        <input
          type="text"
          placeholder="Search by name or email..."
          className="input"
          style={{ flex: 1 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn btn-secondary">
          Search
        </button>
      </form>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <select
          className="select"
          style={{ width: "auto", minWidth: 120 }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="createdAt">Created</option>
          <option value="name">Name</option>
          <option value="email">Email</option>
        </select>
        <button
          className="btn btn-secondary"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          style={{ padding: "0.75rem 1rem" }}
        >
          {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Loading...</p>
      ) : (
        <>
          <div className="card table-wrap" style={{ marginBottom: "1rem" }}>
            <table style={{ width: "100%", fontSize: "0.875rem", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Name</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Email</th>
                  <th
                    style={{ padding: "0.75rem 1rem", fontWeight: 600 }}
                    className="desktop-only-cell"
                  >
                    Phone
                  </th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Role</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, i) => (
                  <tr
                    key={member._id}
                    style={{
                      borderTop: "1px solid var(--border)",
                      background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)",
                    }}
                  >
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>{member.name}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>
                      {member.email}
                    </td>
                    <td
                      style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}
                      className="desktop-only-cell"
                    >
                      {member.phone || "-"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textTransform: "capitalize" }}>
                      {member.role}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span className={`badge ${member.status ? "badge-active" : "badge-inactive"}`}>
                        {member.status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                        {canEdit && (
                          <Link
                            href={`/members/${member._id}/edit`}
                            style={{
                              color: "var(--accent)",
                              fontSize: "0.8rem",
                              textDecoration: "none",
                              fontWeight: 500,
                            }}
                          >
                            Edit
                          </Link>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(member._id)}
                            style={{
                              color: "var(--danger)",
                              fontSize: "0.8rem",
                              fontWeight: 500,
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: "2rem 1rem",
                        textAlign: "center",
                        color: "var(--muted)",
                        fontSize: "0.875rem",
                      }}
                    >
                      No members found.
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
                onClick={() => fetchMembers(pagination.page - 1)}
                className="btn btn-secondary"
                style={{ opacity: pagination.page <= 1 ? 0.5 : 1 }}
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchMembers(pagination.page + 1)}
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
