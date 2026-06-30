import React, { useState } from 'react';
import { supabase } from '../supabase';
import { fmtDateTime } from '../utils/format';

const Purchase = ({ vendors, purchases, vendorPayments, purchaseForm, setPurchaseForm, savePurchase, fetchAll }) => {
  const [editItem, setEditItem] = useState(null);

  const getVendorBalance = (vendorName) => {
    const vPurchases = purchases.filter(p => p.vendor_name === vendorName && p.payment_type === 'Credit').reduce((s, p) => s + Number(p.total || 0), 0);
    const vPayments = (vendorPayments || []).filter(vp => vp.vendor_name === vendorName).reduce((s, vp) => s + Number(vp.amount || 0), 0);
    return vPurchases - vPayments;
  };

  const getVendorBalance = (vendorName) => {
    const vPurchases = purchases.filter(p => p.vendor_name === vendorName && p.payment_type === 'Credit').reduce((s, p) => s + Number(p.total || 0), 0);
    return vPurchases;
  };

  const saveEdit = async () => {
    if (!editItem.item_name || !editItem.quantity || !editItem.rate) {
      alert('Please fill all fields'); return;
    }
    const newTotal = Number(editItem.quantity) * Number(editItem.rate);
    const diff = newTotal - editItem.oldTotal;
    await supabase.from('purchases').update({
      item_name: editItem.item_name,
      quantity: Number(editItem.quantity),
      rate: Number(editItem.rate),
      total: newTotal,
    }).eq('id', editItem.id);
    if (editItem.payment_type === 'Credit') {
      const vendor = vendors.find(v => v.name === editItem.vendor_name);
      if (vendor) await supabase.from('vendors').update({ balance: vendor.balance + diff }).eq('id', vendor.id);
    }
    alert('Purchase updated!');
    setEditItem(null);
    fetchAll();
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>Purchase Stock</div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Select Vendor *</div>
        <select value={purchaseForm.vendorId} onChange={async e => {
          if (e.target.value === 'new') {
            const name = prompt('Enter new vendor name:');
            if (!name) return;
            const phone = prompt('Enter vendor phone (optional):') || '';
            const { data } = await supabase.from('vendors').insert([{ name, phone, balance: 0 }]).select();
            if (data && data[0]) {
              await fetchAll();
              setPurchaseForm({ ...purchaseForm, vendorId: String(data[0].id) });
            }
          } else {
            setPurchaseForm({ ...purchaseForm, vendorId: e.target.value });
          }
        }}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' }}>
         <option value=''>Select vendor...</option>
      <option value='new'>+ Add New Vendor</option>
      {vendors.map(v => <option key={v.id} value={v.id}>{v.name} (Balance: Rs.{getVendorBalance(v.name)})</option>)}
        </select>
      </div>
      {[
        { label: 'Item / Service / Software Name *', key: 'itemName', placeholder: 'e.g. LCD Samsung A32' },
        { label: 'Quantity *', key: 'quantity', placeholder: '1', type: 'number' },
        { label: 'Rate per item (Rs.) *', key: 'rate', placeholder: '0', type: 'number' },
      ].map(field => (
        <div key={field.key} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>{field.label}</div>
          <input type={field.type || 'text'} placeholder={field.placeholder} value={purchaseForm[field.key]}
            onChange={e => setPurchaseForm({ ...purchaseForm, [field.key]: e.target.value })}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' }} />
        </div>
      ))}
      {purchaseForm.quantity && purchaseForm.rate && (
        <div style={{ background: '#e8f5e9', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#2e7d32' }}>Total: Rs.{Number(purchaseForm.quantity) * Number(purchaseForm.rate)}</div>
        </div>
      )}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Payment Type</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {['Credit', 'Cash'].map(type => (
            <button key={type} onClick={() => setPurchaseForm({ ...purchaseForm, paymentType: type })}
              style={{ flex: 1, padding: 10, borderRadius: 8, border: '2px solid ' + (purchaseForm.paymentType === type ? '#1a73e8' : '#ddd'), background: purchaseForm.paymentType === type ? '#e8f1fd' : 'white', color: purchaseForm.paymentType === type ? '#1a73e8' : '#555', fontWeight: 'bold', cursor: 'pointer', fontSize: 14 }}>
              {type}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Purchase Date</div>
        <input type='date' value={purchaseForm.purchaseDate || new Date().toISOString().split('T')[0]}
          onChange={e => setPurchaseForm({ ...purchaseForm, purchaseDate: e.target.value })}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' }} />
      </div>
      <button onClick={savePurchase}
        style={{ width: '100%', background: '#e65100', color: 'white', border: 'none', borderRadius: 12, padding: 16, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>
        Save Purchase
      </button>
      <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 24, marginBottom: 10 }}>Recent Purchases</div>
      {purchases.slice(0, 20).map((p, i) => (
        <div key={i} style={{ background: 'white', borderRadius: 10, padding: 12, marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          {editItem && editItem.id === p.id ? (
            <div>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#e65100', marginBottom: 8 }}>Editing Purchase</div>
              {[
                { label: 'Item Name', key: 'item_name' },
                { label: 'Quantity', key: 'quantity', type: 'number' },
                { label: 'Rate (Rs.)', key: 'rate', type: 'number' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>{field.label}</div>
                  <input type={field.type || 'text'} value={editItem[field.key]}
                    onChange={e => setEditItem({ ...editItem, [field.key]: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
              ))}
              {editItem.quantity && editItem.rate && (
                <div style={{ background: '#e8f5e9', borderRadius: 8, padding: '6px 10px', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2e7d32' }}>New Total: Rs.{Number(editItem.quantity) * Number(editItem.rate)}</div>
                </div>
              )}
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
                <div style={{ fontWeight: 'bold', fontSize: 14 }}>{p.item_name}</div>
                <div style={{ fontWeight: 'bold', color: '#c62828' }}>Rs.{p.total}</div>
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                {p.vendor_name} | Qty: {p.quantity} x Rs.{p.rate} | {p.payment_type}
              </div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                {fmtDateTime(p.created_at)}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => setEditItem({ ...p, oldTotal: p.total })}
                  style={{ flex: 1, background: '#555', color: 'white', border: 'none', borderRadius: 8, padding: 6, fontSize: 12, cursor: 'pointer' }}>
                  Edit
                </button>
                <button onClick={async () => {
                  if (window.confirm('Delete this purchase?')) {
                    await supabase.from('purchases').delete().eq('id', p.id);
                    if (p.payment_type === 'Credit') {
                      const vendor = vendors.find(v => v.name === p.vendor_name);
                      if (vendor) await supabase.from('vendors').update({ balance: vendor.balance - p.total }).eq('id', vendor.id);
                    }
                    const { data: stockItem } = await supabase
                      .from('stock').select('*')
                      .eq('item_name', p.item_name).single();
                    if (stockItem) {
                      const newQty = stockItem.quantity - Number(p.quantity);
                      await supabase.from('stock')
                        .update({ quantity: newQty < 0 ? 0 : newQty })
                        .eq('item_name', p.item_name);
                    }
                    fetchAll();
                  }
                }} style={{ flex: 1, background: '#c62828', color: 'white', border: 'none', borderRadius: 8, padding: 6, fontSize: 12, cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Purchase;