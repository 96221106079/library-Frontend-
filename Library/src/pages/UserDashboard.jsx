// ============================================
// UserDashboard.jsx - Member View
// ============================================
import Activity from "./Activity";

const UserDashboard = () => {
    // Member Dashboard is primarily their Activity Center
    return (
        <div className="user-dashboard">
            <Activity />
        </div>
    );
};

export default UserDashboard;
