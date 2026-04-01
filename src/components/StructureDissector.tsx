import React, { useState, useMemo } from 'react';
import { X, Box, Plus, Trash2, Edit3, ChevronRight, ChevronDown, Hash, Binary, Terminal, Shield, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScanResult, MemoryStructure } from '../types';

interface StructureDissectorProps {
  onClose: () => void;
  baseAddress: string;
  selectedResult: ScanResult | null;
}

export default function StructureDissector({ onClose, baseAddress, selectedResult }: StructureDissectorProps) {
  const [structures, setStructures] = useState<MemoryStructure[]>([
    { offset: 0x0, type: 'int', value: 100, label: 'Health' },
    { offset: 0x4, type: 'float', value: 50.5, label: 'Mana' },
    { offset: 0x8, type: 'bool', value: true, label: 'IsAlive' },
    { offset: 0xC, type: 'pointer', value: '0x7F12345678', label: 'pWeapon' },
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [newField, setNewField] = useState<Partial<MemoryStructure>>({
    offset: 0,
    type: 'int',
    label: 'New Field'
  });

  const addField = () => {
    if (newField.label && newField.type) {
      setStructures(prev => [...prev, {
        offset: Number(newField.offset) || 0,
        type: newField.type as any,
        value: 0,
        label: newField.label || 'New Field'
      }].sort((a, b) => a.offset - b.offset));
      setIsAdding(false);
    }
  };

  const removeField = (offset: number) => {
    setStructures(prev => prev.filter(s => s.offset !== offset));
  };

  const formatHex = (num: number) => '0x' + num.toString(16).toUpperCase();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
    >
      <div className="w-full max-w-4xl bg-[#0a0a0a] border border-[#00ff00]/40 rounded-2xl overflow-hidden flex flex-col h-[80vh] shadow-[0_0_50px_rgba(0,255,0,0.1)]">
        {/* Header */}
        <div className="p-4 border-b border-[#00ff00]/20 flex items-center justify-between bg-[#00ff00]/5">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-[#00ff00]/20 rounded-lg">
              <Box className="w-6 h-6 text-[#00ff00]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#00ff00] uppercase tracking-tighter leading-none">Structure Dissector</h2>
              <p className="text-[10px] font-mono text-[#00ff00]/60 mt-1 uppercase tracking-widest">
                Analyze and Map Memory Structures
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#00ff00]/10 rounded-xl transition-colors">
            <X className="w-6 h-6 text-[#00ff00]" />
          </button>
        </div>

        {/* Info Bar */}
        <div className="p-4 bg-black/40 border-b border-[#00ff00]/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-[#00ff00]/40 font-bold uppercase">Base Object</span>
              <span className="text-xs font-mono text-[#00ff00]">{selectedResult?.text || 'Manual Entry'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[#00ff00]/40 font-bold uppercase">Address</span>
              <span className="text-xs font-mono text-[#00ff00]">{selectedResult?.hexOffset || '0x0'}</span>
            </div>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#00ff00] text-black rounded-lg text-[10px] font-black uppercase hover:scale-105 transition-all"
          >
            <Plus className="w-3 h-3" /> Add Field
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-3 scrollbar-thin scrollbar-thumb-[#00ff00]/20">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-black text-[#00ff00]/40 uppercase tracking-widest border-b border-[#00ff00]/10 mb-4">
            <div className="col-span-2">Offset</div>
            <div className="col-span-3">Label</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-4">Value</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          <AnimatePresence>
            {structures.map((s) => (
              <motion.div 
                key={s.offset}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-4 px-4 py-4 sm:py-3 bg-black/40 border border-[#00ff00]/10 rounded-xl hover:border-[#00ff00]/40 transition-all group items-start sm:items-center relative"
              >
                <div className="flex items-center justify-between w-full sm:w-auto sm:col-span-2">
                  <div className="font-mono text-xs text-[#00ff00]/60">+{formatHex(s.offset)}</div>
                  <div className="sm:hidden flex gap-2">
                    <button className="p-2 hover:bg-[#00ff00]/10 rounded-lg text-[#00ff00]/60 hover:text-[#00ff00] min-h-[44px] flex items-center justify-center">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => removeField(s.offset)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-red-500/60 hover:text-red-500 min-h-[44px] flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-3 text-xs font-bold text-white">{s.label}</div>
                <div className="sm:col-span-2">
                  <span className="px-2 py-0.5 bg-[#00ff00]/10 text-[#00ff00] rounded text-[9px] font-bold uppercase border border-[#00ff00]/20">
                    {s.type}
                  </span>
                </div>
                <div className="sm:col-span-4 font-mono text-xs text-[#00ff00] truncate w-full">
                  {s.type === 'pointer' ? s.value : s.value.toString()}
                </div>
                <div className="hidden sm:flex col-span-1 justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 hover:bg-[#00ff00]/10 rounded text-[#00ff00]/60 hover:text-[#00ff00]">
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => removeField(s.offset)}
                    className="p-1 hover:bg-red-500/10 rounded text-red-500/60 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-[#00ff00]/5 border border-[#00ff00]/40 rounded-xl flex flex-col sm:grid sm:grid-cols-12 gap-4 items-stretch sm:items-end"
            >
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-[#00ff00]/60 uppercase tracking-widest">Offset</label>
                <input 
                  type="text" 
                  value={newField.offset}
                  onChange={(e) => setNewField(prev => ({ ...prev, offset: e.target.value as any }))}
                  className="w-full bg-black/60 border border-[#00ff00]/20 rounded-xl px-3 py-2.5 text-sm text-[#00ff00] focus:outline-none focus:border-[#00ff00]"
                />
              </div>
              <div className="sm:col-span-4 space-y-1.5">
                <label className="text-[10px] font-bold text-[#00ff00]/60 uppercase tracking-widest">Label</label>
                <input 
                  type="text" 
                  value={newField.label}
                  onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full bg-black/60 border border-[#00ff00]/20 rounded-xl px-3 py-2.5 text-sm text-[#00ff00] focus:outline-none focus:border-[#00ff00]"
                />
              </div>
              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-[10px] font-bold text-[#00ff00]/60 uppercase tracking-widest">Type</label>
                <select 
                  value={newField.type}
                  onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full bg-black/60 border border-[#00ff00]/20 rounded-xl px-3 py-2.5 text-sm text-[#00ff00] focus:outline-none focus:border-[#00ff00]"
                >
                  <option value="int">Integer</option>
                  <option value="float">Float</option>
                  <option value="bool">Boolean</option>
                  <option value="string">String</option>
                  <option value="pointer">Pointer</option>
                </select>
              </div>
              <div className="sm:col-span-3 flex gap-2">
                <button 
                  onClick={addField}
                  className="flex-1 py-3 bg-[#00ff00] text-black rounded-xl font-black text-[11px] uppercase min-h-[44px]"
                >
                  Confirm
                </button>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-3 bg-black/60 text-[#00ff00] border border-[#00ff00]/20 rounded-xl font-black text-[11px] uppercase min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#00ff00]/5 border-t border-[#00ff00]/20 flex justify-between items-center px-6">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00ff00]" />
            <span className="text-[10px] font-bold text-[#00ff00] uppercase tracking-widest">Structure Integrity Verified</span>
          </div>
          <div className="text-[10px] font-mono text-[#00ff00]/40 uppercase tracking-widest">
            Dissector Engine v1.0.2
          </div>
        </div>
      </div>
    </motion.div>
  );
}
