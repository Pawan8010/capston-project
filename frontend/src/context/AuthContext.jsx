// AuthContext - Provides authentication state throughout the app
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange } from "../services/auth";
import { syncUser as syncUserApi } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      try {
        if (user) {
          // Sync user with backend on login
          try { 
            const syncResponse = await syncUserApi(user); 
            user.role = syncResponse.role || "farmer";
          } catch (_) {
            user.role = "farmer"; // fallback
          }
        }
        setCurrentUser(user);
      } catch (err) {
        console.error("Auth sync error:", err);
        setError(err.message);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const value = { currentUser, loading, error, isAuthenticated: !!currentUser };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export default AuthContext;
