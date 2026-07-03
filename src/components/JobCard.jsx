import React from 'react';
import { fmtDateTime } from '../utils/format';

const JobCard = ({ job, jobParts, onEdit, onDelete, onMarkDelivered, onCollectBalance, onMarkReturned, onCollectAdvance }) => {
  const parts = jobParts ? jobParts.filter(p => p.job_id === job.job_id) : [];
  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 'bold', color: '#1a73e8' }}>{job.job_id}</div>
        <div style={{
          background: job.status === 'Pending' ? '#fff3e0' : job.status === 'Returned' ? '#fce4ec' : job.status === 'Partial' ? '#fff3e0' : '#e8f5e9',
          color: job.status === 'Pending' ? '#f57c00' : job.status === 'Returned' ? '#c62828' : job.status === 'Partial' ? '#e65100' : '#2e7d32',
          padding: '3px 10px', borderRadius: 20, fontSize: 12
        }}>{job.status}</div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 6 }}>
        {job.customer_name} — {job.device_model}
      </div>
      <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{job.complaint}</div>
      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>📞 {job.phone}</div>
      {job.device_password && (
        <div style={{ fontSize: 12, color: '#e65100', marginTop: 4, background: '#fff3e0', display: 'inline-block', padding: '2px 8px', borderRadius: 6 }}>
          🔒 Password: {job.device_password}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
        <div style={{ fontSize: 12, color: '#999' }}>📅 {fmtDateTime(job.created_at)}</div>
        <div style={{ fontSize: 15, fontWeight: 'bold', color: '#1a73e8' }}>Rs.{job.price}</div>
      </div>
      <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>🚚 Delivery: {job.delivery_date} {job.delivery_time ? 'at ' + job.delivery_time : ''}</div>

      {/* PARTS USED */}
      {parts.length > 0 && (
        <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '8px 12px', marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>🔧 Parts Used:</div>
          {parts.map((part, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginTop: 2 }}>
              <div>{part.item_name} × {part.quantity}</div>
              <div style={{ fontWeight: 'bold' }}>Rs.{part.total}</div>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #ddd', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 'bold', color: '#e65100' }}>
            <div>Parts Cost</div>
            <div>Rs.{parts.reduce((s, p) => s + Number(p.total), 0)}</div>
          </div>
        </div>
      )}

      {/* PAYMENT STATUS */}
      {(job.status === 'Partial') && (
        <div style={{ background: '#fff8e1', borderRadius: 8, padding: '8px 12px', marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 'bold', color: '#e65100' }}>Partial Payment</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>Paid: Rs.{job.amount_paid} | Balance: Rs.{job.balance}</div>
        </div>
      )}
      {job.status === 'Delivered' && (
        <div style={{ fontSize: 12, color: '#2e7d32', marginTop: 6, fontWeight: 'bold' }}>
          Paid: Rs.{job.amount_paid} | Balance: Rs.{job.balance}
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div style={{ marginTop: 10 }}>
        {(job.status === 'Pending' || job.status === 'Partial') && (
          <button onClick={() => onMarkDelivered(job.job_id, job.phone, job.price)}
            style={{ width: '100%', background: '#1a73e8', color: 'white', border: 'none', borderRadius: 8, padding: 10, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', marginBottom: 6 }}>
            Mark Delivered and Collect Payment
          </button>
        )}
        {job.status === 'Pending' && (
          <button onClick={() => onCollectAdvance(job.job_id, job.phone, job.price)}
            style={{ width: '100%', background: '#f57c00', color: 'white', border: 'none', borderRadius: 8, padding: 10, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', marginBottom: 6 }}>
            💰 Collect Advance
          </button>
        )}
        {job.status === 'Partial' && (
          <button onClick={() => onCollectBalance(job.job_id, job.phone, job.balance)}
            style={{ width: '100%', background: '#e65100', color: 'white', border: 'none', borderRadius: 8, padding: 10, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', marginBottom: 6 }}>
            Collect Balance (Rs.{job.balance})
          </button>
        )}
        {(job.status === 'Pending' || job.status === 'Partial') && (
          <button onClick={() => onMarkReturned(job.job_id, job.phone, job.device_model)}
            style={{ width: '100%', background: '#e65100', color: 'white', border: 'none', borderRadius: 8, padding: 8, fontSize: 13, cursor: 'pointer', marginBottom: 6 }}>
            Return to Customer (Cannot Repair)
          </button>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={() => onEdit(job)}
            style={{ flex: 1, background: '#555', color: 'white', border: 'none', borderRadius: 8, padding: 8, fontSize: 12, cursor: 'pointer' }}>
            Edit Job
          </button>
          <button onClick={() => onDelete(job.id, job.job_id)}
            style={{ flex: 1, background: '#c62828', color: 'white', border: 'none', borderRadius: 8, padding: 8, fontSize: 12, cursor: 'pointer' }}>
            Delete Job
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobCard;