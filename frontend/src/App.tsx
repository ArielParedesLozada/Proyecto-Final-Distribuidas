import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import LoginPage from "./pages/auth/LoginPage";
import DriverPage from "./pages/drivers/DriverPage";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/driver/*"
              element={
                <ProtectedRoute>
                  <DriverPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/driver" replace />} />
          </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;