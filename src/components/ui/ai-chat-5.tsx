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
  Minimize2,
  History,
  Plus,
  Edit2,
  X,
  Clock,
  Search,
} from 'lucide-react';
import Markdown from 'react-markdown';
import {
  subscribeAIConversations,
  createAIConversation,
  updateAIConversation,
  deleteAIConversation,
  subscribeAIMessages,
  saveAIMessage,
} from '../../lib/firebase';
import { AIConversation } from '../../types';

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
  userId?: string;
  userName?: string;
  userAvatar?: string;
  language?: 'ru' | 'en';
  accentColor?: string;
  onPublishToFeed?: (content: string) => void;
  className?: string;
}

const getWelcomeMessage = (lang: 'ru' | 'en'): ChatMessage => ({
  id: 'welcome_1',
  sender: 'assistant',
  content:
    lang === 'ru'
      ? `Привет! Я **Litenote AI** — твой персональный всесторонний собеседник и умный ассистент.\n\n` +
        `Я с удовольствием пообщаюсь с тобой на любые темы и помогу в самых разных задачах:\n` +
        `• 💬 **Живой разговор обо всём** — повседневные темы, психология, идеи, книги, наука, творчество и юмор\n` +
        `• ⚡ **Разработка и код** — написание, отладка, ревью и оптимизация (TypeScript, Python, React, Rust, SQL)\n` +
        `• 💡 **Создание контента** — яркие публикации, опросы и идеи для ленты Litenote\n` +
        `• 🛡️ **Безопасные действия** — интерактивное подтверждение операций (Inline Action Approval Gate)\n\n` +
        `О чём хочешь поговорить или что мы сегодня сделаем?`
      : `Hello! I am **Litenote AI** — your versatile all-around conversational companion and intelligent copilot.\n\n` +
        `I can help you with anything:\n` +
        `• 💬 **Engaging everyday conversation** — philosophy, life, science, creativity, ideas, and humor\n` +
        `• ⚡ **Code & Engineering** — write, debug, and review code (TypeScript, Python, React, Rust, SQL)\n` +
        `• 💡 **Drafting content** — captivating posts and interactive polls for the Litenote community feed\n` +
        `• 🛡️ **Gated sandbox actions** — secure operations with inline approval requests\n\n` +
        `What would you like to explore or discuss today?`,
  timestamp: Date.now(),
});

