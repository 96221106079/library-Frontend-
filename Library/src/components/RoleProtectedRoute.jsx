import { Navigate, Outlet } from "react-router-dom";

const RoleProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user tries to access librarian route, send them to home
    // If librarian tries to access user route, send them to dashboard
    return <Navigate to={user.role === "librarian" ? "/librarian-dashboard" : "/home"} replace />;
  }

  return <Outlet />;
};

export default RoleProtectedRoute;