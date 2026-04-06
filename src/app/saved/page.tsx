"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

// The shape of each hospital we join from saved_hospitals
type SavedHospital = {
  hospital_id: string;
  hospitals: {
    id: string;
    name: string;
    lga: string;
    state: string;
    type: string;
    verified: boolean;
  } | null;
};

export default function SavedPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState<SavedHospital[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchSaved() {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("saved_hospitals")
        .select("hospital_id, hospitals(id, name, lga, state, type, verified)")
        .eq("user_id", user.id);

      if (!error && data) {
        setSaved(data as unknown as SavedHospital[]);
      }
      setLoading(false);
    }

    fetchSaved();
  }, [user]);

  // --- NOT LOGGED IN ---
  if (!loading && !user) {
    return (
      <main
        style={{
          fontFamily: "var(--font-dm-sans, sans-serif)",
          minHeight: "100vh",
          background: "var(--warm-white)",
        }}
      >
        <div
          style={{
            maxWidth: "700px",
            margin: "4rem auto",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-playfair, serif)",
              fontSize: "1.5rem",
              marginBottom: "1rem",
            }}
          >
            Your Saved Hospitals
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            Please log in to view your saved hospitals.
          </p>
          <Link
            href="/auth"
            style={{ color: "var(--teal-500)", fontWeight: "600" }}
          >
            Log in →
          </Link>
        </div>
      </main>
    );
  }

  // --- LOADING ---
  if (loading) {
    return (
      <main
        style={{
          fontFamily: "var(--font-dm-sans, sans-serif)",
          minHeight: "100vh",
          background: "var(--warm-white)",
        }}
      >
        <div
          style={{
            maxWidth: "700px",
            margin: "4rem auto",
            padding: "2rem",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          Loading your saved hospitals...
        </div>
      </main>
    );
  }

  // --- MAIN PAGE ---
  return (
    <main
      style={{
        fontFamily: "var(--font-dm-sans, sans-serif)",
        minHeight: "100vh",
        background: "var(--warm-white)",
      }}
    >
      {/* Page header */}
      <div style={{ background: "var(--teal-900)", padding: "2.5rem 2rem" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h1
            style={{
              fontFamily: "var(--font-playfair, serif)",
              color: "#ffffff",
              fontSize: "clamp(1.4rem, 4vw, 2rem)",
              fontWeight: "700",
              marginBottom: "0.4rem",
            }}
          >
            Your Saved Hospitals
          </h1>
          <p style={{ color: "#a8d5d1", fontSize: "0.9rem" }}>
            {saved.length} hospital{saved.length !== 1 ? "s" : ""} saved
          </p>
        </div>
      </div>

      {/* Hospital list */}
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem" }}>
        {saved.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem 0",
              color: "var(--text-muted)",
            }}
          >
            <p style={{ marginBottom: "1rem" }}>
              You haven&apos;t saved any hospitals yet.
            </p>
            <Link
              href="/hospitals"
              style={{ color: "var(--teal-500)", fontWeight: "600" }}
            >
              Browse hospitals →
            </Link>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {saved.map((entry) => {
              const h = entry.hospitals;
              if (!h) return null;
              return (
                <Link
                  key={entry.hospital_id}
                  href={`/hospitals/${h.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e8e6e0",
                      borderRadius: "12px",
                      padding: "1.25rem 1.5rem",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "box-shadow 0.2s ease",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginBottom: "0.3rem",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-playfair, serif)",
                            fontSize: "1rem",
                            fontWeight: "700",
                            color: "var(--text-primary)",
                          }}
                        >
                          {h.name}
                        </span>
                        {h.verified && (
                          <span
                            style={{
                              background: "var(--teal-400)",
                              color: "#fff",
                              fontSize: "0.65rem",
                              fontWeight: "700",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "20px",
                              letterSpacing: "0.05em",
                            }}
                          >
                            ✓ VERIFIED
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {h.type} · {h.lga}, {h.state} State
                      </p>
                    </div>
                    <span
                      style={{ color: "var(--teal-500)", fontSize: "1.1rem" }}
                    >
                      →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <footer
        style={{
          background: "var(--teal-900)",
          color: "#a8d5d1",
          textAlign: "center",
          padding: "2rem",
          fontSize: "0.85rem",
          marginTop: "4rem",
        }}
      >
        © 2026 Carefinder · Built for Nigeria 🇳🇬
      </footer>
    </main>
  );
}
