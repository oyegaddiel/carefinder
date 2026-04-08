// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Hospital = {
  id: string;
  name: string;
  address: string;
  state: string;
  lga: string;
  type: string;
  phone: string | null;
  rating: number;
  verified: boolean;
  specialties: string[];
};

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "1.25rem 1.5rem",
        border: "1px solid #e0ede9",
      }}
    >
      {/* shimmer animation via inline keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .skel {
          background: linear-gradient(90deg, #e8f4f0 25%, #f5fbf8 50%, #e8f4f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
        }
      `}</style>
      <div
        className="skel"
        style={{ height: "14px", width: "55%", marginBottom: "10px" }}
      />
      <div
        className="skel"
        style={{ height: "11px", width: "35%", marginBottom: "14px" }}
      />
      <div style={{ display: "flex", gap: "6px" }}>
        <div
          className="skel"
          style={{ height: "22px", width: "80px", borderRadius: "20px" }}
        />
        <div
          className="skel"
          style={{ height: "22px", width: "70px", borderRadius: "20px" }}
        />
      </div>
    </div>
  );
}

const POPULAR_SEARCHES = [
  "Emergency Care",
  "Maternity",
  "Cardiology",
  "Pharmacy",
  "Pediatrics",
];

const STATS = [
  { num: "500+", label: "Verified Hospitals" },
  { num: "36", label: "States Covered" },
  { num: "12+", label: "Specialties" },
  { num: "100%", label: "Free to Use" },
];

function formatSpecialty(slug: string): string {
  return slug
    .split("-")
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Home() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [heroVisible, setHeroVisible] = useState(false);
  const router = useRouter();

  // Fade in hero on mount
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    async function fetchHospitals() {
      const { data, error } = await supabase
        .from("hospitals")
        .select("*")
        .order("name", { ascending: true });
      if (!error) setHospitals(data ?? []);
      setLoading(false);
    }
    fetchHospitals();
  }, []);

  const filtered = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/hospitals?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/hospitals");
    }
  };

  return (
    <main
      style={{
        fontFamily: "var(--font-dm-sans, sans-serif)",
        background: "#f0f7f5",
        minHeight: "100vh",
      }}
    >
      {/* ── HERO ── */}
      <section
        style={{
          background:
            "linear-gradient(135deg, #053d2e 0%, #085041 40%, #0f6e56 75%, #1d9e75 100%)",
          padding: "4rem 2rem 3rem",
          position: "relative",
          overflow: "hidden",
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "10%",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.03)",
            pointerEvents: "none",
          }}
        />
        {/* Dot grid pattern top-right */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "120px",
            display: "grid",
            gridTemplateColumns: "repeat(6,1fr)",
            gap: "8px",
            opacity: 0.15,
            pointerEvents: "none",
          }}
        >
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                background: "white",
              }}
            />
          ))}
        </div>

        <div
          style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center" }}
        >
          <p
            style={{
              color: "#5dcaa5",
              fontSize: "0.78rem",
              fontWeight: "700",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: "1rem",
            }}
          >
            Nigeria&apos;s Healthcare Discovery Platform
          </p>

          <h1
            style={{
              fontFamily: "var(--font-playfair, serif)",
              color: "#ffffff",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: "700",
              lineHeight: "1.2",
              marginBottom: "1rem",
              letterSpacing: "-0.02em",
            }}
          >
            Find the right care,{" "}
            <span style={{ color: "#5dcaa5" }}>wherever you are</span>
          </h1>

          <p
            style={{
              color: "#a8d5c8",
              fontSize: "1rem",
              lineHeight: "1.7",
              marginBottom: "2rem",
              maxWidth: "480px",
              margin: "0 auto 2rem",
            }}
          >
            Discover verified hospitals and healthcare services near you. Fast,
            trusted and easy to access.
          </p>

          {/* Search bar */}
          <div
            style={{
              display: "flex",
              maxWidth: "580px",
              margin: "0 auto 1.25rem",
              background: "white",
              borderRadius: "14px",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                paddingLeft: "1rem",
                color: "#9bb8b0",
              }}
            >
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search hospital, specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{
                flex: 1,
                padding: "1rem 0.75rem",
                border: "none",
                outline: "none",
                fontSize: "0.95rem",
                color: "#1a3a32",
                fontFamily: "var(--font-dm-sans, sans-serif)",
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                background: "linear-gradient(135deg, #0f6e56, #1d9e75)",
                color: "white",
                border: "none",
                padding: "1rem 1.5rem",
                fontSize: "0.9rem",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "var(--font-dm-sans, sans-serif)",
                transition: "opacity 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Search Hospitals →
            </button>
          </div>

          {/* Popular search tags */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "0.78rem", color: "#7fb8aa" }}>
              Popular:
            </span>
            {POPULAR_SEARCHES.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSearchQuery(tag);
                  router.push(`/hospitals?q=${encodeURIComponent(tag)}`);
                }}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "#c8ede5",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "20px",
                  padding: "0.3rem 0.9rem",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  fontFamily: "var(--font-dm-sans, sans-serif)",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.color = "white";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.color = "#c8ede5";
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ background: "#053d2e" }}>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
          }}
        >
          {STATS.map((s, i) => (
            <div
              key={i}
              style={{
                padding: "1.25rem",
                textAlign: "center",
                borderRight:
                  i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}
            >
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: "700",
                  color: "#5dcaa5",
                  fontFamily: "var(--font-playfair, serif)",
                }}
              >
                {s.num}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "#7fbfb0",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginTop: "2px",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOSPITAL LISTING ── */}
      <section
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          padding: "2.5rem 1.5rem",
        }}
      >
        {/* Section header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-playfair, serif)",
                fontSize: "1.4rem",
                fontWeight: "700",
                color: "#1a3a32",
                marginBottom: "2px",
              }}
            >
              {loading
                ? "Loading hospitals..."
                : searchQuery
                  ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${searchQuery}"`
                  : "Nearby & Featured Hospitals"}
            </h2>
            {!loading && !searchQuery && (
              <p style={{ fontSize: "0.82rem", color: "#6b9e8e" }}>
                Top-rated healthcare providers across Nigeria
              </p>
            )}
          </div>
          <Link
            href="/hospitals"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.82rem",
              fontWeight: "600",
              color: "#0f6e56",
              textDecoration: "none",
              border: "1.5px solid #0f6e56",
              padding: "0.45rem 1rem",
              borderRadius: "20px",
              transition: "all 0.2s",
            }}
          >
            View All →
          </Link>
        </div>

        {/* Skeleton loaders */}
        {loading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 2rem",
              color: "#6b9e8e",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔍</div>
            <p
              style={{
                fontSize: "1rem",
                fontWeight: "600",
                color: "#1a3a32",
                marginBottom: "0.5rem",
              }}
            >
              No hospitals found
            </p>
            <p style={{ fontSize: "0.88rem" }}>
              Try a different search term or browse all hospitals.
            </p>
          </div>
        )}

        {/* Hospital cards grid */}
        {!loading && filtered.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {filtered.map((hospital) => (
              <HospitalCard key={hospital.id} hospital={hospital} />
            ))}
          </div>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          background: "#053d2e",
          color: "#7fbfb0",
          textAlign: "center",
          padding: "2rem",
          fontSize: "0.82rem",
          marginTop: "2rem",
        }}
      >
        <div style={{ marginBottom: "0.5rem" }}>
          <span
            style={{
              color: "#5dcaa5",
              fontWeight: "600",
              fontFamily: "var(--font-playfair, serif)",
            }}
          >
            Carefinder
          </span>
          {" · "}Built for Nigeria 🇳🇬
        </div>
        <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>
          © 2026 · Connecting Nigerians to quality healthcare
        </div>
      </footer>
    </main>
  );
}

