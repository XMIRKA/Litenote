import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { FeedView } from './components/Feed/FeedView';
import { CreatePostModal } from './components/Feed/CreatePostModal';
import { MessengerView } from './components/Messenger/MessengerView';
import { ProfileView } from './components/Profile/ProfileView';
import { PeopleDirectory, PATRICK_JANE_USER } from './components/Social/PeopleDirectory';
import { MatrixTerminalAI } from './components/TerminalAI/MatrixTerminalAI';
import { SettingsView } from './components/Settings/SettingsView';
import { BookmarksView } from './components/Bookmarks/BookmarksView';
import { AnalyticsDashboard } from './components/Analytics/AnalyticsDashboard';
import { NotificationsDrawer } from './components/Notifications/NotificationsDrawer';
import { AuthModal } from './components/Auth/AuthModal';
import { AuthLandingView } from './components/Auth/AuthLandingView';
import { AppEntrySplash } from './components/Common/AppEntrySplash';
import { BanScreen } from './components/Auth/BanScreen';
import { DevToolsModal } from './components/DevTools/DevToolsModal';
import { NotificationToastContainer } from './components/Notifications/NotificationToastContainer';
import { IncomingCallModal } from './components/Messenger/IncomingCallModal';
import { CallModal } from './components/Messenger/CallModal';
import { requestNotificationPermission, pushLiveNotification, initNotificationService } from './lib/notificationService';
import { AnimatePresence } from 'motion/react';

import {
  Post,
  Comment,
  Conversation,
  Message,
  Friendship,
  Follow,
  NotificationItem,
  UserProfile,
  CallSession
} from './types';

import {
  subscribePosts,
  subscribeUsers,
  subscribeConversations,
  subscribeMessages,
  subscribeFriendships,
  subscribeFollows,
  subscribeNotifications,
  subscribeBookmarks,
  subscribeIncomingCalls,
  updateCallDoc,
  createPostDoc,
  createNotificationDoc,
  togglePostReaction,
  deletePostDoc,
  createCommentDoc,
  sendMessageDoc,
  markConversationMessagesReadDoc,
  startDirectConversationDoc,
  createGroupConversationDoc,
  sendFriendRequestDoc,
  updateFriendshipStatusDoc,
  toggleFollowDoc,
  toggleBookmarkDoc,
  markAllNotificationsReadDoc,
  toggleMessageReactionDoc,
  pinMessageDoc,
  deleteMessageDoc,
  deleteMessageForMeDoc,
  deleteMessageForEveryoneDoc,
  clearConversationMessagesDoc,
  deleteConversationDoc,
  updateGroupInfoDoc,
  addGroupMembersDoc,
  removeGroupMemberDoc,
  toggleGroupAdminDoc,
  votePollDoc
} from './lib/firebase';

