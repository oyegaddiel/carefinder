// src/app/auth/page.tsx
// This is the combined Sign Up / Login page for Carefinder

"use client";
// 'use client' is required because we use useState and browser interactions here

import { useState } from "react";
import { useRouter } from "next/navigation";
// useRouter lets us redirect the user to another page after login/signup
// next/navigation is the Next.js 14 way — NOT next/router (that's the old Pages Router)

import Link from "next/link";
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
            // It's separate from our public users table — we'll sync them later
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        // signUpError.message is Supabase's error description e.g. "Password should be at least 6 characters"
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
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--warm-white)" }}
    >
      {/* Header */}
      <header
        style={{ backgroundColor: "var(--teal-900)" }}
        className="text-white"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Carefinder
          </Link>
          <nav className="flex gap-6 text-sm">
            <Link href="/" className="hover:text-teal-300 transition-colors">
              Home
            </Link>
            <Link
              href="/hospitals"
              className="hover:text-teal-300 transition-colors"
            >
              Find Hospitals
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content — centered card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Tab switcher: Login / Sign Up */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-8">
            <button
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccess(null);
              }}
              className="flex-1 py-2.5 text-sm font-medium transition-colors"
              style={{
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
              className="flex-1 py-2.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor:
                  mode === "signup" ? "var(--teal-700)" : "white",
                color: mode === "signup" ? "white" : "var(--text-secondary)",
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Title */}
          <h1
            className="text-2xl font-bold text-gray-900 mb-1"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {mode === "login"
              ? "Log in to access your saved hospitals"
              : "Sign up to save hospitals and write reviews"}
          </p>

          {/* Full name field — only shown during signup */}
          {mode === "signup" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Gaddiel Ogunniyi"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          {/* Email field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Password field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div
              className="mb-4 px-4 py-3 rounded-lg bg-teal-50 border border-teal-200 text-sm"
              style={{ color: "var(--teal-700)" }}
            >
              {success}
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-lg text-white font-medium text-sm transition-all disabled:opacity-60"
            style={{ backgroundColor: "var(--teal-700)" }}
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
      </main>
    </div>
  );
}
