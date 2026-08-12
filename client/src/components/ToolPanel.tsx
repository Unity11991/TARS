import React, { useEffect, useState } from 'react';
import { ToolDefinition } from '../types/index';
import { fetchTools } from '../services/api';
import { Wrench, Play, CheckCircle, AlertCircle } from 'lucide-react';

export const ToolPanel: React.FC = () => {
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [activeTestTool, setActiveTestTool] = useState<string | null>(null);
  const [testArg, setTestArg] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTools().then(setTools).catch(console.error);
  }, []);

  const runManualToolTest = async (toolName: string) => {
    setLoading(true);
    setTestResult(null);

    try {
      let argsObj: any = {};
      if (toolName === 'calculator') argsObj = { expression: testArg || '982 * 27' };
      else if (toolName === 'weather') argsObj = { city: testArg || 'Tokyo' };
      else if (toolName === 'get_time') argsObj = { location: testArg || 'Tokyo' };
      else if (toolName === 'web_search') argsObj = { query: testArg || 'Quantum physics' };

      const res = await fetch(`/api/tools/${toolName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(argsObj),
      });

      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyber-panel p-4 rounded-lg space-y-4 text-xs h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-aura-border pb-3">
        <div className="flex items-center gap-2 text-aura-cyan font-bold tracking-wide">
          <Wrench size={16} />
          <span>SYSTEM TOOLS ({tools.length})</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {tools.map((t) => (
          <div
            key={t.name}
            className="p-3 rounded bg-aura-card/70 border border-aura-border space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-aura-cyan font-bold uppercase">{t.name}</span>
              <button
                onClick={() => {
                  setActiveTestTool(activeTestTool === t.name ? null : t.name);
                  setTestResult(null);
                  setTestArg('');
                }}
                className="flex items-center gap-1 text-[10px] bg-aura-surface border border-aura-border px-2 py-0.5 rounded text-slate-300 hover:text-aura-cyan"
              >
                <Play size={10} />
                <span>{activeTestTool === t.name ? 'Close Test' : 'Run Test'}</span>
              </button>
            </div>

            <p className="text-slate-300 text-[11px] leading-relaxed">{t.description}</p>

            {/* Test Execution Drawer */}
            {activeTestTool === t.name && (
              <div className="pt-2 border-t border-aura-border space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Input param (e.g. ${
                      t.name === 'calculator' ? '982 * 27' : 'Tokyo'
                    })`}
                    value={testArg}
                    onChange={(e) => setTestArg(e.target.value)}
                    className="flex-1 bg-aura-bg border border-aura-border rounded px-2 py-1 text-xs text-white"
                  />
                  <button
                    onClick={() => runManualToolTest(t.name)}
                    disabled={loading}
                    className="bg-aura-cyan text-black px-2.5 py-1 rounded font-semibold hover:bg-cyan-300 disabled:opacity-50"
                  >
                    {loading ? 'Running...' : 'Execute'}
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`p-2 rounded border text-[11px] font-mono ${
                      testResult.success
                        ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/30 border-rose-800 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold mb-1">
                      {testResult.success ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      <span>{testResult.success ? 'Tool Success' : 'Tool Error'}</span>
                    </div>
                    <pre className="whitespace-pre-wrap overflow-x-auto text-[10px]">
                      {JSON.stringify(testResult.data || testResult.error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
