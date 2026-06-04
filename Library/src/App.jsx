import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SetupPage from "./pages/SetupPage";
import LocationSetup from "./pages/LocationSetup";
import Home from "./pages/Home2";
import MyBooks from "./pages/MyBooks2";
import Libraries from "./pages/Libraries";
import Activity from "./pages/Activity";
import EventsPage from "./pages/EventsPage";
import Profile from "./pages/Profile";
import AddBook from "./pages/AddBook";
import LibrarianDashboard from "./pages/LibrarianDashboard";
import DashboardLayout from "./components/layout/DashboardLayout";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Auth Required Routes */}
        <Route element={<RoleProtectedRoute />}>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/location-setup" element={<LocationSetup />} />
        </Route>

        {/* 👤 USER ROUTES (Allowed for "user" role only) */}
        <Route element={<RoleProtectedRoute allowedRoles={["user"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/my-books" element={<MyBooks />} />
            <Route path="/libraries" element={<Libraries />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/add-book" element={<AddBook />} />
          </Route>
        </Route>

        {/* 🏛️ LIBRARIAN ROUTES (StaffHub) */}
        <Route element={<RoleProtectedRoute allowedRoles={["librarian"]} />}>
           <Route path="/librarian-dashboard" element={<LibrarianDashboard />} />
           {/* Redirect librarian from user home to their dashboard */}
           <Route path="/home" element={<Navigate to="/librarian-dashboard" replace />} />
        </Route>

        {/* Default / Fallback */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;