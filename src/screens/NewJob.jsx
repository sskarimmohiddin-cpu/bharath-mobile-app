import React from 'react';
import { supabase } from '../supabase';

const NewJob = ({ form, setForm, handleSave, loading, vendors, stock, selectedParts, setSelectedParts, newParts, setNewParts, newPartForm, setNewPartForm, fetchAll, jobs, purchases }) => {

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>{form.editId ? 'Edit Job' : 'New Repair Job'}</div>

      {[
        { label: 'Customer Name', name: 'customerName', placeholder: 'Enter name' },
        { label: 'Phone Number *', name: 'phone', placeholder: '9876543210', type: 'tel' },
        { label: 'Device Model', name: 'deviceModel', placeholder: 'e.g. Realme C35' },
        { label: 'Repair Price (Rs.) *', name: 'price', placeholder: '0', type: 'number' },
        { label: 'Job Date (leave empty for today)', name: 'jobDate', type: 'date' },
        { label: 'Delivery Date', name: 'deliveryDate', type: 'date' },
        { label: 'Delivery Time (optional)', name: 'deliveryTime', type: 'time' },
        { label: 'Advance Payment (optional)', name: 'advancePayment', placeholder: '0', type: 'number' },
      ].map(field => (
        <div key={field.name} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>{field.label}</div>
          <input name={field.name} type={field.type || 'text'} placeholder={field.placeholder} value={form[field.name] || ''} onChange={handleChange}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' }} />
        </div>
      ))}

<div style={{ marginBottom: 16, position: 'relative' }}>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Complaint / Service / Software *</div>
        <textarea name="complaint" placeholder="e.g. Display replacement, Software flash, Network IC..." value={form.complaint} onChange={handleChange} rows={3}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box', resize: 'none' }} />
        {form.complaint && form.complaint.length > 1 && (
          <div style={{ position: 'absolute', left: 0, right: 0, background: 'white', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100, maxHeight: 200, overflowY: 'auto' }}>
            {[...new Set(jobs.filter(j => j.complaint && j.complaint.toLowerCase().includes(form.complaint.toLowerCase()) && j.complaint !== form.complaint).map(j => j.complaint))].slice(0, 6).map((suggestion, i) => (
              <div key={i} onMouseDown={() => setForm({ ...form, complaint: suggestion })}
                style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontSize: 13, color: '#333' }}>
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* USE FROM EXISTING STOCK */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>Use from Stock (optional)</div>
        {stock.filter(s => s.quantity > 0).length === 0 && (
          <div style={{ fontSize: 12, color: '#999' }}>No stock available.</div>
        )}
        {stock.filter(s => s.quantity > 0).map((item, i) => {
          const selected = selectedParts.find(p => p.item_name === item.item_name);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: selected ? '#e8f5e9' : 'white', borderRadius: 8, padding: '8px 12px', marginBottom: 8, border: '1px solid ' + (selected ? '#2e7d32' : '#ddd') }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 'bold' }}>{item.item_name}</div>
                <div style={{ fontSize: 11, color: '#666' }}>Stock: {item.quantity} | Rs.{item.rate}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {selected ? (
                  <>
                    <button onClick={() => {
                      if (selected.quantity <= 1) setSelectedParts(selectedParts.filter(p => p.item_name !== item.item_name));
                      else setSelectedParts(selectedParts.map(p => p.item_name === item.item_name ? { ...p, quantity: p.quantity - 1 } : p));
                    }} style={{ width: 28, height: 28, borderRadius: 14, border: 'none', background: '#c62828', color: 'white', fontSize: 16, cursor: 'pointer' }}>-</button>
                    <span style={{ fontWeight: 'bold', minWidth: 20, textAlign: 'center' }}>{selected.quantity}</span>
                    <button onClick={() => {
                      if (selected.quantity >= item.quantity) { alert('Not enough stock!'); return; }
                      setSelectedParts(selectedParts.map(p => p.item_name === item.item_name ? { ...p, quantity: p.quantity + 1 } : p));
                    }} style={{ width: 28, height: 28, borderRadius: 14, border: 'none', background: '#2e7d32', color: 'white', fontSize: 16, cursor: 'pointer' }}>+</button>
                  </>
                ) : (
                  <button onClick={() => setSelectedParts([...selectedParts, { item_name: item.item_name, quantity: 1, rate: item.rate }])}
                    style={{ padding: '4px 12px', borderRadius: 8, border: 'none', background: '#1a73e8', color: 'white', fontSize: 12, cursor: 'pointer' }}>Add</button>
                )}
              </div>
            </div>
          );
        })}
        {selectedParts.length > 0 && (
          <div style={{ background: '#e8f5e9', borderRadius: 8, padding: '8px 12px', marginTop: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2e7d32' }}>Stock Parts Cost: Rs.{selectedParts.reduce((s, p) => s + (p.quantity * p.rate), 0)}</div>
          </div>
        )}
      </div>

      {/* BUY NEW PART */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>Buy New Part / Service for this Job (optional)</div>
        {newParts.map((part, i) => (
          <div key={i} style={{ background: '#fff8e1', borderRadius: 8, padding: 10, marginBottom: 8, border: '1px solid #ffe082' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#e65100' }}>{part.itemName}</div>
              <button onClick={() => setNewParts(newParts.filter((_, idx) => idx !== i))}
                style={{ background: '#c62828', color: 'white', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>Remove</button>
            </div>
            <div style={{ fontSize: 11, color: '#666' }}>{part.vendorId ? vendors.find(v => v.id === Number(part.vendorId))?.name : ''} | Qty: {part.quantity} x Rs.{part.rate} = Rs.{Number(part.quantity) * Number(part.rate)} | {part.paymentType}</div>
          </div>
        ))}
        <div style={{ background: 'white', borderRadius: 8, padding: 12, border: '1px solid #ddd' }}>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>Vendor</div>
            <select value={newPartForm.vendorId} onChange={async e => {
                  if (e.target.value === 'new') {
                    const name = prompt('Enter new vendor name:');
                    if (!name) return;
                    const phone = prompt('Enter vendor phone (optional):') || '';
                    const { data } = await supabase.from('vendors').insert([{ name, phone, balance: 0 }]).select();
                    if (data && data[0]) {
                      await fetchAll();
                      setNewPartForm({ ...newPartForm, vendorId: String(data[0].id) });
                    }
                  } else {
                    setNewPartForm({ ...newPartForm, vendorId: e.target.value });
                  }
                }}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }}>
              <option value=''>Select vendor...</option>
              <option value='new'>+ Add New Vendor</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 8, position: 'relative' }}>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>Item / Service / Software Name</div>
              <input type='text' placeholder='e.g. LCD, Software flash, IC' value={newPartForm.itemName}
                onChange={e => setNewPartForm({ ...newPartForm, itemName: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
              {newPartForm.itemName && newPartForm.itemName.length > 1 && (
                <div style={{ position: 'absolute', left: 0, right: 0, background: 'white', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100, maxHeight: 180, overflowY: 'auto' }}>
                  {[...new Set([
                    ...stock.filter(s => s.item_name.toLowerCase().includes(newPartForm.itemName.toLowerCase())).map(s => s.item_name),
                    ...purchases.filter(p => p.item_name.toLowerCase().includes(newPartForm.itemName.toLowerCase())).map(p => p.item_name),
                  ])].slice(0, 6).map((name, i) => {
                    const item = stock.find(s => s.item_name === name) || purchases.find(p => p.item_name === name);
                    return (
                      <div key={i} onClick={() => setNewPartForm({ ...newPartForm, itemName: name, rate: String(item ? item.rate : '') })}
                        style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
                        <div style={{ fontSize: 13, fontWeight: 'bold', color: '#333' }}>{name}</div>
                        {item && <div style={{ fontSize: 11, color: '#666' }}>Rs.{item.rate}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {[
              { label: 'Quantity', key: 'quantity', placeholder: '1', type: 'number' },
              { label: 'Rate (Rs.)', key: 'rate', placeholder: '0', type: 'number' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>{field.label}</div>
                <input type={field.type || 'text'} placeholder={field.placeholder} value={newPartForm[field.key]}
                  onChange={e => setNewPartForm({ ...newPartForm, [field.key]: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
            ))}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>Payment Type</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Credit', 'Cash'].map(type => (
                <button key={type} onClick={() => setNewPartForm({ ...newPartForm, paymentType: type })}
                  style={{ flex: 1, padding: 8, borderRadius: 8, border: '2px solid ' + (newPartForm.paymentType === type ? '#1a73e8' : '#ddd'), background: newPartForm.paymentType === type ? '#e8f1fd' : 'white', color: newPartForm.paymentType === type ? '#1a73e8' : '#555', fontWeight: 'bold', cursor: 'pointer', fontSize: 13 }}>
                  {type}
                </button>
              ))}
            </div>
          </div>
          {newPartForm.quantity && newPartForm.rate && (
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#e65100', marginBottom: 8 }}>
              Total: Rs.{Number(newPartForm.quantity) * Number(newPartForm.rate)}
            </div>
          )}
          <button onClick={() => {
            if (!newPartForm.itemName || !newPartForm.rate) { alert('Enter item name and rate'); return; }
            setNewParts([...newParts, { ...newPartForm }]);
            setNewPartForm({ vendorId: '', itemName: '', quantity: '1', rate: '', paymentType: 'Credit' });
          }}
            style={{ width: '100%', background: '#e65100', color: 'white', border: 'none', borderRadius: 8, padding: 10, fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}>
            + Add to Job
          </button>
        </div>
        {newParts.length > 0 && (
          <div style={{ background: '#fff3e0', borderRadius: 8, padding: '8px 12px', marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#e65100' }}>New Parts Cost: Rs.{newParts.reduce((s, p) => s + (Number(p.quantity) * Number(p.rate)), 0)}</div>
          </div>
        )}
      </div>

      <button onClick={handleSave} disabled={loading}
        style={{ width: '100%', background: loading ? '#aaa' : '#2e7d32', color: 'white', border: 'none', borderRadius: 12, padding: 16, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>
        {loading ? 'Saving...' : form.editId ? 'Update Job' : 'Save Job and Send WhatsApp'}
      </button>
    </div>
  );
};

export default NewJob;