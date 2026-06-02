"use client";

import { useState } from "react";

interface AppFiles {
  applicationPdf: string | null;
  agreement: string | null;
  chargeConfirmation: string | null;
  primaryLicense: string | null;
  coApplicantLicense: string | null;
  insurance: string | null;
  registration: string | null;
  driverLicensePhoto: string | null;
  utilityBill: string | null;
  businessLicense: string | null;
}

interface Application {
  id: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  isPaid: boolean;
  stripeSession: string;
  missingFields: string[];
  firstName: string;
  lastName: string;
  ssn: string | null;
  dob: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  files: AppFiles;
}

const FILE_LABELS: { key: keyof AppFiles; label: string; icon: string; isPdf?: boolean }[] = [
  { key: "applicationPdf", label: "Application PDF", icon: "📄", isPdf: true },
  { key: "agreement", label: "Signed Agreement", icon: "✍️", isPdf: true },
  { key: "chargeConfirmation", label: "CC Confirmation", icon: "💳", isPdf: true },
  { key: "primaryLicense", label: "Driver License", icon: "🪪" },
  { key: "coApplicantLicense", label: "Co-App License", icon: "🪪" },
  { key: "insurance", label: "Insurance Card", icon: "🛡️" },
  { key: "registration", label: "Registration", icon: "📋" },
  { key: "driverLicensePhoto", label: "DL Photo", icon: "📷" },
  { key: "utilityBill", label: "Utility Bill", icon: "🏠" },
  { key: "businessLicense", label: "Business License", icon: "🏢" },
];

