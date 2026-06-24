// ============================================
// MainLayout.jsx - App Shell (Dashboard Edition)
// ============================================
import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import TopNav from "./TopNav";
import Sidebar from "./layout/Sidebar";

const MainLayout = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #060B23 0%, #0F1635 40%, #151D48 100%)',
      color: '#0f172a',
    }}>
      {/* Top Navigation */}
      <TopNav />

      {/* Body: Sidebar + Page Content */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '24px',
        maxWidth: '1600px',
        margin: '0 auto',
        padding: '88px 24px 88px', /* 88px = 64px TopNav + 24px gap */
      }}>
        {/* Persistent Left Sidebar — hidden on tablet/mobile via CSS */}
        <Sidebar />

        {/* Page Content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <Outlet />
        </main>
      </div>

      {/* Fixed Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default MainLayout;
