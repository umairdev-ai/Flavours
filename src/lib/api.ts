const rawApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = (rawApiUrl && rawApiUrl.length > 0 ? rawApiUrl : "/api").replace(/\/$/, "");

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
