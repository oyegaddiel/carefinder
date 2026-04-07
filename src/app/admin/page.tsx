// src/app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

// Describes the shape of a hospital row from Supabase
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
  const router = useRouter();

  // --- Hospitals list state ---
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  // --- Add Hospital form state ---
  // Each useState holds the current value of one form field
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("");
  const [formLga, setFormLga] = useState("");
  const [formState, setFormState] = useState("");
  const [formVerified, setFormVerified] = useState(false); // checkbox
  const [formAddress, setFormAddress] = useState("");
  const [submitting, setSubmitting] = useState(false); // disables button while inserting

  // Fetches all hospitals from Supabase and stores them in state
  const fetchHospitals = async () => {
    const { data, error } = await supabase
      .from("hospitals")
      .select("id, name, type, lga, state, verified");

    if (error) {
      console.error("Error fetching hospitals:", error.message);
    } else {
      setHospitals(data as Hospital[]);
    }
  };

  // On mount: check auth, check admin role, then fetch hospitals
  useEffect(() => {
    // Wait until auth has finished loading before doing anything
    if (authLoading) return;

    // If no user is logged in, send to login page
    if (user === null) {
      router.push("/auth");
      return;
    }

    // Check if the logged-in user has the admin role
    const checkAdmin = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || data?.role !== "admin") {
        // Not an admin — redirect to homepage
        router.push("/");
        return;
      }

      // Passed all checks — load the hospitals
      fetchHospitals();
    };

    checkAdmin();
  }, [user, authLoading, router]);

  // Handles the Add Hospital button click
  const handleAddHospital = async () => {
    // Basic validation — make sure the required fields aren't empty
    if (!formName || !formType || !formLga || !formState) {
      alert("Please fill in all fields before submitting.");
      return;
    }

    setSubmitting(true); // disable the button

    const { error } = await supabase.from("hospitals").insert({
      name: formName,
      type: formType,
      lga: formLga,
      state: formState,
      verified: formVerified,
      address: formAddress,
    });

    if (error) {
      console.error("Insert error:", error.message);
      alert("Failed to add hospital: " + error.message);
      setSubmitting(false);
      return;
    }

    // Success — clear the form fields
    setFormName("");
    setFormType("");
    setFormLga("");
    setFormState("");
    setFormAddress("");
    setFormVerified(false);

    // Re-fetch the list so the new hospital appears immediately
    await fetchHospitals();
    setSubmitting(false);
  };

  // Show nothing while auth is still loading (prevents flash redirect)
  if (authLoading) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* ── Add Hospital Form ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-10 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Add New Hospital
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Hospital Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hospital Name
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Lagos General Hospital"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <input
              type="text"
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              placeholder="e.g. Public, Private, Clinic"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* LGA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LGA
            </label>
            <input
              type="text"
              value={formLga}
              onChange={(e) => setFormLga(e.target.value)}
              placeholder="e.g. Ikeja"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <input
              type="text"
              value={formState}
              onChange={(e) => setFormState(e.target.value)}
              placeholder="e.g. Lagos"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          {/* Address — full width below the grid */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              placeholder="e.g. 12 Hospital Road, Ikeja"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Verified checkbox — sits below the grid */}
        <div className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            id="verified"
            checked={formVerified}
            onChange={(e) => setFormVerified(e.target.checked)}
            className="w-4 h-4 accent-teal-600"
          />
          {/* htmlFor links this label to the checkbox above by matching the id */}
          <label htmlFor="verified" className="text-sm text-gray-700">
            Mark as Verified
          </label>
        </div>

        {/* Submit button */}
        <button
          onClick={handleAddHospital}
          disabled={submitting}
          className="mt-5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {submitting ? "Adding..." : "Add Hospital"}
        </button>
      </div>

      {/* ── Hospitals Table ── */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        All Hospitals ({hospitals.length})
      </h2>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">LGA</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Verified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {hospitals.map((hospital) => (
              <tr key={hospital.id} className="bg-white hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {hospital.name}
                </td>
                <td className="px-4 py-3 text-gray-600">{hospital.type}</td>
                <td className="px-4 py-3 text-gray-600">{hospital.lga}</td>
                <td className="px-4 py-3 text-gray-600">{hospital.state}</td>
                <td className="px-4 py-3">
                  {hospital.verified ? (
                    <span className="bg-teal-100 text-teal-700 text-xs font-semibold px-2 py-1 rounded-full">
                      Verified
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-1 rounded-full">
                      Unverified
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
