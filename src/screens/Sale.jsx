import React, { useState } from 'react';
import { supabase } from '../supabase';
import { fmtDateTime } from '../utils/format';

const Sale = ({ sales, saleForm, setSaleForm, saveSale, fetchAll, stock, vendors, purchases }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newPurchase, setNewPurchase] = useState({
    vendorId: '', itemName: '', quantity: '1', rate: '', paymentType: 'Credit',
  });
  const [showPurchase, setShowPurchase] = useState(false);
  const [purchaseSuggestions, setPurchaseSuggestions] = useState(false);

  const suggestions = stock ? stock.filter(s =>
    saleForm.itemName && s.item_name.toLowerCase().includes(saleForm.itemName.toLowerCase())
  ) : [];

  const purchaseNameSuggestions = [...new Set([
    ...stock.filter(s => s.item_name.toLowerCase().includes(newPurchase.itemName.toLowerCase())).map(s => s.item_name),
    ...purchases.filter(p => p.item_name.toLowerCase().includes(newPurchase.itemName.toLowerCase())).map(p => p.item_name),
  ])].slice(0, 6);

  const handleSaveAll = async () => {
    if (!saleForm.itemName || !saleForm.quantity || !saleForm.price) {
      alert('Please fill item, quantity and price'); return;
    }
    const total = Number(saleForm.quantity) * Number(saleForm.price);
    if (Number(saleForm.quantity) <= 0 || Number(saleForm.price) <= 0) {
      alert('Quantity and price must be greater than 0'); return;
    }
    const saleId = 'SAL-' + Date.now().toString().slice(-4);
    const autoPurchaseCost = showPurchase && newPurchase.rate ? Number(newPurchase.rate) : Number(saleForm.purchaseCost) || 0;
    const { error } = await supabase.from('sales').insert([{
      sale_id: saleId,
      item_name: saleForm.itemName, quantity: Number(saleForm.quantity),
      price: Number(saleForm.price), total: total,
      purchase_cost: autoPurchaseCost,
      customer_phone: saleForm.customerPhone,
    }]);
    if (error) { alert('Error: ' + error.message); return; }

    if (saleForm.customerPhone) {
      const message = 'Hello! Thank you for purchasing from Bharath Mobile Service. Item: ' + saleForm.itemName + ' x' + saleForm.quantity + '. Total: Rs.' + total + '. Thank you!';
      if (window.confirm('Send WhatsApp to ' + saleForm.customerPhone + '?')) {
        window.open('https://wa.me/91' + saleForm.customerPhone + '?text=' + encodeURIComponent(message));
      }
    }

    if (showPurchase && newPurchase.itemName && newPurchase.rate && newPurchase.vendorId) {
      const purchaseTotal = Number(newPurchase.quantity) * Number(newPurchase.rate);
      const vendor = vendors.find(v => v.id === Number(newPurchase.vendorId));
      if (vendor) {
        await supabase.from('purchases').insert([{
          vendor_id: Number(newPurchase.vendorId), vendor_name: vendor.name,
          item_name: newPurchase.itemName, quantity: Number(newPurchase.quantity),
          rate: Number(newPurchase.rate), total: purchaseTotal,
          payment_type: newPurchase.paymentType,
          purchase_date: new Date().toISOString().split('T')[0],
        }]);
        if (newPurchase.paymentType === 'Credit') {
          await supabase.from('vendors').update({ balance: vendor.balance + purchaseTotal }).eq('id', vendor.id);
        }
        const { data: existingStock } = await supabase.from('stock').select('*').eq('item_name', newPurchase.itemName).single();
        if (existingStock) {
          await supabase.from('stock').update({
            quantity: existingStock.quantity + Number(newPurchase.quantity) - Number(saleForm.quantity),
            rate: Number(newPurchase.rate),
          }).eq('item_name', newPurchase.itemName);
        } else {
          await supabase.from('stock').insert([{
            item_name: newPurchase.itemName,
            quantity: Number(newPurchase.quantity) - Number(saleForm.quantity),
            rate: Number(newPurchase.rate),
          }]);
        }
      }
    } else {
      const stockItem = stock ? stock.find(s => s.item_name === saleForm.itemName) : null;
      if (stockItem) {
        const newQty = stockItem.quantity - Number(saleForm.quantity);
        await supabase.from('stock').update({ quantity: newQty < 0 ? 0 : newQty }).eq('item_name', saleForm.itemName);
      }
    }

    alert('Sale saved! Rs.' + total);
    setSaleForm({ itemName: '', quantity: '', price: '', customerPhone: '' });
    setNewPurchase({ vendorId: '', itemName: '', quantity: '1', rate: '', paymentType: 'Credit' });
    setShowPurchase(false);
    fetchAll();
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>Accessories Sale</div>

      {/* ITEM NAME WITH SUGGESTIONS */}
      <div style={{ marginBottom: 14, position: 'relative' }}>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Item Name *</div>
        <input type='text' placeholder='e.g. Tempered Glass, Cover'
          value={saleForm.itemName}
          onChange={e => { setSaleForm({ ...saleForm, itemName: e.target.value }); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 500)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' }} />
        {showSuggestions && suggestions.length > 0 && (
          <div style={{ position: 'absolute', left: 0, right: 0, background: 'white', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100, maxHeight: 200, overflowY: 'auto' }}>
            {suggestions.map((item, i) => (
              <div key={i} onMouseDown={() => {
                setSaleForm({ ...saleForm, itemName: item.item_name, price: String(item.rate) });
                setShowSuggestions(false);
              }}
                style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: '#333' }}>{item.item_name}</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Stock: {item.quantity} | Rate: Rs.{item.rate}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OTHER SALE FIELDS */}
      {[
        { label: 'Quantity *', key: 'quantity', placeholder: '1', type: 'number' },
        { label: 'Sale Price per item (Rs.) *', key: 'price', placeholder: '0', type: 'number' },
        { label: 'Purchase Cost per item (Rs.)', key: 'purchaseCost', placeholder: '0', type: 'number' },
        { label: 'Customer Phone (optional)', key: 'customerPhone', placeholder: '9876543210', type: 'tel' },
      ].map(field => (
        <div key={field.key} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>{field.label}</div>
          <input type={field.type || 'text'} placeholder={field.placeholder} value={saleForm[field.key]}
            onChange={e => setSaleForm({ ...saleForm, [field.key]: e.target.value })}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' }} />
        </div>
      ))}

{saleForm.quantity && saleForm.price && (
        <div style={{ background: '#e8f5e9', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#2e7d32' }}>Sale Total: Rs.{Number(saleForm.quantity) * Number(saleForm.price)}</div>
          {saleForm.purchaseCost && (
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#1a73e8', marginTop: 4 }}>
              Profit: Rs.{(Number(saleForm.price) - Number(saleForm.purchaseCost)) * Number(saleForm.quantity)}
            </div>
          )}
        </div>
      )}

      {/* BUY NEW ITEM TOGGLE */}
      <button onClick={() => setShowPurchase(!showPurchase)}
        style={{ width: '100%', background: showPurchase ? '#e8f1fd' : 'white', color: '#1a73e8', border: '2px solid #1a73e8', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', marginBottom: 14 }}>
        {showPurchase ? '− Remove Purchase' : '+ Buy New Item for this Sale'}
      </button>

      {/* BUY NEW ITEM SECTION */}
      {showPurchase && (
        <div style={{ background: '#fff8e1', borderRadius: 10, padding: 14, marginBottom: 14, border: '1px solid #ffe082' }}>
          <div style={{ fontSize: 13, fontWeight: 'bold', color: '#e65100', marginBottom: 10 }}>Purchase Details</div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>Vendor *</div>
            <select value={newPurchase.vendorId} onChange={async e => {
              if (e.target.value === 'new') {
                const name = prompt('Enter new vendor name:');
                if (!name) return;
                const phone = prompt('Enter vendor phone (optional):') || '';
                const { data } = await supabase.from('vendors').insert([{ name, phone, balance: 0 }]).select();
                if (data && data[0]) { await fetchAll(); setNewPurchase({ ...newPurchase, vendorId: String(data[0].id) }); }
              } else {
                setNewPurchase({ ...newPurchase, vendorId: e.target.value });
              }
            }}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }}>
              <option value=''>Select vendor...</option>
              <option value='new'>+ Add New Vendor</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>

          {/* ITEM NAME WITH SUGGESTIONS */}
          <div style={{ marginBottom: 10, position: 'relative' }}>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>Item Name *</div>
            <input type='text' placeholder='e.g. Tempered Glass' value={newPurchase.itemName}
              onChange={e => { setNewPurchase({ ...newPurchase, itemName: e.target.value }); setPurchaseSuggestions(true); }}
              onFocus={() => setPurchaseSuggestions(true)}
              onBlur={() => setTimeout(() => setPurchaseSuggestions(false), 200)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
            {purchaseSuggestions && newPurchase.itemName.length > 1 && purchaseNameSuggestions.length > 0 && (
              <div style={{ position: 'absolute', left: 0, right: 0, background: 'white', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100, maxHeight: 150, overflowY: 'auto' }}>
                {purchaseNameSuggestions.map((name, i) => {
                  const item = stock.find(s => s.item_name === name) || purchases.find(p => p.item_name === name);
                  return (
                    <div key={i} onClick={() => { setNewPurchase({ ...newPurchase, itemName: name, rate: String(item ? item.rate : '') }); setPurchaseSuggestions(false); }}
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
            { label: 'Quantity *', key: 'quantity', placeholder: '1', type: 'number' },
            { label: 'Rate per item (Rs.) *', key: 'rate', placeholder: '0', type: 'number' },
          ].map(field => (
            <div key={field.key} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>{field.label}</div>
              <input type={field.type} placeholder={field.placeholder} value={newPurchase[field.key]}
                onChange={e => setNewPurchase({ ...newPurchase, [field.key]: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          ))}

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>Payment Type</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Credit', 'Cash'].map(type => (
                <button key={type} onClick={() => setNewPurchase({ ...newPurchase, paymentType: type })}
                  style={{ flex: 1, padding: 8, borderRadius: 8, border: '2px solid ' + (newPurchase.paymentType === type ? '#1a73e8' : '#ddd'), background: newPurchase.paymentType === type ? '#e8f1fd' : 'white', color: newPurchase.paymentType === type ? '#1a73e8' : '#555', fontWeight: 'bold', cursor: 'pointer', fontSize: 13 }}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          {newPurchase.quantity && newPurchase.rate && (
            <div style={{ background: '#fff3e0', borderRadius: 8, padding: '8px 12px' }}>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#e65100' }}>Purchase Total: Rs.{Number(newPurchase.quantity) * Number(newPurchase.rate)}</div>
            </div>
          )}
        </div>
      )}

      <button onClick={handleSaveAll}
        style={{ width: '100%', background: '#2e7d32', color: 'white', border: 'none', borderRadius: 12, padding: 16, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>
        Save Sale {showPurchase ? '& Purchase' : ''}
      </button>

      {/* RECENT SALES */}
      <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 24, marginBottom: 10 }}>Recent Sales</div>
      {sales.slice(0, 10).map((s, i) => (
        <div key={i} style={{ background: 'white', borderRadius: 10, padding: 12, marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 'bold', fontSize: 14 }}>{s.sale_id ? s.sale_id + ' — ' : ''}{s.item_name}</div>
            <div style={{ fontWeight: 'bold', color: '#2e7d32' }}>Rs.{s.total}</div>
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Qty: {s.quantity} x Rs.{s.price}</div>
          {s.purchase_cost > 0 && (
            <div style={{ fontSize: 12, color: '#1a73e8', marginTop: 2 }}>
              Profit: Rs.{(Number(s.price) - Number(s.purchase_cost)) * Number(s.quantity)}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>📅 {fmtDateTime(s.created_at)}</div>
          <button onClick={async () => {
            if (window.confirm('Delete this sale?')) {
              await supabase.from('sales').delete().eq('id', s.id);
              fetchAll();
            }
          }} style={{ width: '100%', marginTop: 8, background: '#c62828', color: 'white', border: 'none', borderRadius: 8, padding: 6, fontSize: 12, cursor: 'pointer' }}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

export default Sale;