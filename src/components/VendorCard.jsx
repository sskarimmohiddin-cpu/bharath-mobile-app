import React from 'react';
import { supabase } from '../supabase';
import { fmtDateTime } from '../utils/format';

const VendorCard = ({ v, purchases, vendorPayments, vendors, fetchAll }) => {
  const [showPassbook, setShowPassbook] = React.useState(false);
  const [passbookMonth, setPassbookMonth] = React.useState(
    new Date(new Date().getTime() + 5.5 * 60 * 60000).toISOString().slice(0, 7)
  );

  const vPurchases = purchases.filter(p => p.vendor_name === v.name);
  const vPayments = vendorPayments.filter(vp => vp.vendor_name === v.name);

  const calculatedBalance =
    vPurchases.filter(p => p.payment_type === 'Credit').reduce((s, p) => s + Number(p.total || 0), 0) -
    vPayments.reduce((s, vp) => s + Number(vp.amount || 0), 0);

  const history = [
    ...vPurchases.map(p => ({
      date: p.created_at, title: p.item_name,
      detail: 'Qty: ' + p.quantity + ' x Rs.' + p.rate + ' | ' + p.payment_type,
      amount: p.total, color: '#c62828', sign: '+', type: 'Purchase',
    })),
    ...vPayments.map(vp => ({
      date: vp.created_at, title: 'Payment made',
      detail: 'Paid to ' + v.name,
      amount: vp.amount, color: '#2e7d32', sign: '-', type: 'Payment',
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Passbook entries for selected month
  const istOffset = 5.5 * 60 * 60000;
  const toIST = (ts) => ts ? new Date(new Date(ts).getTime() + istOffset).toISOString().split('T')[0] : null;

  const monthEntries = [
    ...vPurchases.filter(p => p.payment_type === 'Credit').map(p => ({
      date: p.purchase_date || toIST(p.created_at),
      time: p.created_at ? new Date(new Date(p.created_at).getTime() + istOffset).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
      description: p.item_name,
      detail: 'Qty: ' + p.quantity + ' x Rs.' + p.rate,
      in: 0,
      out: Number(p.total || 0),
      type: 'Purchase',
      color: '#c62828',
    })),
    ...vPayments.map(vp => ({
      date: toIST(vp.created_at),
      time: vp.created_at ? new Date(new Date(vp.created_at).getTime() + istOffset).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
      description: 'Payment made',
      detail: 'Paid to ' + v.name,
      in: Number(vp.amount || 0),
      out: 0,
      type: 'Payment',
      color: '#2e7d32',
    })),
  ]
    .filter(e => e.date && e.date.startsWith(passbookMonth))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  // Running balance for passbook
  const allSorted = [
    ...vPurchases.filter(p => p.payment_type === 'Credit').map(p => ({
      date: p.purchase_date || toIST(p.created_at),
      out: Number(p.total || 0), in: 0,
    })),
    ...vPayments.map(vp => ({
      date: toIST(vp.created_at),
      in: Number(vp.amount || 0), out: 0,
    })),
  ].filter(e => e.date && e.date < (passbookMonth + '-01')).sort((a, b) => a.date.localeCompare(b.date));

  const openingBalance = allSorted.reduce((s, e) => s + e.out - e.in, 0);

  let runningBalance = openingBalance;
  const entriesWithBalance = monthEntries.map(e => {
    runningBalance += e.out - e.in;
    return { ...e, balance: runningBalance };
  });

  const monthTotalPurchases = monthEntries.reduce((s, e) => s + e.out, 0);
  const monthTotalPayments = monthEntries.reduce((s, e) => s + e.in, 0);

  return (
    <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 15 }}>{v.name}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>📞 {v.phone}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold', fontSize: 16, color: calculatedBalance > 0 ? '#c62828' : calculatedBalance < 0 ? '#2e7d32' : '#888' }}>
            {calculatedBalance < 0 ? '-Rs.' + Math.abs(calculatedBalance) : 'Rs.' + calculatedBalance}
          </div>
          <div style={{ fontSize: 11, color: calculatedBalance > 0 ? '#c62828' : calculatedBalance < 0 ? '#2e7d32' : '#888' }}>
            {calculatedBalance > 0 ? 'Payable' : calculatedBalance < 0 ? 'Receivable' : 'Clear'}
          </div>
        </div>
      </div>

      {/* PAY BALANCE */}
      {calculatedBalance !== 0 && (
        <button onClick={async () => {
          const paid = prompt('Pay to ' + v.name + '\nCurrent balance: Rs.' + calculatedBalance + '\nEnter amount paying:');
          if (paid === null) return;
          const amount = Number(paid) || 0;
          await supabase.from('vendor_payments').insert([{ vendor_id: v.id, vendor_name: v.name, amount: amount }]);
          fetchAll();
        }}
          style={{ width: '100%', marginTop: 10, background: '#1a73e8', color: 'white', border: 'none', borderRadius: 8, padding: 8, fontSize: 13, cursor: 'pointer' }}>
          Pay Balance
        </button>
      )}

      {/* BUTTONS */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={() => setShowPassbook(!showPassbook)}
          style={{ flex: 1, background: showPassbook ? '#1a73e8' : '#e8f1fd', color: showPassbook ? 'white' : '#1a73e8', border: '1px solid #1a73e8', borderRadius: 8, padding: 8, fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}>
          📒 Passbook
        </button>
        <button onClick={() => {
          const newName = prompt('Edit vendor name:', v.name);
          if (!newName) return;
          const newPhone = prompt('Edit phone:', v.phone);
          supabase.from('vendors').update({ name: newName, phone: newPhone || v.phone }).eq('id', v.id).then(() => fetchAll());
        }}
          style={{ flex: 1, background: '#555', color: 'white', border: 'none', borderRadius: 8, padding: 8, fontSize: 13, cursor: 'pointer' }}>
          Edit
        </button>
        <button onClick={async () => {
          if (window.confirm('Delete ' + v.name + '? This cannot be undone!')) {
            await supabase.from('vendors').delete().eq('id', v.id);
            fetchAll();
          }
        }}
          style={{ flex: 1, background: '#c62828', color: 'white', border: 'none', borderRadius: 8, padding: 8, fontSize: 13, cursor: 'pointer' }}>
          Delete
        </button>
      </div>

      {/* PASSBOOK */}
      {showPassbook && (
        <div style={{ marginTop: 14, borderTop: '1px solid #eee', paddingTop: 12 }}>
          {/* Month Picker */}
          <input type='month' value={passbookMonth} onChange={e => setPassbookMonth(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #1a73e8', fontSize: 14, color: '#1a73e8', boxSizing: 'border-box', marginBottom: 12 }} />

          {/* Summary */}
          <div style={{ background: '#f9f9f9', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 12, color: '#555' }}>Opening Balance</div>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#c62828' }}>Rs.{openingBalance}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 12, color: '#555' }}>Purchases this month</div>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#c62828' }}>+Rs.{monthTotalPurchases}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 12, color: '#555' }}>Payments this month</div>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#2e7d32' }}>-Rs.{monthTotalPayments}</div>
            </div>
            <div style={{ borderTop: '1px solid #ddd', paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 'bold' }}>Closing Balance</div>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#c62828' }}>Rs.{openingBalance + monthTotalPurchases - monthTotalPayments}</div>
            </div>
          </div>

          {/* Header */}
          <div style={{ display: 'flex', padding: '6px 8px', background: '#f5f5f5', borderRadius: 6, marginBottom: 4 }}>
            <div style={{ flex: 2, fontSize: 11, fontWeight: 'bold', color: '#888' }}>Description</div>
            <div style={{ flex: 1, textAlign: 'right', fontSize: 11, fontWeight: 'bold', color: '#c62828' }}>Debit</div>
            <div style={{ flex: 1, textAlign: 'right', fontSize: 11, fontWeight: 'bold', color: '#2e7d32' }}>Credit</div>
            <div style={{ flex: 1, textAlign: 'right', fontSize: 11, fontWeight: 'bold', color: '#1a73e8' }}>Balance</div>
          </div>

          {/* Opening row */}
          <div style={{ display: 'flex', padding: '6px 8px', background: '#e8f1fd', borderRadius: 6, marginBottom: 4, alignItems: 'center' }}>
            <div style={{ flex: 2, fontSize: 11, fontWeight: 'bold', color: '#1a73e8' }}>Opening Balance</div>
            <div style={{ flex: 1 }}></div>
            <div style={{ flex: 1 }}></div>
            <div style={{ flex: 1, textAlign: 'right', fontSize: 12, fontWeight: 'bold', color: '#1a73e8' }}>Rs.{openingBalance}</div>
          </div>

          {entriesWithBalance.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', padding: 16, fontSize: 12 }}>No transactions this month</div>
          )}

          {entriesWithBalance.map((e, i) => (
            <div key={i} style={{ display: 'flex', padding: '8px 8px', borderBottom: '1px solid #f5f5f5', alignItems: 'center', borderLeft: '3px solid ' + e.color }}>
              <div style={{ flex: 2 }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ background: e.color, color: 'white', fontSize: 9, padding: '1px 5px', borderRadius: 6 }}>{e.type}</span>
                  <span style={{ fontSize: 10, color: '#999' }}>{e.date}</span>
                </div>
                <div style={{ fontSize: 12, color: '#333', fontWeight: '500' }}>{e.description}</div>
                <div style={{ fontSize: 10, color: '#999' }}>{e.detail}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'right', fontSize: 12, fontWeight: 'bold', color: '#c62828' }}>
                {e.out > 0 ? 'Rs.' + e.out : ''}
              </div>
              <div style={{ flex: 1, textAlign: 'right', fontSize: 12, fontWeight: 'bold', color: '#2e7d32' }}>
                {e.in > 0 ? 'Rs.' + e.in : ''}
              </div>
              <div style={{ flex: 1, textAlign: 'right', fontSize: 12, fontWeight: 'bold', color: e.balance > 0 ? '#c62828' : '#2e7d32' }}>
                Rs.{Math.abs(e.balance)}
              </div>
            </div>
          ))}

          {/* Closing row */}
          {entriesWithBalance.length > 0 && (
            <div style={{ display: 'flex', padding: '8px 8px', background: '#e8f5e9', borderRadius: 6, marginTop: 4 }}>
              <div style={{ flex: 2, fontSize: 12, fontWeight: 'bold', color: '#2e7d32' }}>Closing Balance</div>
              <div style={{ flex: 1 }}></div>
              <div style={{ flex: 1 }}></div>
              <div style={{ flex: 1, textAlign: 'right', fontSize: 13, fontWeight: 'bold', color: '#c62828' }}>
                Rs.{openingBalance + monthTotalPurchases - monthTotalPayments}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TRANSACTION HISTORY (collapsed by default) */}
      {!showPassbook && history.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 'bold', color: '#333', marginBottom: 6 }}>Transaction History</div>
          {history.map((tx, i) => (
            <div key={i} style={{ borderLeft: '3px solid ' + tx.color, paddingLeft: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 'bold', color: '#333' }}>{tx.title}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>{tx.detail}</div>
                  <div style={{ fontSize: 10, color: '#999' }}>{fmtDateTime(tx.date)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 'bold', color: tx.color }}>{tx.sign}Rs.{tx.amount}</div>
                  <div style={{ fontSize: 10, background: tx.color, color: 'white', padding: '1px 6px', borderRadius: 8 }}>{tx.type}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!showPassbook && history.length === 0 && (
        <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>No transactions yet</div>
      )}
    </div>
  );
};

export default VendorCard;
