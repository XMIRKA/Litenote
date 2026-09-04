import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { translations } from '../../lib/i18n';
import { THEME_CONFIGS } from '../../lib/theme';
import { Comment } from '../../types';
import { CreatorBadge, CoFounderBadge, VerifiedCheck } from '../Common/CreatorBadge';
import { isCreatorAccount, isCoFounderAccount } from '../../lib/creator';
import { getCleanAvatarUrl } from '../../lib/avatar';
import { Send, Reply, CornerDownRight, X, Trash2 } from 'lucide-react';

interface CommentsSectionProps {
  postId: string;
  comments: Comment[];
  onAddComment: (postId: string, content: string, parentId?: string) => void;
  onDeleteComment?: (commentId: string, postId: string) => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  postId,
  comments,
  onAddComment,
  onDeleteComment,
}) => {
  const { user, accentColor, language, setSelectedUserId, setActiveTab } = useAuth();
  const t = translations[language];
  const theme = THEME_CONFIGS[accentColor];

  const [inputVal, setInputVal] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [replyToHandle, setReplyToHandle] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || !user) return;

    onAddComment(postId, inputVal.trim(), replyToCommentId || undefined);
    setInputVal('');
    setReplyToCommentId(null);
    setReplyToHandle(null);
  };

  const handleStartReply = (comment: Comment) => {
    setReplyToCommentId(comment.id);
    setReplyToHandle(comment.authorHandle);
    setInputVal(`@${comment.authorHandle} `);
  };

  const rootComments = comments.filter((c) => !c.parentId);
  const getChildComments = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  const formatTimestamp = (ts: number) => {
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60) return language === 'ru' ? 'только что' : 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} ${language === 'ru' ? 'м' : 'm'}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ${language === 'ru' ? 'ч' : 'h'}`;
    return new Date(ts).toLocaleDateString();
  };

  const canDeleteComment = (comment: Comment) => {
    if (!user) return false;
    if (user.uid === comment.authorId) return true;
    if (isCreatorAccount(user)) return true;
    return false;
  };

  return (
    <div className="pt-2 space-y-3">
      {/* Input box */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-1.5">
          {replyToHandle && (
            <div className="flex items-center justify-between text-xs bg-indigo-950/40 text-indigo-300 px-3 py-1 rounded-xl border border-indigo-500/30">
              <span className="flex items-center gap-1.5">
                <CornerDownRight className="w-3 h-3" />
                {language === 'ru' ? `Ответ @${replyToHandle}` : `Replying to @${replyToHandle}`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setReplyToCommentId(null);
                  setReplyToHandle(null);
                  setInputVal('');
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <img
              src={getCleanAvatarUrl(user.handle || user.displayName, user.avatarUrl)}
              alt={user.displayName}
              className="w-7 h-7 rounded-lg object-cover border border-white/10 bg-slate-800"
            />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={language === 'ru' ? 'Написать комментарий...' : 'Write a comment...'}
              className="flex-1 px-3 py-1.5 text-xs bg-[#07090E] text-slate-100 placeholder:text-slate-500 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="p-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      ) : (
        <p className="text-xs text-slate-500 text-center py-1">
          {language === 'ru' ? 'Войдите, чтобы оставить комментарий' : 'Sign in to join the conversation.'}
        </p>
      )}

      {/* Comments List */}
      <div className="space-y-2.5 pt-1">
        {rootComments.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center py-2">
            {language === 'ru' ? 'Пока нет комментариев. Будьте первыми!' : 'No comments yet. Be the first!'}
          </p>
        ) : (
          rootComments.map((comment) => {
            const childComments = getChildComments(comment.id);
            const isSelf = user?.uid === comment.authorId;
            const authorDisplayName = isSelf ? (user.displayName || comment.authorName) : comment.authorName;
            const authorHandle = isSelf ? (user.handle || comment.authorHandle) : comment.authorHandle;
            const authorAvatar = isSelf ? (user.avatarUrl || comment.authorAvatar) : comment.authorAvatar;

            const isCommentCreator = isCreatorAccount({
              handle: authorHandle,
              uid: comment.authorId,
              displayName: authorDisplayName,
            });
            const isCommentCoFounder = isCoFounderAccount({
              handle: authorHandle,
              uid: comment.authorId,
              displayName: authorDisplayName,
            });

            return (
              <div key={comment.id} className="space-y-2">
                <div
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${
                    isCommentCreator
                      ? 'bg-[#0E1528] border-amber-500/30'
                      : isCommentCoFounder
                      ? 'bg-[#0B1525] border-cyan-500/30'
                      : 'bg-[#090D17] border-[#182236]'
                  }`}
                >
                  <img
                    src={getCleanAvatarUrl(authorHandle || authorDisplayName, authorAvatar)}
                    alt={authorDisplayName}
                    onClick={() => {
                      setSelectedUserId(comment.authorId);
                      setActiveTab('profile');
                    }}
                    className={`w-7 h-7 rounded-lg object-cover bg-slate-800 cursor-pointer ${
                      isCommentCreator
                        ? 'border border-amber-400'
                        : isCommentCoFounder
                        ? 'border border-cyan-400'
                        : 'border border-white/10'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          onClick={() => {
                            setSelectedUserId(comment.authorId);
                            setActiveTab('profile');
                          }}
                          className="font-semibold text-xs text-white cursor-pointer hover:underline"
                        >
                          {authorDisplayName}
                        </span>
                        <VerifiedCheck user={{ handle: authorHandle, uid: comment.authorId, displayName: authorDisplayName }} />
                        {isCommentCreator && (
                          <CreatorBadge user={{ handle: authorHandle, uid: comment.authorId }} size="sm" showLabel />
                        )}
                        {isCommentCoFounder && (
                          <CoFounderBadge user={{ handle: authorHandle, uid: comment.authorId }} size="sm" showLabel />
                        )}
                        <span className="text-[10px] text-slate-500">
                          @{authorHandle}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-500">
                          {formatTimestamp(comment.createdAt)}
                        </span>
                        {canDeleteComment(comment) && onDeleteComment && (
                          <button
                            onClick={() => onDeleteComment(comment.id, postId)}
                            className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                            title={language === 'ru' ? 'Удалить комментарий' : 'Delete comment'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 mt-1 leading-relaxed whitespace-pre-line">
                      {comment.content}
                    </p>

                    <button
                      onClick={() => handleStartReply(comment)}
                      className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      <Reply className="w-3 h-3" />
                      <span>{language === 'ru' ? 'Ответить' : 'Reply'}</span>
                    </button>
                  </div>
                </div>

                {/* Child Replies */}
                {childComments.map((child) => {
                  const isChildSelf = user?.uid === child.authorId;
                  const childDisplayName = isChildSelf ? (user.displayName || child.authorName) : child.authorName;
                  const childHandle = isChildSelf ? (user.handle || child.authorHandle) : child.authorHandle;
                  const childAvatar = isChildSelf ? (user.avatarUrl || child.authorAvatar) : child.authorAvatar;

                  const isChildCreator = isCreatorAccount({
                    handle: childHandle,
                    uid: child.authorId,
                    displayName: childDisplayName,
                  });
                  const isChildCoFounder = isCoFounderAccount({
                    handle: childHandle,
                    uid: child.authorId,
                    displayName: childDisplayName,
                  });

                  return (
                    <div
                      key={child.id}
                      className={`ml-6 flex items-start gap-2.5 p-2 rounded-xl border ${
                        isChildCreator
                          ? 'bg-[#0E1528] border-amber-500/30'
                          : isChildCoFounder
                          ? 'bg-[#0B1525] border-cyan-500/30'
                          : 'bg-[#070B14] border-[#141C2C]'
                      }`}
                    >
                      <img
                        src={getCleanAvatarUrl(childHandle || childDisplayName, childAvatar)}
                        alt={childDisplayName}
                        onClick={() => {
                          setSelectedUserId(child.authorId);
                          setActiveTab('profile');
                        }}
                        className={`w-6 h-6 rounded-lg object-cover bg-slate-800 cursor-pointer ${
                          isChildCreator
                            ? 'border border-amber-400'
                            : isChildCoFounder
                            ? 'border border-cyan-400'
                            : 'border border-white/10'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              onClick={() => {
                                setSelectedUserId(child.authorId);
                                setActiveTab('profile');
                              }}
                              className="font-semibold text-xs text-white cursor-pointer hover:underline"
                            >
                              {childDisplayName}
                            </span>
                            <VerifiedCheck user={{ handle: childHandle, uid: child.authorId, displayName: childDisplayName }} />
                            {isChildCreator && (
                              <CreatorBadge user={{ handle: childHandle, uid: child.authorId }} size="sm" showLabel />
                            )}
                            {isChildCoFounder && (
                              <CoFounderBadge user={{ handle: childHandle, uid: child.authorId }} size="sm" showLabel />
                            )}
                            <span className="text-[10px] text-slate-500">
                              @{childHandle}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-slate-500">
                              {formatTimestamp(child.createdAt)}
                            </span>
                            {canDeleteComment(child) && onDeleteComment && (
                              <button
                                onClick={() => onDeleteComment(child.id, postId)}
                                className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                                title={language === 'ru' ? 'Удалить комментарий' : 'Delete comment'}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-200 mt-1 leading-relaxed whitespace-pre-line">
                          {child.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
