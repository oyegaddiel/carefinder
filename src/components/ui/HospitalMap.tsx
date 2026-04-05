"use client";

import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import { useState } from "react";
import Link from "next/link";

// --- TYPE DEFINITIONS ---
// This type describes a hospital that has coordinates extracted from PostGIS
// The ? after latitude and longitude means they're optional —
// some hospitals might not have GPS data yet
type HospitalWithCoords = {
  id: string;
  name: string;
  state: string;
  lga: string;
  type: string;
  verified: boolean;
  latitude: number | null;
  longitude: number | null;
};

// Props are the inputs this component receives from its parent (the hospitals page)
// Think of props like function arguments — the parent passes data in, the component uses it
type HospitalMapProps = {
  hospitals: HospitalWithCoords[];
};

export default function HospitalMap({ hospitals }: HospitalMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  // process.env reads from .env.local at build time
  // ?? '' means "if this value is undefined, use an empty string instead"
  // selectedId tracks which hospital pin the user has clicked
  // null means no pin is selected (no popup showing)
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filter to only hospitals that actually have coordinates
  const mappable = hospitals.filter(
    (h) => h.latitude !== null && h.longitude !== null,
  );

  // Find the hospital object that matches the selected pin
  // .find() returns the first match, or undefined if none found
  const selectedHospital = mappable.find((h) => h.id === selectedId);

  // Nigeria's geographic center — used as the default map position
  // when no hospital is selected
  const nigeriaCenter = { lat: 9.082, lng: 8.6753 };

  return (
    // APIProvider wraps everything and loads the Google Maps JavaScript API
    // It needs your API key to authenticate with Google
    <APIProvider apiKey={apiKey}>
      <div
        style={{
          width: "100%",
          height: "520px",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #e8e6e0",
        }}
      >
        <Map
          defaultCenter={nigeriaCenter}
          defaultZoom={6} // zoom level 6 shows all of Nigeria
          mapId="carefinder-map" // required for AdvancedMarker to work
          gestureHandling="greedy" // lets user scroll/pan without holding Ctrl
          disableDefaultUI={false} // keeps zoom buttons and map controls
        >
          {/* Render a pin for each hospital that has coordinates */}
          {mappable.map((hospital) => (
            <AdvancedMarker
              key={hospital.id}
              // latitude and longitude are guaranteed non-null here because of our .filter() above
              position={{ lat: hospital.latitude!, lng: hospital.longitude! }}
              // The ! after a value is TypeScript's "non-null assertion"
              // It tells TypeScript: "I know this isn't null, trust me"
              // We can safely use it here because we already filtered out nulls
              onClick={() => setSelectedId(hospital.id)}
              title={hospital.name}
            >
              {/* Custom pin appearance */}
              <div
                style={{
                  background:
                    selectedId === hospital.id ? "#0d3d3a" : "#14897f",
                  color: "#ffffff",
                  padding: "0.3rem 0.6rem",
                  borderRadius: "6px",
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                  cursor: "pointer",
                  border:
                    selectedId === hospital.id
                      ? "2px solid #1aab9e"
                      : "2px solid transparent",
                  transition: "all 0.15s ease",
                  fontFamily: "var(--font-dm-sans, sans-serif)",
                }}
              >
                📍 {hospital.name.split(" ").slice(0, 2).join(" ")}
                {/* We only show the first 2 words of the name to keep pins compact */}
              </div>
            </AdvancedMarker>
          ))}

          {/* InfoWindow — the popup that appears when a pin is clicked */}
          {selectedHospital &&
            selectedHospital.latitude &&
            selectedHospital.longitude && (
              <InfoWindow
                position={{
                  lat: selectedHospital.latitude,
                  lng: selectedHospital.longitude,
                }}
                onCloseClick={() => setSelectedId(null)}
                // onCloseClick fires when the user clicks the X on the popup
              >
                <div
                  style={{
                    fontFamily: "var(--font-dm-sans, sans-serif)",
                    minWidth: "180px",
                    padding: "0.25rem",
                  }}
                >
                  <p
                    style={{
                      fontWeight: "700",
                      fontSize: "0.9rem",
                      color: "#1a1a1a",
                      marginBottom: "0.3rem",
                      fontFamily: "serif",
                    }}
                  >
                    {selectedHospital.name}
                  </p>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "#666",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {selectedHospital.lga}, {selectedHospital.state} ·{" "}
                    {selectedHospital.type}
                  </p>
                  {selectedHospital.verified && (
                    <p
                      style={{
                        fontSize: "0.72rem",
                        color: "#0f5c57",
                        fontWeight: "700",
                        marginBottom: "0.5rem",
                      }}
                    >
                      ✓ Verified
                    </p>
                  )}
                  <Link
                    href={`/hospitals/${selectedHospital.id}`}
                    style={{
                      display: "inline-block",
                      background: "#14897f",
                      color: "#fff",
                      fontSize: "0.75rem",
                      padding: "0.3rem 0.75rem",
                      borderRadius: "6px",
                      textDecoration: "none",
                      fontWeight: "600",
                    }}
                  >
                    View details →
                  </Link>
                </div>
              </InfoWindow>
            )}
        </Map>
      </div>

      {/* Legend below the map */}
      {mappable.length < hospitals.length && (
        <p
          style={{
            fontSize: "0.78rem",
            color: "#8a8a8a",
            marginTop: "0.5rem",
            textAlign: "right",
          }}
        >
          Showing {mappable.length} of {hospitals.length} hospitals on map (some
          have no GPS data yet)
        </p>
      )}
    </APIProvider>
  );
}
