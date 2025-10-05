import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ToastProvider } from "./shared/ToastNotification";
import LoginPage from "./pages/auth/LoginPage";
import DriverPage from "./pages/drivers/DriverPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DriverDashboard from "./components/drivers/DriverDashboard";
import DriverTrips from "./components/drivers/DriverTrips";
import DriverVehicle from "./components/drivers/DriverVehicle";
import DriverProfile from "./components/drivers/DriverProfile";

import "./App.css";

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/driver"
              element={
                <ProtectedRoute>
                  <DriverPage />
                </ProtectedRoute>
              }
            >
              <Route index element={<DriverDashboard />} />
              <Route path="trips" element={<DriverTrips trips={[]} />} />
              <Route path="vehicle" element={<DriverVehicle />} />
              <Route path="profile" element={<DriverProfile />} />
            </Route>
            <Route path="/dashboard" element={<Navigate to="/driver" replace />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/driver" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
