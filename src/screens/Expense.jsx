import React, { useState } from 'react';
import { supabase } from '../supabase';
import { fmtDateTime } from '../utils/format';

const Expense = ({ expenses, expenseForm, setExpenseForm, saveExpense, fetchAll, cashInHand }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const istOff = 5.5 * 60 * 60000;
  const currentMonth = new Date(new Date().getTime() + istOff).toISOString().slice(0, 7);
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterCategory, setFilterCategory] = useState('');

  const suggestions = expenses ? [...new Set(
    expenses.filter(e => e.description && e.description.toLowerCase().includes((expenseForm.description || '').toLowerCase()) && e.description !== expenseForm.description)
    .map(e => e.description)
  )].slice(0, 6) : [];

  return (
    <div style={{ padding: 20 }}>

      {/* CASH IN HAND PORTAL */}
      <div style={{ background: 'linear-gradient(135deg, #1a73e8, #0d47a1)', borderRadius: 12, padding: 16, marginBottom: 20, boxShadow: '0 2px 8px rgba(26,115,232,0.3)' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>Available Cash in Hand</div>
        <div style={{ fontSize: 28, fontWeight: 'bold', color: 'white' }}>Rs.{cashInHand}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Total collected - vendor payments - cash purchases - expenses</div>
      </div>

      <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>Add Expense</div>

      {/* DESCRIPTION WITH SUGGESTIONS */}
      <div style={{ marginBottom: 14, position: 'relative' }}>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Description *</div>
        <input type='text' placeholder='e.g. Shop rent, electricity, tools...'
          value={expenseForm.description}
          onChange={e => { setExpenseForm({ ...expenseForm, description: e.target.value }); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 500)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' }} />
        {showSuggestions && expenseForm.description && expenseForm.description.length > 0 && suggestions.length > 0 && (
          <div style={{ position: 'absolute', left: 0, right: 0, background: 'white', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100, maxHeight: 200, overflowY: 'auto' }}>
            {suggestions.map((s, i) => (
              <div key={i} onMouseDown={() => { setExpenseForm({ ...expenseForm, description: s }); setShowSuggestions(false); }}
                style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontSize: 13, color: '#333' }}>
                {s}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Amount (Rs.) *</div>
        <input type='number' placeholder='0' value={expenseForm.amount}
          onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' }} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Expense Date (optional — leave empty for today)</div>
        <input type='date' value={expenseForm.expenseDate || ''}
          onChange={e => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' }} />
      </div>

      <button onClick={saveExpense}
        style={{ width: '100%', background: '#555', color: 'white', border: 'none', borderRadius: 12, padding: 16, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>
        Save Expense
      </button>

      {/* EXPENSE HISTORY */}
      {(() => {
        const istOff = 5.5 * 60 * 60000;
        const toIST = (ts) => ts ? new Date(new Date(ts).getTime() + istOff).toISOString().split('T')[0] : null;
        const currentMonth = new Date(new Date().getTime() + istOff).toISOString().slice(0, 7);
        // states upar move ho gayi

        const monthExpenses = expenses.filter(e => {
          const d = toIST(e.created_at);
          return d && d.startsWith(filterMonth);
        });

        const categories = [...new Set(expenses.map(e => e.description).filter(Boolean))].sort();

        const filtered = monthExpenses.filter(e =>
          filterCategory === '' || e.description === filterCategory
        );

        const totalFiltered = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);
        const totalMonth = monthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

        return (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 10 }}>Expense History</div>

            {/* Month Filter */}
            <input type='month' value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setFilterCategory(''); }}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box', marginBottom: 10 }} />

            {/* Category Filter */}
            <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <button onClick={() => setFilterCategory('')}
                style={{ padding: '5px 12px', borderRadius: 20, border: 'none', background: filterCategory === '' ? '#555' : '#f0f0f0', color: filterCategory === '' ? 'white' : '#555', fontSize: 12, cursor: 'pointer', fontWeight: 'bold' }}>
                All
              </button>
              {categories.map((cat, i) => {
                const catTotal = monthExpenses.filter(e => e.description === cat).reduce((s, e) => s + Number(e.amount || 0), 0);
                if (catTotal === 0) return null;
                return (
                  <button key={i} onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
                    style={{ padding: '5px 12px', borderRadius: 20, border: 'none', background: filterCategory === cat ? '#c62828' : '#f0f0f0', color: filterCategory === cat ? 'white' : '#555', fontSize: 12, cursor: 'pointer', fontWeight: 'bold' }}>
                    {cat} · Rs.{catTotal}
                  </button>
                );
              })}
            </div>

            {/* Summary */}
            <div style={{ background: '#fff3e0', borderRadius: 10, padding: '10px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, color: '#e65100', fontWeight: 'bold' }}>
                {filterCategory ? filterCategory : 'Total'} — {filterMonth}
              </div>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#c62828' }}>
                Rs.{filterCategory ? totalFiltered : totalMonth}
              </div>
            </div>

            {/* Entries */}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', padding: 20, background: 'white', borderRadius: 10 }}>No expenses found</div>
            )}
            {filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((e, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 10, padding: 12, marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderLeft: '3px solid #c62828' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 'bold', fontSize: 14, color: '#333' }}>{e.description}</div>
                  <div style={{ fontWeight: 'bold', color: '#c62828' }}>Rs.{e.amount}</div>
                </div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>📅 {fmtDateTime(e.created_at)}</div>
                <button onClick={async () => {
                  if (window.confirm('Delete this expense?')) {
                    await supabase.from('expenses').delete().eq('id', e.id);
                    fetchAll();
                  }
                }} style={{ width: '100%', marginTop: 8, background: '#c62828', color: 'white', border: 'none', borderRadius: 8, padding: 6, fontSize: 12, cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
};

export default Expense;