// ── HOSPITAL CARD ──
function HospitalCard({ hospital }: { hospital: Hospital }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={`/hospitals/${hospital.id}`} style={{ textDecoration: "none" }}>
      <div
        onMouseOver={() => setHovered(true)}
        onMouseOut={() => setHovered(false)}
        style={{
          background: "white",
          borderRadius: "16px",
          border: hovered ? "1px solid #0f6e56" : "1px solid #e0ede9",
          padding: "1.25rem 1.25rem 1.25rem 1.5rem",
          position: "relative",
          overflow: "hidden",
          transform: hovered ? "translateY(-3px)" : "translateY(0)",
          boxShadow: hovered
            ? "0 12px 32px rgba(15,110,86,0.13)"
            : "0 2px 8px rgba(0,0,0,0.04)",
          transition: "all 0.25s ease",
          cursor: "pointer",
        }}
      >
        {/* Left teal accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "4px",
            height: "100%",
            background: hovered
              ? "linear-gradient(180deg, #1d9e75, #0f6e56)"
              : "linear-gradient(180deg, #5dcaa5, #1d9e75)",
            transition: "all 0.25s ease",
          }}
        />

        {/* Card header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "0.5rem",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-playfair, serif)",
              fontSize: "0.95rem",
              fontWeight: "700",
              color: hovered ? "#0f6e56" : "#1a3a32",
              lineHeight: "1.3",
              flex: 1,
              paddingRight: "0.5rem",
              transition: "color 0.2s",
            }}
          >
            {hospital.name}
          </h3>
          {hospital.verified && (
            <span
              style={{
                background: "#e1f5ee",
                color: "#0f6e56",
                fontSize: "0.65rem",
                fontWeight: "700",
                padding: "0.2rem 0.55rem",
                borderRadius: "20px",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              ✓ Verified
            </span>
          )}
        </div>

        {/* Location */}
        <p
          style={{
            fontSize: "0.78rem",
            color: "#6b9e8e",
            marginBottom: "0.6rem",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <svg width="11" height="11" fill="#6b9e8e" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          {hospital.lga}, {hospital.state}
        </p>

        {/* Type pill */}
        <span
          style={{
            display: "inline-block",
            fontSize: "0.7rem",
            color: "#5a7a72",
            border: "1px solid #c8e2d8",
            padding: "0.2rem 0.65rem",
            borderRadius: "20px",
            marginBottom: "0.75rem",
          }}
        >
          {hospital.type}
        </span>

        {/* Specialties */}
        {hospital.specialties && hospital.specialties.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
            {hospital.specialties.slice(0, 3).map((s) => (
              <span
                key={s}
                style={{
                  fontSize: "0.68rem",
                  background: "#e1f5ee",
                  color: "#0f6e56",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "20px",
                }}
              >
                {formatSpecialty(s)}
              </span>
            ))}
            {hospital.specialties.length > 3 && (
              <span
                style={{
                  fontSize: "0.68rem",
                  background: "#f0f4f2",
                  color: "#8aada4",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "20px",
                }}
              >
                +{hospital.specialties.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
