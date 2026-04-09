import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import {
  LayoutDashboard, Users, Settings as SettingsIcon, LogOut,
  Trello, Megaphone, BarChart3, CheckSquare, ChevronRight,
  Menu, X, Video
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Leads from './pages/Leads';
import Settings from './pages/Settings';
import LeadDetails from './pages/LeadDetails';
import UserManagement from './pages/UserManagement';
import LeadStageSettings from './pages/LeadStageSettings';
import CustomFieldSettings from './pages/CustomFieldSettings';
import WorkflowSettings from './pages/WorkflowSettings';
import Pipeline from './pages/Pipeline';
import ImportLeads from './pages/ImportLeads';
import Integrations from './pages/Integrations';
import Campaigns from './pages/Campaigns';
import Reports from './pages/Reports';
import InternalTasks from './pages/InternalTasks';
import Meetings     from './pages/Meetings';
import { Toaster } from 'react-hot-toast';
import NotificationManager from './components/NotificationManager';
import TopHeader from './components/TopHeader';

/* ─── Sidebar nav item ─────────────────────────────────── */
const SidebarLink = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const isActive =
    location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className="sidebar-nav-link"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        borderRadius: '12px',
        marginBottom: '2px',
        textDecoration: 'none',
        position: 'relative',
        transition: 'all 0.2s ease',
        background: isActive
          ? 'rgba(255,255,255,0.10)'
          : 'transparent',
        color: isActive ? '#ffffff' : 'rgba(255,255,255,0.5)',
        border: isActive
          ? '1px solid rgba(255,255,255,0.14)'
          : '1px solid transparent',
      }}
    >
      {/* Active glow pill */}
      {isActive && (
        <span style={{
          position: 'absolute',
          left: 0,
          top: '18%',
          height: '64%',
          width: '3px',
          borderRadius: '0 3px 3px 0',
          background: 'linear-gradient(180deg,#fb7185,#f43f5e)',
          boxShadow: '0 0 8px rgba(244,63,94,0.7)',
        }} />
      )}

      {/* Icon box */}
      <span style={{
        width: '34px',
        height: '34px',
        flexShrink: 0,
        borderRadius: '9px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isActive
          ? 'linear-gradient(135deg,#be123c,#9f1239)'
          : 'rgba(255,255,255,0.06)',
        boxShadow: isActive ? '0 4px 10px rgba(159,18,57,0.5)' : 'none',
        transition: 'all 0.2s ease',
      }}>
        <Icon size={16} color={isActive ? '#fff' : 'rgba(255,255,255,0.55)'} strokeWidth={isActive ? 2.2 : 1.8} />
      </span>

      <span style={{
        fontSize: '13.5px',
        fontWeight: isActive ? '600' : '400',
        letterSpacing: '0.01em',
        flex: 1,
      }}>
        {label}
      </span>

      {isActive && <ChevronRight size={13} style={{ opacity: 0.45 }} />}
    </Link>
  );
};

/* ─── Section Label ─────────────────────────────────────── */
const NavSection = ({ label }) => (
  <p style={{
    fontSize: '9.5px',
    fontWeight: '700',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.22)',
    padding: '18px 14px 6px',
  }}>
    {label}
  </p>
);

