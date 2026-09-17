import React, { useState, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { THEME_CONFIGS } from '../../lib/theme';
import { executeSandboxedCode } from '../../lib/codeRunner';
import { highlightCode } from '../../lib/syntaxHighlighter';
import {
  Sparkles,
  Terminal,
  Copy,
  Check,
  Play,
  Share2,
  X,
  BookOpen,
  Wand2,
  FileCode,
  Zap,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  CornerDownLeft,
  Trash2,
  Code2,
  Sliders,
  Maximize2
} from 'lucide-react';

interface DevToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareToFeed: (snippet: { title: string; language: string; code: string; output: string }) => void;
}

interface SnippetItem {
  id: string;
  title: string;
  language: 'javascript' | 'typescript' | 'python' | 'json';
  category: 'Network' | 'Algorithms' | 'Utils' | 'AI / Math';
  complexity: string;
  description: string;
  code: string;
}

const QUICK_CHARS = ['(', ')', '{', '}', '[', ']', '`', '$', "'", '"', '=', ':', ';', ',', '+', '-', '*', '/', '_', 'Tab'];

export const SNIPPET_PRESETS: SnippetItem[] = [
  {
    id: 'py_fibonacci',
    title: 'Python Fibonacci Sequence Stream',
    language: 'python',
    category: 'Algorithms',
    complexity: 'O(N)',
    description: 'Multi-line Python 3 function calculating Fibonacci numbers with loop and custom print end=" ".',
    code: `def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        print(a, end=" ")
        a, b = b, a + b

print("Python Fibonacci (15 numbers):")
fibonacci(15)`,
  },
  {
    id: 'js_template_greeting',
    title: 'JavaScript Template Literals & Output',
    language: 'javascript',
    category: 'Utils',
    complexity: 'O(1)',
    description: 'Dynamic string template interpolation with backticks, variable declarations and console logging.',
    code: `const name = "Mirkamol";
const greeting = \`Hello, \${name}! Welcome to Litenote.\`;
console.log(greeting);`,
  },
  {
    id: 'api_fetch',
    title: 'Resilient Fetch with Exponential Backoff & Timeout',
    language: 'typescript',
    category: 'Network',
    complexity: 'O(retries)',
    description: 'Auto-retry network fetcher with AbortController timeout and backoff delays.',
    code: `async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
    }
  }
}

console.log("Ready to execute resilient fetch pipeline.");
console.log({ endpoint: 'https://api.litenote.io/v1/ping', retries: 3 });`,
  },
  {
    id: 'debounce',
    title: 'High-Performance Debounce & Throttle',
    language: 'javascript',
    category: 'Utils',
    complexity: 'O(1)',
    description: 'Zero-dependency debounce and throttle closures for optimal UI rendering.',
    code: `function debounce(fn, waitMs) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), waitMs);
  };
}

function throttle(fn, limitMs) {
  let inThrottle = false;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limitMs);
    }
  };
}

const logSearch = debounce((q) => console.log('Searching for:', q), 300);
logSearch('Litenote');
console.log("Debounce and Throttle utilities initialized.");`,
  },
  {
    id: 'lru_cache',
    title: 'LRU (Least Recently Used) Cache System',
    language: 'typescript',
    category: 'Algorithms',
    complexity: 'O(1) Get & Put',
    description: 'Double-linked list + hashmap structure for constant-time cache eviction.',
    code: `class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map<K, V>();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const val = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  put(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}

const lru = new LRUCache<string, number>(3);
lru.put('user:1', 100);
lru.put('user:2', 200);
lru.put('user:3', 300);
lru.put('user:4', 400); // evicts user:1
console.log('User 1 (evicted):', lru.get('user:1'));
console.log('User 2:', lru.get('user:2'));`,
  },
  {
    id: 'deep_clone',
    title: 'Fast Structured Deep Clone',
    language: 'javascript',
    category: 'Utils',
    complexity: 'O(N)',
    description: 'Safe recursive cloner preserving nested arrays, objects, and dates.',
    code: `function deepClone(obj) {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

const source = {
  id: 'node_77',
  config: { flags: ['dark_mode', 'p2p_call'], maxPeers: 16 }
};
const clone = deepClone(source);
clone.config.maxPeers = 32;
console.log('Source:', source.config.maxPeers);
console.log('Clone modified:', clone.config.maxPeers);`,
  },
  {
    id: 'py_matrix',
    title: 'Neural Layer Matrix Dot Product & Sigmoid',
    language: 'python',
    category: 'AI / Math',
    complexity: 'O(N * M)',
    description: 'Feed-forward artificial neural layer activation calculation.',
    code: `import math

def dot_product(vec_a, vec_b):
    total = 0
    for i in range(len(vec_a)):
        total += vec_a[i] * vec_b[i]
    return total

def sigmoid(x):
    return 1 / (1 + math.exp(-x))

inputs = [0.5, 0.8, -0.2]
weights = [0.4, -0.9, 0.6]
bias = 0.1

score = dot_product(inputs, weights) + bias
activation = sigmoid(score)

print(f"Computed activation score: {activation:.4f}")
print("Layer weights validated successfully.")`,
  },
];

