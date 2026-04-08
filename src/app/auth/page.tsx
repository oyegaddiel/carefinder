// src/app/auth/page.tsx
// This is the combined Sign Up / Login page for Carefinder

"use client";
// 'use client' is required because we use useState and browser interactions here

import { useState } from "react";
import { useRouter } from "next/navigation";
// useRouter lets us redirect the user to another page after login/signup
// next/navigation is the Next.js 14 way — NOT next/router (that's the old Pages Router)

import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  // mode controls whether we show the Sign Up form or the Login form
  // 'login' is the default — users see login first
  const [mode, setMode] = useState<"login" | "signup">("login");

  // These store what the user types into the form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  // fullName is only used during signup — login doesn't need it

  const [loading, setLoading] = useState(false);
  // loading: true while we wait for Supabase to respond

  const [error, setError] = useState<string | null>(null);
  // error: stores an error message to show the user, or null if no error

  const [success, setSuccess] = useState<string | null>(null);
  // success: stores a success message, or null if no message

  const router = useRouter();
  // router.push('/path') redirects the user to a new page

  // --- Handle form submission ---
  async function handleSubmit() {
    setError(null); // clear previous errors before trying again
    setSuccess(null);
    setLoading(true);

    if (mode === "signup") {
      // --- SIGN UP ---
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            // This stores the user's name in Supabase Auth metadata
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (data.user) {
        // Signup succeeded — also insert into our public users table
        const { error: insertError } = await supabase.from("users").insert({
          id: data.user.id,
          // We use the same UUID that Supabase Auth assigned — this links both records
          email: data.user.email,
          full_name: fullName,
          role: "user",
        });

        if (insertError) {
          // Don't block the user if this fails — auth still worked
          console.error("Could not insert into users table:", insertError);
        }

        setSuccess("Account created! Redirecting...");
        setTimeout(() => router.push("/hospitals"), 1500);
        // Wait 1.5 seconds so the user sees the success message, then redirect
      }
    } else {
      // --- LOGIN ---
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
      } else {
        setSuccess("Logged in! Redirecting...");
        setTimeout(() => router.push("/hospitals"), 1500);
      }
    }

    setLoading(false);
  }

  // --- Render ---
  // NOTE: The shared <Header /> from layout.tsx renders automatically.
  // This file does NOT define its own header.
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0f7f5",
        fontFamily: "var(--font-dm-sans, sans-serif)",
      }}
    >
      {/* ── HERO BANNER ── */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #053d2e 0%, #085041 40%, #0f6e56 100%)",
          padding: "3rem 2rem 4rem",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-playfair, serif)",
            color: "#ffffff",
            fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
            fontWeight: "700",
            marginBottom: "0.5rem",
            letterSpacing: "-0.02em",
          }}
        >
          {mode === "login" ? "Welcome back" : "Join Carefinder"}
        </h1>
        <p style={{ color: "#c5e6e3", fontSize: "0.95rem" }}>
          {mode === "login"
            ? "Log in to access your saved hospitals"
            : "Create an account to save hospitals and more"}
        </p>
      </div>

      {/* ── CARD — pulled up over the banner ── */}
      <div
        style={{
          maxWidth: "460px",
          margin: "-2rem auto 0",
          padding: "0 1rem 4rem",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            padding: "2rem",
          }}
        >
          {/* Tab switcher: Login / Sign Up */}
          <div
            style={{
              display: "flex",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid #e2e8e6",
              marginBottom: "2rem",
            }}
          >
            <button
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccess(null);
              }}
              style={{
                flex: 1,
                padding: "0.65rem",
                fontSize: "0.88rem",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                backgroundColor: mode === "login" ? "var(--teal-700)" : "white",
                color: mode === "login" ? "white" : "var(--text-secondary)",
              }}
            >
              Log In
            </button>
            <button
              onClick={() => {
                setMode("signup");
                setError(null);
                setSuccess(null);
              }}
              style={{
                flex: 1,
                padding: "0.65rem",
                fontSize: "0.88rem",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                backgroundColor:
                  mode === "signup" ? "var(--teal-700)" : "white",
                color: mode === "signup" ? "white" : "var(--text-secondary)",
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Full name field — only shown during signup */}
          {mode === "signup" && (
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: "600",
                  color: "var(--text-secondary)",
                  marginBottom: "0.4rem",
                }}
              >
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Gaddiel Ogunniyi"
                style={{
                  width: "100%",
                  border: "1px solid #d1d9d7",
                  borderRadius: "10px",
                  padding: "0.65rem 1rem",
                  fontSize: "0.9rem",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "var(--font-dm-sans, sans-serif)",
                }}
              />
            </div>
          )}

          {/* Email field */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: "600",
                color: "var(--text-secondary)",
                marginBottom: "0.4rem",
              }}
            >
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%",
                border: "1px solid #d1d9d7",
                borderRadius: "10px",
                padding: "0.65rem 1rem",
                fontSize: "0.9rem",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "var(--font-dm-sans, sans-serif)",
              }}
            />
          </div>

          {/* Password field */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: "600",
                color: "var(--text-secondary)",
                marginBottom: "0.4rem",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              style={{
                width: "100%",
                border: "1px solid #d1d9d7",
                borderRadius: "10px",
                padding: "0.65rem 1rem",
                fontSize: "0.9rem",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "var(--font-dm-sans, sans-serif)",
              }}
            />
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                marginBottom: "1rem",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                fontSize: "0.88rem",
              }}
            >
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div
              style={{
                marginBottom: "1rem",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                background: "#f0fdf9",
                border: "1px solid #99e6d8",
                color: "var(--teal-700)",
                fontSize: "0.88rem",
              }}
            >
              {success}
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.8rem",
              borderRadius: "10px",
              border: "none",
              background: loading ? "#5a9e8f" : "var(--teal-700)",
              color: "#ffffff",
              fontSize: "0.95rem",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s ease",
              fontFamily: "var(--font-dm-sans, sans-serif)",
            }}
          >
            {loading
              ? mode === "login"
                ? "Logging in..."
                : "Creating account..."
              : mode === "login"
                ? "Log In"
                : "Create Account"}
          </button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer
        style={{
          background: "var(--teal-900)",
          color: "#a8d5d1",
          textAlign: "center",
          padding: "2rem",
          fontSize: "0.85rem",
        }}
      >
        © 2026 Carefinder · Built for Nigeria 🇳🇬
      </footer>
    </div>
  );
}
