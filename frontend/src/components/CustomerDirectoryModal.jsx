import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Download, 
  Search, 
  CheckCircle2, 
  ShieldCheck, 
  Mail, 
  Smartphone, 
  Key, 
  Globe, 
  Clock, 
  Calendar, 
  AlertCircle,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export const CustomerDirectoryModal = ({ isOpen, onClose }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [isPurging, setIsPurging] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    loadCustomers();
  }, [isOpen]);

  const loadCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAdminCustomers();
      setCustomers(data.customers || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch customer directory.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customer) => {
    const isMaster = (customer.email || '').toLowerCase() === 'vasudevareddyeevuri@gmail.com';
    if (isMaster) {
      alert('Safety Violation: The Master Administrator account is permanently protected and cannot be deleted.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete customer:\n\n` +
      `• Name: ${customer.name || 'Customer'}\n` +
      `• ID: ${customer.email || customer.mobile || 'Unknown'}\n\n` +
      `This will remove all account records and threat logs from the database AND delete their row from registered_users.xlsx.`
    );

    if (!confirmed) return;

    setDeletingId(customer.id);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await api.deleteCustomer(customer.id);
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
      setActionSuccess(res.message || `Customer '${customer.name}' successfully deleted.`);
      setTimeout(() => setActionSuccess(''), 6000);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to delete customer.');
      setTimeout(() => setActionError(''), 6000);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePurgeTestCustomers = async () => {
    const testCount = customers.filter(
      (c) => (c.email || '').toLowerCase().endsWith('@soc-customer.com')
    ).length;

    if (testCount === 0) {
      alert('No simulated test customers found in the active database.');
      return;
    }

    const confirmed = window.confirm(
      `Master Administrator Confirmation:\n\n` +
      `Permanently purge all ${testCount} simulated test customer records?\n\n` +
      `This removes them from both SQLite and registered_users.xlsx. All real accounts and the Master Admin are safely preserved.`
    );

    if (!confirmed) return;

    setIsPurging(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await api.bulkDeleteCustomers({ delete_test_only: true });
      await loadCustomers();
      setActionSuccess(res.message || `Successfully purged ${res.deleted_count || testCount} test accounts.`);
      setTimeout(() => setActionSuccess(''), 6000);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to purge test accounts.');
      setTimeout(() => setActionError(''), 6000);
    } finally {
      setIsPurging(false);
    }
  };

  if (!isOpen) return null;

  const testCustomerCount = customers.filter(
    (c) => (c.email || '').toLowerCase().endsWith('@soc-customer.com')
  ).length;

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term) ||
      (c.mobile || '').toLowerCase().includes(term) ||
      (c.auth_provider || '').toLowerCase().includes(term) ||
      (c.role || '').toLowerCase().includes(term)
    );
  });

  const getAuthIcon = (provider) => {
    switch (provider) {
      case 'GOOGLE':
        return <Globe className="w-3.5 h-3.5 text-blue-500" />;
      case 'MOBILE_OTP':
        return <Smartphone className="w-3.5 h-3.5 text-indigo-500" />;
      case 'EMAIL_OTP':
        return <Mail className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <Key className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white border border-blue-200 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top brand highlight bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-blue-50/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-sans">
                  Customer Directory & Login Records
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Restricted to Master Admin <span className="font-semibold text-blue-600">Vasudevareddyeevuri@gmail.com</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Purge Test Data Button */}
            {testCustomerCount > 0 && (
              <button
                onClick={handlePurgeTestCustomers}
                disabled={isPurging}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer shrink-0 disabled:opacity-50 active:scale-95"
                title="Purge all simulated test accounts from database and Excel"
              >
                {isPurging ? (
                  <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                )}
                <span>Purge Test Data ({testCustomerCount})</span>
              </button>
            )}

            {/* Refresh Button */}
            <button
              onClick={loadCustomers}
              disabled={loading}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-blue-600 border border-slate-200 transition-colors cursor-pointer"
              title="Refresh customer records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* Export Excel Button */}
            <button
              onClick={() => api.downloadUsersExcel()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/25 transition-all cursor-pointer shrink-0 active:scale-95"
              title="Download full customer details Excel sheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel (.xlsx)</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter and Stats Bar */}
        <div className="p-4 border-b border-blue-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, mobile, or auth method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-blue-50/50 border border-blue-200/80 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span>
              Total Customers: <strong className="text-slate-900">{customers.length}</strong>
            </span>
            <span>·</span>
            <span>
              Showing: <strong className="text-blue-600">{filteredCustomers.length}</strong>
            </span>
          </div>
        </div>

        {/* Action Status Banners */}
        {actionSuccess && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess('')} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {actionError && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{actionError}</span>
            </div>
            <button onClick={() => setActionError('')} className="text-rose-500 hover:text-rose-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium">Loading registered customer database...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">No customer records found</p>
              <p className="text-[11px] text-slate-400">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-blue-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-blue-50/70 border-b border-blue-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Customer Name</th>
                      <th className="px-4 py-3">Identifier (Email / Mobile)</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Login Method</th>
                      <th className="px-4 py-3">Registered At</th>
                      <th className="px-4 py-3">Last Active</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50 text-slate-700 font-medium">
                    {filteredCustomers.map((c) => {
                      const isMaster = (c.email || '').toLowerCase() === 'vasudevareddyeevuri@gmail.com';
                      return (
                        <tr key={c.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                                isMaster ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {(c.name || 'C')[0].toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block truncate max-w-[150px]">
                                  {c.name || 'Unnamed Customer'}
                                </span>
                                {c.organization && (
                                  <span className="text-[10px] text-slate-400 block">{c.organization}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 font-mono text-[11px] text-slate-800">
                            {c.email || c.mobile || '—'}
                          </td>

                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isMaster
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {isMaster ? 'SUPER ADMIN' : 'CUSTOMER'}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1.5 text-[11px]">
                              {getAuthIcon(c.auth_provider)}
                              <span>{c.auth_provider}</span>
                            </span>
                          </td>

                          <td className="px-4 py-3 text-slate-500 text-[11px]">
                            {c.created_at || '—'}
                          </td>

                          <td className="px-4 py-3 text-slate-500 text-[11px]">
                            {c.last_login || 'First session'}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center">
                            {isMaster ? (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 select-none"
                                title="Master Administrator account cannot be deleted"
                              >
                                <ShieldCheck className="w-3 h-3 text-amber-600" />
                                PROTECTED
                              </span>
                            ) : (
                              <button
                                onClick={() => handleDeleteCustomer(c)}
                                disabled={deletingId === c.id || isPurging}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                                title={`Permanently delete customer ${c.name || c.email}`}
                              >
                                {deletingId === c.id ? (
                                  <div className="w-3 h-3 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3 text-rose-500" />
                                )}
                                <span>Delete</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-blue-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Excel Sync: Automated live logging to <code className="font-mono text-slate-700">registered_users.xlsx</code></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => api.downloadUsersExcel()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm shadow-blue-500/25 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Customer Sheet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDirectoryModal;
