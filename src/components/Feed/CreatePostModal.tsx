import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { translations } from '../../lib/i18n';
import { THEME_CONFIGS } from '../../lib/theme';
import { Post } from '../../types';
import {
  X,
  Code,
  Image as ImageIcon,
  Tag,
  Sparkles,
  Send,
  Loader2,
  BarChart2,
  Plus,
  Trash2,
  Upload,
  Globe,
  Check,
  AlertCircle
} from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (newPost: Partial<Post>) => void;
}

const COMMON_TAGS = ['новости', 'технологии', 'ai', 'разработка', 'дизайн', 'web', 'python', 'crypto', 'жизнь'];
const CODE_LANGUAGES = ['typescript', 'javascript', 'python', 'rust', 'go', 'cpp', 'html', 'css', 'sql', 'bash', 'json'];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
}) => {
  const { user, accentColor, language } = useAuth();
  const t = translations[language];
  const theme = THEME_CONFIGS[accentColor];

  const [content, setContent] = useState('');
  
  // Attachments toggle states
  const [showImageSection, setShowImageSection] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaInputUrl, setMediaInputUrl] = useState('');

  const [showPollSection, setShowPollSection] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  const [showCodeSection, setShowCodeSection] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('typescript');

  const [showTagsSection, setShowTagsSection] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(['новости']);
  const [customTagInput, setCustomTagInput] = useState('');

  const [showAiHelper, setShowAiHelper] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !user) return null;

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTagInput.trim()) {
      e.preventDefault();
      const clean = customTagInput.trim().replace(/^#/, '').toLowerCase();
      if (!selectedTags.includes(clean)) {
        setSelectedTags([...selectedTags, clean]);
      }
      setCustomTagInput('');
    }
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleUpdatePollOption = (index: number, val: string) => {
    const next = [...pollOptions];
    next[index] = val;
    setPollOptions(next);
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        setMediaUrl(compressedBase64);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleApplyMediaUrl = () => {
    if (mediaInputUrl.trim()) {
      setMediaUrl(mediaInputUrl.trim());
      setMediaInputUrl('');
    }
  };

  const handleGenerateWithAi = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    try {
      const response = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          type: 'post_ideas',
          language: language,
        }),
      });
      const data = await response.json();
      if (data.result) {
        setContent(data.result);
        setShowAiHelper(false);
        setAiPrompt('');
      }
    } catch (err) {
      console.warn('AI assistance fallback:', err);
      setContent(language === 'ru' ? 'Делюсь интересными мыслями и обновлениями по текущему проекту!' : 'Sharing updates and insights from today!');
      setShowAiHelper(false);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSubmit = async () => {
    const hasContent = content.trim().length > 0;
    const hasCode = showCodeSection && codeSnippet.trim().length > 0;
    const hasMedia = showImageSection && mediaUrl.length > 0;
    const hasPoll = showPollSection && pollQuestion.trim().length > 0;

    if (!hasContent && !hasCode && !hasMedia && !hasPoll) return;

    setIsPublishing(true);

    let pollData = undefined;
    if (showPollSection && pollQuestion.trim()) {
      const validOptions = pollOptions.filter((o) => o.trim().length > 0);
      if (validOptions.length >= 2) {
        pollData = {
          question: pollQuestion.trim(),
          options: validOptions.map((text) => ({ text: text.trim(), votes: 0 })),
        };
      }
    }

    const postPayload: Partial<Post> = {
      authorId: user.uid,
      authorName: user.displayName,
      authorHandle: user.handle,
      authorAvatar: user.avatarUrl,
      authorBadges: user.badges || [],
      content: content.trim(),
      codeSnippet: hasCode ? { code: codeSnippet.trim(), language: codeLanguage } : undefined,
      mediaUrl: hasMedia ? mediaUrl : undefined,
      mediaType: hasMedia ? 'image' : undefined,
      poll: pollData,
      tags: selectedTags.length > 0 ? selectedTags : ['новости'],
      reactions: { '🔥': [user.uid] },
      commentsCount: 0,
      createdAt: Date.now(),
      bookmarksCount: 0,
    };

    try {
      onPostCreated(postPayload);
      onClose();
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0B0F19] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E293B] bg-[#0F172A]">
          <div className="flex items-center gap-3">
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-10 h-10 rounded-xl object-cover border border-[#2A3B53]"
            />
            <div>
              <h3 className="font-sans font-bold text-sm sm:text-base text-white">
                {user.displayName}
              </h3>
              <p className="text-xs text-slate-400">@{user.handle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Main Textarea */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={language === 'ru' ? 'Что у вас нового? Поделитесь мыслями, идеями или вопросом...' : "What's happening? Share thoughts, ideas, or questions..."}
            rows={4}
            className="w-full p-3.5 text-sm bg-[#0F172A] text-slate-100 placeholder:text-slate-500 border border-[#1E293B] rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none leading-relaxed"
            autoFocus
          />

          {/* AI Helper Banner */}
          {showAiHelper && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/30 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {language === 'ru' ? 'AI Помощник в написании' : 'AI Writing Assistant'}
                </span>
                <button
                  onClick={() => setShowAiHelper(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={language === 'ru' ? 'Тема поста (например: релиз проекта, новости ИИ, опрос)...' : 'Topic of the post (e.g. project launch, AI news)...'}
                  className="flex-1 px-3 py-2 text-xs bg-[#090E17] text-white border border-indigo-500/30 rounded-lg focus:outline-none focus:border-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleGenerateWithAi();
                    }
                  }}
                />
                <button
                  onClick={handleGenerateWithAi}
                  disabled={isAiGenerating || !aiPrompt.trim()}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  {isAiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{language === 'ru' ? 'Создать' : 'Generate'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 1. Attached Photo / Media Section */}
          {showImageSection && (
            <div className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B] space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  {language === 'ru' ? 'Прикрепление изображения' : 'Attach Image'}
                </span>
                <button
                  onClick={() => {
                    setShowImageSection(false);
                    setMediaUrl('');
                  }}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!mediaUrl ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 border-2 border-dashed border-slate-700 hover:border-sky-400 rounded-xl bg-[#0A0E17] flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer group"
                  >
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-sky-400" />
                    <span className="text-xs font-medium text-slate-300 group-hover:text-white">
                      {language === 'ru' ? 'Загрузить с устройства' : 'Upload from device'}
                    </span>
                    <span className="text-[10px] text-slate-500">PNG, JPG, WebP, GIF</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileUpload}
                  />

                  <div className="flex flex-col justify-center gap-2 p-3 rounded-xl bg-[#0A0E17] border border-slate-800">
                    <span className="text-xs text-slate-400">
                      {language === 'ru' ? 'Или укажите ссылку на фото:' : 'Or enter image URL:'}
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={mediaInputUrl}
                        onChange={(e) => setMediaInputUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-3 py-1.5 text-xs bg-[#0F172A] text-white border border-slate-700 rounded-lg focus:outline-none focus:border-sky-400"
                      />
                      <button
                        type="button"
                        onClick={handleApplyMediaUrl}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg cursor-pointer"
                      >
                        {language === 'ru' ? 'ОК' : 'OK'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden max-h-60 border border-slate-700 bg-black">
                  <img src={mediaUrl} alt="Attached" className="w-full h-60 object-cover" />
                  <button
                    onClick={() => setMediaUrl('')}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/70 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. Interactive Poll Builder Section */}
          {showPollSection && (
            <div className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B] space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4" />
                  {language === 'ru' ? 'Создание опроса' : 'Create Poll'}
                </span>
                <button
                  onClick={() => {
                    setShowPollSection(false);
                    setPollQuestion('');
                    setPollOptions(['', '']);
                  }}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder={language === 'ru' ? 'Задайте вопрос...' : 'Ask a question...'}
                className="w-full px-3.5 py-2 text-xs bg-[#090E17] text-white border border-slate-700 rounded-xl focus:outline-none focus:border-amber-400"
              />

              <div className="space-y-2">
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-4 font-medium">{idx + 1}.</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleUpdatePollOption(idx, e.target.value)}
                      placeholder={`${language === 'ru' ? 'Вариант ответа' : 'Option'} ${idx + 1}`}
                      className="flex-1 px-3 py-1.5 text-xs bg-[#090E17] text-white border border-slate-700 rounded-lg focus:outline-none focus:border-amber-400"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => handleRemovePollOption(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {pollOptions.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddPollOption}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer pt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'ru' ? 'Добавить вариант' : 'Add Option'}</span>
                </button>
              )}
            </div>
          )}

          {/* 3. Code Snippet Section */}
          {showCodeSection && (
            <div className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B] space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Code className="w-4 h-4" />
                  {language === 'ru' ? 'Блок кода' : 'Code Block'}
                </span>
                <button
                  onClick={() => {
                    setShowCodeSection(false);
                    setCodeSnippet('');
                  }}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{language === 'ru' ? 'Язык:' : 'Language:'}</span>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-[#090E17] text-slate-200 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-400"
                >
                  {CODE_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder={language === 'ru' ? '// Вставьте фрагмент кода сюда...' : '// Paste code snippet here...'}
                rows={5}
                className="w-full p-3 font-mono text-xs bg-[#060910] text-emerald-300 placeholder:text-slate-600 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-400 resize-none leading-relaxed"
              />
            </div>
          )}

          {/* 4. Topic Tags Section */}
          {showTagsSection && (
            <div className="p-4 rounded-xl bg-[#0F172A] border border-[#1E293B] space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-400 flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  {language === 'ru' ? 'Теги публикации' : 'Post Tags'}
                </span>
                <button
                  onClick={() => setShowTagsSection(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {COMMON_TAGS.map((t) => {
                  const isSelected = selectedTags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleToggleTag(t)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-violet-600 text-white font-semibold shadow-sm'
                          : 'bg-[#090E17] text-slate-400 border border-slate-700 hover:text-white'
                      }`}
                    >
                      #{t}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={handleAddCustomTag}
                placeholder={language === 'ru' ? 'Добавьте свой тег и нажмите Enter...' : 'Type custom tag and press Enter...'}
                className="w-full px-3 py-1.5 text-xs bg-[#090E17] text-white border border-slate-700 rounded-lg focus:outline-none focus:border-violet-400"
              />
            </div>
          )}
        </div>

        {/* Persistent Bottom Action Bar */}
        <div className="px-5 py-3.5 bg-[#0F172A] border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
          {/* Attachment Toggle Buttons (Pills) */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setShowImageSection((prev) => !prev)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                showImageSection || mediaUrl
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold shadow-[0_0_10px_rgba(14,165,233,0.2)]'
                  : 'bg-[#1E293B]/60 text-slate-300 hover:text-white hover:bg-slate-700/60 border border-transparent'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-sky-400" />
              <span>{language === 'ru' ? 'Фото' : 'Photo'}</span>
              {mediaUrl && <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
            </button>

            <button
              type="button"
              onClick={() => setShowPollSection((prev) => !prev)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                showPollSection || pollQuestion
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-[#1E293B]/60 text-slate-300 hover:text-white hover:bg-slate-700/60 border border-transparent'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <span>{language === 'ru' ? 'Опрос' : 'Poll'}</span>
              {pollQuestion && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
            </button>

            <button
              type="button"
              onClick={() => setShowCodeSection((prev) => !prev)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                showCodeSection || codeSnippet
                  ? 'bg-[#04241E] text-emerald-300 border border-emerald-500 font-semibold shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-[#1E293B]/60 text-slate-300 hover:text-white hover:bg-slate-700/60 border border-transparent'
              }`}
            >
              <Code className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ru' ? 'Код' : 'Code'}</span>
              {codeSnippet && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>

            <button
              type="button"
              onClick={() => setShowTagsSection((prev) => !prev)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                showTagsSection
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 font-semibold shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                  : 'bg-[#1E293B]/60 text-slate-300 hover:text-white hover:bg-slate-700/60 border border-transparent'
              }`}
            >
              <Tag className="w-4 h-4 text-violet-400" />
              <span>{language === 'ru' ? 'Теги' : 'Tags'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAiHelper((prev) => !prev)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                showAiHelper
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold'
                  : 'bg-[#1E293B]/60 text-indigo-300 hover:text-indigo-200 hover:bg-slate-700/60 border border-transparent'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">AI</span>
            </button>
          </div>

          {/* Action Buttons (Pills) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-slate-800"
            >
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPublishing || (!content.trim() && !codeSnippet.trim() && !mediaUrl && !pollQuestion.trim())}
              className="px-5 py-2.5 rounded-full bg-[#00DF89] hover:bg-[#00f596] disabled:opacity-40 text-[#041912] text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(0,223,137,0.3)] active:scale-95 transition-all cursor-pointer"
            >
              {isPublishing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>{language === 'ru' ? 'Опубликовать' : 'Publish'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
