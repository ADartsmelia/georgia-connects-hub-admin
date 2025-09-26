// Environment configuration
export const config = {
  API_URL: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || "http://localhost:3000",
  NODE_ENV: import.meta.env.VITE_NODE_ENV || "development",
} as const;

// Helper function to get the base URL for static files (uploads, etc.)
export const getStaticFileUrl = (path: string): string => {
  const baseUrl = config.API_URL.replace("/api/v1", "");
  return `${baseUrl}${path}`;
};

// Environment variables documentation
// Add these to your .env.local file:
/*
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
VITE_NODE_ENV=development
*/

