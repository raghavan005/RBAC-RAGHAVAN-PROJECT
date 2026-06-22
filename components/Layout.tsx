"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    router.push("/login");
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/members", label: "Members" },
    ...(user?.role === "admin" ? [{ href: "/audit-logs", label: "Audit Logs" }] : []),
    { href: "/profile", label: "Profile" },
  ];

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <div className="flex min-h-screen flex-col" suppressHydrationWarning>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "var(--card)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: "72rem",
            margin: "0 auto",
            padding: "0.75rem 1rem",
            gap: "0.5rem",
          }}
        >
          <Link
            href="/dashboard"
            style={{
              fontWeight: 700,
              fontSize: "1.125rem",
              letterSpacing: "-0.025em",
              color: "var(--foreground)",
              textDecoration: "none",
            }}
          >
            RBAC
          </Link>

          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <div
              style={{
                display: "none",
                alignItems: "center",
                gap: "0.25rem",
              }}
              className="desktop-nav"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    padding: "0.375rem 0.75rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    borderRadius: 6,
                    color: isActive(link.href) ? "var(--accent)" : "var(--muted)",
                    background: isActive(link.href) ? "rgba(37,99,235,0.08)" : "transparent",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {link.label}
                </Link>
              ))}
              <span
                style={{
                  width: 1,
                  height: 20,
                  background: "var(--border)",
                  margin: "0 0.25rem",
                }}
              />
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "var(--muted)",
                  padding: "0 0.25rem",
                }}
              >
                {user?.name}
              </span>
            </div>

            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              style={{
                position: "relative",
                width: 44,
                height: 24,
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: theme === "light" ? "#e5e7eb" : "#374151",
                transition: "background 0.2s ease",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: theme === "light" ? 2 : 22,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: theme === "light" ? "#fff" : "#1f2937",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  transition: "left 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  lineHeight: 1,
                  color: theme === "light" ? "#f59e0b" : "#93c5fd",
                }}
              >
                {theme === "light" ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
              </span>
            </button>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: "var(--foreground)",
                cursor: "pointer",
              }}
              className="hamburger-btn"
            >
              {menuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12h18M3 6h18M3 18h18"/>
                </svg>
              )}
            </button>
          </nav>
        </div>

        {menuOpen && (
          <div
            style={{
              borderTop: "1px solid var(--border)",
              background: "var(--card)",
              padding: "0.5rem 1rem 1rem",
            }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "block",
                  padding: "0.75rem 0.75rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  borderRadius: 8,
                  color: isActive(link.href) ? "var(--accent)" : "var(--foreground)",
                  background: isActive(link.href) ? "rgba(37,99,235,0.08)" : "transparent",
                  textDecoration: "none",
                  marginBottom: 2,
                }}
              >
                {link.label}
              </Link>
            ))}
            <div
              style={{
                padding: "0.75rem 0.75rem",
                fontSize: "0.8rem",
                color: "var(--muted)",
                borderTop: "1px solid var(--border)",
                marginTop: "0.25rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>{user?.name}</span>
              <button
                onClick={handleLogout}
                style={{
                  padding: "0.375rem 0.75rem",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  borderRadius: 6,
                  border: "1px solid var(--danger)",
                  background: "transparent",
                  color: "var(--danger)",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: "72rem",
          margin: "0 auto",
          padding: "1.5rem 1rem",
        }}
      >
        {children}
      </main>
    </div>
  );
}
