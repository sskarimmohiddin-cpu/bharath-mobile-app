import React, { useState } from 'react';
import { fmtDate } from '../utils/format';

const Accounts = ({ jobs, purchases, sales, expenses, jobParts, vendors, vendorPayments, bankTransactions, openingCash }) => {
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState('daily');
  const [cashMonth, setCashMonth] = useState(new Date(new Date().getTime() + 5.5 * 60 * 60000).toISOString().slice(0, 7));

  const istOffset = 5.5 * 60 * 60000;

  const getDateStr = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(new Date(dateStr).getTime() + istOffset);
    return d.toISOString().split('T')[0];
  };

  const getMonthStr = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(new Date(dateStr).getTime() + istOffset);
    return d.toISOString().slice(0, 7);
  };

  const selectedMonth = selectedDate.slice(0, 7);

  // DAILY DATA
  const dayJobs = jobs.filter(j =>
    (j.status === 'Delivered' || j.status === 'Partial') &&
    j.delivery_date === selectedDate
  );
  const dayRepairIncome = dayJobs.reduce((s, j) => s + Number(j.amount_paid || 0), 0);
  const dayPartsCost = jobParts.filter(jp => {
    const job = jobs.find(j => j.job_id === jp.job_id);
    return job && (job.status === 'Delivered' || job.status === 'Partial') && job.delivery_date === selectedDate;
  }).reduce((s, jp) => s + Number(jp.total || 0), 0);
  const dayPendingPartsCost = jobParts.filter(jp => {
    const job = jobs.find(j => j.job_id === jp.job_id);
    return job && job.status === 'Pending' && jp.created_at && jp.created_at.startsWith(selectedDate);
  }).reduce((s, jp) => s + Number(jp.total || 0), 0);
  const daySales = sales.filter(s => getDateStr(s.created_at) === selectedDate).reduce((s, j) => s + Number(j.total || 0), 0);
  const dayExpenses = expenses.filter(e => getDateStr(e.created_at) === selectedDate).reduce((s, e) => s + Number(e.amount || 0), 0);
  const dayPurchasesCredit = purchases.filter(p => (p.purchase_date || getDateStr(p.created_at)) === selectedDate && p.payment_type === 'Credit').reduce((s, p) => s + Number(p.total || 0), 0);
  const dayPurchasesCash = purchases.filter(p => (p.purchase_date || getDateStr(p.created_at)) === selectedDate && p.payment_type === 'Cash').reduce((s, p) => s + Number(p.total || 0), 0);
  const dayNetProfit = dayRepairIncome + daySales - dayPartsCost - dayPurchasesCash;
  // MONTHLY DATA
  const monthJobs = jobs.filter(j =>
    (j.status === 'Delivered' || j.status === 'Partial') &&
    j.delivery_date && j.delivery_date.startsWith(selectedMonth)
  );
  const monthRepairIncome = monthJobs.reduce((s, j) => s + Number(j.amount_paid || 0), 0);
  const monthPartsCost = jobParts.filter(jp => {
    const job = jobs.find(j => j.job_id === jp.job_id);
    return job && job.delivery_date && job.delivery_date.startsWith(selectedMonth);
  }).reduce((s, jp) => s + Number(jp.total || 0), 0);
  const monthSales = sales.filter(s => getMonthStr(s.created_at) === selectedMonth).reduce((s, j) => s + Number(j.total || 0), 0);
  const monthExpenses = expenses.filter(e => getMonthStr(e.created_at) === selectedMonth).reduce((s, e) => s + Number(e.amount || 0), 0);
  const monthPurchasesCredit = purchases.filter(p => {
    const pd = p.purchase_date || getDateStr(p.created_at);
    return pd && pd.startsWith(selectedMonth) && p.payment_type === 'Credit';
  }).reduce((s, p) => s + Number(p.total || 0), 0);
  const monthPurchasesCash = purchases.filter(p => {
    const pd = p.purchase_date || getDateStr(p.created_at);
    return pd && pd.startsWith(selectedMonth) && p.payment_type === 'Cash';
  }).reduce((s, p) => s + Number(p.total || 0), 0);
  const monthNetProfit = monthRepairIncome + monthSales - monthPartsCost - monthPurchasesCash;

  // OUTSTANDING
  const pendingJobs = jobs.filter(j => j.status === 'Partial' && j.balance > 0);
  const totalPending = pendingJobs.reduce((s, j) => s + Number(j.balance || 0), 0);
  const totalVendorPayable = vendors.reduce((s, v) => s + Number(v.balance > 0 ? v.balance : 0), 0);

  const StatRow = ({ label, value, color, bold }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, padding: '4px 0', borderBottom: '1px solid #f5f5f5' }}>
      <div style={{ fontSize: 13, color: '#555', fontWeight: bold ? 'bold' : 'normal' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: bold ? 'bold' : 'normal', color: color || '#333' }}>Rs.{value}</div>
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 }}>Accounts</div>

      {/* VIEW TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { key: 'daily', label: 'Daily' },
          { key: 'monthly', label: 'Monthly' },
          { key: 'outstanding', label: 'Outstanding' },
          { key: 'cash', label: 'Cash' },
          { key: 'daybook', label: 'Day Book' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setView(tab.key)}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: view === tab.key ? '#1a73e8' : 'white', color: view === tab.key ? 'white' : '#555', fontWeight: 'bold', fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* DATE PICKER */}
      {(view === 'daily' || view === 'monthly') && (
        <div style={{ marginBottom: 16 }}>
          <input type='date' value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' }} />
        </div>
      )}

      {/* DAILY REPORT */}
      {view === 'daily' && (
        <div>
          <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1a73e8', marginBottom: 12 }}>
              Daily Report — {fmtDate(selectedDate)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 8 }}>INCOME</div>
            <StatRow label='Repair Income' value={dayRepairIncome} color='#2e7d32' />
            <StatRow label='Accessories Sales' value={daySales} color='#2e7d32' />
            <StatRow label='Total Income' value={dayRepairIncome + daySales} color='#2e7d32' bold />
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#888', marginTop: 12, marginBottom: 8 }}>EXPENSES</div>
            <StatRow label='Parts Cost (Delivered Jobs)' value={dayPartsCost} color='#c62828' />
            <StatRow label='Cash Purchases' value={dayPurchasesCash} color='#c62828' />
            <StatRow label='Total Expenses' value={dayPartsCost + dayPurchasesCash} color='#c62828' bold />
            {dayPendingPartsCost > 0 && (
              <div style={{ background: '#fff8e1', borderRadius: 8, padding: '8px 12px', marginTop: 8 }}>
                <div style={{ fontSize: 12, color: '#e65100', fontWeight: 'bold' }}>⏳ Parts for Pending Jobs: Rs.{dayPendingPartsCost} (not affecting profit)</div>
              </div>
            )}
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#888', marginTop: 12, marginBottom: 8 }}>OTHER</div>
            <StatRow label='Expenses' value={dayExpenses} color='#555' />
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#888', marginTop: 12, marginBottom: 8 }}>CREDIT</div>
            <StatRow label='Credit Purchases' value={dayPurchasesCredit} color='#e65100' />
            <div style={{ borderTop: '2px solid #1a73e8', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>Net Profit</div>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: dayNetProfit >= 0 ? '#2e7d32' : '#c62828' }}>Rs.{dayNetProfit}</div>
            </div>
          </div>

          {/* BILL WISE */}
          {(dayJobs.length > 0 || daySales > 0) && (
            <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 12 }}>Bill Wise Profit</div>
              {dayJobs.map((job, i) => {
                const parts = jobParts.filter(p => p.job_id === job.job_id);
                const partsCost = parts.reduce((s, p) => s + Number(p.total || 0), 0);
                const profit = Number(job.amount_paid || 0) - partsCost;
                return (
                  <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 'bold', color: '#1a73e8' }}>{job.job_id}</div>
                        <div style={{ fontSize: 12, color: '#555' }}>{job.customer_name} — {job.device_model}</div>
                        <div style={{ fontSize: 11, color: '#666' }}>{job.complaint}</div>
                        {partsCost > 0 && <div style={{ fontSize: 11, color: '#e65100' }}>Parts: Rs.{partsCost}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, color: '#555' }}>Collected: Rs.{job.amount_paid}</div>
                        <div style={{ fontSize: 14, fontWeight: 'bold', color: profit >= 0 ? '#2e7d32' : '#c62828' }}>Profit: Rs.{profit}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* ACCESSORIES SALES */}
              {sales.filter(s => getDateStr(s.created_at) === selectedDate).map((s, i) => (
                <div key={'sale-' + i} style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 'bold', color: '#1565c0' }}>Sale</div>
                      <div style={{ fontSize: 12, color: '#555' }}>{s.item_name}</div>
                      <div style={{ fontSize: 11, color: '#666' }}>Qty: {s.quantity} x Rs.{s.price}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: '#555' }}>Income: Rs.{s.total}</div>
                      <div style={{ fontSize: 14, fontWeight: 'bold', color: '#2e7d32' }}>Rs.{s.total}</div>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid #ddd' }}>
                <div style={{ fontSize: 13, fontWeight: 'bold' }}>Total Bills: {dayJobs.length} | Sales: {sales.filter(s => getDateStr(s.created_at) === selectedDate).length}</div>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2e7d32' }}>Rs.{dayRepairIncome + daySales}</div>
              </div>
            </div>
          )}

          {dayJobs.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', padding: 30, background: 'white', borderRadius: 12 }}>
              No deliveries on {fmtDate(selectedDate)}
            </div>
          )}
          {/* PENDING PARTS PORTAL */}
          {(() => {
            const pendingPartsToday = jobParts.filter(jp => {
              const job = jobs.find(j => j.job_id === jp.job_id);
              return job && job.status === 'Pending' && jp.created_at && jp.created_at.startsWith(selectedDate);
            });
            if (pendingPartsToday.length === 0) return null;
            const pendingJobs = [...new Set(pendingPartsToday.map(jp => jp.job_id))];
            return (
              <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderLeft: '4px solid #f57c00' }}>
                <div style={{ fontSize: 14, fontWeight: 'bold', color: '#f57c00', marginBottom: 4 }}>⏳ Parts Bought — Job Not Delivered</div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>These parts are purchased but customer has not collected yet</div>
                {pendingJobs.map((jobId, i) => {
                  const job = jobs.find(j => j.job_id === jobId);
                  const parts = pendingPartsToday.filter(jp => jp.job_id === jobId);
                  const partsCost = parts.reduce((s, p) => s + Number(p.total || 0), 0);
                  return (
                    <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 'bold', color: '#f57c00' }}>{jobId}</div>
                          <div style={{ fontSize: 12, color: '#555' }}>{job ? job.customer_name + ' — ' + job.device_model : ''}</div>
                          <div style={{ fontSize: 11, color: '#666' }}>{job ? job.complaint : ''}</div>
                          {parts.map((p, pi) => (
                            <div key={pi} style={{ fontSize: 11, color: '#888', marginTop: 2 }}>• {p.item_name} x{p.quantity} = Rs.{p.total}</div>
                          ))}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#f57c00' }}>Rs.{partsCost}</div>
                          <div style={{ fontSize: 10, color: '#999' }}>parts cost</div>
                          {job && <div style={{ fontSize: 11, color: '#1a73e8', marginTop: 4 }}>Bill: Rs.{job.price}</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid #ddd' }}>
                  <div style={{ fontSize: 13, fontWeight: 'bold', color: '#f57c00' }}>Total Parts in Pending Jobs</div>
                  <div style={{ fontSize: 14, fontWeight: 'bold', color: '#f57c00' }}>Rs.{pendingPartsToday.reduce((s, jp) => s + Number(jp.total || 0), 0)}</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* MONTHLY REPORT */}
      {view === 'monthly' && (
        <div>
          <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1a73e8', marginBottom: 12 }}>
              Monthly Report — {new Date(selectedDate).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
            </div>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 8 }}>INCOME</div>
            <StatRow label='Repair Income' value={monthRepairIncome} color='#2e7d32' />
            <StatRow label='Accessories Sales' value={monthSales} color='#2e7d32' />
            <StatRow label='Total Income' value={monthRepairIncome + monthSales} color='#2e7d32' bold />
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#888', marginTop: 12, marginBottom: 8 }}>EXPENSES</div>
            <StatRow label='Parts Cost' value={monthPartsCost} color='#c62828' />
            <StatRow label='Cash Purchases' value={monthPurchasesCash} color='#c62828' />
            <StatRow label='Expenses' value={monthExpenses} color='#c62828' />
            <StatRow label='Total Expenses' value={monthPartsCost + monthPurchasesCash + monthExpenses} color='#c62828' bold />
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#888', marginTop: 12, marginBottom: 8 }}>CREDIT</div>
            <StatRow label='Credit Purchases' value={monthPurchasesCredit} color='#e65100' />
            <StatRow label='Total Jobs' value={monthJobs.length + ' bills'} color='#1a73e8' />
            <div style={{ borderTop: '2px solid #1a73e8', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>Net Profit</div>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: monthNetProfit >= 0 ? '#2e7d32' : '#c62828' }}>Rs.{monthNetProfit}</div>
            </div>
          </div>

          {/* DAY WISE BREAKDOWN */}
          <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 12 }}>Day Wise Breakdown</div>
            {[...new Set(monthJobs.map(j => j.delivery_date).filter(Boolean).sort().reverse())].map((date, i) => {
              const dateJobs = monthJobs.filter(j => j.delivery_date === date);
              const dateIncome = dateJobs.reduce((s, j) => s + Number(j.amount_paid || 0), 0);
              const dateParts = jobParts.filter(jp => {
                const job = jobs.find(j => j.job_id === jp.job_id);
                return job && job.delivery_date === date;
              }).reduce((s, jp) => s + Number(jp.total || 0), 0);
              const dateProfit = dateIncome - dateParts;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}
                  onClick={() => { setSelectedDate(date); setView('daily'); }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 'bold', color: '#333' }}>{fmtDate(date)}</div>
                    <div style={{ fontSize: 11, color: '#666' }}>{dateJobs.length} bills | Income: Rs.{dateIncome}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 'bold', color: dateProfit >= 0 ? '#2e7d32' : '#c62828' }}>Rs.{dateProfit}</div>
                    <div style={{ fontSize: 10, color: '#999' }}>profit</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* OUTSTANDING */}
      {view === 'outstanding' && (
        <div>
          {/* CUSTOMER BALANCES */}
          <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>Customer Outstanding</div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>Customers who have balance pending</div>
            {pendingJobs.length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', padding: 16 }}>No pending balances! ✅</div>
            )}
            {pendingJobs.map((job, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 'bold', color: '#1a73e8' }}>{job.job_id}</div>
                    <div style={{ fontSize: 12, color: '#555' }}>{job.customer_name} — {job.device_model}</div>
                    <div style={{ fontSize: 11, color: '#666' }}>📞 {job.phone}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>Paid: Rs.{job.amount_paid} | Total: Rs.{job.price}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 'bold', color: '#c62828' }}>Rs.{job.balance}</div>
                    <div style={{ fontSize: 10, color: '#c62828' }}>pending</div>
                  </div>
                </div>
              </div>
            ))}
            {pendingJobs.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid #ddd' }}>
                <div style={{ fontSize: 13, fontWeight: 'bold' }}>Total Pending</div>
                <div style={{ fontSize: 14, fontWeight: 'bold', color: '#c62828' }}>Rs.{totalPending}</div>
              </div>
            )}
          </div>

          {/* VENDOR PAYABLE */}
          <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>Vendor Payable</div>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>Amount you owe to vendors</div>
            {vendors.filter(v => v.balance > 0).map((v, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 'bold', color: '#333' }}>{v.name}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>📞 {v.phone}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 'bold', color: '#c62828' }}>Rs.{v.balance}</div>
              </div>
            ))}
            {vendors.filter(v => v.balance > 0).length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', padding: 16 }}>No vendor payables! ✅</div>
            )}
            {totalVendorPayable > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid #ddd' }}>
                <div style={{ fontSize: 13, fontWeight: 'bold' }}>Total Payable</div>
                <div style={{ fontSize: 14, fontWeight: 'bold', color: '#c62828' }}>Rs.{totalVendorPayable}</div>
              </div>
            )}
          </div>
        </div>
      )}
    {/* CASH LEDGER */}
    {view === 'cash' && (() => {
      const istOff = 5.5 * 60 * 60000;
      const toIST = (ts) => ts ? new Date(new Date(ts).getTime() + istOff).toISOString().split('T')[0] : null;
      const toISTTime = (ts) => ts ? new Date(new Date(ts).getTime() + istOff).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
      
      

      // Build all cash entries
      const allEntries = [
        // Repairs collected
        ...jobs.filter(j => (j.status === 'Delivered' || j.status === 'Partial') && j.delivery_date).map(j => ({
          date: j.delivery_date,
          time: toISTTime(j.created_at),
          description: 'Repair — ' + (j.customer_name || '') + ' | ' + (j.device_model || '') + ' | ' + j.job_id,
          in: Number(j.amount_paid || 0),
          out: 0,
          type: 'Repair',
          color: '#2e7d32',
        })),
        // Advances
        ...jobs.filter(j => j.advance_date && (j.status === 'Partial' || j.status === 'Pending')).map(j => ({
          date: j.advance_date,
          time: '',
          description: 'Advance — ' + (j.customer_name || '') + ' | ' + j.job_id,
          in: Number(j.amount_paid || 0),
          out: 0,
          type: 'Advance',
          color: '#1a73e8',
        })),
        // Sales
        ...sales.map(s => ({
          date: toIST(s.created_at),
          time: toISTTime(s.created_at),
          description: 'Sale — ' + s.item_name + (s.sale_id ? ' | ' + s.sale_id : ''),
          in: Number(s.total || 0),
          out: 0,
          type: 'Sale',
          color: '#1565c0',
        })),
        // Cash Purchases
        ...purchases.filter(p => p.payment_type === 'Cash').map(p => ({
          date: p.purchase_date || toIST(p.created_at),
          time: toISTTime(p.created_at),
          description: 'Purchase — ' + p.item_name + ' | ' + (p.vendor_name || ''),
          in: 0,
          out: Number(p.total || 0),
          type: 'Purchase',
          color: '#e65100',
        })),
        // Expenses
        ...expenses.map(e => ({
          date: toIST(e.created_at),
          time: toISTTime(e.created_at),
          description: 'Expense — ' + e.description,
          in: 0,
          out: Number(e.amount || 0),
          type: 'Expense',
          color: '#c62828',
        })),
        // Vendor Payments
        ...vendorPayments.map(vp => ({
          date: toIST(vp.created_at),
          time: toISTTime(vp.created_at),
          description: 'Vendor Payment — ' + (vp.vendor_name || ''),
          in: 0,
          out: Number(vp.amount || 0),
          type: 'Payment',
          color: '#6a1b9a',
        })),
        // Bank Deposits (cash goes out)
        ...(bankTransactions || []).filter(bt => bt.transaction_type === 'Deposit').map(bt => ({
          date: bt.transaction_date,
          time: '',
          description: 'Bank Deposit — ' + (bt.account_name || '') + (bt.description ? ' | ' + bt.description : ''),
          in: 0,
          out: Number(bt.amount || 0),
          type: 'Bank Out',
          color: '#00838f',
        })),
        // Bank Withdrawals (cash comes in)
        ...(bankTransactions || []).filter(bt => bt.transaction_type === 'Withdraw').map(bt => ({
          date: bt.transaction_date,
          time: '',
          description: 'Bank Withdrawal — ' + (bt.account_name || '') + (bt.description ? ' | ' + bt.description : ''),
          in: Number(bt.amount || 0),
          out: 0,
          type: 'Bank In',
          color: '#00838f',
        })),
      ].filter(e => e.date && e.date.startsWith(cashMonth)).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

      // Running balance
      let balance = openingCash || 0;
      const entriesWithBalance = allEntries.map(e => {
        balance += e.in - e.out;
        return { ...e, balance };
      });

      const totalIn = allEntries.reduce((s, e) => s + e.in, 0);
      const totalOut = allEntries.reduce((s, e) => s + e.out, 0);

      return (
        <div>
          {/* Summary */}
          <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1a73e8', marginBottom: 12 }}>💵 Cash Ledger Summary</div>
            <StatRow label='Opening Cash' value={openingCash || 0} color='#1a73e8' />
            <StatRow label='Total Cash In' value={totalIn} color='#2e7d32' />
            <StatRow label='Total Cash Out' value={totalOut} color='#c62828' />
            <div style={{ borderTop: '2px solid #1a73e8', marginTop: 8, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16, fontWeight: 'bold' }}>Current Cash in Hand</div>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#2e7d32' }}>Rs.{(openingCash || 0) + totalIn - totalOut}</div>
            </div>
          </div>

          {/* Passbook */}
          <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>📒 Passbook</div>
            <input type='month' value={cashMonth} onChange={e => setCashMonth(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box', marginBottom: 12 }} />

            {/* Opening Entry */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', background: '#e8f1fd', borderRadius: 6, padding: '8px 10px', marginBottom: 4 }}>
              <div style={{ flex: 2 }}>
                <div style={{ fontSize: 12, fontWeight: 'bold', color: '#1a73e8' }}>Opening Balance</div>
              </div>
              <div style={{ flex: 1, textAlign: 'right', fontSize: 12, color: '#2e7d32', fontWeight: 'bold' }}>+Rs.{openingCash || 0}</div>
              <div style={{ flex: 1, textAlign: 'right', fontSize: 12, color: '#999' }}></div>
              <div style={{ flex: 1, textAlign: 'right', fontSize: 13, fontWeight: 'bold', color: '#1a73e8' }}>Rs.{openingCash || 0}</div>
            </div>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f5f5f5', borderRadius: 6, marginBottom: 4 }}>
              <div style={{ flex: 2, fontSize: 11, fontWeight: 'bold', color: '#888' }}>Description</div>
              <div style={{ flex: 1, textAlign: 'right', fontSize: 11, fontWeight: 'bold', color: '#2e7d32' }}>In (+)</div>
              <div style={{ flex: 1, textAlign: 'right', fontSize: 11, fontWeight: 'bold', color: '#c62828' }}>Out (-)</div>
              <div style={{ flex: 1, textAlign: 'right', fontSize: 11, fontWeight: 'bold', color: '#1a73e8' }}>Balance</div>
            </div>

            {entriesWithBalance.length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>No transactions yet</div>
            )}

            {entriesWithBalance.map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid #f5f5f5', borderLeft: '3px solid ' + e.color }}>
                <div style={{ flex: 2 }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ background: e.color, color: 'white', fontSize: 9, padding: '1px 5px', borderRadius: 6 }}>{e.type}</span>
                    <span style={{ fontSize: 10, color: '#999' }}>{e.date} {e.time}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#333' }}>{e.description}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'right', fontSize: 12, fontWeight: 'bold', color: '#2e7d32' }}>
                  {e.in > 0 ? '+Rs.' + e.in : ''}
                </div>
                <div style={{ flex: 1, textAlign: 'right', fontSize: 12, fontWeight: 'bold', color: '#c62828' }}>
                  {e.out > 0 ? '-Rs.' + e.out : ''}
                </div>
                <div style={{ flex: 1, textAlign: 'right', fontSize: 13, fontWeight: 'bold', color: e.balance >= 0 ? '#1a73e8' : '#c62828' }}>
                  Rs.{e.balance}
                </div>
              </div>
            ))}

            {/* Closing */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '10px 10px', background: '#e8f5e9', borderRadius: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#2e7d32' }}>💵 Closing Cash</div>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#2e7d32' }}>Rs.{(openingCash || 0) + totalIn - totalOut}</div>
            </div>
          </div>
        </div>
      );
    })()}
    {/* DAY BOOK */}
    {view === 'daybook' && (() => {
      const istOff = 5.5 * 60 * 60000;
      const toIST = (ts) => ts ? new Date(new Date(ts).getTime() + istOff).toISOString().split('T')[0] : null;
      const toISTTime = (ts) => ts ? new Date(new Date(ts).getTime() + istOff).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

      const dayEntries = [
        ...jobs.filter(j => (j.status === 'Delivered' || j.status === 'Partial') && j.delivery_date === selectedDate).map(j => ({
          time: toISTTime(j.created_at),
          description: j.customer_name + ' — ' + j.device_model + ' | ' + j.job_id,
          detail: j.complaint,
          in: Number(j.amount_paid || 0), out: 0,
          type: 'Repair', color: '#2e7d32',
        })),
        ...jobs.filter(j => j.advance_date === selectedDate && (j.status === 'Partial' || j.status === 'Pending')).map(j => ({
          time: '',
          description: 'Advance — ' + j.customer_name + ' | ' + j.job_id,
          detail: j.device_model,
          in: Number(j.amount_paid || 0), out: 0,
          type: 'Advance', color: '#1a73e8',
        })),
        ...sales.filter(s => toIST(s.created_at) === selectedDate).map(s => ({
          time: toISTTime(s.created_at),
          description: 'Sale — ' + s.item_name + (s.sale_id ? ' | ' + s.sale_id : ''),
          detail: 'Qty: ' + s.quantity + ' x Rs.' + s.price,
          in: Number(s.total || 0), out: 0,
          type: 'Sale', color: '#1565c0',
        })),
        ...purchases.filter(p => (p.purchase_date || toIST(p.created_at)) === selectedDate && p.payment_type === 'Cash').map(p => ({
          time: toISTTime(p.created_at),
          description: 'Purchase — ' + p.item_name + ' | ' + (p.vendor_name || ''),
          detail: 'Cash | Qty: ' + p.quantity + ' x Rs.' + p.rate,
          in: 0, out: Number(p.total || 0),
          type: 'Purchase', color: '#e65100',
        })),
        ...purchases.filter(p => (p.purchase_date || toIST(p.created_at)) === selectedDate && p.payment_type === 'Credit').map(p => ({
          time: toISTTime(p.created_at),
          description: 'Purchase — ' + p.item_name + ' | ' + (p.vendor_name || ''),
          detail: 'Credit | Qty: ' + p.quantity + ' x Rs.' + p.rate,
          in: 0, out: 0,
          type: 'Credit', color: '#fb8c00',
        })),
        ...expenses.filter(e => toIST(e.created_at) === selectedDate).map(e => ({
          time: toISTTime(e.created_at),
          description: 'Expense — ' + e.description,
          detail: '',
          in: 0, out: Number(e.amount || 0),
          type: 'Expense', color: '#c62828',
        })),
        ...vendorPayments.filter(vp => toIST(vp.created_at) === selectedDate).map(vp => ({
          time: toISTTime(vp.created_at),
          description: 'Vendor Payment — ' + (vp.vendor_name || ''),
          detail: '',
          in: 0, out: Number(vp.amount || 0),
          type: 'Payment', color: '#6a1b9a',
        })),
        ...(bankTransactions || []).filter(bt => bt.transaction_date === selectedDate && bt.transaction_type === 'Deposit').map(bt => ({
          time: '',
          description: 'Bank Deposit — ' + (bt.account_name || ''),
          detail: bt.description || '',
          in: 0, out: Number(bt.amount || 0),
          type: 'Bank Out', color: '#00838f',
        })),
        ...(bankTransactions || []).filter(bt => bt.transaction_date === selectedDate && bt.transaction_type === 'Withdraw').map(bt => ({
          time: '',
          description: 'Bank Withdrawal — ' + (bt.account_name || ''),
          detail: bt.description || '',
          in: Number(bt.amount || 0), out: 0,
          type: 'Bank In', color: '#00838f',
        })),
      ].sort((a, b) => a.time.localeCompare(b.time));

      const totalIn = dayEntries.reduce((s, e) => s + e.in, 0);
      const totalOut = dayEntries.reduce((s, e) => s + e.out, 0);

      return (
        <div>
          {/* Summary */}
          <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1a73e8', marginBottom: 12 }}>📅 Day Book — {fmtDate(selectedDate)}</div>
            <StatRow label='Total Cash In' value={totalIn} color='#2e7d32' />
            <StatRow label='Total Cash Out' value={totalOut} color='#c62828' />
            <div style={{ borderTop: '2px solid #1a73e8', marginTop: 8, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 'bold' }}>Net Cash Flow</div>
              <div style={{ fontSize: 15, fontWeight: 'bold', color: (totalIn - totalOut) >= 0 ? '#2e7d32' : '#c62828' }}>Rs.{totalIn - totalOut}</div>
            </div>
          </div>

          {/* Entries */}
          <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 12 }}>All Transactions</div>
            {dayEntries.length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>No transactions on this date</div>
            )}
            {dayEntries.map((e, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5', borderLeft: '3px solid ' + e.color, paddingLeft: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ background: e.color, color: 'white', fontSize: 9, padding: '1px 6px', borderRadius: 6, fontWeight: 'bold' }}>{e.type}</span>
                      {e.time && <span style={{ fontSize: 10, color: '#999' }}>{e.time}</span>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 'bold', color: '#333' }}>{e.description}</div>
                    {e.detail && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{e.detail}</div>}
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 80 }}>
                    {e.in > 0 && <div style={{ fontSize: 14, fontWeight: 'bold', color: '#2e7d32' }}>+Rs.{e.in}</div>}
                    {e.out > 0 && <div style={{ fontSize: 14, fontWeight: 'bold', color: '#c62828' }}>-Rs.{e.out}</div>}
                    {e.in === 0 && e.out === 0 && <div style={{ fontSize: 12, color: '#fb8c00' }}>Credit</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    })()}
    </div>
  );
};

export default Accounts;