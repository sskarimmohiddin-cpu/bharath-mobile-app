import React from 'react';
import { fmtDate } from '../utils/format';
import JobCard from '../components/JobCard';

const Home = ({ jobs, vendors, jobParts, sales, todayCollected, todayAdvances, todaySales, todayExpenses, todayPurchases, todayCashPurchases, todayPartsCost, todayVendorPayments, todayNetProfit, totalCollected, vendorPayable, today, setScreen, fetchAll, onMarkDelivered, onCollectBalance, onMarkReturned, onEditJob, onDeleteJob, onCollectAdvance, filteredTx, filterDateFrom, filterDateTo, setFilterDateFrom, setFilterDateTo, openingCash, saveOpeningCash, dashDate, setDashDate, getDayData }) => {
  const [showBillWise, setShowBillWise] = React.useState(false);
  const [billWiseDate, setBillWiseDate] = React.useState(today);
  const [showRecentJobs, setShowRecentJobs] = React.useState(false);
  const [showTransactions, setShowTransactions] = React.useState(false);
  return (
    <div style={{ padding: 20 }}>

      {/* TODAY SUMMARY */}
      <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>
            {dashDate === today ? 'Today Summary' : 'Summary — ' + dashDate}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type='date' value={dashDate} max={today}
              onChange={e => { if(e.target.value) setDashDate(e.target.value); }}
              style={{ border: '1px solid #1a73e8', borderRadius: 6, padding: '4px 8px', fontSize: 13, color: '#1a73e8', background: dashDate !== today ? '#fff8e1' : 'white', fontWeight: 'bold', minWidth: 130 }} />
            {dashDate !== today && (
              <button onClick={() => setDashDate(today)}
                style={{ fontSize: 12, background: '#1a73e8', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Today
              </button>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: '#555' }}>Opening Cash</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#1a73e8' }}>Rs.{openingCash}</div>
            <button onClick={() => {
              const amount = prompt('Enter opening cash balance for today:');
              if (amount !== null) saveOpeningCash(Number(amount) || 0);
            }} style={{ background: '#e8f1fd', color: '#1a73e8', border: '1px solid #1a73e8', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>
              Edit
            </button>
          </div>
        </div>
        {(() => {
          const d = dashDate === today ? {
            collected: todayCollected, advances: todayAdvances, sales: todaySales,
            cashPurchases: todayCashPurchases, purchases: todayPurchases,
            partsCost: todayPartsCost, vendorPayments: todayVendorPayments,
            expenses: todayExpenses, netProfit: todayNetProfit, opening: openingCash
          } : getDayData(dashDate);
          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: '#555' }}>Repair Collected</div>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2e7d32' }}>Rs.{d.collected}</div>
              </div>
              {d.advances > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, color: '#555' }}>Advance Received</div>
                  <div style={{ fontSize: 13, fontWeight: 'bold', color: '#1a73e8' }}>Rs.{d.advances}</div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: '#555' }}>Accessories Sales</div>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2e7d32' }}>Rs.{d.sales}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: '#555' }}>Purchases (Cash)</div>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#c62828' }}>Rs.{d.cashPurchases}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: '#555' }}>Purchases (Credit)</div>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#e65100' }}>Rs.{d.purchases - d.cashPurchases}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: '#555' }}>Parts Cost</div>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#c62828' }}>Rs.{d.partsCost}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: '#555' }}>Vendor Payments</div>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#c62828' }}>Rs.{d.vendorPayments}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: '#555' }}>Expenses</div>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#c62828' }}>Rs.{d.expenses}</div>
              </div>
              <div style={{ borderTop: '1px solid #eee', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>Net Profit</div>
                <div style={{ fontSize: 14, fontWeight: 'bold', color: d.netProfit >= 0 ? '#2e7d32' : '#c62828' }}>
                  Rs.{d.netProfit}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #eee' }}>
                <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>Closing Cash</div>
                <div style={{ fontSize: 14, fontWeight: 'bold', color: '#1a73e8' }}>
                  Rs.{d.opening + d.collected + d.advances + d.sales - d.expenses - d.cashPurchases - d.vendorPayments}
                </div>
              </div>
            </>
          );
        })()}

        {/* BILL WISE PROFIT */}
        <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 8 }}>
          <div onClick={() => setShowBillWise(!showBillWise)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: showBillWise ? 10 : 0 }}>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#555' }}>Bill Wise Profit</div>
            <div style={{ fontSize: 12, color: '#1a73e8' }}>{showBillWise ? '▲ Hide' : '▼ Show'}</div>
          </div>
          {showBillWise && (
            <div>
              <input type='date' value={billWiseDate} onChange={e => setBillWiseDate(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, boxSizing: 'border-box', marginBottom: 10 }} />
              {jobs.filter(j => (j.status === 'Delivered' || j.status === 'Partial') && j.delivery_date && j.delivery_date === billWiseDate).map((job, i) => {
                const parts = jobParts ? jobParts.filter(p => p.job_id === job.job_id) : [];
                const partsCost = parts.reduce((s, p) => s + Number(p.total || 0), 0);
                const profit = Number(job.amount_paid || 0) - partsCost;
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#555' }}>{job.job_id} — {job.device_model}</div>
                      {partsCost > 0 && <div style={{ fontSize: 11, color: '#e65100' }}>Parts: Rs.{partsCost}</div>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 'bold', color: profit >= 0 ? '#2e7d32' : '#c62828' }}>Rs.{profit}</div>
                  </div>
                );
              })}
              {sales && sales.filter(s => s.created_at && s.created_at.startsWith(billWiseDate)).map((s, i) => {
                const saleProfit = s.purchase_cost > 0
                  ? (Number(s.price) - Number(s.purchase_cost)) * Number(s.quantity)
                  : Number(s.total);
                return (
                  <div key={'s' + i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#1565c0' }}>🛍 {s.sale_id || 'Sale'} — {s.item_name}</div>
                      <div style={{ fontSize: 11, color: '#666' }}>Qty: {s.quantity} x Rs.{s.price}</div>
                      {s.purchase_cost > 0 && <div style={{ fontSize: 11, color: '#e65100' }}>Cost: Rs.{s.purchase_cost}</div>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2e7d32' }}>Rs.{saleProfit}</div>
                  </div>
                );
              })}
              {jobs.filter(j => (j.status === 'Delivered' || j.status === 'Partial') && j.delivery_date === billWiseDate).length === 0 &&
               (!sales || sales.filter(s => s.created_at && s.created_at.startsWith(billWiseDate)).length === 0) && (
                <div style={{ fontSize: 12, color: '#999', textAlign: 'center', padding: 10 }}>No transactions on this date</div>
              )}
              {(jobs.filter(j => (j.status === 'Delivered' || j.status === 'Partial') && j.delivery_date === billWiseDate).length > 0 ||
                (sales && sales.filter(s => s.created_at && s.created_at.startsWith(billWiseDate)).length > 0)) && (
                <div style={{ borderTop: '2px solid #1a73e8', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 13, fontWeight: 'bold', color: '#333' }}>Total Profit ({billWiseDate})</div>
                  <div style={{ fontSize: 14, fontWeight: 'bold', color: '#2e7d32' }}>
                    Rs.{
                      jobs.filter(j => (j.status === 'Delivered' || j.status === 'Partial') && j.delivery_date === billWiseDate)
                        .reduce((sum, job) => {
                          const parts = jobParts ? jobParts.filter(p => p.job_id === job.job_id) : [];
                          const partsCost = parts.reduce((s, p) => s + Number(p.total || 0), 0);
                          return sum + (Number(job.amount_paid || 0) - partsCost);
                        }, 0) +
                      (sales ? sales.filter(s => s.created_at && s.created_at.startsWith(billWiseDate))
                        .reduce((sum, s) => sum + (s.purchase_cost > 0
                          ? (Number(s.price) - Number(s.purchase_cost)) * Number(s.quantity)
                          : Number(s.total)), 0) : 0)
                    }
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* QUICK STATS */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Total Jobs', value: jobs.length, color: '#1a73e8' },
          { label: 'Pending', value: jobs.filter(j => j.status === 'Pending').length, color: '#f57c00' },
          { label: 'Collected', value: 'Rs.' + totalCollected, color: '#2e7d32' },
          { label: 'Payable', value: 'Rs.' + vendorPayable, color: '#c62828' },
        ].map((stat, i) => (
          <div key={i} style={{ flex: 1, background: 'white', borderRadius: 12, padding: 12, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: '#666' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: '+ New Repair Job', screen: 'newjob', bg: '#1a73e8' },
          { label: 'View All Jobs (' + jobs.length + ')', screen: 'jobs', bg: 'white', color: '#1a73e8', border: '2px solid #1a73e8' },
          { label: '⏳ Pending (' + jobs.filter(j => j.status === 'Pending' || j.status === 'Partial').length + ')', screen: 'pending', bg: '#f57c00' },
          { label: '+ Purchase Stock', screen: 'purchase', bg: '#e65100' },
          { label: '+ Accessories Sale', screen: 'sale', bg: '#2e7d32' },
          { label: '+ Add Expense', screen: 'expense', bg: '#555' },
          { label: 'Vendor Balances', screen: 'vendors', bg: '#6a1b9a' },
          { label: 'Stock Management', screen: 'stock', bg: '#00796b' },
          { label: '📊 Accounts', screen: 'accounts', bg: '#1565c0' },
          { label: '🏦 Banking', screen: 'banking', bg: '#00838f' },
        ].map((btn, i) => (
          <button key={i} onClick={() => { fetchAll(); setScreen(btn.screen); }}
            style={{ background: btn.bg, color: btn.color || 'white', border: btn.border || 'none', borderRadius: 12, padding: 16, fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>
            {btn.label}
          </button>
        ))}
      </div>

      {/* RECENT JOBS */}
      <div onClick={() => setShowRecentJobs(!showRecentJobs)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'white', borderRadius: 10, padding: '12px 16px', marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>Recent Jobs</div>
        <div style={{ fontSize: 12, color: '#1a73e8' }}>{showRecentJobs ? '▲ Hide' : '▼ Show'}</div>
      </div>
      {showRecentJobs && jobs.slice(0, 3).map((job, i) => (
        <JobCard key={i} job={job} jobParts={jobParts}
          onEdit={onEditJob}
          onDelete={onDeleteJob}
          onMarkDelivered={onMarkDelivered}
          onCollectBalance={onCollectBalance}
          onMarkReturned={onMarkReturned}
          onCollectAdvance={onCollectAdvance}
        />
      ))}

      {/* ALL TRANSACTIONS */}
      <div onClick={() => setShowTransactions(!showTransactions)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'white', borderRadius: 10, padding: '12px 16px', marginTop: 16, marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>All Transactions</div>
        <div style={{ fontSize: 12, color: '#1a73e8' }}>{showTransactions ? '▲ Hide' : '▼ Show'}</div>
      </div>
      {showTransactions && (
        <div>
          <div style={{ background: 'white', borderRadius: 10, padding: 12, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>From Date</div>
                <input type='date' value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>To Date</div>
                <input type='date' value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
            </div>
            <button onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); }}
              style={{ width: '100%', background: '#1a73e8', color: 'white', border: 'none', borderRadius: 8, padding: 8, fontSize: 13, cursor: 'pointer' }}>
              Show All Transactions
            </button>
          </div>
          {filteredTx.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>No transactions found</div>
          )}
          {filteredTx.map((tx, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 10, padding: 12, marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderLeft: '4px solid ' + tx.color }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                    <div style={{ background: tx.color, color: 'white', fontSize: 10, padding: '2px 6px', borderRadius: 10 }}>{tx.type}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{tx.date ? new Date(tx.date).toLocaleDateString('en-IN') + ' ' + new Date(tx.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>{tx.title}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{tx.detail}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 70 }}>
                  <div style={{ fontSize: 15, fontWeight: 'bold', color: tx.color }}>{tx.sign}Rs.{tx.amount}</div>
                  <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{tx.status}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;