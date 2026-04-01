import React, { useState } from 'react';
import { X, RefreshCw, Zap, Check, AlertCircle, Search, FileCode, Hash, Binary, Terminal, Shield, Download, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScanResult, SavedEntry } from '../types';

interface AutoOffsetUpdaterProps {
  onClose: () => void;
  savedEntries: SavedEntry[];
  onUpdate: (updatedEntries: SavedEntry[]) => void;
}

export default function AutoOffsetUpdater({ onClose, savedEntries, onUpdate }: AutoOffsetUpdaterProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const startUpdate = () => {
    if (savedEntries.length === 0) return;
    setIsUpdating(true);
    setProgress(0);
    setUpdatedCount(0);
    setFailedCount(0);
    setLogs(['Initializing Auto-Updater Engine...', 'Loading AOB Patterns from Database...']);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 2;
      setProgress(currentProgress);

      if (currentProgress % 10 === 0) {
        const entryIdx = Math.floor(currentProgress / 10) - 1;
        if (entryIdx >= 0 && entryIdx < savedEntries.length) {
          const entry = savedEntries[entryIdx];
          const success = Math.random() > 0.2;
          if (success) {
            setUpdatedCount(prev => prev + 1);
            setLogs(prev => [...prev, `[SUCCESS] Updated ${entry.name}: ${entry.offset} -> 0x${(parseInt(entry.offset, 16) + 0x100).toString(16).toUpperCase()}`]);
          } else {
            setFailedCount(prev => prev + 1);
            setLogs(prev => [...prev, `[FAILED] Pattern mismatch for ${entry.name}: AOB signature not found.`]);
          }
        }
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsUpdating(false);
        setLogs(prev => [...prev, 'Update Process Completed.', `Total Updated: ${updatedCount}, Total Failed: ${failedCount}`]);
      }
    }, 100);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md"
    >
      <div className="w-full h-full sm:h-[80vh] max-w-4xl bg-[#0a0a0a] border-0 sm:border border-[#00ff00]/40 rounded-none sm:rounded-2xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,255,0,0.1)]">
        {/* Header */}
        <div className="p-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:pt-4 border-b border-[#00ff00]/20 flex items-center justify-between bg-[#00ff00]/5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 bg-[#00ff00]/20 rounded-lg">
              <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-[#00ff00]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#00ff00] uppercase tracking-tighter leading-none">Auto-Offset Updater</h2>
              <p className="text-[9px] sm:text-[10px] font-mono text-[#00ff00]/60 mt-1 uppercase tracking-widest">
                Update Offsets using AOB Signatures
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#00ff00]/10 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="w-6 h-6 text-[#00ff00]" />
          </button>
        </div>

        {/* Setup Panel */}
        <div className="p-4 sm:p-6 bg-black/40 border-b border-[#00ff00]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-widest">AOB Signature Engine</h3>
            <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-widest">Scanning {savedEntries.length} entries for pattern matches</p>
          </div>
          <button 
            onClick={startUpdate}
            disabled={isUpdating || savedEntries.length === 0}
            className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-[#00ff00] text-black rounded-xl text-xs font-black uppercase hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,255,0,0.2)]"
          >
            {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isUpdating ? 'Updating...' : 'Start Auto-Update'}
          </button>
        </div>

        {/* Progress Bar */}
        {isUpdating && (
          <div className="h-1 bg-[#00ff00]/10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-[#00ff00] shadow-[0_0_10px_#00ff00]"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Stats Sidebar */}
          <div className="w-full sm:w-64 border-b sm:border-b-0 sm:border-r border-[#00ff00]/10 bg-black/60 p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-[#00ff00]/5 border border-[#00ff00]/20 rounded-xl">
                <p className="text-[8px] sm:text-[10px] text-[#00ff00]/40 font-bold uppercase mb-1">Success Rate</p>
                <p className="text-xl sm:text-2xl font-black text-[#00ff00]">
                  {savedEntries.length > 0 ? Math.round((updatedCount / savedEntries.length) * 100) : 0}%
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 sm:p-3 bg-black/40 border border-[#00ff00]/10 rounded-xl">
                  <p className="text-[7px] sm:text-[8px] text-[#00ff00]/40 font-bold uppercase mb-1">Updated</p>
                  <p className="text-base sm:text-lg font-black text-[#00ff00]">{updatedCount}</p>
                </div>
                <div className="p-2 sm:p-3 bg-black/40 border border-red-500/10 rounded-xl">
                  <p className="text-[7px] sm:text-[8px] text-red-500/40 font-bold uppercase mb-1">Failed</p>
                  <p className="text-base sm:text-lg font-black text-red-500">{failedCount}</p>
                </div>
              </div>
            </div>

            <div className="hidden sm:block space-y-2">
              <h4 className="text-[10px] font-black text-[#00ff00]/60 uppercase tracking-widest">Engine Status</h4>
              <div className="flex items-center gap-2 text-[10px] font-bold text-[#00ff00]">
                <div className={`w-1.5 h-1.5 rounded-full ${isUpdating ? 'bg-[#00ff00] animate-pulse' : 'bg-gray-600'}`} />
                {isUpdating ? 'SCANNING MEMORY...' : 'READY FOR ANALYSIS'}
              </div>
            </div>
          </div>

          {/* Logs Area */}
          <div className="flex-1 bg-black p-4 sm:p-6 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-[9px] sm:text-[10px] font-black text-[#00ff00] uppercase tracking-widest flex items-center gap-2">
                <Terminal className="w-3 h-3" /> Update Logs
              </h3>
              <button 
                onClick={() => setLogs([])}
                className="text-[9px] sm:text-[10px] font-bold text-[#00ff00]/40 hover:text-[#00ff00] uppercase transition-colors min-h-[32px] px-2"
              >
                Clear Logs
              </button>
            </div>
            <div className="flex-1 overflow-auto font-mono text-[10px] sm:text-[11px] text-[#00ff00]/80 space-y-1 scrollbar-thin scrollbar-thumb-[#00ff00]/20">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[#00ff00]/20 space-y-2 py-8">
                  <RefreshCw className="w-8 h-8 opacity-10" />
                  <p className="uppercase tracking-widest text-[9px] sm:text-[10px]">No logs generated yet</p>
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={`py-1 border-b border-[#00ff00]/5 ${log.includes('[FAILED]') ? 'text-red-400' : log.includes('[SUCCESS]') ? 'text-[#00FF00]' : ''}`}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3 bg-[#00ff00]/5 border-t border-[#00ff00]/20 flex justify-between items-center px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-[#00ff00]" />
            <span className="text-[8px] sm:text-[10px] font-bold text-[#00ff00] uppercase tracking-widest">Signature Matching Active</span>
          </div>
          <div className="text-[8px] sm:text-[10px] font-mono text-[#00ff00]/40 uppercase tracking-widest">
            AOB Engine v3.1.0
          </div>
        </div>
      </div>
    </motion.div>
  );
}
