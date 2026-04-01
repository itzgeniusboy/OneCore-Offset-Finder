import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, ChevronLeft, ChevronRight, Hash, Binary, Terminal, Save, Download, Edit3, Eye, Box, Braces, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScanResult } from '../types';

interface HexEditorProps {
  result: ScanResult;
  onClose: () => void;
  baseAddress: string;
}

export default function HexEditor({ result, onClose, baseAddress }: HexEditorProps) {
  const [viewMode, setViewMode] = useState<'hex' | 'text' | 'struct'>('hex');
  const [offset, setOffset] = useState(result.offset);
  const [pageSize, setPageSize] = useState(256);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedByte, setSelectedByte] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  // Mock memory data based on the result's bytes
  const memoryData = useMemo(() => {
    const bytes = result.bytes ? result.bytes.split(' ') : [];
    const data = new Uint8Array(pageSize);
    for (let i = 0; i < pageSize; i++) {
      if (i < bytes.length) {
        data[i] = parseInt(bytes[i], 16);
      } else {
        // Fill with some random-ish but deterministic data for the demo
        data[i] = (Math.sin(i + offset) * 127 + 128) & 0xFF;
      }
    }
    return data;
  }, [result.bytes, offset, pageSize]);

  const rows = useMemo(() => {
    const r = [];
    for (let i = 0; i < pageSize; i += 16) {
      r.push(memoryData.slice(i, i + 16));
    }
    return r;
  }, [memoryData, pageSize]);

  const formatHex = (num: number, padding = 8) => {
    return '0x' + num.toString(16).toUpperCase().padStart(padding, '0');
  };

  const getChar = (byte: number) => {
    return byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.';
  };

  const handleByteClick = (idx: number) => {
    setSelectedByte(idx);
    setEditValue(memoryData[idx].toString(16).toUpperCase().padStart(2, '0'));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md"
    >
      <div className="w-full h-full sm:h-[85vh] max-w-5xl bg-[#0a0a0a] border-0 sm:border border-[#00ff00]/40 rounded-none sm:rounded-2xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,255,0,0.1)]">
        {/* Header */}
        <div className="p-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:pt-4 border-b border-[#00ff00]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#00ff00]/5">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="p-2 bg-[#00ff00]/20 rounded-lg">
              <Binary className="w-5 h-5 sm:w-6 sm:h-6 text-[#00ff00]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-black text-[#00ff00] uppercase tracking-tighter leading-none truncate">Memory Inspector</h2>
              <p className="text-[9px] sm:text-[10px] font-mono text-[#00ff00]/60 mt-1 uppercase tracking-widest truncate">
                <span className="text-[#00ff00]">{result.text}</span> @ {result.hexOffset}
              </p>
            </div>
            <button onClick={onClose} className="sm:hidden p-2 hover:bg-[#00ff00]/10 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X className="w-6 h-6 text-[#00ff00]" />
            </button>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            <div className="flex bg-black/60 rounded-lg border border-[#00ff00]/20 p-1 flex-shrink-0">
              {[
                { id: 'hex', icon: Hash, label: 'Hex' },
                { id: 'text', icon: Terminal, label: 'Text' },
                { id: 'struct', icon: Box, label: 'Struct' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setViewMode(m.id as any)}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-all min-h-[36px] ${
                    viewMode === m.id 
                      ? 'bg-[#00ff00] text-black shadow-[0_0_10px_rgba(0,255,0,0.3)]' 
                      : 'text-[#00ff00]/40 hover:text-[#00ff00]'
                  }`}
                >
                  <m.icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{m.label}</span>
                </button>
              ))}
            </div>
            <button onClick={onClose} className="hidden sm:flex p-2 hover:bg-[#00ff00]/10 rounded-xl transition-colors min-h-[44px] min-w-[44px] items-center justify-center">
              <X className="w-6 h-6 text-[#00ff00]" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-3 bg-black/40 border-b border-[#00ff00]/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-black/60 border border-[#00ff00]/20 rounded-lg px-3 py-1.5 h-10">
              <button className="text-[#00ff00]/60 hover:text-[#00ff00] transition-colors min-w-[32px] h-full flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs font-mono text-[#00ff00] flex-1 sm:w-24 text-center">{formatHex(offset)}</span>
              <button className="text-[#00ff00]/60 hover:text-[#00ff00] transition-colors min-w-[32px] h-full flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#00ff00]/40" />
              <input 
                type="text" 
                placeholder="GOTO OFFSET / SEARCH BYTES..."
                className="bg-black/60 border border-[#00ff00]/20 rounded-lg pl-9 pr-4 py-1.5 h-10 text-xs text-[#00ff00] focus:outline-none focus:border-[#00ff00] w-full sm:w-64 placeholder:text-[#00ff00]/20 uppercase font-bold"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#00ff00]/10 hover:bg-[#00ff00]/20 text-[#00ff00] rounded-lg text-[10px] font-bold uppercase transition-all border border-[#00ff00]/20 min-h-[44px]">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dump Memory</span>
              <span className="sm:hidden">Dump</span>
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#00ff00] text-black hover:bg-[#00ff00]/80 rounded-lg text-[10px] font-bold uppercase transition-all shadow-[0_0_15px_rgba(0,255,0,0.2)] min-h-[44px]">
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Apply Changes</span>
              <span className="sm:hidden">Apply</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
          {/* Hex Grid */}
          <div className="flex-1 overflow-auto p-3 sm:p-6 font-mono text-xs sm:text-sm scrollbar-thin scrollbar-thumb-[#00ff00]/20">
            <div className="min-w-max">
              {/* Grid Header */}
              <div className="flex mb-4 pb-2 border-b border-[#00ff00]/10">
                <div className="w-20 sm:w-24 text-[#00ff00]/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Offset</div>
                <div className="flex gap-1 sm:gap-2 px-2 sm:px-4">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="w-6 sm:w-8 text-center text-[#00ff00]/40 text-[9px] sm:text-[10px] font-bold">{i.toString(16).toUpperCase().padStart(2, '0')}</div>
                  ))}
                </div>
                <div className="flex-1 text-[#00ff00]/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 sm:px-4">ASCII</div>
              </div>

              {/* Grid Rows */}
              {rows.map((row, rowIdx) => (
                <div key={rowIdx} className="flex group hover:bg-[#00ff00]/5 py-0.5 transition-colors">
                  <div className="w-20 sm:w-24 text-[#00ff00]/60 font-bold text-[11px] sm:text-sm">{formatHex(offset + rowIdx * 16)}</div>
                  <div className="flex gap-1 sm:gap-2 px-2 sm:px-4">
                    {Array.from(row).map((byte, byteIdx) => {
                      const absoluteIdx = rowIdx * 16 + byteIdx;
                      const isSelected = selectedByte === absoluteIdx;
                      return (
                        <button
                          key={byteIdx}
                          onClick={() => handleByteClick(absoluteIdx)}
                          className={`w-6 sm:w-8 text-center transition-all rounded min-h-[24px] sm:min-h-[28px] text-[11px] sm:text-sm ${
                            isSelected 
                              ? 'bg-[#00ff00] text-black font-black scale-110 shadow-[0_0_10px_rgba(0,255,0,0.5)]' 
                              : 'text-[#00ff00]/80 hover:text-[#00ff00] hover:bg-[#00ff00]/20'
                          }`}
                        >
                          {(byte as number).toString(16).toUpperCase().padStart(2, '0')}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex-1 px-2 sm:px-4 text-[#00ff00]/40 font-bold tracking-widest text-[11px] sm:text-sm">
                    {Array.from(row).map((byte, i) => (
                      <span key={i} className={selectedByte === rowIdx * 16 + i ? 'text-[#00ff00] font-black' : ''}>
                        {getChar(byte as number)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inspector Sidebar */}
          <div className="w-full sm:w-80 border-t sm:border-t-0 sm:border-l border-[#00ff00]/20 bg-black/60 p-4 sm:p-6 space-y-6 sm:space-y-8 overflow-auto scrollbar-thin scrollbar-thumb-[#00ff00]/20 max-h-[40vh] sm:max-h-none">
            <div>
              <h3 className="text-[9px] sm:text-[10px] font-black text-[#00ff00] uppercase tracking-widest mb-4 flex items-center gap-2">
                <Eye className="w-3 h-3" /> Data Inspector
              </h3>
              {selectedByte !== null ? (
                <div className="space-y-4">
                  <div className="p-3 sm:p-4 bg-[#00ff00]/10 rounded-xl border border-[#00ff00]/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] sm:text-[10px] text-[#00ff00]/60 font-bold uppercase">Selection</span>
                      <span className="text-xs font-mono text-[#00ff00]">{formatHex(offset + selectedByte)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-[#00ff00]" />
                      <input 
                        type="text" 
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value.toUpperCase().slice(0, 2))}
                        className="bg-black/40 border border-[#00ff00]/40 rounded px-2 py-1 text-lg font-mono text-[#00ff00] w-16 text-center focus:outline-none focus:border-[#00ff00] h-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                    {[
                      { label: 'Binary', value: memoryData[selectedByte].toString(2).padStart(8, '0') },
                      { label: 'Decimal', value: memoryData[selectedByte].toString() },
                      { label: 'Signed Int8', value: new Int8Array([memoryData[selectedByte]])[0].toString() },
                      { label: 'Char', value: getChar(memoryData[selectedByte]) },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center p-2 bg-black/40 rounded border border-[#00ff00]/10">
                        <span className="text-[8px] sm:text-[10px] text-[#00ff00]/40 font-bold uppercase">{item.label}</span>
                        <span className="text-[10px] sm:text-xs font-mono text-[#00ff00]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 sm:py-12 text-center">
                  <MousePointer2 className="w-6 h-6 sm:w-8 sm:h-8 text-[#00ff00]/20 mx-auto mb-4 animate-pulse" />
                  <p className="text-[9px] sm:text-[10px] text-[#00ff00]/40 font-bold uppercase tracking-widest">Select a byte to inspect</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-[9px] sm:text-[10px] font-black text-[#00ff00] uppercase tracking-widest mb-4 flex items-center gap-2">
                <Braces className="w-3 h-3" /> Multi-Byte Values
              </h3>
              {selectedByte !== null && selectedByte <= pageSize - 4 ? (
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                  {[
                    { label: 'Int32 (LE)', value: new Int32Array(memoryData.slice(selectedByte, selectedByte + 4).buffer)[0].toString() },
                    { label: 'UInt32 (LE)', value: new Uint32Array(memoryData.slice(selectedByte, selectedByte + 4).buffer)[0].toString() },
                    { label: 'Float (LE)', value: new Float32Array(memoryData.slice(selectedByte, selectedByte + 4).buffer)[0].toFixed(4) },
                    { label: 'Pointer', value: formatHex(new Uint32Array(memoryData.slice(selectedByte, selectedByte + 4).buffer)[0]) },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center p-2 bg-black/40 rounded border border-[#00ff00]/10">
                      <span className="text-[8px] sm:text-[10px] text-[#00ff00]/40 font-bold uppercase">{item.label}</span>
                      <span className="text-[10px] sm:text-xs font-mono text-[#00ff00]">{item.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[9px] sm:text-[10px] text-[#00ff00]/20 font-bold uppercase text-center py-4 italic">Insufficient bytes for multi-byte view</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3 bg-[#00ff00]/5 border-t border-[#00ff00]/20 flex flex-col sm:flex-row justify-between items-center gap-2 px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00ff00] animate-pulse shadow-[0_0_5px_#00ff00]" />
              <span className="text-[8px] sm:text-[10px] font-bold text-[#00ff00] uppercase tracking-widest">Engine Connected</span>
            </div>
            <div className="text-[8px] sm:text-[10px] font-mono text-[#00ff00]/60 uppercase tracking-widest">
              Page: <span className="text-[#00ff00]">1/1</span> | Size: <span className="text-[#00ff00]">{pageSize} Bytes</span>
            </div>
          </div>
          <div className="text-[8px] sm:text-[10px] font-mono text-[#00ff00]/40 uppercase tracking-widest">
            OneCore Memory Engine v2.4.0
          </div>
        </div>
      </div>
    </motion.div>
  );
}
