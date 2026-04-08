// src/components/layout/Header.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);

  // Detect scroll so we can add a shadow when the user scrolls down
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    async function checkRole() {
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user!.id)
        .maybeSingle();
      setIsAdmin(data?.role === "admin");
    }
    checkRole();
  }, [user]);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(12px)",
        borderBottom: scrolled ? "1px solid #e0ede9" : "1px solid transparent",
        boxShadow: scrolled ? "0 2px 20px rgba(15,110,86,0.08)" : "none",
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 1.5rem",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* ── LOGO ── */}
        <Link
          href="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {/* Icon: green rounded square with a white cross */}
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, #0f6e56, #1d9e75)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(15,110,86,0.3)",
              flexShrink: 0,
            }}
          >
            {/* SVG location pin with cross */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                fill="white"
                fillOpacity="0.9"
              />
              <path
                d="M12 6v6M9 9h6"
                stroke="#0f6e56"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "var(--font-playfair, serif)",
              fontSize: "1.3rem",
              fontWeight: "700",
              color: "#085041",
              letterSpacing: "-0.02em",
            }}
          >
            Carefinder
          </span>
        </Link>

        {/* ── NAV ── */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <NavLink href="/hospitals">Find Hospitals</NavLink>

          {user === null ? (
            <Link
              href="/auth"
              style={{
                marginLeft: "0.5rem",
                background: "linear-gradient(135deg, #0f6e56, #1d9e75)",
                color: "white",
                fontSize: "0.85rem",
                fontWeight: "600",
                padding: "0.5rem 1.25rem",
                borderRadius: "25px",
                textDecoration: "none",
                boxShadow: "0 2px 10px rgba(15,110,86,0.25)",
                transition: "all 0.2s ease",
              }}
            >
              Log In
            </Link>
          ) : (
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              <NavLink href="/saved">Saved</NavLink>
              {isAdmin && <NavLink href="/admin">Admin</NavLink>}

              {/* User email pill */}
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#6b9e8e",
                  padding: "0.4rem 0.75rem",
                  background: "#f0f9f6",
                  borderRadius: "20px",
                  marginLeft: "0.25rem",
                  maxWidth: "160px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </span>

              <button
                onClick={() => signOut()}
                style={{
                  marginLeft: "0.25rem",
                  background: "transparent",
                  color: "#0f6e56",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  padding: "0.5rem 1rem",
                  borderRadius: "25px",
                  border: "1.5px solid #0f6e56",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#0f6e56";
                  e.currentTarget.style.color = "white";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#0f6e56";
                }}
              >
                Log Out
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

// Small reusable nav link component with hover underline animation
function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      style={{
        fontSize: "0.88rem",
        fontWeight: "500",
        color: hovered ? "#0f6e56" : "#444",
        textDecoration: "none",
        padding: "0.4rem 0.75rem",
        borderRadius: "8px",
        background: hovered ? "#f0f9f6" : "transparent",
        transition: "all 0.2s ease",
      }}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
    >
      {children}
    </Link>
  );
}