/* ─── Protected Layout ──────────────────────────────────── */
const ProtectedLayout = ({ children }) => {
  const { user, logout, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  const roleLabel =
    user.role === 'admin' ? 'Super Admin'
    : user.role === 'manager' ? 'Manager'
    : 'Sales Agent';

  const roleColor =
    user.role === 'admin' ? '#f43f5e'
    : user.role === 'manager' ? '#fb923c'
    : '#34d399';

  return (
    <div className="app-container">
      <Toaster position="top-right" />
      <NotificationManager />

      {/* ── Mobile Header ───────────────────────────────────── */}
      <div
        className="mobile-header"
        style={{
          display: 'none',
          padding: '12px 18px',
          background: '#150810',
          borderBottom: '1px solid rgba(159,18,57,0.3)',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <img src="/img/Natya_Logo.png" alt="Natya" style={{ height: '54px', objectFit: 'contain' }} />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            padding: '7px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* ── Fixed Sidebar ───────────────────────────────────── */}
      <aside
        className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}
        style={{
          width: '256px',
          height: '100vh',          /* ← always full height */
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',       /* ← never scrolls as a whole */
          background: 'linear-gradient(180deg, #18080f 0%, #1f0c14 55%, #2a0e1a 100%)',
          borderRight: '1px solid rgba(159,18,57,0.22)',
          position: 'relative',
          zIndex: 40,
        }}
      >
        {/* Decorative radial glow top */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-50px',
          width: '220px', height: '220px',
          background: 'radial-gradient(circle, rgba(159,18,57,0.22) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div
          className="mobile-hide"
          style={{
            padding: '24px 20px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          <img
            src="/img/Natya_Logo.png"
            alt="Natya Arts Innovation Private Limited"
            style={{ height: '90px', width: '100%', objectFit: 'contain', display: 'block' }}
          />
          <p style={{
            marginTop: '8px',
            fontSize: '9.5px',
            fontWeight: '600',
            color: 'rgba(255,255,255,0.28)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}>
            CRM Platform
          </p>
        </div>

        {/* Scrollable nav zone */}
        <nav
          style={{
            flex: 1,
            overflowY: 'auto',               /* ← only nav scrolls */
            padding: '8px 10px',
            scrollbarWidth: 'none',
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <NavSection label="Navigation" />
          <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" />

          {user?.permissions?.leads?.view !== false && (
            <SidebarLink to="/leads" icon={Users} label="Table View" />
          )}
          {user?.permissions?.pipeline?.view !== false && (
            <SidebarLink to="/pipeline" icon={Trello} label="Sales Pipeline" />
          )}
          {user?.permissions?.reports?.view !== false && (
            <SidebarLink to="/reports" icon={BarChart3} label="Analytics" />
          )}

          <NavSection label="Growth" />
          {user?.permissions?.campaigns?.view !== false && (
            <SidebarLink to="/campaigns" icon={Megaphone} label="Campaigns" />
          )}
          {user?.permissions?.team_tasks?.view !== false && (
            <SidebarLink to="/tasks" icon={CheckSquare} label="Team Tasks" />
          )}
          {user?.permissions?.meetings?.view !== false && (
            <SidebarLink to="/meetings" icon={Video} label="Meetings" />
          )}

          {(user?.role === 'admin' || user?.permissions?.users?.view || user?.permissions?.custom_fields?.view || user?.permissions?.workflows?.view || user?.permissions?.integrations?.view) && (
            <>
              <NavSection label="Admin" />
              <SidebarLink to="/settings" icon={SettingsIcon} label="Settings" />
            </>
          )}
        </nav>

        {/* User card — always at the bottom, never scrolled away */}
        <div
          style={{
            flexShrink: 0,
            margin: '0 10px 12px',
            padding: '12px 14px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Avatar */}
            <div style={{
              width: '38px',
              height: '38px',
              flexShrink: 0,
              borderRadius: '10px',
              background: 'linear-gradient(135deg,#9f1239,#be123c)',
              boxShadow: '0 3px 10px rgba(159,18,57,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              fontWeight: '700',
              color: '#fff',
            }}>
              {user.username?.[0]?.toUpperCase() || 'U'}
            </div>

            {/* Name + role */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '12.5px',
                fontWeight: '700',
                color: '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {user.username}
              </p>
              <span style={{
                display: 'inline-block',
                marginTop: '2px',
                fontSize: '9.5px',
                fontWeight: '700',
                color: roleColor,
                background: `${roleColor}1a`,
                border: `1px solid ${roleColor}35`,
                padding: '1px 6px',
                borderRadius: '20px',
              }}>
                {roleLabel}
              </span>
            </div>

            {/* Logout button */}
            <button
              onClick={logout}
              title="Logout"
              style={{
                width: '32px',
                height: '32px',
                flexShrink: 0,
                borderRadius: '9px',
                background: 'rgba(244,63,94,0.08)',
                border: '1px solid rgba(244,63,94,0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f43f5e',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(244,63,94,0.2)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(244,63,94,0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(244,63,94,0.08)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Right column: header + main ───────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <TopHeader />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--bg-primary)',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};

/* ─── Routes ────────────────────────────────────────────── */
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/leads" element={<ProtectedLayout><Leads /></ProtectedLayout>} />
      <Route path="/leads/import" element={<ProtectedLayout><ImportLeads /></ProtectedLayout>} />
      <Route path="/leads/:id" element={<ProtectedLayout><LeadDetails /></ProtectedLayout>} />
      <Route path="/pipeline" element={<ProtectedLayout><Pipeline /></ProtectedLayout>} />
      <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
      <Route path="/settings/stages" element={<ProtectedLayout><LeadStageSettings /></ProtectedLayout>} />
      <Route path="/settings/users" element={<ProtectedLayout><UserManagement /></ProtectedLayout>} />
      <Route path="/settings/custom-fields" element={<ProtectedLayout><CustomFieldSettings /></ProtectedLayout>} />
      <Route path="/settings/workflows" element={<ProtectedLayout><WorkflowSettings /></ProtectedLayout>} />
      <Route path="/settings/integrations" element={<ProtectedLayout><Integrations /></ProtectedLayout>} />
      <Route path="/campaigns" element={<ProtectedLayout><Campaigns /></ProtectedLayout>} />
      <Route path="/reports" element={<ProtectedLayout><Reports /></ProtectedLayout>} />
      <Route path="/tasks" element={<ProtectedLayout><InternalTasks /></ProtectedLayout>} />
      <Route path="/meetings" element={<ProtectedLayout><Meetings /></ProtectedLayout>} />
    </Routes>
  );
}

export default App;
