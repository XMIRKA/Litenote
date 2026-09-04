import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { translations } from '../../lib/i18n';
import { THEME_CONFIGS } from '../../lib/theme';
import { Conversation, Message, UserProfile } from '../../types';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { NewChatModal } from './NewChatModal';
import { MessageSquare, Plus, Sparkles } from 'lucide-react';

interface MessengerViewProps {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  selectedConvId: string | null;
  allUsers: UserProfile[];
  onSelectConversation: (convId: string) => void;
  onSendMessage: (convId: string, text: string, replyTo?: Message['replyTo']) => void;
  onSendVoiceNote: (convId: string, audioUrl: string, duration: number, waveform: number[]) => void;
  onSendMedia: (
    convId: string,
    payload: {
      mediaUrl: string;
      mediaType: 'image' | 'video';
      caption: string;
      fileName: string;
      fileSize: string;
      duration?: number;
      posterUrl?: string;
    }
  ) => Promise<void> | void;
  onSendFile: (convId: string, fileName: string, fileUrl: string, fileSize: string) => void;
  onSendCallLog?: (convId: string, callType: 'voice' | 'video', durationSeconds: number) => void;
  onAddReaction: (convId: string, messageId: string, emoji: string) => void;
  onPinMessage?: (convId: string, message: Message | null) => void;
  onDeleteMessage?: (convId: string, messageId: string) => void;
  onDeleteForMe?: (convId: string, messageId: string) => void;
  onDeleteForEveryone?: (convId: string, messageId: string) => void;
  onClearChat?: (convId: string) => Promise<void>;
  onDeleteChat?: (convId: string) => Promise<void>;
  onUpdateGroupInfo?: (convId: string, updates: any) => Promise<void>;
  onAddMembers?: (convId: string, newMembers: UserProfile[]) => Promise<void>;
  onRemoveMember?: (convId: string, memberUid: string) => Promise<void>;
  onToggleAdmin?: (convId: string, memberUid: string, isAdmin: boolean) => Promise<void>;
  onStartDirectChat: (targetUser: UserProfile) => void;
  onCreateGroup?: (
    name: string,
    members: UserProfile[],
    description?: string,
    avatarUrl?: string,
    type?: 'group' | 'channel'
  ) => void;
  onStartCall?: (recipient: UserProfile, callType: 'voice' | 'video', convId: string) => void;
}

