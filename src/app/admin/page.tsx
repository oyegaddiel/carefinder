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
  address: string;
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- Hospitals list state ---
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  // --- Form state ---
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("");
  const [formLga, setFormLga] = useState("");
  const [formState, setFormState] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formVerified, setFormVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // editingId holds the id of the hospital currently being edited.
  // null means we are in "Add" mode; a string id means we are in "Edit" mode.
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetches all hospitals from Supabase
  const fetchHospitals = async () => {
    const { data, error } = await supabase
      .from("hospitals")
      .select("id, name, type, lga, state, verified, address");

    if (error) {
      console.error("Error fetching hospitals:", error.message);
    } else {
      setHospitals(data as Hospital[]);
    }
  };

  // Auth + role check on mount
  useEffect(() => {
    if (authLoading) return;
    if (user === null) {
      router.push("/auth");
      return;
    }

    const checkAdmin = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || data?.role !== "admin") {
        router.push("/");
        return;
      }

      fetchHospitals();
    };

    checkAdmin();
  }, [user, authLoading, router]);

  // Clears the form and exits edit mode back to Add mode
  const resetForm = () => {
    setFormName("");
    setFormType("");
    setFormLga("");
    setFormState("");
    setFormAddress("");
    setFormVerified(false);
    setEditingId(null); // back to Add mode
  };

  // Called when the Edit button is clicked on a row.
  // Populates the form fields with that hospital's existing data.
  const handleEditClick = (hospital: Hospital) => {
    setFormName(hospital.name);
    setFormType(hospital.type);
    setFormLga(hospital.lga);
    setFormState(hospital.state);
    setFormAddress(hospital.address ?? "");
    setFormVerified(hospital.verified);
    setEditingId(hospital.id); // switches form to Edit mode
    // Scroll to the top so the user sees the form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Called when the Delete button is clicked on a row.
  const handleDelete = async (id: string, name: string) => {
    // Ask the admin to confirm before deleting
    const confirmed = window.confirm(
      `Delete "${name}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    const { error } = await supabase.from("hospitals").delete().eq("id", id);

    if (error) {
      console.error("Delete error:", error.message);
      alert("Failed to delete: " + error.message);
      return;
    }

    // Remove the deleted hospital from local state immediately (no re-fetch needed)
    setHospitals((prev) => prev.filter((h) => h.id !== id));
  };

  // Handles both Add and Update depending on whether editingId is set
  const handleSubmit = async () => {
    if (!formName || !formType || !formLga || !formState || !formAddress) {
      alert("Please fill in all fields before submitting.");
      return;
    }

    setSubmitting(true);

    if (editingId) {
      // --- UPDATE MODE ---
      // .update() changes only the columns we pass, matched by id
      const { error } = await supabase
        .from("hospitals")
        .update({
          name: formName,
          type: formType,
          lga: formLga,
          state: formState,
          address: formAddress,
          verified: formVerified,
        })
        .eq("id", editingId);

      if (error) {
        console.error("Update error:", error.message);
        alert("Failed to update: " + error.message);
        setSubmitting(false);
        return;
      }
    } else {
      // --- INSERT MODE ---
      const { error } = await supabase.from("hospitals").insert({
        name: formName,
        type: formType,
        lga: formLga,
        state: formState,
        address: formAddress,
        verified: formVerified,
      });

      if (error) {
        console.error("Insert error:", error.message);
        alert("Failed to add hospital: " + error.message);
        setSubmitting(false);
        return;
      }
    }

    // Success — reset form and re-fetch
    resetForm();
    await fetchHospitals();
    setSubmitting(false);
  };

  if (authLoading) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* ── Add / Edit Hospital Form ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-10 shadow-sm">
        {/* Title changes depending on mode */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {editingId ? "Edit Hospital" : "Add New Hospital"}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            id="verified"
            checked={formVerified}
            onChange={(e) => setFormVerified(e.target.checked)}
            className="w-4 h-4 accent-teal-600"
          />
          <label htmlFor="verified" className="text-sm text-gray-700">
            Mark as Verified
          </label>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {/* Button label changes based on mode and submitting state */}
            {submitting
              ? editingId
                ? "Updating..."
                : "Adding..."
              : editingId
                ? "Update Hospital"
                : "Add Hospital"}
          </button>

          {/* Cancel button only appears in Edit mode */}
          {editingId && (
            <button
              onClick={resetForm}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
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
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {hospitals.map((hospital) => (
              <tr
                key={hospital.id}
                className={`bg-white hover:bg-gray-50 ${
                  // Highlight the row currently being edited
                  editingId === hospital.id
                    ? "ring-2 ring-inset ring-teal-400"
                    : ""
                }`}
              >
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
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(hospital)}
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium px-3 py-1 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(hospital.id, hospital.name)}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-medium px-3 py-1 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
