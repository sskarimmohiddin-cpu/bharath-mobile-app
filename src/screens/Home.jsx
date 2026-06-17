import React from 'react';
// import { fmtDate } from '../utils/format';
import JobCard from '../components/JobCard';

const Home = ({ jobs, vendors, jobParts, sales, todayCollected, todayAdvances, todaySales, todayExpenses, todayPurchases, todayCashPurchases, todayPartsCost, todayVendorPayments, todayNetProfit, totalCollected, vendorPayable, today, setScreen, fetchAll, onMarkDelivered, onCollectBalance, onMarkReturned, onEditJob, onDeleteJob, onCollectAdvance, filteredTx, filterDateFrom, filterDateTo, setFilterDateFrom, setFilterDateTo, openingCash, saveOpeningCash, cashInHand, closingCash, dashDate, setDashDate, getDayData }) => {
  const [showBillWise, setShowBillWise] = React.useState(false);
  const [dayData, setDayData] = React.useState(null);
  const [dayDataLoading, setDayDataLoading] = React.useState(false);

  React.useEffect(() => { // eslint-disable-line react-hooks/exhaustive-deps
    if (dashDate !== today) {
      setDayDataLoading(true);
      setDayData(null);
      getDayData(dashDate).then(d => {
        setDayData(d);
        setDayDataLoading(false);
      });
    } else {
      setDayData(null);
      setDayDataLoading(false);
    }
  }, [dashDate, today, getDayData]);

  const [billWiseDate, setBillWiseDate] = React.useState(today);
  const [showRecentJobs, setShowRecentJobs] = React.useState(false);
  const [showTransactions, setShowTransactions] = React.useState(false);

  const isToday = dashDate === today;

  const d = isToday ? {
    collected: todayCollected, advances: todayAdvances, sales: todaySales,
    cashPurchases: todayCashPurchases, purchases: todayPurchases,
    partsCost: todayPartsCost, vendorPayments: todayVendorPayments,
    expenses: todayExpenses, netProfit: todayNetProfit, opening: openingCash
  } : (dayData || { collected:0, advances:0, sales:0, cashPurchases:0, purchases:0, partsCost:0, vendorPayments:0, expenses:0, netProfit:0, opening:0 });

  const closing = isToday ? closingCash : d.opening + d.collected + d.advances + d.sales - d.expenses - d.cashPurchases - d.vendorPayments;

  const fmtRs = (n) => 'Rs.' + Number(n || 0).toLocaleString('en-IN');

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', padding: '0 0 32px 0' }}>

      {/* HERO HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 60%)',
        padding: '20px 20px 28px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(56,189,248,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(99,102,241,0.1)' }} />

        {/* Date Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <input type='date' value={dashDate} max={today}
            onChange={e => { if(e.target.value) setDashDate(e.target.value); }}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(56,189,248,0.3)', fontSize: 14, color: '#38bdf8', background: 'rgba(56,189,248,0.08)', fontWeight: 'bold', outline: 'none' }} />
          {!isToday && (
            <button onClick={() => setDashDate(today)}
              style={{ background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}>
              Today
            </button>
          )}
        </div>

        {/* Hero Number */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
            {isToday ? '💵 Cash in Hand' : '📅 ' + dashDate}
          </div>
          <div style={{ fontSize: 36, fontWeight: '800', color: '#f0fdf4', letterSpacing: -1 }}>
            {fmtRs(closing)}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Opening {fmtRs(d.opening)} · Net Profit{' '}
            <span style={{ color: d.netProfit >= 0 ? '#4ade80' : '#f87171' }}>{fmtRs(d.netProfit)}</span>
          </div>
        </div>

        {isToday && (
          <button onClick={() => {
            const amount = prompt('Enter opening cash balance for today:');
            if (amount !== null) saveOpeningCash(Number(amount) || 0);
          }} style={{ marginTop: 10, background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 8, padding: '5px 14px', fontSize: 12, cursor: 'pointer' }}>
            ✏️ Edit Opening Cash
          </button>
        )}
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* INCOME/EXPENSE CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16, marginBottom: 16 }}>
          {[
            { label: 'Repair Collected', value: d.collected, icon: '🔧', color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)' },
            { label: 'Accessories Sales', value: d.sales, icon: '🛍', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.2)' },
            { label: 'Parts Cost', value: d.partsCost, icon: '⚙️', color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
            { label: 'Expenses', value: d.expenses, icon: '💸', color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.2)' },
          ].map((item, i) => (
            <div key={i} style={{ background: item.bg, border: '1px solid ' + item.border, borderRadius: 14, padding: '14px 14px' }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{item.icon}</div>
              <div style={{ fontSize: 18, fontWeight: '700', color: item.color }}>{fmtRs(item.value)}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* BREAKDOWN */}
        {dashDate !== today && dayDataLoading && (
          <div style={{ textAlign: 'center', padding: 20, color: '#64748b', background: 'rgba(255,255,255,0.04)', borderRadius: 14 }}>Loading...</div>
        )}

        {!(dashDate !== today && dayDataLoading) && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Daily Breakdown</div>
            {[
              { label: 'Opening Cash', value: d.opening, color: '#38bdf8' },
              { label: 'Repair Collected', value: d.collected, color: '#4ade80' },
              ...(d.advances > 0 ? [{ label: 'Advance Received', value: d.advances, color: '#a78bfa' }] : []),
              { label: 'Accessories Sales', value: d.sales, color: '#60a5fa' },
              { label: 'Purchases (Cash)', value: d.cashPurchases, color: '#f87171' },
              { label: 'Purchases (Credit)', value: d.purchases - d.cashPurchases, color: '#fb923c' },
              { label: 'Parts Cost', value: d.partsCost, color: '#f87171' },
              { label: 'Vendor Payments', value: d.vendorPayments, color: '#f87171' },
              { label: 'Expenses', value: d.expenses, color: '#f87171' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>{row.label}</div>
                <div style={{ fontSize: 13, fontWeight: '600', color: row.color }}>{fmtRs(row.value)}</div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: '700', color: '#f1f5f9' }}>Net Profit</div>
              <div style={{ fontSize: 16, fontWeight: '800', color: d.netProfit >= 0 ? '#4ade80' : '#f87171' }}>{fmtRs(d.netProfit)}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(56,189,248,0.1)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 14, fontWeight: '700', color: '#f1f5f9' }}>Closing Cash</div>
              <div style={{ fontSize: 16, fontWeight: '800', color: '#38bdf8' }}>{fmtRs(closing)}</div>
            </div>
          </div>
        )}

        {/* QUICK STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Total Jobs', value: jobs.length, icon: '📋', color: '#60a5fa' },
            { label: 'Pending', value: jobs.filter(j => j.status === 'Pending').length, icon: '⏳', color: '#fb923c' },
            { label: 'Collected', value: fmtRs(totalCollected), icon: '💰', color: '#4ade80' },
            { label: 'Payable', value: fmtRs(vendorPayable), icon: '🏪', color: '#f87171' },
          ].map((stat, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 22 }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: '700', color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ACTION BUTTONS */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: '🔧 New Repair Job', screen: 'newjob', bg: 'linear-gradient(135deg, #2563eb, #1d4ed8)' },
              { label: '📋 All Jobs (' + jobs.length + ')', screen: 'jobs', bg: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.4)', color: '#60a5fa' },
              { label: '⏳ Pending (' + jobs.filter(j => j.status === 'Pending' || j.status === 'Partial').length + ')', screen: 'pending', bg: 'linear-gradient(135deg, #d97706, #b45309)' },
              { label: '📦 Purchase Stock', screen: 'purchase', bg: 'linear-gradient(135deg, #ea580c, #c2410c)' },
              { label: '🛍 Accessories Sale', screen: 'sale', bg: 'linear-gradient(135deg, #16a34a, #15803d)' },
              { label: '💸 Add Expense', screen: 'expense', bg: 'rgba(100,116,139,0.2)', border: '1px solid rgba(100,116,139,0.3)', color: '#94a3b8' },
              { label: '🏪 Vendor Balances', screen: 'vendors', bg: 'linear-gradient(135deg, #7c3aed, #6d28d9)' },
              { label: '📊 Stock', screen: 'stock', bg: 'linear-gradient(135deg, #0d9488, #0f766e)' },
              { label: '📈 Accounts', screen: 'accounts', bg: 'linear-gradient(135deg, #1d4ed8, #1e40af)' },
              { label: '🏦 Banking', screen: 'banking', bg: 'linear-gradient(135deg, #0e7490, #0c6173)' },
            ].map((btn, i) => (
              <button key={i} onClick={() => { fetchAll(); setScreen(btn.screen); }}
                style={{ background: btn.bg, color: btn.color || 'white', border: btn.border || 'none', borderRadius: 12, padding: '14px 12px', fontSize: 13, fontWeight: '600', cursor: 'pointer', textAlign: 'left' }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* BILL WISE PROFIT */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, marginBottom: 12, overflow: 'hidden' }}>
          <div onClick={() => setShowBillWise(!showBillWise)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: '600', color: '#f1f5f9' }}>📈 Bill Wise Profit</div>
            <div style={{ fontSize: 12, color: '#38bdf8' }}>{showBillWise ? '▲ Hide' : '▼ Show'}</div>
          </div>
          {showBillWise && (
            <div style={{ padding: '0 16px 16px' }}>
              <input type='date' value={billWiseDate} onChange={e => setBillWiseDate(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(56,189,248,0.3)', fontSize: 13, color: '#38bdf8', background: 'rgba(56,189,248,0.08)', boxSizing: 'border-box', marginBottom: 12 }} />
              {jobs.filter(j => (j.status === 'Delivered' || j.status === 'Partial') && j.delivery_date && j.delivery_date === billWiseDate).map((job, i) => {
                const parts = jobParts ? jobParts.filter(p => p.job_id === job.job_id) : [];
                const partsCost = parts.reduce((s, p) => s + Number(p.total || 0), 0);
                const profit = Number(job.amount_paid || 0) - partsCost;
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{job.job_id} — {job.device_model}</div>
                      {partsCost > 0 && <div style={{ fontSize: 11, color: '#fb923c' }}>Parts: {fmtRs(partsCost)}</div>}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: '700', color: profit >= 0 ? '#4ade80' : '#f87171' }}>{fmtRs(profit)}</div>
                  </div>
                );
              })}
              {sales && sales.filter(s => s.created_at && s.created_at.startsWith(billWiseDate)).map((s, i) => {
                const saleProfit = s.purchase_cost > 0 ? (Number(s.price) - Number(s.purchase_cost)) * Number(s.quantity) : Number(s.total);
                return (
                  <div key={'s' + i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#60a5fa' }}>🛍 {s.sale_id || 'Sale'} — {s.item_name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Qty: {s.quantity} x Rs.{s.price}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: '700', color: '#4ade80' }}>{fmtRs(saleProfit)}</div>
                  </div>
                );
              })}
              {jobs.filter(j => (j.status === 'Delivered' || j.status === 'Partial') && j.delivery_date === billWiseDate).length === 0 &&
               (!sales || sales.filter(s => s.created_at && s.created_at.startsWith(billWiseDate)).length === 0) && (
                <div style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: 16 }}>No transactions on this date</div>
              )}
              {(jobs.filter(j => (j.status === 'Delivered' || j.status === 'Partial') && j.delivery_date === billWiseDate).length > 0 ||
                (sales && sales.filter(s => s.created_at && s.created_at.startsWith(billWiseDate)).length > 0)) && (
                <div style={{ borderTop: '1px solid rgba(56,189,248,0.2)', marginTop: 8, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 13, fontWeight: '600', color: '#f1f5f9' }}>Total Profit</div>
                  <div style={{ fontSize: 15, fontWeight: '800', color: '#4ade80' }}>
                    {fmtRs(
                      jobs.filter(j => (j.status === 'Delivered' || j.status === 'Partial') && j.delivery_date === billWiseDate)
                        .reduce((sum, job) => {
                          const parts = jobParts ? jobParts.filter(p => p.job_id === job.job_id) : [];
                          const partsCost = parts.reduce((s, p) => s + Number(p.total || 0), 0);
                          return sum + (Number(job.amount_paid || 0) - partsCost);
                        }, 0) +
                      (sales ? sales.filter(s => s.created_at && s.created_at.startsWith(billWiseDate))
                        .reduce((sum, s) => sum + (s.purchase_cost > 0 ? (Number(s.price) - Number(s.purchase_cost)) * Number(s.quantity) : Number(s.total)), 0) : 0)
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RECENT JOBS */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, marginBottom: 12, overflow: 'hidden' }}>
          <div onClick={() => setShowRecentJobs(!showRecentJobs)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: '600', color: '#f1f5f9' }}>🔧 Recent Jobs</div>
            <div style={{ fontSize: 12, color: '#38bdf8' }}>{showRecentJobs ? '▲ Hide' : '▼ Show'}</div>
          </div>
          {showRecentJobs && (
            <div style={{ padding: '0 12px 12px' }}>
              {jobs.slice(0, 3).map((job, i) => (
                <JobCard key={i} job={job} jobParts={jobParts}
                  onEdit={onEditJob} onDelete={onDeleteJob}
                  onMarkDelivered={onMarkDelivered} onCollectBalance={onCollectBalance}
                  onMarkReturned={onMarkReturned} onCollectAdvance={onCollectAdvance} />
              ))}
            </div>
          )}
        </div>

        {/* ALL TRANSACTIONS */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
          <div onClick={() => setShowTransactions(!showTransactions)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: '600', color: '#f1f5f9' }}>📒 All Transactions</div>
            <div style={{ fontSize: 12, color: '#38bdf8' }}>{showTransactions ? '▲ Hide' : '▼ Show'}</div>
          </div>
          {showTransactions && (
            <div style={{ padding: '0 12px 12px' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>From</div>
                  <input type='date' value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, background: 'rgba(255,255,255,0.06)', color: '#f1f5f9', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>To</div>
                  <input type='date' value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, background: 'rgba(255,255,255,0.06)', color: '#f1f5f9', boxSizing: 'border-box' }} />
                </div>
              </div>
              <button onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); }}
                style={{ width: '100%', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 8, padding: 8, fontSize: 13, cursor: 'pointer', marginBottom: 10 }}>
                Show All
              </button>
              {filteredTx.length === 0 && (
                <div style={{ textAlign: 'center', color: '#475569', padding: 20 }}>No transactions found</div>
              )}
              {filteredTx.map((tx, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, marginBottom: 8, borderLeft: '3px solid ' + tx.color }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                        <div style={{ background: tx.color, color: 'white', fontSize: 9, padding: '2px 6px', borderRadius: 8, fontWeight: '600' }}>{tx.type}</div>
                        <div style={{ fontSize: 10, color: '#475569' }}>{tx.date ? new Date(tx.date).toLocaleDateString('en-IN') + ' ' + new Date(tx.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: '600', color: '#e2e8f0' }}>{tx.title}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{tx.detail}</div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 70 }}>
                      <div style={{ fontSize: 14, fontWeight: '700', color: tx.color }}>{tx.sign}Rs.{tx.amount}</div>
                      <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>{tx.status}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Home;
