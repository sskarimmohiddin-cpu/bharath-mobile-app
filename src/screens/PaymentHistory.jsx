import React, { useState } from 'react';
import { supabase } from '../supabase';
import { fmtDateTime } from '../utils/format';

const PaymentHistory = ({ jobId, jobs, jobPayments, jobParts, purchases, fetchAll, setScreen, recalcCashChain, today }) => {
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

  const parts = (jobParts || []).filter(p => p.job_id === jobId);
  const jobPurchases = (purchases || []).filter(p => p.job_id === jobId);
  const usedPurchaseIds = new Set();

  const vendorGroups = {};
  parts.forEach(part => {
    const match = jobPurchases.find(pu =>
      !usedPurchaseIds.has(pu.id) &&
      (pu.item_name || '').trim().toLowerCase() === (part.item_name || '').trim().toLowerCase()
    );
    let vendorKey, vendorName, paymentType;
    if (match) {
      usedPurchaseIds.add(match.id);
      vendorKey = match.vendor_name;
      vendorName = match.vendor_name;
      paymentType = match.payment_type;
    } else {
      vendorKey = '__stock__';
      vendorName = 'From Stock';
      paymentType = null;
    }
    if (!vendorGroups[vendorKey]) {
      vendorGroups[vendorKey] = { vendorName, paymentType, items: [], total: 0 };
    }
    vendorGroups[vendorKey].items.push(part);
    vendorGroups[vendorKey].total += Number(part.total || 0);
  });
  const vendorGroupList = Object.values(vendorGroups);
  const totalPartsCost = parts.reduce((s, p) => s + Number(p.total || 0), 0);
  const billProfit = totalPaid - totalPartsCost;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>{job.job_id} — {job.customer_name}</div>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>{job.device_model} | Price: Rs.{job.price}</div>

      {/* CUSTOMER DETAILS */}
      <div style={{ background: 'white', borderRadius: 10, padding: 14, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '3px 0' }}>
          <span style={{ color: '#888' }}>📞 Phone</span>
          <span style={{ color: '#222', fontWeight: 600 }}>{job.phone}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '3px 0' }}>
          <span style={{ color: '#888' }}>📱 Device</span>
          <span style={{ color: '#222', fontWeight: 600 }}>{job.device_model}</span>
        </div>
        {job.staff_name && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '3px 0' }}>
            <span style={{ color: '#888' }}>👤 Booked by</span>
            <span style={{ color: '#222', fontWeight: 600 }}>{job.staff_name}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '3px 0' }}>
          <span style={{ color: '#888' }}>📅 Booked on</span>
          <span style={{ color: '#222', fontWeight: 600 }}>{fmtDateTime(job.created_at)}</span>
        </div>
        {job.delivery_date && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '3px 0' }}>
            <span style={{ color: '#888' }}>🚚 Delivery</span>
            <span style={{ color: '#222', fontWeight: 600 }}>{job.delivery_date}</span>
          </div>
        )}
        {job.complaint && (
          <div style={{ fontSize: 12.5, color: '#444', marginTop: 6, paddingTop: 6, borderTop: '1px dashed #eee' }}>
            Complaint: {job.complaint}
          </div>
        )}
      </div>

      <div style={{ background: '#e8f5e9', borderRadius: 10, padding: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: '#2e7d32' }}>Total Collected</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#2e7d32' }}>Rs.{totalPaid}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#c62828' }}>Balance</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#c62828' }}>Rs.{Number(job.price || 0) - totalPaid}</div>
        </div>
      </div>

      {/* BILL WISE PROFIT */}
      <div style={{ background: billProfit >= 0 ? '#e8f5e9' : '#fdecea', borderRadius: 10, padding: '12px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 'bold', color: billProfit >= 0 ? '#2e7d32' : '#c62828' }}>📈 Bill Wise Profit</div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Rs.{totalPaid} collected − Rs.{totalPartsCost} parts cost</div>
        </div>
        <div style={{ fontSize: 17, fontWeight: 'bold', color: billProfit >= 0 ? '#2e7d32' : '#c62828' }}>Rs.{billProfit}</div>
      </div>

      {/* PARTS BY VENDOR */}
      {vendorGroupList.length > 0 && (
        <>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 10 }}>🔧 Parts Used — By Vendor</div>
          {vendorGroupList.map((group, gi) => (
            <div key={gi} style={{ background: 'white', borderRadius: 10, padding: 12, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: group.paymentType ? 2 : 8 }}>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#1a73e8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {group.vendorName}
                  {group.paymentType && (
                    <span style={{
                      fontSize: 10, fontWeight: 'bold', padding: '2px 7px', borderRadius: 6,
                      background: group.paymentType === 'Credit' ? '#fff3e0' : '#e8f5e9',
                      color: group.paymentType === 'Credit' ? '#e65100' : '#2e7d32',
                    }}>
                      {group.paymentType === 'Credit' ? 'CREDIT' : 'CASH'}
                    </span>
                  )}
                  {!group.paymentType && (
                    <span style={{ fontSize: 10, background: '#f0f0f0', color: '#666', padding: '2px 6px', borderRadius: 6 }}>existing inventory</span>
                  )}
                </div>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#1a73e8' }}>Rs.{group.total}</div>
              </div>
              {group.paymentType && (
                <div style={{ fontSize: 10.5, color: '#999', marginBottom: 8 }}>
                  {group.paymentType === 'Credit' ? 'Added to vendor\'s running balance (Credit)' : 'Paid in full at time of purchase (Cash)'}
                </div>
              )}
              {group.items.map((part, pi) => (
                <div key={pi} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#444', padding: '4px 0', borderTop: pi > 0 ? '1px dashed #eee' : 'none' }}>
                  <span style={{ color: '#333' }}>{part.item_name}</span>
                  <span style={{ color: '#888', fontSize: 11 }}>Qty {part.quantity} × Rs.{part.rate}</span>
                  <span>Rs.{part.total}</span>
                </div>
              ))}
            </div>
          ))}
          <div style={{ background: '#fff3e0', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#e65100' }}>Total Parts Cost</div>
            <div style={{ fontSize: 15, fontWeight: 'bold', color: '#e65100' }}>Rs.{totalPartsCost}</div>
          </div>
        </>
      )}

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