export const DevToolsModal: React.FC<DevToolsModalProps> = ({
  isOpen,
  onClose,
  onShareToFeed,
}) => {
  const { accentColor, language } = useAuth();
  const theme = THEME_CONFIGS[accentColor];

  const [activeTab, setActiveTab] = useState<'snippets' | 'playground' | 'ai_tools'>('playground');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Sandbox state
  const [selectedLanguage, setSelectedLanguage] = useState<'javascript' | 'typescript' | 'python' | 'json'>('python');
  const [snippetTitle, setSnippetTitle] = useState(SNIPPET_PRESETS[0].title);
  const [codeContent, setCodeContent] = useState(SNIPPET_PRESETS[0].code);
  const [outputConsole, setOutputConsole] = useState('');
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [exitStatus, setExitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const [outputCopied, setOutputCopied] = useState(false);

  // Mobile layout switcher: 'editor' | 'terminal'
  const [mobilePane, setMobilePane] = useState<'editor' | 'terminal'>('editor');

  // AI Tools State
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiActionSuccess, setAiActionSuccess] = useState<string | null>(null);

  // Refs for scrolling and textarea manipulation
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  // Sync scrolling between textarea, line numbers gutter and syntax highlighter
  const handleScroll = () => {
    if (textareaRef.current) {
      const top = textareaRef.current.scrollTop;
      const left = textareaRef.current.scrollLeft;
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = top;
      }
      if (highlightRef.current) {
        highlightRef.current.scrollTop = top;
        highlightRef.current.scrollLeft = left;
      }
    }
  };

  // Keyboard navigation (Tab = 2 spaces, Ctrl/Cmd + Enter = Run)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunCode();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newCode = codeContent.substring(0, start) + '  ' + codeContent.substring(end);
      setCodeContent(newCode);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Mobile character bar helper
  const handleInsertChar = (char: string) => {
    const textarea = textareaRef.current;
    const toInsert = char === 'Tab' ? '  ' : char;
    if (!textarea) {
      setCodeContent((prev) => prev + toInsert);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newCode = codeContent.substring(0, start) + toInsert + codeContent.substring(end);
    setCodeContent(newCode);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + toInsert.length;
    }, 0);
  };

  // Calculate lines for line-number gutter
  const lineCount = useMemo(() => {
    return Math.max(1, codeContent.split('\n').length);
  }, [codeContent]);

  // Syntax highlighted HTML string
  const highlightedHtml = useMemo(() => {
    return highlightCode(codeContent, selectedLanguage);
  }, [codeContent, selectedLanguage]);

  const categories = ['All', 'Network', 'Algorithms', 'Utils', 'AI / Math'];
  const filteredSnippets = useMemo(() => {
    return SNIPPET_PRESETS.filter((item) => {
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(outputConsole);
    setOutputCopied(true);
    setTimeout(() => setOutputCopied(false), 2000);
  };

  const handleClearCode = () => {
    setCodeContent('');
    textareaRef.current?.focus();
  };

  const handleRunCode = async () => {
    setIsExecuting(true);
    setExitStatus('idle');
    setOutputConsole(
      language === 'ru'
        ? '⚡ Выполнение в изолированной среде sandbox...\n'
        : '⚡ Executing in sandboxed environment...\n'
    );

    // On mobile, auto-switch to terminal pane to show output
    if (window.innerWidth < 1024) {
      setMobilePane('terminal');
    }

    try {
      const result = await executeSandboxedCode(codeContent, selectedLanguage);
      setExecutionTimeMs(result.executionTimeMs);
      if (result.success) {
        setExitStatus('success');
        setOutputConsole(
          result.logs.length > 0
            ? result.logs.join('\n')
            : (language === 'ru'
                ? '✓ Код выполнен успешно без вывода в stdout.'
                : '✓ Process finished successfully with 0 output logs.')
        );
      } else {
        setExitStatus('error');
        setOutputConsole(
          `❌ Runtime Error:\n${result.error || result.logs.join('\n')}`
        );
      }
    } catch (err: any) {
      setExitStatus('error');
      setOutputConsole(`❌ Runtime Error:\n${err?.message || String(err)}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSelectPreset = (preset: SnippetItem) => {
    setSnippetTitle(preset.title);
    setSelectedLanguage(preset.language);
    setCodeContent(preset.code);
    setOutputConsole('');
    setExecutionTimeMs(null);
    setExitStatus('idle');
    setActiveTab('playground');
    setMobilePane('editor');
  };

  const handleAiAction = async (actionType: 'explain' | 'optimize' | 'fix' | 'test' | 'convert') => {
    setIsAiLoading(true);
    setAiResult('');
    setAiActionSuccess(null);

    try {
      const res = await fetch('/api/ai/code-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          code: codeContent,
          language: selectedLanguage,
          instructions: aiCustomPrompt,
        }),
      });
      const data = await res.json();
      setAiResult(data.result || 'AI analysis completed.');
    } catch (err) {
      setAiResult(
        language === 'ru'
          ? '❌ Ошибка обращения к AI. Проверьте сетевое соединение или повторите позже.'
          : '❌ Failed to reach AI service. Check network connection or retry later.'
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyAiCodeToEditor = () => {
    if (!aiResult) return;
    const match = aiResult.match(/```(?:[a-zA-Z]*)\n([\s\S]*?)```/);
    const extracted = match ? match[1] : aiResult;
    setCodeContent(extracted.trim());
    setAiActionSuccess(
      language === 'ru' ? '✓ Код успешно применен в редактор!' : '✓ Applied to editor!'
    );
    setTimeout(() => {
      setAiActionSuccess(null);
      setActiveTab('playground');
      setMobilePane('editor');
    }, 1200);
  };

  const handlePublishToFeed = () => {
    onShareToFeed({
      title: snippetTitle,
      language: selectedLanguage,
      code: codeContent,
      output: outputConsole,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-6xl bg-[#080D18] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[94vh] max-h-[96vh]">
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3 bg-[#0F172A] border-b border-[#1E293B] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-bold text-sm sm:text-base text-white">
                  LiteNote DevHub
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold">
                  CONSOLE & AI
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {language === 'ru'
                  ? 'Песочница со сплит-панелью, подсветкой синтаксиса и терминалом'
                  : 'Split-pane console sandbox with syntax highlighting and live terminal'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title={language === 'ru' ? 'Закрыть' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls Bar */}
        <div className="px-3 sm:px-6 py-2 bg-[#0A0F1D] border-b border-[#1E293B] flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('playground')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'playground'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>{language === 'ru' ? 'Консоль & Песочница' : 'Console Sandbox'}</span>
            </button>

            <button
              onClick={() => setActiveTab('snippets')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'snippets'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{language === 'ru' ? 'Библиотека сниппетов' : 'Snippet Library'}</span>
            </button>

            <button
              onClick={() => setActiveTab('ai_tools')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'ai_tools'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{language === 'ru' ? 'AI Code Assistant' : 'AI Code Assistant'}</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-[11px] text-slate-500">Node v20 & Py3.11</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden p-2.5 sm:p-4 flex flex-col min-h-0">
          {/* TAB 1: SNIPPET LIBRARY */}
          {activeTab === 'snippets' && (
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      language === 'ru'
                        ? 'Поиск по алгоритмам и сниппетам...'
                        : 'Search algorithms and snippets...'
                    }
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0F172A] border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredSnippets.map((snippet) => (
                  <div
                    key={snippet.id}
                    className="p-4 rounded-xl bg-[#0D1525] border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-800 text-emerald-400 uppercase">
                          {snippet.language}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {snippet.complexity}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {snippet.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {snippet.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <span className="text-[11px] text-slate-500">{snippet.category}</span>
                      <button
                        onClick={() => handleSelectPreset(snippet)}
                        className="px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                      >
                        {language === 'ru' ? 'Загрузить в консоль' : 'Load in Console'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CONSOLE & SPLIT-PANE PLAYGROUND */}
          {activeTab === 'playground' && (
            <div className="flex-1 flex flex-col min-h-0 space-y-2.5">
              {/* Top Controls: Preset selector + Language + Title */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
                {/* Preset Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                    {language === 'ru' ? 'Шаблоны:' : 'Presets:'}
                  </span>
                  {SNIPPET_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPreset(p)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-all border cursor-pointer ${
                        snippetTitle === p.title
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-semibold shadow-sm'
                          : 'border-slate-800 bg-[#0C121E] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p.title.split(' ')[0]} {p.language === 'python' ? '🐍' : '⚡'}
                    </button>
                  ))}
                </div>

                {/* Language Select & Title */}
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    value={snippetTitle}
                    onChange={(e) => setSnippetTitle(e.target.value)}
                    placeholder="Snippet Title..."
                    className="hidden md:block w-48 px-2.5 py-1.5 rounded-xl bg-[#0E1626] border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />

                  <div className="flex items-center gap-1 bg-[#0A111E] p-1 rounded-xl border border-slate-800">
                    {(['python', 'javascript', 'typescript', 'json'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold uppercase transition-all cursor-pointer ${
                          selectedLanguage === lang
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        {lang === 'javascript' ? 'JS' : lang === 'typescript' ? 'TS' : lang === 'python' ? 'PY' : 'JSON'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile View Switcher (Tabs for small screens < 1024px) */}
              <div className="flex lg:hidden items-center justify-between bg-[#0B1322] p-1 rounded-xl border border-slate-800 shrink-0">
                <button
                  onClick={() => setMobilePane('editor')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    mobilePane === 'editor'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{language === 'ru' ? 'Редактор кода' : 'Code Editor'}</span>
                  <span className="text-[10px] opacity-75 font-mono">({lineCount}L)</span>
                </button>

                <button
                  onClick={() => setMobilePane('terminal')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    mobilePane === 'terminal'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'ru' ? 'Терминал вывода' : 'Terminal Output'}</span>
                  {exitStatus === 'success' && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
                  {exitStatus === 'error' && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
                </button>
              </div>

              {/* MAIN SPLIT-PANE CONTAINER */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
                {/* LEFT PANE: SYNTAX-HIGHLIGHTED EDITOR (Hidden on mobile if terminal tab selected) */}
                <div
                  className={`lg:col-span-7 flex flex-col h-full bg-[#050813] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl ${
                    mobilePane === 'editor' ? 'flex' : 'hidden lg:flex'
                  }`}
                >
                  {/* Editor Top Bar */}
                  <div className="px-3.5 py-2 bg-[#090F1E] border-b border-[#1A253A] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
                        <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-semibold">
                          workspace.
                          {selectedLanguage === 'python'
                            ? 'py'
                            : selectedLanguage === 'json'
                            ? 'json'
                            : selectedLanguage === 'typescript'
                            ? 'ts'
                            : 'js'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                        • {lineCount} {lineCount === 1 ? 'line' : 'lines'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleCopyCode}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer"
                        title={language === 'ru' ? 'Копировать код' : 'Copy code'}
                      >
                        {copied ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span className="hidden sm:inline">
                          {copied
                            ? language === 'ru'
                              ? 'Скопировано'
                              : 'Copied'
                            : language === 'ru'
                            ? 'Копировать'
                            : 'Copy'}
                        </span>
                      </button>

                      <button
                        onClick={handleClearCode}
                        className="p-1 sm:px-2 sm:py-1 rounded-lg bg-slate-800/80 hover:bg-rose-900/30 text-slate-400 hover:text-rose-300 flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                        title={language === 'ru' ? 'Очистить редактор' : 'Clear code'}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="hidden sm:inline">{language === 'ru' ? 'Очистить' : 'Clear'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Code Editor Body with Gutter and Syntax Overlay */}
                  <div className="relative flex-1 flex overflow-hidden font-mono text-xs sm:text-sm bg-[#040813]">
                    {/* Line numbers gutter */}
                    <div
                      ref={lineNumbersRef}
                      className="w-9 sm:w-11 py-3 px-1 text-right select-none font-mono text-[11px] sm:text-xs text-slate-600 bg-[#060B18] border-r border-[#151E32] overflow-hidden shrink-0"
                    >
                      {Array.from({ length: lineCount }).map((_, i) => (
                        <div key={i} className="leading-relaxed">
                          {i + 1}
                        </div>
                      ))}
                    </div>

                    {/* Editor & Syntax Highlighting stack */}
                    <div className="relative flex-1 h-full overflow-hidden">
                      {/* Syntax Highlighted Backdrop */}
                      <pre
                        ref={highlightRef}
                        aria-hidden="true"
                        dangerouslySetInnerHTML={{ __html: highlightedHtml + '\n' }}
                        className="absolute inset-0 p-3 m-0 font-mono text-xs sm:text-sm leading-relaxed pointer-events-none overflow-hidden whitespace-pre font-normal text-slate-200"
                      />

                      {/* Transparent Input Textarea */}
                      <textarea
                        ref={textareaRef}
                        value={codeContent}
                        onChange={(e) => setCodeContent(e.target.value)}
                        onScroll={handleScroll}
                        onKeyDown={handleKeyDown}
                        spellCheck={false}
                        autoCapitalize="off"
                        autoCorrect="off"
                        className="absolute inset-0 w-full h-full p-3 m-0 font-mono text-xs sm:text-sm leading-relaxed bg-transparent text-transparent caret-cyan-400 selection:bg-cyan-500/35 resize-none outline-none overflow-auto whitespace-pre font-normal z-10"
                        placeholder={
                          language === 'ru'
                            ? 'Напишите или вставьте код сюда...\nTab = 2 пробела, Ctrl+Enter = запуск'
                            : 'Write or paste code here...\nTab = 2 spaces, Ctrl+Enter = run'
                        }
                      />
                    </div>
                  </div>

                  {/* Mobile Quick Characters Row (Visible on touch/mobile) */}
                  <div className="lg:hidden px-2 py-1.5 bg-[#090F1E] border-t border-[#1A253A] flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0">
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 mr-1">KEY:</span>
                    {QUICK_CHARS.map((char) => (
                      <button
                        key={char}
                        type="button"
                        onClick={() => handleInsertChar(char)}
                        className="min-w-[32px] h-8 px-2 rounded-lg bg-[#111A2D] hover:bg-[#1A2742] active:bg-emerald-600 text-slate-300 active:text-white font-mono text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shrink-0"
                      >
                        {char}
                      </button>
                    ))}
                  </div>

                  {/* Editor Bottom Status Bar */}
                  <div className="px-3 py-1.5 bg-[#090F1E] border-t border-[#151E32] flex items-center justify-between text-[11px] font-mono text-slate-500 shrink-0">
                    <div className="flex items-center gap-3">
                      <span>UTF-8</span>
                      <span>Tab: 2 spaces</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400/80">Ctrl + Enter to Run</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT PANE: DEDICATED TERMINAL OUTPUT (Hidden on mobile if editor tab selected) */}
                <div
                  className={`lg:col-span-5 flex flex-col h-full bg-[#040711] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl ${
                    mobilePane === 'terminal' ? 'flex' : 'hidden lg:flex'
                  }`}
                >
                  {/* Terminal Header Bar */}
                  <div className="px-3.5 py-2 bg-[#080D1A] border-b border-[#1A253A] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      {/* Traffic lights */}
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                        TERMINAL OUTPUT
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {executionTimeMs !== null && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                          ⚡ {executionTimeMs}ms
                        </span>
                      )}

                      {outputConsole && (
                        <>
                          <button
                            onClick={handleCopyOutput}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title={language === 'ru' ? 'Скопировать вывод' : 'Copy output'}
                          >
                            {outputCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setOutputConsole('');
                              setExitStatus('idle');
                              setExecutionTimeMs(null);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            title={language === 'ru' ? 'Очистить терминал' : 'Clear terminal'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Terminal Output Body */}
                  <div className="flex-1 p-3.5 overflow-y-auto font-mono text-xs text-slate-300 bg-[#03060E] space-y-2 leading-relaxed selection:bg-emerald-500/30">
                    {/* Prompt banner */}
                    <div className="text-slate-500 text-[11px] pb-1 border-b border-slate-900 flex items-center justify-between">
                      <span>
                        litenote@sandbox:~$ {selectedLanguage === 'python' ? 'python3 workspace.py' : 'node workspace.js'}
                      </span>
                      <span className="text-[10px] text-emerald-500/70">SANDBOXED V8/PY</span>
                    </div>

                    {/* Output stream */}
                    {isExecuting ? (
                      <div className="flex items-center gap-2 text-emerald-400 py-3 animate-pulse">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                        <span>{language === 'ru' ? 'Выполнение кода...' : 'Executing code...'}</span>
                      </div>
                    ) : outputConsole ? (
                      <div className="space-y-1 whitespace-pre-wrap font-mono">
                        {outputConsole.split('\n').map((line, idx) => {
                          const isError = line.startsWith('❌') || line.includes('Error:') || line.includes('Parser Error:');
                          const isHint = line.includes('💡 Подсказка:') || line.includes('💡 Hint:');
                          const isSuccess = line.startsWith('✓') || line.startsWith('✅');
                          const isReturn = line.startsWith('↳ Return Value:');

                          if (isError) {
                            return (
                              <div key={idx} className="text-rose-400 font-semibold bg-rose-950/25 p-1.5 rounded border-l-2 border-rose-500 my-1">
                                {line}
                              </div>
                            );
                          }
                          if (isHint) {
                            return (
                              <div key={idx} className="text-amber-300 bg-amber-950/30 p-2 rounded border-l-2 border-amber-400 my-1 font-sans text-xs">
                                {line}
                              </div>
                            );
                          }
                          if (isSuccess) {
                            return (
                              <div key={idx} className="text-emerald-400 font-semibold">
                                {line}
                              </div>
                            );
                          }
                          if (isReturn) {
                            return (
                              <div key={idx} className="text-cyan-300 bg-cyan-950/20 p-1 rounded">
                                {line}
                              </div>
                            );
                          }
                          return (
                            <div key={idx} className="text-slate-200">
                              {line}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-slate-600 italic py-6 text-center space-y-1.5">
                        <Terminal className="w-8 h-8 text-slate-700 mx-auto" />
                        <p>
                          {language === 'ru'
                            ? 'Нажмите "Запустить код" (или Ctrl+Enter) для выполнения...'
                            : 'Click "Run Code" (or press Ctrl+Enter) to execute...'}
                        </p>
                        <p className="text-[11px] text-slate-700">
                          {language === 'ru'
                            ? 'Поддерживается вывод console.log, console.table, print() с end=" "'
                            : 'Supports console.log, console.table, and print() with custom end=" "'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Terminal Footer Status Bar */}
                  <div className="px-3 py-1.5 bg-[#080D1A] border-t border-[#151E32] flex items-center justify-between text-[11px] font-mono shrink-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          exitStatus === 'success'
                            ? 'bg-emerald-400'
                            : exitStatus === 'error'
                            ? 'bg-rose-500'
                            : 'bg-slate-500'
                        }`}
                      ></span>
                      <span className="text-slate-400">
                        {exitStatus === 'success'
                          ? 'Process completed (exit code 0)'
                          : exitStatus === 'error'
                          ? 'Process terminated (exit code 1)'
                          : 'Runtime ready'}
                      </span>
                    </div>

                    <span className="text-slate-500 text-[10px]">Isolated Iframe Worker</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI CODE ASSISTANT */}
          {activeTab === 'ai_tools' && (
            <div className="flex-1 overflow-y-auto space-y-4 p-2 sm:p-3">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#070D18] border border-indigo-500/30 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{language === 'ru' ? 'Запрос к Litenote AI:' : 'Litenote AI Prompt:'}</span>
                  </label>
                  <input
                    type="text"
                    value={aiCustomPrompt}
                    onChange={(e) => setAiCustomPrompt(e.target.value)}
                    placeholder={
                      language === 'ru'
                        ? 'Например: добавь JSDoc типизацию, напиши тесты Jest или перепиши на Python...'
                        : 'e.g. Add TypeScript types, write Jest unit tests, convert to Python...'
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#030712] border border-indigo-900/60 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAiAction('explain');
                    }}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleAiAction('explain')}
                    disabled={isAiLoading}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-indigo-300" />
                    <span>{language === 'ru' ? 'Объяснить архитектуру' : 'Explain Logic'}</span>
                  </button>

                  <button
                    onClick={() => handleAiAction('optimize')}
                    disabled={isAiLoading}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-300" />
                    <span>{language === 'ru' ? 'Оптимизировать Big-O' : 'Optimize Big-O'}</span>
                  </button>

                  <button
                    onClick={() => handleAiAction('fix')}
                    disabled={isAiLoading}
                    className="px-3 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                    <span>{language === 'ru' ? 'Аудит безопасности' : 'Security Audit'}</span>
                  </button>

                  <button
                    onClick={() => handleAiAction('test')}
                    disabled={isAiLoading}
                    className="px-3 py-1.5 rounded-xl bg-sky-600/30 hover:bg-sky-600/50 text-sky-200 border border-sky-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-300" />
                    <span>{language === 'ru' ? 'Unit-тесты' : 'Unit Tests'}</span>
                  </button>

                  <button
                    onClick={() => handleAiAction('convert')}
                    disabled={isAiLoading}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-purple-300" />
                    <span>{language === 'ru' ? 'Конвертировать' : 'Convert Language'}</span>
                  </button>
                </div>

                {isAiLoading && (
                  <div className="p-4 rounded-xl bg-[#030712] border border-indigo-500/40 text-xs text-indigo-300 flex items-center gap-2.5 animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>
                      {language === 'ru'
                        ? 'Litenote AI проводит глубокий анализ кода и алгоритмов...'
                        : 'Litenote AI is analyzing code logic and complexity...'}
                    </span>
                  </div>
                )}

                {aiResult && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {language === 'ru' ? 'Ответ Litenote AI' : 'Litenote AI Output'}
                      </span>

                      <div className="flex items-center gap-2">
                        {aiActionSuccess && (
                          <span className="text-[11px] font-semibold text-emerald-400 animate-in fade-in">
                            {aiActionSuccess}
                          </span>
                        )}
                        <button
                          onClick={handleApplyAiCodeToEditor}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <CornerDownLeft className="w-3 h-3" />
                          <span>{language === 'ru' ? 'Вставить код в редактор' : 'Apply to Editor'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#030712] border border-slate-800 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-[260px] overflow-y-auto">
                      {aiResult}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3 bg-[#0F172A] border-t border-[#1E293B] flex items-center justify-between shrink-0">
          <button
            onClick={handleRunCode}
            disabled={isExecuting}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>
              {isExecuting
                ? language === 'ru'
                  ? 'Выполнение...'
                  : 'Running...'
                : language === 'ru'
                ? 'Запустить код (Ctrl+Enter)'
                : 'Run Code (Ctrl+Enter)'}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {language === 'ru' ? 'Закрыть' : 'Cancel'}
            </button>

            <button
              onClick={handlePublishToFeed}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{language === 'ru' ? 'Опубликовать в ленту' : 'Share to Feed'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
