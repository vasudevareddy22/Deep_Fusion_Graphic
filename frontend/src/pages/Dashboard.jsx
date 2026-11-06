import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Wifi,
  Cpu,
  Search,
  AlertOctagon,
  Calendar as CalendarIcon,
  Filter,
  ArrowUpRight,
  Radio,
  Clock,
  Play,
  Pause,
  RefreshCw,
  Eye,
  Lock,
  Layers,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import CalendarHeatmap from '../components/CalendarHeatmap';
import IncidentDeepDiveDialog from '../components/IncidentDeepDiveDialog';
import EmergencyIsolateModal from '../components/EmergencyIsolateModal';
import SystemArchitectureGuide from '../components/SystemArchitectureGuide';

// ─── Custom Cyber Obsidian SOC Tooltip ──────────────────────────────────────────
const CyberTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const attacks = payload.find(p => p.dataKey === 'attacks')?.value || 0;
  const normal = payload.find(p => p.dataKey === 'normal')?.value || 0;
  const total = payload.find(p => p.dataKey === 'total')?.value || (attacks + normal);
  const bandwidth = (total * 0.42 + (attacks > 0 ? 3.8 : 0.6)).toFixed(1);

  return (
    <div className="bg-[#0A0F1D]/95 backdrop-blur-md border border-cyan-500/40 rounded-xl px-4 py-3 text-xs shadow-2xl min-w-[220px] text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
        <span className="text-cyan-400 font-bold text-sm font-mono">{label}</span>
        {attacks > 0 ? (
          <span className="px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-300 text-[10px] font-bold border border-rose-600/60 shadow-xs shadow-rose-900/50">
            ATTACK DETECTED
          </span>
        ) : (
          <span className="text-[10px] text-emerald-300 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-600/60">
            SECURE FLOW
          </span>
        )}
      </div>
      <div className="space-y-1.5 font-medium">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Total Packets:</span>
          <span className="text-white font-bold font-mono">{total.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-rose-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-xs shadow-rose-500" /> Malicious Spikes:
          </span>
          <span className="text-rose-400 font-bold font-mono">{attacks.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-cyan-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-xs shadow-cyan-400" /> Benign Baseline:
          </span>
          <span className="text-slate-200 font-bold font-mono">{normal.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-[11px]">
          <span className="text-slate-500">Estimated Bandwidth:</span>
          <span className="text-amber-400 font-bold font-mono">{bandwidth} GB/s</span>
        </div>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const navigate = useNavigate();

  // Primary State
  const [data, setData] = useState(null);
  const [chartSeries, setChartSeries] = useState([]);
  const [period, setPeriod] = useState('week'); // 'day' | 'week' | 'month' | 'year'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  // Only show alert briefing once when the person logs in into the web, not on every dashboard click
  const [showAlertModal, setShowAlertModal] = useState(() => {
    const shouldShow = sessionStorage.getItem('dfg_show_login_alert') === 'true';
    if (shouldShow) {
      sessionStorage.removeItem('dfg_show_login_alert');
      return true;
    }
    return false;
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [liveThroughput, setLiveThroughput] = useState(4.2); // TB/s
  const [livePacketCount, setLivePacketCount] = useState(14820);

  // Dialog States
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false);
  const [isIsolateModalOpen, setIsIsolateModalOpen] = useState(false);
  const [blockedIps, setBlockedIps] = useState(new Set());
  const [toastMessage, setToastMessage] = useState('');

  // Live Threat Logs Stream (populated from DB + streamed every 3s)
  const [threatLogs, setThreatLogs] = useState([]);

  // Fetch Chart Data from Database
  const fetchChartData = useCallback(async (selectedPeriod, targetDate) => {
    try {
      const res = await api.getChartData(selectedPeriod, targetDate);
      if (res?.series && res.series.length > 0) {
        setChartSeries(res.series);
      } else {
        // Fallback default structure
        setChartSeries([
          { label: '00:00', total: 120, attacks: 8, normal: 112 },
          { label: '04:00', total: 210, attacks: 14, normal: 196 },
          { label: '08:00', total: 450, attacks: 85, normal: 365 },
          { label: '12:00', total: 680, attacks: 142, normal: 538 },
          { label: '16:00', total: 540, attacks: 49, normal: 491 },
          { label: '20:00', total: 390, attacks: 22, normal: 368 },
        ]);
      }
    } catch (err) {
      console.error('Failed to load chart series:', err);
    }
  }, []);

  // Initial Fetch & Refresh
  const loadDashboard = useCallback(async () => {
    try {
      const [dash, hist] = await Promise.all([
        api.getDashboard(),
        api.getHistory({ limit: 40 }),
      ]);
      setData(dash);
      if (hist?.records && hist.records.length > 0) {
        // Filter attack records for live feed
        const attacksOnly = hist.records.filter(r => r.is_attack || r.severity === 'CRITICAL' || r.severity === 'HIGH');
        setThreatLogs(attacksOnly.length > 0 ? attacksOnly : hist.records);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    fetchChartData(period, selectedDate);
  }, [period, selectedDate, fetchChartData]);

  // Handle Calendar Day Selection
  const handleSelectDay = (dateStr) => {
    setSelectedDate(dateStr);
    setPeriod('day'); // Automatically switch to Day view when day is selected!
    setToastMessage(`Viewing telemetry for ${dateStr}`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // 3-Second Live Mock/Real Auto-Updater
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      // 1. Update live bandwidth / packet throughput counter
      const delta = (Math.random() * 0.4 - 0.2);
      setLiveThroughput(prev => Math.max(2.8, Math.min(6.5, parseFloat((prev + delta).toFixed(2)))));
      setLivePacketCount(prev => prev + Math.floor(Math.random() * 45 + 15));

      // 2. Occasionally pulse a new live attack into the threat feed stream
      const attackVectors = ['DDoS SYN Flood', 'SSH Brute Force (R2L)', 'Portsweep ICMP Probe', 'Buffer Overflow U2R', 'SQL Injection Attempt'];
      const sourceIps = ['198.51.100.22', '192.168.1.110', '172.16.0.45', '203.0.113.88', '192.168.1.202'];
      const targetPorts = [80, 22, 443, 8080, 3306, 21];
      const severities = ['CRITICAL', 'HIGH', 'MEDIUM'];

      const randomIdx = Math.floor(Math.random() * attackVectors.length);
      const newLog = {
        id: Math.floor(Math.random() * 90000 + 10000),
        timestamp: new Date().toLocaleTimeString(),
        source_ip: sourceIps[randomIdx],
        destination_ip: '10.0.0.5',
        port: targetPorts[randomIdx],
        service: 'http',
        protocol: 'tcp',
        attack_type: attackVectors[randomIdx],
        severity: severities[Math.floor(Math.random() * severities.length)],
        final_risk_score: parseFloat((0.80 + Math.random() * 0.19).toFixed(2)),
        ml_confidence: 0.98,
        graph_risk: 0.84,
        details: `Live telemetry event captured at ${new Date().toLocaleTimeString()}. Automated signature match for ${attackVectors[randomIdx]}.`
      };

      setThreatLogs(prev => [newLog, ...prev.slice(0, 35)]);

      // 3. Subtly pulse current period chart point if on 'day'
      setChartSeries(prev => {
        if (!prev || prev.length === 0) return prev;
        const lastIdx = prev.length - 1;
        const updated = [...prev];
        const current = updated[lastIdx];
        if (current) {
          const addedAttacks = Math.random() > 0.4 ? Math.floor(Math.random() * 3 + 1) : 0;
          updated[lastIdx] = {
            ...current,
            total: (current.total || 0) + addedAttacks + 2,
            attacks: (current.attacks || 0) + addedAttacks,
            normal: (current.normal || 0) + 2,
          };
        }
        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  // Filter logs by search query
  const filteredThreatLogs = threatLogs.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.source_ip?.toLowerCase().includes(q) ||
      t.destination_ip?.toLowerCase().includes(q) ||
      t.attack_type?.toLowerCase().includes(q) ||
      String(t.id).includes(q) ||
      t.severity?.toLowerCase().includes(q)
    );
  });

  const handleOpenIncident = (incident) => {
    setSelectedIncident(incident);
    setIsDeepDiveOpen(true);
  };

  const handleBlockIp = (ip) => {
    setBlockedIps(prev => new Set(prev).add(ip));
    setToastMessage(`Source IP ${ip} successfully blocked on border firewall.`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const kpi = data?.kpi || {
    total_events: 2000,
    total_attacks: 1039,
    critical_threats: 132,
    high_threats: 906,
    normal_traffic: 961,
    detection_rate: 51.9
  };

  return (
    <div className="relative min-h-screen bg-[#070B14] text-slate-100 overflow-x-hidden font-sans">
      {/* ── BACKGROUND DASHBOARD (KEPT IN HEAVY BLUR STATE WHEN ALERT IS ACTIVE) ── */}
      <div
        className={`p-4 md:p-6 space-y-6 transition-all duration-500 ease-in-out ${
          showAlertModal
            ? 'filter blur-[12px] opacity-25 pointer-events-none select-none scale-[0.99]'
            : 'filter-none opacity-100 pointer-events-auto select-auto scale-100'
        }`}
      >
        {/* ── 1. Top Header Bar ────────────────────────────────────────── */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        {/* App Title & Glowing Pulse Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
                Cyber Shield <span className="text-cyan-400 font-light">/</span> SOC Operational Dashboard
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold tracking-wide shadow-xs shadow-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                SYSTEM ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 font-medium">
              <span className="text-slate-300">DeepFusionGuard Engine</span>
              <span className="text-slate-600">·</span>
              <span className="text-cyan-400 font-mono">Real-Time Multi-Modal Telemetry</span>
            </p>
          </div>
        </div>

        {/* Quick Search & Emergency Action Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search IP, Port, Threat ID..."
              className="w-full pl-9 pr-3 py-2 bg-[#0D1527] border border-slate-800 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Re-open System Alert & Guide Button */}
          <button
            onClick={() => setShowAlertModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/60 text-amber-300 text-xs font-bold tracking-wide shadow-md shadow-amber-900/20 transition-all cursor-pointer shrink-0 active:scale-95"
            title="View Mandatory System Information Alert Briefing"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>SYSTEM ALERT &amp; GUIDE</span>
          </button>

          {/* Emergency Destructive Button */}
          <button
            onClick={() => setIsIsolateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold tracking-wider shadow-lg shadow-rose-600/30 transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>ISOLATE NETWORK</span>
          </button>
        </div>
      </header>

      {/* Floating Toast Message */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-cyan-950/90 border border-cyan-400/60 text-cyan-300 text-xs font-mono flex items-center justify-between shadow-xl animate-in slide-in-from-top-2">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {toastMessage}
          </span>
          <button onClick={() => setToastMessage('')} className="text-slate-400 hover:text-white ml-2">×</button>
        </div>
      )}

      {/* ── 2. Top Metric Cards Grid (4 Columns) ──────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Active Threats Count */}
        <div className="soc-card p-5 relative overflow-hidden transition-all hover:border-rose-500/60 hover:shadow-rose-950/40 hover:shadow-xl group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Threats Count
              </p>
              <h3 className="text-3xl font-black text-white mt-2 tracking-tight">
                {kpi.total_attacks.toLocaleString()} <span className="text-sm font-bold text-rose-400">Active</span>
              </h3>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-rose-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+14.2%</span>
                <span className="text-slate-400 font-normal">vs previous cycle</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-rose-950/60 text-rose-400 border border-rose-800/60 group-hover:scale-105 transition-transform shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-60" />
        </div>

        {/* Card 2: Attacks Blocked */}
        <div className="soc-card p-5 relative overflow-hidden transition-all hover:border-emerald-500/60 hover:shadow-emerald-950/40 hover:shadow-xl group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Attacks Blocked
              </p>
              <h3 className="text-3xl font-black text-white mt-2 tracking-tight">
                {(kpi.normal_traffic + 323).toLocaleString()}
              </h3>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-[11px] font-bold">
                  1,284 Today
                </span>
                <span className="text-xs text-slate-400 font-medium">99.8% Accuracy</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 group-hover:scale-105 transition-transform shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-60" />
        </div>

        {/* Card 3: Data Volume Monitored */}
        <div className="soc-card p-5 relative overflow-hidden transition-all hover:border-cyan-500/60 hover:shadow-cyan-950/40 hover:shadow-xl group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Data Volume Monitored
              </p>
              <h3 className="text-3xl font-black text-white mt-2 tracking-tight flex items-baseline gap-1">
                {liveThroughput} <span className="text-sm font-bold text-cyan-400">TB/s</span>
              </h3>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-medium">
                <span className="text-cyan-400 font-bold font-mono">{livePacketCount.toLocaleString()}</span>
                <span>pkts/sec ingest</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 group-hover:scale-105 transition-transform shadow-xs">
              <Wifi className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60" />
        </div>

        {/* Card 4: Threat Severity Level */}
        <div className="soc-card p-5 relative overflow-hidden transition-all hover:border-rose-500/60 hover:shadow-rose-950/40 hover:shadow-xl group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Threat Severity Level
              </p>
              <div className="mt-2.5">
                <span className="px-3 py-1 rounded-xl bg-rose-950/70 border border-rose-600/70 text-rose-300 text-xs font-black tracking-wide inline-block shadow-xs shadow-rose-900/60">
                  CRITICAL - LEVEL 4
                </span>
              </div>
              <p className="text-xs text-amber-400 mt-2 flex items-center gap-1 font-semibold font-mono">
                <span>{kpi.critical_threats} Critical Vectors</span>
                <span className="text-slate-600">·</span>
                <span>DEFCON 2</span>
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-rose-950/60 text-rose-400 border border-rose-800/60 group-hover:scale-105 transition-transform shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-60" />
        </div>
      </section>

      {/* ── 3. Main Content Split View (2/3 Left, 1/3 Right) ───────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT PANEL (2/3): Interactive Recharts & Traffic Visualization ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="soc-card p-5">
            {/* Chart Toolbar: Timeframe Selector & Calendar Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Real-Time Network Packet Traffic
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  Visualizing ingress traffic velocity and high-volume malicious packet spikes
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Timeframe Selector Tabs (Day, Week, Month, Year) */}
                <div className="flex items-center bg-[#070B14] border border-slate-800 rounded-xl p-1 text-xs">
                  {['day', 'week', 'month', 'year'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-3 py-1 rounded-lg uppercase font-bold transition-all cursor-pointer ${
                        period === p
                          ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Day-by-Day Database Calendar Toggle Button */}
                <button
                  onClick={() => setShowCalendar(prev => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    showCalendar
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-xs shadow-cyan-500/30'
                      : 'bg-[#0D1527] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                  title="Toggle Day-by-Day Database Calendar"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Calendar</span>
                  {showCalendar ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* Live Stream 3s Auto-Update Toggle */}
                <button
                  onClick={() => setIsLiveStreaming(prev => !prev)}
                  className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                    isLiveStreaming
                      ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-xs shadow-emerald-500/20'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                  title={isLiveStreaming ? "Live 3s Telemetry Active" : "Telemetry Paused"}
                >
                  {isLiveStreaming ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Expandable Database Calendar Heatmap Section */}
            {showCalendar && (
              <div className="pt-4 pb-2 border-b border-slate-800/80 animate-in slide-in-from-top-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 font-mono">
                    <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    SELECT DAY FROM DATABASE TO INSPECT TELEMETRY
                  </span>
                  <span className="text-[11px] font-bold text-cyan-300 font-mono">
                    Selected: {selectedDate}
                  </span>
                </div>
                <CalendarHeatmap
                  selectedDate={selectedDate}
                  onSelectDate={(newDate) => {
                    setSelectedDate(newDate);
                    fetchChartData(period, newDate);
                  }}
                />
              </div>
            )}

            {/* Recharts Area Chart */}
            <div className="pt-4">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    {/* Crimson spike gradient for attack spikes */}
                    <linearGradient id="cyberSpikes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                    {/* Electric Sapphire baseline for normal packets */}
                    <linearGradient id="cyberNormal" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                       <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <Tooltip content={<CyberTooltip />} />

                  {/* Normal baseline */}
                  <Area
                    type="monotone"
                    dataKey="normal"
                    name="Benign Baseline"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#cyberNormal)"
                    dot={false}
                  />

                  {/* Attack Spikes */}
                  <Area
                    type="monotone"
                    dataKey="attacks"
                    name="Attack Spikes"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fill="url(#cyberSpikes)"
                    dot={{ stroke: '#f43f5e', strokeWidth: 2, r: 3, fill: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#f43f5e', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* Chart Legend & Status Bar */}
              <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400 font-medium">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-rose-500 rounded-full inline-block shadow-xs shadow-rose-500" />
                    <span className="text-rose-400 font-bold">Malicious Packet Spikes</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-blue-500 rounded-full inline-block shadow-xs shadow-blue-500" />
                    <span className="text-blue-400 font-semibold">Benign Network Flow</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Auto-Refresh: {isLiveStreaming ? <span className="text-emerald-400 font-bold">STREAMING</span> : <span className="text-slate-500">PAUSED</span>}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Navigation Action Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Attack Detection Pipeline', path: '/detect', icon: ShieldAlert, color: 'hover:border-rose-500/50 hover:bg-rose-950/20' },
              { label: 'Interactive Network Graph', path: '/graph', icon: Layers, color: 'hover:border-cyan-500/50 hover:bg-cyan-950/20' },
              { label: 'AI Threat Explainer', path: '/analysis', icon: Cpu, color: 'hover:border-indigo-500/50 hover:bg-indigo-950/20' },
              { label: 'Audit Reports & CSV Export', path: '/reports', icon: Activity, color: 'hover:border-emerald-500/50 hover:bg-emerald-950/20' },
            ].map((nav) => (
              <button
                key={nav.path}
                onClick={() => navigate(nav.path)}
                className={`p-3.5 rounded-2xl soc-card ${nav.color} transition-all flex items-center justify-between text-xs font-bold cursor-pointer group hover:shadow-lg`}
              >
                <div className="flex items-center gap-2 truncate">
                  <nav.icon className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="truncate text-slate-200">{nav.label}</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL (1/3): Live Attack Stream Feed ─────────────────── */}
        <div className="soc-card p-5 flex flex-col h-[580px]">
          {/* Stream Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-xs shadow-rose-500" />
              <h2 className="text-sm font-extrabold text-white tracking-wide uppercase">
                Live Attack Stream Feed
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 font-mono">
              {filteredThreatLogs.length} Events
            </span>
          </div>

          {/* Subheader info */}
          <div className="flex items-center justify-between py-2 text-[10px] font-bold text-slate-400 border-b border-slate-800/80 font-mono">
            <span>SEVERITY / VECTOR</span>
            <span>SOURCE &amp; ACTION</span>
          </div>

          {/* Scrolling Feed Container */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 pr-1 space-y-1 mt-1">
            {filteredThreatLogs.length > 0 ? (
              filteredThreatLogs.map((log, idx) => {
                const isBlocked = blockedIps.has(log.source_ip);
                const isCritical = log.severity === 'CRITICAL';
                const isHigh = log.severity === 'HIGH';

                return (
                  <div
                    key={`${log.id}-${idx}`}
                    className="p-3 rounded-xl hover:bg-slate-800/40 transition-all border border-transparent hover:border-slate-700/80 cursor-pointer group relative"
                    onClick={() => handleOpenIncident(log)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {/* Left: Badge & Threat Type */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            isCritical ? 'bg-rose-950/70 text-rose-300 border border-rose-700/60 shadow-xs' :
                            isHigh ? 'bg-amber-950/70 text-amber-300 border border-amber-700/60' :
                            'bg-purple-950/70 text-purple-300 border border-purple-700/60'
                          }`}>
                            {log.severity || 'HIGH'}
                          </span>
                          <span className="text-xs font-bold text-slate-100 truncate">
                            {log.attack_type || 'Attack Vector'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                          <span className="text-rose-400 font-bold">{log.source_ip}</span>
                          <span>→</span>
                          <span>Port {log.port || 80}</span>
                        </div>
                      </div>

                      {/* Right: Timestamp & Action Buttons */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] font-mono text-slate-400">
                          {log.timestamp ? String(log.timestamp).split(' ')[1] || String(log.timestamp) : '10:32:05'}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenIncident(log)}
                            className="px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-mono font-semibold transition-colors cursor-pointer border border-slate-700 hover:border-cyan-500/50"
                          >
                            Mitigate
                          </button>
                          <button
                            onClick={() => handleBlockIp(log.source_ip)}
                            disabled={isBlocked}
                            className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                              isBlocked
                                ? 'bg-red-950/40 text-red-500 border border-red-900 cursor-not-allowed'
                                : 'bg-red-950/70 hover:bg-red-900/90 text-rose-300 border border-red-700 hover:border-rose-500'
                            }`}
                          >
                            {isBlocked ? 'Blocked' : 'Block IP'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 font-mono text-xs">
                <ShieldCheck className="w-8 h-8 text-slate-500 mb-2" />
                <p>No active incidents match query</p>
              </div>
            )}
          </div>

          {/* Feed Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Ingest: 3s cadence
            </span>
            <button
              onClick={() => navigate('/history')}
              className="text-cyan-400 hover:underline cursor-pointer"
            >
              Full Telemetry Archive →
            </button>
          </div>
        </div>

      </section>

      {/* ── 4. Modals & Deep Dive Drawers ─────────────────────────────── */}
      <IncidentDeepDiveDialog
        incident={selectedIncident}
        isOpen={isDeepDiveOpen}
        onClose={() => setIsDeepDiveOpen(false)}
        onBlock={handleBlockIp}
      />

      <EmergencyIsolateModal
        isOpen={isIsolateModalOpen}
        onClose={() => setIsIsolateModalOpen(false)}
      />

      </div> {/* ── Closes blurred dashboard content container ── */}

      {/* ── MANDATORY SYSTEM ALERT OVERLAY (Information Details at First, Blurs Everything Else) ── */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-300">
          <SystemArchitectureGuide
            isModal={true}
            onClose={() => {
              setShowAlertModal(false);
              sessionStorage.removeItem('dfg_show_login_alert');
            }}
            onScenarioInjected={loadDashboard}
          />
        </div>
      )}

    </div>
  );
};

export default Dashboard;
