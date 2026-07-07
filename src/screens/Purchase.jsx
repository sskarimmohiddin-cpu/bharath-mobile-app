import React, { useState } from 'react';
import { supabase } from '../supabase';
import { fmtDateTime } from '../utils/format';

const Purchase = ({ vendors, purchases, vendorPayments, purchaseForm, setPurchaseForm, newPurchaseItems, setNewPurchaseItems, savePurchase, fetchAll }) => {
  const [editItem, setEditItem] = useState(null);

  const getVendorBalance = (vendorName) => {
    const vPurchases = purchases.filter(p => p.vendor_name === vendorName && p.payment_type === 'Credit').reduce((s, p) => s + Number(p.total || 0), 0);
    const vPayments = (vendorPayments || []).filter(vp => vp.vendor_name === vendorName).reduce((s, vp) => s + Number(vp.amount || 0), 0);
    return vPurchases - vPayments;
  };

  const addItem = () => {
    if (!purchaseForm.itemName || !purchaseForm.quantity || !purchaseForm.rate) {
      alert('Please fill item name, quantity and rate'); return;
    }
    setNewPurchaseItems([...newPurchaseItems, {
      itemName: purchaseForm.itemName, quantity: purchaseForm.quantity, rate: purchaseForm.rate,
    }]);
    setPurchaseForm({ ...purchaseForm, itemName: '', quantity: '', rate: '' });
  };

  const removeItem = (idx) => {
    setNewPurchaseItems(newPurchaseItems.filter((_, i) => i !== idx));
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

  const deleteItem = async (p) => {
    if (!window.confirm('Delete this item?')) return;
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
  };

  const renderItemRow = (p) => (
    editItem && editItem.id === p.id ? (
      <div key={p.id} style={{ marginBottom: 10, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 'bold', color: '#e65100', marginBottom: 8 }}>Editing Item</div>
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
      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #eee' }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 13 }}>{p.item_name}</div>
          <div style={{ fontSize: 11, color: '#666' }}>Qty: {p.quantity} x Rs.{p.rate}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontWeight: 'bold', color: '#c62828', fontSize: 13 }}>Rs.{p.total}</div>
          <button onClick={() => setEditItem({ ...p, oldTotal: p.total })}
            style={{ background: '#555', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>
            Edit
          </button>
          <button onClick={() => deleteItem(p)}
            style={{ background: '#c62828', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>
            Delete
          </button>
        </div>
      </div>
    )
  );

  const grouped = {};
  const ungrouped = [];
  purchases.forEach(p => {
    if (p.bill_id) {
      if (!grouped[p.bill_id]) grouped[p.bill_id] = [];
      grouped[p.bill_id].push(p);
    } else {
      ungrouped.push(p);
    }
  });
  const billGroups = Object.keys(grouped).map(billId => ({
    billId: Number(billId),
    items: grouped[billId],
  })).sort((a, b) => b.billId - a.billId).slice(0, 15);

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
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#2e7d32' }}>Item Total: Rs.{Number(purchaseForm.quantity) * Number(purchaseForm.rate)}</div>
        </div>
      )}
      <button onClick={addItem}
        style={{ width: '100%', background: '#1a73e8', color: 'white', border: 'none', borderRadius: 8, padding: 10, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', marginBottom: 14 }}>
        + Add Item
      </button>

      {newPurchaseItems.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 6 }}>Items to Purchase ({newPurchaseItems.length}):</div>
          {newPurchaseItems.map((item, i) => (
            <div key={i} style={{ background: '#f5f5f5', borderRadius: 8, padding: 10, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 13 }}>{item.itemName}</div>
                <div style={{ fontSize: 11, color: '#666' }}>Qty: {item.quantity} x Rs.{item.rate} = Rs.{Number(item.quantity) * Number(item.rate)}</div>
              </div>
              <button onClick={() => removeItem(i)}
                style={{ background: '#c62828', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
                Remove
              </button>
            </div>
          ))}
          <div style={{ background: '#e8f5e9', borderRadius: 8, padding: '10px 12px', marginTop: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#2e7d32' }}>
              Grand Total: Rs.{newPurchaseItems.reduce((s, item) => s + Number(item.quantity) * Number(item.rate), 0)}
            </div>
          </div>
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
      {billGroups.map(group => {
        const first = group.items[0];
        const billTotal = group.items.reduce((s, it) => s + Number(it.total || 0), 0);
        return (
          <div key={group.billId} style={{ background: 'white', borderRadius: 10, padding: 12, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontWeight: 'bold', fontSize: 14, color: '#1a73e8' }}>Bill #{group.billId}</div>
              <div style={{ fontWeight: 'bold', color: '#c62828', fontSize: 14 }}>Rs.{billTotal}</div>
            </div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
              {first.vendor_name} | {first.payment_type} | {fmtDateTime(first.created_at)}
            </div>
            {group.items.map(p => renderItemRow(p))}
          </div>
        );
      })}
      {ungrouped.slice(0, 20).map(p => (
        <div key={p.id} style={{ background: 'white', borderRadius: 10, padding: 12, marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          {renderItemRow(p)}
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            {p.vendor_name} | {p.payment_type}
          </div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
            {fmtDateTime(p.created_at)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Purchase;
