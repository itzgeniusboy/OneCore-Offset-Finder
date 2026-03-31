import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Upload, 
  Play, 
  Pause, 
  Square, 
  Download, 
  Search, 
  Copy, 
  Check, 
  AlertCircle, 
  FileText, 
  Settings,
  Activity,
  Zap,
  Shield,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Filter,
  Trash2,
  Database,
  Star,
  FolderOpen,
  LayoutGrid,
  Sparkles,
  SearchCode,
  ArrowRightLeft,
  Briefcase,
  Maximize2,
  Minimize2,
  Lightbulb,
  FileCode,
  Hash,
  Binary,
  Share2,
  Eye,
  Save,
  Layers,
  FileSearch,
  FilePlus,
  Tag,
  Clock,
  MoreHorizontal,
  Smartphone,
  MousePointer2,
  Undo2,
  History as HistoryIcon,
  XCircle,
  FileClock,
  CopyPlus,
  ListChecks,
  ArrowDownToLine
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScanResult, ScanProgress, ScanOptions, ScanMode, SavedEntry, Workspace, ComparisonHistory, ScanHistory, RecentFile } from './types';

const CHUNK_SIZE = 1024 * 1024; // 1MB
const OVERLAP_SIZE = 4096; // 4KB overlap

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [progress, setProgress] = useState<ScanProgress>({
    scannedBytes: 0,
    totalBytes: 0,
    stringsFound: 0,
    currentChunk: 0,
    totalChunks: 0,
    isScanning: false,
    isPaused: false,
    startTime: 0,
    phase: 'strings'
  });
  const [options, setOptions] = useState<ScanOptions>({
    minLength: 5,
    maxLength: 100,
    mode: 'balanced',
    removeDuplicates: true,
    resultLimit: 2000,
    searchPattern: '',
    baseAddress: '0x0',
  });
  const [offsetDisplayMode, setOffsetDisplayMode] = useState<'hex' | 'dec' | 'real'>('hex');
  const frequencyMap = useRef<Map<string, number>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New State for Advanced Features
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [selectedResult, setSelectedResult] = useState<ScanResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [compareResults, setCompareResults] = useState<ScanResult[]>([]);
  const [activeTab, setActiveTab] = useState<'scan' | 'database' | 'compare' | 'workspaces' | 'history'>('scan');
  const [isCleanMode, setIsCleanMode] = useState(false);
  const [isUltraFastSearch, setIsUltraFastSearch] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [history, setHistory] = useState<ComparisonHistory[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isImportantOnly, setIsImportantOnly] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [isAutoSafeMode, setIsAutoSafeMode] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(true);
  const [copyFormat, setCopyFormat] = useState<'hex' | 'dec' | 'real' | 'pattern' | 'cpp'>('hex');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const pauseRef = useRef(false);
  const stopRef = useRef(false);

  // Load Database and Backup from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('oncecore_db');
    if (saved) setSavedEntries(JSON.parse(saved));

    const backup = localStorage.getItem('oncecore_backup');
    if (backup) {
      const data = JSON.parse(backup);
      if (data.results) setResults(data.results);
    }

    const savedHistory = localStorage.getItem('oncecore_scan_history');
    if (savedHistory) setScanHistory(JSON.parse(savedHistory));

    const savedRecent = localStorage.getItem('oncecore_recent_files');
    if (savedRecent) setRecentFiles(JSON.parse(savedRecent));
  }, []);

  // Timer for elapsed time
  useEffect(() => {
    let interval: any;
    if (progress.isScanning && !progress.isPaused) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [progress.isScanning, progress.isPaused]);

  // Save Scan History
  useEffect(() => {
    localStorage.setItem('oncecore_scan_history', JSON.stringify(scanHistory));
  }, [scanHistory]);

  // Save Recent Files
  useEffect(() => {
    localStorage.setItem('oncecore_recent_files', JSON.stringify(recentFiles));
  }, [recentFiles]);

  // Auto-save Backup
  useEffect(() => {
    if (results.length > 0) {
      localStorage.setItem('oncecore_backup', JSON.stringify({ results }));
    }
  }, [results]);

  // Save Database
  useEffect(() => {
    localStorage.setItem('oncecore_db', JSON.stringify(savedEntries));
  }, [savedEntries]);

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker(new URL('./scanner.worker.ts', import.meta.url), { type: 'module' });
    
    workerRef.current.onmessage = (e: MessageEvent<ScanResult[]>) => {
      const data = e.data;
      
      // Update frequency map
      data.forEach(res => {
        const count = frequencyMap.current.get(res.text) || 0;
        frequencyMap.current.set(res.text, count + 1);
      });

      const processedResults = data.map(res => {
        const hints: string[] = [];
        const text = res.text.toLowerCase();
        const freq = frequencyMap.current.get(res.text) || 1;
        
        // Improved Hint System
        if (text.includes('health') || text.includes('hp')) hints.push('Possible Health Offset');
        if (text.includes('player') || text.includes('local')) hints.push('Player Related');
        if (text.includes('enemy') || text.includes('target')) hints.push('Enemy Related');
        if (text.includes('weapon') || text.includes('gun')) hints.push('Weapon Related');
        if (text.includes('unity') || text.includes('engine')) hints.push('Engine String');
        if (res.text.length > 20) hints.push('Long String');
        if (res.text.length < 4) hints.push('Short Fragment');
        
        if (freq > 5) hints.push('High frequency string');
        
        const importantKeywords = ['gworld', 'gnames', 'uworld', 'canvas', 'camera', 'transform', 'position', 'rotation', 'velocity'];
        if (importantKeywords.some(k => text.includes(k))) {
          hints.push('Possible important offset');
        }
        
        return { ...res, hints, frequency: freq };
      });
      
      setResults(prev => {
        const updatedPrev = prev.map(item => ({
          ...item,
          frequency: frequencyMap.current.get(item.text) || item.frequency
        }));

        let combined = [...updatedPrev, ...processedResults];
        if (options.removeDuplicates) {
          const seen = new Set();
          combined = combined.filter(item => {
            const key = `${item.text}-${item.offset}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }
        return combined.slice(0, options.resultLimit);
      });

      if (autoScroll) {
        const resultsList = document.getElementById('results-list');
        if (resultsList) {
          resultsList.scrollTop = resultsList.scrollHeight;
        }
      }

      setProgress(prev => ({
        ...prev,
        stringsFound: prev.stringsFound + processedResults.length
      }));
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [options.removeDuplicates, options.resultLimit]);

  const formatHex = (num: number) => {
    return '0x' + num.toString(16).toUpperCase().padStart(6, '0');
  };

  const getAbsoluteAddress = (offset: number) => {
    const base = parseInt(options.baseAddress.replace('0x', ''), 16) || 0;
    return formatHex(base + offset);
  };

  const detectModuleBase = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('libue4')) {
      setOptions(prev => ({ ...prev, baseAddress: '0x1000000' }));
    } else if (lowerName.includes('libil2cpp')) {
      setOptions(prev => ({ ...prev, baseAddress: '0x2000000' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.so')) {
        setError('Please select a valid .so file.');
        return;
      }
      setFile(selectedFile);
      detectModuleBase(selectedFile.name);
      setError(null);
      resetScan();

      // Update Recent Files
      const newRecent: RecentFile = {
        name: selectedFile.name,
        size: selectedFile.size,
        timestamp: Date.now(),
        lastChunk: 0
      };
      setRecentFiles(prev => {
        const filtered = prev.filter(f => f.name !== selectedFile.name);
        return [newRecent, ...filtered].slice(0, 3);
      });

      // Auto Safe Mode Detection
      if (isAutoSafeMode) {
        const cores = navigator.hardwareConcurrency || 4;
        if (cores <= 2) setOptions(prev => ({ ...prev, mode: 'safe' }));
        else if (cores <= 4) setOptions(prev => ({ ...prev, mode: 'balanced' }));
        else setOptions(prev => ({ ...prev, mode: 'fast' }));
      }
    }
  };

  const resetScan = () => {
    setResults([]);
    frequencyMap.current.clear();
    setProgress({
      scannedBytes: 0,
      totalBytes: file?.size || 0,
      stringsFound: 0,
      currentChunk: 0,
      totalChunks: Math.ceil((file?.size || 0) / CHUNK_SIZE),
      isScanning: false,
      isPaused: false,
      startTime: 0,
      phase: options.searchPattern ? 'patterns' : 'strings'
    });
    stopRef.current = false;
    pauseRef.current = false;
  };

  const startScan = async () => {
    if (!file) return;
    
    stopRef.current = false;
    pauseRef.current = false;
    
    const isResuming = progress.currentChunk > 0;
    if (!isResuming) {
      setElapsedTime(0);
      setResults([]);
    }
    
    setProgress(prev => ({
      ...prev,
      isScanning: true,
      isPaused: false,
      startTime: isResuming ? prev.startTime : Date.now(),
      totalBytes: file.size,
      totalChunks: Math.ceil(file.size / CHUNK_SIZE),
      phase: options.searchPattern ? 'patterns' : 'strings'
    }));

    const delay = options.mode === 'safe' ? 100 : options.mode === 'balanced' ? 50 : 10;
    
    for (let i = progress.currentChunk; i < Math.ceil(file.size / CHUNK_SIZE); i++) {
      if (stopRef.current) break;
      
      while (pauseRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (stopRef.current) break;
      }
      if (stopRef.current) break;

      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE + OVERLAP_SIZE, file.size);
      const blob = file.slice(start, end);
      const buffer = await blob.arrayBuffer();

      workerRef.current?.postMessage({
        buffer,
        offset: start,
        minLength: options.minLength,
        searchPattern: options.searchPattern,
        extractBytes: true // Always extract context bytes for the viewer
      });

      setProgress(prev => ({
        ...prev,
        scannedBytes: Math.min(start + CHUNK_SIZE, file.size),
        currentChunk: i + 1
      }));

      // Update Recent Files last position
      setRecentFiles(prev => prev.map(f => 
        f.name === file.name ? { ...f, lastChunk: i + 1 } : f
      ));

      // Adaptive delay
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    if (!stopRef.current) {
      setProgress(prev => ({
        ...prev,
        isScanning: false,
        endTime: Date.now()
      }));

      // Add to Scan History
      const historyItem: ScanHistory = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        fileName: file.name,
        resultCount: results.length,
        results: [...results]
      };
      setScanHistory(prev => {
        const filtered = prev.filter(h => h.fileName !== file.name);
        return [historyItem, ...filtered].slice(0, 10);
      });
    }
  };

  const pauseScan = () => {
    pauseRef.current = true;
    setProgress(prev => ({ ...prev, isPaused: true }));
  };

  const resumeScan = () => {
    pauseRef.current = false;
    setProgress(prev => ({ ...prev, isPaused: false }));
  };

  const stopScan = () => {
    stopRef.current = true;
    pauseRef.current = false;
    setProgress(prev => ({ ...prev, isScanning: false, isPaused: false }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCompare = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const compareFile = e.target.files?.[0];
    if (!compareFile || !file) return;
    
    setIsComparing(true);
    const oldResults = [...results];
    const oldFileName = file.name;
    const newFileName = compareFile.name;
    
    setFile(compareFile);
    resetScan();
    
    // We'll scan the new file and then compare
    // For this to work, we need to know when the scan is done
    // Let's add a temporary effect or a way to trigger comparison after scan
    setError(`Comparing ${oldFileName} with ${newFileName}... Scan the new file to see differences.`);
    
    // We'll store the old results in a ref to compare later
    (window as any)._oldResults = oldResults;
    (window as any)._oldFileName = oldFileName;
  };

  // Effect to handle comparison after scan completes
  useEffect(() => {
    if (!progress.isScanning && progress.endTime && (window as any)._oldResults) {
      const oldResults = (window as any)._oldResults as ScanResult[];
      const oldFileName = (window as any)._oldFileName as string;
      
      const newResults = results.map(res => {
        const matchingOld = oldResults.find(old => old.text === res.text);
        if (!matchingOld) return { ...res, isNew: true, status: 'new' as const };
        if (matchingOld.hexOffset !== res.hexOffset) return { ...res, status: 'changed' as const };
        return { ...res, status: 'unchanged' as const };
      });
      
      const removed = oldResults.filter(old => !results.find(res => res.text === old.text))
        .map(old => ({ ...old, status: 'removed' as const }));
      
      const finalResults = [...newResults, ...removed];
      setResults(finalResults);
      
      const historyItem: ComparisonHistory = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        oldFileName,
        newFileName: file?.name || 'New File',
        stats: {
          new: newResults.filter(r => r.status === 'new').length,
          removed: removed.length,
          changed: newResults.filter(r => r.status === 'changed').length
        },
        results: finalResults
      };
      
      setHistory(prev => [historyItem, ...prev]);
      delete (window as any)._oldResults;
      delete (window as any)._oldFileName;
      setIsComparing(false);
      setError(null);
    }
  }, [progress.isScanning, progress.endTime, results, file]);

  const clearHistory = () => {
    if (confirm('Clear all comparison history?')) {
      setHistory([]);
    }
  };

  const saveToDatabase = (result: ScanResult) => {
    const entry: SavedEntry = {
      id: Math.random().toString(36).substr(2, 9),
      name: result.text,
      offset: result.hexOffset,
      text: result.text,
      tags: [],
      timestamp: Date.now()
    };
    setSavedEntries(prev => [...prev, entry]);
  };

  const generatePattern = (result: ScanResult) => {
    if (!result.bytes) return 'No bytes available';
    
    // Simple AOB pattern generator: replace some bytes with ?? to simulate "stability"
    // In a real tool, this would be more complex (comparing multiple instances)
    const bytes = result.bytes.split(' ');
    const pattern = bytes.map((b, i) => (i % 4 === 0 && i !== 0 ? '??' : b)).join(' ');
    return pattern;
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) setResults(data);
      } catch (err) {
        setError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const exportResults = (format: 'txt' | 'json') => {
    let content = '';
    let fileName = `offsets_${file?.name || 'scan'}.${format}`;
    
    if (format === 'txt') {
      content = results.map(r => `${r.hexOffset} | ${r.text}`).join('\n');
    } else {
      content = JSON.stringify(results, null, 2);
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleFavorite = (id: string) => {
    setResults(prev => prev.map(res => 
      res.id === id ? { ...res, isFavorite: !res.isFavorite } : res
    ));
  };

  const findSimilar = (text: string) => {
    setSearchQuery(text.substring(0, Math.min(text.length, 4)));
  };

  const saveWorkspace = () => {
    const name = prompt('Enter workspace name:', file?.name || 'New Project');
    if (!name) return;
    
    const newWorkspace: Workspace = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      results: [...results],
      timestamp: Date.now(),
      fileName: file?.name
    };
    
    setWorkspaces(prev => [...prev, newWorkspace]);
    setCurrentWorkspaceId(newWorkspace.id);
  };

  const loadWorkspace = (ws: Workspace) => {
    setResults(ws.results);
    setCurrentWorkspaceId(ws.id);
    setActiveTab('scan');
  };

  const formatCopy = (result: ScanResult) => {
    const offset = offsetDisplayMode === 'hex' ? formatHex(result.offset) : 
                   offsetDisplayMode === 'real' ? getAbsoluteAddress(result.offset) : 
                   result.offset.toString();
    switch (copyFormat) {
      case 'dec': return result.offset.toString();
      case 'real': return getAbsoluteAddress(result.offset);
      case 'pattern': return generatePattern(result);
      case 'cpp': return `uintptr_t ${result.text.replace(/[^a-zA-Z0-9]/g, '_')} = ${offset};`;
      default: return offset;
    }
  };

  const stats = useMemo(() => {
    const unique = new Set(results.map(r => r.text)).size;
    return {
      total: results.length,
      unique,
      size: file?.size || 0,
      time: progress.endTime && progress.startTime ? (progress.endTime - progress.startTime) / 1000 : 0
    };
  }, [results, file, progress.endTime, progress.startTime]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copySelected = () => {
    const selectedResults = results.filter(r => selectedIds.has(r.id));
    const text = selectedResults.map(r => formatCopy(r)).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedId('multi-copy');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredResults = useMemo(() => {
    let filtered = results;
    
    // Apply length filters
    filtered = filtered.filter(r => r.text.length >= options.minLength && r.text.length <= options.maxLength);

    if (isCleanMode) {
      // Improved junk filtering
      filtered = filtered.filter(r => {
        const text = r.text;
        if (/^[0-9\W]+$/.test(text)) return false;
        if (text.length < 4) return false;
        // Filter out common junk patterns if needed
        return true;
      });
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(r => r.isFavorite);
    }

    if (isImportantOnly) {
      filtered = filtered.filter(r => r.hints && r.hints.some(h => h.includes('important')));
    }

    if (!searchQuery) return filtered;
    const query = searchQuery.toLowerCase();
    return filtered.filter(r => 
      r.text.toLowerCase().includes(query) || 
      r.hexOffset.toLowerCase().includes(query) ||
      (r.hints && r.hints.some(h => h.toLowerCase().includes(query)))
    );
  }, [results, searchQuery, isCleanMode, showFavoritesOnly, isImportantOnly]);

  const quickKeywords = ['Enemy', 'Player', 'Health', 'Ammo', 'Damage', 'Weapon', 'Speed', 'Recoil', 'ESP', 'Unity', 'GWorld', 'GNames'];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#00FF00] selection:text-black">
      {/* Header */}
      <header className="border-b border-[#1A1A1A] p-4 sticky top-0 bg-[#050505]/80 backdrop-blur-md z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00FF00] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,255,0,0.3)]">
              <Zap className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">OneCore <span className="text-[#00FF00]">Offset Finder</span></h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-mono">Advanced Offset Analysis Tool</p>
                <a 
                  href="https://t.me/L359D" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] font-bold text-[#00FF00]/60 hover:text-[#00FF00] transition-colors group"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.89.03-.24.37-.49 1.02-.73 4.01-1.74 6.69-2.89 8.03-3.45 3.83-1.59 4.63-1.86 5.15-1.87.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.13-.03.19z"/>
                  </svg>
                  <span>@L359D</span>
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setOffsetDisplayMode(prev => prev === 'hex' ? 'dec' : prev === 'dec' ? 'real' : 'hex')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
                offsetDisplayMode !== 'dec' 
                  ? 'bg-[#00FF00]/10 border-[#00FF00]/30 text-[#00FF00]' 
                  : 'bg-[#1A1A1A] border-transparent text-gray-400'
              }`}
              title="Toggle Hex/Decimal/Real Display"
            >
              {offsetDisplayMode === 'hex' ? 'HEX' : offsetDisplayMode === 'dec' ? 'DEC' : 'REAL'}
            </button>
            <button 
              onClick={() => setShowStats(!showStats)}
              className={`p-2 hover:bg-[#1A1A1A] rounded-full transition-colors ${showStats ? 'text-[#00FF00]' : 'text-gray-400'}`}
              title="Toggle Stats"
            >
              <Activity className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="p-2 hover:bg-[#1A1A1A] rounded-full transition-colors text-gray-400"
            >
              <Settings className={`w-5 h-5 ${showAdvanced ? 'text-[#00FF00]' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6 pb-24">
        {/* Tabs Navigation */}
        <div className="flex gap-2 p-1 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl overflow-x-auto scrollbar-hide whitespace-nowrap">
          {(['scan', 'database', 'compare', 'workspaces', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[100px] sm:min-w-0 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 flex-shrink-0 ${
                activeTab === tab 
                  ? 'bg-[#00FF00] text-black shadow-[0_0_15px_rgba(0,255,0,0.2)]' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab === 'scan' && <Zap className="w-3 h-3" />}
              {tab === 'database' && <Database className="w-3 h-3" />}
              {tab === 'compare' && <ArrowRightLeft className="w-3 h-3" />}
              {tab === 'workspaces' && <Briefcase className="w-3 h-3" />}
              {tab === 'history' && <HistoryIcon className="w-3 h-3" />}
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'scan' && (
          <>
            {/* File Upload Section */}
            <section className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <input 
                    type="file" 
                    accept=".so" 
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="h-32 border-2 border-dashed border-[#1A1A1A] group-hover:border-[#00FF00]/50 rounded-xl flex flex-col items-center justify-center gap-2 transition-all bg-[#050505]">
                    <Upload className="w-8 h-8 text-gray-500 group-hover:text-[#00FF00]" />
                    <p className="text-sm text-gray-400">{file ? file.name : 'Upload .so file'}</p>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">Device Storage</p>
                  </div>
                </div>

                <div className="h-32 border border-[#1A1A1A] rounded-xl p-4 flex flex-col justify-between bg-[#050505]">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Pattern Scanner (AOB)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="e.g. 55 48 89 E5 ?? ?? 00"
                        value={options.searchPattern}
                        onChange={(e) => setOptions(prev => ({ ...prev, searchPattern: e.target.value }))}
                        className="flex-1 bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#00FF00]/50 transition-all font-mono"
                      />
                      <button 
                        onClick={startScan}
                        disabled={!file || !options.searchPattern}
                        className="p-2 bg-[#00FF00] text-black rounded-lg transition-colors disabled:opacity-50"
                      >
                        <FileSearch className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-600 italic">Wildcards ?? or ? supported</p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'compare' && (
          <section className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-[#00FF00]" /> File Comparison
              </h2>
              <p className="text-xs text-gray-500">Load a second file to compare with current results.</p>
            </div>
            
            <div className="relative group h-32 border-2 border-dashed border-[#1A1A1A] hover:border-[#00FF00]/50 rounded-xl flex flex-col items-center justify-center gap-2 transition-all bg-[#050505]">
              <input 
                type="file" 
                accept=".so" 
                onChange={handleCompare}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <FilePlus className="w-8 h-8 text-gray-500 group-hover:text-[#00FF00]" />
              <p className="text-sm text-gray-400">Select Second .so File</p>
            </div>
          </section>
        )}

        {activeTab === 'database' && (
          <section className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Database className="w-4 h-4 text-[#00FF00]" /> Offset Database
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSavedEntries([])}
                  className="p-2 bg-[#1A1A1A] hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {savedEntries.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  <Database className="w-12 h-12 mx-auto opacity-10 mb-4" />
                  <p className="text-xs uppercase tracking-widest">Database is empty</p>
                </div>
              ) : (
                savedEntries.map(entry => (
                  <div key={entry.id} className="p-4 bg-[#050505] border border-[#1A1A1A] rounded-xl flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-[#00FF00]">{entry.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{entry.offset}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-[#1A1A1A] rounded-lg text-gray-500">
                        <Tag className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setSavedEntries(prev => prev.filter(e => e.id !== entry.id))}
                        className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'workspaces' && (
          <section className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#00FF00]" /> Workspaces
                </h2>
                <p className="text-xs text-gray-500">Save and load your scan projects.</p>
              </div>
              <button 
                onClick={saveWorkspace}
                className="px-4 py-2 bg-[#00FF00] text-black rounded-xl text-xs font-bold hover:scale-105 transition-all"
              >
                Save Current
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {workspaces.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-600">
                  <FolderOpen className="w-12 h-12 mx-auto opacity-10 mb-4" />
                  <p className="text-xs uppercase tracking-widest">No workspaces saved</p>
                </div>
              ) : (
                workspaces.map(ws => (
                  <div key={ws.id} className="p-4 bg-[#050505] border border-[#1A1A1A] rounded-2xl hover:border-[#00FF00]/30 transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white group-hover:text-[#00FF00] transition-colors">{ws.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{ws.fileName || 'Unknown file'}</p>
                      </div>
                      <button 
                        onClick={() => setWorkspaces(prev => prev.filter(w => w.id !== ws.id))}
                        className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-[10px] text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(ws.timestamp).toLocaleDateString()}
                      </p>
                      <button 
                        onClick={() => loadWorkspace(ws)}
                        className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#252525] text-[#00FF00] rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                      >
                        Load
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Recent Files */}
            <section className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <FileClock className="w-4 h-4 text-[#00FF00]" /> Recent Files
                  </h2>
                  <p className="text-xs text-gray-500">Quickly reload your last scanned files.</p>
                </div>
                <button 
                  onClick={() => setRecentFiles([])}
                  className="p-2 bg-[#1A1A1A] hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recentFiles.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-600">
                    <p className="text-[10px] uppercase tracking-widest">No recent files</p>
                  </div>
                ) : (
                  recentFiles.map((rf, idx) => (
                    <div key={idx} className="p-4 bg-[#050505] border border-[#1A1A1A] rounded-2xl hover:border-[#00FF00]/30 transition-all group">
                      <p className="text-xs font-bold truncate mb-1">{rf.name}</p>
                      <p className="text-[9px] text-gray-600 mb-3">{(rf.size / (1024 * 1024)).toFixed(2)} MB</p>
                      {rf.lastChunk && rf.lastChunk > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-yellow-500 font-bold">Chunk {rf.lastChunk}</span>
                          <button 
                            onClick={() => {
                              // In a real app we'd need the File object again, 
                              // but we can at least set the progress state if they re-upload
                              setProgress(prev => ({ ...prev, currentChunk: rf.lastChunk || 0 }));
                              setActiveTab('scan');
                            }}
                            className="text-[9px] text-[#00FF00] hover:underline"
                          >
                            Resume
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Scan History */}
            <section className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <HistoryIcon className="w-4 h-4 text-[#00FF00]" /> Scan History
                  </h2>
                  <p className="text-xs text-gray-500">Review and reload your previous scan results.</p>
                </div>
                <button 
                  onClick={() => setScanHistory([])}
                  className="p-2 bg-[#1A1A1A] hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {scanHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-600">
                    <Clock className="w-12 h-12 mx-auto opacity-10 mb-4" />
                    <p className="text-xs uppercase tracking-widest">No scan history</p>
                  </div>
                ) : (
                  scanHistory.map(item => (
                    <div key={item.id} className="p-4 bg-[#050505] border border-[#1A1A1A] rounded-2xl flex items-center justify-between group hover:border-[#00FF00]/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center group-hover:bg-[#00FF00]/10 transition-colors">
                          <FileText className="w-5 h-5 text-gray-500 group-hover:text-[#00FF00]" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-300">{item.fileName}</p>
                          <div className="flex gap-3">
                            <span className="text-[9px] text-[#00FF00] font-bold uppercase">{item.resultCount} Results</span>
                            <span className="text-[9px] text-gray-600 uppercase">{new Date(item.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setResults(item.results);
                            setActiveTab('scan');
                          }}
                          className="p-2 hover:bg-[#1A1A1A] rounded-xl text-[#00FF00]"
                          title="Reload Results"
                        >
                          <Undo2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setScanHistory(prev => prev.filter(h => h.id !== item.id))}
                          className="p-2 hover:bg-red-500/20 text-red-500 rounded-xl"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Comparison History */}
            <section className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-[#00FF00]" /> Comparison History
                  </h2>
                  <p className="text-xs text-gray-500">Review your past file comparisons.</p>
                </div>
                <button 
                  onClick={clearHistory}
                  className="p-2 bg-[#1A1A1A] hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {history.length === 0 ? (
                  <div className="text-center py-12 text-gray-600">
                    <Clock className="w-12 h-12 mx-auto opacity-10 mb-4" />
                    <p className="text-xs uppercase tracking-widest">No comparison history</p>
                  </div>
                ) : (
                  history.map(item => (
                    <div key={item.id} className="p-4 bg-[#050505] border border-[#1A1A1A] rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center">
                          <ArrowRightLeft className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-300">{item.oldFileName} <span className="text-gray-600 mx-1">→</span> {item.newFileName}</p>
                          <div className="flex gap-3">
                            <span className="text-[9px] text-[#00FF00] font-bold uppercase">+{item.stats.new} New</span>
                            <span className="text-[9px] text-red-500 font-bold uppercase">-{item.stats.removed} Removed</span>
                            <span className="text-[9px] text-blue-500 font-bold uppercase">~{item.stats.changed} Changed</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setResults(item.results);
                          setActiveTab('scan');
                        }}
                        className="p-2 hover:bg-[#1A1A1A] rounded-xl text-[#00FF00]"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* Advanced Options */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.section 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                    <Binary className="w-3 h-3" /> Module Base Address
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. 0x7000000000"
                      value={options.baseAddress}
                      onChange={(e) => setOptions(prev => ({ ...prev, baseAddress: e.target.value }))}
                      className="flex-1 bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#00FF00]/50 transition-all font-mono"
                    />
                    <button 
                      onClick={() => detectModuleBase(file?.name || '')}
                      className="px-3 py-1 bg-[#1A1A1A] hover:bg-[#252525] rounded-lg text-[10px] font-bold text-[#00FF00] border border-[#252525]"
                    >
                      Detect
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-600 italic">Used for Real Address calculation (Base + Offset)</p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                    <Filter className="w-3 h-3" /> Minimum String Length
                  </label>
                  <input 
                    type="range" 
                    min="3" 
                    max="15" 
                    value={options.minLength}
                    onChange={(e) => setOptions(prev => ({ ...prev, minLength: parseInt(e.target.value) }))}
                    className="w-full h-1 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer accent-[#00FF00]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>3 chars</span>
                    <span className="text-[#00FF00] font-bold">{options.minLength} chars</span>
                    <span>15 chars</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                    <Filter className="w-3 h-3" /> Maximum String Length
                  </label>
                  <input 
                    type="range" 
                    min="20" 
                    max="500" 
                    step="10"
                    value={options.maxLength}
                    onChange={(e) => setOptions(prev => ({ ...prev, maxLength: parseInt(e.target.value) }))}
                    className="w-full h-1 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer accent-[#00FF00]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>20 chars</span>
                    <span className="text-[#00FF00] font-bold">{options.maxLength} chars</span>
                    <span>500 chars</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                    <ListChecks className="w-3 h-3" /> Result Limit
                  </label>
                  <input 
                    type="range" 
                    min="100" 
                    max="10000" 
                    step="100"
                    value={options.resultLimit}
                    onChange={(e) => setOptions(prev => ({ ...prev, resultLimit: parseInt(e.target.value) }))}
                    className="w-full h-1 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer accent-[#00FF00]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>100</span>
                    <span className="text-[#00FF00] font-bold">{options.resultLimit} results</span>
                    <span>10000</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Scan Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['safe', 'balanced', 'fast'] as ScanMode[]).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setOptions(prev => ({ ...prev, mode }))}
                        className={`py-2 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all border ${
                          options.mode === mode 
                            ? 'bg-[#00FF00] text-black border-[#00FF00] shadow-[0_0_10px_rgba(0,255,0,0.2)]' 
                            : 'bg-[#1A1A1A] text-gray-500 border-[#252525] hover:border-gray-700'
                        }`}
                      >
                        {mode === 'safe' && <Shield className="w-3 h-3 mx-auto mb-1" />}
                        {mode === 'balanced' && <RefreshCw className="w-3 h-3 mx-auto mb-1" />}
                        {mode === 'fast' && <Zap className="w-3 h-3 mx-auto mb-1" />}
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#050505] rounded-xl border border-[#1A1A1A]">
                  <div className="space-y-1">
                    <p className="text-xs font-bold">Auto Safe Mode</p>
                    <p className="text-[10px] text-gray-500">Auto adjust scan speed</p>
                  </div>
                  <button 
                    onClick={() => setIsAutoSafeMode(!isAutoSafeMode)}
                    className={`w-10 h-5 rounded-full transition-all relative ${isAutoSafeMode ? 'bg-[#00FF00]' : 'bg-gray-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAutoSafeMode ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#050505] rounded-xl border border-[#1A1A1A]">
                  <div className="space-y-1">
                    <p className="text-xs font-bold">Remove Duplicates</p>
                    <p className="text-[10px] text-gray-500">Only show unique strings</p>
                  </div>
                  <button 
                    onClick={() => setOptions(prev => ({ ...prev, removeDuplicates: !prev.removeDuplicates }))}
                    className={`w-10 h-5 rounded-full transition-all relative ${options.removeDuplicates ? 'bg-[#00FF00]' : 'bg-gray-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${options.removeDuplicates ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#050505] rounded-xl border border-[#1A1A1A]">
                  <div className="space-y-1">
                    <p className="text-xs font-bold">Result Limit</p>
                    <p className="text-[10px] text-gray-500">Max displayed strings</p>
                  </div>
                  <select 
                    value={options.resultLimit}
                    onChange={(e) => setOptions(prev => ({ ...prev, resultLimit: parseInt(e.target.value) }))}
                    className="bg-[#1A1A1A] text-xs px-2 py-1 rounded border border-[#252525] focus:outline-none"
                  >
                    <option value={500}>500</option>
                    <option value={1000}>1000</option>
                    <option value={2000}>2000</option>
                    <option value={5000}>5000</option>
                  </select>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Progress & Controls */}
        <section className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl p-6 space-y-6">
          {/* Smart Stats Panel */}
          {showStats && results.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-[#1A1A1A]"
            >
              <div className="space-y-1">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Total Strings</p>
                <p className="text-lg font-mono text-white">{stats.total.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Unique Strings</p>
                <p className="text-lg font-mono text-[#00FF00]">{stats.unique.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">File Size</p>
                <p className="text-lg font-mono text-white">{(stats.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Scan Time</p>
                <p className="text-lg font-mono text-white">{stats.time.toFixed(2)}s</p>
              </div>
            </motion.div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#00FF00]" /> Scan Status
              </h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                {progress.isScanning ? (progress.isPaused ? 'Paused' : 'Scanning...') : 'Ready to scan'}
              </p>
            </div>
            <div className="flex gap-2">
              {!progress.isScanning ? (
                <button 
                  onClick={startScan}
                  disabled={!file}
                  className="flex items-center gap-2 bg-[#00FF00] text-black px-6 py-3.5 rounded-2xl font-bold text-sm hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_20px_rgba(0,255,0,0.2)]"
                >
                  <Play className="w-4 h-4 fill-current" /> {progress.currentChunk > 0 ? 'Resume Scan' : 'Start Scan'}
                </button>
              ) : (
                <>
                  {progress.isPaused ? (
                    <button 
                      onClick={resumeScan}
                      className="p-4 bg-[#00FF00] text-black rounded-2xl hover:scale-105 transition-all"
                    >
                      <Play className="w-6 h-6 fill-current" />
                    </button>
                  ) : (
                    <button 
                      onClick={pauseScan}
                      className="p-4 bg-yellow-500 text-black rounded-2xl hover:scale-105 transition-all"
                    >
                      <Pause className="w-6 h-6 fill-current" />
                    </button>
                  )}
                  <button 
                    onClick={stopScan}
                    className="p-4 bg-red-500 text-white rounded-2xl hover:scale-105 transition-all group relative"
                    title="Emergency Stop"
                  >
                    <Square className="w-6 h-6 fill-current" />
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">EMERGENCY STOP</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-mono text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-[#00FF00] font-bold">{Math.round((progress.scannedBytes / (progress.totalBytes || 1)) * 100)}%</span>
                <span className="opacity-50">|</span>
                <span>{(progress.scannedBytes / (1024 * 1024)).toFixed(2)} MB / {((progress.totalBytes || 0) / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>{elapsedTime}s elapsed</span>
              </div>
            </div>
            <div className="h-3 bg-[#1A1A1A] rounded-full overflow-hidden border border-[#252525]">
              <motion.div 
                className="h-full bg-[#00FF00] shadow-[0_0_15px_rgba(0,255,0,0.6)]"
                initial={{ width: 0 }}
                animate={{ width: `${(progress.scannedBytes / (progress.totalBytes || 1)) * 100}%` }}
                transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#050505] p-4 rounded-2xl border border-[#1A1A1A] text-center">
              <p className="text-[10px] text-gray-500 uppercase mb-1 font-bold">Strings</p>
              <p className="text-xl font-mono font-bold text-[#00FF00]">{progress.stringsFound}</p>
            </div>
            <div className="bg-[#050505] p-4 rounded-2xl border border-[#1A1A1A] text-center">
              <p className="text-[10px] text-gray-500 uppercase mb-1 font-bold">Chunk</p>
              <p className="text-xl font-mono font-bold">{progress.currentChunk} <span className="text-[10px] text-gray-600">/ {progress.totalChunks}</span></p>
            </div>
            <div className="bg-[#050505] p-4 rounded-2xl border border-[#1A1A1A] text-center">
              <p className="text-[10px] text-gray-500 uppercase mb-1 font-bold">Mode</p>
              <p className="text-xl font-mono font-bold capitalize text-blue-400">{options.mode}</p>
            </div>
            <div className="bg-[#050505] p-4 rounded-2xl border border-[#1A1A1A] text-center">
              <button 
                onClick={() => setAutoScroll(!autoScroll)}
                className={`w-full h-full flex flex-col items-center justify-center gap-1 transition-all ${autoScroll ? 'text-[#00FF00]' : 'text-gray-600'}`}
              >
                <p className="text-[10px] uppercase font-bold">Auto Scroll</p>
                <Smartphone className={`w-5 h-5 ${autoScroll ? 'animate-bounce' : ''}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-[#1A1A1A] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#00FF00]" /> Scanned Results
              </h2>
              <div className="flex gap-2">
                {selectedIds.size > 0 && (
                  <button 
                    onClick={copySelected}
                    className="p-2 bg-[#00FF00] text-black rounded-lg transition-all animate-pulse flex items-center gap-2"
                    title="Copy Selected"
                  >
                    <CopyPlus className="w-4 h-4" />
                    <span className="text-[10px] font-bold">{selectedIds.size}</span>
                  </button>
                )}
                {selectedIds.size > 0 && (
                  <button 
                    onClick={() => setSelectedIds(new Set())}
                    className="p-2 bg-[#1A1A1A] text-gray-500 hover:text-white rounded-lg transition-all"
                    title="Deselect All"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => {
                    if (selectedIds.size === filteredResults.length) setSelectedIds(new Set());
                    else setSelectedIds(new Set(filteredResults.map(r => r.id)));
                  }}
                  className={`p-2 rounded-lg transition-colors ${selectedIds.size === filteredResults.length && filteredResults.length > 0 ? 'bg-[#00FF00] text-black' : 'bg-[#1A1A1A] text-gray-500 hover:text-gray-300'}`}
                  title="Select All"
                >
                  <ListChecks className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsImportantOnly(!isImportantOnly)}
                  className={`p-2 rounded-lg transition-colors ${isImportantOnly ? 'bg-[#00FF00] text-black' : 'bg-[#1A1A1A] text-gray-500 hover:text-gray-300'}`}
                  title="Important Only"
                >
                  <ListChecks className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsCleanMode(!isCleanMode)}
                  className={`p-2 rounded-lg transition-colors ${isCleanMode ? 'bg-[#00FF00] text-black' : 'bg-[#1A1A1A] text-gray-500 hover:text-gray-300'}`}
                  title="Clean Mode (Hide Junk)"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`p-2 rounded-lg transition-colors ${showFavoritesOnly ? 'bg-yellow-500 text-black' : 'bg-[#1A1A1A] text-gray-500 hover:text-gray-300'}`}
                  title="Show Favorites Only"
                >
                  <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                </button>
                <select 
                  value={copyFormat}
                  onChange={(e) => setCopyFormat(e.target.value as any)}
                  className="bg-[#1A1A1A] text-[10px] px-2 py-1 rounded border border-[#252525] focus:outline-none text-gray-400 uppercase font-bold tracking-widest"
                >
                  <option value="hex">HEX</option>
                  <option value="dec">DEC</option>
                  <option value="real">REAL</option>
                  <option value="pattern">AOB</option>
                  <option value="cpp">C++</option>
                </select>
                <button 
                  onClick={() => exportResults('txt')}
                  disabled={results.length === 0}
                  className="p-2 bg-[#1A1A1A] hover:bg-[#252525] rounded-lg transition-colors disabled:opacity-50"
                  title="Export TXT"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => exportResults('json')}
                  disabled={results.length === 0}
                  className="p-2 bg-[#1A1A1A] hover:bg-[#252525] rounded-lg transition-colors disabled:opacity-50"
                  title="Export JSON"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={importData}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button className="p-2 bg-[#1A1A1A] hover:bg-[#252525] rounded-lg transition-colors">
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
                <button 
                  onClick={() => setResults([])}
                  disabled={results.length === 0}
                  className="p-2 bg-[#1A1A1A] hover:bg-red-500/20 text-red-500 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder={isUltraFastSearch ? "Instant search mode active..." : "Search strings or offsets..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#050505] border border-[#1A1A1A] rounded-xl pl-10 pr-12 py-2.5 text-sm focus:outline-none focus:border-[#00FF00]/50 transition-all"
              />
              <button 
                onClick={() => setIsUltraFastSearch(!isUltraFastSearch)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${isUltraFastSearch ? 'text-[#00FF00]' : 'text-gray-600'}`}
                title="Toggle Ultra Fast Search"
              >
                <Zap className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {quickKeywords.map(kw => (
                <button
                  key={kw}
                  onClick={() => setSearchQuery(kw)}
                  className="px-3 py-1 bg-[#1A1A1A] hover:bg-[#252525] rounded-full text-[10px] font-bold whitespace-nowrap transition-colors border border-transparent hover:border-[#00FF00]/30"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>

          <div id="results-list" className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredResults.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2">
                <Search className="w-8 h-8 opacity-20" />
                <p className="text-xs uppercase tracking-widest">No results found</p>
              </div>
            ) : (
              filteredResults.map((result, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={result.id} 
                  className={`group bg-[#050505] border rounded-xl p-4 transition-all ${selectedIds.has(result.id) ? 'border-[#00FF00] bg-[#00FF00]/5' : 'border-[#1A1A1A] hover:border-[#00FF00]/30'}`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      onClick={() => toggleSelection(result.id)}
                      className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-all ${selectedIds.has(result.id) ? 'bg-[#00FF00] border-[#00FF00]' : 'border-[#252525] bg-[#0A0A0A]'}`}
                    >
                      {selectedIds.has(result.id) && <Check className="w-3 h-3 text-black font-bold" />}
                    </div>
                    <div className="flex items-center justify-between flex-1">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-xs font-bold tracking-tight transition-colors ${(result.frequency || 0) > 5 ? 'text-yellow-400' : 'text-[#00FF00]'}`}>
                            {result.text}
                          </p>
                          {result.length && <span className="text-[8px] text-gray-600 font-mono">[{result.length}]</span>}
                          {result.frequency && result.frequency > 1 && (
                            <span className={`text-[8px] px-1 rounded border font-bold transition-all ${
                              result.frequency > 5 
                                ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400' 
                                : 'bg-[#1A1A1A] border-[#00FF00]/20 text-[#00FF00]'
                            }`}>
                              x{result.frequency}
                            </span>
                          )}
                          {result.isNew && <span className="text-[8px] bg-[#00FF00] text-black px-1 rounded font-bold">NEW</span>}
                          {result.status === 'removed' && <span className="text-[8px] bg-red-500 text-white px-1 rounded font-bold">REMOVED</span>}
                          {result.status === 'changed' && <span className="text-[8px] bg-blue-500 text-white px-1 rounded font-bold">CHANGED</span>}
                          {result.isFavorite && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                        </div>
                        <div className="flex items-center gap-3">
                          <p className={`text-[10px] font-mono uppercase tracking-wider transition-colors ${offsetDisplayMode === 'hex' ? 'text-gray-200 font-bold' : 'text-gray-600'}`}>
                            {formatHex(result.offset)}
                          </p>
                          <p className={`text-[10px] font-mono uppercase tracking-wider transition-colors ${offsetDisplayMode === 'real' ? 'text-[#00FF00] font-bold' : 'text-gray-600'}`}>
                            {getAbsoluteAddress(result.offset)} REAL
                          </p>
                          <p className={`text-[10px] font-mono transition-colors ${offsetDisplayMode === 'dec' ? 'text-gray-200 font-bold' : 'text-gray-700'}`}>
                            {result.offset} DEC
                          </p>
                        </div>
                        {result.hints && result.hints.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.hints.map((hint, hidx) => (
                              <span key={hidx} className="text-[8px] bg-[#1A1A1A] text-gray-500 px-1.5 py-0.5 rounded border border-[#252525] flex items-center gap-1">
                                <Lightbulb className="w-2 h-2" /> {hint}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => toggleFavorite(result.id)}
                        className={`p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors ${result.isFavorite ? 'text-yellow-500' : 'text-gray-400'}`}
                        title="Favorite"
                      >
                        <Star className={`w-4 h-4 ${result.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      <button 
                        onClick={() => findSimilar(result.text)}
                        className="p-2 hover:bg-[#1A1A1A] rounded-lg text-gray-400 hover:text-[#00FF00] transition-colors"
                        title="Find Similar"
                      >
                        <SearchCode className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setSelectedResult(selectedResult === result ? null : result)}
                        className="p-2 hover:bg-[#1A1A1A] rounded-lg text-gray-400 hover:text-[#00FF00] transition-colors"
                        title="View Context"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => saveToDatabase(result)}
                        className="p-2 hover:bg-[#1A1A1A] rounded-lg text-gray-400 hover:text-[#00FF00] transition-colors"
                        title="Save to DB"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => copyToClipboard(formatCopy(result), `copy-${idx}`)}
                        className="p-2 hover:bg-[#1A1A1A] rounded-lg text-gray-400 hover:text-[#00FF00] transition-colors"
                      >
                        {copiedId === `copy-${idx}` ? <Check className="w-4 h-4 text-[#00FF00]" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Context Viewer & Pattern Generator */}
                  <AnimatePresence>
                    {selectedResult === result && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-[#1A1A1A] space-y-4">
                          <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">Byte Context</p>
                            <div className="p-3 bg-[#0A0A0A] rounded-lg font-mono text-[10px] text-gray-400 break-all leading-relaxed">
                              {result.bytes || 'No byte data available'}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">Generated Pattern (AOB)</p>
                              <button 
                                onClick={() => copyToClipboard(generatePattern(result), `pat-${idx}`)}
                                className="text-[10px] text-[#00FF00] hover:underline"
                              >
                                {copiedId === `pat-${idx}` ? 'Copied!' : 'Copy Pattern'}
                              </button>
                            </div>
                            <div className="p-3 bg-[#0A0A0A] rounded-lg font-mono text-[10px] text-[#00FF00]/70 break-all">
                              {generatePattern(result)}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </div>
          
          <div className="p-3 bg-[#050505] border-t border-[#1A1A1A] flex justify-between items-center text-[10px] text-gray-500 uppercase tracking-widest">
            <span>Showing {filteredResults.length} strings</span>
            {results.length >= options.resultLimit && <span className="text-yellow-500/80">Limit reached</span>}
          </div>
        </section>
      </main>

      {/* Summary Overlay */}
      <AnimatePresence>
        {!progress.isScanning && progress.endTime && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl p-8 max-w-sm w-full space-y-6 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="w-16 h-16 bg-[#00FF00]/10 rounded-full flex items-center justify-center mx-auto border border-[#00FF00]/20">
                <Check className="w-8 h-8 text-[#00FF00]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Scan Complete</h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest">Analysis Summary</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#050505] p-4 rounded-2xl border border-[#1A1A1A]">
                  <p className="text-[10px] text-gray-500 uppercase mb-1">Strings</p>
                  <p className="text-xl font-bold text-[#00FF00]">{progress.stringsFound}</p>
                </div>
                <div className="bg-[#050505] p-4 rounded-2xl border border-[#1A1A1A]">
                  <p className="text-[10px] text-gray-500 uppercase mb-1">Time</p>
                  <p className="text-xl font-bold">{Math.floor((progress.endTime - progress.startTime) / 1000)}s</p>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <button 
                  onClick={() => setProgress(prev => ({ ...prev, endTime: undefined }))}
                  className="w-full bg-[#00FF00] text-black py-3 rounded-xl font-bold hover:scale-105 transition-all"
                >
                  View Results
                </button>
                <button 
                  onClick={() => {
                    resetScan();
                    setProgress(prev => ({ ...prev, endTime: undefined }));
                  }}
                  className="w-full bg-[#1A1A1A] text-white py-3 rounded-xl font-bold hover:bg-[#252525] transition-all"
                >
                  Scan Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <footer className="max-w-4xl mx-auto p-8 text-center space-y-2">
        <p className="text-[10px] text-gray-600 uppercase tracking-[0.3em]">OnceCore Offset Finder v4.0</p>
        <p className="text-[10px] text-gray-700">Ultimate Mobile Reverse Engineering Workspace</p>
      </footer>
    </div>
  );
}
