"use client";

// This tells Next.js this page runs in the browser, not just on the server
// We need this because we're using useState and useEffect (interactive React features)

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
// Link is Next.js's built-in navigation component.
// It works like <a> but handles client-side routing — no full page reload.

import dynamic from "next/dynamic";
// dynamic import means the map only loads in the browser, not during server rendering
// Maps use browser-only APIs (like window) that don't exist on the server
const HospitalMap = dynamic(() => import("@/components/ui/HospitalMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "520px",
        background: "#f5f4f0",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#8a8a8a",
      }}
    >
      Loading map...
    </div>
  ),
});

// --- TYPE DEFINITIONS ---
// A "type" in TypeScript is a blueprint that describes the shape of your data.
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

// Extended hospital type that includes lat/lng from our Supabase RPC function
type HospitalWithCoords = {
  id: string;
  name: string;
  state: string;
  lga: string;
  type: string;
  verified: boolean;
  latitude: number | null; // null if hospital has no GPS data yet
  longitude: number | null;
};

// These are the filter values the user can select.
// Empty string '' means "no filter applied" (show all).
type Filters = {
  state: string;
  type: string;
  specialty: string;
};

// Converts a slug like "general-medicine" to "General Medicine"
// split('-') breaks it into ['general', 'medicine']
// map() capitalizes the first letter of each word
// join(' ') puts them back together with spaces
function formatSpecialty(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// All Nigerian states + FCT — used to populate the State dropdown
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
  "Specialist Hospital",
];

const SPECIALTIES = [
  "General Medicine",
  "Emergency Care",
  "Cardiology",
  "Pediatrics",
  "Maternity & Gynecology",
  "Orthopedics",
  "Neurology",
  "Ophthalmology",
  "Dentistry",
  "Radiology & Imaging",
];

