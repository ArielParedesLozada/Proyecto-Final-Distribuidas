import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import LoginPage from "./pages/auth/LoginPage";
import NotAuthorized from "./pages/NotAuthorized";
import AdminPage from "./pages/admin/AdminPage";
import SupervisorPage from "./pages/supervisor/SupervisorPage";
import DriverPage from "./pages/drivers/DriverPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersPage from "./pages/admin/UsersPage";
import AdminDrivers from "./pages/admin/AdminDrivers";
import SupervisorDashboard from "./pages/supervisor/SupervisorDashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { ToastProvider } from "./shared/ToastNotification";
import DriverDashboard from "./components/drivers/DriverDashboard";
import DriverTrips from "./components/drivers/DriverTrips";
import DriverVehicle from "./components/drivers/DriverVehicle";
import DriverProfile from "./components/drivers/DriverProfile";

import "./App.css";

// Componentes de páginas ya importados desde sus respectivos archivos

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/not-authorized" element={<NotAuthorized />} />
            
            {/* Rutas protegidas por rol ADMIN */}
            <Route path="/admin" element={<ProtectedRoute roles={["ADMIN"]} />}>
              <Route path="dashboard" element={<AdminPage />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="drivers" element={<AdminDrivers />} />
              </Route>
            </Route>

          {/* Rutas protegidas por rol SUPERVISOR */}
          <Route path="/supervisor" element={<ProtectedRoute roles={["SUPERVISOR"]} />}>
            <Route path="dashboard" element={<SupervisorPage />}>
              <Route index element={<SupervisorDashboard />} />
            </Route>
          </Route>
          
          {/* Rutas protegidas por rol CONDUCTOR */}
          <Route path="/drivers" element={<ProtectedRoute roles={["CONDUCTOR"]} />}>
            <Route path="dashboard" element={<DriverPage />}>
              <Route index element={<DriverDashboard />} />
              <Route path="trips" element={<DriverTrips trips={[]} />} />
              <Route path="vehicle" element={<DriverVehicle />} />
              <Route path="profile" element={<DriverProfile />} />
            </Route>
          </Route>
          
            {/* Redirecciones y rutas catch-all */}
            <Route path="/dashboard" element={<Navigate to="/drivers/dashboard" replace />} />
            <Route path="/" element={<Navigate to="/auth/login" replace />} />
            <Route path="*" element={<Navigate to="/auth/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;