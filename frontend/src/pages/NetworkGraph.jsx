import React, { useState, useEffect, useCallback } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { 
  Network, 
  ShieldAlert, 
  Server, 
  Terminal, 
  Radio, 
  X, 
  Activity, 
  RefreshCw, 
  Zap, 
  Search,
  Crosshair,
  Layers
} from 'lucide-react';

import { api } from '../services/api';
import ThreatBadge from '../components/ThreatBadge';
import RiskGauge from '../components/RiskGauge';

// Custom SOC React Flow Node
const CyberNode = ({ data, selected }) => {
  const isSuspicious = data.isSuspicious || data.role === 'Attacker';
  const isVictim = data.role === 'Victim Server';
  const isServer = data.role === 'Server';

  let borderColor = 'border-slate-700';
  let bgColor = 'bg-slate-900/90';
  let glowColor = '';
  let icon = Terminal;

  if (isSuspicious) {
    borderColor = 'border-rose-500';
    bgColor = 'bg-rose-950/80';
    glowColor = 'shadow-lg shadow-rose-900/40 glow-red';
    icon = Crosshair;
  } else if (isVictim) {
    borderColor = 'border-purple-500';
    bgColor = 'bg-purple-950/80';
    glowColor = 'shadow-lg shadow-purple-900/40';
    icon = Server;
  } else if (isServer) {
    borderColor = 'border-blue-500';
    bgColor = 'bg-blue-950/80';
    glowColor = 'shadow-md shadow-blue-900/20';
    icon = Server;
  } else {
    borderColor = 'border-emerald-500/50';
    bgColor = 'bg-emerald-950/60';
    icon = Terminal;
  }

  const NodeIcon = icon;

  return (
    <div className={`px-3 py-2 rounded-xl border-2 ${borderColor} ${bgColor} ${glowColor} ${selected ? 'ring-2 ring-cyan-400' : ''} min-w-[140px] text-xs font-mono transition-all`}>
      <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-cyan-400 !w-2 !h-2" />
      
      <div className="flex items-center gap-1.5 mb-1">
        <NodeIcon className={`w-3.5 h-3.5 ${isSuspicious ? 'text-rose-400' : 'text-cyan-400'}`} />
        <span className="font-bold text-slate-100 truncate">{data.label}</span>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
        <span>{data.role}</span>
        <span className={isSuspicious ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
          {Math.round((data.riskScore || 0) * 100)}%
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-cyan-400 !w-2 !h-2" />
    </div>
  );
};

const nodeTypes = {
  cyberNode: CyberNode
};

export const NetworkGraph = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [summary, setSummary] = useState(null);
  const [gnnInfo, setGnnInfo] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');

  const loadGraph = async () => {
    setLoading(true);
    try {
      const res = await api.getGraphData(60);
      setNodes(res.nodes || []);
      setEdges(res.edges || []);
      setSummary(res.summary);
      setGnnInfo(res.gnn_info);
    } catch (err) {
      console.error("Failed to load graph data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, []);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node.data);
  }, []);

  return (
    <div className="p-6 space-y-6 relative">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            Interactive Network Topology Graph
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Graph-based entity relationship visualization. Nodes represent network endpoints and edges represent communication vectors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {summary && (
            <div className="hidden sm:flex items-center gap-4 text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-300">Nodes: <b className="text-cyan-400">{summary.total_nodes}</b></span>
              <span className="text-slate-300">Edges: <b className="text-cyan-400">{summary.total_edges}</b></span>
              <span className="text-slate-300">Suspicious: <b className="text-rose-400">{summary.suspicious_nodes}</b></span>
            </div>
          )}

          <button
            onClick={loadGraph}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Topology</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full h-[650px] rounded-2xl overflow-hidden border border-slate-800 bg-[#050811] shadow-2xl">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#050811]/90 z-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
              <p className="text-xs font-mono text-cyan-400 animate-pulse">Synthesizing Graph Neural Adjacency...</p>
            </div>
          </div>
        ) : null}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-[#050811]"
        >
          <Background color="#1e293b" gap={20} size={1} />
          <Controls className="!bg-slate-900 !border-slate-800 !text-slate-200" />
          <MiniMap 
            nodeColor={(n) => (n.data?.isSuspicious ? '#ef4444' : '#06b6d4')}
            className="!bg-slate-950 !border-slate-800 !rounded-lg" 
          />
        </ReactFlow>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 p-3 rounded-xl glass-card border border-slate-800/80 text-[11px] font-mono space-y-1.5 z-10 pointer-events-none">
          <p className="text-slate-400 uppercase tracking-wider font-bold mb-1">Topology Legend</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-300">Attacker Node (High Risk)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span className="text-slate-300">Victim Server (High Fan-In)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span className="text-slate-300">Core Infrastructure</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300">Benign Traffic Host</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            <span className="w-4 h-0.5 bg-rose-500 border-dashed"></span>
            <span className="text-slate-300">Active Cyber Attack Vector</span>
          </div>
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-80 glass-card p-5 rounded-2xl border border-cyan-500/40 shadow-2xl z-20 space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold font-mono text-white truncate">{selectedNode.ip}</h4>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Risk Meter */}
            <div className="flex justify-center py-1">
              <RiskGauge score={selectedNode.riskScore} label="Graph Structural Risk" size="md" />
            </div>

            {/* Metrics Breakdown */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400">Assigned Role:</span>
                <span className="font-bold text-slate-200">{selectedNode.role}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400">Total Connections:</span>
                <span className="font-bold text-cyan-400">{selectedNode.totalConnections}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400">In / Out Degree:</span>
                <span className="font-bold text-slate-200">{selectedNode.inDegree} in / {selectedNode.outDegree} out</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400">PageRank Centrality:</span>
                <span className="font-bold text-slate-200">{selectedNode.pagerank}</span>
              </div>
            </div>

            {/* Attack Types */}
            {selectedNode.attacksDetected && selectedNode.attacksDetected.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <p className="text-[11px] font-mono text-slate-400 mb-1.5">Detected Threat Behaviors:</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.attacksDetected.map((atk, i) => (
                    <ThreatBadge key={i} type={atk} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* GNN Architecture Modal/Summary Banner */}
      {gnnInfo && (
        <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <p className="font-bold text-slate-200">{gnnInfo.model_type}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{gnnInfo.message_passing}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-center">
            <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-semibold">
              {gnnInfo.status}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkGraph;
