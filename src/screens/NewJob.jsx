import React, { useState } from 'react';
import { supabase } from '../supabase';

const NewJob = ({ form, setForm, handleSave, loading, vendors, stock, selectedParts, setSelectedParts, newParts, setNewParts, newPartForm, setNewPartForm, fetchAll, jobs, purchases }) => {

  const [showReferredSuggestions, setShowReferredSuggestions] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const referredSuggestions = jobs ? [...new Map(
    jobs.filter(j => j.customer_name && j.customer_name.toLowerCase().includes((form.referredBy || '').toLowerCase()) && j.customer_name !== form.referredBy)
    .map(j => [j.customer_name, j.phone])
  ).entries()].slice(0, 6) : [];

  const handlePhotoCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.onload = async () => {
      const maxSize = 800;
      let w = img.width, h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = (h / w) * maxSize; w = maxSize; }
        else { w = (w / h) * maxSize; h = maxSize; }
      }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(async (blob) => {
        const fileName = 'device_' + Date.now() + '.jpg';
        const { error } = await supabase.storage
          .from('device-photos')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
        if (!error) {
          const { data: urlData } = supabase.storage
            .from('device-photos')
            .getPublicUrl(fileName);
          setForm(f => ({ ...f, photoUrl: urlData.publicUrl }));
          alert('Photo uploaded!');
        } else {
          alert('Photo upload failed: ' + error.message);
        }
      }, 'image/jpeg', 0.7);
    };
    img.src = URL.createObjectURL(file);
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>{form.editId ? 'Edit Job' : 'New Repair Job'}</div>

      {/* BASIC FIELDS */}
      {[
        { label: 'Customer Name', name: 'customerName', placeholder: 'Enter name' },
        { label: 'Phone Number *', name: 'phone', placeholder: '9876543210', type: 'tel' },
        { label: 'Device Model', name: 'deviceModel', placeholder: 'e.g. Realme C35' },
        { label: 'Repair Price (Rs.) *', name: 'price', placeholder: '0', type: 'number' },
        { label: 'Job Date (leave empty for today)', name: 'jobDate', type: 'date' },
        { label: 'Delivery Date', name: 'deliveryDate', type: 'date' },
        { label: 'Delivery Time (optional)', name: 'deliveryTime', type: 'time' },
        { label: 'Advance Payment (optional)', name: 'advancePayment', placeholder: '0', type: 'number' },
        { label: 'Device Password (optional)', name: 'devicePassword', placeholder: 'PIN or pattern', type: 'text' },
      ].map(field => (
        <div key={field.name} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>{field.label}</div>
          <input name={field.name} type={field.type || 'text'} placeholder={field.placeholder} value={form[field.name] || ''} onChange={handleChange}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' }} />
        </div>
      ))}

      {/* REFERRED BY */}
      <div style={{ marginBottom: 14, position: 'relative' }}>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Referred By (optional)</div>
        <input type='text' placeholder='e.g. existing customer name'
          value={form.referredBy || ''}
          onChange={e => { setForm({ ...form, referredBy: e.target.value }); setShowReferredSuggestions(true); }}
          onFocus={() => setShowReferredSuggestions(true)}
          onBlur={() => setTimeout(() => setShowReferredSuggestions(false), 500)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' }} />
        {showReferredSuggestions && form.referredBy && form.referredBy.length > 0 && referredSuggestions.length > 0 && (
          <div style={{ position: 'absolute', left: 0, right: 0, background: 'white', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100, maxHeight: 200, overflowY: 'auto' }}>
            {referredSuggestions.map(([name, phone], i) => (
              <div key={i} onMouseDown={() => { setForm({ ...form, referredBy: name }); setShowReferredSuggestions(false); }}
                style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#333' }}>{name}</div>
                {phone && <div style={{ fontSize: 11, color: '#666' }}>📞 {phone}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CASH SALE TOGGLE */}
      <div style={{ marginBottom: 16, background: form.cashSale ? '#e8f5e9' : 'white', borderRadius: 10, padding: 12, border: '2px solid ' + (form.cashSale ? '#2e7d32' : '#ddd') }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: form.cashSale ? '#2e7d32' : '#333' }}>💵 Cash Sale</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Customer waiting — direct delivery</div>
          </div>
          <button onClick={() => setForm({ ...form, cashSale: !form.cashSale })}
            style={{ background: form.cashSale ? '#2e7d32' : '#ddd', color: 'white', border: 'none', borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}>
            {form.cashSale ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* PHOTO CAPTURE */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Device Photo (optional)</div>
        <input type='file' accept='image/*' capture='environment' onChange={handlePhotoCapture}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, boxSizing: 'border-box' }} />
        {form.photoUrl && (
          <div style={{ marginTop: 8 }}>
            <img src={form.photoUrl} alt='Device' style={{ width: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'cover' }} />
            <button onClick={() => setForm(f => ({ ...f, photoUrl: '' }))}
              style={{ width: '100%', marginTop: 6, background: '#c62828', color: 'white', border: 'none', borderRadius: 8, padding: 6, fontSize: 12, cursor: 'pointer' }}>
              Remove Photo
            </button>
          </div>
        )}
      </div>

      {/* COMPLAINT */}
      <div style={{ marginBottom: 16, position: 'relative' }}>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Complaint / Service / Software *</div>
        <textarea name="complaint" placeholder="e.g. Display replacement, Software flash, Network IC..." value={form.complaint || ''} onChange={handleChange} rows={3}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box', resize: 'none' }} />
        {form.complaint && form.complaint.length > 1 && (
          <div style={{ position: 'absolute', left: 0, right: 0, background: 'white', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100, maxHeight: 200, overflowY: 'auto' }}>
            {[...new Set(jobs.filter(j => j.complaint && j.complaint.toLowerCase().includes(form.complaint.toLowerCase()) && j.complaint !== form.complaint).map(j => j.complaint))].slice(0, 6).map((suggestion, i) => (
              <div key={i} onMouseDown={() => { setForm({ ...form, complaint: suggestion }); setTimeout(() => document.activeElement.blur(), 0); }}
                style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontSize: 13, color: '#333' }}>
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EXISTING PARTS — Edit mode mein dikhega */}
      {form.editId && selectedParts.filter(p => p.isExisting).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>Current Parts (Edit/Delete)</div>
          {selectedParts.filter(p => p.isExisting).map((part, i) => (
            <div key={i} style={{ background: '#e8f5e9', borderRadius: 8, padding: 10, marginBottom: 8, border: '1px solid #a5d6a7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#2e7d32' }}>{part.item_name}</div>
                <button onClick={() => setSelectedParts(selectedParts.filter((_, idx) => idx !== i))}
                  style={{ background: '#c62828', color: 'white', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: '#555' }}>Qty:</div>
                <button onClick={() => {
                  if (part.quantity <= 1) return;
                  setSelectedParts(selectedParts.map((p, idx) => idx === i ? { ...p, quantity: p.quantity - 1 } : p));
                }} style={{ width: 24, height: 24, borderRadius: 12, border: 'none', background: '#c62828', color: 'white', fontSize: 14, cursor: 'pointer' }}>-</button>
                <span style={{ fontWeight: 'bold', minWidth: 20, textAlign: 'center' }}>{part.quantity}</span>
                <button onClick={() => {
                  setSelectedParts(selectedParts.map((p, idx) => idx === i ? { ...p, quantity: p.quantity + 1 } : p));
                }} style={{ width: 24, height: 24, borderRadius: 12, border: 'none', background: '#2e7d32', color: 'white', fontSize: 14, cursor: 'pointer' }}>+</button>
                <div style={{ fontSize: 12, color: '#555', marginLeft: 8 }}>Rs.{part.rate} x {part.quantity} = Rs.{part.rate * part.quantity}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* USE FROM EXISTING STOCK */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>Use from Stock (optional)</div>
        {stock.filter(s => s.quantity > 0).length === 0 && (
          <div style={{ fontSize: 12, color: '#999' }}>No stock available.</div>
        )}
        {stock.filter(s => s.quantity > 0).map((item, i) => {
          const selected = selectedParts.find(p => p.item_name === item.item_name && !p.isExisting);
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
                      if (selected.quantity <= 1) setSelectedParts(selectedParts.filter(p => !(p.item_name === item.item_name && !p.isExisting)));
                      else setSelectedParts(selectedParts.map(p => (p.item_name === item.item_name && !p.isExisting) ? { ...p, quantity: p.quantity - 1 } : p));
                    }} style={{ width: 28, height: 28, borderRadius: 14, border: 'none', background: '#c62828', color: 'white', fontSize: 16, cursor: 'pointer' }}>-</button>
                    <span style={{ fontWeight: 'bold', minWidth: 20, textAlign: 'center' }}>{selected.quantity}</span>
                    <button onClick={() => {
                      if (selected.quantity >= item.quantity) { alert('Not enough stock!'); return; }
                      setSelectedParts(selectedParts.map(p => (p.item_name === item.item_name && !p.isExisting) ? { ...p, quantity: p.quantity + 1 } : p));
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
            if (!newPartForm.vendorId) { alert('Please select a vendor'); return; }
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
        style={{ width: '100%', background: loading ? '#aaa' : (form.cashSale ? '#2e7d32' : '#1a73e8'), color: 'white', border: 'none', borderRadius: 12, padding: 16, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>
        {loading ? 'Saving...' : form.editId ? 'Update Job' : (form.cashSale ? '💵 Save Cash Sale' : 'Save Job and Send WhatsApp')}
      </button>
    </div>
  );
};

export default NewJob;
