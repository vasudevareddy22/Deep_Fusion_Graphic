import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowUpDown,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';
import ThreatBadge from '../components/ThreatBadge';

export const DetectionHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const navigate = useNavigate();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getHistory({
        search: searchTerm,
        type: selectedType,
        severity: selectedSeverity,
        limit: 100
      });
      setRecords(res.records || []);
    } catch (err) {
      console.error("Error loading detection history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedType, selectedSeverity]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleDownloadCsv = () => {
    window.open(api.getReportCsvUrl(), '_blank');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="glass-card p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            Detection History & Security Audit Log
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Permanent forensic repository of all multi-modal cyber threat detections, ML classifications, and graph topology scores.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-mono font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchHistory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by IP, Protocol, Attack..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:border-cyan-500 outline-none"
          />
        </form>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 outline-none cursor-pointer text-xs font-mono"
            >
              <option value="ALL">All Vectors</option>
              <option value="DoS">DoS</option>
              <option value="Probe">Probe</option>
              <option value="R2L">R2L</option>
              <option value="U2R">U2R</option>
              <option value="Normal">Normal</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <span>Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 outline-none cursor-pointer text-xs font-mono"
            >
              <option value="ALL">All Tiers</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Source IP</th>
                <th className="p-3.5">Destination IP</th>
                <th className="p-3.5">Proto / Port</th>
                <th className="p-3.5">Classification</th>
                <th className="p-3.5">ML Conf</th>
                <th className="p-3.5">Graph Risk</th>
                <th className="p-3.5">Fused Risk</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5 text-right">Triage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Retrieving Forensic Records...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-slate-400">
                    No matching detection records found. Adjust your search filters or run a new scan.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5 text-slate-500">#{rec.id}</td>
                    <td className="p-3.5 text-slate-400 whitespace-nowrap">{rec.timestamp}</td>
                    <td className={`p-3.5 font-bold ${rec.is_attack ? 'text-rose-400' : 'text-slate-300'}`}>
                      {rec.source_ip}
                    </td>
                    <td className="p-3.5 text-slate-300">{rec.destination_ip}</td>
                    <td className="p-3.5 uppercase text-slate-400">{rec.protocol} / {rec.service}</td>
                    <td className="p-3.5">
                      <ThreatBadge type={rec.attack_type} />
                    </td>
                    <td className="p-3.5 text-cyan-400 font-bold">{rec.ml_confidence}%</td>
                    <td className="p-3.5 text-amber-400 font-bold">{rec.graph_risk}</td>
                    <td className="p-3.5 text-rose-400 font-bold">{(rec.final_risk_score * 100).toFixed(0)}%</td>
                    <td className="p-3.5">
                      <ThreatBadge type={rec.severity} variant="severity" />
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => navigate('/analysis', { state: { threat: rec } })}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 border border-slate-700 text-[11px] transition-colors cursor-pointer"
                      >
                        Explain
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Displaying {records.length} forensic log entries</span>
          <span>Storage Engine: SQLite Embedded DB</span>
        </div>
      </div>
    </div>
  );
};

export default DetectionHistory;
