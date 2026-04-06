"use client";

// This page is dynamic — the URL contains a hospital ID that changes per hospital.
// Example URL: /hospitals/550e8400-e29b-41d4-a716-446655440000
// Next.js extracts the ID from the URL and passes it to this component as params.id

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

// --- TYPE DEFINITIONS ---

// The full hospital type — all columns from our Supabase hospitals table
type Hospital = {
  id: string;
  name: string;
  address: string;
  state: string;
  lga: string;
  type: string;
  phone: string | null;
  email: string | null;
  rating: number;
  verified: boolean;
  specialties: string[];
  created_at: string; // ISO date string like "2026-04-05T10:00:00Z"
};

// Props for this page component
// params is an object Next.js gives us automatically — it contains the URL parameters
// In this case, params.id will be the hospital UUID from the URL
type PageProps = {
  params: { id: string };
};

// Converts a slug like "general-medicine" to "General Medicine"
function formatSpecialty(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function HospitalDetailPage({ params }: PageProps) {
  // params is destructured here — we pull it out of the props object
  // { params } is the same as writing: function HospitalDetailPage(props) { const params = props.params }
  const { user } = useAuth();
  // user: the currently logged-in user, or null if no one is logged in
  const [hospital, setHospital] = useState<Hospital | null>(null);
  // Hospital | null means the value is either a Hospital object or null (not loaded yet)

  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  // saved: true if the current user has already saved this hospital
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  // saveLoading: true while the save/unsave Supabase call is in progress

  // Checks whether the logged-in user has already saved this hospital
  useEffect(() => {
    async function fetchHospital() {
      const { data, error } = await supabase
        .from("hospitals")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setHospital(data);
      }
      setLoading(false);
    }

    async function checkIfSaved() {
      // Only check if a user is logged in
      if (!user) return;

      const { data } = await supabase
        .from("saved_hospitals")
        .select("id")
        .eq("user_id", user.id)
        .eq("hospital_id", params.id)
        .maybeSingle();

      setSaved(!!data);
    }

    fetchHospital();
    checkIfSaved();
  }, [params.id, user]);
  // Re-runs when params.id or user changes

  // Handles saving or unsaving a hospital when the button is clicked
  async function handleSaveToggle() {
    if (!user) return;
    // Safety check — button shouldn't be clickable if not logged in, but just in case

    setSaveLoading(true);
    // Show loading state on the button while we wait for Supabase

    if (saved) {
      // UNSAVE: delete the row from saved_hospitals
      await supabase
        .from("saved_hospitals")
        .delete()
        .eq("user_id", user.id)
        .eq("hospital_id", params.id);
      setSaved(false);
    } else {
      // SAVE: only insert if the row doesn't already exist
      const { data: existing } = await supabase
        .from("saved_hospitals")
        .select("id")
        .eq("user_id", user.id)
        .eq("hospital_id", params.id)
        .maybeSingle();

      if (!existing) {
        await supabase
          .from("saved_hospitals")
          .insert({ user_id: user.id, hospital_id: params.id });
      }
      setSaved(true);
    }

    setSaveLoading(false);
  }
  // NOTE: The shared <Header /> from layout.tsx renders automatically on every page.
  // This file no longer defines its own Header — that was removed to avoid duplication.

  // ── LOADING STATE ──
  if (loading) {
    return (
      <main
        style={{
          fontFamily: "var(--font-dm-sans, sans-serif)",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "4rem auto",
            padding: "2rem",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          Loading hospital details...
        </div>
      </main>
    );
  }

  // ── NOT FOUND STATE ──
  if (notFound || !hospital) {
    return (
      <main
        style={{
          fontFamily: "var(--font-dm-sans, sans-serif)",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
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
              color: "var(--text-primary)",
            }}
          >
            Hospital not found
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            This hospital may have been removed or the link is incorrect.
          </p>
          <Link
            href="/hospitals"
            style={{
              color: "var(--teal-500)",
              textDecoration: "none",
              fontWeight: "600",
            }}
          >
            ← Back to all hospitals
          </Link>
        </div>
      </main>
    );
  }

  // ── MAIN DETAIL PAGE ──
  return (
    <main
      style={{
        fontFamily: "var(--font-dm-sans, sans-serif)",
        minHeight: "100vh",
        background: "var(--warm-white)",
      }}
    >
      {/* ── HERO BAND ── */}
      <div
        style={{
          background: "var(--teal-900)",
          padding: "2.5rem 2rem",
        }}
      >
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          {/* Breadcrumb navigation — shows the user where they are */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <Link
              href="/hospitals"
              style={{
                color: "#a8d5d1",
                textDecoration: "none",
                fontSize: "0.85rem",
              }}
            >
              Find Hospitals
            </Link>
            <span style={{ color: "#a8d5d1", fontSize: "0.85rem" }}>›</span>
            <span style={{ color: "#ffffff", fontSize: "0.85rem" }}>
              {hospital.name}
            </span>
          </div>

          {/* Hospital name + verified badge */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              marginBottom: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-playfair, serif)",
                color: "#ffffff",
                fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
                fontWeight: "700",
                lineHeight: "1.2",
                letterSpacing: "-0.02em",
              }}
            >
              {hospital.name}
            </h1>
            {hospital.verified && (
              <span
                style={{
                  background: "var(--teal-400)",
                  color: "#fff",
                  fontSize: "0.72rem",
                  fontWeight: "700",
                  padding: "0.3rem 0.7rem",
                  borderRadius: "20px",
                  letterSpacing: "0.06em",
                  alignSelf: "center",
                  whiteSpace: "nowrap",
                }}
              >
                ✓ VERIFIED
              </span>
            )}
          </div>

          {/* Type + location */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#ffffff",
                fontSize: "0.82rem",
                fontWeight: "600",
                padding: "0.3rem 0.8rem",
                borderRadius: "20px",
              }}
            >
              {hospital.type}
            </span>
            <span style={{ color: "#c5e6e3", fontSize: "0.88rem" }}>
              📍 {hospital.lga}, {hospital.state} State
            </span>
          </div>
        </div>
        {/* Save button */}
        <div style={{ marginTop: "1.25rem" }}>
          {user ? (
            // Logged in — show save/unsave toggle button
            <button
              onClick={handleSaveToggle}
              disabled={saveLoading}
              // disabled while the Supabase call is in progress
              style={{
                background: saved
                  ? "rgba(255,255,255,0.15)"
                  : "var(--teal-400)",
                color: "#ffffff",
                border: saved ? "1px solid rgba(255,255,255,0.4)" : "none",
                fontSize: "0.85rem",
                fontWeight: "600",
                padding: "0.5rem 1.25rem",
                borderRadius: "20px",
                cursor: saveLoading ? "not-allowed" : "pointer",
                opacity: saveLoading ? 0.7 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {saveLoading
                ? "Saving..."
                : saved
                  ? "✓ Saved"
                  : "♡ Save Hospital"}
            </button>
          ) : (
            // Not logged in — show link to auth page
            <Link
              href="/auth"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontWeight: "600",
                padding: "0.5rem 1.25rem",
                borderRadius: "20px",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.4)",
              }}
            >
              Log in to save
            </Link>
          )}
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div
        style={{
          maxWidth: "860px",
          margin: "0 auto",
          padding: "2rem",
          display: "flex",
          gap: "2rem",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* ── LEFT COLUMN — main info ── */}
        <div style={{ flex: 1, minWidth: "280px" }}>
          {/* Address card */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e8e6e0",
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "1.25rem",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-playfair, serif)",
                fontSize: "1rem",
                fontWeight: "700",
                color: "var(--text-primary)",
                marginBottom: "1rem",
              }}
            >
              Location
            </h2>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                lineHeight: "1.6",
              }}
            >
              {hospital.address}
            </p>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                marginTop: "0.4rem",
              }}
            >
              {hospital.lga} LGA, {hospital.state} State
            </p>
          </div>

          {/* Specialties card */}
          {hospital.specialties && hospital.specialties.length > 0 && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e8e6e0",
                borderRadius: "12px",
                padding: "1.5rem",
                marginBottom: "1.25rem",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-playfair, serif)",
                  fontSize: "1rem",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                  marginBottom: "1rem",
                }}
              >
                Specialties
              </h2>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {hospital.specialties.map((specialty) => (
                  <span
                    key={specialty}
                    style={{
                      background: "var(--teal-100)",
                      color: "var(--teal-700)",
                      fontSize: "0.82rem",
                      fontWeight: "600",
                      padding: "0.35rem 0.8rem",
                      borderRadius: "20px",
                    }}
                  >
                    {formatSpecialty(specialty)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Back link */}
          <Link
            href="/hospitals"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              color: "var(--teal-500)",
              textDecoration: "none",
              fontSize: "0.88rem",
              fontWeight: "600",
            }}
          >
            ← Back to all hospitals
          </Link>
        </div>

        {/* ── RIGHT COLUMN — contact sidebar ── */}
        <div style={{ width: "240px", flexShrink: 0 }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e8e6e0",
              borderRadius: "12px",
              padding: "1.5rem",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              position: "sticky",
              top: "1rem",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-playfair, serif)",
                fontSize: "1rem",
                fontWeight: "700",
                color: "var(--text-primary)",
                marginBottom: "1.25rem",
              }}
            >
              Contact
            </h2>

            {/* Phone */}
            <div style={{ marginBottom: "1rem" }}>
              <p
                style={{
                  fontSize: "0.72rem",
                  fontWeight: "700",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "0.3rem",
                }}
              >
                Phone
              </p>
              {hospital.phone ? (
                <a
                  href={`tel:${hospital.phone}`}
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--teal-500)",
                    textDecoration: "none",
                    fontWeight: "600",
                  }}
                >
                  {hospital.phone}
                </a>
              ) : (
                <p
                  style={{
                    fontSize: "0.88rem",
                    color: "var(--text-muted)",
                    fontStyle: "italic",
                  }}
                >
                  Not available
                </p>
              )}
            </div>

            {/* Email */}
            <div style={{ marginBottom: "1.25rem" }}>
              <p
                style={{
                  fontSize: "0.72rem",
                  fontWeight: "700",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "0.3rem",
                }}
              >
                Email
              </p>
              {hospital.email ? (
                <a
                  href={`mailto:${hospital.email}`}
                  style={{
                    fontSize: "0.88rem",
                    color: "var(--teal-500)",
                    textDecoration: "none",
                    fontWeight: "600",
                    wordBreak: "break-all",
                  }}
                >
                  {hospital.email}
                </a>
              ) : (
                <p
                  style={{
                    fontSize: "0.88rem",
                    color: "var(--text-muted)",
                    fontStyle: "italic",
                  }}
                >
                  Not available
                </p>
              )}
            </div>

            {/* Rating */}
            <div style={{ paddingTop: "1rem", borderTop: "1px solid #e8e6e0" }}>
              <p
                style={{
                  fontSize: "0.72rem",
                  fontWeight: "700",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "0.3rem",
                }}
              >
                Rating
              </p>
              <p
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                }}
              >
                {hospital.rating > 0
                  ? `${hospital.rating} / 5`
                  : "No ratings yet"}
              </p>
            </div>
          </div>
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
          marginTop: "4rem",
        }}
      >
        © 2026 Carefinder · Built for Nigeria 🇳🇬
      </footer>
    </main>
  );
}
