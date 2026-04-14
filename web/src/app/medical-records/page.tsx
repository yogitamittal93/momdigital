"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CloudUpload,
  Download,
  FileText,
  ImageIcon,
  Loader2,
  Search,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteScanReport,
  downloadScanReport,
  listScanReports,
  listReportShares,
  createReportShare,
  revokeReportShare,
  uploadScanReport,
} from "@/services/scan-reports.service";
import type { ScanReport, ScanReportShare } from "@/types/scan-report.types";

const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MedicalRecordsPage() {
  const [reports, setReports] = useState<ScanReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [capturedAt, setCapturedAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [openShareFor, setOpenShareFor] = useState<string | null>(null);
  const [shares, setShares] = useState<Record<string, ScanReportShare[]>>({});
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState<"view" | "download">("view");
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "ok" | "error" }>>([]);

  const acceptedHint = useMemo(() => "PDF, PNG, JPG, WEBP up to 10MB", []);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

  const pushToast = (message: string, type: "ok" | "error" = "ok") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const data = await listScanReports();
      setReports(data);
    } catch {
      setError("Failed to load scan reports");
      pushToast("Failed to load reports", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, []);

  const onFilePicked = (file: File | null) => {
    setError(null);
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      setError("Unsupported file type. Please upload PDF, PNG, JPG, or WEBP.");
      pushToast("Unsupported file type", "error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Max size is 10MB.");
      pushToast("File exceeds 10MB", "error");
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      const optimisticId = `temp-${Date.now()}`;
      const optimisticItem: ScanReport = {
        id: optimisticId,
        originalName: selectedFile.name,
        mimeType: selectedFile.type,
        sizeBytes: selectedFile.size,
        category: category || null,
        notes: notes || null,
        capturedAt: capturedAt || null,
        createdAt: new Date().toISOString(),
      };
      setReports((prev) => [optimisticItem, ...prev]);

      const created = await uploadScanReport(
        {
          file: selectedFile,
          category: category || undefined,
          notes: notes || undefined,
          capturedAt: capturedAt || undefined,
        },
        setUploadProgress,
      );
      setReports((prev) => [created, ...prev.filter((r) => r.id !== optimisticId)]);
      setSelectedFile(null);
      setCategory("");
      setNotes("");
      setCapturedAt("");
      pushToast("Report uploaded successfully");
    } catch {
      setReports((prev) => prev.filter((r) => !r.id.startsWith("temp-")));
      setError("Upload failed. Please try again.");
      pushToast("Upload failed", "error");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    const snapshot = reports;
    setReports((prev) => prev.filter((r) => r.id !== id));
    try {
      await deleteScanReport(id);
      pushToast("Report deleted");
    } catch {
      setReports(snapshot);
      setError("Failed to delete file");
      pushToast("Delete failed", "error");
    }
  };

  const openSharePanel = async (reportId: string) => {
    setOpenShareFor(reportId);
    if (!shares[reportId]) {
      try {
        const data = await listReportShares(reportId);
        setShares((prev) => ({ ...prev, [reportId]: data }));
      } catch {
        pushToast("Could not load shares", "error");
      }
    }
  };

  const handleCreateShare = async (reportId: string) => {
    if (!shareEmail) return;
    try {
      const created = await createReportShare(reportId, {
        targetEmail: shareEmail,
        permission: sharePermission,
      });
      setShares((prev) => ({ ...prev, [reportId]: [created, ...(prev[reportId] || [])] }));
      setShareEmail("");
      pushToast("Report shared");
    } catch {
      pushToast("Share failed", "error");
    }
  };

  const handleRevokeShare = async (reportId: string, shareId: string) => {
    try {
      await revokeReportShare(reportId, shareId);
      setShares((prev) => ({
        ...prev,
        [reportId]: (prev[reportId] || []).map((s) =>
          s.id === shareId ? { ...s, revokedAt: new Date().toISOString() } : s,
        ),
      }));
      pushToast("Share revoked");
    } catch {
      pushToast("Failed to revoke share", "error");
    }
  };

  const filteredReports = reports.filter((report) => {
    const searchHit =
      report.originalName.toLowerCase().includes(search.toLowerCase()) ||
      (report.category || "").toLowerCase().includes(search.toLowerCase());
    const categoryHit =
      categoryFilter === "all" || (report.category || "uncategorized") === categoryFilter;
    const reportDate = new Date(report.createdAt).toISOString().slice(0, 10);
    const fromHit = !dateFrom || reportDate >= dateFrom;
    const toHit = !dateTo || reportDate <= dateTo;
    return searchHit && categoryHit && fromHit && toHit;
  });

  const categories = Array.from(
    new Set(reports.map((r) => r.category || "uncategorized")),
  );

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 px-4 md:px-8 pt-8 pb-8 rounded-b-[3rem]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl mb-2">Medical Records</h1>
            <p className="text-muted-foreground">
              Upload and manage pregnancy/postpartum scan reports securely.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-4 space-y-6">
          <div className="fixed right-4 top-4 z-50 space-y-2">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={`rounded-xl px-4 py-2 text-sm shadow-lg ${
                  t.type === "ok"
                    ? "bg-primary text-primary-foreground"
                    : "bg-destructive text-destructive-foreground"
                }`}
              >
                {t.message}
              </div>
            ))}
          </div>

          <Card className="rounded-3xl border-none shadow-lg p-6">
            <div
              className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                onFilePicked(e.dataTransfer.files?.[0] ?? null);
              }}
            >
              <CloudUpload className="w-8 h-8 mx-auto mb-3 text-primary" />
              <p className="mb-2">Drag and drop your scan report here</p>
              <p className="text-sm text-muted-foreground mb-4">{acceptedHint}</p>
              <Input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(e) => onFilePicked(e.target.files?.[0] ?? null)}
              />
            </div>

            {selectedFile && (
              <div className="mt-4 rounded-2xl bg-muted/40 p-4 text-sm">
                <p className="mb-1">Selected: {selectedFile.name}</p>
                <p className="text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
            )}

            <div className="mt-4 grid md:grid-cols-2 gap-3">
              <Input
                placeholder="Category (e.g. Ultrasound, Blood Test)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <Input
                type="date"
                value={capturedAt}
                onChange={(e) => setCapturedAt(e.target.value)}
              />
            </div>
            <div className="mt-3">
              <Textarea
                placeholder="Optional notes for this report"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {uploading && (
              <div className="mt-3 text-sm text-muted-foreground">
                Uploading... {uploadProgress}%
              </div>
            )}
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

            <Button
              className="mt-4 rounded-full"
              disabled={!selectedFile || uploading}
              onClick={handleUpload}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading
                </>
              ) : (
                "Upload Report"
              )}
            </Button>
          </Card>

          <Card className="rounded-3xl border-none shadow-lg p-6">
            <h3 className="mb-4">Uploaded Reports</h3>
            <div className="grid md:grid-cols-4 gap-3 mb-4">
              <div className="md:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search filename/category"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="h-9 rounded-md border border-input bg-input-background px-3 text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Loading reports...</p>
            ) : filteredReports.length === 0 ? (
              <p className="text-muted-foreground text-sm">No reports uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-2xl border border-border p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {report.mimeType.startsWith("image/") ? (
                          <img
                            src={`${apiBase}/scan-reports/${report.id}/file`}
                            alt={report.originalName}
                            className="w-12 h-12 rounded-lg object-cover border border-border"
                          />
                        ) : report.mimeType.includes("pdf") ? (
                          <FileText className="w-5 h-5 text-primary" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-primary" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate">{report.originalName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(report.sizeBytes)}
                            {report.category ? ` • ${report.category}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full"
                          onClick={() =>
                            void downloadScanReport(report.id, report.originalName)
                          }
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full"
                          onClick={() => void openSharePanel(report.id)}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => void handleDelete(report.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {openShareFor === report.id && (
                      <div className="mt-4 rounded-xl bg-muted/30 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4>Share with doctor (scaffold)</h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            onClick={() => setOpenShareFor(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid md:grid-cols-3 gap-2 mb-3">
                          <Input
                            placeholder="doctor@email.com"
                            value={shareEmail}
                            onChange={(e) => setShareEmail(e.target.value)}
                          />
                          <select
                            className="h-9 rounded-md border border-input bg-input-background px-3 text-sm"
                            value={sharePermission}
                            onChange={(e) =>
                              setSharePermission(e.target.value as "view" | "download")
                            }
                          >
                            <option value="view">View only</option>
                            <option value="download">View + Download</option>
                          </select>
                          <Button
                            className="rounded-full"
                            onClick={() => void handleCreateShare(report.id)}
                          >
                            Share
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {(shares[report.id] || []).map((share) => (
                            <div
                              key={share.id}
                              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                            >
                              <div>
                                <p>{share.targetEmail}</p>
                                <p className="text-xs text-muted-foreground">
                                  {share.permission}
                                  {share.revokedAt ? " • revoked" : " • active"}
                                </p>
                              </div>
                              {!share.revokedAt && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full"
                                  onClick={() =>
                                    void handleRevokeShare(report.id, share.id)
                                  }
                                >
                                  Revoke
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
