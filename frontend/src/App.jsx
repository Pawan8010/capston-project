import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Result from "./pages/Result";
import History from "./pages/History";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Admin from "./pages/Admin";
import CameraPage from "./pages/CameraPage";
import BreedMap from "./pages/BreedMap";
import MyHerd from "./pages/MyHerd";
import AIClinic from "./pages/AIClinic";
import Marketplace from "./pages/Marketplace";

const App = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <Routes>
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
              <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
              <Route path="/admin"      element={<ProtectedRoute requireAdmin={true}><Admin /></ProtectedRoute>} />
            </Routes>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;

