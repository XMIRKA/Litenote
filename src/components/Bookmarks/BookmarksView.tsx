import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { translations } from '../../lib/i18n';
import { THEME_CONFIGS } from '../../lib/theme';
import { Post, Comment } from '../../types';
import { PostCard } from '../Feed/PostCard';
import {
  Bookmark,
  Search,
  ArrowRight
} from 'lucide-react';

interface BookmarksViewProps {
  posts: Post[];
  comments: Record<string, Comment[]>;
  bookmarkedPostIds: string[];
  onToggleReaction: (postId: string, emoji: string) => void;
  onToggleBookmark: (postId: string) => void;
  onAddComment: (postId: string, content: string, parentId?: string) => void;
  onVotePoll?: (postId: string, optionIndex: number) => void;
  onDeletePost?: (postId: string) => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  posts,
  comments,
  bookmarkedPostIds,
  onToggleReaction,
  onToggleBookmark,
  onAddComment,
  onVotePoll,
  onDeletePost,
}) => {
  const { accentColor, language, setActiveTab } = useAuth();
  const t = translations[language];
  const theme = THEME_CONFIGS[accentColor];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Filter bookmarked posts
  const bookmarkedPosts = posts.filter((p) => bookmarkedPostIds.includes(p.id));

  let filteredPosts = bookmarkedPosts.filter((p) => {
    if (selectedTag && !p.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.content.toLowerCase().includes(q) ||
        p.authorName?.toLowerCase().includes(q) ||
        p.authorHandle?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-[#0C121E] border border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Bookmark className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white">
              {language === 'ru' ? 'Сохранённые закладки' : 'Saved Bookmarks'}
            </h1>
            <p className="text-xs text-slate-400">
              {language === 'ru'
                ? `Всего сохранено записей: ${bookmarkedPosts.length}`
                : `Total saved items: ${bookmarkedPosts.length}`}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ru' ? 'Поиск в закладках...' : 'Filter saved posts...'}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#090E17] text-white placeholder:text-slate-500 border border-[#1E293B] rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Bookmarked Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0C121E] border border-[#1E293B] space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
            <Bookmark className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-sm font-bold text-white">
              {language === 'ru' ? 'Закладок пока нет' : 'No Bookmarks Found'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'ru'
                ? 'Нажмите на значок закладки под любым постом в ленте, чтобы сохранить его.'
                : 'Click the bookmark icon under any post in the feed to save it.'}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('feed')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-md shadow-indigo-600/25 active:scale-95"
          >
            <span>{language === 'ru' ? 'Перейти в ленту' : 'Explore Feed'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              comments={comments[post.id] || []}
              isBookmarked={true}
              onToggleReaction={onToggleReaction}
              onToggleBookmark={onToggleBookmark}
              onAddComment={onAddComment}
              onVotePoll={onVotePoll}
              onDeletePost={onDeletePost}
            />
          ))}
        </div>
      )}
    </div>
  );
};
