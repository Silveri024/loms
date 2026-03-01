import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCases } from '../api/cases';
import { BarChart2, ExternalLink, Edit2, Save, X } from 'lucide-react';
import api from '../api/axios';

function formatCurrency(n) {
  return n ? n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) : '₺0';
}

interface EditFeesState {
  totalFee: number;
  amountPaid: number;
  status: string;
}

interface EditPaymentState {
  amount: number;
  method: string;
}

function Payments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [summary, setSummary] = useState({ totalFees: 0, totalPaid: 0, outstanding: 0 });
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [editFees, setEditFees] = useState<EditFeesState>({ totalFee: 0, amountPaid: 0, status: 'pending' });
  const [editPayment, setEditPayment] = useState<EditPaymentState>({ amount: 0, method: 'bank_transfer' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getAllCases();
      setCases(data || []);
      computeSummary(data || []);
    } catch (err) {
      console.error('Failed to load cases:', err);
      setCases([]);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const computeSummary = (casesData) => {
    let totalFees = 0;
    let totalPaid = 0;

    if (Array.isArray(casesData)) {
      casesData.forEach((c) => {
        const feesList = Array.isArray(c.fees) ? c.fees : (c.fees ? [c.fees] : []);
        const paymentsList = Array.isArray(c.payments) ? c.payments : (c.payments ? [c.payments] : []);

        feesList.forEach((f) => { totalFees += f?.totalFee || 0; });
        paymentsList.forEach((p) => { totalPaid += p?.amount || 0; });
      });
    }

    setSummary({
      totalFees,
      totalPaid,
      outstanding: Math.max(0, totalFees - totalPaid)
    });
  };

  const handleEditClick = (e, caseData) => {
    e.stopPropagation();
    setEditingCaseId(caseData.id);
    const fees = Array.isArray(caseData.fees) ? caseData.fees : (caseData.fees ? [caseData.fees] : []);
    setEditFees({
      totalFee: fees[0]?.totalFee || 0,
      amountPaid: fees[0]?.amountPaid || 0,
      status: fees[0]?.paymentStatus || 'pending'
    });
    setEditPayment({
      amount: 0,
      method: 'bank_transfer'
    });
  };

  const handleSaveFees = async (caseData) => {
    try {
      if (caseData.fees && Array.isArray(caseData.fees) && caseData.fees.length > 0) {
        await api.put(`/fees/${caseData.fees[0].id}`, {
          totalFee: editFees.totalFee,
          amountPaid: editFees.amountPaid,
          paymentStatus: editFees.status
        });
      } else {
        await api.post('/fees', {
          caseId: caseData.id,
          totalFee: editFees.totalFee,
          amountPaid: editFees.amountPaid,
          paymentStatus: editFees.status
        });
      }
      setEditingCaseId(null);
      loadData();
    } catch (err) {
      console.error('Failed to save fees:', err);
      alert('Failed to save fees');
    }
  };

  const handleAddPayment = async (caseData) => {
    try {
      await api.post('/payments', {
        caseId: caseData.id,
        amount: editPayment.amount,
        method: editPayment.method
      });
      setEditingCaseId(null);
      loadData();
    } catch (err) {
      console.error('Failed to add payment:', err);
      alert('Failed to add payment');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-dark-600">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">Financials</h2>
        <p className="text-dark-500 mt-1">Monitor client payments, fees charged, and outstanding balances</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl shadow-md p-6 border border-primary-200">
          <p className="text-sm text-primary-700 font-semibold">Amount Waiting For</p>
          <p className="text-4xl font-bold text-primary-900 mt-3">{formatCurrency(summary.outstanding)}</p>
          <p className="text-xs text-primary-600 mt-2">Expected from clients</p>
        </div>
        <div className="bg-gradient-to-br from-dark-50 to-dark-100 rounded-xl shadow-md p-6 border border-dark-200">
          <p className="text-sm text-dark-700 font-semibold">Amount Paid</p>
          <p className="text-4xl font-bold text-dark-900 mt-3">{formatCurrency(summary.totalPaid)}</p>
          <p className="text-xs text-dark-600 mt-2">Received from clients</p>
        </div>
        <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl shadow-md p-6 border border-primary-300">
          <p className="text-sm text-primary-800 font-semibold">Total Fees</p>
          <p className="text-4xl font-bold text-primary-900 mt-3">{formatCurrency(summary.totalFees)}</p>
          <p className="text-xs text-primary-700 mt-2">Total charged</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-dark-100">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-5 h-5 text-primary-600" />
          <h3 className="text-xl font-semibold text-dark-900">Cases Breakdown</h3>
        </div>
        {cases.length === 0 ? (
          <p className="text-dark-500">No cases found</p>
        ) : (
          <div className="space-y-3">
            {cases.map((c) => {
              const feesList = Array.isArray(c.fees) ? c.fees : (c.fees ? [c.fees] : []);
              const paymentsList = Array.isArray(c.payments) ? c.payments : (c.payments ? [c.payments] : []);
              const totalFee = feesList.reduce((s, f) => s + (f?.totalFee || 0), 0);
              const paid = paymentsList.reduce((s, p) => s + (p?.amount || 0), 0);
              const outstanding = Math.max(0, totalFee - paid);
              const isEditing = editingCaseId === c.id;

              if (isEditing) {
                return (
                  <div key={c.id} className="p-4 border border-primary-300 rounded-lg bg-primary-50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-semibold text-dark-900">{c.title}</div>
                        <div className="text-sm text-dark-500">Client: {c.client?.name || '—'}</div>
                      </div>
                      <button
                        onClick={() => setEditingCaseId(null)}
                        className="p-1 hover:bg-primary-200 rounded"
                      >
                        <X className="w-5 h-5 text-dark-600" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-dark-700">Total Fee (₺)</label>
                        <input
                          type="number"
                          value={editFees.totalFee}
                          onChange={(e) => setEditFees({ ...editFees, totalFee: parseFloat(e.target.value) || 0 })}
                          className="w-full mt-1 px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-dark-700">Amount Paid (₺)</label>
                        <input
                          type="number"
                          value={editFees.amountPaid}
                          onChange={(e) => setEditFees({ ...editFees, amountPaid: parseFloat(e.target.value) || 0 })}
                          className="w-full mt-1 px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-dark-700">Status</label>
                        <select
                          value={editFees.status}
                          onChange={(e) => setEditFees({ ...editFees, status: e.target.value })}
                          className="w-full mt-1 px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="partial">Partial</option>
                          <option value="paid">Paid</option>
                        </select>
                      </div>

                      <div className="border-t border-primary-200 pt-4">
                        <label className="text-sm font-medium text-dark-700">Add Payment (₺)</label>
                        <input
                          type="number"
                          value={editPayment.amount}
                          onChange={(e) => setEditPayment({ ...editPayment, amount: parseFloat(e.target.value) || 0 })}
                          placeholder="Amount"
                          className="w-full mt-1 px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                        <select
                          value={editPayment.method}
                          onChange={(e) => setEditPayment({ ...editPayment, method: e.target.value })}
                          className="w-full mt-2 px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="credit_card">Credit Card</option>
                          <option value="cash">Cash</option>
                        </select>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <button
                          onClick={() => handleSaveFees(c)}
                          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                        >
                          <Save className="w-4 h-4" /> Save Fees
                        </button>
                        {editPayment.amount > 0 && (
                          <button
                            onClick={() => handleAddPayment(c)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium"
                          >
                            Add Payment
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/cases/${c.id}`)}
                  className="p-4 border border-dark-100 rounded-lg hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold text-dark-900">{c.title}</div>
                      <div className="text-sm text-dark-500">Client: {c.client?.name || '—'}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${outstanding > 0 ? 'bg-primary-100 text-primary-800' : 'bg-dark-100 text-dark-800'}`}>
                        {outstanding > 0 ? 'Pending' : 'Paid'}
                      </div>
                      <ExternalLink className="w-4 h-4 text-primary-600" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-dark-500">Charged</p>
                      <p className="font-bold text-dark-900">{formatCurrency(totalFee)}</p>
                    </div>
                    <div>
                      <p className="text-dark-500">Paid</p>
                      <p className="font-bold text-primary-700">{formatCurrency(paid)}</p>
                    </div>
                    <div>
                      <p className="text-dark-500">Left</p>
                      <p className={`font-bold ${outstanding > 0 ? 'text-primary-700' : 'text-dark-700'}`}>{formatCurrency(outstanding)}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleEditClick(e, c)}
                    className="w-full opacity-0 group-hover:opacity-100 transition-opacity bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" /> Edit Fees & Payments
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Payments;
