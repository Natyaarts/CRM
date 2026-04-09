import React, { useState, useEffect } from 'react';
import { 
  BarChart3, PieChart, TrendingUp, Users, 
  Target, Calendar, ArrowUpRight, ArrowDownRight,
  Filter, Download, Activity, Globe, DollarSign, Clock
} from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';

const Card = ({ children, style }) => (
  <div style={{
    background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb',
    padding: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', ...style
  }}>
    {children}
  </div>
);

const Reports = () => {
  const [pipelineStats, setPipelineStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30D');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, campRes, leadsRes] = await Promise.all([
          api.get('leads/pipeline_stats/'),
          api.get('campaigns/'),
          api.get('leads/?no_pagination=true')
        ]);
        setPipelineStats(statsRes.data);
        setCampaigns(campRes.data);
        setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : (leadsRes.data.results || []));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const handleExport = () => {
    const headers = 'Metric,Value\n';
    const lines = [
      `Forecasted Revenue,${pipelineStats?.total_forecasted_revenue||0}`,
      `Won Deals,${pipelineStats?.won_leads_count||0}`,
      `Total Leads,${leads.length}`,
      `Active Campaigns,${campaigns.filter(c => c.status === 'active').length}`,
      `Total Campaign Budget,${campaigns.reduce((a,c) => Math.round(a+parseFloat(c.budget||0)),0)}`
    ];
    pipelineStats?.stage_breakdown?.forEach(s => {
      lines.push(`Funnel Stage - ${s.stage},${s.count} Leads - Val: ${s.value}`);
    });
    
    const blob = new Blob([headers + lines.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'analytics_report.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success("Analytics Exported!");
  };

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280', fontFamily: '"Inter", sans-serif' }}>Loading advanced analytics...</div>;
  }

  const totalBudget = campaigns.reduce((a,c) => a + parseFloat(c.budget || 0), 0);
  const avgDealValue = leads.length > 0 ? (leads.reduce((a,l) => a + parseFloat(l.deal_value || 0), 0) / leads.length) : 0;

  return (
    <div style={{ padding: '40px', fontFamily: '"Inter", -apple-system, sans-serif', background: '#f9fafb', minHeight: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: '0 0 6px 0' }}>Analytics & Intelligence</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Comprehensive performance insights and sales forecasting metrics.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', background: '#e5e7eb', padding: '4px', borderRadius: '8px' }}>
            {['7D', '30D', '90D', 'YTD'].map(rng => (
              <button 
                key={rng} onClick={() => setDateRange(rng)}
                style={{ 
                  padding: '6px 12px', fontSize: '13px', fontWeight: '500', 
                  borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: dateRange === rng ? '#fff' : 'transparent',
                  color: dateRange === rng ? '#111827' : '#6b7280',
                  boxShadow: dateRange === rng ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}>
                {rng}
              </button>
            ))}
          </div>
          <button onClick={handleExport} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Top Value Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
               <TrendingUp size={20} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpRight size={14} /> +12.5%
            </span>
          </div>
          <h4 style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 6px 0', fontWeight: '500' }}>Forecasted Pipeline</h4>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>₹{Math.round(pipelineStats?.total_forecasted_revenue || 0).toLocaleString('en-IN')}</p>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
               <Users size={20} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpRight size={14} /> +4.2%
            </span>
          </div>
          <h4 style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 6px 0', fontWeight: '500' }}>Closed Won Deals</h4>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>{pipelineStats?.won_leads_count || 0}</p>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
               <DollarSign size={20} />
            </div>
          </div>
          <h4 style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 6px 0', fontWeight: '500' }}>Average Deal Size</h4>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>₹{Math.round(avgDealValue).toLocaleString('en-IN')}</p>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
               <Activity size={20} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowDownRight size={14} /> -1.8%
            </span>
          </div>
          <h4 style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 6px 0', fontWeight: '500' }}>Active MR Campaigns</h4>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>{campaigns.filter(c => c.status === 'active').length}</p>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px' }}>
        
        {/* Sales Funnel Conversion (Left Side) */}
        <Card style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart3 size={18} color="#4b5563" /> Conversion Funnel Status
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {pipelineStats?.stage_breakdown?.map((stage, idx, arr) => (
              <div key={stage.stage} style={{ position: 'relative' }}>
                <div style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '16px 24px', background: '#fff', borderRadius: '8px',
                  border: '1px solid #e5e7eb', zIndex: 2, position: 'relative',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: stage.color || '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600' }}>
                      {idx + 1}
                    </div>
                    <div>
                      <p style={{ fontWeight: '600', fontSize: '14px', color: '#111827', margin: '0 0 4px 0' }}>{stage.stage}</p>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{stage.count} Leads active</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: '600', fontSize: '15px', color: '#111827', margin: '0 0 4px 0' }}>₹{stage.value.toLocaleString('en-IN')}</p>
                    <p style={{ fontSize: '11px', color: '#059669', fontWeight: '600', margin: 0 }}>{stage.probability}% Probability</p>
                  </div>
                </div>
                {idx < arr.length - 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
                    <div style={{ width: '2px', height: '16px', background: '#e5e7eb' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Right Side Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Campaign Overview */}
          <Card style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <PieChart size={16} color="#4b5563" /> Campaign Performance
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               {campaigns.length === 0 ? (
                 <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', margin: 0 }}>No campaigns to analyze.</p>
               ) : (
                 campaigns.slice(0, 5).map(camp => {
                    const percent = Math.min(100, Math.max(5, (camp.lead_count / 50) * 100));
                    return (
                     <div key={camp.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '500', fontSize: '13px', color: '#374151', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }}>{camp.name}</span>
                          <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>{camp.lead_count} leads</span>
                        </div>
                        <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: '#2563eb', borderRadius: '3px' }} />
                        </div>
                     </div>
                   );
                 })
               )}
            </div>
            {campaigns.length > 5 && <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#6b7280' }}>+ {campaigns.length - 5} more campaigns hidden</div>}
          </Card>

          {/* Acquisition Metrics Placeholder */}
          <Card style={{ padding: '24px' }}>
             <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Globe size={16} color="#4b5563" /> Global Acquisition
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}/>
                     <span style={{ fontSize: '13px', color: '#4b5563' }}>Organic Search</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>45%</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}/>
                     <span style={{ fontSize: '13px', color: '#4b5563' }}>Direct / Referral</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>32%</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}/>
                     <span style={{ fontSize: '13px', color: '#4b5563' }}>Paid Advertising</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>18%</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }}/>
                     <span style={{ fontSize: '13px', color: '#4b5563' }}>Social Media</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>5%</span>
               </div>
            </div>
            
            <div style={{ height: '24px', width: '100%', display: 'flex', borderRadius: '4px', overflow: 'hidden', marginTop: '20px' }}>
               <div style={{ background: '#10b981', width: '45%' }}/>
               <div style={{ background: '#3b82f6', width: '32%' }}/>
               <div style={{ background: '#f59e0b', width: '18%' }}/>
               <div style={{ background: '#6366f1', width: '5%' }}/>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;
