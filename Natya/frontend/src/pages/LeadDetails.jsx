import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Mail, Phone, Building, Calendar, 
  Clock, Plus, MessageSquare, PhoneCall, MailCheck, 
  CheckCircle2, AlertCircle, MoreVertical, Database, 
  FileText, Trash2, Edit3, UserCheck, Search, Filter, MessageCircle,
  TrendingUp, Paperclip, Download, X, Sparkles, User, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

const Card = ({ children, style, padding='24px' }) => (
  <div style={{
    background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)', padding, display: 'flex', flexDirection: 'column',
    ...style
  }}>
    {children}
  </div>
);

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [activityType, setActivityType] = useState('call');
  const [showOptions, setShowOptions] = useState(false);
  const [stages, setStages] = useState([]);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [dealValue, setDealValue] = useState('');
  const [isEditingDealValue, setIsEditingDealValue] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('activity'); 
  const [uploading, setUploading] = useState(false);
  
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderNote, setReminderNote] = useState('');
  const [reminderDate, setReminderDate] = useState('');

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const [leadRes, actRes, remRes, stageRes, auditRes, docRes] = await Promise.all([
        api.get(`leads/${id}/`),
        api.get(`activities/?lead=${id}`),
        api.get(`reminders/?lead=${id}`),
        api.get('stages/'),
        api.get(`leads/${id}/audit_logs/`),
        api.get(`documents/?lead=${id}`)
      ]);
      setLead(leadRes.data);
      setAuditLogs(auditRes.data);
      setActivities(actRes.data.filter(a => a.lead == id));
      setReminders(remRes.data.filter(r => r.lead == id));
      setStages(stageRes.data);
      setDocuments(docRes.data);
      setDealValue(leadRes.data.deal_value || '0.00');
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleUpdateLeadStage = async (e) => {
    const stageId = e.target.value;
    setUpdatingStage(true);
    try {
      await api.patch(`leads/${id}/`, { stage: stageId });
      toast.success('Stage updated');
      fetchData();
    } catch (err) { toast.error('Failed to update stage'); } finally { setUpdatingStage(false); }
  };

  const handleUpdateDealValue = async () => {
    try {
      await api.patch(`leads/${id}/`, { deal_value: dealValue });
      setIsEditingDealValue(false);
      fetchData();
    } catch (err) {}
  };

  const openWhatsApp = async () => {
    const phone = lead.phone?.replace(/\D/g, '');
    if (!phone) return;
    try {
      await api.post('activities/', { lead: id, activity_type: 'call', note: `Sent a WhatsApp message to ${lead.name}.` });
      fetchData();
    } catch (err) {}
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`Hello ${lead.name}, this is ${user?.username} from INTA CRM.`)}`, '_blank');
  };

  const handleVoIPCall = async () => {
    if (!lead.phone) return;
    toast.success(`Voice connection established with ${lead.name}`, { icon: '📞' });
    try {
      await api.post('activities/', { lead: id, activity_type: 'call', note: `Direct VoIP Call initiated to ${lead.name}.` });
      fetchData();
    } catch (err) {}
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('lead', id);
    formData.append('file_name', file.name);
    formData.append('file_size', file.size);
    setUploading(true);
    try {
      await api.post('documents/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchData();
      toast.success("Document uploaded");
    } catch (err) {} finally { setUploading(false); }
  };

  const handleDeleteDocument = async (docId) => {
    if (window.confirm('Delete this document?')) {
      try {
        await api.delete(`documents/${docId}/`);
        fetchData();
      } catch (err) {}
    }
  };

  const handlePostActivity = async (e) => {
    e.preventDefault();
    if (!note) return;
    try {
      await api.post('activities/', { lead: id, activity_type: activityType, note: note });
      setNote('');
      toast.success('Activity logged');
      fetchData();
    } catch (err) {}
  };

  const handleScheduleReminder = async (e) => {
    e.preventDefault();
    if (!reminderNote || !reminderDate) return;
    try {
      await api.post('reminders/', { lead: id, note: reminderNote, scheduled_at: new Date(reminderDate).toISOString() });
      setShowReminderModal(false);
      setReminderNote('');
      setReminderDate('');
      toast.success('Task scheduled');
      fetchData();
    } catch (err) {}
  };

  const handleToggleReminderStatus = async (reminderId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
      await api.patch(`reminders/${reminderId}/`, { status: newStatus });
      fetchData();
    } catch (err) {}
  };

  const handleDeleteLead = async () => {
    if (window.confirm("Are you sure you want to delete this lead? This action cannot be undone.")) {
      try {
        await api.delete(`leads/${id}/`);
        navigate('/leads');
      } catch (err) {}
    }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>Loading details...</div>;
  if (!lead) return <div style={{ padding: '60px', textAlign: 'center', color: '#ef4444' }}>Lead not found.</div>;

  return (
    <div style={{ padding: '40px', background: '#f9fafb', minHeight: '100%', fontFamily: '"Inter", -apple-system, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <button onClick={() => navigate('/leads')} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginBottom: '12px', padding: 0 }}>
            <ArrowLeft size={14} /> Back to Leads
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>{lead.name}</h1>
            <span style={{ fontSize: '11px', fontWeight: '500', padding: '4px 10px', borderRadius: '20px', background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb' }}>
               Score: {lead.lead_score || 0}
            </span>
          </div>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 0 0' }}>
            {lead.company ? `${lead.company} · ` : ''}Added on {new Date(lead.created_at).toLocaleDateString()}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select 
             value={lead.stage} onChange={handleUpdateLeadStage} disabled={updatingStage}
             style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', fontWeight: '500', color: '#111827', cursor: 'pointer', background: '#fff' }}
          >
            {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={handleDeleteLead} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            Delete Lead
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 300px) minmax(0, 1fr) minmax(0, 320px)', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column: Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card padding="20px">
            <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 20px 0' }}>About Contact</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Mail size={16} color="#9ca3af" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 2px 0' }}>Email</p>
                  <p style={{ fontSize: '13px', color: '#111827', margin: 0, fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.email || '—'}</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Phone size={16} color="#9ca3af" />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 2px 0' }}>Phone</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: '13px', color: '#111827', margin: 0, fontWeight: '500' }}>{lead.phone || '—'}</p>
                    {lead.phone && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                         <button onClick={openWhatsApp} style={{ background: '#25D366', border: 'none', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><MessageCircle size={12} color="#fff" /></button>
                         <button onClick={handleVoIPCall} style={{ background: '#2563eb', border: 'none', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><PhoneCall size={12} color="#fff" /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Building size={16} color="#9ca3af" />
                <div>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 2px 0' }}>Company</p>
                  <p style={{ fontSize: '13px', color: '#111827', margin: 0, fontWeight: '500' }}>{lead.company || '—'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <TrendingUp size={16} color="#9ca3af" />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 2px 0' }}>Deal Value</p>
                  {isEditingDealValue ? (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                      <input type="number" value={dealValue} onChange={e=>setDealValue(e.target.value)} style={{ width: '100px', padding: '4px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #d1d5db' }} autoFocus />
                      <button onClick={handleUpdateDealValue} style={{ padding: '4px 8px', fontSize: '12px', background: '#111827', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <p style={{ fontSize: '13px', color: '#111827', margin: 0, fontWeight: '600' }}>₹{parseFloat(lead.deal_value || 0).toLocaleString('en-IN')}</p>
                      <button onClick={() => setIsEditingDealValue(true)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><Edit3 size={12} /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {lead.custom_values?.length > 0 && (
            <Card padding="20px">
              <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>Custom Fields</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {lead.custom_values.map(val => (
                  <div key={val.id}>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 2px 0' }}>{val.field_label}</p>
                    <p style={{ fontSize: '13px', color: '#111827', margin: 0, fontWeight: '500' }}>{val.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card padding="20px">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Documents</h3>
              <label style={{ cursor: 'pointer', color: '#2563eb', fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={12}/> {uploading ? '...' : 'Upload'}
                <input type="file" hidden onChange={handleFileUpload} disabled={uploading}/>
              </label>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {documents.length === 0 ? <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>No documents.</p> : (
                documents.map(doc => (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f9fafb', border: '1px solid #F3F4F6', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <FileText size={14} color="#9ca3af" />
                      <span style={{ fontSize: '12px', fontWeight: '500', color: '#374151', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{doc.file_name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <a href={doc.file} target="_blank" rel="noreferrer" style={{ color: '#6b7280' }}><Download size={14}/></a>
                      <button onClick={()=>handleDeleteDocument(doc.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={14}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Middle Column: Activity & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {lead.ai_status_summary && (
            <div style={{ background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={14} color="#2563eb" />
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Overview</span>
              </div>
              <p style={{ fontSize: '13px', color: '#1e3a8a', margin: 0, lineHeight: '1.5' }}>{lead.ai_status_summary}</p>
            </div>
          )}

          <Card padding="0">
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
              {[{ id: 'call', icon: PhoneCall, label: 'Call' }, { id: 'email', icon: MailCheck, label: 'Email' }, { id: 'meeting', icon: Calendar, label: 'Meeting' }, { id: 'task', icon: FileText, label: 'Note' }].map(type => (
                <button
                  key={type.id} type="button" onClick={() => setActivityType(type.id)}
                  style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: activityType === type.id ? '#f9fafb' : '#fff', border: 'none', borderBottom: `2px solid ${activityType === type.id ? '#111827' : 'transparent'}`, color: activityType === type.id ? '#111827' : '#6b7280', fontWeight: activityType === type.id ? '600' : '500', fontSize: '13px', cursor: 'pointer', transition: 'all 0.1s' }}
                >
                  <type.icon size={14} /> {type.label}
                </button>
              ))}
            </div>
            <form onSubmit={handlePostActivity} style={{ padding: '20px' }}>
              <textarea 
                value={note} onChange={e=>setNote(e.target.value)}
                placeholder={`Any notes regarding this ${activityType}? (Press Enter to log)`}
                style={{ width: '100%', minHeight: '100px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '16px', fontFamily: 'inherit' }}
                onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostActivity(e); } }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" style={{ padding: '8px 16px', background: '#111827', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Log Activity</button>
              </div>
            </form>
          </Card>

          <div>
            <div style={{ display: 'flex', gap: '2px', marginBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
              {['activity', 'audit', 'calls'].map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === tab ? '#111827' : 'transparent'}`, color: activeTab === tab ? '#111827' : '#6b7280', fontSize: '13px', fontWeight: '500', textTransform: 'capitalize', cursor: 'pointer' }}>{tab==='activity' ? 'Interactions' : tab}</button>
              ))}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               {activeTab === 'activity' && (
                 activities.length === 0 ? <p style={{ fontSize: '13px', color: '#9ca3af' }}>No interactions.</p> :
                 activities.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map(act => (
                   <div key={act.id} style={{ display: 'flex', gap: '16px' }}>
                     <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f3f4f6', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', marginTop: '2px' }}>
                        {act.activity_type === 'call' && <PhoneCall size={12} />}
                        {act.activity_type === 'email' && <MailCheck size={12} />}
                        {act.activity_type === 'meeting' && <Calendar size={12} />}
                        {act.activity_type === 'task' && <FileText size={12} />}
                     </div>
                     <div style={{ flex: 1 }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827', textTransform: 'capitalize' }}>{act.activity_type}</span>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(act.timestamp).toLocaleString()}</span>
                       </div>
                       <p style={{ fontSize: '13px', color: '#4b5563', margin: 0, lineHeight: '1.5' }}>{act.note}</p>
                     </div>
                   </div>
                 ))
               )}

               {activeTab === 'audit' && (
                 auditLogs.length === 0 ? <p style={{ fontSize: '13px', color: '#9ca3af' }}>No audit logs.</p> :
                 auditLogs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map(log => (
                   <div key={log.id} style={{ fontSize: '13px', padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #f3f4f6' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#111827' }}>
                        <strong>{log.action}</strong>
                        <span style={{ color: '#9ca3af', fontSize: '12px' }}>{new Date(log.timestamp).toLocaleString()}</span>
                     </div>
                     <div style={{ color: '#4b5563' }}>Old: <del>{log.old_value}</del> → New: <strong>{log.new_value}</strong></div>
                   </div>
                 ))
               )}

               {activeTab === 'calls' && (
                 (!lead.call_records || lead.call_records.length === 0) ? <p style={{ fontSize: '13px', color: '#9ca3af' }}>No call records.</p> :
                 lead.call_records.map(call => (
                   <div key={call.id} style={{ fontSize: '13px', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#111827' }}>
                        <span style={{ fontWeight: '600', color: '#059669' }}>VoIP Call ({call.duration}s)</span>
                        <span style={{ color: '#9ca3af', fontSize: '12px' }}>{new Date(call.timestamp).toLocaleString()}</span>
                      </div>
                      <p style={{ color: '#4b5563', margin: '0 0 12px 0' }}>{call.summary || 'No summary generated.'}</p>
                      {call.recording_url && <audio controls src={call.recording_url} style={{ width: '100%', height: '32px' }} />}
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>

        {/* Right Column: Reminders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card padding="20px">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>Upcoming Tasks</h3>
              <button onClick={() => setShowReminderModal(true)} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={14} /> Add
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reminders.length === 0 ? <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>No upcoming tasks.</p> : (
                reminders.sort((a,b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)).map(rem => (
                  <div key={rem.id} style={{ display: 'flex', gap: '12px', padding: '12px', background: rem.status === 'completed' ? '#f9fafb' : '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', opacity: rem.status === 'completed' ? 0.6 : 1 }}>
                    <button onClick={() => handleToggleReminderStatus(rem.id, rem.status)} style={{ width: '18px', height: '18px', borderRadius: '4px', border: `1px solid ${rem.status === 'completed' ? '#059669' : '#d1d5db'}`, background: rem.status === 'completed' ? '#059669' : '#fff', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: '2px' }}>
                       {rem.status==='completed' && <CheckCircle2 size={12} color="#fff" />}
                    </button>
                    <div style={{ flex: 1 }}>
                       <p style={{ fontSize: '13px', color: rem.status === 'completed' ? '#6b7280' : '#111827', margin: '0 0 4px 0', textDecoration: rem.status === 'completed' ? 'line-through' : 'none' }}>{rem.note}</p>
                       <span style={{ fontSize: '11px', color: '#9ca3af' }}>{new Date(rem.scheduled_at).toLocaleDateString()} at {new Date(rem.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {showReminderModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
             <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 20px 0' }}>Schedule Task</h3>
             <form onSubmit={handleScheduleReminder}>
                <div style={{ marginBottom: '16px' }}>
                   <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>What needs to be done?</label>
                   <textarea value={reminderNote} onChange={e=>setReminderNote(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }} rows={3} autoFocus />
                </div>
                <div style={{ marginBottom: '24px' }}>
                   <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>When?</label>
                   <input type="datetime-local" value={reminderDate} onChange={e=>setReminderDate(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                   <button type="button" onClick={()=>setShowReminderModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                   <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#111827', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Save Task</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetails;
