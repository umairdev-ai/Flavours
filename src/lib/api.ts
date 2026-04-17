// Update this one line if the backend URL changes.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
// export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://flavours-8wq5.onrender.com/api";
export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL.replace(/\/$/, "")}${normalizedPath}`;
}
