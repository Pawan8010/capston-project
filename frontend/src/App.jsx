import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";

const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Upload = lazy(() => import("./pages/Upload"));
const Result = lazy(() => import("./pages/Result"));
const History = lazy(() => import("./pages/History"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Admin = lazy(() => import("./pages/Admin"));
const CameraPage = lazy(() => import("./pages/CameraPage"));
const BreedMap = lazy(() => import("./pages/BreedMap"));
const MyHerd = lazy(() => import("./pages/MyHerd"));
const AIClinic = lazy(() => import("./pages/AIClinic"));
const Marketplace = lazy(() => import("./pages/Marketplace"));

const PageLoader = () => (
  <div className="app-loading" role="status" aria-live="polite">
    <div className="app-loading-card">
      <span className="spinner" />
      <p>Loading workspace...</p>
    </div>
  </div>
);

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/"           element={<Home />} />
            <Route path="/login"      element={<Login />} />
            <Route path="/signup"     element={<Signup />} />
            <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/upload"     element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/result"     element={<ProtectedRoute><Result /></ProtectedRoute>} />
            <Route path="/history"    element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/camera"     element={<ProtectedRoute><CameraPage /></ProtectedRoute>} />
            <Route path="/map"        element={<ProtectedRoute><BreedMap /></ProtectedRoute>} />
            <Route path="/my-herd"    element={<ProtectedRoute><MyHerd /></ProtectedRoute>} />
            <Route path="/clinic"     element={<ProtectedRoute><AIClinic /></ProtectedRoute>} />
            <Route path="/dinic"      element={<Navigate to="/clinic" replace />} />
            <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
            <Route path="/admin"      element={<ProtectedRoute requireAdmin={true}><Admin /></ProtectedRoute>} />
            <Route path="*"           element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

const App = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <AnimatedRoutes />
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;

