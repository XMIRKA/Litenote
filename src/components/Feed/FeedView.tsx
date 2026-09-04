import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { translations } from '../../lib/i18n';
import { THEME_CONFIGS } from '../../lib/theme';
import { Post, Comment, UserProfile } from '../../types';
import { PostCard } from './PostCard';
import {
  Sparkles,
  Filter,
  Plus,
  TrendingUp,
  Search,
  X,
  Code2,
  Image as ImageIcon,
  BarChart2,
  Flame,
  Clock,
  BookmarkCheck,
  Radio
} from 'lucide-react';

interface FeedViewProps {
  posts: Post[];
  comments: Record<string, Comment[]>;
  bookmarkedPostIds: string[];
  onToggleReaction: (postId: string, emoji: string) => void;
  onToggleBookmark: (postId: string) => void;
  onAddComment: (postId: string, content: string, parentId?: string) => void;
  onDeleteComment?: (commentId: string, postId: string) => void;
  onDeletePost?: (postId: string) => void;
  onVotePoll?: (postId: string, optionIndex: number) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  posts,
  comments,
  bookmarkedPostIds,
  onToggleReaction,
  onToggleBookmark,
  onAddComment,
  onDeleteComment,
  onDeletePost,
  onVotePoll,
}) => {
  const { user, accentColor, language, setOpenCreatePost } = useAuth();
  const t = translations[language];
  const theme = THEME_CONFIGS[accentColor];

  const [feedMode, setFeedMode] = useState<'chronological' | 'algorithmic' | 'bookmarks'>('chronological');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [feedSearch, setFeedSearch] = useState('');

  // Filtering & Sorting
  let filteredPosts = [...posts];

  if (feedMode === 'bookmarks') {
    filteredPosts = filteredPosts.filter((p) => bookmarkedPostIds.includes(p.id));
  }

  if (selectedTag) {
    filteredPosts = filteredPosts.filter((p) =>
      p.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase())
    );
  }

  if (feedSearch.trim()) {
    const q = feedSearch.toLowerCase();
    filteredPosts = filteredPosts.filter(
      (p) =>
        p.content.toLowerCase().includes(q) ||
        p.authorName?.toLowerCase().includes(q) ||
        p.authorHandle?.toLowerCase().includes(q) ||
        p.codeSnippet?.code.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (feedMode === 'chronological' || feedMode === 'bookmarks') {
    filteredPosts.sort((a, b) => b.createdAt - a.createdAt);
  } else {
    // Algorithmic: reaction count + comments count
    filteredPosts.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      const scoreA =
        (Object.values(a.reactions || {}) as string[][]).reduce((acc, u) => acc + (u?.length || 0), 0) * 2 +
        (a.commentsCount || 0) * 3;
      const scoreB =
        (Object.values(b.reactions || {}) as string[][]).reduce((acc, u) => acc + (u?.length || 0), 0) * 2 +
        (b.commentsCount || 0) * 3;

      return scoreB - scoreA || b.createdAt - a.createdAt;
    });
  }

  // Extract top trending tags
  const tagCounts: Record<string, number> = {};
  posts.forEach((p) => {
    p.tags?.forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });
  const trendingTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => tag);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Quick Composer Card */}
      {user && (
        <div
          onClick={() => setOpenCreatePost(true)}
          className="bg-[#0C121E] border border-[#1E293B] hover:border-emerald-500/40 rounded-3xl p-3.5 sm:p-4 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <img
              src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.handle}`}
              alt={user.displayName}
              className="w-10 h-10 rounded-full object-cover border border-slate-700 bg-slate-800"
            />
            <div className="flex-1 px-4 py-2.5 rounded-full bg-[#080D18] border border-[#182A40] text-slate-400 text-xs sm:text-sm font-medium group-hover:border-emerald-500/40 transition-colors flex items-center justify-between">
              <span>{language === 'ru' ? 'Что у вас нового? Поделитесь мыслями...' : "What's happening? Share thoughts..."}</span>
              <div className="flex items-center gap-2 text-slate-400">
                <ImageIcon className="w-4 h-4 hover:text-sky-400" />
                <BarChart2 className="w-4 h-4 hover:text-amber-400" />
                <Code2 className="w-4 h-4 hover:text-emerald-400" />
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenCreatePost(true);
              }}
              className="p-2.5 rounded-full bg-[#00DF89] hover:bg-[#00f596] text-[#041912] font-bold shadow-[0_0_15px_rgba(0,223,137,0.3)] transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* Feed Filters & Controls Bar (Capsule Pill Layout) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0C121E] border border-[#182A40] p-2 sm:p-2.5 rounded-3xl">
        {/* Main Feed Mode Pill Tabs */}
        <div className="flex items-center gap-1.5 bg-[#080D18] p-1 rounded-full border border-[#142338]">
          <button
            onClick={() => {
              setFeedMode('chronological');
              setSelectedTag(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              feedMode === 'chronological' && !selectedTag
                ? 'bg-[#04241E] text-white border border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'ru' ? 'Свежее' : 'Latest'}</span>
          </button>

          <button
            onClick={() => {
              setFeedMode('algorithmic');
              setSelectedTag(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              feedMode === 'algorithmic' && !selectedTag
                ? 'bg-[#04241E] text-white border border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'ru' ? 'Популярное' : 'Trending'}</span>
          </button>

          <button
            onClick={() => {
              setFeedMode('bookmarks');
              setSelectedTag(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              feedMode === 'bookmarks'
                ? 'bg-[#04241E] text-white border border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === 'ru' ? 'Закладки' : 'Saved'}</span>
          </button>
        </div>

        {/* Search inside feed */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={feedSearch}
            onChange={(e) => setFeedSearch(e.target.value)}
            placeholder={language === 'ru' ? 'Фильтр ленты...' : 'Filter feed...'}
            className="w-full pl-9 pr-8 py-1.5 text-base sm:text-xs bg-[#080D18] text-white placeholder-slate-500 border border-[#182A40] rounded-full focus:outline-none focus:border-emerald-500 font-mono transition-all"
          />
          {feedSearch && (
            <button
              onClick={() => setFeedSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Trending Topics Tags Carousel (Pills) */}
      {trendingTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            {language === 'ru' ? 'Темы:' : 'Topics:'}
          </span>
          {trendingTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={`px-3.5 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#04241E] text-emerald-300 border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-[#0C121E] text-slate-300 border border-[#182A40] hover:border-emerald-500/40 hover:text-white'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}

      {/* Posts Stream */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-[#0C121E] border border-[#182A40] rounded-3xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
              <Radio className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-white">
              {language === 'ru' ? 'Пока нет публикаций' : 'No posts yet'}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {language === 'ru'
                ? 'Будьте первым, кто опубликует новость, идею или опрос в сообществе Litenote!'
                : 'Be the first to share an update, code snippet, or poll in Litenote!'}
            </p>
            {user && (
              <button
                onClick={() => setOpenCreatePost(true)}
                className="px-5 py-2.5 bg-[#00DF89] hover:bg-[#00f596] text-[#041912] text-xs font-bold rounded-full shadow-[0_0_15px_rgba(0,223,137,0.3)] cursor-pointer active:scale-95 transition-all"
              >
                {language === 'ru' ? '+ Создать первый пост' : '+ Create First Post'}
              </button>
            )}
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              comments={comments[post.id] || []}
              isBookmarked={bookmarkedPostIds.includes(post.id)}
              onToggleReaction={onToggleReaction}
              onToggleBookmark={onToggleBookmark}
              onAddComment={onAddComment}
              onDeleteComment={onDeleteComment}
              onSelectTag={(tag) => setSelectedTag(tag)}
              onDeletePost={onDeletePost}
              onVotePoll={onVotePoll}
            />
          ))
        )}
      </div>
    </div>
  );
};
