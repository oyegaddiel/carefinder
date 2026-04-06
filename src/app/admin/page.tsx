// src/app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type Hospital = {
  id: string;
  name: string;
  type: string;
  lga: string;
  state: string;
  verified: boolean;
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  // authLoading is true while Supabase is still checking the session on page load.
  // We must wait for it to be false before we trust user being null.
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait until AuthContext has finished loading the session.
    // If we don't wait, user is null before getSession() completes
    // and we redirect to /auth even when someone IS logged in.
    if (authLoading) return;

    if (user === null) {
      router.push("/auth");
      return;
    }

    async function checkAdmin() {
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user!.id)
        .maybeSingle();

      if (data?.role !== "admin") {
        router.push("/");
        return;
      }

      setIsAdmin(true);

      const { data: hospitalData } = await supabase
        .from("hospitals")
        .select("id, name, type, lga, state, verified")
        .order("name", { ascending: true });

      setHospitals(hospitalData ?? []);
      setLoading(false);
    }

    checkAdmin();
  }, [user, authLoading, router]);

  if (isAdmin === null) return null;

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1
          className="text-3xl font-bold mb-1"
          style={{
            fontFamily: "var(--font-playfair)",
            color: "var(--teal-700)",
          }}
        >
          Admin Dashboard
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Manage hospitals in the Carefinder database
        </p>
      </div>

      <div
        className="inline-block px-5 py-3 rounded-lg mb-8 text-sm font-medium"
        style={{ backgroundColor: "var(--teal-50)", color: "var(--teal-700)" }}
      >
        {loading ? "Loading..." : `${hospitals.length} hospitals in database`}
      </div>

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading hospitals...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{ backgroundColor: "var(--teal-700)", color: "white" }}
              >
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">LGA</th>
                <th className="text-left px-4 py-3 font-medium">State</th>
                <th className="text-left px-4 py-3 font-medium">Verified</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((hospital, index) => (
                <tr
                  key={hospital.id}
                  style={{
                    backgroundColor:
                      index % 2 === 0 ? "white" : "var(--teal-50)",
                  }}
                >
                  <td className="px-4 py-3 font-medium">{hospital.name}</td>
                  <td
                    className="px-4 py-3"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {hospital.type}
                  </td>
                  <td
                    className="px-4 py-3"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {hospital.lga}
                  </td>
                  <td
                    className="px-4 py-3"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {hospital.state}
                  </td>
                  <td className="px-4 py-3">
                    {hospital.verified ? (
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: "var(--teal-500)",
                          color: "white",
                        }}
                      >
                        Verified
                      </span>
                    ) : (
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
                      >
                        Unverified
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
