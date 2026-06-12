import React, { useState } from 'react';
import { supabase } from '../supabase';

const Banking = ({ bankAccounts, bankTransactions, fetchAll, cashInHand }) => {
  const [view, setView] = useState('accounts');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [txForm, setTxForm] = useState({ type: 'Deposit', amount: '', description: '', date: '' });
  const [accountForm, setAccountForm] = useState({
    account_name: '', account_type: 'Bank', bank_name: '', account_number: '', balance: ''
  });

  const saveAccount = async () => {
    if (!accountForm.account_name) { alert('Enter account name'); return; }
    await supabase.from('bank_accounts').insert([{
      account_name: accountForm.account_name,
      account_type: accountForm.account_type,
      bank_name: accountForm.bank_name,
      account_number: accountForm.account_number,
      balance: Number(accountForm.balance) || 0,
    }]);
    if (Number(accountForm.balance) > 0) {
      await supabase.from('bank_transactions').insert([{
        account_id: null,
        account_name: accountForm.account_name,
        transaction_type: 'Opening Balance',
        amount: Number(accountForm.balance),
        description: 'Opening balance',
        transaction_date: new Date().toISOString().split('T')[0],
      }]);
    }
    alert('Account added!');
    setAccountForm({ account_name: '', account_type: 'Bank', bank_name: '', account_number: '', balance: '' });
    setShowAddAccount(false);
    fetchAll();
  };

  const saveTransaction = async () => {
    if (!txForm.amount) { alert('Enter amount'); return; }
    if (!selectedAccount) { alert('Select account'); return; }
    const amount = Number(txForm.amount);
    const txDate = txForm.date || new Date().toISOString().split('T')[0];
    await supabase.from('bank_transactions').insert([{
      account_id: selectedAccount.id,
      account_name: selectedAccount.account_name,
      transaction_type: txForm.type,
      amount: amount,
      description: txForm.description,
      transaction_date: txDate,
    }]);
    let newBalance = selectedAccount.balance;
    if (txForm.type === 'Deposit' || txForm.type === 'Borrow') {
      newBalance = selectedAccount.balance + amount;
    } else if (txForm.type === 'Withdraw' || txForm.type === 'Repay') {
      newBalance = selectedAccount.balance - amount;
    }
    await supabase.from('bank_accounts').update({ balance: newBalance }).eq('id', selectedAccount.id);
    alert('Transaction saved!');
    setTxForm({ type: 'Deposit', amount: '', description: '', date: '' });
    setSelectedAccount(null);
    fetchAll();
  };

  const deleteAccount = async (id, name) => {
    if (window.confirm('Delete account ' + name + '?')) {
      await supabase.from('bank_accounts').delete().eq('id', id);
      await supabase.from('bank_transactions').delete().eq('account_id', id);
      fetchAll();
    }
  };

  const deleteTransaction = async (tx) => {
    if (window.confirm('Delete this transaction?')) {
      await supabase.from('bank_transactions').delete().eq('id', tx.id);
      const account = bankAccounts.find(a => a.id === tx.account_id);
      if (account) {
        let newBalance = account.balance;
        if (tx.transaction_type === 'Deposit' || tx.transaction_type === 'Borrow') {
          newBalance = account.balance - tx.amount;
        } else if (tx.transaction_type === 'Withdraw' || tx.transaction_type === 'Repay') {
          newBalance = account.balance + tx.amount;
        }
        await supabase.from('bank_accounts').update({ balance: newBalance }).eq('id', account.id);
      }
      fetchAll();
    }
  };

  const totalBalance = bankAccounts.reduce((s, a) => s + Number(a.balance || 0), 0);

  const txColor = (type) => {
    if (type === 'Deposit' || type === 'Borrow') return '#2e7d32';
    if (type === 'Withdraw' || type === 'Repay') return '#c62828';
    return '#1a73e8';
  };

  const accountTypeIcon = (type) => {
    if (type === 'Bank') return '🏦';
    if (type === 'Cash') return '💵';
    if (type === 'Personal Loan') return '👤';
    if (type === 'Finance') return '🏢';
    return '💰';
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 }}>Banking & Accounts</div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'accounts', label: 'Accounts' },
          { key: 'transaction', label: 'New Transaction' },
          { key: 'history', label: 'History' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setView(tab.key)}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: view === tab.key ? '#1a73e8' : 'white', color: view === tab.key ? 'white' : '#555', fontWeight: 'bold', fontSize: 12, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ACCOUNTS VIEW */}
      {view === 'accounts' && (
        <div>
          {/* CASH IN HAND + BANK BALANCE */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, background: '#2e7d32', borderRadius: 12, padding: 14, boxShadow: '0 2px 8px rgba(46,125,50,0.3)' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginBottom: 4 }}>💵 Cash in Hand</div>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: 'white' }}>Rs.{cashInHand}</div>
            </div>
            <div style={{ flex: 1, background: '#1a73e8', borderRadius: 12, padding: 14, boxShadow: '0 2px 8px rgba(26,115,232,0.3)' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginBottom: 4 }}>🏦 Bank Balance</div>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: 'white' }}>Rs.{totalBalance}</div>
            </div>
          </div>

          {/* ADD ACCOUNT BUTTON */}
          <button onClick={() => setShowAddAccount(!showAddAccount)}
            style={{ width: '100%', background: showAddAccount ? '#e8f1fd' : '#1a73e8', color: showAddAccount ? '#1a73e8' : 'white', border: showAddAccount ? '2px solid #1a73e8' : 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', marginBottom: 16 }}>
            {showAddAccount ? '− Cancel' : '+ Add New Account'}
          </button>

          {/* ADD ACCOUNT FORM */}
          {showAddAccount && (
            <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 12 }}>New Account</div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>Account Type</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['Bank', 'Cash', 'Personal Loan', 'Finance'].map(type => (
                    <button key={type} onClick={() => setAccountForm({ ...accountForm, account_type: type })}
                      style={{ padding: '6px 12px', borderRadius: 20, border: '2px solid ' + (accountForm.account_type === type ? '#1a73e8' : '#ddd'), background: accountForm.account_type === type ? '#e8f1fd' : 'white', color: accountForm.account_type === type ? '#1a73e8' : '#555', fontSize: 12, cursor: 'pointer', fontWeight: 'bold' }}>
                      {accountTypeIcon(type)} {type}
                    </button>
                  ))}
                </div>
              </div>
              {[
                { label: 'Account Name *', key: 'account_name', placeholder: 'e.g. SBI Savings, Bike Loan' },
                { label: 'Bank Name (optional)', key: 'bank_name', placeholder: 'e.g. SBI, HDFC' },
                { label: 'Account Number (optional)', key: 'account_number', placeholder: 'e.g. 1234567890' },
                { label: 'Opening Balance (Rs.)', key: 'balance', placeholder: '0', type: 'number' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>{field.label}</div>
                  <input type={field.type || 'text'} placeholder={field.placeholder} value={accountForm[field.key]}
                    onChange={e => setAccountForm({ ...accountForm, [field.key]: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
              ))}
              <button onClick={saveAccount}
                style={{ width: '100%', background: '#1a73e8', color: 'white', border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>
                Save Account
              </button>
            </div>
          )}

          {/* ACCOUNTS LIST */}
          {bankAccounts.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', padding: 30, background: 'white', borderRadius: 12 }}>
              No accounts yet. Add your first account!
            </div>
          )}
          {bankAccounts.map((account, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderLeft: '4px solid #1a73e8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 'bold', color: '#333' }}>{accountTypeIcon(account.account_type)} {account.account_name}</div>
                  {account.bank_name && <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{account.bank_name}</div>}
                  {account.account_number && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>A/C: {account.account_number}</div>}
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{account.account_type}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: account.balance >= 0 ? '#2e7d32' : '#c62828' }}>Rs.{account.balance}</div>
                  <div style={{ fontSize: 10, color: '#999' }}>balance</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => { setSelectedAccount(account); setView('transaction'); }}
                  style={{ flex: 1, background: '#1a73e8', color: 'white', border: 'none', borderRadius: 8, padding: 7, fontSize: 12, cursor: 'pointer' }}>
                  + Transaction
                </button>
                <button onClick={() => { setSelectedAccount(account); setView('history'); }}
                  style={{ flex: 1, background: '#555', color: 'white', border: 'none', borderRadius: 8, padding: 7, fontSize: 12, cursor: 'pointer' }}>
                  History
                </button>
                <button onClick={() => deleteAccount(account.id, account.account_name)}
                  style={{ flex: 1, background: '#c62828', color: 'white', border: 'none', borderRadius: 8, padding: 7, fontSize: 12, cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NEW TRANSACTION VIEW */}
      {view === 'transaction' && (
        <div>
          <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 12 }}>New Transaction</div>

            {/* SELECT ACCOUNT */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>Select Account *</div>
              <select value={selectedAccount ? selectedAccount.id : ''} onChange={e => setSelectedAccount(bankAccounts.find(a => a.id === Number(e.target.value)) || null)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }}>
                <option value=''>Select account...</option>
                {bankAccounts.map(a => <option key={a.id} value={a.id}>{accountTypeIcon(a.account_type)} {a.account_name} — Rs.{a.balance}</option>)}
              </select>
            </div>

            {/* TRANSACTION TYPE */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>Transaction Type</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { type: 'Deposit', color: '#2e7d32', label: '↓ Deposit' },
                  { type: 'Withdraw', color: '#c62828', label: '↑ Withdraw' },
                  { type: 'Borrow', color: '#1a73e8', label: '+ Borrow' },
                  { type: 'Repay', color: '#e65100', label: '- Repay' },
                ].map(t => (
                  <button key={t.type} onClick={() => setTxForm({ ...txForm, type: t.type })}
                    style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: '2px solid ' + (txForm.type === t.type ? t.color : '#ddd'), background: txForm.type === t.type ? t.color : 'white', color: txForm.type === t.type ? 'white' : '#555', fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {[
              { label: 'Amount (Rs.) *', key: 'amount', type: 'number', placeholder: '0' },
              { label: 'Description', key: 'description', placeholder: 'e.g. Shop rent paid, EMI, salary...' },
              { label: 'Date (optional)', key: 'date', type: 'date' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>{field.label}</div>
                <input type={field.type || 'text'} placeholder={field.placeholder} value={txForm[field.key]}
                  onChange={e => setTxForm({ ...txForm, [field.key]: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
            ))}

            {selectedAccount && txForm.amount && (
              <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#555' }}>Current Balance: Rs.{selectedAccount.balance}</div>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: (txForm.type === 'Deposit' || txForm.type === 'Borrow') ? '#2e7d32' : '#c62828' }}>
                  New Balance: Rs.{
                    (txForm.type === 'Deposit' || txForm.type === 'Borrow')
                      ? selectedAccount.balance + Number(txForm.amount)
                      : selectedAccount.balance - Number(txForm.amount)
                  }
                </div>
              </div>
            )}

            <button onClick={saveTransaction}
              style={{ width: '100%', background: '#1a73e8', color: 'white', border: 'none', borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 'bold', cursor: 'pointer' }}>
              Save Transaction
            </button>
          </div>
        </div>
      )}

      {/* HISTORY VIEW */}
      {view === 'history' && (
        <div>
          {selectedAccount && (
            <div style={{ background: '#e8f1fd', borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#1a73e8' }}>{selectedAccount.account_name}</div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1a73e8' }}>Balance: Rs.{selectedAccount.balance}</div>
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <select onChange={e => setSelectedAccount(bankAccounts.find(a => a.id === Number(e.target.value)) || null)}
              value={selectedAccount ? selectedAccount.id : ''}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }}>
              <option value=''>All Transactions</option>
              {bankAccounts.map(a => <option key={a.id} value={a.id}>{a.account_name}</option>)}
            </select>
          </div>
          {bankTransactions
            .filter(tx => !selectedAccount || tx.account_id === selectedAccount.id)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map((tx, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 10, padding: 12, marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderLeft: '4px solid ' + txColor(tx.transaction_type) }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                      <div style={{ background: txColor(tx.transaction_type), color: 'white', fontSize: 10, padding: '2px 6px', borderRadius: 10 }}>{tx.transaction_type}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>{tx.transaction_date}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 'bold', color: '#333' }}>{tx.account_name}</div>
                    {tx.description && <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{tx.description}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: txColor(tx.transaction_type) }}>
                      {(tx.transaction_type === 'Deposit' || tx.transaction_type === 'Borrow') ? '+' : '-'}Rs.{tx.amount}
                    </div>
                  </div>
                </div>
                <button onClick={() => deleteTransaction(tx)}
                  style={{ width: '100%', marginTop: 8, background: '#c62828', color: 'white', border: 'none', borderRadius: 8, padding: 6, fontSize: 12, cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            ))}
          {bankTransactions.filter(tx => !selectedAccount || tx.account_id === selectedAccount.id).length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', padding: 30, background: 'white', borderRadius: 12 }}>
              No transactions yet!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Banking;