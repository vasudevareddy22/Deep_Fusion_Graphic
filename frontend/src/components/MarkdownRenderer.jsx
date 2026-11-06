import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

export const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  // Split content into blocks: code blocks vs text blocks
  const parts = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: content.substring(lastIndex, match.index) });
    }
    parts.push({ type: 'code', lang: match[1] || 'bash', value: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.substring(lastIndex) });
  }

  return (
    <div className="space-y-3 text-xs leading-relaxed text-slate-200">
      {parts.map((part, pIdx) => {
        if (part.type === 'code') {
          return <CodeBlock key={pIdx} code={part.value} lang={part.lang} />;
        }
        return <TextBlock key={pIdx} text={part.value} />;
      })}
    </div>
  );
};

const CodeBlock = ({ code, lang }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-xl overflow-hidden border border-cyan-500/30 bg-[#060A13] shadow-lg shadow-black/60">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#0A1020] border-b border-cyan-500/20 text-[10px] font-mono text-cyan-300">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="uppercase tracking-wider font-bold">{lang || 'SHELL'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 transition-colors border border-cyan-500/30"
          title="Copy command"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span className="text-[10px]">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre selection:bg-cyan-500/30">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const TextBlock = ({ text }) => {
  const lines = text.split('\n');

  // Helper to format inline markdown (bold, code, links)
  const formatInline = (str) => {
    // Replace inline code `code`
    const parts = str.split(/(`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 font-mono text-[11px] border border-cyan-500/20">
            {part.slice(1, -1)}
          </code>
        );
      }
      // Replace bold **text**
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((bPart, j) => {
        if (bPart.startsWith('**') && bPart.endsWith('**')) {
          return (
            <strong key={`${i}-${j}`} className="font-bold text-white tracking-wide">
              {bPart.slice(2, -2)}
            </strong>
          );
        }
        return bPart;
      });
    });
  };

  // Group table lines if present
  const elements = [];
  let tableBuffer = [];

  const flushTable = () => {
    if (tableBuffer.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} className="my-2 overflow-x-auto">
          <table className="min-w-full text-left text-[11px] border border-slate-800 rounded-lg overflow-hidden bg-[#0A1020]">
            <tbody>
              {tableBuffer.map((row, rIdx) => {
                const cols = row.split('|').filter((_, cIdx, arr) => cIdx > 0 && cIdx < arr.length - 1).map(c => c.trim());
                if (rIdx === 0) {
                  return (
                    <tr key={rIdx} className="bg-slate-900/90 text-cyan-300 font-bold border-b border-slate-800 font-mono">
                      {cols.map((col, cIdx) => (
                        <th key={cIdx} className="px-3 py-2">{formatInline(col)}</th>
                      ))}
                    </tr>
                  );
                }
                if (row.includes('---')) return null; // divider
                return (
                  <tr key={rIdx} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    {cols.map((col, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-slate-300">{formatInline(col)}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      tableBuffer = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      tableBuffer.push(trimmed);
      return;
    } else {
      flushTable();
    }

    if (!trimmed) {
      return;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={idx} className="text-sm font-bold font-mono text-cyan-300 pt-2 flex items-center gap-1.5 border-b border-slate-800/80 pb-1">
          {formatInline(trimmed.replace('### ', ''))}
        </h3>
      );
    } else if (trimmed.startsWith('#### ')) {
      elements.push(
        <h4 key={idx} className="text-xs font-bold font-mono text-slate-100 pt-1.5 text-cyan-400">
          {formatInline(trimmed.replace('#### ', ''))}
        </h4>
      );
    } else if (trimmed.startsWith('> ')) {
      // Blockquote
      elements.push(
        <blockquote key={idx} className="border-l-2 border-cyan-400/80 pl-3 py-1 my-1.5 bg-cyan-950/20 text-cyan-200 italic rounded-r">
          {formatInline(trimmed.replace('> ', ''))}
        </blockquote>
      );
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      // Bullet point
      elements.push(
        <div key={idx} className="flex items-start gap-2 pl-2 text-slate-300">
          <span className="text-cyan-400 mt-1 shrink-0">•</span>
          <span>{formatInline(trimmed.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      // Numbered list
      const numMatch = trimmed.match(/^(\d+\.)\s(.*)/);
      elements.push(
        <div key={idx} className="flex items-start gap-2 pl-2 text-slate-300">
          <span className="text-cyan-400 font-mono shrink-0">{numMatch[1]}</span>
          <span>{formatInline(numMatch[2])}</span>
        </div>
      );
    } else {
      elements.push(
        <p key={idx} className="text-slate-300 leading-relaxed">
          {formatInline(trimmed)}
        </p>
      );
    }
  });

  flushTable();

  return <div className="space-y-1.5">{elements}</div>;
};

export default MarkdownRenderer;
