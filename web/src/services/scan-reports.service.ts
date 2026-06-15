import { api } from "@/lib/api-client";
import {
  ScanReport,
  ScanReportShare,
  UploadScanReportPayload,
} from "@/types/scan-report.types";

export async function listScanReports(): Promise<ScanReport[]> {
  const data = await api.get("/scan-reports");
  // Ensure we always return an array regardless of response shape
  return Array.isArray(data) ? data : (data as { data?: ScanReport[] })?.data ?? [];
}

export async function uploadScanReport(
  payload: UploadScanReportPayload,
  onProgress?: (percentage: number) => void,
): Promise<ScanReport> {
  const formData = new FormData();
  formData.append("file", payload.file);
  if (payload.category) formData.append("category", payload.category);
  if (payload.notes) formData.append("notes", payload.notes);
  if (payload.capturedAt) formData.append("capturedAt", payload.capturedAt);

  // Use fetch directly for multipart + progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL}/scan-reports`);
    xhr.withCredentials = true;

    if (onProgress) {
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) onProgress(Math.round((evt.loaded / evt.total) * 100));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { reject(new Error("Invalid response")); }
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(formData);
  });
}

export async function deleteScanReport(reportId: string): Promise<void> {
  await api.delete(`/scan-reports/${reportId}`);
}

export async function downloadScanReport(
  reportId: string,
  fallbackName: string,
): Promise<void> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
  const res = await fetch(`${apiBase}/scan-reports/${reportId}/file`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = fallbackName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export async function listReportShares(reportId: string): Promise<ScanReportShare[]> {
  const data = await api.get(`/scan-reports/${reportId}/shares`);
  return Array.isArray(data) ? data : (data as { data?: ScanReportShare[] })?.data ?? [];
}

export async function createReportShare(
  reportId: string,
  payload: { targetEmail: string; permission: "view" | "download"; expiresAt?: string },
): Promise<ScanReportShare> {
  return api.post(`/scan-reports/${reportId}/shares`, payload) as Promise<ScanReportShare>;
}

export async function revokeReportShare(
  reportId: string,
  shareId: string,
): Promise<void> {
  await api.delete(`/scan-reports/${reportId}/shares/${shareId}`);
}
