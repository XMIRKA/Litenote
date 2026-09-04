import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AIChat5 } from '../ui/ai-chat-5';

export const MatrixTerminalAI: React.FC = () => {
  const { user, accentColor, language, setOpenCreatePost } = useAuth();

  const handlePublishToFeed = (postText: string) => {
    // Copy to clipboard for user convenience and trigger create post modal
    navigator.clipboard.writeText(postText);
    setOpenCreatePost(true);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-2 px-1 sm:px-2">
      <AIChat5
        userName={user?.displayName || 'Developer'}
        userAvatar={user?.avatarUrl}
        language={language}
        accentColor={accentColor}
        onPublishToFeed={handlePublishToFeed}
      />
    </div>
  );
};

export default MatrixTerminalAI;
