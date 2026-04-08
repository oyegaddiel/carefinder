// src/app/hospitals/page.tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const HospitalMap = dynamic(() => import("@/components/ui/HospitalMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "384px",
        background: "#f0f7f5",
        borderRadius: "12px",
      }}
    >
      <p style={{ color: "#6b9e8e" }}>Loading map...</p>
    </div>
  ),
});

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
  latitude: number;
  longitude: number;
  distance_km?: number;
};

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];
const HOSPITAL_TYPES = [
  "Teaching Hospital",
  "Federal Hospital",
  "State Hospital",
  "Private Hospital",
  "Clinic",
  "Primary Health Centre",
];
const SPECIALTIES = [
  "general-medicine",
  "emergency-care",
  "cardiology",
  "pediatrics",
  "maternity-gynecology",
  "orthopedics",
  "neurology",
  "ophthalmology",
  "dentistry",
  "radiology-imaging",
];

function formatSpecialty(slug: string): string {
  return slug
    .split("-")
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .replace("And", "&");
}

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "1.25rem 1.25rem 1.25rem 1.5rem",
        border: "1px solid #e0ede9",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .sk { background: linear-gradient(90deg,#e8f4f0 25%,#f5fbf8 50%,#e8f4f0 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:6px; }
      `}</style>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "4px",
          height: "100%",
          background: "#e0ede9",
        }}
      />
      <div
        className="sk"
        style={{ height: "13px", width: "65%", marginBottom: "10px" }}
      />
      <div
        className="sk"
        style={{ height: "10px", width: "40%", marginBottom: "12px" }}
      />
      <div
        className="sk"
        style={{
          height: "22px",
          width: "90px",
          borderRadius: "20px",
          marginBottom: "10px",
        }}
      />
      <div style={{ display: "flex", gap: "6px" }}>
        <div
          className="sk"
          style={{ height: "20px", width: "75px", borderRadius: "20px" }}
        />
        <div
          className="sk"
          style={{ height: "20px", width: "65px", borderRadius: "20px" }}
        />
      </div>
    </div>
  );
}

// Individual hospital card
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
          height: "100%",
        }}
      >
        {/* Left accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "4px",
            height: "100%",
            background: hovered
              ? "linear-gradient(180deg,#1d9e75,#0f6e56)"
              : "linear-gradient(180deg,#5dcaa5,#1d9e75)",
            transition: "all 0.25s ease",
          }}
        />

        {/* Header */}
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
            marginBottom: "0.5rem",
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

        {/* Distance badge — Near Me only */}
        {hospital.distance_km !== undefined && (
          <div style={{ marginBottom: "0.5rem" }}>
            <span
              style={{
                background: "#0f6e56",
                color: "white",
                fontSize: "0.68rem",
                fontWeight: "700",
                padding: "0.2rem 0.65rem",
                borderRadius: "20px",
              }}
            >
              ◎ {hospital.distance_km} km away
            </span>
          </div>
        )}

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
            {hospital.specialties.slice(0, 3).map((s: string) => (
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

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "map">("list");
  const [filterState, setFilterState] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [nearMeActive, setNearMeActive] = useState(false);
  const [nearMeLoading, setNearMeLoading] = useState(false);
  const [nearMeError, setNearMeError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllHospitals();
  }, []);

  async function fetchAllHospitals() {
    setLoading(true);
    setNearMeActive(false);
    const { data, error } = await supabase.rpc(
      "get_hospitals_with_coordinates",
    );
    if (!error) setHospitals(data || []);
    setLoading(false);
  }

  async function handleFindNearMe() {
    setNearMeError(null);
    setNearMeLoading(true);
    if (!navigator.geolocation) {
      setNearMeError("Your browser does not support location services.");
      setNearMeLoading(false);
      return;
    }
    const position = await new Promise<GeolocationPosition>(
      (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: 60000,
        });
      },
    ).catch((err: GeolocationPositionError) => {
      setNearMeError(
        err.code === 1
          ? "Location access was denied. Please allow location access and try again."
          : "Could not get your location. Please try again.",
      );
      setNearMeLoading(false);
      return null;
    });
    if (!position) return;
    const { data, error } = await supabase.rpc("get_hospitals_near_location", {
      user_lat: position.coords.latitude,
      user_lng: position.coords.longitude,
      radius_km: 200,
    });
    if (error) {
      setNearMeError("Failed to find nearby hospitals. Please try again.");
    } else {
      setHospitals(data || []);
      setNearMeActive(true);
      setFilterState("");
      setFilterType("");
      setFilterSpecialty("");
      setSearchQuery("");
    }
    setNearMeLoading(false);
  }

  const filteredHospitals = hospitals.filter((h: Hospital) => {
    const matchesState = filterState === "" || h.state === filterState;
    const matchesType = filterType === "" || h.type === filterType;
    const matchesSpecialty =
      filterSpecialty === "" ||
      (h.specialties && h.specialties.includes(filterSpecialty));
    const matchesSearch =
      searchQuery === "" ||
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesState && matchesType && matchesSpecialty && matchesSearch;
  });

  const hasActiveFilters =
    filterState || filterType || filterSpecialty || searchQuery;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0f7f5",
        fontFamily: "var(--font-dm-sans, sans-serif)",
      }}
    >
      {/* ── TEAL BANNER HEADER ── */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #053d2e 0%, #085041 50%, #0f6e56 100%)",
          padding: "2rem 1.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circle */}
        <div
          style={{
            position: "absolute",
            right: "-60px",
            top: "-60px",
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-playfair, serif)",
                color: "white",
                fontSize: "clamp(1.4rem,4vw,2rem)",
                fontWeight: "700",
                marginBottom: "0.3rem",
              }}
            >
              {nearMeActive
                ? "Hospitals Near You"
                : "Find Hospitals & Healthcare Services"}
            </h1>
            <p style={{ color: "#a8d5c8", fontSize: "0.85rem" }}>
              {nearMeActive
                ? "Sorted by distance from your location"
                : "Browse verified hospitals across Nigeria. Filter by location, type, or specialty."}
            </p>
          </div>

          {/* Find Near Me button group */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "0.5rem",
            }}
          >
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {nearMeActive && (
                <button
                  onClick={fetchAllHospitals}
                  style={{
                    padding: "0.6rem 1rem",
                    fontSize: "0.82rem",
                    borderRadius: "25px",
                    border: "1.5px solid rgba(255,255,255,0.4)",
                    background: "transparent",
                    color: "white",
                    cursor: "pointer",
                    fontFamily: "var(--font-dm-sans, sans-serif)",
                  }}
                >
                  ✕ Clear
                </button>
              )}
              <button
                onClick={handleFindNearMe}
                disabled={nearMeLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0.6rem 1.25rem",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  borderRadius: "25px",
                  border: "none",
                  cursor: nearMeLoading ? "not-allowed" : "pointer",
                  background: nearMeActive ? "#5dcaa5" : "white",
                  color: nearMeActive ? "#053d2e" : "#0f6e56",
                  opacity: nearMeLoading ? 0.7 : 1,
                  fontFamily: "var(--font-dm-sans, sans-serif)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                  transition: "all 0.2s",
                }}
              >
                {nearMeLoading ? (
                  <>
                    <svg
                      style={{
                        animation: "spin 1s linear infinite",
                        width: "16px",
                        height: "16px",
                      }}
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeOpacity="0.25"
                      />
                      <path
                        d="M4 12a8 8 0 018-8"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    Locating...
                  </>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {nearMeActive ? "Near Me ✓" : "Find Near Me"}
                  </>
                )}
              </button>
            </div>
            {nearMeError && (
              <p
                style={{
                  color: "#fca5a5",
                  fontSize: "0.75rem",
                  maxWidth: "260px",
                  textAlign: "right",
                }}
              >
                {nearMeError}
              </p>
            )}
          </div>
        </div>

        {/* ── FILTERS (inside banner) ── */}
        {!nearMeActive && (
          <div style={{ maxWidth: "1200px", margin: "1.25rem auto 0" }}>
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "0.75rem 1rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {/* Search */}
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <svg
                  style={{
                    position: "absolute",
                    left: "10px",
                    color: "#9bb8b0",
                    flexShrink: 0,
                  }}
                  width="15"
                  height="15"
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
                <input
                  type="text"
                  placeholder="Search hospitals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    paddingLeft: "2rem",
                    paddingRight: "0.75rem",
                    paddingTop: "0.5rem",
                    paddingBottom: "0.5rem",
                    border: "1.5px solid #e0ede9",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    outline: "none",
                    fontFamily: "var(--font-dm-sans, sans-serif)",
                    color: "#1a3a32",
                  }}
                />
              </div>

              {/* State */}
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                style={{
                  padding: "0.5rem 0.75rem",
                  border: "1.5px solid #e0ede9",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  outline: "none",
                  color: filterState ? "#1a3a32" : "#9bb8b0",
                  fontFamily: "var(--font-dm-sans, sans-serif)",
                  background: "white",
                }}
              >
                <option value="">All States</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {/* Type */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  padding: "0.5rem 0.75rem",
                  border: "1.5px solid #e0ede9",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  outline: "none",
                  color: filterType ? "#1a3a32" : "#9bb8b0",
                  fontFamily: "var(--font-dm-sans, sans-serif)",
                  background: "white",
                }}
              >
                <option value="">All Types</option>
                {HOSPITAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* Specialty */}
              <select
                value={filterSpecialty}
                onChange={(e) => setFilterSpecialty(e.target.value)}
                style={{
                  padding: "0.5rem 0.75rem",
                  border: "1.5px solid #e0ede9",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  outline: "none",
                  color: filterSpecialty ? "#1a3a32" : "#9bb8b0",
                  fontFamily: "var(--font-dm-sans, sans-serif)",
                  background: "white",
                }}
              >
                <option value="">All Specialties</option>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>
                    {formatSpecialty(s)}
                  </option>
                ))}
              </select>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  marginTop: "0.75rem",
                  alignItems: "center",
                }}
              >
                {[
                  filterState && {
                    label: filterState,
                    clear: () => setFilterState(""),
                  },
                  filterType && {
                    label: filterType,
                    clear: () => setFilterType(""),
                  },
                  filterSpecialty && {
                    label: formatSpecialty(filterSpecialty),
                    clear: () => setFilterSpecialty(""),
                  },
                  searchQuery && {
                    label: `"${searchQuery}"`,
                    clear: () => setSearchQuery(""),
                  },
                ]
                  .filter((x): x is { label: string; clear: () => void } =>
                    Boolean(x),
                  )
                  .map((chip) => (
                    <span
                      key={chip.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "rgba(255,255,255,0.15)",
                        color: "white",
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.65rem",
                        borderRadius: "20px",
                        border: "1px solid rgba(255,255,255,0.25)",
                      }}
                    >
                      {chip.label}
                      <button
                        onClick={chip.clear}
                        style={{
                          background: "none",
                          border: "none",
                          color: "white",
                          cursor: "pointer",
                          fontSize: "0.7rem",
                          lineHeight: 1,
                          padding: "0 2px",
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => {
                    setFilterState("");
                    setFilterType("");
                    setFilterSpecialty("");
                    setSearchQuery("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontFamily: "var(--font-dm-sans, sans-serif)",
                  }}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "1.5rem 1.5rem",
        }}
      >
        {/* Result count + view toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.25rem",
          }}
        >
          <p
            style={{ fontSize: "0.85rem", color: "#6b9e8e", fontWeight: "500" }}
          >
            {loading
              ? "Loading..."
              : nearMeActive
                ? `${filteredHospitals.length} hospital${filteredHospitals.length !== 1 ? "s" : ""} near you`
                : `Showing ${filteredHospitals.length} of ${hospitals.length} hospitals`}
          </p>
          <div
            style={{
              display: "flex",
              background: "white",
              borderRadius: "10px",
              overflow: "hidden",
              border: "1px solid #d0e8e0",
            }}
          >
            {(["list", "map"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: "0.4rem 1rem",
                  fontSize: "0.82rem",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-dm-sans, sans-serif)",
                  fontWeight: view === v ? "600" : "400",
                  background: view === v ? "#0f6e56" : "white",
                  color: view === v ? "white" : "#6b9e8e",
                  transition: "all 0.2s",
                }}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
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

        {/* Map view */}
        {!loading && view === "map" && (
          <div
            style={{
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 2px 16px rgba(15,110,86,0.1)",
              border: "1px solid #d0e8e0",
            }}
          >
            <HospitalMap hospitals={filteredHospitals} />
          </div>
        )}

        {/* List view */}
        {!loading && view === "list" && (
          <>
            {filteredHospitals.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "5rem 2rem",
                  color: "#6b9e8e",
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
                  🔍
                </div>
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
                <p style={{ fontSize: "0.85rem" }}>
                  Try adjusting your filters or expanding the search radius.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "1rem",
                }}
              >
                {filteredHospitals.map((hospital: Hospital) => (
                  <HospitalCard key={hospital.id} hospital={hospital} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer
        style={{
          background: "#053d2e",
          color: "#7fbfb0",
          textAlign: "center",
          padding: "2rem",
          fontSize: "0.82rem",
          marginTop: "3rem",
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
    </div>
  );
}
