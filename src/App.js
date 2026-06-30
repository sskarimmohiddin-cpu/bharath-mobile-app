import Pending from './screens/Pending';
import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Home from './screens/Home';
import Jobs from './screens/Jobs';
import NewJob from './screens/NewJob';
import Purchase from './screens/Purchase';
import Sale from './screens/Sale';
import Expense from './screens/Expense';
import Vendors from './screens/Vendors';
import Stock from './screens/Stock';
import Accounts from './screens/Accounts';
import Banking from './screens/Banking';
import PaymentModal from './components/PaymentModal';
import './App.css';

function App() {
  const [screen, setScreenState] = useState('home');

  const setScreen = (newScreen) => {
    window.history.pushState({ screen: newScreen }, '', '');
    setScreenState(newScreen);
  };

  useEffect(() => {
    const handlePopState = () => {
      setScreenState('home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [jobs, setJobs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vendorPayments, setVendorPayments] = useState([]);
  const [stock, setStock] = useState([]);
  const [jobParts, setJobParts] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [bankTransactions, setBankTransactions] = useState([]);
  const [selectedParts, setSelectedParts] = useState([]);
  const [newParts, setNewParts] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [openingCash, setOpeningCash] = useState(0);
  const [dashDate, setDashDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentModal, setPaymentModal] = useState({ show: false, title: '', subtitle: '', defaultAmount: '', onConfirm: null });
  const [form, setForm] = useState({
    customerName: '', phone: '', deviceModel: '', complaint: '',
    price: '', deliveryDate: '', deliveryTime: '', advancePayment: '',
    jobDate: '', devicePassword: '', photoUrl: '', cashSale: false,
    editId: null, editJobId: null,
  });
  const [purchaseForm, setPurchaseForm] = useState({
    vendorId: '', itemName: '', quantity: '', rate: '', paymentType: 'Credit', purchaseDate: '',
  });
  const [saleForm, setSaleForm] = useState({
    itemName: '', quantity: '', price: '', customerPhone: '', purchaseCost: '',
  });
  const [expenseForm, setExpenseForm] = useState({
    description: '', amount: '', expenseDate: '',
  });
  const [newPartForm, setNewPartForm] = useState({
    vendorId: '', itemName: '', quantity: '1', rate: '', paymentType: 'Credit',
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [j, v, p, s, e, vp, st, jp, ba, bt] = await Promise.all([
      supabase.from('jobs').select('*').order('id', { ascending: false }),
      supabase.from('vendors').select('*').order('name'),
      supabase.from('purchases').select('*').order('created_at', { ascending: false }),
      supabase.from('sales').select('*').order('created_at', { ascending: false }),
      supabase.from('expenses').select('*').order('created_at', { ascending: false }),
      supabase.from('vendor_payments').select('*').order('created_at', { ascending: false }),
      supabase.from('stock').select('*').order('item_name'),
      supabase.from('job_parts').select('*'),
      supabase.from('bank_accounts').select('*').order('created_at'),
      supabase.from('bank_transactions').select('*').order('created_at', { ascending: false }),
    ]);
    if (!j.error) setJobs(j.data);
    if (!v.error) setVendors(v.data);
    if (!p.error) setPurchases(p.data);
    if (!s.error) setSales(s.data);
    if (!e.error) setExpenses(e.data);
    if (!vp.error) setVendorPayments(vp.data);
    if (!st.error) setStock(st.data);
    if (!jp.error) setJobParts(jp.data);
    if (!ba.error) setBankAccounts(ba.data);
    if (!bt.error) setBankTransactions(bt.data);
    const todayDate = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const { data: dcData } = await supabase.from('daily_cash').select('*').eq('date', todayDate);
    if (dcData && dcData.length > 0) {
      setOpeningCash(dcData[0].opening_balance || 0);
    } else {
      const { data: ydData } = await supabase.from('daily_cash').select('*').eq('date', yesterday);
      if (ydData && ydData.length > 0) {
        const ydOpening = ydData[0].opening_balance || 0;
        const ydCollected = j.data ? j.data.filter(job => (job.status === 'Delivered' || job.status === 'Partial') && job.delivery_date === yesterday).reduce((sum, job) => sum + Number(job.amount_paid || 0), 0) : 0;
        const ydAdvances = j.data ? j.data.filter(job => job.advance_date === yesterday).reduce((sum, job) => sum + Number(job.amount_paid || 0), 0) : 0;
        const ydSales = s.data ? s.data.filter(sale => sale.created_at && sale.created_at.startsWith(yesterday)).reduce((sum, sale) => sum + Number(sale.total || 0), 0) : 0;
        const ydExpenses = e.data ? e.data.filter(exp => exp.created_at && exp.created_at.startsWith(yesterday)).reduce((sum, exp) => sum + Number(exp.amount || 0), 0) : 0;
        const ydCashPurchases = p.data ? p.data.filter(pur => (pur.purchase_date || '').startsWith(yesterday) && pur.payment_type === 'Cash').reduce((sum, pur) => sum + Number(pur.total || 0), 0) : 0;
        const ydVendorPayments = vp.data ? vp.data.filter(payment => payment.created_at && payment.created_at.startsWith(yesterday)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0) : 0;
        const ydBankDeposits = bt.data ? bt.data.filter(t => t.transaction_type === 'Deposit' && t.transaction_date === yesterday).reduce((s, t) => s + Number(t.amount || 0), 0) : 0;
        const ydBankWithdrawals = bt.data ? bt.data.filter(t => t.transaction_type === 'Withdraw' && t.transaction_date === yesterday).reduce((s, t) => s + Number(t.amount || 0), 0) : 0;
        const ydClosing = ydOpening + ydCollected + ydAdvances + ydSales - ydExpenses - ydCashPurchases - ydVendorPayments - ydBankDeposits + ydBankWithdrawals;
        await supabase.from('daily_cash').insert([{ date: todayDate, opening_balance: ydClosing }]);
        setOpeningCash(ydClosing);
      } else {
        setOpeningCash(0);
      }
    }
  };

  const saveOpeningCash = async (amount) => {
    const todayDate = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('daily_cash').select('*').eq('date', todayDate);
    if (data && data.length > 0) {
      await supabase.from('daily_cash').update({ opening_balance: amount }).eq('date', todayDate);
    } else {
      await supabase.from('daily_cash').insert([{ date: todayDate, opening_balance: amount }]);
    }
    setOpeningCash(amount);
  };

  const getDayData = async (date) => {
    const istOffset = 5.5 * 60 * 60000;
    const toIST = (ts) => new Date(new Date(ts).getTime() + istOffset).toISOString().split('T')[0];
    const collected = jobs.filter(j => (j.status === 'Delivered' || j.status === 'Partial') && j.delivery_date === date).reduce((s, j) => s + Number(j.amount_paid || 0), 0);
    const advances = jobs.filter(j => j.advance_date === date).reduce((s, j) => s + Number(j.amount_paid || 0), 0);
    const daySales = sales.filter(s => s.created_at && toIST(s.created_at) === date).reduce((s, j) => s + Number(j.total || 0), 0);
    const dayExpenses = expenses.filter(e => e.created_at && toIST(e.created_at) === date).reduce((s, e) => s + Number(e.amount || 0), 0);
    const dayPurchases = purchases.filter(p => (p.purchase_date || (p.created_at ? toIST(p.created_at) : null)) === date);
    const cashPurchases = dayPurchases.filter(p => p.payment_type === 'Cash').reduce((s, p) => s + Number(p.total || 0), 0);
    const totalPurchases = dayPurchases.reduce((s, p) => s + Number(p.total || 0), 0);
    const partsCost = jobParts.filter(jp => { const job = jobs.find(j => j.job_id === jp.job_id); return job && (job.status === 'Delivered' || job.status === 'Partial') && job.delivery_date === date; }).reduce((s, jp) => s + Number(jp.total || 0), 0);
    const dayVP = vendorPayments.filter(vp => vp.created_at && toIST(vp.created_at) === date).reduce((s, vp) => s + Number(vp.amount || 0), 0);
    const salePurchaseCost = sales.filter(s => s.created_at && toIST(s.created_at) === date).reduce((sum, s) => sum + (Number(s.purchase_cost || 0) * Number(s.quantity || 1)), 0);
    const netProfit = Math.round((collected + daySales - partsCost - salePurchaseCost) * 100) / 100;
    const { data: dcData } = await supabase.from('daily_cash').select('*').eq('date', date);
    let opening = 0;
    if (dcData && dcData.length > 0) {
      opening = dcData[0].opening_balance || 0;
    } else {
      const prevDate = new Date(date);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = prevDate.toISOString().split('T')[0];
      const { data: prevDc } = await supabase.from('daily_cash').select('*').eq('date', prevDateStr);
      if (prevDc && prevDc.length > 0) {
        const prevOpening = prevDc[0].opening_balance || 0;
        const prevCollected = jobs.filter(j => (j.status === 'Delivered' || j.status === 'Partial') && j.delivery_date === prevDateStr).reduce((s, j) => s + Number(j.amount_paid || 0), 0);
        const prevAdvances = jobs.filter(j => j.advance_date === prevDateStr).reduce((s, j) => s + Number(j.amount_paid || 0), 0);
        const prevSales = sales.filter(s => s.created_at && toIST(s.created_at) === prevDateStr).reduce((s, j) => s + Number(j.total || 0), 0);
        const prevExpenses = expenses.filter(e => e.created_at && toIST(e.created_at) === prevDateStr).reduce((s, e) => s + Number(e.amount || 0), 0);
        const prevCashPurchases = purchases.filter(p => p.payment_type === 'Cash' && (p.purchase_date || (p.created_at ? toIST(p.created_at) : null)) === prevDateStr).reduce((s, p) => s + Number(p.total || 0), 0);
        const prevVP = vendorPayments.filter(vp => vp.created_at && toIST(vp.created_at) === prevDateStr).reduce((s, vp) => s + Number(vp.amount || 0), 0);
        const prevBankDeposits = bankTransactions.filter(bt => bt.transaction_type === 'Deposit' && bt.transaction_date === prevDateStr).reduce((s, bt) => s + Number(bt.amount || 0), 0);
        const prevBankWithdrawals = bankTransactions.filter(bt => bt.transaction_type === 'Withdraw' && bt.transaction_date === prevDateStr).reduce((s, bt) => s + Number(bt.amount || 0), 0);
        opening = prevOpening + prevCollected + prevAdvances + prevSales - prevExpenses - prevCashPurchases - prevVP - prevBankDeposits + prevBankWithdrawals;
      }
    }
    const dayBankDeposits = bankTransactions.filter(bt => bt.transaction_type === 'Deposit' && bt.transaction_date === date).reduce((s, bt) => s + Number(bt.amount || 0), 0);
    const dayBankWithdrawals = bankTransactions.filter(bt => bt.transaction_type === 'Withdraw' && bt.transaction_date === date).reduce((s, bt) => s + Number(bt.amount || 0), 0);
    return { collected, advances, sales: daySales, cashPurchases, purchases: totalPurchases, partsCost, vendorPayments: dayVP, expenses: dayExpenses, netProfit, opening, bankDeposits: dayBankDeposits, bankWithdrawals: dayBankWithdrawals };
  };

  const handleSave = async () => {
    if (!form.phone || !form.complaint || !form.price) {
      alert('Please fill Phone, Complaint and Price'); return;
    }
    setLoading(true);
    let error; let jobId;
    if (form.editId) {
      jobId = form.editJobId;
      ({ error } = await supabase.from('jobs').update({
        customer_name: form.customerName, phone: form.phone,
        device_model: form.deviceModel, complaint: form.complaint,
        price: Number(form.price), delivery_date: form.deliveryDate,
        delivery_time: form.deliveryTime,
        amount_paid: Number(form.advancePayment) || 0,
        balance: Number(form.price) - (Number(form.advancePayment) || 0),
        status: Number(form.advancePayment) > 0 ? 'Partial' : 'Pending',
        created_at: form.jobDate ? new Date(form.jobDate).toISOString() : undefined,
      }).eq('id', form.editId));
      const { data: oldParts } = await supabase.from('job_parts').select('*').eq('job_id', jobId);
      if (oldParts && oldParts.length > 0) {
        const { data: oldPurchases } = await supabase.from('purchases').select('*').eq('job_id', jobId);
        if (oldPurchases && oldPurchases.length > 0) {
          for (const op of oldPurchases) {
            if (op.payment_type === 'Credit') {
              const vendor = vendors.find(v => v.id === op.vendor_id);
              if (vendor) {
                await supabase.from('vendors').update({ balance: vendor.balance - op.total }).eq('id', vendor.id);
              }
            }
            await supabase.from('purchases').delete().eq('id', op.id);
          }
        }
      }
      await supabase.from('job_parts').delete().eq('job_id', jobId);
    } else {
      jobId = 'BMS-' + Date.now().toString().slice(-4);
      const isCashSale = form.cashSale;
      const jobDate = form.jobDate ? new Date(form.jobDate).toISOString().split('T')[0] : today;
      ({ error } = await supabase.from('jobs').insert([{
        job_id: jobId, customer_name: form.customerName, phone: form.phone,
        device_model: form.deviceModel, complaint: form.complaint,
        price: Number(form.price), delivery_date: isCashSale ? jobDate : form.deliveryDate,
        delivery_time: form.deliveryTime,
        status: isCashSale ? 'Delivered' : (Number(form.advancePayment) > 0 ? 'Partial' : 'Pending'),
        amount_paid: isCashSale ? Number(form.price) : (Number(form.advancePayment) || 0),
        balance: isCashSale ? 0 : (Number(form.price) - (Number(form.advancePayment) || 0)),
        created_at: form.jobDate ? new Date(form.jobDate).toISOString() : new Date().toISOString(),
        advance_date: Number(form.advancePayment) > 0 ? new Date().toISOString().split('T')[0] : null,
        device_password: form.devicePassword || null,
        photo_url: form.photoUrl || null,
      }]));
    }
    if (error) { setLoading(false); alert('Error: ' + error.message); return; }

    for (const part of selectedParts) {
      await supabase.from('job_parts').insert([{
        job_id: jobId, item_name: part.item_name,
        quantity: part.quantity, rate: part.rate, total: part.quantity * part.rate,
      }]);
      const stockItem = stock.find(s => s.item_name === part.item_name);
      if (stockItem) {
        await supabase.from('stock').update({
          quantity: stockItem.quantity - part.quantity,
        }).eq('item_name', part.item_name);
      }
    }

    for (const part of newParts) {
      if (!part.vendorId || !part.itemName || !part.rate) continue;
      const total = Number(part.quantity) * Number(part.rate);
      const vendor = vendors.find(v => v.id === Number(part.vendorId));
      await supabase.from('purchases').insert([{
        vendor_id: Number(part.vendorId), vendor_name: vendor.name,
        item_name: part.itemName, quantity: Number(part.quantity),
        rate: Number(part.rate), total: total, payment_type: part.paymentType,
        purchase_date: new Date().toISOString().split('T')[0],
        job_id: jobId,
      }]);
      if (part.paymentType === 'Credit') {
        await supabase.from('vendors').update({ balance: vendor.balance + total }).eq('id', vendor.id);
      }
      await supabase.from('job_parts').insert([{
        job_id: jobId, item_name: part.itemName,
        quantity: Number(part.quantity), rate: Number(part.rate), total: total,
      }]);
    }

    setLoading(false);
    const deliveryInfo = form.deliveryDate + (form.deliveryTime ? ' at ' + form.deliveryTime : '');
    const advanceInfo = Number(form.advancePayment) > 0 ? ' Advance paid: Rs.' + form.advancePayment + '. Balance to pay: Rs.' + (Number(form.price) - Number(form.advancePayment)) + '.' : '';
    const message = 'Hello ' + form.customerName + '! Your ' + form.deviceModel + ' has been received at Bharath Mobile Service. Complaint: ' + form.complaint + '. Estimated price: Rs.' + form.price + '.' + advanceInfo + ' Expected delivery: ' + deliveryInfo + '. Job ID: ' + jobId + '. Thank you!';
    const sendMsg = window.confirm('Send WhatsApp to ' + form.phone + '?');
    if (sendMsg) {
      const url = 'https://wa.me/91' + form.phone + '?text=' + encodeURIComponent(message);
      const a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
    setForm({ customerName: '', phone: '', deviceModel: '', complaint: '', price: '', deliveryDate: '', deliveryTime: '', advancePayment: '', jobDate: '', devicePassword: '', photoUrl: '', cashSale: false, editId: null, editJobId: null });
    setSelectedParts([]); setNewParts([]);
    fetchAll(); setScreen('home');
  };

  const editJob = (job) => {
    const existingParts = jobParts.filter(p => p.job_id === job.job_id);
    setSelectedParts(existingParts.map(p => ({
      item_name: p.item_name, quantity: p.quantity, rate: p.rate, id: p.id, isExisting: true
    })));
    setNewParts([]);
    setForm({
      customerName: job.customer_name || '', phone: job.phone || '',
      deviceModel: job.device_model || '', complaint: job.complaint || '',
      price: job.price || '', deliveryDate: job.delivery_date || '',
      deliveryTime: job.delivery_time || '', advancePayment: job.amount_paid || '',
      jobDate: job.created_at ? job.created_at.split('T')[0] : '',
      editId: job.id, editJobId: job.job_id,
    });
    setScreen('newjob');
  };

  const deleteJob = async (id, jobId) => {
    if (window.confirm('Delete job ' + jobId + '? This cannot be undone!')) {
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (!error) { alert('Job ' + jobId + ' deleted!'); fetchAll(); }
    }
  };

  const markDelivered = (jobId, phone, price) => {
    setPaymentModal({
      show: true,
      title: 'Mark as Delivered',
      subtitle: 'Job: ' + jobId + ' | Total: Rs.' + price,
      defaultAmount: price,
      onConfirm: async (amountPaid, date) => {
        setPaymentModal({ show: false });
        const bal = Number(price) - amountPaid;
        const message = bal > 0
          ? 'Hello! Your device is ready at Bharath Mobile Service. Job ID: ' + jobId + '. Amount paid: Rs.' + amountPaid + '. Balance remaining: Rs.' + bal + '. Thank you!'
          : 'Hello! Your device repair is complete at Bharath Mobile Service. Job ID: ' + jobId + '. Amount paid: Rs.' + amountPaid + '. Thank you!';
        const sendMsg = window.confirm('Send WhatsApp message to ' + phone + '?');
        const { error } = await supabase.from('jobs').update({
          status: bal > 0 ? 'Partial' : 'Delivered',
          amount_paid: amountPaid, balance: bal,
          delivery_date: date,
        }).eq('job_id', jobId);
        if (!error) {
          if (sendMsg) {
            const url = 'https://wa.me/91' + phone + '?text=' + encodeURIComponent(message);
            const a = document.createElement('a');
            a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
          }
          fetchAll();
        }
      }
    });
  };
  const collectAdvance = (jobId, phone, price) => {
    setPaymentModal({
      show: true,
      title: 'Collect Advance',
      subtitle: 'Job: ' + jobId + ' | Total: Rs.' + price,
      defaultAmount: '',
      onConfirm: async (amountPaid, date) => {
        setPaymentModal({ show: false });
        const balance = Number(price) - amountPaid;
        const { error } = await supabase.from('jobs').update({
          status: 'Partial',
          amount_paid: amountPaid,
          balance: balance,
          advance_date: date,
        }).eq('job_id', jobId);
        if (!error) {
          const message = 'Hello! Advance payment received at Bharath Mobile Service. Job ID: ' + jobId + '. Advance paid: Rs.' + amountPaid + '. Balance remaining: Rs.' + balance + '. Thank you!';
          const sendMsg = window.confirm('Send WhatsApp message to ' + phone + '?');
          if (sendMsg) {
            const url = 'https://wa.me/91' + phone + '?text=' + encodeURIComponent(message);
            const a = document.createElement('a');
            a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
          }
          fetchAll();
        }
      }
    });
  };
  const collectBalance = (jobId, phone, balance) => {
    setPaymentModal({
      show: true,
      title: 'Collect Balance',
      subtitle: 'Job: ' + jobId + ' | Balance: Rs.' + balance,
      defaultAmount: balance,
      onConfirm: async (newPaid, date) => {
        setPaymentModal({ show: false });
        const newBal = Number(balance) - newPaid;
        const message = 'Hello! Payment received at Bharath Mobile Service. Job ID: ' + jobId + '. Paid now: Rs.' + newPaid + (newBal > 0 ? '. Remaining: Rs.' + newBal : '. Full payment done!') + ' Thank you!';
        const sendMsg = window.confirm('Send WhatsApp message to ' + phone + '?');
        const { error } = await supabase.from('jobs').update({
          status: newBal <= 0 ? 'Delivered' : 'Partial',
          balance: newBal < 0 ? 0 : newBal,
          delivery_date: date,
        }).eq('job_id', jobId);
        if (!error) {
          if (sendMsg) {
            const url = 'https://wa.me/91' + phone + '?text=' + encodeURIComponent(message);
            const a = document.createElement('a');
            a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
          }
          fetchAll();
        }
      }
    });
  };

  const markReturned = async (jobId, phone, deviceModel) => {
    if (window.confirm('Return ' + deviceModel + ' without repair?')) {
      const message = 'Hello! Your ' + deviceModel + ' could not be repaired. Ready for collection at Bharath Mobile Service. Job ID: ' + jobId + '. Sorry for inconvenience. Thank you!';
      const sendMsg = window.confirm('Send WhatsApp message to ' + phone + '?');
      const { error } = await supabase.from('jobs').update({ status: 'Returned' }).eq('job_id', jobId);
      if (!error) {
        if (sendMsg) {
          const url = 'https://wa.me/91' + phone + '?text=' + encodeURIComponent(message);
          const a = document.createElement('a');
          a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
        }
        fetchAll();
      }
    }
  };

  const savePurchase = async () => {
    if (!purchaseForm.vendorId || !purchaseForm.itemName || !purchaseForm.quantity || !purchaseForm.rate) {
      alert('Please fill all purchase fields'); return;
    }
    const total = Number(purchaseForm.quantity) * Number(purchaseForm.rate);
    const vendor = vendors.find(v => v.id === Number(purchaseForm.vendorId));
    const { error } = await supabase.from('purchases').insert([{
      vendor_id: Number(purchaseForm.vendorId), vendor_name: vendor.name,
      item_name: purchaseForm.itemName, quantity: Number(purchaseForm.quantity),
      rate: Number(purchaseForm.rate), total: total, payment_type: purchaseForm.paymentType,
      purchase_date: purchaseForm.purchaseDate || new Date().toISOString().split('T')[0],
    }]);
    if (error) { alert('Error: ' + error.message); return; }
    if (purchaseForm.paymentType === 'Credit') {
      await supabase.from('vendors').update({ balance: vendor.balance + total }).eq('id', vendor.id);
    }
    const { data: existingStock } = await supabase.from('stock').select('*').eq('item_name', purchaseForm.itemName).single();
    if (existingStock) {
      await supabase.from('stock').update({
        quantity: existingStock.quantity + Number(purchaseForm.quantity),
        rate: Number(purchaseForm.rate),
        updated_at: new Date().toISOString(),
      }).eq('item_name', purchaseForm.itemName);
    } else {
      await supabase.from('stock').insert([{
        item_name: purchaseForm.itemName,
        quantity: Number(purchaseForm.quantity),
        rate: Number(purchaseForm.rate),
        updated_at: new Date().toISOString(),
      }]);
    }
    alert('Purchase saved! ' + purchaseForm.itemName + ' x' + purchaseForm.quantity + ' = Rs.' + total);
    setPurchaseForm({ vendorId: '', itemName: '', quantity: '', rate: '', paymentType: 'Credit', purchaseDate: '' });
    fetchAll();
  };

  const saveSale = async () => {
    if (!saleForm.itemName || !saleForm.quantity || !saleForm.price) {
      alert('Please fill item, quantity and price'); return;
    }
    const total = Number(saleForm.quantity) * Number(saleForm.price);
    const saleId = 'SAL-' + Date.now().toString().slice(-4);
    const { error } = await supabase.from('sales').insert([{
      sale_id: saleId,
      item_name: saleForm.itemName, quantity: Number(saleForm.quantity),
      price: Number(saleForm.price), total: total,
      purchase_cost: Number(saleForm.purchaseCost) || 0,
      customer_phone: saleForm.customerPhone,
    }]);
    if (!error) {
      if (saleForm.customerPhone) {
        const message = 'Hello! Thank you for purchasing from Bharath Mobile Service. Item: ' + saleForm.itemName + ' x' + saleForm.quantity + '. Total: Rs.' + total + '. Thank you!';
        const sendMsg = window.confirm('Send WhatsApp to ' + saleForm.customerPhone + '?');
        if (sendMsg) {
          const url = 'https://wa.me/91' + saleForm.customerPhone + '?text=' + encodeURIComponent(message);
          const a = document.createElement('a');
          a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
        }
      }
      alert('Sale saved! Rs.' + total);
      setSaleForm({ itemName: '', quantity: '', price: '', customerPhone: '', purchaseCost: '' });
      fetchAll();
    }
  };

  const saveExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) {
      alert('Please fill description and amount'); return;
    }
    const { error } = await supabase.from('expenses').insert([{
      description: expenseForm.description, amount: Number(expenseForm.amount),
      created_at: expenseForm.expenseDate ? new Date(expenseForm.expenseDate).toISOString() : new Date().toISOString(),
    }]);
    if (!error) {
      alert('Expense saved!');
      setExpenseForm({ description: '', amount: '', expenseDate: '' });
      fetchAll();
    }
  };

  const now = new Date();
  const istOffset = 5.5 * 60 * 60000;
  const istDate = new Date(now.getTime() + istOffset);
  const today = istDate.toISOString().split('T')[0];
  const todayAdvances = jobs.filter(j => {
    if (j.status !== 'Partial' && j.status !== 'Pending') return false;
    if (!j.advance_date) return false;
    return j.advance_date === today;
  }).reduce((s, j) => s + Number(j.amount_paid || 0), 0);
  const todayCollected = jobs.filter(j => {
    if (j.status !== 'Delivered' && j.status !== 'Partial') return false;
    if (!j.delivery_date) return false;
    return j.delivery_date === today;
  }).reduce((s, j) => s + Number(j.amount_paid || 0), 0);

  const todaySales = sales.filter(s => {
    if (!s.created_at) return false;
    const d = new Date(new Date(s.created_at).getTime() + istOffset);
    return d.toISOString().split('T')[0] === today;
  }).reduce((s, j) => s + Number(j.total || 0), 0);

  const todayExpenses = expenses.filter(e => {
    if (!e.created_at) return false;
    const d = new Date(new Date(e.created_at).getTime() + istOffset);
    return d.toISOString().split('T')[0] === today;
  }).reduce((s, e) => s + Number(e.amount || 0), 0);

  const todayPurchases = purchases.filter(p => {
    const pd = p.purchase_date || (p.created_at ? new Date(new Date(p.created_at).getTime() + istOffset).toISOString().split('T')[0] : null);
    return pd === today;
  }).reduce((s, p) => s + Number(p.total || 0), 0);

  const todayCashPurchases = purchases.filter(p => {
    if (p.payment_type !== 'Cash') return false;
    const pd = p.purchase_date || (p.created_at ? new Date(new Date(p.created_at).getTime() + istOffset).toISOString().split('T')[0] : null);
    return pd === today;
  }).reduce((s, p) => s + Number(p.total || 0), 0);

  const todayPartsCost = jobParts.filter(jp => {
    const job = jobs.find(j => j.job_id === jp.job_id);
    return job && (job.status === 'Delivered' || job.status === 'Partial') && job.delivery_date && job.delivery_date === today;
  }).reduce((s, jp) => s + Math.round(Number(jp.total || 0) * 100) / 100, 0);
  const todaySalePurchaseCost = sales.filter(s => {
    if (!s.created_at) return false;
    const d = new Date(new Date(s.created_at).getTime() + istOffset);
    return d.toISOString().split('T')[0] === today;
  }).reduce((sum, s) => sum + (Number(s.purchase_cost || 0) * Number(s.quantity || 1)), 0);
  const todayNetProfit = Math.round((todayCollected + todaySales - todayPartsCost - todaySalePurchaseCost) * 100) / 100;
  const todayVendorPayments = vendorPayments.filter(vp => {
    if (!vp.created_at) return false;
    const d = new Date(new Date(vp.created_at).getTime() + istOffset);
    return d.toISOString().split('T')[0] === today;
  }).reduce((s, vp) => s + Number(vp.amount || 0), 0);
  const totalCollected = jobs.filter(j => j.status === 'Delivered' || j.status === 'Partial').reduce((s, j) => s + Number(j.amount_paid || 0), 0);
  const vendorPayable = vendors.reduce((s, v) => {
    const vPurchases = purchases.filter(p => p.vendor_name === v.name && p.payment_type === 'Credit').reduce((t, p) => t + Number(p.total || 0), 0);
    const vPayments = vendorPayments.filter(vp => vp.vendor_name === v.name).reduce((t, vp) => t + Number(vp.amount || 0), 0);
    const bal = vPurchases - vPayments;
    return s + (bal > 0 ? bal : 0);
  }, 0);
  const todayBankDeposits = bankTransactions.filter(bt => bt.transaction_type === 'Deposit' && bt.transaction_date === today).reduce((s, bt) => s + Number(bt.amount || 0), 0);
  const todayBankWithdrawals = bankTransactions.filter(bt => bt.transaction_type === 'Withdraw' && bt.transaction_date === today).reduce((s, bt) => s + Number(bt.amount || 0), 0);
  const cashInHand = openingCash + todayCollected + todayAdvances + todaySales - todayExpenses - todayCashPurchases - todayVendorPayments - todayBankDeposits + todayBankWithdrawals;
  const closingCash = cashInHand;

  const filteredTx = [
    ...jobs.map(j => ({
      type: 'Repair', date: j.created_at,
      title: j.customer_name + ' — ' + j.device_model,
      detail: j.complaint + ' | Job: ' + j.job_id,
      amount: j.amount_paid || 0, color: '#2e7d32', sign: '+', status: j.status,
      id: null, vendorName: null,
    })),
    ...sales.map(s => ({
      type: 'Sale', date: s.created_at, title: s.item_name,
      detail: 'Qty: ' + s.quantity + ' x Rs.' + s.price,
      amount: s.total || 0, color: '#1565c0', sign: '+', status: 'Sale',
      id: null, vendorName: null,
    })),
    ...purchases.map(p => ({
      type: 'Purchase', date: p.created_at, title: p.item_name,
      detail: p.vendor_name + ' | Qty: ' + p.quantity + ' x Rs.' + p.rate + ' | ' + p.payment_type,
      amount: p.total || 0, color: '#e65100', sign: '-', status: p.payment_type,
      id: null, vendorName: null,
    })),
    ...expenses.map(e => ({
      type: 'Expense', date: e.created_at, title: e.description,
      detail: 'Expense', amount: e.amount || 0, color: '#c62828', sign: '-', status: 'Expense',
      id: null, vendorName: null,
    })),
    ...vendorPayments.map(vp => ({
      type: 'Payment', date: vp.created_at, title: 'Paid to ' + vp.vendor_name,
      detail: 'Vendor payment', amount: vp.amount || 0, color: '#6a1b9a', sign: '-', status: 'Paid',
      id: vp.id, vendorName: vp.vendor_name,
    })),
  ]
  .filter(tx => {
    if (!tx.date) return false;
    if (!filterDateFrom && !filterDateTo) return true;
    const txDate = tx.date.split('T')[0];
    if (filterDateFrom && filterDateTo) return txDate >= filterDateFrom && txDate <= filterDateTo;
    if (filterDateFrom) return txDate >= filterDateFrom;
    if (filterDateTo) return txDate <= filterDateTo;
    return true;
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date));

  const commonJobProps = {
    onEditJob: editJob,
    onDeleteJob: deleteJob,
    onMarkDelivered: markDelivered,
    onCollectBalance: collectBalance,
    onMarkReturned: markReturned,
    onCollectAdvance: collectAdvance,
  };

  return (
    <div style={{ fontFamily: 'Arial', maxWidth: 480, margin: '0 auto', background: '#f5f5f5', minHeight: '100vh' }}>
      <PaymentModal
        modal={paymentModal}
        onConfirm={(amount, date) => paymentModal.onConfirm && paymentModal.onConfirm(amount, date)}
        onClose={() => setPaymentModal({ show: false })}
      />
      <div style={{ background: '#1a73e8', color: 'white', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, background: 'white', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 20 }}>📱</span>
          </div>
          <div>
            <div style={{ fontWeight: '900', fontSize: 18, letterSpacing: 1 }}>BHARATH MOBILES</div>
            <div style={{ fontSize: 11, opacity: 0.85, letterSpacing: 2 }}>REPAIR & SERVICE</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {screen !== 'home' && (
            <button onClick={() => setScreen('home')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: 20, cursor: 'pointer' }}>Back</button>
          )}
          <button onClick={() => fetchAll()} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 18 }}>⚙️</button>
        </div>
      </div>

      {screen === 'home' && (
        <Home
        jobs={jobs} vendors={vendors} jobParts={jobParts} sales={sales}
        todayCollected={todayCollected} todayAdvances={todayAdvances} todaySales={todaySales}
          todayExpenses={todayExpenses} todayPurchases={todayPurchases}
          todayCashPurchases={todayCashPurchases} todayPartsCost={todayPartsCost}
          todayVendorPayments={todayVendorPayments}
          todayNetProfit={todayNetProfit}
          totalCollected={totalCollected} vendorPayable={vendorPayable}
          today={today} setScreen={setScreen} fetchAll={fetchAll}
          filteredTx={filteredTx}
          filterDateFrom={filterDateFrom} filterDateTo={filterDateTo}
          setFilterDateFrom={setFilterDateFrom} setFilterDateTo={setFilterDateTo}
          openingCash={openingCash} saveOpeningCash={saveOpeningCash}
          cashInHand={cashInHand}
          closingCash={closingCash}
          dashDate={dashDate} setDashDate={setDashDate} getDayData={getDayData}
          {...commonJobProps}
        />
      )}
      {screen === 'newjob' && (
        <NewJob
          form={form} setForm={setForm}
          handleSave={handleSave} loading={loading}
          vendors={vendors} stock={stock} jobs={jobs} purchases={purchases}
          selectedParts={selectedParts} setSelectedParts={setSelectedParts}
          newParts={newParts} setNewParts={setNewParts}
          newPartForm={newPartForm} setNewPartForm={setNewPartForm}
          fetchAll={fetchAll}
        />
      )}
      {screen === 'jobs' && (
        <Jobs
          jobs={jobs} jobParts={jobParts}
          filterDate={filterDate} setFilterDate={setFilterDate}
          {...commonJobProps}
        />
      )}
      {screen === 'purchase' && (
        <Purchase
          vendors={vendors} purchases={purchases}
          purchaseForm={purchaseForm} setPurchaseForm={setPurchaseForm}
          savePurchase={savePurchase} fetchAll={fetchAll}
        />
      )}
      {screen === 'sale' && (
        <Sale
          sales={sales} saleForm={saleForm} setSaleForm={setSaleForm}
          saveSale={saveSale} fetchAll={fetchAll} stock={stock}
          vendors={vendors} purchases={purchases}
        />
      )}
      {screen === 'expense' && (
        <Expense
          expenses={expenses} expenseForm={expenseForm} setExpenseForm={setExpenseForm}
          saveExpense={saveExpense} fetchAll={fetchAll} cashInHand={cashInHand}
        />
      )}
      {screen === 'vendors' && (
        <Vendors
          vendors={vendors} purchases={purchases}
          vendorPayments={vendorPayments} filteredTx={filteredTx}
          filterDateFrom={filterDateFrom} filterDateTo={filterDateTo}
          setFilterDateFrom={setFilterDateFrom} setFilterDateTo={setFilterDateTo}
          vendorPayable={vendorPayable} fetchAll={fetchAll}
        />
      )}
      {screen === 'pending' && (
        <Pending
          jobs={jobs} jobParts={jobParts}
          {...commonJobProps}
        />
      )}
      {screen === 'stock' && (
        <Stock stock={stock} fetchAll={fetchAll} />
      )}
      {screen === 'accounts' && (
        <Accounts
          jobs={jobs} purchases={purchases} sales={sales}
          expenses={expenses} jobParts={jobParts} vendors={vendors}
          vendorPayments={vendorPayments}
          bankTransactions={bankTransactions}
          openingCash={openingCash}
        />
      )}
      {screen === 'banking' && (
        <Banking
          bankAccounts={bankAccounts}
          bankTransactions={bankTransactions}
          fetchAll={fetchAll}
          cashInHand={cashInHand}
          closingCash={closingCash}
        />
      )}
    </div>
  );
}

export default App;