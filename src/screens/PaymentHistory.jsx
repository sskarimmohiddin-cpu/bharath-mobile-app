import React, { useState } from 'react';
import { supabase } from '../supabase';
import { fmtDateTime } from '../utils/format';

const PaymentHistory = ({ jobId, jobs, jobPayments, fetchAll, setScreen, recalcCashChain, today }) => {
  const [editItem, setEditItem] = useState(null);

  const job = jobs.find(j => j.job_id === jobId);
  const payments = jobPayments.filter(p => p.job_id === jobId).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const recomputeJob = async () => {
    const { data: freshPayments } = await supabase.from('job_payments').select('*').eq('job_id', jobId);
    const totalPaid = (freshPayments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    const price = Number(job.price || 0);
    const balance = price - totalPaid;
    let status = 'Pending';
    if (totalPaid > 0 && balance > 0) status = 'Partial';
    else if (totalPaid > 0 && balance <= 0) status = 'Delivered';
    await supabase.from('jobs').update({
      amount_paid: totalPaid,
      balance: balance < 0 ? 0 : balance,
      status: job.status === 'Returned' ? 'Returned' : status,
    }).eq('job_id', jobId);
  };

  const saveEdit = async () => {
    if (!editItem.amount || Number(editItem.amount) <= 0) { alert('Enter a valid amount'); return; }
    await supabase.from('job_payments').update({
      amount: Number(editItem.amount),
      payment_type: editItem.payment_type,
      payment_date: editItem.payment_date,
    }).eq('id', editItem.id);
    await recomputeJob();
    if (editItem.payment_date && editItem.payment_date < today) {
      await recalcCashChain(editItem.payment_date);
    } else {
      await fetchAll();
    }
    setEditItem(null);
  };

  const deletePayment = async (p) => {
    if (!window.confirm('Delete this payment entry?')) return;
    await supabase.from('job_payments').delete().eq('id', p.id);
    await recomputeJob();
    if (p.payment_date && p.payment_date < today) {
      await recalcCashChain(p.payment_date);
    } else {
      await fetchAll();
    }
  };

  if (!job) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ textAlign: 'center', color: '#999', marginTop: 40 }}>Job not found.</div>
        <button onClick={() => setScreen('jobs')}
          style={{ width: '100%', marginTop: 16, background: '#1a73e8', color: 'white', border: 'none', borderRadius: 10, padding: 12, fontSize: 15, cursor: 'pointer' }}>
          Back to Jobs
        </button>
      </div>
    );
  }

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>{job.job_id} — {job.customer_name}</div>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>{job.device_model} | Price: Rs.{job.price}</div>

      <div style={{ background: '#e8f5e9', borderRadius: 10, padding: 14, marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: '#2e7d32' }}>Total Collected</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#2e7d32' }}>Rs.{totalPaid}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#c62828' }}>Balance</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#c62828' }}>Rs.{Number(job.price || 0) - totalPaid}</div>
        </div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 10 }}>Payment History</div>

      {payments.length === 0 && (
        <div style={{ textAlign: 'center', color: '#999', padding: 20, background: 'white', borderRadius: 10 }}>No payments recorded yet.</div>
      )}

      {payments.map((p, i) => (
        <div key={i} style={{ background: 'white', borderRadius: 10, padding: 12, marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          {editItem && editItem.id === p.id ? (
            <div>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#e65100', marginBottom: 8 }}>Editing Payment</div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>Amount (Rs.)</div>
                <input type='number' value={editItem.amount}
                  onChange={e => setEditItem({ ...editItem, amount: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>Type</div>
                <input type='text' value={editItem.payment_type}
                  onChange={e => setEditItem({ ...editItem, payment_type: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>Date</div>
                <input type='date' value={editItem.payment_date || ''}
                  onChange={e => setEditItem({ ...editItem, payment_date: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveEdit}
                  style={{ flex: 1, background: '#2e7d32', color: 'white', border: 'none', borderRadius: 8, padding: 8, fontSize: 13, cursor: 'pointer' }}>
                  Save
                </button>
                <button onClick={() => setEditItem(null)}
                  style={{ flex: 1, background: '#555', color: 'white', border: 'none', borderRadius: 8, padding: 8, fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 'bold', fontSize: 14 }}>{p.payment_type}</div>
                <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>Rs.{p.amount}</div>
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>📅 {p.payment_date}</div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>Recorded: {fmtDateTime(p.created_at)}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => setEditItem({ ...p, amount: String(p.amount) })}
                  style={{ flex: 1, background: '#555', color: 'white', border: 'none', borderRadius: 8, padding: 6, fontSize: 12, cursor: 'pointer' }}>
                  Edit
                </button>
                <button onClick={() => deletePayment(p)}
                  style={{ flex: 1, background: '#c62828', color: 'white', border: 'none', borderRadius: 8, padding: 6, fontSize: 12, cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <button onClick={() => setScreen('jobs')}
        style={{ width: '100%', marginTop: 16, background: '#1a73e8', color: 'white', border: 'none', borderRadius: 10, padding: 12, fontSize: 15, cursor: 'pointer' }}>
        Back to Jobs
      </button>
    </div>
  );
};

export default PaymentHistory;