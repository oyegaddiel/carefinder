// This tells Next.js this page runs in the browser, not just on the server
// We need this because we're using useState and useEffect (interactive React features)
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// --- TYPE DEFINITIONS ---
// A "type" in TypeScript is a blueprint that describes the shape of your data.
// This says: a Hospital object must have these exact fields with these exact types.
type Hospital = {
  id: string; // UUID from Supabase — always a string
  name: string;
  address: string;
  state: string;
  lga: string;
  type: string;
  phone: string | null; // "string | null" means it can be a string OR null (empty)
  rating: number; // a decimal number like 4.5
  verified: boolean; // true or false
  specialties: string[]; // an array of strings e.g. ["Cardiology", "Pediatrics"]
};

export default function Home() {
  // useState<Hospital[]>([]) means:
  // - hospitals is a variable that holds an array of Hospital objects
  // - setHospitals is the function to update it
  // - [] is the starting value (empty array — no hospitals loaded yet)
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // useEffect runs code after the page loads
  // The empty array [] at the end means "run this once, when the page first opens"
  useEffect(() => {
    async function fetchHospitals() {
      const { data, error } = await supabase
        .from("hospitals")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching hospitals:", error.message);
      } else {
        // data could be null if the table is empty, so we use ?? [] as a fallback
        setHospitals(data ?? []);
      }
      setLoading(false);
    }

    fetchHospitals();
  }, []);

  // Filter hospitals based on what the user types in the search box
  // .toLowerCase() makes the search case-insensitive
  const filtered = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <main style={{ fontFamily: "var(--font-dm-sans, sans-serif)" }}>
      {/* ── HEADER ── */}
      <header
        style={{
          background: "var(--teal-900)",
          padding: "0 2rem",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-playfair, serif)",
            color: "#ffffff",
            fontSize: "1.4rem",
            fontWeight: "700",
            letterSpacing: "-0.02em",
          }}
        >
          Carefinder
        </span>
        <nav style={{ display: "flex", gap: "2rem" }}>
          <Link
            href="/hospitals"
            style={{
              color: "#a8d5d1",
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            Find Hospitals
          </Link>
          <a
            href="#"
            style={{
              color: "#a8d5d1",
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            About
          </a>
        </nav>
      </header>

      {/* ── HERO SECTION ── */}
      <section
        style={{
          background:
            "linear-gradient(135deg, var(--teal-900) 0%, var(--teal-700) 60%, var(--teal-500) 100%)",
          padding: "5rem 2rem 6rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative background circle — purely visual */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            pointerEvents: "none",
          }}
        />

        <p
          style={{
            color: "var(--teal-400)",
            fontSize: "0.85rem",
            fontWeight: "600",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}
        >
          Nigeria&apos;s Healthcare Directory
        </p>

        <h1
          style={{
            fontFamily: "var(--font-playfair, serif)",
            color: "#ffffff",
            fontSize: "clamp(2rem, 5vw, 3.2rem)", // clamp() = responsive font size
            fontWeight: "700",
            lineHeight: "1.2",
            maxWidth: "680px",
            margin: "0 auto 1.5rem",
            letterSpacing: "-0.02em",
          }}
        >
          Find the right hospital,
          <br />
          <span style={{ color: "var(--teal-400)" }}>wherever you are.</span>
        </h1>

        <p
          style={{
            color: "#c5e6e3",
            fontSize: "1.05rem",
            maxWidth: "500px",
            margin: "0 auto 2.5rem",
            lineHeight: "1.6",
          }}
        >
          Search verified hospitals and clinics across Nigeria by location,
          specialty, or name.
        </p>

        {/* ── SEARCH BAR ── */}
        <div
          style={{
            display: "flex",
            maxWidth: "560px",
            margin: "0 auto",
            background: "#ffffff",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          }}
        >
          <input
            type="text"
            placeholder="Search by hospital name, state, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            // e is the event object. e.target.value is what the user typed.
            style={{
              flex: 1, // takes up all available space in the flex row
              padding: "1rem 1.25rem",
              border: "none",
              outline: "none",
              fontSize: "0.95rem",
              color: "var(--text-primary)",
              fontFamily: "var(--font-dm-sans, sans-serif)",
            }}
          />
          <button
            style={{
              background: "var(--teal-500)",
              color: "#ffffff",
              border: "none",
              padding: "1rem 1.5rem",
              cursor: "pointer",
              fontSize: "0.95rem",
              fontWeight: "600",
              fontFamily: "var(--font-dm-sans, sans-serif)",
              transition: "background 0.2s ease",
              whiteSpace: "nowrap",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = "var(--teal-700)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.background = "var(--teal-500)")
            }
          >
            Search
          </button>
        </div>
      </section>

      {/* ── HOSPITAL RESULTS ── */}
      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "3rem 2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-playfair, serif)",
              fontSize: "1.4rem",
              fontWeight: "700",
              color: "var(--text-primary)",
            }}
          >
            {loading
              ? "Loading hospitals..."
              : `${filtered.length} hospital${filtered.length !== 1 ? "s" : ""} found`}
          </h2>
        </div>

        {/* Loading state */}
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "var(--text-muted)",
            }}
          >
            Loading...
          </div>
        )}

        {/* Empty state — shown when search returns no matches */}
        {!loading && filtered.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "var(--text-muted)",
              fontSize: "0.95rem",
            }}
          >
            No hospitals match &ldquo;{searchQuery}&rdquo;. Try a different
            search term.
          </div>
        )}

        {/* Hospital cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filtered.map((hospital) => (
            <div
              key={hospital.id}
              style={{
                background: "#ffffff",
                border: "1px solid #e8e6e0",
                borderRadius: "12px",
                padding: "1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                transition: "box-shadow 0.2s ease, transform 0.2s ease",
                cursor: "pointer",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ flex: 1 }}>
                {/* Hospital name */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.4rem",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--font-playfair, serif)",
                      fontSize: "1.05rem",
                      fontWeight: "700",
                      color: "var(--text-primary)",
                    }}
                  >
                    {hospital.name}
                  </h3>
                  {/* Verified badge — only shows if hospital.verified is true */}
                  {hospital.verified && (
                    <span
                      style={{
                        background: "var(--teal-100)",
                        color: "var(--teal-700)",
                        fontSize: "0.7rem",
                        fontWeight: "600",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "20px",
                        letterSpacing: "0.05em",
                      }}
                    >
                      VERIFIED
                    </span>
                  )}
                </div>

                {/* Location */}
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.88rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  📍 {hospital.lga}, {hospital.state} State
                </p>

                {/* Specialties */}
                {hospital.specialties && hospital.specialties.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: "0.4rem",
                      flexWrap: "wrap",
                      marginTop: "0.5rem",
                    }}
                  >
                    {hospital.specialties.slice(0, 3).map((specialty) => (
                      // slice(0, 3) shows only the first 3 specialties to avoid clutter
                      <span
                        key={specialty}
                        style={{
                          background: "var(--warm-gray)",
                          color: "var(--text-secondary)",
                          fontSize: "0.75rem",
                          padding: "0.2rem 0.6rem",
                          borderRadius: "20px",
                          fontWeight: "500",
                        }}
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right side — type badge */}
              <div
                style={{
                  background: "var(--teal-900)",
                  color: "#ffffff",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  padding: "0.3rem 0.8rem",
                  borderRadius: "20px",
                  marginLeft: "1rem",
                  whiteSpace: "nowrap",
                  alignSelf: "flex-start",
                }}
              >
                {hospital.type}
              </div>
            </div>
          ))}
        </div>
      </section>

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
