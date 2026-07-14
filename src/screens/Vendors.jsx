import React from 'react';
import { supabase } from '../supabase';
import { fmtDateTime } from '../utils/format';
import VendorCard from '../components/VendorCard';

const Vendors = ({ vendors, purchases, vendorPayments, filteredTx, filterDateFrom, filterDateTo, setFilterDateFrom, setFilterDateTo, vendorPayable, fetchAll, bankAccounts }) => (
  <div style={{ padding: 20 }}>
    <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>Vendor Balances</div>

    {/* ADD NEW VENDOR */}
    <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>Add New Vendor</div>
      <input type='text' placeholder='Vendor name *' id='vname'
        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box', marginBottom: 8 }} />
      <input type='tel' placeholder='Phone number' id='vphone'
        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box', marginBottom: 8 }} />
      <button onClick={async () => {
        const name = document.getElementById('vname').value;
        const phone = document.getElementById('vphone').value;
        if (!name) { alert('Enter vendor name'); return; }
        await supabase.from('vendors').insert([{ name, phone, balance: 0 }]);
        document.getElementById('vname').value = '';
        document.getElementById('vphone').value = '';
        fetchAll();
        alert('Vendor ' + name + ' added!');
      }}
        style={{ width: '100%', background: '#6a1b9a', color: 'white', border: 'none', borderRadius: 8, padding: 10, fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>
        Add Vendor
      </button>
    </div>

    {/* VENDOR CARDS */}
    {vendors.map((v, i) => (
      <VendorCard key={i} v={v}
        purchases={purchases}
        vendorPayments={vendorPayments}
        vendors={vendors}
        fetchAll={fetchAll}
        bankAccounts={bankAccounts}
      />
    ))}

    {/* TOTAL PAYABLE */}
    <div style={{ background: '#fff3e0', borderRadius: 12, padding: 16, marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 'bold', color: '#e65100' }}>Total Payable</div>
        <div style={{ fontWeight: 'bold', color: '#e65100', fontSize: 16 }}>Rs.{vendorPayable}</div>
      </div>
    </div>

    {/* ALL TRANSACTIONS */}
    <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 24, marginBottom: 8 }}>All Transactions</div>
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
              <div style={{ fontSize: 11, color: '#999' }}>{fmtDateTime(tx.date)}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>{tx.title}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{tx.detail}</div>
          </div>
          <div style={{ textAlign: 'right', minWidth: 70 }}>
            <div style={{ fontSize: 15, fontWeight: 'bold', color: tx.color }}>{tx.sign}Rs.{tx.amount}</div>
            <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{tx.status}</div>
          </div>
        </div>
        {tx.type === 'Payment' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={async () => {
              const newAmount = prompt('Edit payment amount:\nCurrent: Rs.' + tx.amount);
              if (!newAmount) return;
              const diff = Number(newAmount) - Number(tx.amount);
              await supabase.from('vendor_payments').update({ amount: Number(newAmount) }).eq('id', tx.id);
              const vendor = vendors.find(v => v.name === tx.vendorName);
              if (vendor) await supabase.from('vendors').update({ balance: vendor.balance - diff }).eq('id', vendor.id);
              fetchAll();
            }} style={{ flex: 1, background: '#555', color: 'white', border: 'none', borderRadius: 8, padding: 6, fontSize: 12, cursor: 'pointer' }}>
              Edit
            </button>
            <button onClick={async () => {
              if (window.confirm('Delete this payment?')) {
                await supabase.from('vendor_payments').delete().eq('id', tx.id);
                const vendor = vendors.find(v => v.name === tx.vendorName);
                if (vendor) await supabase.from('vendors').update({ balance: vendor.balance + Number(tx.amount) }).eq('id', vendor.id);
                fetchAll();
              }
            }} style={{ flex: 1, background: '#c62828', color: 'white', border: 'none', borderRadius: 8, padding: 6, fontSize: 12, cursor: 'pointer' }}>
              Delete
            </button>
          </div>
        )}
      </div>
    ))}
  </div>
);

export default Vendors;