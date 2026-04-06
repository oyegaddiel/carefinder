// Header.tsx
// This is the shared navigation bar that appears at the top of every page.
// It uses the useAuth() hook to check if a user is logged in,
// then shows different content depending on their auth state.

"use client"; // This file uses React hooks, so it must run in the browser, not on the server

import Link from "next/link"; // Next.js built-in component for client-side navigation
import { useAuth } from "@/context/AuthContext"; // Our custom hook that gives us the current user + signOut function

export default function Header() {
  // useAuth() gives us two things:
  // - user: the currently logged-in user object (or null if no one is logged in)
  // - signOut: a function we can call to log the user out
  const { user, signOut } = useAuth();

  return (
    <header className="w-full bg-white border-b border-gray-200 px-6 py-4">
      {/* 
        This outer div uses flexbox to push the logo to the left
        and the navigation links to the right 
      */}
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* LEFT SIDE — Logo / Brand name */}
        <Link
          href="/"
          className="text-xl font-bold"
          style={{
            fontFamily: "var(--font-playfair)",
            color: "var(--teal-700)",
          }}
        >
          Carefinder
        </Link>

        {/* RIGHT SIDE — Auth-aware navigation */}
        <nav className="flex items-center gap-4">
          {/* Always visible: link to hospital search */}
          <Link
            href="/hospitals"
            className="text-sm hover:underline"
            style={{ color: "var(--text-secondary)" }}
          >
            Find Hospitals
          </Link>

          {/* 
            Conditional rendering:
            - If user is null (not logged in): show "Log In" link
            - If user exists (logged in): show their email + Log Out button
          */}
          {user === null ? (
            // NOT logged in — show Log In link
            <Link
              href="/auth"
              className="text-sm font-medium px-4 py-2 rounded-md text-white"
              style={{ backgroundColor: "var(--teal-500)" }}
            >
              Log In
            </Link>
          ) : (
            // LOGGED IN — show email and logout button
            <div className="flex items-center gap-3">
              {/* 
                user.email is the email address of the logged-in user.
                It comes from Supabase Auth automatically.
              */}
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {user.email}
              </span>

              {/* 
                signOut is the function from AuthContext.
                Calling it logs the user out and clears the session.
                onClick={() => signOut()} means: when this button is clicked, call signOut()
              */}
              <button
                onClick={() => signOut()}
                className="text-sm font-medium px-4 py-2 rounded-md border"
                style={{
                  borderColor: "var(--teal-500)",
                  color: "var(--teal-500)",
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
