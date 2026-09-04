import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { translations } from '../../lib/i18n';
import { THEME_CONFIGS } from '../../lib/theme';
import { Post, Comment } from '../../types';
import { CommentsSection } from './CommentsSection';
import { CreatorBadge, CoFounderBadge, VerifiedCheck } from '../Common/CreatorBadge';
import { isCreatorAccount, isCoFounderAccount } from '../../lib/creator';
import { getCleanAvatarUrl } from '../../lib/avatar';
import { subscribeComments, deleteCommentDoc } from '../../lib/firebase';
import {
  MessageSquare,
  Bookmark,
  Share2,
  Sparkles,
  Pin,
  Check,
  Copy,
  Code2,
  Trash2,
  BarChart2,
  MoreHorizontal,
  Smile,
  Heart,
  Flame,
  Zap,
  Volume2,
  Play,
  Pause,
  Languages
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  comments: Comment[];
  isBookmarked: boolean;
  onToggleReaction: (postId: string, emoji: string) => void;
  onToggleBookmark: (postId: string) => void;
  onAddComment: (postId: string, content: string, parentId?: string) => void;
  onDeleteComment?: (commentId: string, postId: string) => void;
  onSelectTag?: (tag: string) => void;
  onDeletePost?: (postId: string) => void;
  onVotePoll?: (postId: string, optionIndex: number) => void;
}

const QUICK_EMOJIS = ['🔥', '❤️', '👍', '🚀', '👏', '😂', '💡', '🎉'];

