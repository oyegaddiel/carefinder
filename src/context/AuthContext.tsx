// src/context/AuthContext.tsx
// This file creates a "context" — a way to share the logged-in user's data
// with every component in the app without passing it through props manually.

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
// Session: represents an active login session (contains the access token)
// User: represents the logged-in user's data (id, email, metadata)

import { supabase } from "@/lib/supabase";

// --- Define what our context will hold ---
type AuthContextType = {
  user: User | null;
  // user is the logged-in Supabase user object, or null if not logged in

  session: Session | null;
  // session holds the access token — null if not logged in

  loading: boolean;
  // loading is true while we're checking if the user is already logged in
  // (e.g. on page refresh — we need to ask Supabase before we know)

  signOut: () => Promise<void>;
  // signOut is a function that logs the user out — () => Promise<void> means
  // it takes no arguments and returns a Promise that resolves to nothing
};

// --- Create the context ---
// createContext() creates a "container" that can be read by any child component.
// We pass null as the default — it gets filled in by AuthProvider below.
const AuthContext = createContext<AuthContextType | null>(null);

// --- AuthProvider component ---
// This wraps the whole app and keeps track of the auth state.
// Any component inside it can read the auth data using useAuth() below.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // React.ReactNode means "any valid JSX content" — in this case, all our pages

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Step 1: Check if there's already an active session when the app loads
    // (e.g. the user logged in yesterday and their session is still valid)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      // session?.user means "get user from session if session exists, otherwise null"
      // ?? null is the fallback — same as saying "or null if undefined"
      setLoading(false);
    });

    // Step 2: Listen for auth changes in real time
    // This fires whenever the user logs in, logs out, or their token refreshes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // _event tells us what happened: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
      // We prefix with _ because we don't use it — just the session matters here
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup: when the component unmounts, stop listening for auth changes
    // This prevents memory leaks
    return () => subscription.unsubscribe();
  }, []);
  // The [] means this effect runs once when the app first loads

  // signOut calls Supabase's logout function
  async function signOut() {
    await supabase.auth.signOut();
    // onAuthStateChange above will automatically set user and session to null
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
    // AuthContext.Provider makes the value available to all child components
    // {children} renders everything wrapped inside <AuthProvider> in layout.tsx
  );
}

// --- useAuth hook ---
// This is how any component reads the auth data.
// Instead of: const auth = useContext(AuthContext)
// We write:    const { user, signOut } = useAuth()
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
    // This error only fires if someone calls useAuth() outside of AuthProvider
    // It's a safety check to catch mistakes during development
  }
  return context;
}
