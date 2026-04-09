import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Target, TrendingUp, Clock, Plus, BarChart3, 
  CheckCircle2, ArrowRight, Zap, Target as TargetIcon,
  Activity, Sparkles
} from 'lucide-react';
import api from '../api/client';

/* --- Minimalist Professional Stat Card --- */
const StatCard = ({ icon: Icon, title, value, subtitle }) => (
  <div style={{ 
    background: '#ffffff',
    borderRadius: '12px', 
    padding: '24px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <h3 style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500', margin: 0 }}>
        {title}
      </h3>
      <div style={{ color: '#9ca3af' }}>
        <Icon size={18} strokeWidth={2} />
      </div>
    </div>
    
    <div>
      <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: 0, lineHeight: 1 }}>
        {value}
      </p>
      {subtitle && (
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', fontWeight: '400' }}>
          {subtitle}
        </p>
      )}
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [stages, setStages] = useState([]);
  const [users, setUsers] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [pipelineStats, setPipelineStats] = useState(null);
  const [briefing, setBriefing] = useState(null);
  
  const [stats, setStats] = useState({
    totalLeads: 0, 
    activePipeline: 0, 
    pipelineValue: 0, 
    winRate: '0%', 
    pendingFollowups: 0
  });

  useEffect(() => {
    // Ensure clean body background
    document.body.style.background = '#f9fafb';
    
    const fetchStats = async () => {
      try {
        const [leadsRes, followupsRes, stagesRes, usersRes, pipelineRes, briefingRes] = await Promise.allSettled([
          api.get('leads/?no_pagination=true'),
          api.get('reminders/'),
          api.get('stages/'),
          api.get('users/'),
          api.get('leads/pipeline_stats/'),
          api.get('internal-tasks/daily_briefing/')
        ]);
        
        if (pipelineRes.status === 'fulfilled') setPipelineStats(pipelineRes.value.data);
        if (briefingRes.status === 'fulfilled') setBriefing(briefingRes.value.data);

        if (leadsRes.status === 'fulfilled') {
          const data = leadsRes.value.data;
          const active = data.filter(l => !l.is_final).length;
          const won = data.filter(l => l.stage_name === 'Closed Won' || l.stage_name === 'Won').length;
          const pipelineValue = data.reduce((sum, l) => sum + parseFloat(l.deal_value || 0), 0);
          
          setLeads(data);
          setStats(prev => ({
            ...prev, totalLeads: data.length, activePipeline: active, pipelineValue: pipelineValue,
            winRate: data.length > 0 ? `${Math.round((won / data.length) * 100)}%` : '0%'
          }));
        }

        if (followupsRes.status === 'fulfilled') setReminders(followupsRes.value.data);
        if (stagesRes.status === 'fulfilled') setStages(stagesRes.value.data.sort((a,b) => a.order - b.order));
        if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data);
      } catch (err) {}
    };
    fetchStats();
    
    return () => { document.body.style.background = ''; };
  }, []);

  const handleToggleReminderStatus = async (reminderId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
      await api.patch(`reminders/${reminderId}/`, { status: newStatus });
      const res = await api.get('reminders/');
      setReminders(res.data);
    } catch (err) {}
  };

  const calculateWidth = (val, total) => {
    if (!total || total === 0) return '0%';
    return `${Math.min(100, Math.max(1, (val / total) * 100))}%`;
  };

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ padding: '40px', background: '#f9fafb', minHeight: '100%', fontFamily: '"Inter", -apple-system, sans-serif' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>
            {greeting}, {user?.username}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '6px' }}>
            Here is the overview of your sales pipeline.
          </p>
        </div>
        
        {user?.permissions?.leads?.create && (
          <button 
            onClick={() => navigate('/leads')}
            style={{
              background: '#9f1239', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px',
              fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px',
              cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#be123c'}
            onMouseLeave={e => e.currentTarget.style.background = '#9f1239'}
          >
            <Plus size={16} /> Add Lead
          </button>
        )}
      </header>

      {/* AI Briefing (Minimal text block) */}
      {briefing && (
        <div style={{ 
          marginBottom: '32px', padding: '16px 20px', borderRadius: '8px',
          background: '#f8fafc', border: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'flex-start', gap: '12px'
        }}>
          <Sparkles size={18} color="#94a3b8" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#334155', margin: 0 }}>
              {briefing.briefing.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} style={{ color: '#0f172a', fontWeight: '600' }}>{part}</strong> : part)}
            </p>
          </div>
        </div>
      )}

      {/* Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <StatCard icon={Users} title="Total Leads" value={stats.totalLeads.toLocaleString()} subtitle="Across all stages" />
        <StatCard icon={TrendingUp} title="Pipeline Value" value={`₹${(stats.pipelineValue / 1000).toLocaleString('en-IN')}k`} subtitle={`Weighted: ₹${Math.round((pipelineStats?.total_forecasted_revenue || 0) / 1000).toLocaleString('en-IN')}k`} />
        <StatCard icon={TargetIcon} title="Win Rate" value={stats.winRate} subtitle="Leads successfully closed" />
        <StatCard icon={Clock} title="Action Items" value={stats.pendingFollowups} subtitle="Pending team reminders" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px' }}>
        
        {/* Left Column Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Pipeline Forecast List (Clean look) */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>Pipeline Forecast</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {pipelineStats?.stage_breakdown?.map((stage, i) => (
                <div key={stage.stage}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <span style={{ fontWeight: '500', color: '#374151' }}>
                      {stage.stage} <span style={{ color: '#9ca3af', marginLeft: '4px' }}>— {stage.count} leads</span>
                    </span>
                    <span style={{ fontWeight: '600', color: '#111827' }}>
                      ₹{stage.value.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: calculateWidth(stage.value, stats.pipelineValue),
                        height: '100%', 
                        background: stage.color || '#9ca3af', 
                        borderRadius: '3px'
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lead Funnel */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>Conversion Funnel</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {leads.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No pipeline data found.</div>
              ) : (
                stages.slice(0, 5).map((stage) => {
                  const count = leads.filter(l => l.stage === stage.id).length;
                  const percentage = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
                  
                  return (
                    <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '120px', fontSize: '13px', color: '#4b5563', fontWeight: '500' }}>{stage.name}</div>
                      <div style={{ flex: 1, height: '24px', display: 'flex' }}>
                        <div style={{ 
                          width: `${Math.max(2, percentage)}%`, 
                          background: `${stage.color}20` || '#f3f4f6', 
                          borderLeft: `3px solid ${stage.color || '#9ca3af'}`,
                          borderRadius: '2px 4px 4px 2px',
                          display: 'flex', alignItems: 'center', paddingLeft: '8px',
                          color: '#111827', fontSize: '12px', fontWeight: '500'
                        }}>
                          {count}
                        </div>
                      </div>
                      <div style={{ width: '40px', fontSize: '12px', color: '#9ca3af', textAlign: 'right' }}>{percentage}%</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Column Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Action Items */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 20px 0' }}>
              Outstanding Tasks
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {reminders.filter(r => r.status === 'pending').length === 0 ? (
                <div style={{ color: '#9ca3af', fontSize: '13px', paddingTop: '10px' }}>No outstanding tasks.</div>
              ) : (
                reminders.filter(r => r.status === 'pending').slice(0, 5).map((rem, i, arr) => (
                  <div key={rem.id} style={{ 
                    display: 'flex', gap: '12px', padding: '12px 0', 
                    borderBottom: i !== arr.length - 1 ? '1px solid #f3f4f6' : 'none' 
                  }}>
                    <button 
                      onClick={() => handleToggleReminderStatus(rem.id, rem.status)}
                      style={{ 
                        width: '18px', height: '18px', borderRadius: '4px', border: '1px solid #d1d5db', 
                        background: 'transparent', cursor: 'pointer', marginTop: '2px', flexShrink: 0,
                        transition: 'all 0.1s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = '#ecfdf5'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = 'transparent'; }}
                    />
                    <div onClick={() => navigate(`/leads/${rem.lead}`)} style={{ cursor: 'pointer', flex: 1 }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '500', color: '#374151', margin: '0 0 2px 0' }}>{rem.note || 'Task'}</h4>
                      <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                        {new Date(rem.scheduled_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Team Performance */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 20px 0' }}>
              Agent Activity
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {users.length === 0 ? (
                 <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>No team data found.</p>
              ) : (
                users.filter(u => user?.role === 'admin' || user?.role === 'manager' || u.id === user?.id).slice(0, 4).map(u => {
                  const userLeads = leads.filter(l => l.assigned_to === u.id);
                  const wonLeads = userLeads.filter(l => l.is_final && l.stage_name?.toLowerCase()?.includes('won')).length;
                  const rate = userLeads.length > 0 ? Math.round((wonLeads / userLeads.length) * 100) : 0;
                  
                  return (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', color: '#4b5563' }}>
                          {u.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>{u.username}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{userLeads.length} leads</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#059669' }}>
                        {rate}%
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
