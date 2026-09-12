import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AIChat5 } from '../ui/ai-chat-5';

const getStableGuestId = (): string => {
  try {
    const key = 'litenote_guest_ai_user_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = 'guest_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return 'guest_user';
  }
};

export const MatrixTerminalAI: React.FC = () => {
  const { user, accentColor, language, setOpenCreatePost } = useAuth();
  const effectiveUserId = user?.uid || getStableGuestId();

  const handlePublishToFeed = (postText: string) => {
    // Copy to clipboard for user convenience and trigger create post modal
    navigator.clipboard.writeText(postText);
    setOpenCreatePost(true);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-2 px-1 sm:px-2">
      <AIChat5
        userId={effectiveUserId}
        userName={user?.displayName || (language === 'ru' ? 'Пользователь' : 'Developer')}
        userAvatar={user?.avatarUrl}
        language={language}
        accentColor={accentColor}
        onPublishToFeed={handlePublishToFeed}
      />
    </div>
  );
};

export default MatrixTerminalAI;