import { Terminal, Loader2 } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    user,
    isLoading,
    activeTab,
    setActiveTab,
    selectedUserId,
    setSelectedUserId,
    selectedConvId,
    setSelectedConvId,
    openCreatePost,
    setOpenCreatePost,
    isAuthModalOpen,
    setIsAuthModalOpen,
    language,
  } = useAuth();

  // Application Data States (Clean & synced via Firestore)
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<string[]>([]);

  // WebRTC Real-Time Calling State
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [activeCallSession, setActiveCallSession] = useState<{
    session: CallSession;
    isCaller: boolean;
    recipient: UserProfile | { uid: string; displayName: string; handle: string; avatarUrl?: string } | null;
  } | null>(null);

  // Modals, Drawers & Entry Animation
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const prevNotifIdsRef = React.useRef<Set<string>>(new Set());
  const isInitialNotifLoadRef = React.useRef<boolean>(true);

  // Request browser notification permission once user interacts/logs in
  useEffect(() => {
    if (user) {
      requestNotificationPermission().catch(() => {});
    }
  }, [user]);

  const handleShareDevSnippet = async (codeSnippet: {
    title: string;
    language: string;
    code: string;
    output: string;
  }) => {
    if (!user) return;
    try {
      await createPostDoc({
        id: crypto.randomUUID(),
        authorId: user.uid,
        authorName: user.displayName,
        authorHandle: user.handle,
        authorAvatar: user.avatarUrl,
        authorEmail: user.email,
        content: `⚡ **${codeSnippet.title}**\n\nПротестировано и опубликовано из LiteNote DevHub! 🚀\nЗапустите или скопируйте реализацию прямо здесь 👇`,
        codeSnippet: {
          title: codeSnippet.title,
          language: codeSnippet.language,
          code: codeSnippet.code,
          output: codeSnippet.output,
        },
        tags: ['devhub', codeSnippet.language, 'algorithm', 'performance'],
        createdAt: Date.now(),
        reactions: {},
        commentsCount: 0,
      });
      setIsDevToolsOpen(false);
    } catch (err) {
      console.error('Error sharing snippet:', err);
    }
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Initialize browser notification service & service worker
  useEffect(() => {
    initNotificationService();
  }, []);

  // 1. Subscribe to Global Posts
  useEffect(() => {
    const unsub = subscribePosts((fetchedPosts) => {
      setPosts(fetchedPosts);
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to Registered Users
  useEffect(() => {
    const unsub = subscribeUsers((fetchedUsers) => {
      setAllUsers(fetchedUsers);
    });
    return () => unsub();
  }, []);

  // 3. User-Specific Real-Time Subscriptions
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setFriendships([]);
      setFollows([]);
      setNotifications([]);
      setBookmarkedPostIds([]);
      return;
    }

    const unsubConvs = subscribeConversations(user.uid, (convs) => {
      setConversations(convs);
    });

    const unsubFriends = subscribeFriendships(user.uid, (friends) => {
      setFriendships(friends);
    });

    const unsubFollows = subscribeFollows(user.uid, (flws) => {
      setFollows(flws);
    });

    const unsubNotifs = subscribeNotifications(user.uid, (notifs) => {
      setNotifications(notifs);

      // Trigger instant toast and desktop notification on newly arrived unread notifications
      if (isInitialNotifLoadRef.current) {
        prevNotifIdsRef.current = new Set(notifs.map((n) => n.id));
        isInitialNotifLoadRef.current = false;
        return;
      }

      notifs.forEach((item) => {
        if (!prevNotifIdsRef.current.has(item.id) && !item.isRead && !item.read) {
          prevNotifIdsRef.current.add(item.id);
          pushLiveNotification({
            title: item.title || 'Новое уведомление в LiteNote',
            message: item.message,
            type: item.type as any,
            avatarUrl: item.actorAvatar,
            onClick: () => {
              if (item.type === 'message') {
                setActiveTab('messenger');
              } else if (item.postId) {
                setActiveTab('feed');
              } else if (item.type === 'friend_request' || item.type === 'friend_accepted') {
                setActiveTab('people');
              } else {
                setIsNotificationsOpen(true);
              }
            },
          });
        }
      });
      notifs.forEach((n) => prevNotifIdsRef.current.add(n.id));
    });

    const unsubBookmarks = subscribeBookmarks(user.uid, (bms) => {
      setBookmarkedPostIds(bms.map((b) => b.postId));
    });

    return () => {
      unsubConvs();
      unsubFriends();
      unsubFollows();
      unsubNotifs();
      unsubBookmarks();
    };
  }, [user]);

  // 4. Subscribe to Messages for Selected Conversation & Mark as Read
  useEffect(() => {
    if (!selectedConvId) return;

    const unsub = subscribeMessages(selectedConvId, (msgs) => {
      setMessages((prev) => ({
        ...prev,
        [selectedConvId]: msgs,
      }));

      // Automatically sync read status for messages sent by others
      if (user?.uid) {
        const unreadIds = msgs
          .filter(
            (m) =>
              m.senderId !== user.uid &&
              (!m.read || m.status !== 'read' || !(m.readBy || []).includes(user.uid))
          )
          .map((m) => m.id);

        if (unreadIds.length > 0) {
          markConversationMessagesReadDoc(selectedConvId, user.uid, unreadIds).catch(() => {});
        }
      }
    });

    return () => unsub();
  }, [selectedConvId, user?.uid]);

  // 5. Subscribe to Incoming WebRTC Calls with Desktop Notification
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeIncomingCalls(user.uid, (ringingCalls) => {
      if (ringingCalls.length > 0 && !activeCallSession) {
        const call = ringingCalls[0];
        setIncomingCall(call);

        // Push desktop / background notification for call
        pushLiveNotification({
          title: `Входящий ${call.callType === 'video' ? 'видеозвонок' : 'аудиозвонок'}!`,
          message: `${call.callerName} (@${call.callerHandle}) звонит вам в LiteNote...`,
          avatarUrl: call.callerAvatar,
          type: 'call',
        });
      } else if (ringingCalls.length === 0) {
        setIncomingCall(null);
      }
    });
    return () => unsub();
  }, [user?.uid, activeCallSession]);

  // Actions
  const handleCreatePost = async (postData: Partial<Post>) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const newPost: Post = {
        id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        authorId: user.uid,
        authorName: user.displayName,
        authorHandle: user.handle,
        authorAvatar: user.avatarUrl,
        authorBadges: user.badges || ['cyber_pioneer'],
        content: postData.content || '',
        codeSnippet: postData.codeSnippet,
        mediaUrl: postData.mediaUrl,
        mediaType: postData.mediaType,
        poll: postData.poll,
        tags: postData.tags || [],
        reactions: { '🔥': [user.uid] },
        commentsCount: 0,
        createdAt: Date.now(),
        bookmarksCount: 0,
      };
      await createPostDoc(newPost);
    } catch (err) {
      console.error('Error creating post:', err);
    }
  };

  const handleToggleReaction = async (postId: string, emoji: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      await togglePostReaction(postId, emoji, user.uid);
      const post = posts.find((p) => p.id === postId);
      if (post && post.authorId !== user.uid) {
        createNotificationDoc({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: post.authorId,
          type: 'reaction',
          actorId: user.uid,
          actorName: user.displayName,
          actorAvatar: user.avatarUrl,
          title: `@${user.handle} оценил(а) ваш пост`,
          message: `${emoji} реакция на публикацию`,
          postId,
          createdAt: Date.now(),
          isRead: false,
          read: false,
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Error toggling reaction:', err);
    }
  };

  const handleToggleBookmark = async (postId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const isCurrentlyBookmarked = bookmarkedPostIds.includes(postId);
      await toggleBookmarkDoc(user.uid, postId, isCurrentlyBookmarked);
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const handleAddComment = async (postId: string, content: string, parentId?: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const newComment: Comment = {
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

    // Optimistic comments and post commentsCount update
    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment],
    }));

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
          : p
      )
    );

    try {
      await createCommentDoc(newComment);

      const post = posts.find((p) => p.id === postId);
      if (post && post.authorId !== user.uid) {
        createNotificationDoc({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: post.authorId,
          type: 'comment',
          actorId: user.uid,
          actorName: user.displayName,
          actorAvatar: user.avatarUrl,
          title: `@${user.handle} прокомментировал(а) ваш пост`,
          message: content.substring(0, 75),
          postId,
          createdAt: Date.now(),
          isRead: false,
          read: false,
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    try {
      await deletePostDoc(postId, user.uid);
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const handleVotePoll = async (postId: string, optionIndex: number) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      await votePollDoc(postId, optionIndex, user.uid);
    } catch (err) {
      console.error('Error voting on poll:', err);
    }
  };

  const handleSendMessage = async (convId: string, text: string, replyTo?: Message['replyTo']) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      conversationId: convId,
      convId: convId,
      senderId: user.uid,
      senderName: user.displayName,
      senderHandle: user.handle,
      senderAvatar: user.avatarUrl,
      text,
      replyTo,
      type: 'text',
      createdAt: Date.now(),
      status: 'sent',
    };

    // Instant zero-lag optimistic state update
    setMessages((prev) => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMsg],
    }));

    try {
      await sendMessageDoc(convId, newMsg);

      // Create notification for recipient in direct chat
      if (!convId.startsWith('conv_ai_')) {
        const targetConv = conversations.find((c) => c.id === convId);
        const targetUserId =
          targetConv?.participants?.find((id) => id !== user.uid) ||
          convId.replace('conv_', '').replace(user.uid, '').replace('_', '');

        if (targetUserId && targetUserId !== user.uid) {
          createNotificationDoc({
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            userId: targetUserId,
            type: 'message',
            actorId: user.uid,
            actorName: user.displayName,
            actorAvatar: user.avatarUrl,
            title: `Сообщение от @${user.handle}`,
            message: text.substring(0, 80),
            createdAt: Date.now(),
            isRead: false,
            read: false,
          }).catch(() => {});
        }
      }

      // If this is an AI chat, trigger Gemini response
      if (convId.startsWith('conv_ai_')) {
        try {
          const aiResponse = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                ...((messages[convId] || []).map((m) => ({
                  role: m.senderId === user.uid ? 'user' : 'model',
                  text: m.text || '',
                }))),
                { role: 'user', text },
              ],
            }),
          });
          const aiData = await aiResponse.json();
          const aiMsg: Message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            conversationId: convId,
            convId: convId,
            senderId: 'ai_assistant_node',
            senderName: 'AI Ассистент (Gemini)',
            senderHandle: 'gemini_flash',
            senderAvatar: '',
            text: aiData.text || 'Ответ сформирован.',
            type: 'text',
            createdAt: Date.now(),
            status: 'sent',
          };
          setMessages((prev) => ({
            ...prev,
            [convId]: [...(prev[convId] || []), aiMsg],
          }));
          await sendMessageDoc(convId, aiMsg);
        } catch (aiErr) {
          console.error('Error receiving AI response:', aiErr);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleSendCallLog = async (
    convId: string,
    callType: 'voice' | 'video',
    durationSeconds: number,
    status?: 'completed' | 'missed' | 'declined'
  ) => {
    if (!user) return;
    const callStatus = status || (durationSeconds > 0 ? 'completed' : 'missed');
    const statusText =
      callStatus === 'declined'
        ? language === 'ru' ? 'Отклонен' : 'Declined'
        : callStatus === 'missed'
        ? language === 'ru' ? 'Пропущен' : 'Missed'
        : `${durationSeconds}s`;

    const newMsg: Message = {
      id: `msg_call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      conversationId: convId,
      convId: convId,
      senderId: user.uid,
      senderName: user.displayName,
      senderHandle: user.handle,
      senderAvatar: user.avatarUrl,
      text:
        callType === 'video'
          ? `📹 Видеозвонок • ${statusText}`
          : `📞 Аудиозвонок • ${statusText}`,
      type: 'call',
      mediaDuration: durationSeconds,
      callInfo: {
        callType,
        durationSeconds,
        status: callStatus,
        endedAt: Date.now(),
      },
      createdAt: Date.now(),
      status: 'sent',
    };

    setMessages((prev) => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMsg],
    }));

    try {
      await sendMessageDoc(convId, newMsg);
    } catch (err) {
      console.error('Error recording call log:', err);
    }
  };

  const handleInitiateCall = (
    recipient: UserProfile,
    callType: 'voice' | 'video',
    convId: string
  ) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const currentConv = conversations.find((c) => c.id === convId);
    const isGroup =
      currentConv?.type === 'group' ||
      currentConv?.type === 'channel' ||
      (currentConv?.participants && currentConv.participants.length > 2);

    const groupParticipants = currentConv?.participants && currentConv.participants.length > 0
      ? currentConv.participants
      : recipient.uid
      ? [user.uid, recipient.uid]
      : [user.uid];

    const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newCall: CallSession = {
      id: callId,
      conversationId: convId,
      callerId: user.uid,
      callerName: user.displayName,
      callerHandle: user.handle,
      callerAvatar: user.avatarUrl,
      calleeId: recipient.uid,
      calleeName: isGroup ? (currentConv?.name || 'Групповой звонок') : recipient.displayName,
      calleeHandle: isGroup ? 'group' : recipient.handle,
      calleeAvatar: isGroup ? currentConv?.avatarUrl : recipient.avatarUrl,
      callType,
      status: 'ringing',
      startedAt: Date.now(),
      participants: groupParticipants,
      isGroup: !!isGroup,
      groupName: isGroup ? currentConv?.name : undefined,
      groupAvatar: isGroup ? currentConv?.avatarUrl : undefined,
    };

    setActiveCallSession({
      session: newCall,
      isCaller: true,
      recipient: isGroup
        ? {
            uid: `group_${convId}`,
            displayName: currentConv?.name || 'Групповой звонок',
            handle: 'group',
            avatarUrl: currentConv?.avatarUrl || '',
          }
        : recipient,
    });
  };

  const handleAcceptIncomingCall = (call: CallSession) => {
    setIncomingCall(null);
    const isGroup = call.isGroup || (call.participants && call.participants.length > 2);
    setActiveCallSession({
      session: call,
      isCaller: false,
      recipient: isGroup
        ? {
            uid: `group_${call.conversationId}`,
            displayName: call.groupName || call.calleeName || 'Групповой звонок',
            handle: 'group',
            avatarUrl: call.groupAvatar || call.calleeAvatar,
          }
        : {
            uid: call.callerId,
            displayName: call.callerName,
            handle: call.callerHandle,
            avatarUrl: call.callerAvatar,
          },
    });
  };

  const handleDeclineIncomingCall = async (call: CallSession) => {
    setIncomingCall(null);
    await updateCallDoc(call.id, {
      status: 'declined',
      endedAt: Date.now(),
    }).catch(() => {});
    if (call.conversationId) {
      handleSendCallLog(call.conversationId, call.callType, 0, 'declined');
    }
  };

  const handleActiveCallClosed = (
    durationSeconds: number,
    callType: 'voice' | 'video',
    status?: 'completed' | 'missed' | 'declined'
  ) => {
    if (activeCallSession && activeCallSession.session.conversationId) {
      handleSendCallLog(
        activeCallSession.session.conversationId,
        callType,
        durationSeconds,
        status
      );
    }
    setActiveCallSession(null);
  };

  const handlePinMessage = async (convId: string, message: Message | null) => {
    try {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                pinnedMessageId: message ? message.id : undefined,
                pinnedMessage: message || undefined,
              }
            : c
        )
      );
      await pinMessageDoc(convId, message);
    } catch (err) {
      console.error('Error pinning message:', err);
    }
  };

  const handleDeleteMessage = async (convId: string, messageId: string) => {
    try {
      setMessages((prev) => ({
        ...prev,
        [convId]: (prev[convId] || []).filter((m) => m.id !== messageId),
      }));
      await deleteMessageDoc(convId, messageId);
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const handleDeleteMessageForMe = async (convId: string, messageId: string) => {
    if (!user) return;
    try {
      setMessages((prev) => ({
        ...prev,
        [convId]: (prev[convId] || []).map((m) =>
          m.id === messageId
            ? { ...m, deletedFor: [...(m.deletedFor || []), user.uid] }
            : m
        ),
      }));
      await deleteMessageForMeDoc(convId, messageId, user.uid);
    } catch (err) {
      console.error('Error deleting message for me:', err);
    }
  };

  const handleDeleteMessageForEveryone = async (convId: string, messageId: string) => {
    try {
      setMessages((prev) => ({
        ...prev,
        [convId]: (prev[convId] || []).filter((m) => m.id !== messageId),
      }));
      await deleteMessageForEveryoneDoc(convId, messageId);
    } catch (err) {
      console.error('Error deleting message for everyone:', err);
    }
  };

  const handleClearChat = async (convId: string) => {
    try {
      setMessages((prev) => ({
        ...prev,
        [convId]: [],
      }));
      await clearConversationMessagesDoc(convId);
    } catch (err) {
      console.error('Error clearing chat:', err);
    }
  };

  const handleDeleteChat = async (convId: string) => {
    try {
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      setMessages((prev) => {
        const next = { ...prev };
        delete next[convId];
        return next;
      });
      if (selectedConvId === convId) {
        setSelectedConvId(null);
      }
      await deleteConversationDoc(convId);
    } catch (err) {
      console.error('Error deleting chat:', err);
    }
  };

  const handleUpdateGroupInfo = async (
    convId: string,
    updates: {
      name?: string;
      description?: string;
      avatarUrl?: string;
      permissions?: {
        onlyAdminsCanPost?: boolean;
        onlyAdminsCanEditInfo?: boolean;
        onlyAdminsCanInvite?: boolean;
      };
    }
  ) => {
    try {
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, ...updates } : c))
      );
      await updateGroupInfoDoc(convId, updates);
    } catch (err) {
      console.error('Error updating group info:', err);
    }
  };

  const handleAddGroupMembers = async (convId: string, newMembers: UserProfile[]) => {
    try {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          const updatedParticipants = Array.from(
            new Set([...(c.participants || []), ...newMembers.map((m) => m.uid)])
          );
          const updatedDetails = { ...(c.participantDetails || {}) };
          newMembers.forEach((m) => {
            updatedDetails[m.uid] = {
              displayName: m.displayName,
              handle: m.handle,
              avatarUrl: m.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.handle}`,
              status: m.status || 'online',
            };
          });
          return {
            ...c,
            participants: updatedParticipants,
            participantDetails: updatedDetails,
          };
        })
      );
      await addGroupMembersDoc(convId, newMembers);
    } catch (err) {
      console.error('Error adding group members:', err);
    }
  };

  const handleRemoveGroupMember = async (convId: string, memberUid: string) => {
    try {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          const updatedParticipants = (c.participants || []).filter((id) => id !== memberUid);
          const updatedAdmins = (c.admins || []).filter((id) => id !== memberUid);
          const updatedDetails = { ...(c.participantDetails || {}) };
          delete updatedDetails[memberUid];
          return {
            ...c,
            participants: updatedParticipants,
            admins: updatedAdmins,
            participantDetails: updatedDetails,
          };
        })
      );
      await removeGroupMemberDoc(convId, memberUid);
    } catch (err) {
      console.error('Error removing group member:', err);
    }
  };

  const handleToggleGroupAdmin = async (convId: string, memberUid: string, isAdmin: boolean) => {
    try {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          const currentAdmins = c.admins || [];
          const updatedAdmins = isAdmin
            ? Array.from(new Set([...currentAdmins, memberUid]))
            : currentAdmins.filter((id) => id !== memberUid);
          return { ...c, admins: updatedAdmins };
        })
      );
      await toggleGroupAdminDoc(convId, memberUid, isAdmin);
    } catch (err) {
      console.error('Error toggling group admin:', err);
    }
  };

  const handleSendVoiceNote = async (
    convId: string,
    audioUrl: string,
    duration: number,
    waveform: number[]
  ) => {
    if (!user) return;
    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      conversationId: convId,
      convId: convId,
      senderId: user.uid,
      senderName: user.displayName,
      senderHandle: user.handle,
      senderAvatar: user.avatarUrl,
      type: 'voice',
      mediaUrl: audioUrl,
      mediaDuration: duration,
      waveform: waveform,
      createdAt: Date.now(),
      status: 'sent',
    };

    // Optimistic update
    setMessages((prev) => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMsg],
    }));

    try {
      await sendMessageDoc(convId, newMsg);
    } catch (err) {
      console.error('Error sending voice note:', err);
    }
  };

  const handleSendMedia = async (
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
  ) => {
    if (!user) return;
    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      conversationId: convId,
      convId: convId,
      senderId: user.uid,
      senderName: user.displayName,
      senderHandle: user.handle,
      senderAvatar: user.avatarUrl,
      type: payload.mediaType,
      text: payload.caption || '',
      mediaUrl: payload.mediaUrl,
      posterUrl: payload.posterUrl,
      thumbnailUrl: payload.posterUrl,
      fileName: payload.fileName,
      fileSize: payload.fileSize,
      mediaDuration: payload.duration,
      createdAt: Date.now(),
      status: 'sent',
      read: false,
      readBy: [user.uid],
    };

    // Optimistic update
    setMessages((prev) => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMsg],
    }));

    try {
      await sendMessageDoc(convId, newMsg);

      // Create notification for recipient in direct chat
      if (!convId.startsWith('conv_ai_')) {
        const targetConv = conversations.find((c) => c.id === convId);
        const targetUserId =
          targetConv?.participants?.find((id) => id !== user.uid) ||
          convId.replace('conv_', '').replace(user.uid, '').replace('_', '');

        if (targetUserId && targetUserId !== user.uid) {
          createNotificationDoc({
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            userId: targetUserId,
            type: 'message',
            actorId: user.uid,
            actorName: user.displayName,
            actorAvatar: user.avatarUrl,
            title: `Новое ${payload.mediaType === 'image' ? 'фото' : 'видео'} от @${user.handle}`,
            message: payload.caption
              ? payload.caption.substring(0, 80)
              : payload.mediaType === 'image'
              ? '📷 Фотография'
              : '🎥 Видеозапись',
            createdAt: Date.now(),
            isRead: false,
            read: false,
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Error sending media message:', err);
    }
  };

  const handleSendFile = async (
    convId: string,
    fileName: string,
    fileUrl: string,
    fileSize: string
  ) => {
    if (!user) return;
    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      conversationId: convId,
      convId: convId,
      senderId: user.uid,
      senderName: user.displayName,
      senderHandle: user.handle,
      senderAvatar: user.avatarUrl,
      type: 'file',
      fileName,
      mediaUrl: fileUrl,
      fileSize,
      createdAt: Date.now(),
      status: 'sent',
    };

    // Optimistic update
    setMessages((prev) => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMsg],
    }));

    try {
      await sendMessageDoc(convId, newMsg);
    } catch (err) {
      console.error('Error sending file:', err);
    }
  };

  const handleAddMessageReaction = async (convId: string, messageId: string, emoji: string) => {
    if (!user) return;

    // Instant optimistic update in local state
    setMessages((prev) => {
      const convMsgs = prev[convId] || [];
      const updated = convMsgs.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = { ...(m.reactions || {}) };
        const existingList = Array.isArray(reactions[emoji]) ? reactions[emoji] : [];
        let nextList: string[];
        if (existingList.includes(user.uid)) {
          nextList = existingList.filter((id) => id !== user.uid);
        } else {
          nextList = [...existingList, user.uid];
        }
        if (nextList.length > 0) {
          reactions[emoji] = nextList;
        } else {
          delete reactions[emoji];
        }
        return { ...m, reactions };
      });
      return { ...prev, [convId]: updated };
    });

    try {
      await toggleMessageReactionDoc(convId, messageId, emoji, user.uid);
    } catch (err) {
      console.error('Error adding message reaction:', err);
    }
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const newFriendship: Friendship = {
        id: `fr_${user.uid}_${targetUserId}`,
        requesterId: user.uid,
        recipientId: targetUserId,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await sendFriendRequestDoc(newFriendship);

      createNotificationDoc({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: targetUserId,
        type: 'friend_request',
        actorId: user.uid,
        actorName: user.displayName,
        actorAvatar: user.avatarUrl,
        title: `@${user.handle} отправил(а) запрос в друзья`,
        message: 'Нажмите, чтобы просмотреть профиль и ответить',
        createdAt: Date.now(),
        isRead: false,
        read: false,
      }).catch(() => {});
    } catch (err) {
      console.error('Error sending friend request:', err);
    }
  };

  const handleAcceptFriendRequest = async (friendshipId: string) => {
    try {
      await updateFriendshipStatusDoc(friendshipId, 'accepted');
      const fr = friendships.find((f) => f.id === friendshipId);
      if (fr && user) {
        createNotificationDoc({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: fr.requesterId,
          type: 'friend_accepted',
          actorId: user.uid,
          actorName: user.displayName,
          actorAvatar: user.avatarUrl,
          title: `@${user.handle} принял(а) ваш запрос в друзья`,
          message: 'Теперь вы взаимные друзья в LiteNote!',
          createdAt: Date.now(),
          isRead: false,
          read: false,
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Error accepting friend request:', err);
    }
  };

  const handleDeclineFriendRequest = async (friendshipId: string) => {
    try {
      await updateFriendshipStatusDoc(friendshipId, 'declined');
    } catch (err) {
      console.error('Error declining friend request:', err);
    }
  };

  const handleToggleFollow = async (targetUserId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const isFollowing = follows.some((f) => f.followingId === targetUserId && f.followerId === user.uid);
      await toggleFollowDoc(user.uid, targetUserId, isFollowing);
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  const handleStartDirectChat = async (targetUser: UserProfile) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const convId = await startDirectConversationDoc(user, targetUser);
      setSelectedConvId(convId);
      setActiveTab('messenger');
    } catch (err) {
      console.error('Error starting direct chat:', err);
    }
  };

  const handleCreateGroup = async (
    name: string,
    members: UserProfile[],
    description?: string,
    avatarUrl?: string,
    type: 'group' | 'channel' = 'group'
  ) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const convId = await createGroupConversationDoc(user, name, members, {
        description,
        avatarUrl,
        type,
      });
      setSelectedConvId(convId);
      setActiveTab('messenger');
    } catch (err) {
      console.error('Error creating group:', err);
    }
  };

  // Combine allUsers with fresh current user profile for instant updates across the app without reload
  const effectiveAllUsers = React.useMemo(() => {
    if (!user) return allUsers;
    const exists = allUsers.some((u) => u.uid === user.uid);
    if (!exists) {
      return [user, ...allUsers];
    }
    return allUsers.map((u) => (u.uid === user.uid ? { ...u, ...user } : u));
  }, [allUsers, user]);

  // Derive target user for profile tab
  const activeProfileUser = React.useMemo(() => {
    if (!user) return null;
    if (!selectedUserId || selectedUserId === user.uid) {
      return user;
    }
    const found = effectiveAllUsers.find((u) => u.uid === selectedUserId);
    if (found) {
      return found.uid === user.uid ? user : found;
    }
    // Fallback for Patrick Jane cofounder
    if (
      selectedUserId === 'patrick_jane_cofounder_uid' ||
      selectedUserId.toLowerCase().includes('patrick')
    ) {
      return PATRICK_JANE_USER;
    }
    return user;
  }, [selectedUserId, effectiveAllUsers, user]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07090E] flex items-center justify-center p-4 text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-base text-white tracking-tight">
              LiteNote
            </p>
            <p className="text-xs text-slate-400 font-mono">
              Подключение к защищенной сети...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If user is banned by moderator, show dedicated BanScreen
  if (
    user &&
    user.penalty?.type === 'ban' &&
    (user.penalty.expiresAt === 0 || user.penalty.expiresAt > Date.now())
  ) {
    return <BanScreen penalty={user.penalty} />;
  }

  // If not logged in, show AuthLandingView
  if (!user) {
    return (
      <>
        <AnimatePresence>
          {showSplash && (
            <AppEntrySplash
              onComplete={handleSplashComplete}
              userName=""
            />
          )}
        </AnimatePresence>
        <AuthLandingView />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </>
    );
  }

  const effectiveProfileUser = activeProfileUser || user;
  const profilePosts = posts.filter((p) => p.authorId === effectiveProfileUser.uid);
  const profileFriendship = friendships.find(
    (f) =>
      (f.requesterId === user.uid && f.recipientId === effectiveProfileUser.uid) ||
      (f.requesterId === effectiveProfileUser.uid && f.recipientId === user.uid)
  );
  const isProfileFollowing = follows.some(
    (f) => f.followerId === user.uid && f.followingId === effectiveProfileUser.uid
  );

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead && !(n as any).read).length;

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#07090E] text-slate-100 flex flex-col selection:bg-indigo-600/30 selection:text-white relative overflow-hidden">
      {/* Dynamic Floating Toast Notifications Stack */}
      <NotificationToastContainer />

      {/* Dynamic Intro Splash Animation */}
      <AnimatePresence>
        {showSplash && (
          <AppEntrySplash
            onComplete={handleSplashComplete}
            userName={user.displayName}
          />
        )}
      </AnimatePresence>

      {/* Top Header */}
      <Header
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        allUsers={effectiveAllUsers}
        onOpenDevTools={() => setIsDevToolsOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-hidden min-h-0">
        {/* Sidebar Navigation */}
        <SidebarNav
          unreadMessagesCount={conversations.reduce(
            (acc, c) => acc + ((c.unreadCount && user ? c.unreadCount[user.uid] : 0) || 0),
            0
          )}
          pendingFriendRequestsCount={
            friendships.filter((f) => f.recipientId === user.uid && f.status === 'pending').length
          }
          selectedConvId={selectedConvId}
          onOpenDevTools={() => setIsDevToolsOpen(true)}
        />

        {/* Dynamic Tab Views */}
        <main
          className={`flex-1 min-w-0 h-full flex flex-col overflow-hidden ${
            activeTab === 'messenger'
              ? selectedConvId
                ? 'pb-0'
                : 'pb-16 md:pb-0'
              : 'pb-20 md:pb-6 overflow-y-auto'
          }`}
        >
          {activeTab === 'feed' && (
            <div className="max-w-3xl mx-auto p-3 sm:p-6">
              <FeedView
                posts={posts}
                comments={comments}
                bookmarkedPostIds={bookmarkedPostIds}
                onToggleReaction={handleToggleReaction}
                onToggleBookmark={handleToggleBookmark}
                onAddComment={handleAddComment}
                onVotePoll={handleVotePoll}
                onDeletePost={handleDeletePost}
              />
            </div>
          )}

          {activeTab === 'messenger' && (
            <MessengerView
              conversations={conversations}
              messages={messages}
              selectedConvId={selectedConvId}
              allUsers={effectiveAllUsers}
              onSelectConversation={(id) => setSelectedConvId(id)}
              onSendMessage={handleSendMessage}
              onSendVoiceNote={handleSendVoiceNote}
              onSendMedia={handleSendMedia}
              onSendFile={handleSendFile}
              onSendCallLog={handleSendCallLog}
              onAddReaction={handleAddMessageReaction}
              onPinMessage={handlePinMessage}
              onDeleteMessage={handleDeleteMessage}
              onStartDirectChat={handleStartDirectChat}
              onCreateGroup={handleCreateGroup}
              onStartCall={handleInitiateCall}
              onDeleteForMe={handleDeleteMessageForMe}
              onDeleteForEveryone={handleDeleteMessageForEveryone}
              onClearChat={handleClearChat}
              onDeleteChat={handleDeleteChat}
              onUpdateGroupInfo={handleUpdateGroupInfo}
              onAddMembers={handleAddGroupMembers}
              onRemoveMember={handleRemoveGroupMember}
              onToggleAdmin={handleToggleGroupAdmin}
            />
          )}

          {(activeTab === 'people' || activeTab === 'directory' || (activeTab as string) === 'network') && (
            <PeopleDirectory
              allUsers={effectiveAllUsers}
              friendships={friendships}
              follows={follows}
              onSendFriendRequest={handleSendFriendRequest}
              onAcceptFriendRequest={handleAcceptFriendRequest}
              onDeclineFriendRequest={handleDeclineFriendRequest}
              onToggleFollow={handleToggleFollow}
              onStartDirectChat={handleStartDirectChat}
            />
          )}

          {activeTab === 'bookmarks' && (
            <BookmarksView
              posts={posts}
              comments={comments}
              bookmarkedPostIds={bookmarkedPostIds}
              onToggleReaction={handleToggleReaction}
              onToggleBookmark={handleToggleBookmark}
              onAddComment={handleAddComment}
              onVotePoll={handleVotePoll}
              onDeletePost={handleDeletePost}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              targetUser={activeProfileUser}
              userPosts={profilePosts}
              comments={comments}
              bookmarkedPostIds={bookmarkedPostIds}
              friendship={profileFriendship}
              isFollowing={isProfileFollowing}
              onSendFriendRequest={handleSendFriendRequest}
              onAcceptFriendRequest={handleAcceptFriendRequest}
              onToggleFollow={handleToggleFollow}
              onStartDirectChat={handleStartDirectChat}
              onToggleReaction={handleToggleReaction}
              onToggleBookmark={handleToggleBookmark}
              onAddComment={handleAddComment}
              onVotePoll={handleVotePoll}
              onDeletePost={handleDeletePost}
            />
          )}

          {(activeTab === 'terminal_ai' || (activeTab as string) === 'ai_core') && <MatrixTerminalAI />}

          {(activeTab === 'settings' || activeTab === 'analytics') && (
            <SettingsView
              userPosts={profilePosts}
              allUsers={effectiveAllUsers}
              posts={posts}
              conversations={conversations}
              onDeletePost={handleDeletePost}
            />
          )}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <CreatePostModal
        isOpen={openCreatePost}
        onClose={() => setOpenCreatePost(false)}
        onPostCreated={handleCreatePost}
      />

      <DevToolsModal
        isOpen={isDevToolsOpen}
        onClose={() => setIsDevToolsOpen(false)}
        onShareToFeed={handleShareDevSnippet}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => user && markAllNotificationsReadDoc(user.uid)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Real-Time Incoming Call Modal (for Callee) */}
      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={handleAcceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
        />
      )}

      {/* WebRTC Active Call Screen (Voice & Video) */}
      {activeCallSession && (
        <CallModal
          isOpen={!!activeCallSession}
          callSession={activeCallSession.session}
          isCaller={activeCallSession.isCaller}
          recipient={activeCallSession.recipient}
          onClose={handleActiveCallClosed}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