export const MessengerView: React.FC<MessengerViewProps> = ({
  conversations,
  messages,
  selectedConvId,
  allUsers,
  onSelectConversation,
  onSendMessage,
  onSendVoiceNote,
  onSendMedia,
  onSendFile,
  onSendCallLog,
  onAddReaction,
  onPinMessage,
  onDeleteMessage,
  onDeleteForMe,
  onDeleteForEveryone,
  onClearChat,
  onDeleteChat,
  onUpdateGroupInfo,
  onAddMembers,
  onRemoveMember,
  onToggleAdmin,
  onStartDirectChat,
  onCreateGroup,
  onStartCall,
}) => {
  const { user, accentColor, language } = useAuth();
  const t = translations[language];
  const theme = THEME_CONFIGS[accentColor];

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  // Fallback AI Bot conversation if no conversations exist yet
  const defaultAiConv: Conversation = {
    id: user ? `conv_ai_${user.uid}` : 'conv_ai_default',
    type: 'ai_bot',
    name: 'AI Ассистент (Gemini)',
    participants: [user?.uid || 'guest', 'ai_assistant_node'],
    participantDetails: {
      ai_assistant_node: {
        displayName: 'AI Ассистент (Gemini)',
        handle: 'gemini_flash',
        avatarUrl: '',
        status: 'online',
      },
    },
    updatedAt: Date.now(),
    unreadCount: {},
  };

  const displayConversations =
    conversations.length > 0 ? conversations : [defaultAiConv];

  // Pick active conversation
  const activeConversation =
    displayConversations.find((c) => c.id === selectedConvId) ||
    displayConversations[0];

  const activeMessages = activeConversation
    ? messages[activeConversation.id] || []
    : [];

  return (
    <div className="flex-1 flex h-full min-h-0 w-full overflow-hidden bg-[#07090E]">
      {/* Sidebar List (Hidden on mobile if a conversation is selected) */}
      <div
        className={`h-full border-r border-[#192236] ${
          selectedConvId ? 'hidden md:flex md:w-80 shrink-0' : 'flex w-full md:w-80 shrink-0'
        }`}
      >
        <ConversationList
          conversations={displayConversations}
          selectedConvId={selectedConvId || activeConversation?.id || null}
          allUsers={allUsers}
          onSelectConversation={(id) => onSelectConversation(id)}
          onNewChatClick={() => setIsNewChatOpen(true)}
        />
      </div>

      {/* Active Conversation Chat Window */}
      <div
        className={`flex-1 h-full flex flex-col min-w-0 ${
          !selectedConvId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            messages={activeMessages}
            allUsers={allUsers}
            onSendMessage={(text, replyTo) => onSendMessage(activeConversation.id, text, replyTo)}
            onSendVoiceNote={(audioUrl, duration, waveform) =>
              onSendVoiceNote(activeConversation.id, audioUrl, duration, waveform)
            }
            onSendMedia={(payload) => onSendMedia(activeConversation.id, payload)}
            onSendFile={(fileName, fileUrl, fileSize) =>
              onSendFile(activeConversation.id, fileName, fileUrl, fileSize)
            }
            onSendCallLog={
              onSendCallLog
                ? (callType, duration) => onSendCallLog(activeConversation.id, callType, duration)
                : undefined
            }
            onAddReaction={(messageId, emoji) =>
              onAddReaction(activeConversation.id, messageId, emoji)
            }
            onPinMessage={
              onPinMessage
                ? (msg) => onPinMessage(activeConversation.id, msg)
                : undefined
            }
            onDeleteMessage={
              onDeleteMessage
                ? (msgId) => onDeleteMessage(activeConversation.id, msgId)
                : undefined
            }
            onDeleteForMe={
              onDeleteForMe
                ? (msgId) => onDeleteForMe(activeConversation.id, msgId)
                : undefined
            }
            onDeleteForEveryone={
              onDeleteForEveryone
                ? (msgId) => onDeleteForEveryone(activeConversation.id, msgId)
                : undefined
            }
            onClearChat={
              onClearChat
                ? () => onClearChat(activeConversation.id)
                : undefined
            }
            onDeleteChat={
              onDeleteChat
                ? () => onDeleteChat(activeConversation.id)
                : undefined
            }
            onUpdateGroupInfo={
              onUpdateGroupInfo
                ? (updates) => onUpdateGroupInfo(activeConversation.id, updates)
                : undefined
            }
            onAddMembers={
              onAddMembers
                ? (newMembers) => onAddMembers(activeConversation.id, newMembers)
                : undefined
            }
            onRemoveMember={
              onRemoveMember
                ? (memberUid) => onRemoveMember(activeConversation.id, memberUid)
                : undefined
            }
            onToggleAdmin={
              onToggleAdmin
                ? (memberUid, isAdmin) => onToggleAdmin(activeConversation.id, memberUid, isAdmin)
                : undefined
            }
            onStartCall={
              onStartCall
                ? (recipient, callType) => onStartCall(recipient, callType, activeConversation.id)
                : undefined
            }
            onBackMobile={() => onSelectConversation('')}
          />
        ) : (
          <div className="flex-1 h-full flex items-center justify-center bg-[#07090E] p-6 text-center text-slate-500">
            <div className="space-y-4 max-w-sm">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div>
                <p className="text-white font-bold text-base">
                  {language === 'ru' ? 'Выберите диалог' : 'Select a conversation'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'ru'
                    ? 'Нажмите на любой чат слева или начните новый разговор'
                    : 'Choose a conversation or start a new chat'}
                </p>
              </div>
              <button
                onClick={() => setIsNewChatOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-md inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'ru' ? 'Начать новый чат' : 'New chat'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {isNewChatOpen && (
        <NewChatModal
          isOpen={isNewChatOpen}
          onClose={() => setIsNewChatOpen(false)}
          allUsers={allUsers}
          onSelectUser={(u) => {
            onStartDirectChat(u);
            setIsNewChatOpen(false);
          }}
          onCreateGroup={onCreateGroup}
          onStartAiChat={() => {
            if (user) {
              onSelectConversation(`conv_ai_${user.uid}`);
            }
            setIsNewChatOpen(false);
          }}
        />
      )}
    </div>
  );
};
