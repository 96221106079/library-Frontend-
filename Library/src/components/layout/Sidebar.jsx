import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.name || user.username || 'Guest User';
  const initial = userName.charAt(0).toUpperCase();

  const menuItems = [
    { name: 'Home', path: '/home', icon: '🏠' },
    { name: 'My Books', path: '/my-books', icon: '📚' },
    { name: 'Libraries', path: '/libraries', icon: '🏛️' },
    { name: 'Activity', path: '/activity', icon: '📈' },
    { name: 'Events', path: '/events', icon: '📅' },
    { name: 'Profile', path: '/profile', icon: '👤' },
  ];

  return (
    <aside className="sidebar-container">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">📚</span>
        <span className="sidebar-logo-text">Hybrid Library</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink 
            key={item.name}
            to={item.path}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-profile">
        <div className="sidebar-profile-avatar">{initial}</div>
        <div className="sidebar-profile-info">
          <span className="sidebar-profile-name">{userName}</span>
          <span className="sidebar-profile-role">{user.role === 'librarian' ? 'Librarian' : 'Reader'}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
