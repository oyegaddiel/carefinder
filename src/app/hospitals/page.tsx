// src/app/hospitals/page.tsx
// Hospital listing page with filters, map/list toggle, and GPS "Find Near Me"

"use client";
// 'use client' tells Next.js this component runs in the browser, not the server.
// We need this because we use browser APIs like navigator.geolocation and useState.

import { useEffect, useState } from "react";
// useEffect: runs code after the page loads (e.g. fetch data from Supabase)
// useState: stores values that can change (e.g. the list of hospitals, active filters)

import dynamic from "next/dynamic";
// dynamic() lets us load a component only in the browser.
// HospitalMap uses Google Maps which doesn't work on the server, so we load it dynamically.

import Link from "next/link";
import { supabase } from "@/lib/supabase";

// ─── Dynamic import for the map (browser-only) ───────────────────────────────
const HospitalMap = dynamic(() => import("@/components/ui/HospitalMap"), {
  ssr: false,
  // ssr: false means "do not run this on the server". Google Maps needs window/document.
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

// ─── TypeScript Types ─────────────────────────────────────────────────────────
// A "type" in TypeScript is like a blueprint. It tells TypeScript exactly what
// shape our data will have, so it can catch mistakes before they become bugs.

type Hospital = {
  id: string; // UUID from Supabase — a unique identifier string
  name: string;
  address: string;
  state: string;
  lga: string;
  type: string;
  phone: string | null; // "string | null" means it can be a string OR null (empty)
  rating: number; // a decimal number like 4.5
  verified: boolean; // true or false
  specialties: string[]; // an array (list) of strings e.g. ["cardiology", "pediatrics"]
  latitude: number;
  longitude: number;
  distance_km?: number; // the "?" means this field is optional — only present in Near Me results
};

// ─── Nigerian States ──────────────────────────────────────────────────────────
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

// ─── Helper: format specialty slug to readable label ─────────────────────────
function formatSpecialty(slug: string): string {
  // slug is something like "general-medicine"
  // We split by "-", capitalize each word, then join with a space
  return slug
    .split("-")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .replace("And", "&")
    .replace("Gynecology", "Gynecology");
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function HospitalsPage() {
  // --- State variables ---
  // Each useState() creates a variable + a function to update it.
  // When you call the update function, React re-renders the component.

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  // hospitals: the full list loaded from Supabase (or Near Me results)
  // Hospital[] means "an array of Hospital objects"

  const [loading, setLoading] = useState(true);
  // loading: true while we're fetching data, false when done

  const [view, setView] = useState<"list" | "map">("list");
  // view: either 'list' or 'map' — controls which view is shown
  // 'list' | 'map' is a "union type" — only these two string values are allowed

  const [filterState, setFilterState] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  // These four store the current dropdown/search values. Empty string = no filter.

  const [nearMeActive, setNearMeActive] = useState(false);
  // nearMeActive: true when the user has clicked "Find Near Me" and results are showing

  const [nearMeLoading, setNearMeLoading] = useState(false);
  // nearMeLoading: true while we're waiting for GPS + Supabase to respond

  const [nearMeError, setNearMeError] = useState<string | null>(null);
  // nearMeError: stores an error message string, or null if there's no error

  // --- Load all hospitals on page load ---
  useEffect(() => {
    // useEffect with an empty array [] runs once when the page first loads.
    fetchAllHospitals();
  }, []);

  async function fetchAllHospitals() {
    // async means this function can wait for things (like database calls)
    setLoading(true);
    setNearMeActive(false); // reset Near Me mode when loading all hospitals

    const { data, error } = await supabase.rpc(
      "get_hospitals_with_coordinates",
    );
    // supabase.rpc() calls the SQL function we created earlier.
    // "await" pauses here until Supabase responds.
    // The result comes back as { data, error } — we destructure both.

    if (error) {
      console.error("Error fetching hospitals:", error);
      // console.error prints to the browser's developer console (F12 → Console tab)
    } else {
      setHospitals(data || []);
      // data || [] means: use data if it exists, otherwise use an empty array
    }

    setLoading(false);
  }

  // --- GPS "Find Near Me" logic ---
  async function handleFindNearMe() {
    setNearMeError(null); // clear any previous error
    setNearMeLoading(true);

    // Check if the browser supports geolocation
    if (!navigator.geolocation) {
      setNearMeError("Your browser does not support location services.");
      setNearMeLoading(false);
      return;
      // "return" exits the function early — no point continuing if GPS isn't available
    }

    // Ask the browser for the user's GPS coordinates
    // getCurrentPosition() is asynchronous but uses callbacks instead of promises,
    // so we wrap it in a Promise so we can use "await" with it.
    const position = await new Promise<GeolocationPosition>(
      (resolve, reject) => {
        // GeolocationPosition is a built-in browser type — it represents GPS data
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000, // give up after 10 seconds
          maximumAge: 60000, // accept a cached position up to 1 minute old
        });
      },
    ).catch((err: GeolocationPositionError) => {
      // GeolocationPositionError is another built-in browser type
      if (err.code === 1) {
        // Code 1 = user denied permission
        setNearMeError(
          "Location access was denied. Please allow location access in your browser and try again.",
        );
      } else {
        setNearMeError("Could not get your location. Please try again.");
      }
      setNearMeLoading(false);
      return null;
      // return null signals that GPS failed — we check for this below
    });

    if (!position) return;
    // If position is null (GPS failed), stop here

    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;
    // coords.latitude and coords.longitude are the actual GPS numbers
    // e.g. latitude: 6.5244, longitude: 3.3792 (Lagos)

    // Call the Supabase RPC function with the user's coordinates
    const { data, error } = await supabase.rpc("get_hospitals_near_location", {
      user_lat: userLat,
      user_lng: userLng,
      radius_km: 200,
      // 200km radius — wide enough to always show results in Nigeria
    });

    if (error) {
      setNearMeError("Failed to find nearby hospitals. Please try again.");
      console.error("Near Me error:", error);
    } else {
      setHospitals(data || []);
      setNearMeActive(true);
      // Clear all dropdown filters so they don't conflict with Near Me results
      setFilterState("");
      setFilterType("");
      setFilterSpecialty("");
      setSearchQuery("");
    }

    setNearMeLoading(false);
  }

  // --- Filter logic (runs on every render) ---
  const filteredHospitals = hospitals.filter((hospital: Hospital) => {
    // .filter() creates a new array with only the items that pass the test
    // For each hospital, we return true (keep it) or false (remove it)

    const matchesState = filterState === "" || hospital.state === filterState;
    const matchesType = filterType === "" || hospital.type === filterType;
    const matchesSpecialty =
      filterSpecialty === "" ||
      (hospital.specialties && hospital.specialties.includes(filterSpecialty));
    const matchesSearch =
      searchQuery === "" ||
      hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.type.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesState && matchesType && matchesSpecialty && matchesSearch;
    // All four must be true for the hospital to appear in results
  });

  // --- Render ---
  return (
    <div
      className="min-h-screen"
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
            <Link href="/hospitals" className="text-teal-300 font-medium">
              Find Hospitals
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page title + Near Me button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-3xl font-bold text-gray-900"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Find Hospitals
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              {nearMeActive
                ? `Showing hospitals near your location, sorted by distance`
                : `Search and filter across Nigeria's healthcare directory`}
            </p>
          </div>

          {/* Find Near Me button */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-3">
              {nearMeActive && (
                // This button only appears when Near Me is active
                <button
                  onClick={fetchAllHospitals}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  ✕ Clear Near Me
                </button>
              )}
              <button
                onClick={handleFindNearMe}
                disabled={nearMeLoading}
                // disabled=true makes the button unclickable while loading
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-60"
                style={{
                  backgroundColor: nearMeActive
                    ? "var(--teal-400)"
                    : "var(--teal-700)",
                }}
              >
                {nearMeLoading ? (
                  // Show a spinner while loading
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Locating...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
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

            {/* Error message under the button */}
            {nearMeError && (
              <p className="text-red-500 text-xs max-w-xs text-right">
                {nearMeError}
              </p>
            )}
          </div>
        </div>

        {/* Filters */}
        {!nearMeActive && (
          // Hide filters when Near Me is active — results are already sorted by distance
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <input
                type="text"
                placeholder="Search hospitals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                // e is the event object. e.target.value is what the user typed.
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />

              {/* State filter */}
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All States</option>
                {NIGERIAN_STATES.map((state: string) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>

              {/* Type filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Types</option>
                {HOSPITAL_TYPES.map((type: string) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              {/* Specialty filter */}
              <select
                value={filterSpecialty}
                onChange={(e) => setFilterSpecialty(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Specialties</option>
                {SPECIALTIES.map((s: string) => (
                  <option key={s} value={s}>
                    {formatSpecialty(s)}
                  </option>
                ))}
              </select>
            </div>

            {/* Active filters + clear */}
            {(filterState || filterType || filterSpecialty || searchQuery) && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                {filterState && (
                  <span
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: "var(--teal-500)" }}
                  >
                    {filterState}
                    <button
                      onClick={() => setFilterState("")}
                      className="ml-1 hover:opacity-70"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {filterType && (
                  <span
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: "var(--teal-500)" }}
                  >
                    {filterType}
                    <button
                      onClick={() => setFilterType("")}
                      className="ml-1 hover:opacity-70"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {filterSpecialty && (
                  <span
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: "var(--teal-500)" }}
                  >
                    {formatSpecialty(filterSpecialty)}
                    <button
                      onClick={() => setFilterSpecialty("")}
                      className="ml-1 hover:opacity-70"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: "var(--teal-500)" }}
                  >
                    &ldquo;{searchQuery}&rdquo;
                    <button
                      onClick={() => setSearchQuery("")}
                      className="ml-1 hover:opacity-70"
                    >
                      ✕
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setFilterState("");
                    setFilterType("");
                    setFilterSpecialty("");
                    setSearchQuery("");
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline ml-1"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}

        {/* Result count + view toggle */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {loading
              ? "Loading..."
              : nearMeActive
                ? `${filteredHospitals.length} hospital${filteredHospitals.length !== 1 ? "s" : ""} near you`
                : `Showing ${filteredHospitals.length} of ${hospitals.length} hospitals`}
          </p>
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            <button
              onClick={() => setView("list")}
              className="px-4 py-1.5 text-sm transition-colors"
              style={{
                backgroundColor: view === "list" ? "var(--teal-700)" : "white",
                color: view === "list" ? "white" : "var(--text-secondary)",
              }}
            >
              List
            </button>
            <button
              onClick={() => setView("map")}
              className="px-4 py-1.5 text-sm transition-colors"
              style={{
                backgroundColor: view === "map" ? "var(--teal-700)" : "white",
                color: view === "map" ? "white" : "var(--text-secondary)",
              }}
            >
              Map
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Loading hospitals...</p>
            </div>
          </div>
        )}

        {/* Content: List or Map view */}
        {!loading && (
          <>
            {view === "map" ? (
              <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <HospitalMap hospitals={filteredHospitals} />
              </div>
            ) : (
              <>
                {filteredHospitals.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-gray-400 text-lg">No hospitals found.</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Try adjusting your filters or expanding the search radius.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredHospitals.map((hospital: Hospital) => (
                      <Link
                        key={hospital.id}
                        href={`/hospitals/${hospital.id}`}
                        className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                      >
                        {/* Card header */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3
                            className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2"
                            style={{ fontFamily: "var(--font-playfair)" }}
                          >
                            {hospital.name}
                          </h3>
                          {hospital.verified && (
                            <span
                              className="shrink-0 text-xs px-2 py-0.5 rounded-full text-white font-medium"
                              style={{ backgroundColor: "var(--teal-500)" }}
                            >
                              ✓ Verified
                            </span>
                          )}
                        </div>

                        {/* Location */}
                        <p className="text-xs text-gray-500 mb-2">
                          📍 {hospital.lga}, {hospital.state}
                        </p>

                        {/* Distance badge — only shows in Near Me mode */}
                        {hospital.distance_km !== undefined && (
                          <div className="mb-2">
                            <span
                              className="text-xs font-semibold px-2 py-1 rounded-full"
                              style={{
                                backgroundColor: "var(--teal-100)",
                                color: "var(--teal-700)",
                              }}
                            >
                              📍 {hospital.distance_km} km away
                            </span>
                          </div>
                        )}

                        {/* Type pill */}
                        <span className="inline-block text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-500 mb-3">
                          {hospital.type}
                        </span>

                        {/* Specialties */}
                        {hospital.specialties &&
                          hospital.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {hospital.specialties
                                .slice(0, 3)
                                .map((s: string) => (
                                  // .slice(0, 3) shows max 3 specialty tags to keep cards tidy
                                  <span
                                    key={s}
                                    className="text-xs px-2 py-0.5 rounded-full"
                                    style={{
                                      backgroundColor: "var(--teal-100)",
                                      color: "var(--teal-700)",
                                    }}
                                  >
                                    {formatSpecialty(s)}
                                  </span>
                                ))}
                              {hospital.specialties.length > 3 && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                  +{hospital.specialties.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
