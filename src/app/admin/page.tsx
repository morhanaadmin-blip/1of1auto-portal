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

const FILE_LABELS: { key: keyof AppFiles; label: string; icon: string }[] = [
  { key: "applicationPdf", label: "Application PDF", icon: "📄" },
  { key: "agreement", label: "Signed Agreement", icon: "✍️" },
  { key: "chargeConfirmation", label: "CC Confirmation", icon: "💳" },
  { key: "primaryLicense", label: "Driver License", icon: "🪪" },
  { key: "coApplicantLicense", label: "Co-App License", icon: "🪪" },
  { key: "insurance", label: "Insurance Card", icon: "🛡️" },
  { key: "registration", label: "Registration", icon: "📋" },
  { key: "driverLicensePhoto", label: "DL Photo", icon: "📷" },
  { key: "utilityBill", label: "Utility Bill", icon: "🏠" },
  { key: "businessLicense", label: "Business License", icon: "🏢" },
];

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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
      setAuthed(true);
    } catch {
      setError("Connection error");
    }
    setLoading(false);
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
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
      {/* Header */}
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

        {/* Application Cards */}
        <div className="space-y-3">
          {displayed.map((app) => {
            const isOpen = expanded.has(app.id);
            const fileCount = Object.values(app.files).filter(Boolean).length;
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
                      <div className="font-semibold text-white capitalize">
                        {app.customerName?.replace(/-/g, " ")}
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

                    {/* Files */}
                    <div className="space-y-2">
                      <div className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">Documents</div>
                      <div className="grid grid-cols-1 gap-2">
                        {FILE_LABELS.map(({ key, label, icon }) => {
                          const url = app.files[key];
                          if (!url) return null;
                          return (
                            <a
                              key={key}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg px-3 py-2.5 text-sm transition-colors"
                            >
                              <span>{icon}</span>
                              <span className="text-white flex-1">{label}</span>
                              <span className="text-zinc-500 text-xs">↗</span>
                            </a>
                          );
                        })}
                        {fileCount === 0 && (
                          <div className="text-zinc-600 text-sm italic">No files uploaded</div>
                        )}
                      </div>
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
