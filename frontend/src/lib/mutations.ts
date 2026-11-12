"use client";

import { apiRequest, type TrackingStatus, type UserState } from "@/lib/api";

export type TrackingPatch = Partial<{
  is_bookmarked: boolean;
  tracking_status: TrackingStatus | null;
  notes: string | null;
  personal_deadline: string | null;
}>;

export const updateTracking = (id: string, patch: TrackingPatch) =>
  apiRequest<UserState>(`/api/v1/me/opportunities/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: patch,
  });

export const clearTracking = (id: string) =>
  apiRequest<void>(`/api/v1/me/opportunities/${encodeURIComponent(id)}`, { method: "DELETE" });
