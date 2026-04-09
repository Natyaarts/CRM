import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import {
  Video, Plus, ChevronLeft, ChevronRight, Calendar, Clock,
  User, ExternalLink, Trash2, Edit2, Check, X, Search,
  CheckCircle, XCircle, Users, FileText, Copy, RefreshCw,
  MoreVertical, Download
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── helpers ────────────────────────────────────────────── */
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const DAYS   = ['S','M','T','W','T','F','S'];

const STATUS_META = {
  scheduled: { label:'Scheduled', color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe' },
  completed: { label:'Completed', color:'#059669', bg:'#ecfdf5', border:'#a7f3d0' },
  cancelled: { label:'Cancelled', color:'#4b5563', bg:'#f3f4f6', border:'#d1d5db' },
  no_show:   { label:'No Show',   color:'#d97706', bg:'#fffbeb', border:'#fde68a' },
};

const fmt12 = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
};
const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
};

const localToISO = (val) => val ? new Date(val).toISOString() : '';
const isoToLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const BLANK_FORM = {
  title: '', description: '', lead: '', attendees_email: '',
  scheduled_at: '', duration_minutes: 30, notes: '', status: 'scheduled',
};

/* ─── Minimal Mini Calendar ──────────────────────────────── */
const MiniCalendar = ({ year, month, meetings, onDayClick, selectedDay }) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const meetingDays = new Set(
    meetings.map(m => {
      const d = new Date(m.scheduled_at);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date();
  const isToday = (d) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  return (
    <div style={{ userSelect:'none' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:'8px' }}>
        {DAYS.map((d, i) => (
          <div key={`${d}-${i}`} style={{ textAlign:'center', fontSize:'11px', fontWeight:'500', color:'#9ca3af', padding:'4px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px' }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const hasMeeting = meetingDays.has(`${year}-${month}-${day}`);
          const active = selectedDay === day;
          const todayCell = isToday(day);
          
          return (
            <button
              key={day} onClick={() => onDayClick(day)}
              style={{
                aspectRatio: '1', borderRadius: '6px', border: 'none',
                fontSize: '13px', fontWeight: active ? '600' : '400',
                cursor: 'pointer', position: 'relative',
                background: active ? '#111827' : todayCell ? '#f3f4f6' : 'transparent',
                color: active ? '#fff' : todayCell ? '#111827' : '#4b5563',
                transition: 'all 0.1s', display:'flex', alignItems:'center', justifyContent:'center'
              }}
              onMouseEnter={e => { if(!active) e.currentTarget.style.background = '#f9fafb'; }}
              onMouseLeave={e => { if(!active) e.currentTarget.style.background = todayCell ? '#f3f4f6' : 'transparent'; }}
            >
              {day}
              {hasMeeting && !active && (
                <span style={{ position:'absolute', bottom:'4px', width:'3px', height:'3px', borderRadius:'50%', background:'#9ca3af' }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Minimal Meeting Card ───────────────────────────────── */
const MeetingCard = ({ meeting, onEdit, onDelete, onStatus }) => {
  const meta = STATUS_META[meeting.status] || STATUS_META.scheduled;
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(meeting.google_meet_link);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied');
  };

  return (
    <div style={{
      background:'#fff', borderRadius:'8px', border:'1px solid #e5e7eb',
      padding:'20px', display:'flex', flexDirection:'column', gap:'16px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
            <h3 style={{ fontSize:'15px', fontWeight:'600', color:'#111827', margin:0 }}>{meeting.title}</h3>
            <span style={{ fontSize:'11px', fontWeight:'500', padding:'2px 8px', borderRadius:'12px', color:meta.color, background:meta.bg, border:`1px solid ${meta.border}` }}>
              {meta.label}
            </span>
          </div>
          <p style={{ fontSize:'13px', color:'#6b7280', margin:0, display:'flex', alignItems:'center', gap:'8px' }}>
            <Calendar size={13} /> {fmtDate(meeting.scheduled_at)} <span style={{color:'#d1d5db'}}>|</span> <Clock size={13} /> {fmt12(meeting.scheduled_at)} ({meeting.duration_minutes}m)
          </p>
        </div>
        
        <div style={{ display:'flex', gap:'6px' }}>
          {/* Status Dropdown */}
          <select value={meeting.status} onChange={e => onStatus(meeting.id, e.target.value)}
            style={{ padding:'6px 10px', borderRadius:'6px', border:'1px solid #e5e7eb', background:'#fff', fontSize:'12px', color:'#374151', cursor:'pointer' }}>
            {Object.entries(STATUS_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={() => onEdit(meeting)} style={{ width:'30px', height:'30px', borderRadius:'6px', border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280' }}>
            <Edit2 size={13} />
          </button>
          <button onClick={() => onDelete(meeting.id)} style={{ width:'30px', height:'30px', borderRadius:'6px', border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#ef4444' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div style={{ display:'flex', gap:'24px', fontSize:'13px', color:'#4b5563', flexWrap:'wrap' }}>
        {meeting.lead_name && <div style={{ display:'flex', alignItems:'center', gap:'6px' }}><User size={14} color="#9ca3af"/> {meeting.lead_name}</div>}
        {meeting.host_name && <div style={{ display:'flex', alignItems:'center', gap:'6px' }}><Users size={14} color="#9ca3af"/> {meeting.host_name}</div>}
      </div>

      <div style={{ display:'flex', gap:'12px', alignItems:'stretch' }}>
        {meeting.google_meet_link && (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', background:'#f9fafb', borderRadius:'6px', border:'1px solid #e5e7eb' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', overflow:'hidden' }}>
              <Video size={14} color="#059669" />
              <span style={{ fontSize:'13px', color:'#374151', whiteSpace:'nowrap', textOverflow:'ellipsis', overflow:'hidden' }}>{meeting.google_meet_link}</span>
            </div>
            <div style={{ display:'flex', gap:'6px' }}>
               <button onClick={copyLink} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#6b7280', display:'flex' }}>
                 {copied ? <Check size={14} /> : <Copy size={14} />}
               </button>
               <a href={meeting.google_meet_link} target="_blank" rel="noopener noreferrer" style={{ color:'#2563eb', display:'flex' }}>
                 <ExternalLink size={14} />
               </a>
            </div>
          </div>
        )}
        <a href={meeting.google_calendar_url} target="_blank" rel="noopener noreferrer"
          style={{ display:'flex', alignItems:'center', gap:'6px', padding:'0 16px', borderRadius:'6px', background:'#fff', border:'1px solid #e5e7eb', fontSize:'13px', fontWeight:'500', color:'#374151', textDecoration:'none' }}>
          <Calendar size={14} /> Add to Cal
        </a>
      </div>
    </div>
  );
};

/* ─── Minimal Modal ──────────────────────────────────────── */
const MeetingModal = ({ initial, leads, onClose, onSave }) => {
  const [form, setForm] = useState(initial
    ? { ...initial, scheduled_at: isoToLocal(initial.scheduled_at), lead: initial.lead || '' }
    : { ...BLANK_FORM, scheduled_at: isoToLocal(new Date(Date.now() + 3600000).toISOString()) }
  );
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.scheduled_at) return toast.error('Title and date/time are required');
    setSaving(true);
    try {
       const payload = { ...form, scheduled_at: localToISO(form.scheduled_at), lead: form.lead || null };
       if (initial?.id) {
         await api.put(`meetings/${initial.id}/`, payload);
         toast.success('Meeting updated');
       } else {
         await api.post('meetings/', payload);
         toast.success('Meeting scheduled & Meet link generated');
       }
       onSave();
    } catch { toast.error('Failed to save meeting'); } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ background:'#fff', borderRadius:'12px', width:'100%', maxWidth:'500px', boxShadow:'0 20px 25px -5px rgba(0,0,0,0.1)', overflow:'hidden' }}>
        
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
           <h2 style={{ fontSize:'16px', fontWeight:'600', color:'#111827', margin:0 }}>{initial?.id ? 'Edit Meeting' : 'Schedule Meeting'}</h2>
           <button onClick={onClose} style={{ border:'none', background:'transparent', color:'#9ca3af', cursor:'pointer' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'24px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            
            <div>
              <label style={{ fontSize:'13px', fontWeight:'500', color:'#374151', display:'block', marginBottom:'6px' }}>Meeting Title *</label>
              <input value={form.title} onChange={e=>set('title',e.target.value)} required placeholder="e.g. Sync with team"
                style={{ width:'100%', padding:'10px 12px', borderRadius:'6px', border:'1px solid #d1d5db', fontSize:'13px', color:'#111827', boxSizing:'border-box' }} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 120px', gap:'12px' }}>
              <div>
                <label style={{ fontSize:'13px', fontWeight:'500', color:'#374151', display:'block', marginBottom:'6px' }}>Date & Time *</label>
                <input type="datetime-local" value={form.scheduled_at} onChange={e=>set('scheduled_at',e.target.value)} required
                  style={{ width:'100%', padding:'10px 12px', borderRadius:'6px', border:'1px solid #d1d5db', fontSize:'13px', boxSizing:'border-box' }} />
              </div>
              <div>
                 <label style={{ fontSize:'13px', fontWeight:'500', color:'#374151', display:'block', marginBottom:'6px' }}>Duration</label>
                 <select value={form.duration_minutes} onChange={e=>set('duration_minutes',Number(e.target.value))}
                   style={{ width:'100%', padding:'10px 12px', borderRadius:'6px', border:'1px solid #d1d5db', fontSize:'13px', boxSizing:'border-box', background:'#fff' }}>
                    {[15,30,45,60,90,120].map(m => <option key={m} value={m}>{m} min</option>)}
                 </select>
              </div>
            </div>

            <div>
               <label style={{ fontSize:'13px', fontWeight:'500', color:'#374151', display:'block', marginBottom:'6px' }}>Link to Lead (optional)</label>
               <select value={form.lead} onChange={e=>set('lead',e.target.value)}
                 style={{ width:'100%', padding:'10px 12px', borderRadius:'6px', border:'1px solid #d1d5db', fontSize:'13px', boxSizing:'border-box', background:'#fff' }}>
                  <option value="">— No linked lead —</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
               </select>
            </div>

            <div>
               <label style={{ fontSize:'13px', fontWeight:'500', color:'#374151', display:'block', marginBottom:'6px' }}>Attendees Emails</label>
               <input value={form.attendees_email} onChange={e=>set('attendees_email',e.target.value)} placeholder="Email addresses separated by commas"
                 style={{ width:'100%', padding:'10px 12px', borderRadius:'6px', border:'1px solid #d1d5db', fontSize:'13px', boxSizing:'border-box' }} />
            </div>

            <div>
               <label style={{ fontSize:'13px', fontWeight:'500', color:'#374151', display:'block', marginBottom:'6px' }}>Agenda / Notes</label>
               <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={3} placeholder="Optional agenda notes..."
                 style={{ width:'100%', padding:'10px 12px', borderRadius:'6px', border:'1px solid #d1d5db', fontSize:'13px', boxSizing:'border-box', resize:'vertical' }} />
            </div>
            
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'24px' }}>
            <button type="button" onClick={onClose} style={{ padding:'8px 16px', borderRadius:'6px', border:'1px solid #d1d5db', background:'#fff', fontSize:'13px', fontWeight:'500', color:'#4b5563', cursor:'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding:'8px 16px', borderRadius:'6px', border:'none', background:'#111827', fontSize:'13px', fontWeight:'500', color:'#fff', cursor:'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving...' : 'Save Meeting'}</button>
          </div>
        </form>

      </div>
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────────────── */
export default function Meetings() {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [meetings, setMeetings] = useState([]);
  const [leads,    setLeads]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem,  setEditItem]  = useState(null);
  const [search,    setSearch]    = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`meetings/?month=${month + 1}&year=${year}`);
      setMeetings(Array.isArray(res.data) ? res.data : (res.data.results || []));
    } catch { toast.error('Failed to load meetings'); } finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { loadMeetings(); }, [loadMeetings]);
  useEffect(() => {
    api.get('leads/?no_pagination=true')
      .then(r => setLeads(Array.isArray(r.data) ? r.data : (r.data.results || []))).catch(()=>{});
  }, []);

  const deleteMeeting = async (id) => {
    if (!window.confirm('Delete this meeting?')) return;
    await api.delete(`meetings/${id}/`); toast.success('Deleted'); loadMeetings();
  };

  const updateStatus = async (id, status) => {
    await api.post(`meetings/${id}/update-status/`, { status }); loadMeetings();
  };

  const filtered = meetings.filter(m => {
    const d = new Date(m.scheduled_at);
    const dayMatch = selectedDay ? d.getDate() === selectedDay : true;
    const statMatch = filterStatus === 'all' || m.status === filterStatus;
    const strMatch = !search || m.title.toLowerCase().includes(search.toLowerCase());
    return dayMatch && statMatch && strMatch;
  });

  const handleExport = () => {
    const headers = 'Title,Status,Lead,Host,Email,Date,Duration,MeetLink\n';
    const csv = headers + filtered.map(m => `"${(m.title||'').replace(/"/g, '""')}","${m.status}","${(m.lead_name||'').replace(/"/g, '""')}","${(m.host_name||'').replace(/"/g, '""')}","${(m.attendees_email||'').replace(/"/g, '""')}","${new Date(m.scheduled_at).toLocaleString()}","${m.duration_minutes}","${m.google_meet_link||''}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'meetings.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <div style={{ padding:'40px', fontFamily:'"Inter", -apple-system, sans-serif', background:'#f9fafb', minHeight:'100%' }}>
      
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'32px' }}>
        <div>
          <h1 style={{ fontSize:'24px', fontWeight:'600', color:'#111827', margin:'0 0 6px 0' }}>Meetings</h1>
          <p style={{ fontSize:'14px', color:'#6b7280', margin:0 }}>Manage your schedule and Google Meet events.</p>
        </div>
        <div style={{ display:'flex', gap:'12px' }}>
          <button onClick={handleExport}
            style={{ padding:'10px 16px', borderRadius:'8px', border:'1px solid #d1d5db', background:'#fff', color:'#374151', fontSize:'13px', fontWeight:'500', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
            <Download size={16} /> Export
          </button>
          <button onClick={() => { setEditItem(null); setShowModal(true); }}
            style={{ padding:'10px 16px', borderRadius:'8px', border:'none', background:'#9f1239', color:'#fff', fontSize:'13px', fontWeight:'500', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
            <Plus size={16} /> Schedule Meeting
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:'24px', alignItems:'start' }}>
        
        {/* Left Column: Calendar & Filters */}
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
          
          <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #e5e7eb', padding:'20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
               <button onClick={() => { if(month===0) { setMonth(11); setYear(y=>y-1); } else setMonth(m=>m-1); setSelectedDay(null); }} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280' }}><ChevronLeft size={16} /></button>
               <span style={{ fontSize:'14px', fontWeight:'600', color:'#111827' }}>{MONTHS[month]} {year}</span>
               <button onClick={() => { if(month===11) { setMonth(0); setYear(y=>y+1); } else setMonth(m=>m+1); setSelectedDay(null); }} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280' }}><ChevronRight size={16} /></button>
            </div>
            <MiniCalendar year={year} month={month} meetings={meetings} selectedDay={selectedDay} onDayClick={d => setSelectedDay(p => p===d ? null : d)} />
          </div>

        </div>

        {/* Right Column: List */}
        <div>
          
          <div style={{ display:'flex', gap:'12px', marginBottom:'20px' }}>
            <div style={{ flex:1, display:'flex', alignItems:'center', gap:'8px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'8px 12px' }}>
               <Search size={16} color="#9ca3af" />
               <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search meetings..." style={{ border:'none', outline:'none', background:'transparent', fontSize:'13px', width:'100%' }} />
            </div>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ padding:'8px 12px', borderRadius:'8px', border:'1px solid #e5e7eb', background:'#fff', fontSize:'13px', color:'#374151' }}>
              <option value="all">All Status</option>
              {Object.entries(STATUS_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            {selectedDay && (
              <button onClick={()=>setSelectedDay(null)} style={{ padding:'8px 12px', borderRadius:'8px', border:'1px solid #e5e7eb', background:'#fff', fontSize:'13px', color:'#4b5563', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
                 <X size={14}/> Clear Date Filter
              </button>
            )}
          </div>

          {loading ? (
             <div style={{ textAlign:'center', padding:'40px', color:'#9ca3af' }}><RefreshCw size={20} style={{ animation:'spin 1s linear infinite' }} /></div>
          ) : filtered.length === 0 ? (
             <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #e5e7eb', padding:'40px 20px', textAlign:'center' }}>
                <Calendar size={24} color="#d1d5db" style={{ margin:'0 auto 12px auto' }} />
                <h3 style={{ fontSize:'14px', fontWeight:'500', color:'#374151', margin:'0 0 6px 0' }}>No scheduled meetings</h3>
                <p style={{ fontSize:'13px', color:'#9ca3af', margin:0 }}>Schedule a meeting to see it here.</p>
             </div>
          ) : (
             <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                <p style={{ fontSize:'13px', fontWeight:'600', color:'#4b5563', margin:'0 0 4px 0' }}>{selectedDay ? `${MONTHS[month]} ${selectedDay}, ${year}` : `All Meetings in ${MONTHS[month]}`}</p>
                {filtered.map(m => (
                  <MeetingCard key={m.id} meeting={m} onEdit={item => {setEditItem(item); setShowModal(true)}} onDelete={deleteMeeting} onStatus={updateStatus} />
                ))}
             </div>
          )}

        </div>
      </div>

      {showModal && <MeetingModal initial={editItem} leads={leads} onClose={()=>{setShowModal(false); setEditItem(null)}} onSave={()=>{setShowModal(false); setEditItem(null); loadMeetings()}} />}
      
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
