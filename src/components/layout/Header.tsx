// Header.tsx
// This is the shared navigation bar that appears at the top of every page.
// It uses the useAuth() hook to check if a user is logged in,
// then shows different content depending on their auth state.

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const { user, signOut } = useAuth();

  // isAdmin tracks whether the logged-in user has role = 'admin'.
  // null means we haven't checked yet.
  // false means we checked and they're not admin (or no one is logged in).
  // true means they are admin and should see the Admin link.
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    // If no one is logged in, make sure isAdmin is false and stop.
    if (!user) {
      setIsAdmin(false);
      return;
    }

    // Look up this user's role in the public.users table.
    async function checkRole() {
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user!.id)
        .maybeSingle();

      // If role is 'admin', show the Admin link. Otherwise hide it.
      setIsAdmin(data?.role === "admin");
    }

    checkRole();
  }, [user]);
  // This re-runs whenever user changes — e.g. on login or logout.

  return (
    <header className="w-full bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* LEFT SIDE — Logo */}
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

        {/* RIGHT SIDE — Navigation */}
        <nav className="flex items-center gap-4">
          <Link
            href="/hospitals"
            className="text-sm hover:underline"
            style={{ color: "var(--text-secondary)" }}
          >
            Find Hospitals
          </Link>

          {user === null ? (
            <Link
              href="/auth"
              className="text-sm font-medium px-4 py-2 rounded-md text-white"
              style={{ backgroundColor: "var(--teal-500)" }}
            >
              Log In
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/saved"
                className="text-sm hover:underline"
                style={{ color: "var(--text-secondary)" }}
              >
                Saved
              </Link>

              {/* 
                Admin link — only renders when isAdmin is true.
                A regular user will never see this link.
              */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm hover:underline"
                  style={{ color: "var(--teal-700)" }}
                >
                  Admin
                </Link>
              )}

              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {user.email}
              </span>

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
