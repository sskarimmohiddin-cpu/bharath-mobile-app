import React, { useState } from 'react';
import { fmtDate } from '../utils/format';

const Customers = ({ jobs, jobParts }) => {
  const [search, setSearch] = useState('');
  const [selectedPhone, setSelectedPhone] = useState(null);

  // Build unique customer list keyed by phone number
  const customerMap = {};
  jobs.forEach(j => {
    if (!j.phone) return;
    if (!customerMap[j.phone]) {
      customerMap[j.phone] = {
        phone: j.phone,
        name: j.customer_name || '(No name)',
        totalSpent: 0,
        totalJobs: 0,
        lastVisit: null,
        referredBy: j.referred_by || null,
      };
    }
    const c = customerMap[j.phone];
    // keep the most recent name if it changed
    if (j.customer_name) c.name = j.customer_name;
    if (j.status === 'Delivered' || j.status === 'Partial') {
      c.totalSpent += Number(j.amount_paid || 0);
    }
    c.totalJobs += 1;
    const jDate = j.created_at ? j.created_at.split('T')[0] : null;
    if (jDate && (!c.lastVisit || jDate > c.lastVisit)) c.lastVisit = jDate;
    if (j.referred_by) c.referredBy = j.referred_by;
  });

  let customers = Object.values(customerMap);

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    customers = customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }

  // Sort by total spent, highest first
  customers.sort((a, b) => b.totalSpent - a.totalSpent);

  const selectedCustomer = selectedPhone ? customerMap[selectedPhone] : null;
  const selectedJobs = selectedPhone ? jobs.filter(j => j.phone === selectedPhone).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : [];

  if (selectedCustomer) {
    return (
      <div style={{ padding: 20 }}>
        <button onClick={() => setSelectedPhone(null)}
          style={{ background: '#e8f1fd', color: '#1a73e8', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer', marginBottom: 16 }}>
          ← Back to Customers
        </button>

        <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{selectedCustomer.name}</div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>📞 {selectedCustomer.phone}</div>
          {selectedCustomer.referredBy && (
            <div style={{ fontSize: 12, color: '#7c3aed', marginTop: 4 }}>👤 Referred by: {selectedCustomer.referredBy}</div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <div style={{ flex: 1, background: '#e8f5e9', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: '#2e7d32' }}>Total Spent</div>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#2e7d32' }}>Rs.{selectedCustomer.totalSpent}</div>
            </div>
            <div style={{ flex: 1, background: '#e8f1fd', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: '#1a73e8' }}>Total Jobs</div>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1a73e8' }}>{selectedCustomer.totalJobs}</div>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 10 }}>Repair History</div>
        {selectedJobs.map((job, i) => {
          const parts = jobParts ? jobParts.filter(p => p.job_id === job.job_id) : [];
          const partsCost = parts.reduce((s, p) => s + Number(p.total || 0), 0);
          return (
            <div key={i} style={{ background: 'white', borderRadius: 10, padding: 12, marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderLeft: '3px solid #1a73e8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 'bold', color: '#1a73e8' }}>{job.job_id}</div>
                  <div style={{ fontSize: 12, color: '#555' }}>{job.device_model}</div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{job.complaint}</div>
                  {partsCost > 0 && <div style={{ fontSize: 11, color: '#e65100', marginTop: 2 }}>Parts: Rs.{partsCost}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#999' }}>{job.created_at ? fmtDate(job.created_at.split('T')[0]) : ''}</div>
                  <div style={{
                    fontSize: 10, fontWeight: 'bold', marginTop: 4, padding: '2px 8px', borderRadius: 10, display: 'inline-block',
                    background: job.status === 'Delivered' ? '#e8f5e9' : job.status === 'Partial' ? '#fff8e1' : '#ffebee',
                    color: job.status === 'Delivered' ? '#2e7d32' : job.status === 'Partial' ? '#e65100' : '#c62828',
                  }}>{job.status}</div>
                  <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 4 }}>Rs.{job.amount_paid || 0}</div>
                </div>
              </div>
            </div>
          );
        })}
        {selectedJobs.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', padding: 30, background: 'white', borderRadius: 12 }}>No jobs found</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 }}>Customers</div>

      <input type='text' placeholder='Search by name or phone...' value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box', marginBottom: 16 }} />

      <div style={{ fontSize: 12, color: '#999', marginBottom: 10 }}>{customers.length} customers · Sorted by total spent</div>

      {customers.map((c, i) => (
        <div key={i} onClick={() => setSelectedPhone(c.phone)}
          style={{ background: 'white', borderRadius: 12, padding: 14, marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>{c.name}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>📞 {c.phone}</div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{c.totalJobs} job{c.totalJobs !== 1 ? 's' : ''} {c.lastVisit ? '· Last: ' + fmtDate(c.lastVisit) : ''}</div>
            {c.referredBy && <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 2 }}>👤 Referred by {c.referredBy}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: '#2e7d32' }}>Rs.{c.totalSpent}</div>
            <div style={{ fontSize: 10, color: '#999' }}>total spent</div>
          </div>
        </div>
      ))}

      {customers.length === 0 && (
        <div style={{ textAlign: 'center', color: '#999', padding: 30, background: 'white', borderRadius: 12 }}>No customers found</div>
      )}
    </div>
  );
};

export default Customers;
