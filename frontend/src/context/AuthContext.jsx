// AuthContext - provides authentication state throughout the app.
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthChange } from "../services/auth";
import { syncUser as syncUserApi } from "../services/api";

const AuthContext = createContext(null);

/**
 * How long to wait for Firebase to report an auth state before giving up
 * and treating the visitor as signed out.
 *
 * Without this the provider blocks the entire app on a promise that never
 * settles when Firebase is unreachable — offline, blocked by a network, or
 * pointed at a dead project — leaving a blank page with nothing to explain
 * it. Public pages should still render in that case.
 */
const AUTH_TIMEOUT_MS = 8000;

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const resolvedRef = useRef(false);

  useEffect(() => {
    const settle = () => {
      resolvedRef.current = true;
      setLoading(false);
    };

    const timer = setTimeout(() => {
      if (resolvedRef.current) return;
      setError("Could not reach the authentication service.");
      settle();
    }, AUTH_TIMEOUT_MS);

    const unsubscribe = onAuthChange(async (user) => {
      try {
        if (user) {
          // Role is assigned by the backend; never trusted from the client.
          try {
            const syncResponse = await syncUserApi(user);
            user.role = syncResponse.role || "farmer";
          } catch {
            user.role = "farmer";
          }
        }
        setCurrentUser(user);
        setError(null);
      } catch (err) {
        setError(err.message);
        setCurrentUser(null);
      } finally {
        clearTimeout(timer);
        settle();
      }
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const value = { currentUser, loading, error, isAuthenticated: !!currentUser };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="app-loading" role="status" aria-live="polite">
          <div className="app-loading__card">
            <span className="spinner spinner--lg" />
            <p>Checking your session…</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export default AuthContext;