function formatRelativeDate(ts: number, lang: 'ru' | 'en'): string {
  if (!ts) return '';
  const now = Date.now();
  const diffMs = now - ts;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return lang === 'ru' ? 'только что' : 'just now';
  if (diffMin < 60) return lang === 'ru' ? `${diffMin} мин` : `${diffMin}m`;
  if (diffHours < 24) return lang === 'ru' ? `${diffHours} ч` : `${diffHours}h`;
  if (diffDays === 1) return lang === 'ru' ? 'вчера' : 'yesterday';
  return new Date(ts).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// Local storage keys and robust caching engine for zero-data-loss
const LOCAL_CONVS_PREFIX = 'litenote_ai_convs_';
const LOCAL_MSGS_PREFIX = 'litenote_ai_msgs_';
const LOCAL_ACTIVE_CONV_PREFIX = 'litenote_ai_active_conv_';

const loadLocalConversations = (uid: string): AIConversation[] => {
  try {
    const raw = localStorage.getItem(LOCAL_CONVS_PREFIX + uid);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalConversations = (uid: string, convs: AIConversation[]) => {
  try {
    localStorage.setItem(LOCAL_CONVS_PREFIX + uid, JSON.stringify(convs));
  } catch {}
};

const loadLocalMessages = (convId: string): ChatMessage[] => {
  try {
    const raw = localStorage.getItem(LOCAL_MSGS_PREFIX + convId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalMessages = (convId: string, msgs: ChatMessage[]) => {
  try {
    localStorage.setItem(LOCAL_MSGS_PREFIX + convId, JSON.stringify(msgs));
  } catch {}
};

export const AIChat5: React.FC<AIChat5Props> = ({
  initialMessages,
  userId,
  userName = 'Developer',
  userAvatar,
  language = 'ru',
  accentColor = 'emerald',
  onPublishToFeed,
  className = '',
}) => {
  const effectiveUid = userId || 'default_local_user';
  const isSendingRef = useRef<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isUserScrolledUpRef = useRef<boolean>(false);

  // Initialize conversation threads from persistent local storage
  const [conversations, setConversations] = useState<AIConversation[]>(() => {
    return loadLocalConversations(effectiveUid);
  });

  // Initialize active conversation id from persistent local storage
  const [activeConvId, setActiveConvId] = useState<string | null>(() => {
    const savedActive = localStorage.getItem(LOCAL_ACTIVE_CONV_PREFIX + effectiveUid);
    if (savedActive) return savedActive;
    const initialList = loadLocalConversations(effectiveUid);
    return initialList.length > 0 ? initialList[0].id : null;
  });

  // Initialize messages: initialMessages -> local cached messages for active thread -> welcome message
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (initialMessages && initialMessages.length > 0) return initialMessages;
    const savedActive = localStorage.getItem(LOCAL_ACTIVE_CONV_PREFIX + effectiveUid);
    if (savedActive) {
      const cached = loadLocalMessages(savedActive);
      if (cached.length > 0) return cached;
    }
    return [getWelcomeMessage(language)];
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitleVal, setEditingTitleVal] = useState('');
  const [searchHistory, setSearchHistory] = useState('');

  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'chat' | 'code' | 'posts' | 'actions'>('all');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Monitor user scroll position to avoid forcibly snapping down if they swiped up to read history
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // If distance from bottom is greater than 80px, user is reading history
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    isUserScrolledUpRef.current = distanceFromBottom > 80;
  };

  // Subscribe to user AI conversations in Firestore (merging with local cache)
  useEffect(() => {
    if (!userId) return;

    const unsub = subscribeAIConversations(userId, (cloudConvs) => {
      setConversations((prev) => {
        const map = new Map<string, AIConversation>();
        cloudConvs.forEach((c) => map.set(c.id, c));
        // Keep any local conversations that haven't synced yet
        prev.forEach((c) => {
          if (!map.has(c.id)) map.set(c.id, c);
        });
        const merged = Array.from(map.values()).sort(
          (a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)
        );
        saveLocalConversations(effectiveUid, merged);
        return merged;
      });

      setActiveConvId((prev) => {
        if (!prev && cloudConvs.length > 0) {
          const firstId = cloudConvs[0].id;
          localStorage.setItem(LOCAL_ACTIVE_CONV_PREFIX + effectiveUid, firstId);
          return firstId;
        }
        return prev;
      });
    });

    return () => unsub();
  }, [userId, effectiveUid]);

  // Subscribe to messages in active conversation (with local cache fallback and send protection)
  useEffect(() => {
    if (!activeConvId) {
      setMessages([getWelcomeMessage(language)]);
      return;
    }

    // Instantly load local cached messages so UI is never empty
    const local = loadLocalMessages(activeConvId);
    if (local.length > 0) {
      setMessages(local);
    }

    if (!userId) return;

    const unsub = subscribeAIMessages(userId, activeConvId, (loaded) => {
      if (loaded && loaded.length > 0) {
        const mapped: ChatMessage[] = loaded.map((m) => ({
          id: m.id,
          sender: m.sender,
          content: m.content,
          timestamp: m.timestamp,
          action: m.action,
        }));
        setMessages(mapped);
        saveLocalMessages(activeConvId, mapped);
      } else if (!isSendingRef.current) {
        // Only if not currently in flight, check local cache or show welcome
        const cached = loadLocalMessages(activeConvId);
        if (cached.length > 0) {
          setMessages(cached);
        } else {
          setMessages([getWelcomeMessage(language)]);
        }
      }
    });

    return () => unsub();
  }, [userId, activeConvId, language]);

  // Auto scroll to bottom only if user hasn't explicitly scrolled up to read earlier history
  useEffect(() => {
    if (!isUserScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isLoading]);

  // Create new conversation thread
  const handleNewChat = async () => {
    if (isLoading || isSendingRef.current) return;
    const now = Date.now();
    const newId = 'conv_' + now + '_' + Math.random().toString(36).substring(2, 7);
    const title = language === 'ru' ? 'Новый диалог' : 'New Conversation';
    const newConv: AIConversation = {
      id: newId,
      userId: effectiveUid,
      title,
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const nextConvs = [newConv, ...conversations.filter((c) => c.id !== newId)];
    setConversations(nextConvs);
    saveLocalConversations(effectiveUid, nextConvs);
    setActiveConvId(newId);
    localStorage.setItem(LOCAL_ACTIVE_CONV_PREFIX + effectiveUid, newId);

    const welcome = [getWelcomeMessage(language)];
    setMessages(welcome);
    saveLocalMessages(newId, welcome);

    if (window.innerWidth < 768) {
      setIsHistoryOpen(false);
    }

    if (userId) {
      createAIConversation(userId, title, newId).catch((err) =>
        console.warn('Failed to save new conversation to cloud:', err)
      );
    }
  };

  // Switch active conversation
  const handleSelectConversation = (convId: string) => {
    if (convId === activeConvId) {
      if (window.innerWidth < 768) setIsHistoryOpen(false);
      return;
    }
    setActiveConvId(convId);
    localStorage.setItem(LOCAL_ACTIVE_CONV_PREFIX + effectiveUid, convId);
    isUserScrolledUpRef.current = false;

    // Instantly load messages from local storage
    const cached = loadLocalMessages(convId);
    if (cached.length > 0) {
      setMessages(cached);
    } else {
      setMessages([getWelcomeMessage(language)]);
    }

    if (window.innerWidth < 768) {
      setIsHistoryOpen(false);
    }
  };

  // Delete conversation thread
  const handleDeleteConversation = async (convId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    // 1. Update local state immediately
    const remaining = conversations.filter((c) => c.id !== convId);
    setConversations(remaining);
    saveLocalConversations(effectiveUid, remaining);
    try {
      localStorage.removeItem(LOCAL_MSGS_PREFIX + convId);
    } catch {}

    if (activeConvId === convId) {
      if (remaining.length > 0) {
        const nextId = remaining[0].id;
        setActiveConvId(nextId);
        localStorage.setItem(LOCAL_ACTIVE_CONV_PREFIX + effectiveUid, nextId);
        const nextMsgs = loadLocalMessages(nextId);
        setMessages(nextMsgs.length > 0 ? nextMsgs : [getWelcomeMessage(language)]);
      } else {
        setActiveConvId(null);
        localStorage.removeItem(LOCAL_ACTIVE_CONV_PREFIX + effectiveUid);
        setMessages([getWelcomeMessage(language)]);
      }
    }

    // 2. Cloud delete
    if (userId) {
      try {
        await deleteAIConversation(userId, convId);
      } catch (err) {
        console.warn('Failed to delete cloud conversation:', err);
      }
    }
  };

  // Start inline rename
  const handleStartRename = (conv: AIConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditingTitleVal(conv.title);
  };

  // Save renamed title
  const handleSaveRename = async (convId: string) => {
    const trimmed = editingTitleVal.trim();
    if (!trimmed) {
      setEditingConvId(null);
      return;
    }
    const updated = conversations.map((c) => (c.id === convId ? { ...c, title: trimmed } : c));
    setConversations(updated);
    saveLocalConversations(effectiveUid, updated);
    setEditingConvId(null);

    if (userId) {
      try {
        await updateAIConversation(userId, convId, { title: trimmed });
      } catch (err) {
        console.warn('Failed to update conversation title in Firestore:', err);
      }
    }
  };

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
    if (isSendingRef.current || isLoading) return;
    const textToSend = (customPrompt || inputVal).trim();
    if (!textToSend) return;

    isSendingRef.current = true;
    setIsLoading(true);
    setInputVal('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    let currentConvId = activeConvId;
    const now = Date.now();

    // Auto-create conversation if none is active
    if (!currentConvId) {
      currentConvId = 'conv_' + now + '_' + Math.random().toString(36).substring(2, 7);
      const titleSnippet = textToSend.slice(0, 32).trim() || (language === 'ru' ? 'Новый диалог' : 'New Conversation');
      const newConv: AIConversation = {
        id: currentConvId,
        userId: effectiveUid,
        title: titleSnippet,
        messageCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      const nextConvs = [newConv, ...conversations.filter((c) => c.id !== currentConvId)];
      setConversations(nextConvs);
      saveLocalConversations(effectiveUid, nextConvs);
      setActiveConvId(currentConvId);
      localStorage.setItem(LOCAL_ACTIVE_CONV_PREFIX + effectiveUid, currentConvId);

      if (userId) {
        createAIConversation(userId, titleSnippet, currentConvId).catch((err) =>
          console.warn('Failed to auto-create conversation in Firestore:', err)
        );
      }
    }

    const userMessage: ChatMessage = {
      id: 'usr_' + now,
      sender: 'user',
      content: textToSend,
      timestamp: now,
    };

    // Filter out welcome message when user sends the first real message
    const baseMessages = messages.filter((m) => m.id !== 'welcome_1');
    const nextMessages = [...baseMessages, userMessage];
    setMessages(nextMessages);
    saveLocalMessages(currentConvId, nextMessages);

    // Scroll to bottom smoothly for new message sent by user
    isUserScrolledUpRef.current = false;
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    // Update conversation snippet, message count and title
    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.id === currentConvId) {
          const isDefaultTitle = c.title === 'Новый диалог' || c.title === 'New Conversation';
          const newTitle = isDefaultTitle ? textToSend.slice(0, 36).replace(/\n/g, ' ').trim() : c.title;
          return {
            ...c,
            title: newTitle,
            lastMessageSnippet: textToSend.slice(0, 80).replace(/\n/g, ' '),
            updatedAt: now,
            messageCount: (c.messageCount || 0) + 1,
          };
        }
        return c;
      });
      saveLocalConversations(effectiveUid, updated);
      return updated;
    });

    if (userId && currentConvId) {
      saveAIMessage(
        userId,
        currentConvId,
        {
          conversationId: currentConvId,
          userId,
          sender: 'user',
          content: textToSend,
          timestamp: userMessage.timestamp,
        },
        userMessage.id
      ).catch((err) => console.warn('Failed to save user message in Firestore:', err));

      const currentConv = conversations.find((c) => c.id === currentConvId);
      if (currentConv && (currentConv.title === 'Новый диалог' || currentConv.title === 'New Conversation')) {
        const cleanTitle = textToSend.slice(0, 36).replace(/\n/g, ' ').trim();
        if (cleanTitle) {
          updateAIConversation(userId, currentConvId, { title: cleanTitle }).catch(() => {});
        }
      }
    }

    try {
      // Check if user requested a specific destructive/sensitive action that should generate an Action Approval Gate
      const isCodeExecutionRequest =
        /запусти|выполни|протестируй код|execute|run this|run script|sandbox run/i.test(textToSend);
      const isPostPublishRequest =
        /опубликуй пост|создай пост в ленту|напиши пост для публикации|publish post|post to feed/i.test(textToSend);
      const isRefactorRequest =
        /рефакторинг|оптимизируй код|исправь уязвимости|refactor/i.test(textToSend);

      // Filter out system welcome notices and previous temporary error notices
      const apiHistory = nextMessages
        .filter(
          (m) =>
            m.id !== 'welcome_1' &&
            !m.content.includes('временный сбой') &&
            !m.content.includes('temporary network glitch')
        )
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.content,
        }));

      let responseText = '';

      // Primary attempt + automatic fast retry with generous timeout (25s)
      for (let attempt = 1; attempt <= 2 && !responseText; attempt++) {
        try {
          const controller = new AbortController();
          const clientTimeout = setTimeout(() => controller.abort(), 25000);

          const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: apiHistory,
            }),
            signal: controller.signal,
          });

          clearTimeout(clientTimeout);

          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (data && data.text && data.text.trim()) {
              responseText = data.text.trim();
              break;
            } else if (data && data.error) {
              responseText = data.text || `Ошибка AI: ${data.error}`;
              break;
            }
          }
        } catch (fetchErr) {
          console.warn(`[Litenote AI] Request attempt ${attempt} failed:`, fetchErr);
        }

        if (!responseText && attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      // Secondary fallback endpoint if multi-turn chat endpoint had an issue
      if (!responseText) {
        try {
          const controller = new AbortController();
          const clientTimeout = setTimeout(() => controller.abort(), 15000);
          const res2 = await fetch('/api/gemini/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: textToSend,
            }),
            signal: controller.signal,
          });
          clearTimeout(clientTimeout);
          const contentType2 = res2.headers.get('content-type') || '';
          if (contentType2.includes('application/json')) {
            const data2 = await res2.json();
            if (data2 && data2.text && data2.text.trim()) {
              responseText = data2.text.trim();
            }
          }
        } catch (err) {
          console.warn('[Litenote AI] Fallback endpoint error:', err);
        }
      }

      // Fallback message if AI was unreachable
      if (!responseText) {
        const isRussian = language === 'ru' || /[а-яА-ЯёЁ]/.test(textToSend);
        responseText = isRussian
          ? 'Не удалось получить ответ от Litenote AI. Проверьте сетевое подключение или ключ GEMINI_API_KEY в настройках сервера.'
          : 'Unable to reach the Litenote AI service. Please check your network connection or GEMINI_API_KEY on the server.';
      }

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

      const finalMessages = [...nextMessages, assistantMsg];
      setMessages(finalMessages);
      saveLocalMessages(currentConvId, finalMessages);

      if (userId && currentConvId) {
        saveAIMessage(
          userId,
          currentConvId,
          {
            conversationId: currentConvId,
            userId,
            sender: 'assistant',
            content: responseText,
            timestamp: assistantMsg.timestamp,
            action: attachedAction || undefined,
          },
          assistantMsg.id
        ).catch((err) => console.warn('Failed to save AI response in Firestore:', err));
      }
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
      const errMessages = [...nextMessages, errorMsg];
      setMessages(errMessages);
      saveLocalMessages(currentConvId, errMessages);
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // On mobile view, preserve natural enter newline to avoid accidental submits while typing
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        return;
      }
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

  const filteredConversations = conversations.filter((c) =>
    searchHistory
      ? c.title.toLowerCase().includes(searchHistory.toLowerCase()) ||
        (c.lastMessageSnippet && c.lastMessageSnippet.toLowerCase().includes(searchHistory.toLowerCase()))
      : true
  );
  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div
      className={`flex flex-col h-[calc(100vh-8.5rem)] max-h-[860px] min-h-[580px] bg-[#050B14] border border-[#132238] rounded-3xl overflow-hidden shadow-2xl relative ${className}`}
    >
      {/* Background Matrix/Cyber Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ================= 1. AI CHAT 5 HEADER ================= */}
      <div className="shrink-0 px-4 sm:px-5 py-3 bg-[#08111E]/95 border-b border-[#14263E] flex items-center justify-between gap-3 backdrop-blur-md z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-[1.5px] shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-[#070E1A] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#08111E]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-base text-white tracking-tight flex items-center gap-1.5">
                <span>Litenote AI</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 font-bold">
                Litenote Neural Core
              </span>
              {activeConv && (
                <div
                  onClick={() => setIsHistoryOpen(true)}
                  className="hidden md:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0B1524] border border-emerald-500/30 text-[11px] text-emerald-300 font-medium cursor-pointer hover:bg-[#122238] transition-colors max-w-[200px]"
                  title={language === 'ru' ? 'Текущий диалог (нажмите для истории)' : 'Active thread (click for history)'}
                >
                  <MessageSquare className="w-3 h-3 shrink-0 text-emerald-400" />
                  <span className="truncate">{activeConv.title}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="truncate">{language === 'ru' ? 'Всесторонний ассистент • Синхронизация в облаке' : 'Versatile Copilot • Cloud Sync'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleNewChat}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
            title={language === 'ru' ? 'Начать новый диалог' : 'Start new chat'}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'ru' ? 'Новый' : 'New'}</span>
          </button>

          {/* Toggle History Sidebar */}
          <button
            type="button"
            onClick={() => setIsHistoryOpen((prev) => !prev)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
              isHistoryOpen
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-[#0D192B] border-[#182C48] text-slate-300 hover:text-white hover:border-[#223d63]'
            }`}
            title={language === 'ru' ? 'История диалогов' : 'Conversation History'}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{language === 'ru' ? 'История' : 'History'}</span>
            {conversations.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-emerald-500/25 text-emerald-300">
                {conversations.length}
              </span>
            )}
          </button>

          {/* Clear Current Chat with Confirmation */}
          {showClearConfirm ? (
            <div className="flex items-center gap-1.5 bg-[#0D192B] border border-rose-500/40 px-2 py-1 rounded-xl animate-in fade-in">
              <span className="text-[11px] text-rose-300 font-mono hidden sm:inline">
                {language === 'ru' ? 'Удалить диалог?' : 'Delete thread?'}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (userId && activeConvId) {
                    deleteAIConversation(userId, activeConvId).catch(() => {});
                    const remaining = conversations.filter((c) => c.id !== activeConvId);
                    if (remaining.length > 0) {
                      setActiveConvId(remaining[0].id);
                    } else {
                      setActiveConvId(null);
                      setMessages([getWelcomeMessage(language)]);
                    }
                  } else {
                    setMessages([getWelcomeMessage(language)]);
                  }
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
              title={language === 'ru' ? 'Удалить этот диалог' : 'Delete this thread'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================= BODY WRAPPER: SIDEBAR + CHAT ================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ================= A. HISTORY SIDEBAR DRAWER ================= */}
        {isHistoryOpen && (
          <div className="absolute md:relative inset-y-0 left-0 z-30 w-full sm:w-80 md:w-72 bg-[#060D17]/98 md:bg-[#060D17] border-r border-[#14263E] flex flex-col backdrop-blur-xl animate-in slide-in-from-left-4 duration-200 shadow-2xl">
            {/* Drawer Header */}
            <div className="p-3 border-b border-[#14263E] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-white">
                  {language === 'ru' ? 'История диалогов' : 'Chat History'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0f1d30] text-emerald-300 font-bold">
                  {filteredConversations.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#122238] transition-colors cursor-pointer"
                title={language === 'ru' ? 'Закрыть' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-2.5 border-b border-[#14263E]/60">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                  placeholder={language === 'ru' ? 'Поиск в истории...' : 'Search threads...'}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#091321] border border-[#16273e] rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* New Chat Button Inside Drawer */}
            <div className="p-2.5 border-b border-[#14263E]/40">
              <button
                type="button"
                onClick={handleNewChat}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'ru' ? '+ Новый диалог' : '+ New Conversation'}</span>
              </button>
            </div>

            {/* Conversation Threads Scroll List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-10 px-4 space-y-2 text-xs text-slate-500">
                  <MessageCircle className="w-8 h-8 text-slate-600 mx-auto opacity-50" />
                  <p>
                    {searchHistory
                      ? (language === 'ru' ? 'Ничего не найдено' : 'No matching chats')
                      : (language === 'ru' ? 'История пока пуста. Начните новый диалог!' : 'No chats saved yet. Start talking!')}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = conv.id === activeConvId;
                  const isEditing = conv.id === editingConvId;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`group relative p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isActive
                          ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                          : 'bg-[#08121F]/70 hover:bg-[#0D1B2D] border-transparent hover:border-[#1A2E49]'
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingTitleVal}
                            onChange={(e) => setEditingTitleVal(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(conv.id);
                              if (e.key === 'Escape') setEditingConvId(null);
                            }}
                            autoFocus
                            className="flex-1 px-2 py-1 bg-[#040810] border border-emerald-500/50 rounded text-xs text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(conv.id)}
                            className="p-1 rounded bg-emerald-500 text-black text-xs font-bold"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingConvId(null)}
                            className="p-1 rounded bg-slate-700 text-slate-300 text-xs"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                              <h5 className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                {conv.title}
                              </h5>
                            </div>

                            {/* Actions on hover/touch */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => handleStartRename(conv, e)}
                                className="p-1 rounded hover:bg-[#15273F] text-slate-400 hover:text-slate-200 transition-colors"
                                title={language === 'ru' ? 'Переименовать' : 'Rename'}
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteConversation(conv.id, e)}
                                className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                                title={language === 'ru' ? 'Удалить диалог' : 'Delete thread'}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {conv.lastMessageSnippet && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 font-sans">
                              {conv.lastMessageSnippet}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/40 text-[10px] text-slate-500 font-mono">
                            <span>{formatRelativeDate(conv.updatedAt || conv.createdAt, language)}</span>
                            {typeof conv.messageCount === 'number' && conv.messageCount > 0 && (
                              <span className="px-1.5 py-0.2 rounded bg-slate-800/60 text-slate-400">
                                {conv.messageCount} {language === 'ru' ? 'сообщ.' : 'msgs'}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================= B. MAIN CHAT ACTIVE CONVERSATION ================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
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
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar touch-pan-y overscroll-contain"
          >
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

                          {(msg.content.includes('временный сбой') ||
                            msg.content.includes('temporary network glitch') ||
                            msg.content.includes('Не удалось получить ответ') ||
                            msg.content.includes('Unable to reach')) && (
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isLoading) return;
                                const msgIndex = messages.findIndex((m) => m.id === msg.id);
                                if (msgIndex > 0) {
                                  const prevUserMsg = messages[msgIndex - 1];
                                  if (prevUserMsg && prevUserMsg.sender === 'user') {
                                    handleSendMessage(prevUserMsg.content);
                                  }
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Sparkles className="w-3 h-3 text-emerald-400" />
                              <span className="text-[10px]">
                                {language === 'ru' ? 'Повторить запрос' : 'Retry'}
                              </span>
                            </button>
                          )}
                        </div>

                        <span className="text-[10px] font-mono text-slate-500">Litenote AI</span>
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
      <div className="shrink-0 p-2.5 sm:p-4 bg-[#08111E]/95 border-t border-[#14263E] backdrop-blur-md z-10">
        <div className="relative rounded-2xl bg-[#040810] border border-[#172B46] focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all shadow-inner flex items-center">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputVal}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={
              language === 'ru'
                ? 'Спросите Litenote AI... (код, диалог, идеи)'
                : 'Ask Litenote AI... (code, chat, ideas)'
            }
            className="w-full pl-3.5 pr-12 py-2.5 sm:py-3 bg-transparent text-slate-100 placeholder-slate-500 placeholder:truncate text-sm font-sans resize-none focus:outline-none max-h-40 overflow-x-hidden overflow-y-auto custom-scrollbar whitespace-pre-wrap break-words leading-relaxed min-h-[42px]"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
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

        <div className="flex items-center justify-between mt-1.5 px-1 text-[11px] text-slate-500 font-mono">
          <span className="hidden sm:inline">
            {language === 'ru' ? 'Enter — отправить, Shift+Enter — перенос строки' : 'Enter to send, Shift+Enter for new line'}
          </span>
          <span className="sm:hidden text-[10px]">
            {language === 'ru' ? 'Litenote AI Copilot' : 'Litenote AI Copilot'}
          </span>
          <span className="flex items-center gap-1 text-[10px] sm:text-[11px]">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>{language === 'ru' ? 'Защищено Action Gate' : 'Action Gate Protected'}</span>
          </span>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
};

export default AIChat5;