const EDITABLE_FIELDS = [
  { field: "licenseAddress", label: "Home Address (DL)", placeholder: "e.g. 17811 SW 58th St" },
  { field: "licenseCity", label: "City (DL)", placeholder: "e.g. Miami" },
  { field: "licenseState", label: "State (DL)", placeholder: "e.g. FL" },
  { field: "licenseZip", label: "ZIP (DL)", placeholder: "e.g. 33175" },
  { field: "registeringAddress", label: "Registering Address", placeholder: "e.g. 5121 N 37th St, Hollywood, FL 33021" },
  { field: "employerName", label: "Employer Name", placeholder: "" },
  { field: "employerStreet", label: "Employer Street", placeholder: "" },
  { field: "employerCity", label: "Employer City", placeholder: "" },
  { field: "employerState", label: "Employer State", placeholder: "" },
  { field: "employerZip", label: "Employer ZIP", placeholder: "" },
  { field: "occupation", label: "Occupation", placeholder: "" },
];

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [savedPassword, setSavedPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Set<string>>(new Set());
  const [regenerating, setRegenerating] = useState<Set<string>>(new Set());
  const [regenStatus, setRegenStatus] = useState<Record<string, string>>({});
  const [patches, setPatches] = useState<Record<string, Record<string, string>>>({});
  const [coPatches, setCoPatches] = useState<Record<string, Record<string, string>>>({});

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/applications", {
        headers: { "x-admin-password": password },
      });
      if (!res.ok) {
        setError("Incorrect password");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setApplications(data.applications);
      setSavedPassword(password);
      setAuthed(true);
    } catch {
      setError("Connection error");
    }
    setLoading(false);
  }

  function setPatch(id: string, field: string, value: string) {
    setPatches((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));
  }

  function setCoPatch(id: string, field: string, value: string) {
    setCoPatches((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));
  }

  async function regeneratePdf(id: string) {
    setRegenerating((prev) => new Set(prev).add(id));
    setRegenStatus((prev) => ({ ...prev, [id]: "" }));
    try {
      const res = await fetch("/api/admin/regenerate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": savedPassword,
        },
        body: JSON.stringify({ id, patches: patches[id] || {}, coPatches: coPatches[id] || {} }),
      });
      const data = await res.json();
      if (res.ok) {
        setRegenStatus((prev) => ({ ...prev, [id]: "done" }));
        const appsRes = await fetch("/api/admin/applications", {
          headers: { "x-admin-password": savedPassword },
        });
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          setApplications(appsData.applications);
        }
      } else {
        setRegenStatus((prev) => ({ ...prev, [id]: data.error || "error" }));
      }
    } catch {
      setRegenStatus((prev) => ({ ...prev, [id]: "error" }));
    }
    setRegenerating((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleEdit(id: string) {
    setEditing((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const displayed = showAll ? applications : applications.filter((a) => a.isPaid);
  const paidCount = applications.filter((a) => a.isPaid).length;

  if (!authed) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-2xl font-bold text-white">1 OF 1 AUTO</div>
            <div className="text-zinc-400 text-sm mt-1">Admin Portal</div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500"
            />
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg py-3 transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : "Access Portal"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">1 OF 1 AUTO</h1>
            <p className="text-zinc-400 text-sm">{paidCount} paid applications</p>
          </div>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-zinc-400 border border-zinc-700 rounded-lg px-3 py-1.5 hover:border-zinc-500"
          >
            {showAll ? "Show paid only" : `Show all (${applications.length})`}
          </button>
        </div>

        <div className="space-y-3">
          {displayed.map((app) => {
            const isOpen = expanded.has(app.id);
            const isEditing = editing.has(app.id);
            const fileCount = Object.values(app.files).filter(Boolean).length;
            const hasMissing = (app.missingFields || []).length > 0;
            const date = new Date(app.createdAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            });

            return (
              <div
                key={app.id}
                className={`border rounded-xl overflow-hidden ${
                  app.isPaid ? "border-yellow-500/30 bg-zinc-900" : "border-zinc-800 bg-zinc-950"
                }`}
              >
                {/* Card Header */}
                <button
                  onClick={() => toggleExpand(app.id)}
                  className="w-full text-left p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${app.isPaid ? "bg-green-500" : "bg-zinc-600"}`} />
                    <div>
                      <div className="font-semibold text-white capitalize flex items-center gap-2">
                        {app.customerName?.replace(/-/g, " ")}
                        {hasMissing && (
                          <span className="text-[10px] font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 rounded px-1.5 py-0.5">
                            ⚠️ {app.missingFields.length} missing
                          </span>
                        )}
                      </div>
                      <div className="text-zinc-400 text-xs mt-0.5">
                        {date} · {fileCount} file{fileCount !== 1 ? "s" : ""} · {app.isPaid ? "Paid $99" : "Test"}
                      </div>
                    </div>
                  </div>
                  <span className="text-zinc-500 text-lg">{isOpen ? "▲" : "▼"}</span>
                </button>

                {/* Expanded Content */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-zinc-800 pt-4 space-y-4">
                    {/* Contact info */}
                    <div className="grid grid-cols-1 gap-1 text-sm">
                      {app.customerEmail && (
                        <a href={`mailto:${app.customerEmail}`} className="text-blue-400">
                          ✉️ {app.customerEmail}
                        </a>
                      )}
                      {app.customerPhone && (
                        <a href={`tel:${app.customerPhone}`} className="text-blue-400">
                          📞 {app.customerPhone}
                        </a>
                      )}
                      {app.address && (
                        <div className="text-zinc-400">
                          📍 {app.address}, {app.city}, {app.state} {app.zip}
                        </div>
                      )}
                      {app.dob && (
                        <div className="text-zinc-400">🎂 DOB: {app.dob}</div>
                      )}
                    </div>

                    {/* Missing fields warning */}
                    {hasMissing && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2.5">
                        <div className="text-yellow-400 text-xs font-semibold uppercase tracking-wide mb-1.5">⚠️ Missing — follow up before sending to lender</div>
                        <ul className="space-y-0.5">
                          {app.missingFields.map((f) => (
                            <li key={f} className="text-yellow-300 text-xs">• {f}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Edit Application Fields */}
                    <div>
                      <button
                        onClick={() => toggleEdit(app.id)}
                        className="text-xs text-zinc-400 border border-zinc-700 rounded-lg px-3 py-1.5 hover:border-zinc-500 mb-3"
                      >
                        {isEditing ? "▲ Hide Editor" : "✏️ Edit Application Fields"}
                      </button>

                      {isEditing && (
                        <div className="bg-zinc-950 border border-zinc-700 rounded-xl p-4 space-y-4">
                          {/* Primary Applicant */}
                          <div>
                            <div className="text-xs text-zinc-400 uppercase tracking-wide font-semibold mb-2">
                              Primary — {app.firstName} {app.lastName}
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {EDITABLE_FIELDS.map(({ field, label, placeholder }) => (
                                <div key={field} className="flex flex-col gap-1">
                                  <label className="text-xs text-zinc-500">{label}</label>
                                  <input
                                    type="text"
                                    value={patches[app.id]?.[field] ?? ""}
                                    onChange={(e) => setPatch(app.id, field, e.target.value)}
                                    placeholder={placeholder || `Override ${label}`}
                                    className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Co-Applicant */}
                          <div>
                            <div className="text-xs text-zinc-400 uppercase tracking-wide font-semibold mb-2">
                              Co-Applicant
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {EDITABLE_FIELDS.map(({ field, label, placeholder }) => (
                                <div key={field} className="flex flex-col gap-1">
                                  <label className="text-xs text-zinc-500">{label}</label>
                                  <input
                                    type="text"
                                    value={coPatches[app.id]?.[field] ?? ""}
                                    onChange={(e) => setCoPatch(app.id, field, e.target.value)}
                                    placeholder={placeholder || `Override ${label}`}
                                    className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          <p className="text-zinc-600 text-xs">Leave blank to keep original values. Changes save when you regenerate the PDF.</p>
                        </div>
                      )}
                    </div>

                    {/* Files */}
                    <div className="space-y-2">
                      <div className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">Documents</div>
                      <div className="grid grid-cols-1 gap-2">
                        {FILE_LABELS.map(({ key, label, icon, isPdf }) => {
                          const url = app.files[key];
                          if (!url) return null;
                          const storagePath = url.split("/Applications/")[1] || "";
                          const downloadUrl = `/api/admin/download?pw=${encodeURIComponent(savedPassword)}&path=${encodeURIComponent(storagePath)}`;
                          return (
                            <div key={key} className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2.5 text-sm">
                              <span>{icon}</span>
                              <span className="text-white flex-1">{label}</span>
                              {isPdf ? (
                                <a
                                  href={downloadUrl}
                                  className="text-yellow-400 hover:text-yellow-300 text-xs font-medium px-2 py-1 border border-yellow-500/30 rounded"
                                >
                                  ↓ Download
                                </a>
                              ) : (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-zinc-400 hover:text-white text-xs"
                                >
                                  ↗ View
                                </a>
                              )}
                            </div>
                          );
                        })}
                        {fileCount === 0 && (
                          <div className="text-zinc-600 text-sm italic">No files uploaded</div>
                        )}
                      </div>
                    </div>

                    {/* Regenerate PDF */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => regeneratePdf(app.id)}
                        disabled={regenerating.has(app.id)}
                        className="text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white rounded-lg px-3 py-2 transition-colors disabled:opacity-50"
                      >
                        {regenerating.has(app.id) ? "Regenerating..." : "↻ Regenerate App PDF"}
                      </button>
                      {regenStatus[app.id] === "done" && (
                        <span className="text-green-400 text-xs">✓ PDF updated</span>
                      )}
                      {regenStatus[app.id] && regenStatus[app.id] !== "done" && (
                        <span className="text-red-400 text-xs">{regenStatus[app.id]}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
