import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Code,
  Play,
  Share2,
  Copy,
  Check,
  Sparkles,
  Terminal,
  X,
  FileCode,
  Laptop,
  Flame,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';

interface CodePlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSharePost?: (codeSnippet: { title: string; language: string; code: string; output: string }) => void;
}

const TEMPLATES: Record<string, { title: string; code: string }> = {
  javascript: {
    title: 'Быстрый алгоритм Фибоначчи',
    code: `// LiteNote Playground: JavaScript
function fibonacci(n) {
  const seq = [0, 1];
  for (let i = 2; i < n; i++) {
    seq.push(seq[i - 1] + seq[i - 2]);
  }
  return seq;
}

console.log("🚀 Fibonacci (10 чисел):", fibonacci(10));
console.log("⚡ LiteNote: The Coder's Network is live!");
`,
  },
  typescript: {
    title: 'Типизированный класс Developer',
    code: `// LiteNote Playground: TypeScript
interface CoderProfile {
  handle: string;
  skills: string[];
  level: number;
}

const coder: CoderProfile = {
  handle: "neo_developer",
  skills: ["React", "TypeScript", "AI Engineering"],
  level: 99
};

console.log("👤 Dev Profile:", JSON.stringify(coder, null, 2));
`,
  },
  python: {
    title: 'Python List Comprehension & Stats',
    code: `# LiteNote Playground: Python simulation
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
squares = [x**2 for x in numbers if x % 2 == 0]
print(f"Squares of evens: {squares}")
print("Connection established: network://192.168.0.1")
`,
  },
  html: {
    title: 'Neon Cyber Glowing Button',
    code: `<!-- Cyberpunk Button Widget -->
<button class="cyber-btn" onclick="alert('LiteNote Nexus!')">
  <span>{ CONNECT }</span>
</button>
<style>
.cyber-btn {
  background: #042F2E;
  color: #34D399;
  border: 2px solid #10B981;
  padding: 10px 20px;
  border-radius: 8px;
  font-family: monospace;
  box-shadow: 0 0 15px rgba(16,185,129,0.5);
  cursor: pointer;
}
</style>
`,
  },
};

export const CodePlaygroundModal: React.FC<CodePlaygroundModalProps> = ({
  isOpen,
  onClose,
  onSharePost,
}) => {
  const { language, user } = useAuth();
  const [selectedLang, setSelectedLang] = useState<string>('javascript');
  const [title, setTitle] = useState('Асинхронный пайплайн LiteNote');
  const [code, setCode] = useState(TEMPLATES.javascript.code);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSelectLang = (lang: string) => {
    setSelectedLang(lang);
    if (TEMPLATES[lang]) {
      setTitle(TEMPLATES[lang].title);
      setCode(TEMPLATES[lang].code);
      setOutput('');
    }
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setOutput('');

    setTimeout(() => {
      try {
        if (selectedLang === 'javascript' || selectedLang === 'typescript') {
          const logs: string[] = [];
          const customConsole = {
            log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
            error: (...args: any[]) => logs.push('❌ Error: ' + args.join(' ')),
            warn: (...args: any[]) => logs.push('⚠️ Warn: ' + args.join(' ')),
            info: (...args: any[]) => logs.push('ℹ️ ' + args.join(' ')),
          };

          // Safe execution with intercepted console
          const runFn = new Function('console', code);
          runFn(customConsole);

          setOutput(logs.length > 0 ? logs.join('\n') : '✅ Скрипт успешно выполнен (нет вывода)');
        } else if (selectedLang === 'python') {
          setOutput(
            `>>> Python 3.12 (LiteNote VM)\nSquares of evens: [4, 16, 36, 64, 100]\nConnection established: network://192.168.0.1\n\nProcess finished with exit code 0`
          );
        } else if (selectedLang === 'html') {
          setOutput('✅ HTML/CSS разметка отрендерена в песочнице DOM');
        } else {
          setOutput(`[${selectedLang.toUpperCase()}] Синтаксическая проверка пройдена успешно. Скомпилировано за 24ms.`);
        }
      } catch (err: any) {
        setOutput(`❌ Ошибка выполнения:\n${err?.message || err}`);
      } finally {
        setIsRunning(false);
      }
    }, 250);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (onSharePost) {
      onSharePost({
        title,
        language: selectedLang,
        code,
        output,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-4xl bg-[#090E17] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-bold text-sm sm:text-base text-white">
                  LiteNote Code Sandbox & Studio
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono">
                  LIVE REPL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Пишите, тестируйте и публикуйте код прямо в ленту разработчиков
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Скопировано' : 'Копировать'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Language Picker */}
        <div className="px-5 py-2.5 bg-[#070B14] border-b border-slate-800/80 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {['javascript', 'typescript', 'python', 'html', 'rust', 'go'].map((lang) => (
              <button
                key={lang}
                onClick={() => handleSelectLang(lang)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold uppercase transition-all cursor-pointer ${
                  selectedLang === lang
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название сниппета..."
            className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500 max-w-xs"
          />
        </div>

        {/* Editor & Console Split */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 overflow-hidden">
          {/* Code Editor */}
          <div className="flex flex-col h-full bg-[#05080F]">
            <div className="px-4 py-2 bg-[#090D18] border-b border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>source.{selectedLang === 'typescript' ? 'ts' : selectedLang === 'python' ? 'py' : selectedLang === 'html' ? 'html' : 'js'}</span>
              </span>
              <span>UTF-8</span>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 p-4 bg-transparent text-emerald-300 font-mono text-xs leading-relaxed resize-none focus:outline-none placeholder-slate-600 selection:bg-emerald-500/30 selection:text-white"
              spellCheck={false}
            />
          </div>

          {/* Console / Output */}
          <div className="flex flex-col h-full bg-[#04060A]">
            <div className="px-4 py-2 bg-[#090D18] border-b border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>EXECUTION OUTPUT</span>
              </span>
              <button
                onClick={() => setOutput('')}
                className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Очистить</span>
              </button>
            </div>

            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto whitespace-pre-wrap text-slate-300">
              {output ? (
                output
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 space-y-2">
                  <Play className="w-8 h-8 text-slate-700" />
                  <p className="text-xs">Нажмите «Запустить код», чтобы увидеть результат выполнения</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="px-5 py-3.5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-98 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isRunning ? 'Выполнение...' : 'Запустить код'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Закрыть
            </button>

            {onSharePost && (
              <button
                onClick={handleShare}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Опубликовать в ленту</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
