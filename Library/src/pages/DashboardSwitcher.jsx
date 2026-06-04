// ============================================
// DashboardSwitcher.jsx - Role-Based Router
// ============================================
import React from "react";
import AdminDashboard from "./AdminDashboard";
import LibrarianDashboard from "./LibrarianDashboard";
import UserDashboard from "./UserDashboard";

const DashboardSwitcher = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  console.log("DEBUG: Current User Role ->", user.role);

  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  if (user.role === "librarian") {
    return <LibrarianDashboard />;
  }

  return <UserDashboard />;
};

export default DashboardSwitcher;
