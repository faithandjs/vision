import type { ViewMode } from "./types";

// Lets the Journal page send you to a specific board view (e.g. Collage).
// Lives in module memory, so it only survives client-side navigation; a full
// page load always starts on Cards, which keeps the server and client render
// identical (no flip after load).
let pending: ViewMode | null = null;

export const setPendingView = (v: ViewMode) => {
  pending = v;
};
export const peekPendingView = () => pending;
export const clearPendingView = () => {
  pending = null;
};