export default function HospitalsPage() {
  // useState<Hospital[]>([]) means:
  // - hospitals is a variable that holds an array of Hospital objects
  // - setHospitals is the function to update it
  // - [] is the starting value (empty array — no hospitals loaded yet)
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 'list' | 'map' is a "union type" — viewMode can only ever be one of these two strings
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Holds hospitals with their GPS coordinates extracted from PostGIS
  const [hospitalsWithCoords, setHospitalsWithCoords] = useState<
    HospitalWithCoords[]
  >([]);

  // Filters is an object with three properties, all starting as empty strings
  const [filters, setFilters] = useState<Filters>({
    state: "",
    type: "",
    specialty: "",
  });

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

    async function fetchCoordinates() {
      // .rpc() calls a Supabase SQL function by name
      // get_hospitals_with_coordinates is the function we created in the SQL editor
      const { data, error } = await supabase.rpc(
        "get_hospitals_with_coordinates",
      );
      if (!error && data) {
        setHospitalsWithCoords(data);
      }
    }

    fetchHospitals();
    fetchCoordinates();
  }, []);

  // This function updates a single filter without touching the others.
  // "keyof Filters" means the key must be one of: 'state', 'type', or 'specialty'
  function updateFilter(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    // ...prev means "spread all existing filter values, then override just [key]"
  }

  function clearFilters() {
    setSearchQuery("");
    setFilters({ state: "", type: "", specialty: "" });
  }

  // Apply all active filters to the hospital list
  const filtered = hospitals.filter((h) => {
    // Text search — checks name, state, and address
    const matchesSearch =
      searchQuery === "" ||
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase());

    // State filter — empty string means "match everything"
    const matchesState = filters.state === "" || h.state === filters.state;

    // Type filter
    const matchesType = filters.type === "" || h.type === filters.type;

    // Specialty filter — checks if the hospital's specialties array includes the selected specialty
    const matchesSpecialty =
      filters.specialty === "" ||
      (h.specialties && h.specialties.includes(filters.specialty));

    // All four conditions must be true for the hospital to show up
    return matchesSearch && matchesState && matchesType && matchesSpecialty;
  });

  // Check if any filter is currently active — used to show/hide the "Clear" button
  const hasActiveFilters =
    searchQuery !== "" ||
    filters.state !== "" ||
    filters.type !== "" ||
    filters.specialty !== "";

  // Shared style for all three filter dropdowns
  const selectStyle: React.CSSProperties = {
    padding: "0.6rem 0.8rem",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "0.88rem",
    color: "var(--text-primary)",
    background: "#ffffff",
    cursor: "pointer",
    fontFamily: "var(--font-dm-sans, sans-serif)",
    minWidth: "160px",
  };
  // React.CSSProperties is a TypeScript type that describes valid CSS style objects.
  // Without it, TypeScript might not know what properties are valid here.

  // Helper function that returns toggle button styles based on whether it's active
  // active: boolean means this parameter can only be true or false
  const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    background: active ? "var(--teal-900)" : "#fff",
    color: active ? "#fff" : "var(--text-secondary)",
    fontSize: "0.85rem",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "var(--font-dm-sans, sans-serif)",
  });
  // The ? : syntax above is called a "ternary operator"
  // active ? 'var(--teal-900)' : '#fff' means:
  // "if active is true, use teal-900, otherwise use white"

  return (
    <main
      style={{
        fontFamily: "var(--font-dm-sans, sans-serif)",
        minHeight: "100vh",
      }}
    >
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
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-playfair, serif)",
            color: "#ffffff",
            textDecoration: "none",
            fontSize: "1.4rem",
            fontWeight: "700",
            letterSpacing: "-0.02em",
          }}
        >
          Carefinder
        </Link>
        <nav style={{ display: "flex", gap: "2rem" }}>
          <Link
            href="/hospitals"
            style={{
              color: "#ffffff",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: "600",
            }}
          >
            Find Hospitals
          </Link>
          <Link
            href="/"
            style={{
              color: "#a8d5d1",
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            Home
          </Link>
        </nav>
      </header>

      {/* ── PAGE TITLE BAR ── */}
      <div
        style={{
          background: "var(--teal-900)",
          padding: "2rem 2rem 2.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h1
            style={{
              fontFamily: "var(--font-playfair, serif)",
              color: "#ffffff",
              fontSize: "1.8rem",
              fontWeight: "700",
              marginBottom: "1.25rem",
            }}
          >
            Find Hospitals
          </h1>

          {/* Search bar */}
          <div
            style={{
              display: "flex",
              background: "#ffffff",
              borderRadius: "10px",
              overflow: "hidden",
              maxWidth: "600px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            <input
              type="text"
              placeholder="Search by name, state, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: "0.85rem 1.2rem",
                border: "none",
                outline: "none",
                fontSize: "0.92rem",
                fontFamily: "var(--font-dm-sans, sans-serif)",
              }}
            />
            <button
              style={{
                background: "var(--teal-500)",
                color: "#fff",
                border: "none",
                padding: "0.85rem 1.25rem",
                fontWeight: "600",
                fontSize: "0.9rem",
                cursor: "pointer",
                fontFamily: "var(--font-dm-sans, sans-serif)",
              }}
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* ── FILTERS + RESULTS ── */}
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "2rem",
          display: "flex",
          gap: "2rem",
          alignItems: "flex-start",
        }}
      >
        {/* ── LEFT: FILTER PANEL ── */}
        <aside
          style={{
            width: "220px",
            flexShrink: 0, // prevents this column from shrinking when results take up space
            background: "#ffffff",
            border: "1px solid #e8e6e0",
            borderRadius: "12px",
            padding: "1.25rem",
            position: "sticky",
            top: "1rem", // sticks to the top when user scrolls
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
            }}
          >
            <h3
              style={{
                fontSize: "0.9rem",
                fontWeight: "700",
                color: "var(--text-primary)",
              }}
            >
              Filters
            </h3>
            {/* Only show Clear button when at least one filter is active */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--teal-500)",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  fontFamily: "var(--font-dm-sans, sans-serif)",
                  fontWeight: "600",
                }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* State filter */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: "600",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "0.4rem",
              }}
            >
              State
            </label>
            <select
              value={filters.state}
              onChange={(e) => updateFilter("state", e.target.value)}
              style={{ ...selectStyle, width: "100%" }}
            >
              <option value="">All states</option>
              {NIGERIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* Hospital Type filter */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: "600",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "0.4rem",
              }}
            >
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => updateFilter("type", e.target.value)}
              style={{ ...selectStyle, width: "100%" }}
            >
              <option value="">All types</option>
              {HOSPITAL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Specialty filter */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: "600",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "0.4rem",
              }}
            >
              Specialty
            </label>
            <select
              value={filters.specialty}
              onChange={(e) => updateFilter("specialty", e.target.value)}
              style={{ ...selectStyle, width: "100%" }}
            >
              <option value="">All specialties</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </aside>

        {/* ── RIGHT: RESULTS ── */}
        <div style={{ flex: 1 }}>
          {/* View toggle — switches between card list and Google Map */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <button
              onClick={() => setViewMode("list")}
              style={toggleBtnStyle(viewMode === "list")}
            >
              ☰ List View
            </button>
            <button
              onClick={() => setViewMode("map")}
              style={toggleBtnStyle(viewMode === "map")}
            >
              🗺 Map View
            </button>
          </div>

          {/* Results count + active filter tags */}
          <div style={{ marginBottom: "1rem" }}>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                marginBottom: "0.5rem",
              }}
            >
              {loading
                ? "Loading..."
                : `Showing ${filtered.length} of ${hospitals.length} hospital${hospitals.length !== 1 ? "s" : ""}`}
            </p>

            {/* Active filter tags — shows which filters are currently on */}
            {hasActiveFilters && (
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {filters.state && (
                  <span
                    style={{
                      background: "var(--teal-100)",
                      color: "var(--teal-700)",
                      fontSize: "0.75rem",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "20px",
                      fontWeight: "600",
                    }}
                  >
                    State: {filters.state}
                  </span>
                )}
                {filters.type && (
                  <span
                    style={{
                      background: "var(--teal-100)",
                      color: "var(--teal-700)",
                      fontSize: "0.75rem",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "20px",
                      fontWeight: "600",
                    }}
                  >
                    Type: {filters.type}
                  </span>
                )}
                {filters.specialty && (
                  <span
                    style={{
                      background: "var(--teal-100)",
                      color: "var(--teal-700)",
                      fontSize: "0.75rem",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "20px",
                      fontWeight: "600",
                    }}
                  >
                    Specialty: {filters.specialty}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── MAP VIEW ──
              Only renders when the user clicks "Map View"
              We pass only the filtered hospitals so the map respects active filters
              hospitalsWithCoords.filter(...) cross-references the filtered list by id */}
          {viewMode === "map" && !loading && (
            <HospitalMap
              hospitals={hospitalsWithCoords.filter(
                (h) => filtered.some((f) => f.id === h.id),
                // .some() returns true if at least one element in filtered matches
              )}
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
              // ?? '' means "use empty string if the env variable is undefined"
            />
          )}

          {/* ── LIST VIEW ──
              The <> and </> are called a React Fragment — they group elements
              without adding an extra HTML element to the page */}
          {viewMode === "list" && (
            <>
              {/* Loading state */}
              {loading && (
                <div
                  style={{
                    padding: "3rem",
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  Loading hospitals...
                </div>
              )}

              {/* Empty state — shown when search returns no matches */}
              {!loading && filtered.length === 0 && (
                <div
                  style={{
                    padding: "3rem",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    background: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #e8e6e0",
                  }}
                >
                  <p style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
                    No hospitals match your search.
                  </p>
                  <p style={{ fontSize: "0.85rem" }}>
                    Try adjusting your filters or search term.
                  </p>
                </div>
              )}

              {/* Hospital cards */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.875rem",
                }}
              >
                {filtered.map((hospital) => (
                  // Link wraps the entire card so clicking anywhere navigates to the detail page
                  <Link
                    key={hospital.id}
                    href={`/hospitals/${hospital.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e8e6e0",
                        borderRadius: "12px",
                        padding: "1.25rem 1.5rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                        transition: "box-shadow 0.2s, transform 0.2s",
                        cursor: "pointer",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 6px 20px rgba(0,0,0,0.09)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 1px 4px rgba(0,0,0,0.04)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        {/* Hospital name + verified badge */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "0.35rem",
                          }}
                        >
                          <h3
                            style={{
                              fontFamily: "var(--font-playfair, serif)",
                              fontSize: "1rem",
                              fontWeight: "700",
                              color: "var(--text-primary)",
                            }}
                          >
                            {hospital.name}
                          </h3>
                          {/* hospital.verified && (...) means: only render this if verified is true */}
                          {hospital.verified && (
                            <span
                              style={{
                                background: "var(--teal-100)",
                                color: "var(--teal-700)",
                                fontSize: "0.68rem",
                                fontWeight: "700",
                                padding: "0.12rem 0.45rem",
                                borderRadius: "20px",
                                letterSpacing: "0.05em",
                              }}
                            >
                              ✓ VERIFIED
                            </span>
                          )}
                        </div>

                        {/* Location */}
                        <p
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--text-secondary)",
                            marginBottom: "0.4rem",
                          }}
                        >
                          📍 {hospital.lga}, {hospital.state} State
                        </p>

                        {/* Address */}
                        {hospital.address && (
                          <p
                            style={{
                              fontSize: "0.82rem",
                              color: "var(--text-muted)",
                              marginBottom: "0.5rem",
                            }}
                          >
                            {hospital.address}
                          </p>
                        )}

                        {/* Specialties — slice(0, 4) shows only first 4 to avoid clutter */}
                        {hospital.specialties &&
                          hospital.specialties.length > 0 && (
                            <div
                              style={{
                                display: "flex",
                                gap: "0.35rem",
                                flexWrap: "wrap",
                                marginTop: "0.4rem",
                              }}
                            >
                              {hospital.specialties
                                .slice(0, 4)
                                .map((specialty) => (
                                  <span
                                    key={specialty}
                                    style={{
                                      background: "var(--warm-gray)",
                                      color: "var(--text-secondary)",
                                      fontSize: "0.72rem",
                                      padding: "0.18rem 0.55rem",
                                      borderRadius: "20px",
                                      fontWeight: "500",
                                    }}
                                  >
                                    {formatSpecialty(specialty)}
                                  </span>
                                ))}
                              {hospital.specialties.length > 4 && (
                                <span
                                  style={{
                                    fontSize: "0.72rem",
                                    color: "var(--text-muted)",
                                    padding: "0.18rem 0.4rem",
                                  }}
                                >
                                  +{hospital.specialties.length - 4} more
                                </span>
                              )}
                            </div>
                          )}
                      </div>

                      {/* Right side — type badge + phone */}
                      <div
                        style={{
                          marginLeft: "1rem",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: "0.5rem",
                        }}
                      >
                        <span
                          style={{
                            background: "var(--teal-900)",
                            color: "#ffffff",
                            fontSize: "0.72rem",
                            fontWeight: "600",
                            padding: "0.28rem 0.75rem",
                            borderRadius: "20px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {hospital.type}
                        </span>
                        {hospital.phone && (
                          <span
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            📞 {hospital.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
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