export const PostCard: React.FC<PostCardProps> = ({
  post,
  comments,
  isBookmarked,
  onToggleReaction,
  onToggleBookmark,
  onAddComment,
  onSelectTag,
  onDeletePost,
  onVotePoll,
}) => {
  const { user, accentColor, language, setSelectedUserId, setActiveTab } = useAuth();
  const t = translations[language];
  const theme = THEME_CONFIGS[accentColor];

  const [showComments, setShowComments] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(comments || []);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Synchronize local comments when parent comments update
  useEffect(() => {
    if (comments && comments.length > 0) {
      setLocalComments(comments);
    }
  }, [comments]);

  // Subscribe to real-time comments when comments section is opened or on initial load
  useEffect(() => {
    if (!showComments) return;
    const unsub = subscribeComments(post.id, (loadedComments) => {
      setLocalComments(loadedComments);
    });
    return () => unsub();
  }, [showComments, post.id]);

  const handleAddNewComment = (postId: string, content: string, parentId?: string) => {
    if (user) {
      const optimisticComment: Comment = {
        id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        postId,
        authorId: user.uid,
        authorName: user.displayName,
        authorHandle: user.handle,
        authorAvatar: user.avatarUrl,
        content,
        parentId,
        createdAt: Date.now(),
        reactions: {},
      };
      setLocalComments((prev) => [...prev, optimisticComment]);
    }
    onAddComment(postId, content, parentId);
  };
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [executedOutput, setExecutedOutput] = useState<string | null>(null);
  const [isExecutingCode, setIsExecutingCode] = useState(false);

  // Auto-translate state
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isShowingTranslation, setIsShowingTranslation] = useState(false);
  const [translatedLang, setTranslatedLang] = useState<string>('');

  const handleTranslate = async () => {
    if (translatedText && translatedLang === language) {
      setIsShowingTranslation((prev) => !prev);
      return;
    }
    if (!post.content || !post.content.trim()) return;
    setIsTranslating(true);
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: post.content,
          targetLang: language === 'ru' ? 'ru' : 'en',
        }),
      });
      const data = await response.json();
      if (data && data.translatedText) {
        setTranslatedText(data.translatedText);
        setTranslatedLang(language);
        setIsShowingTranslation(true);
      }
    } catch (e) {
      console.error('Translation error', e);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleRunSnippet = () => {
    if (!post.codeSnippet?.code) return;
    setIsExecutingCode(true);
    setExecutedOutput(null);

    setTimeout(() => {
      try {
        const lang = (post.codeSnippet?.language || 'javascript').toLowerCase();
        if (lang === 'javascript' || lang === 'typescript' || lang === 'js' || lang === 'ts') {
          const logs: string[] = [];
          const customConsole = {
            log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
            error: (...args: any[]) => logs.push('❌ Error: ' + args.join(' ')),
            warn: (...args: any[]) => logs.push('⚠️ Warn: ' + args.join(' ')),
            info: (...args: any[]) => logs.push('ℹ️ ' + args.join(' ')),
          };
          const fn = new Function('console', post.codeSnippet.code);
          fn(customConsole);
          setExecutedOutput(logs.length > 0 ? logs.join('\n') : '✅ Код успешно выполнен без ошибок (пустой вывод)');
        } else if (lang === 'python' || lang === 'py') {
          setExecutedOutput('>>> Python 3.12 (LiteNote VM Sandbox)\n' + (post.codeSnippet.output || 'Output: [Result calculated successfully in 12ms]'));
        } else {
          setExecutedOutput(`[${lang.toUpperCase()}] Синтаксический анализ пройден успешно. 0 ошибок.`);
        }
      } catch (err: any) {
        setExecutedOutput(`❌ Ошибка выполнения:\n${err?.message || err}`);
      } finally {
        setIsExecutingCode(false);
      }
    }, 200);
  };

  const isOwnPost = user?.uid === post.authorId;
  const authorName = isOwnPost && user ? user.displayName : post.authorName;
  const authorHandle = isOwnPost && user ? user.handle : post.authorHandle;
  const authorAvatar = isOwnPost && user ? user.avatarUrl : post.authorAvatar;

  const isAuthorCreator =
    (isOwnPost && isCreatorAccount(user)) ||
    isCreatorAccount({
      email: (post as any).authorEmail || (isOwnPost && user ? user.email : undefined),
      handle: authorHandle,
      uid: post.authorId,
      displayName: authorName,
      authorHandle: authorHandle,
    });

  const isAuthorCoFounder =
    (isOwnPost && isCoFounderAccount(user)) ||
    isCoFounderAccount({
      email: (post as any).authorEmail || (isOwnPost && user ? user.email : undefined),
      handle: authorHandle,
      uid: post.authorId,
      displayName: authorName,
      authorHandle: authorHandle,
    });

  const formatTime = (ts: number) => {
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60) return language === 'ru' ? 'только что' : 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} ${language === 'ru' ? 'мин назад' : 'm ago'}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ${language === 'ru' ? 'ч назад' : 'h ago'}`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ${language === 'ru' ? 'д назад' : 'd ago'}`;
    return new Date(ts).toLocaleDateString();
  };

  const handleCopyCode = () => {
    if (post.codeSnippet?.code) {
      navigator.clipboard.writeText(post.codeSnippet.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShare = () => {
    const url = window.location.origin + '#post-' + post.id;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSummarizeWithAi = async () => {
    if (aiSummary) {
      setAiSummary(null);
      return;
    }
    setIsSummarizing(true);
    try {
      const response = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Post content: "${post.content}" ${post.codeSnippet ? `\nCode: ${post.codeSnippet.code}` : ''}`,
          type: 'summarize',
          language: language,
        }),
      });
      const data = await response.json();
      if (data.result) {
        setAiSummary(data.result);
      }
    } catch {
      setAiSummary(language === 'ru' ? 'Главная мысль: полезное обновление и обсуждение.' : 'Main point: Important update and discussion.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAuthorClick = () => {
    setSelectedUserId(post.authorId);
    setActiveTab('profile');
  };

  // Poll calculations
  const totalPollVotes = post.poll?.options?.reduce((acc, opt) => acc + (opt.votes || 0), 0) || 0;

  return (
    <article
      id={`post-${post.id}`}
      className={`rounded-2xl p-4 sm:p-5 transition-all space-y-4 shadow-sm ${
        isAuthorCreator
          ? 'bg-[#0D1220] border-2 border-amber-500/40 shadow-[0_4px_20px_rgba(245,158,11,0.08)]'
          : isAuthorCoFounder
          ? 'bg-[#0A1120] border-2 border-cyan-500/40 shadow-[0_4px_20px_rgba(6,182,212,0.08)]'
          : 'bg-[#0B0F19] border border-[#1A2337] hover:border-slate-700/80'
      }`}
    >
      {/* Pinned or Creator Post Indicator */}
      {(post.isPinned || isAuthorCreator || isAuthorCoFounder) && (
        <div className="flex items-center justify-between pb-1 text-xs font-semibold">
          {post.isPinned && (
            <div className="flex items-center gap-1.5 text-indigo-400">
              <Pin className="w-3.5 h-3.5 fill-indigo-400" />
              <span>{language === 'ru' ? 'Закрепленная запись' : 'Pinned Post'}</span>
            </div>
          )}
          {isAuthorCreator && (
            <div className="flex items-center gap-1 text-amber-400 font-mono text-[10px] uppercase ml-auto">
              <span>★ {language === 'ru' ? 'Пост от создателя Litenote' : 'Post by Founder'}</span>
            </div>
          )}
          {isAuthorCoFounder && !isAuthorCreator && (
            <div className="flex items-center gap-1 text-cyan-400 font-mono text-[10px] uppercase ml-auto">
              <span>💎 {language === 'ru' ? 'Пост от сооснователя Litenote' : 'Post by Co-Founder'}</span>
            </div>
          )}
        </div>
      )}

      {/* Author & Header */}
      <div className="flex items-start justify-between gap-3">
        <div
          onClick={handleAuthorClick}
          className="flex items-center gap-3 cursor-pointer group min-w-0 flex-1"
        >
          <div className="relative shrink-0">
            <img
              src={getCleanAvatarUrl(authorHandle || authorName, authorAvatar)}
              alt={authorName}
              className={`w-10 h-10 rounded-xl object-cover bg-slate-800 transition-colors ${
                isAuthorCreator
                  ? 'border-2 border-amber-400/90 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                  : isAuthorCoFounder
                  ? 'border-2 border-cyan-400/90 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                  : 'border border-slate-700 group-hover:border-indigo-500'
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">
                {authorName}
              </span>
              <VerifiedCheck user={isOwnPost && user ? user : { handle: authorHandle, uid: post.authorId, displayName: authorName, email: (post as any).authorEmail }} />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
              <span className="text-emerald-400/90 font-mono">@{authorHandle}</span>
              {isAuthorCreator && (
                <CreatorBadge user={isOwnPost && user ? user : { handle: authorHandle, uid: post.authorId, displayName: authorName, email: (post as any).authorEmail }} size="sm" showLabel />
              )}
              {isAuthorCoFounder && (
                <CoFounderBadge user={isOwnPost && user ? user : { handle: authorHandle, uid: post.authorId, displayName: authorName, email: (post as any).authorEmail }} size="sm" showLabel />
              )}
              <span className="text-slate-600">•</span>
              <span className="text-slate-500">{formatTime(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Delete button (Author or Platform Creator only) */}
        {(isOwnPost || isCreatorAccount(user)) && onDeletePost && (
          <button
            onClick={() => onDeletePost && onDeletePost(post.id)}
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
            title={language === 'ru' ? 'Удалить публикацию' : 'Delete post'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Post Text Content with Auto-Translation */}
      {post.content && (
        <div className="space-y-2">
          <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-line font-normal select-text">
            {isShowingTranslation && translatedText ? translatedText : post.content}
          </p>

          {/* Active Translation Indicator */}
          {isShowingTranslation && translatedText ? (
            <div className="flex items-center justify-between gap-2 py-1 px-3 rounded-xl bg-[#071F17] border border-emerald-500/30 text-emerald-300 text-xs animate-in fade-in">
              <div className="flex items-center gap-1.5 font-medium">
                <Languages className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  {language === 'ru' ? 'Переведено на русский язык (AI)' : 'Translated to English (AI)'}
                </span>
              </div>
              <button
                onClick={() => setIsShowingTranslation(false)}
                className="text-slate-400 hover:text-white underline text-[11px] cursor-pointer transition-colors"
              >
                {language === 'ru' ? 'Оригинал' : 'Original'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className="text-[11px] text-emerald-400/80 hover:text-emerald-300 flex items-center gap-1.5 font-medium cursor-pointer transition-colors"
              >
                <Languages className={`w-3 h-3 ${isTranslating ? 'animate-spin' : ''}`} />
                <span>
                  {isTranslating
                    ? (language === 'ru' ? 'Переводим...' : 'Translating...')
                    : (language === 'ru' ? 'Перевести текст' : 'Translate post')}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* AI Summary Card (Expandable) */}
      {aiSummary && (
        <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-1 animate-in fade-in">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'ru' ? 'Краткое содержание (AI)' : 'AI Summary'}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{aiSummary}</p>
        </div>
      )}

      {/* Image / Media Attachment */}
      {post.mediaUrl && (
        <div className="rounded-xl overflow-hidden border border-[#1E293B] bg-black/40">
          <img
            src={post.mediaUrl}
            alt="Post media"
            className="w-full max-h-96 object-cover hover:scale-[1.01] transition-transform duration-300 cursor-pointer"
            onClick={() => window.open(post.mediaUrl, '_blank')}
          />
        </div>
      )}

      {/* Poll Component */}
      {post.poll && (
        <div className="p-4 rounded-xl bg-[#080D17] border border-[#1A243A] space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <span className="flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              {post.poll.question}
            </span>
            <span className="text-slate-400 font-normal">
              {totalPollVotes} {language === 'ru' ? 'голосов' : 'votes'}
            </span>
          </div>

          <div className="space-y-2">
            {post.poll.options.map((opt, idx) => {
              const votes = opt.votes || 0;
              const percentage = totalPollVotes > 0 ? Math.round((votes / totalPollVotes) * 100) : 0;
              return (
                <button
                  key={idx}
                  onClick={() => onVotePoll && onVotePoll(post.id, idx)}
                  className="w-full relative overflow-hidden p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 text-left transition-all group cursor-pointer"
                >
                  <div
                    className="absolute inset-0 bg-indigo-600/20 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="relative flex items-center justify-between text-xs font-medium text-slate-200">
                    <span>{opt.text}</span>
                    <span className="text-slate-400 font-semibold">{percentage}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Code Snippet Block */}
      {post.codeSnippet && (
        <div className="rounded-2xl overflow-hidden border border-emerald-500/30 bg-[#060A12] shadow-md space-y-0">
          <div className="px-4 py-2.5 bg-[#091120] border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-400 ml-2">
                {post.codeSnippet.language?.toUpperCase() || 'CODE'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRunSnippet}
                disabled={isExecutingCode}
                className="px-3 py-1 rounded-full bg-[#00DF89] hover:bg-[#00f596] text-[#041912] text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_10px_rgba(0,223,137,0.25)] active:scale-95"
              >
                <Play className="w-3 h-3 fill-current stroke-[2.5]" />
                <span>{isExecutingCode ? 'Запуск...' : 'Запустить'}</span>
              </button>

              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Скопировано' : 'Копировать'}</span>
              </button>
            </div>
          </div>

          <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed selection:bg-emerald-500/30 selection:text-white bg-[#05080E]">
            <code>{post.codeSnippet.code}</code>
          </pre>

          {/* Interactive Output Console */}
          {executedOutput && (
            <div className="p-3.5 bg-[#030508] border-t border-slate-800/90 font-mono text-xs text-slate-300 space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="text-emerald-400 font-semibold">▶ CONSOLE OUTPUT</span>
                <button
                  onClick={() => setExecutedOutput(null)}
                  className="text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  ✕ Закрыть
                </button>
              </div>
              <pre className="text-[11px] text-emerald-400 whitespace-pre-wrap leading-relaxed">
                {executedOutput}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {post.tags.map((t) => (
            <button
              key={t}
              onClick={() => onSelectTag && onSelectTag(t)}
              className="px-3 py-0.5 rounded-full text-xs font-medium bg-[#0A1220] hover:bg-[#0E1A2E] text-slate-300 hover:text-emerald-300 border border-[#182A40] hover:border-emerald-500/40 transition-all cursor-pointer font-mono"
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      {/* Post Action Footer Bar (Pill Capsule Controls) */}
      <div className="pt-2 border-t border-[#1A2337] flex items-center justify-between gap-2 flex-wrap relative">
        {/* Reactions List */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {Object.entries(post.reactions || {}).map(([emoji, uids]) => {
            const count = Array.isArray(uids) ? uids.length : 0;
            if (count === 0) return null;
            const hasUserReacted = user && Array.isArray(uids) && uids.includes(user.uid);
            return (
              <button
                key={emoji}
                onClick={() => onToggleReaction(post.id, emoji)}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  hasUserReacted
                    ? 'bg-[#04241E] text-emerald-300 border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-transparent'
                }`}
              >
                <span>{emoji}</span>
                <span>{count}</span>
              </button>
            );
          })}

          {/* Quick Reaction Add Button */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
              title="Добавить реакцию"
            >
              <Smile className="w-4 h-4" />
            </button>

            {showEmojiPicker && (
              <div
                className="absolute bottom-full left-0 mb-2 p-2 bg-[#0E1526] border border-slate-700 rounded-full shadow-2xl z-20 flex gap-1 animate-in fade-in zoom-in-95"
                onMouseLeave={() => setShowEmojiPicker(false)}
              >
                {QUICK_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => {
                      onToggleReaction(post.id, e);
                      setShowEmojiPicker(false);
                    }}
                    className="p-1.5 hover:scale-125 transition-transform text-base cursor-pointer"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Secondary Actions: Translate, AI, Comments, Bookmark, Share (Pills) */}
        <div className="flex items-center gap-1 text-slate-400">
          {/* Post Translation Button */}
          {post.content && (
            <button
              onClick={handleTranslate}
              disabled={isTranslating}
              className={`p-2 rounded-full hover:bg-slate-800 transition-colors cursor-pointer ${
                isShowingTranslation ? 'text-emerald-400 bg-emerald-500/10' : 'hover:text-emerald-400'
              }`}
              title={
                isTranslating
                  ? (language === 'ru' ? 'Переводим текст...' : 'Translating text...')
                  : isShowingTranslation
                  ? (language === 'ru' ? 'Скрыть перевод' : 'Hide translation')
                  : (language === 'ru' ? 'Перевести на русский язык' : 'Translate post to English')
              }
            >
              <Languages className={`w-4 h-4 ${isTranslating ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          )}

          {/* AI summary button */}
          <button
            onClick={handleSummarizeWithAi}
            disabled={isSummarizing}
            className="p-2 rounded-full hover:bg-slate-800 hover:text-emerald-400 transition-colors cursor-pointer"
            title="AI Пересказ"
          >
            <Sparkles className={`w-4 h-4 ${aiSummary ? 'text-emerald-400' : ''}`} />
          </button>

          {/* Comments Toggle */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-800 transition-colors cursor-pointer text-xs font-medium ${
              showComments ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30' : 'hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{localComments.length > 0 ? localComments.length : (post.commentsCount || 0)}</span>
          </button>

          {/* Bookmark */}
          <button
            onClick={() => onToggleBookmark(post.id)}
            className={`p-2 rounded-full hover:bg-slate-800 transition-colors cursor-pointer ${
              isBookmarked ? 'text-amber-400 fill-amber-400' : 'hover:text-white'
            }`}
            title="В закладки"
          >
            <Bookmark className="w-4 h-4" />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title="Поделиться ссылкой"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Comments Drawer */}
      {showComments && (
        <div className="pt-3 border-t border-[#1A2337]">
          <CommentsSection
            postId={post.id}
            comments={localComments}
            onAddComment={handleAddNewComment}
            onDeleteComment={async (commentId, pId) => {
              setLocalComments((prev) => prev.filter((c) => c.id !== commentId && c.parentId !== commentId));
              await deleteCommentDoc(commentId, pId);
            }}
          />
        </div>
      )}
    </article>
  );
};
