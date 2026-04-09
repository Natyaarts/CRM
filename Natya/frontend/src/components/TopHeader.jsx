import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bell, Search, Plus, Calendar, UserPlus,
  X, ChevronRight, Clock, CheckCircle, AlertCircle,
  Sun, Moon, BarChart3, Users, Zap
} from 'lucide-react';
import api from '../api/client';

/* ─── Page title map ─────────────────────────────────── */
const pageTitles = {
  '/':               { title: 'Dashboard',       sub: 'Welcome back! Here\'s your overview.' },
  '/leads':          { title: 'Table View',       sub: 'Manage and track all your leads.' },
  '/pipeline':       { title: 'Sales Pipeline',   sub: 'Drag & drop your deals through stages.' },
  '/reports':        { title: 'Analytics',        sub: 'Performance insights and forecasting.' },
  '/campaigns':      { title: 'Campaigns',        sub: 'Manage your marketing campaigns.' },
  '/tasks':          { title: 'Team Tasks',        sub: 'Track internal team activities.' },
  '/settings':       { title: 'Settings',          sub: 'Configure platform preferences.' },
};

/* ─── Top Header ─────────────────────────────────────── */
const TopHeader = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDark, setIsDark] = useState(false);

  const notifRef = useRef(null);
  const searchRef = useRef(null);

  // Find page info
  const pageInfo = Object.entries(pageTitles)
    .reverse()
    .find(([path]) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path)));
  const { title = 'CRM', sub = '' } = pageInfo?.[1] || {};

  // Fetch reminders for notifications
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const res = await api.get('reminders/?no_pagination=true');
        const arr = Array.isArray(res.data) ? res.data : (res.data.results || []);
        const pending = arr
          .filter(r => r.status === 'pending')
          .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
          .slice(0, 8);
        setReminders(pending);
        setUnreadCount(pending.length);
      } catch (_) {}
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/leads?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = d - now;
    if (diff < 0) return 'Overdue';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `in ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `in ${hrs}h`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <header style={{
      height: '64px',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      padding: '0 28px',
      gap: '16px',
      background: '#ffffff',
      borderBottom: '1px solid #f1f5f9',
      boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 30,
    }}>

      {/* ── Page title ─────────────────────────────────────── */}
      <div style={{ flex: 1 }}>
        <h1 style={{
          fontSize: '17px',
          fontWeight: '700',
          color: '#0f172a',
          margin: 0,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}>
          {title}
        </h1>
        <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: 0, marginTop: '1px' }}>
          {sub}
        </p>
      </div>

      {/* ── Quick action: Add Lead ─────────────────────── */}
      <Link
        to="/leads"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          padding: '8px 14px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #9f1239, #be123c)',
          color: '#fff',
          fontSize: '13px',
          fontWeight: '600',
          textDecoration: 'none',
          boxShadow: '0 4px 12px rgba(159,18,57,0.33)',
          flexShrink: 0,
        }}
      >
        <UserPlus size={15} />
        <span className="mobile-hide">New Lead</span>
      </Link>

      {/* ── Search ─────────────────────────────────────── */}
      <div ref={searchRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: searchOpen ? '#f1f5f9' : 'transparent',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Search size={17} />
        </button>

        {searchOpen && (
          <div style={{
            position: 'absolute',
            top: '46px',
            right: 0,
            width: '320px',
            background: '#fff',
            borderRadius: '14px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            zIndex: 999,
          }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', gap: '10px' }}>
              <Search size={16} color="#94a3b8" />
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search leads by name, email, phone…"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '13.5px',
                  color: '#0f172a',
                  background: 'transparent',
                }}
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                  <X size={14} />
                </button>
              )}
            </form>
            <div style={{ borderTop: '1px solid #f1f5f9', padding: '10px 14px 12px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Navigate</p>
              {[
                { label: 'Dashboard', href: '/', icon: BarChart3 },
                { label: 'All Leads', href: '/leads', icon: Users },
                { label: 'Pipeline', href: '/pipeline', icon: Zap },
              ].map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  onClick={() => setSearchOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    color: '#334155',
                    textDecoration: 'none',
                    fontSize: '13px',
                  }}
                  className="header-quick-link"
                >
                  <Icon size={15} color="#9f1239" />
                  {label}
                  <ChevronRight size={12} style={{ marginLeft: 'auto', color: '#cbd5e1' }} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Reminders / Calendar shortcut ────────────────── */}
      <Link
        to="/tasks"
        title="Team Tasks & Reminders"
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'transparent',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          textDecoration: 'none',
          flexShrink: 0,
        }}
      >
        <Calendar size={17} />
      </Link>

      {/* ── Notifications ────────────────────────────────── */}
      <div ref={notifRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: notifOpen ? '#fff5f7' : 'transparent',
            border: notifOpen ? '1px solid rgba(159,18,57,0.2)' : '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: notifOpen ? '#9f1239' : '#64748b',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.2s',
          }}
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f43f5e, #9f1239)',
              color: '#fff',
              fontSize: '9px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(244,63,94,0.5)',
              border: '2px solid #fff',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div style={{
            position: 'absolute',
            top: '46px',
            right: 0,
            width: '340px',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.13)',
            border: '1px solid #f1f5f9',
            overflow: 'hidden',
            zIndex: 999,
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 18px 12px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h4 style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>Notifications</h4>
                <p style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '1px' }}>
                  {unreadCount} pending reminder{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
              {unreadCount > 0 && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '3px 9px',
                  borderRadius: '20px',
                  background: 'rgba(159,18,57,0.08)',
                  color: '#9f1239',
                  border: '1px solid rgba(159,18,57,0.15)',
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>

            {/* Reminder list */}
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {reminders.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <CheckCircle size={32} color="#10b981" style={{ marginBottom: '8px' }} />
                  <p style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>All caught up!</p>
                  <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>No pending reminders.</p>
                </div>
              ) : reminders.map(rem => {
                const isOverdue = new Date(rem.scheduled_at) < new Date();
                return (
                  <Link
                    key={rem.id}
                    to={`/leads/${rem.lead}`}
                    onClick={() => setNotifOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px 18px',
                      borderBottom: '1px solid #f8fafc',
                      textDecoration: 'none',
                      transition: 'background 0.15s',
                    }}
                    className="notif-item"
                  >
                    <div style={{
                      width: '34px',
                      height: '34px',
                      flexShrink: 0,
                      borderRadius: '9px',
                      background: isOverdue ? 'rgba(239,68,68,0.08)' : 'rgba(159,18,57,0.07)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {isOverdue
                        ? <AlertCircle size={16} color="#ef4444" />
                        : <Clock size={16} color="#9f1239" />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#0f172a',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {rem.note || 'Scheduled reminder'}
                      </p>
                      <p style={{ fontSize: '11.5px', color: isOverdue ? '#ef4444' : '#94a3b8', marginTop: '2px' }}>
                        {isOverdue ? '⚠ Overdue — ' : ''}{formatTime(rem.scheduled_at)}
                      </p>
                    </div>
                    <ChevronRight size={13} style={{ color: '#cbd5e1', flexShrink: 0, marginTop: '2px' }} />
                  </Link>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 18px', borderTop: '1px solid #f1f5f9' }}>
              <Link
                to="/"
                onClick={() => setNotifOpen(false)}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: '#9f1239',
                  textDecoration: 'none',
                  padding: '5px',
                }}
              >
                View all on Dashboard →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── User avatar (shows current user) ─────────────── */}
      <div style={{
        width: '36px',
        height: '36px',
        flexShrink: 0,
        borderRadius: '10px',
        background: 'linear-gradient(135deg, #9f1239, #be123c)',
        boxShadow: '0 3px 8px rgba(159,18,57,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '13px',
        fontWeight: '700',
        color: '#fff',
        cursor: 'pointer',
        letterSpacing: '-0.01em',
      }}
        title={user?.username}
      >
        {user?.username?.[0]?.toUpperCase() || 'U'}
      </div>
    </header>
  );
};

export default TopHeader;
