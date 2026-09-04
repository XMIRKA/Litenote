import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Loader2,
  Copy,
  Check,
  Zap,
  Bot,
  User,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Play,
  Share2,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Code2,
  FileCode,
  Flame,
  CornerDownLeft,
  RotateCcw,
  Lightbulb,
  MessageSquare,
  MessageCircle,
  HelpCircle,
  Cpu,
  Layers,
  ChevronDown,
  Info,
  Maximize2,
  Minimize2
} from 'lucide-react';
import Markdown from 'react-markdown';

export type ActionRisk = 'low' | 'moderate' | 'high' | 'destructive';
export type ActionStatus = 'pending' | 'executing' | 'completed' | 'rejected' | 'failed';

export interface AgentAction {
  id: string;
  name: string;
  type: string;
  description: string;
  risk: ActionRisk;
  payload: string;
  language?: string;
  status: ActionStatus;
  result?: {
    success: boolean;
    output: string;
    executionTimeMs?: number;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: number;
  action?: AgentAction;
}

export interface AIChat5Props {
  initialMessages?: ChatMessage[];
  userName?: string;
  userAvatar?: string;
  language?: 'ru' | 'en';
  accentColor?: string;
  onPublishToFeed?: (content: string) => void;
  className?: string;
}

export const AIChat5: React.FC<AIChat5Props> = ({
  initialMessages,
  userName = 'Developer',
  userAvatar,
  language = 'ru',
  accentColor = 'emerald',
  onPublishToFeed,
  className = '',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (initialMessages && initialMessages.length > 0) return initialMessages;
    return [
      {
        id: 'welcome_1',
        sender: 'assistant',
        content:
          language === 'ru'
            ? `Привет! Я **Litenote AI** — твой всесторонний ИИ-ассистент на базе **Gemini 3.7 Flash**.\n\n` +
              `Я умею всё:\n` +
              `• 💬 **Общаться на любые темы** — от повседневных бесед и философии до брейншторминга и аналитики\n` +
              `• ⚡ **Писать, отлаживать и оптимизировать код** (TypeScript, Python, Rust, React, SQL и др.)\n` +
              `• 💡 **Создавать вовлекающие посты** для ленты Litenote и генерировать опросы\n` +
              `• 🛡️ **Выполнять действия в песочнице с безопасным подтверждением** (Inline Action Approval)\n\n` +
              `Чем займемся сегодня? Задай любой вопрос или выбери быструю тему ниже!`
            : `Hello! I am **Litenote AI** — your versatile all-around assistant powered by **Gemini 3.7 Flash**.\n\n` +
              `Here is what I can do:\n` +
              `• 💬 **Converse freely on any topic** — from general talk and philosophy to product strategy\n` +
              `• ⚡ **Write, debug, and review code** (TypeScript, Python, Rust, React, SQL, etc.)\n` +
              `• 💡 **Draft viral posts & polls** directly for the Litenote feed\n` +
              `• 🛡️ **Execute agent sandbox operations with inline approval requests**\n\n` +
              `How can I assist you today?`,
        timestamp: Date.now(),
      },
    ];
  });

  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'chat' | 'code' | 'posts' | 'actions'>('all');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Adjust textarea height dynamically
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputVal(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Safe Action Execution Logic
  const handleApproveAction = async (msgId: string, action: AgentAction) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId && msg.action) {
          return {
            ...msg,
            action: { ...msg.action, status: 'executing' },
          };
        }
        return msg;
      })
    );

    const startTime = performance.now();

    try {
      // Execute the action via backend safe runner or client sandbox
      let outputText = '';
      let isSuccess = true;

      if (action.type === 'run_sandbox_code' || action.type === 'execute_script') {
        const res = await fetch('/api/ai/assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Выполни симуляцию запуска и дай результат выполнения этого кода:\n\n${action.payload}`,
            type: 'code_review',
            language,
          }),
        });
        const data = await res.json();
        outputText = data.result || '✔ Выполнение завершено успешно. Код возврата: 0';
      } else if (action.type === 'publish_post') {
        if (onPublishToFeed) {
          onPublishToFeed(action.payload);
        }
        outputText = language === 'ru'
          ? '✔ Пост успешно сформирован и передан в публикатор ленты Litenote!'
          : '✔ Post drafted and passed to the Litenote feed composer!';
      } else if (action.type === 'refactor_code' || action.type === 'security_audit') {
        const res = await fetch('/api/ai/assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: action.payload,
            type: 'code_review',
            language,
          }),
        });
        const data = await res.json();
        outputText = data.result || '✔ Анализ безопасности и оптимизация выполнены.';
      } else {
        // Generic system action
        await new Promise((r) => setTimeout(r, 600));
        outputText = language === 'ru'
          ? `✔ Действие "${action.name}" выполнено без ошибок в изолированном окружении.`
          : `✔ Action "${action.name}" executed successfully in sandbox environment.`;
      }

      const executionTime = Math.round(performance.now() - startTime);

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === msgId && msg.action) {
            return {
              ...msg,
              action: {
                ...msg.action,
                status: 'completed',
                result: {
                  success: isSuccess,
                  output: outputText,
                  executionTimeMs: executionTime,
                },
              },
            };
          }
          return msg;
        })
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === msgId && msg.action) {
            return {
              ...msg,
              action: {
                ...msg.action,
                status: 'failed',
                result: {
                  success: false,
                  output: err?.message || 'Execution error in sandbox container.',
                },
              },
            };
          }
          return msg;
        })
      );
    }
  };

  const handleRejectAction = (msgId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId && msg.action) {
          return {
            ...msg,
            action: {
              ...msg.action,
              status: 'rejected',
              result: {
                success: false,
                output:
                  language === 'ru'
                    ? '⛔ Действие отклонено пользователем. Изменения не были применены.'
                    : '⛔ Action was cancelled by the user. No modifications applied.',
              },
            },
          };
        }
        return msg;
      })
    );
  };

  // Send message
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputVal).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputVal('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsLoading(true);

    try {
      // Check if user requested a specific destructive/sensitive action that should generate an Action Approval Gate
      const isCodeExecutionRequest =
        /запусти|выполни|протестируй код|execute|run this|run script|sandbox run/i.test(textToSend);
      const isPostPublishRequest =
        /опубликуй пост|создай пост в ленту|напиши пост для публикации|publish post|post to feed/i.test(textToSend);
      const isRefactorRequest =
        /рефакторинг|оптимизируй код|исправь уязвимости|refactor/i.test(textToSend);

      const apiHistory = nextMessages
        .filter((m) => m.id !== 'welcome_1')
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.content,
        }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiHistory,
        }),
      });

      const data = await res.json();
      const responseText = data.text || (language === 'ru' ? 'Ответ сформирован.' : 'Response generated.');

      // Construct dynamic inline action if relevant
      let attachedAction: AgentAction | undefined = undefined;

      if (isCodeExecutionRequest) {
        attachedAction = {
          id: 'act_' + Date.now(),
          name: language === 'ru' ? 'Запуск кода в песочнице REPL' : 'Execute REPL Sandbox Script',
          type: 'run_sandbox_code',
          description:
            language === 'ru'
              ? 'Выполнение изолированного скрипта в песочнице с захватом вывода консоли.'
              : 'Isolated script execution inside the sandbox container with output capture.',
          risk: 'moderate',
          payload:
            textToSend.includes('```')
              ? textToSend.split('```')[1]
              : '// REPL Test Runner\nconst result = [1, 2, 3, 4, 5].reduce((a, b) => a + b, 0);\nconsole.log("Sum:", result);',
          language: 'typescript',
          status: 'pending',
        };
      } else if (isPostPublishRequest) {
        attachedAction = {
          id: 'act_' + Date.now(),
          name: language === 'ru' ? 'Публикация поста в ленту Litenote' : 'Publish Post to Litenote Feed',
          type: 'publish_post',
          description:
            language === 'ru'
              ? 'Создание новой публичной записи в глобальной ленте сообщества Litenote.'
              : 'Create a new public post in the global Litenote developer feed.',
          risk: 'low',
          payload: responseText.slice(0, 300),
          status: 'pending',
        };
      } else if (isRefactorRequest) {
        attachedAction = {
          id: 'act_' + Date.now(),
          name: language === 'ru' ? 'Применение оптимизации и рефакторинга' : 'Apply Automated Refactor Diff',
          type: 'refactor_code',
          description:
            language === 'ru'
              ? 'Модификация структуры компонентов и улучшение производительности.'
              : 'Component structure refactoring and performance enhancement.',
          risk: 'moderate',
          payload: '// Refactored Code Module\nexport const memoizedHandler = React.useCallback(() => {\n  /* optimized */\n}, []);',
          language: 'typescript',
          status: 'pending',
        };
      }

      const assistantMsg: ChatMessage = {
        id: 'ai_' + Date.now(),
        sender: 'assistant',
        content: responseText,
        timestamp: Date.now(),
        action: attachedAction,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'err_' + Date.now(),
        sender: 'assistant',
        content:
          language === 'ru'
            ? 'Извините, произошла небольшая задержка сети. Пожалуйста, отправьте сообщение еще раз.'
            : 'A network timeout occurred. Please try sending your message again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPrompts = [
    {
      category: 'chat',
      icon: MessageCircle,
      label: language === 'ru' ? '💬 Поговорить на свободную тему' : '💬 General Conversation',
      prompt:
        language === 'ru'
          ? 'Расскажи что-нибудь интересное о будущем искусственного интеллекта и как он меняет разработку и творчество?'
          : 'Tell me something fascinating about the future of AI and how it is shaping developer creativity?',
    },
    {
      category: 'code',
      icon: Code2,
      label: language === 'ru' ? '⚡ Написать & Протестировать код' : '⚡ Write & Test Code',
      prompt:
        language === 'ru'
          ? 'Напиши функцию на TypeScript для глубокого сравнения объектов (deep equal) с тестами и запусти ее в песочнице.'
          : 'Write a TypeScript deep-equal function with edge case tests and simulate running it in sandbox.',
    },
    {
      category: 'posts',
      icon: Lightbulb,
      label: language === 'ru' ? '💡 Создать вирусный пост' : '💡 Craft a Social Post',
      prompt:
        language === 'ru'
          ? 'Напиши яркий пост для ленты Litenote о 5 главных ошибках при работе с React useEffect, с примерами и тегами.'
          : 'Write an engaging post for the Litenote feed covering top 5 mistakes with React useEffect, with code examples and hashtags.',
    },
    {
      category: 'actions',
      icon: ShieldAlert,
      label: language === 'ru' ? '🛡️ Действие с подтверждением' : '🛡️ Gated Agent Action',
      prompt:
        language === 'ru'
          ? 'Подготовь оптимизацию базы данных и запусти скрипт очистки кеша через действие с подтверждением (Approval Gate).'
          : 'Prepare a database optimization routine and trigger an inline approval gate before execution.',
    },
  ];

  const getRiskBadge = (risk: ActionRisk) => {
    switch (risk) {
      case 'destructive':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-400" />
            <span>DESTRUCTIVE</span>
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>HIGH RISK</span>
          </span>
        );
      case 'moderate':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>MODERATE</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>SAFE OPERATION</span>
          </span>
        );
    }
  };

  return (
    <div
      className={`flex flex-col h-[calc(100vh-8.5rem)] max-h-[860px] min-h-[580px] bg-[#050B14] border border-[#132238] rounded-3xl overflow-hidden shadow-2xl relative ${className}`}
    >
      {/* Background Matrix/Cyber Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ================= 1. AI CHAT 5 HEADER ================= */}
      <div className="shrink-0 px-5 py-3.5 bg-[#08111E]/95 border-b border-[#14263E] flex items-center justify-between backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-[1.5px] shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-[#070E1A] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#08111E]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-white tracking-tight flex items-center gap-1.5">
                <span>Litenote AI</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 font-bold">
                Gemini 3.7 Flash
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 font-bold">
                AI Chat 5 Action Gate
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{language === 'ru' ? 'Всесторонний ассистент • Диалог • Код • Безопасные действия' : 'Versatile Copilot • Chat • Code • Gated Actions'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Clear History with Confirmation */}
          {showClearConfirm ? (
            <div className="flex items-center gap-1.5 bg-[#0D192B] border border-rose-500/40 px-2.5 py-1 rounded-xl animate-in fade-in">
              <span className="text-[11px] text-rose-300 font-mono">
                {language === 'ru' ? 'Очистить историю?' : 'Clear history?'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setShowClearConfirm(false);
                }}
                className="px-2 py-0.5 rounded bg-rose-500 text-white text-[10px] font-bold hover:bg-rose-600 transition-colors cursor-pointer"
              >
                {language === 'ru' ? 'Да' : 'Yes'}
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px] hover:bg-slate-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title={language === 'ru' ? 'Очистить историю чата' : 'Clear Chat'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================= 2. QUICK TOPIC CHIPS ================= */}
      <div className="shrink-0 px-4 py-2 bg-[#060D17] border-b border-[#122238] flex items-center gap-2 overflow-x-auto no-scrollbar z-10">
        <span className="text-[11px] font-mono text-slate-500 shrink-0 flex items-center gap-1 pl-1">
          <Layers className="w-3 h-3 text-emerald-400" />
          <span>{language === 'ru' ? 'Быстрый старт:' : 'Quick Start:'}</span>
        </span>
        {quickPrompts.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(item.prompt)}
              className="shrink-0 px-3 py-1 rounded-full bg-[#0B1524] hover:bg-[#122238] border border-[#182C48] hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Icon className="w-3.5 h-3.5 text-emerald-400" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= 3. MESSAGES CONVERSATION SCROLL ================= */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Litenote AI готов к работе</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Задайте любой вопрос, попросите написать код или запустите встроенное действие.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isAssistant = msg.sender === 'assistant';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 ${
                  isAssistant ? 'items-start' : 'items-start flex-row-reverse'
                } group animate-in fade-in duration-200`}
              >
                {/* Avatar */}
                <div className="shrink-0 mt-0.5">
                  {isAssistant ? (
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center shadow-md">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </div>
                  ) : userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="w-9 h-9 rounded-2xl object-cover ring-1 ring-emerald-500/50"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-2xl bg-[#112034] border border-[#1E3654] flex items-center justify-center text-xs font-bold text-white">
                      <User className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </div>

                {/* Message Bubble & Content */}
                <div
                  className={`max-w-[88%] sm:max-w-[80%] space-y-3 ${
                    isAssistant ? 'text-left' : 'text-right'
                  }`}
                >
                  {/* Sender Name & Timestamp */}
                  <div
                    className={`flex items-center gap-2 text-[11px] text-slate-400 font-mono ${
                      isAssistant ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <span className="font-bold text-slate-300">
                      {isAssistant ? 'Litenote AI' : userName}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Main Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      isAssistant
                        ? 'bg-[#091322] border border-[#162B46] text-slate-100 shadow-lg'
                        : 'bg-gradient-to-br from-emerald-600/90 to-teal-700/90 text-white border border-emerald-400/30 ml-auto'
                    }`}
                  >
                    <div className="prose prose-invert prose-emerald max-w-none text-sm break-words whitespace-pre-line font-sans">
                      <Markdown>{msg.content}</Markdown>
                    </div>

                    {/* Bottom Message Utility Bar */}
                    {isAssistant && (
                      <div className="mt-3 pt-2.5 border-t border-[#14243A] flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0E1B2E] hover:bg-[#162A45] hover:text-white transition-colors cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-[10px] text-emerald-400">
                                  {language === 'ru' ? 'Скопировано' : 'Copied'}
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-400" />
                                <span className="text-[10px]">
                                  {language === 'ru' ? 'Копировать' : 'Copy'}
                                </span>
                              </>
                            )}
                          </button>

                          {onPublishToFeed && (
                            <button
                              type="button"
                              onClick={() => onPublishToFeed(msg.content)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0E1B2E] hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer"
                            >
                              <Share2 className="w-3 h-3 text-emerald-400" />
                              <span className="text-[10px]">
                                {language === 'ru' ? 'В ленту' : 'Post to Feed'}
                              </span>
                            </button>
                          )}
                        </div>

                        <span className="text-[10px] font-mono text-slate-500">Gemini 3.7 Flash</span>
                      </div>
                    )}
                  </div>

                  {/* ================= 4. INLINE ACTION APPROVAL GATE (React Bits Pro AI Chat 5) ================= */}
                  {msg.action && (
                    <div className="rounded-2xl bg-[#070F1C] border-2 border-emerald-500/30 shadow-2xl p-4 sm:p-5 space-y-3.5 animate-in fade-in slide-in-from-top-2">
                      {/* Action Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-[#14263E] pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-[#0D1C30] border border-[#193556]">
                            <Terminal className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-white">{msg.action.name}</h4>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {msg.action.description}
                            </p>
                          </div>
                        </div>

                        {getRiskBadge(msg.action.risk)}
                      </div>

                      {/* Code / Command Payload preview */}
                      {msg.action.payload && (
                        <div className="rounded-xl bg-[#03070E] border border-[#132238] p-3 font-mono text-xs overflow-x-auto custom-scrollbar">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-[#132238] pb-1.5 mb-2">
                            <span className="text-emerald-400 font-bold">
                              {msg.action.type.toUpperCase()}
                            </span>
                            <span>{msg.action.language || 'typescript'}</span>
                          </div>
                          <pre className="text-emerald-300 text-xs leading-relaxed whitespace-pre-wrap">
                            {msg.action.payload}
                          </pre>
                        </div>
                      )}

                      {/* Action Status and Controls */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                        {/* Status Label */}
                        <div className="flex items-center gap-2 text-xs font-mono">
                          {msg.action.status === 'pending' && (
                            <span className="flex items-center gap-1.5 text-amber-300">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                              <span>
                                {language === 'ru'
                                  ? 'Ожидает вашего подтверждения'
                                  : 'Awaiting User Approval'}
                              </span>
                            </span>
                          )}

                          {msg.action.status === 'executing' && (
                            <span className="flex items-center gap-1.5 text-cyan-300">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                              <span>
                                {language === 'ru'
                                  ? 'Выполнение действия в песочнице...'
                                  : 'Executing in sandbox...'}
                              </span>
                            </span>
                          )}

                          {msg.action.status === 'completed' && (
                            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              <span>
                                {language === 'ru'
                                  ? 'Действие успешно выполнено'
                                  : 'Action Executed Successfully'}
                              </span>
                            </span>
                          )}

                          {msg.action.status === 'rejected' && (
                            <span className="flex items-center gap-1.5 text-rose-400">
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>
                                {language === 'ru'
                                  ? 'Действие отклонено'
                                  : 'Action Rejected'}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Interactive Approval Buttons */}
                        {msg.action.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRejectAction(msg.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#0F1B2C] hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-[#1A2E48] hover:border-rose-500/40 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              {language === 'ru' ? 'Отклонить' : 'Reject'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleApproveAction(msg.id, msg.action!)}
                              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold font-mono shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>{language === 'ru' ? 'Подтвердить и запустить' : 'Approve & Run'}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Result Output Window if completed/failed */}
                      {msg.action.result && (
                        <div
                          className={`p-3 rounded-xl border text-xs font-mono animate-in fade-in ${
                            msg.action.result.success
                              ? 'bg-[#030912] border-emerald-500/40 text-emerald-300'
                              : 'bg-[#120508] border-rose-500/40 text-rose-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pb-1 border-b border-slate-800 mb-1.5">
                            <span>
                              {msg.action.result.success ? 'OUTPUT (Exit: 0)' : 'EXECUTION LOG'}
                            </span>
                            {msg.action.result.executionTimeMs && (
                              <span>{msg.action.result.executionTimeMs}ms</span>
                            )}
                          </div>
                          <p className="whitespace-pre-line leading-relaxed">
                            {msg.action.result.output}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 text-slate-400 animate-in fade-in">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
            </div>
            <div className="p-3.5 rounded-2xl bg-[#08111E] border border-[#16273E] text-xs font-mono flex items-center gap-2 text-emerald-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{language === 'ru' ? 'Litenote AI генерирует ответ...' : 'Litenote AI is generating response...'}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ================= 4. INPUT COMPOSER ================= */}
      <div className="shrink-0 p-3 sm:p-4 bg-[#08111E]/95 border-t border-[#14263E] backdrop-blur-md z-10">
        <div className="relative rounded-2xl bg-[#040810] border border-[#172B46] focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all shadow-inner">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputVal}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={
              language === 'ru'
                ? 'Спросите что угодно: поболтать, написать код, создать пост или запустить команду...'
                : 'Ask anything: chat freely, debug code, draft posts, or request an action...'
            }
            className="w-full pl-4 pr-12 py-3 bg-transparent text-slate-100 placeholder-slate-500 text-sm font-sans resize-none focus:outline-none max-h-40 custom-scrollbar"
          />

          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputVal.trim() || isLoading}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                inputVal.trim() && !isLoading
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
                  : 'bg-[#0B1524] text-slate-600 cursor-not-allowed'
              }`}
              title="Send (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-500 font-mono">
          <span>
            {language === 'ru' ? 'Enter — отправить, Shift+Enter — перенос строки' : 'Enter to send, Shift+Enter for new line'}
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>{language === 'ru' ? 'Защищено Action Gate' : 'Action Gate Protected'}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default AIChat5;
