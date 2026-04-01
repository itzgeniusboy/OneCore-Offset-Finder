import React, { useState } from 'react';
import { X, Search, MousePointer2, ChevronRight, Hash, Binary, Terminal, Save, Download, Edit3, Eye, Box, Braces, Layers, Target, Zap, Shield, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScanResult, PointerResult } from '../types';

interface PointerScannerProps {
  onClose: () => void;
  baseAddress: string;
  onScan: (results: PointerResult[]) => void;
  results: PointerResult[];
}

export default function PointerScanner({ onClose, baseAddress, onScan, results }: PointerScannerProps) {
  const [targetAddress, setTargetAddress] = useState('');
  const [maxDepth, setMaxDepth] = useState(5);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  const startScan = () => {
    if (!targetAddress) return;
    setIsScanning(true);
    setProgress(0);
    
    // Simulate pointer scanning logic
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsScanning(false);
        
        // Generate mock pointer results
        const mockResults: PointerResult[] = [
          {
            id: 'ptr-1',
            baseOffset: 0x123456,
            offsets: [0x10, 0x20, 0x30],
            targetAddress: targetAddress,
            currentValue: '100',
            depth: 3
          },
          {
            id: 'ptr-2',
            baseOffset: 0x654321,
            offsets: [0x40, 0x50],
            targetAddress: targetAddress,
            currentValue: '100',
            depth: 2
          },
          {
            id: 'ptr-3',
            baseOffset: 0xABCDEF,
            offsets: [0x60, 0x70, 0x80, 0x90],
            targetAddress: targetAddress,
            currentValue: '100',
            depth: 4
          }
        ];
        onScan(mockResults);
      }
    }, 100);
  };

  const formatHex = (num: number) => '0x' + num.toString(16).toUpperCase();

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
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-[#00ff00]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#00ff00] uppercase tracking-tighter leading-none">Pointer Scanner</h2>
              <p className="text-[9px] sm:text-[10px] font-mono text-[#00ff00]/60 mt-1 uppercase tracking-widest">
                Multi-Level Pointer Discovery Engine
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#00ff00]/10 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="w-6 h-6 text-[#00ff00]" />
          </button>
        </div>

        {/* Setup Panel */}
        <div className="p-4 sm:p-6 bg-black/40 border-b border-[#00ff00]/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[9px] sm:text-[10px] font-black text-[#00ff00]/60 uppercase tracking-widest block">Target Address</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00ff00]/40" />
              <input 
                type="text" 
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                placeholder="e.g. 0x7F12345678"
                className="w-full bg-black/60 border border-[#00ff00]/20 rounded-lg pl-10 pr-4 py-2 h-11 text-sm text-[#00ff00] focus:outline-none focus:border-[#00ff00] font-mono uppercase"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] sm:text-[10px] font-black text-[#00ff00]/60 uppercase tracking-widest block">Max Depth</label>
            <div className="flex items-center gap-4 h-11">
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={maxDepth}
                onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                className="flex-1 accent-[#00ff00] h-2"
              />
              <span className="text-sm font-mono text-[#00ff00] w-8 text-right">{maxDepth}</span>
            </div>
          </div>
          <button 
            onClick={startScan}
            disabled={isScanning || !targetAddress}
            className="btn-primary w-full flex items-center justify-center gap-2 px-6 py-2 bg-[#00ff00] text-black hover:bg-[#00ff00]/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-black uppercase transition-all shadow-[0_0_20px_rgba(0,255,0,0.2)] min-h-[44px]"
          >
            {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isScanning ? 'Scanning...' : 'Start Pointer Scan'}
          </button>
        </div>

        {/* Progress Bar */}
        {isScanning && (
          <div className="h-1 bg-[#00ff00]/10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-[#00ff00] shadow-[0_0_10px_#00ff00]"
            />
          </div>
        )}

        {/* Results Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-[#00ff00]/20">
          {results.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {results.map((ptr, idx) => (
                <div key={ptr.id} className="p-3 sm:p-4 bg-black/60 border border-[#00ff00]/20 rounded-xl hover:border-[#00ff00]/50 transition-all group">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#00ff00]/10 flex items-center justify-center text-[#00ff00] font-black text-[10px] sm:text-xs">
                        #{idx + 1}
                      </div>
                      <div>
                        <h4 className="text-[10px] sm:text-xs font-black text-[#00ff00] uppercase tracking-widest">Pointer Chain</h4>
                        <p className="text-[8px] sm:text-[10px] font-mono text-[#00ff00]/40 uppercase">Depth: {ptr.depth}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] sm:text-[10px] font-black text-[#00ff00]/40 uppercase block mb-1">Current Value</span>
                      <span className="text-[11px] sm:text-sm font-mono text-[#00ff00] bg-[#00ff00]/10 px-2 py-1 rounded">{ptr.currentValue}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-[11px]">
                    <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-[#00ff00]/20 text-[#00ff00] rounded border border-[#00ff00]/30">
                      "libUE4.so" + {formatHex(ptr.baseOffset)}
                    </span>
                    {ptr.offsets.map((off, i) => (
                      <React.Fragment key={i}>
                        <ChevronRight className="w-3 h-3 text-[#00ff00]/40" />
                        <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-black/40 text-[#00ff00]/80 rounded border border-[#00ff00]/10">
                          {formatHex(off)}
                        </span>
                      </React.Fragment>
                    ))}
                    <ChevronRight className="w-3 h-3 text-[#00ff00]/40" />
                    <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-[#00ff00] text-black rounded font-black">
                      {ptr.targetAddress}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 py-12">
              <Layers className="w-12 h-12 sm:w-16 sm:h-16 text-[#00ff00]" />
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#00ff00] uppercase tracking-tighter">No Pointers Found</h3>
                <p className="text-[10px] sm:text-xs text-[#00ff00] max-w-[240px] sm:max-w-xs mx-auto">Enter a target address and start scanning to discover stable pointer chains.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3 bg-[#00ff00]/5 border-t border-[#00ff00]/20 flex justify-between items-center px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-[#00ff00]" />
            <span className="text-[8px] sm:text-[10px] font-bold text-[#00ff00] uppercase tracking-widest">Secure Memory Access</span>
          </div>
          <div className="text-[8px] sm:text-[10px] font-mono text-[#00ff00]/40 uppercase tracking-widest">
            Pointer Engine v1.2.0
          </div>
        </div>
      </div>
    </motion.div>
  );
}
