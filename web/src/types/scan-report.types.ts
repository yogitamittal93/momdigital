export type ScanReport = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category?: string | null;
  notes?: string | null;
  capturedAt?: string | null;
  createdAt: string;
};

export type ScanReportShare = {
  id: string;
  targetEmail: string;
  permission: "view" | "download" | string;
  expiresAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
};

export type UploadScanReportPayload = {
  file: File;
  category?: string;
  notes?: string;
  capturedAt?: string;
};
