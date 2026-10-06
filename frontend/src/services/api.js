import axios from "axios";
import { clearAuth } from "./auth";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

// Guard to ensure multiple concurrent 401s trigger only one redirect
let isHandlingSessionExpiry = false;

export function resetSessionExpiryGuard() {
  isHandlingSessionExpiry = false;
}

// Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// Global response interceptor for session-expiry and error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    // 1. Network errors or server down: do not treat as auth failure, preserve auth data
    if (!error.response) {
      return Promise.reject(error);
    }

    const { status, config } = error.response;

    // 2. HTTP 401 Unauthorized handling
    if (status === 401) {
      // Exclude login request itself from session expiry handling
      const isLoginRequest =
        config?.url &&
        (config.url.includes("/auth/login") || config.url === "/auth/login");

      if (isLoginRequest) {
        return Promise.reject(error);
      }

      // Handle authenticated session expiry (with duplicate redirect guard)
      if (!isHandlingSessionExpiry) {
        isHandlingSessionExpiry = true;

        // Clear stored token and user information
        clearAuth();

        // Preserve current page destination
        const currentPath =
          window.location.pathname + window.location.search;
        const target =
          currentPath && !currentPath.startsWith("/login") ? currentPath : "";

        if (target) {
          try {
            sessionStorage.setItem("redirect_to", target);
          } catch {
            // Ignore storage errors
          }
        }

        try {
          sessionStorage.setItem("session_expired", "true");
        } catch {
          // Ignore storage errors
        }

        // Dispatch in-app event for React Router navigation
        window.dispatchEvent(
          new CustomEvent("cms:session_expired", {
            detail: { from: target },
          })
        );

        // Fallback navigation if event is not handled by an active component
        setTimeout(() => {
          if (!window.location.pathname.startsWith("/login")) {
            window.location.href = "/login";
          }
          isHandlingSessionExpiry = false;
        }, 1500);
      }
    }

    // 3. HTTP 403 Forbidden: do NOT clear auth, do NOT redirect to login
    // Caller / ProtectedRoute handles access-denied messaging
    return Promise.reject(error);
  }
);

export default api;

