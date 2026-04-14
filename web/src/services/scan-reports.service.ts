import api from "@/lib/api";
import {
  ScanReport,
  ScanReportShare,
  UploadScanReportPayload,
} from "@/types/scan-report.types";

export async function listScanReports(): Promise<ScanReport[]> {
  const res = await api.get<ScanReport[]>("/scan-reports");
  return res.data;
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

  const res = await api.post<ScanReport>("/scan-reports", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (!evt.total || !onProgress) return;
      onProgress(Math.round((evt.loaded / evt.total) * 100));
    },
  });

  return res.data;
}

export async function deleteScanReport(reportId: string): Promise<void> {
  await api.delete(`/scan-reports/${reportId}`);
}

export async function downloadScanReport(
  reportId: string,
  fallbackName: string,
): Promise<void> {
  const res = await api.get<Blob>(`/scan-reports/${reportId}/file`, {
    responseType: "blob",
  });

  const blobUrl = window.URL.createObjectURL(res.data);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = fallbackName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export async function listReportShares(reportId: string): Promise<ScanReportShare[]> {
  const res = await api.get<ScanReportShare[]>(`/scan-reports/${reportId}/shares`);
  return res.data;
}

export async function createReportShare(
  reportId: string,
  payload: { targetEmail: string; permission: "view" | "download"; expiresAt?: string },
): Promise<ScanReportShare> {
  const res = await api.post<ScanReportShare>(
    `/scan-reports/${reportId}/shares`,
    payload,
  );
  return res.data;
}

export async function revokeReportShare(
  reportId: string,
  shareId: string,
): Promise<void> {
  await api.delete(`/scan-reports/${reportId}/shares/${shareId}`);
}
