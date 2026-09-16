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
import {
  requestNotificationPermission,
  pushLiveNotification,
  initNotificationService,
  onServiceWorkerNotificationClick,
  getNotificationPermission
} from './lib/notificationService';
import { AnimatePresence } from 'motion/react';

import {
  ActiveTab,
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
  deleteCommentDoc,
  sendMessageDoc,
  markConversationMessagesReadDoc,
  startDirectConversationDoc,
  createGroupConversationDoc,
  sendFriendRequestDoc,
  updateFriendshipStatusDoc,
  toggleFollowDoc,
  toggleBookmarkDoc,
  markNotificationReadDoc,
  markAllNotificationsReadDoc,
  deleteNotificationDoc,
  deleteReadNotificationsDoc,
  clearAllNotificationsDoc,
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
  votePollDoc,
  updateUserPresence
} from './lib/firebase';

import { Terminal, Loader2 } from 'lucide-react';
import { OfflineIndicator } from './components/Common/OfflineIndicator';
import { CommandPalette } from './components/CommandPalette/CommandPalette';
import { PullToRefresh } from './components/Common/PullToRefresh';
import { MobileQuickActionFAB } from './components/Common/MobileQuickActionFAB';
import { MobileNetworkStatus } from './components/Common/MobileNetworkStatus';
import { useSwipeGesture } from './hooks/useSwipeGesture';
import { triggerHaptic } from './utils/haptics';
import {
  playMessageSentSound,
  playMessageReceivedSound,
  playReactionSound
} from './lib/audioEffects';

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

  // Application Data States (Clean & synced via Firestore with instant 0ms localStorage cache)
  const mainScrollRef = React.useRef<HTMLElement>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const TAB_ORDER: ActiveTab[] = ['feed', 'messenger', 'people', 'terminal_ai', 'profile', 'settings'];

  // Mobile Horizontal Swipe Gesture between tabs
  useSwipeGesture({
    onSwipeLeft: () => {
      if (activeTab === 'messenger' && selectedConvId) return;
      const currentIndex = TAB_ORDER.indexOf(activeTab);
      if (currentIndex !== -1 && currentIndex < TAB_ORDER.length - 1) {
        triggerHaptic('light');
        if (TAB_ORDER[currentIndex + 1] === 'profile') {
          setSelectedUserId(null);
        }
        setActiveTab(TAB_ORDER[currentIndex + 1]);
      }
    },
    onSwipeRight: () => {
      if (activeTab === 'messenger' && selectedConvId) return;
      const currentIndex = TAB_ORDER.indexOf(activeTab);
      if (currentIndex > 0) {
        triggerHaptic('light');
        if (TAB_ORDER[currentIndex - 1] === 'profile') {
          setSelectedUserId(null);
        }
        setActiveTab(TAB_ORDER[currentIndex - 1]);
      }
    },
    disabled: activeTab === 'messenger' && !!selectedConvId,
  });

  const handleScrollToTop = () => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const cached = localStorage.getItem('litenote_cache_posts');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const cached = localStorage.getItem('litenote_cache_conversations');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    try {
      const cached = localStorage.getItem('litenote_cache_messages');
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    try {
      const cached = localStorage.getItem('litenote_cache_all_users');
      if (!cached) return [];
      const parsed = JSON.parse(cached);
      return Array.isArray(parsed)
        ? parsed.filter(
            (u) =>
              u &&
              u.uid &&
              u.uid !== 'undefined' &&
              u.uid !== 'null' &&
              u.handle !== 'undefined' &&
              (Boolean(u.handle) || Boolean(u.displayName))
          )
        : [];
    } catch {
      return [];
    }
  });
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
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const prevNotifIdsRef = React.useRef<Set<string>>(new Set());
  const isInitialNotifLoadRef = React.useRef<boolean>(true);
  const notifiedCallIdsRef = React.useRef<Set<string>>(new Set());
  const lastKnownMessageCountRef = React.useRef<Record<string, number>>({});
  const notifiedConvLastMsgRef = React.useRef<Record<string, number>>({});
  const appSessionStartTimeRef = React.useRef<number>(Date.now());
  const activeTabRef = React.useRef(activeTab);
  activeTabRef.current = activeTab;
  const selectedConvIdRef = React.useRef(selectedConvId);
  selectedConvIdRef.current = selectedConvId;
  const conversationsRef = React.useRef(conversations);
  conversationsRef.current = conversations;

  // Global Command Palette Shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Request browser notification permission once user interacts or logs in
  useEffect(() => {
    if (!user) return;
    const triggerPermission = () => {
      requestNotificationPermission().catch(() => {});
    };
    // Attempt permission request and also hook to first user interaction
    triggerPermission();
    window.addEventListener('click', triggerPermission, { once: true });
    window.addEventListener('keydown', triggerPermission, { once: true });
    return () => {
      window.removeEventListener('click', triggerPermission);
      window.removeEventListener('keydown', triggerPermission);
    };
  }, [user]);

  // Robust User Presence Engine (25s Heartbeat + Activity Throttle + Visibility + Page Hide)
  useEffect(() => {
    if (!user?.uid) return;

    // 1. Initial presence ping
    updateUserPresence(user, true).catch(() => {});

    // 2. Regular 25s heartbeat ticker when tab is open
    const heartbeatInterval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        updateUserPresence(user, true).catch(() => {});
      }
    }, 25000);

    // 3. Throttled activity refresh (e.g. typing, clicking, scrolling)
    let lastActivityPing = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivityPing > 18000) {
        lastActivityPing = now;
        updateUserPresence(user, true).catch(() => {});
      }
    };

    // 4. Tab visibility change (returning to tab immediately triggers online status)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        lastActivityPing = Date.now();
        updateUserPresence(user, true).catch(() => {});
      }
    };

    // 5. Clean unload
    const handlePageHide = () => {
      updateUserPresence(user, false).catch(() => {});
    };

    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handlePageHide);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handlePageHide);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [user?.uid]);

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

  // Initialize browser notification service & service worker & click listener
  useEffect(() => {
    initNotificationService();
    const unsubClick = onServiceWorkerNotificationClick((data) => {
      if (data?.convId || data?.referenceId) {
        setActiveTab('messenger');
        setSelectedConvId(data.convId || data.referenceId);
      } else if (data?.postId) {
        setActiveTab('feed');
      } else if (data?.type === 'friend_request' || data?.type === 'friend_accepted') {
        setActiveTab('people');
      }
    });
    return unsubClick;
  }, []);

  // 1. Subscribe to Global Posts
  useEffect(() => {
    const unsub = subscribePosts((fetchedPosts) => {
      setPosts(fetchedPosts);
      try {
        localStorage.setItem('litenote_cache_posts', JSON.stringify(fetchedPosts.slice(0, 100)));
      } catch (e) {}
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to Registered Users
  useEffect(() => {
    const unsub = subscribeUsers((fetchedUsers) => {
      setAllUsers(fetchedUsers);
      try {
        localStorage.setItem('litenote_cache_all_users', JSON.stringify(fetchedUsers));
      } catch (e) {}
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
      try {
        localStorage.setItem('litenote_cache_conversations', JSON.stringify(convs));
      } catch (e) {}

      // Secondary check: detect if any conversation received a new message from someone else
      convs.forEach((c) => {
        const lastMsg = c.lastMessage;
        if (
          lastMsg &&
          lastMsg.senderId !== user.uid &&
          lastMsg.createdAt &&
          lastMsg.createdAt > appSessionStartTimeRef.current
        ) {
          const prevNotifiedTime = notifiedConvLastMsgRef.current[c.id] || 0;
          if (lastMsg.createdAt > prevNotifiedTime) {
            notifiedConvLastMsgRef.current[c.id] = lastMsg.createdAt;

            // Check if user is already actively watching this chat
            const isDocumentVisible = typeof document !== 'undefined' && !document.hidden;
            const currentViewingId = selectedConvIdRef.current;
            const isActivelyInThisChat =
              isDocumentVisible &&
              activeTabRef.current === 'messenger' &&
              currentViewingId === c.id;

            if (!isActivelyInThisChat) {
              const chatTitle = c.name || lastMsg.senderName || 'LiteNote Сообщение';
              pushLiveNotification({
                title: chatTitle,
                message: lastMsg.text || 'Новое сообщение',
                type: 'message',
                avatarUrl: c.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${lastMsg.senderId}`,
                tag: `chat_${c.id}`,
                renotify: true,
                data: {
                  convId: c.id,
                  type: 'message',
                },
                actions: [{ action: 'open', title: '💬 Ответить' }],
                onClick: () => {
                  setActiveTab('messenger');
                  setSelectedConvId(c.id);
                },
              });
            }
          }
        }
      });
    });

    const unsubFriends = subscribeFriendships(user.uid, (friends) => {
      setFriendships(friends);
    });

    const unsubFollows = subscribeFollows(user.uid, (flws) => {
      setFollows(flws);
    });

    const unsubNotifs = subscribeNotifications(user.uid, (notifs) => {
      setNotifications(notifs);

      // On initial app load/login: do not pop up a stack of old notifications
      // Instead, if there are unread notifications, display a single elegant summary reminder
      if (isInitialNotifLoadRef.current) {
        prevNotifIdsRef.current = new Set(notifs.map((n) => n.id));
        isInitialNotifLoadRef.current = false;

        const unreadCount = notifs.filter((n) => !n.isRead && !(n as any).read).length;
        if (unreadCount > 0) {
          // Professional single consolidated reminder
          const summaryMessage =
            language === 'ru'
              ? `У вас ${unreadCount} ${
                  unreadCount === 1
                    ? 'непрочитанное уведомление'
                    : unreadCount < 5
                    ? 'непрочитанных уведомления'
                    : 'непрочитанных уведомлений'
                }`
              : `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`;

          pushLiveNotification({
            title: language === 'ru' ? 'Центр уведомлений' : 'Notifications',
            message: summaryMessage,
            type: 'system',
            skipSound: true, // Silent reminder on entry, no loud jarring sounds
            skipDesktop: true, // Only inside app on entry
            onClick: () => {
              setIsNotificationsOpen(true);
            },
          });
        }
        return;
      }

      // When newly created notifications arrive in real-time
      notifs.forEach((item) => {
        if (!prevNotifIdsRef.current.has(item.id) && !item.isRead && !item.read) {
          prevNotifIdsRef.current.add(item.id);

          // Check if user is currently looking at this exact chat in the foreground
          const isAppVisible = typeof document !== 'undefined' && !document.hidden;
          const currentViewingConvId =
            selectedConvIdRef.current ||
            (conversationsRef.current.length > 0 ? conversationsRef.current[0].id : null);

          const isActivelyViewingChat =
            isAppVisible &&
            activeTabRef.current === 'messenger' &&
            Boolean(currentViewingConvId) &&
            (
              (item.referenceId && item.referenceId === currentViewingConvId) ||
              (item.actorId && (
                currentViewingConvId?.includes(item.actorId) ||
                currentViewingConvId === `conv_${item.actorId}_${user.uid}` ||
                currentViewingConvId === `conv_${user.uid}_${item.actorId}`
              ))
            );

          if (isActivelyViewingChat) {
            // Already in chat: mark as read automatically without popping intrusive toast or playing sound
            markNotificationReadDoc(item.id).catch(() => {});
            return;
          }

          // User is outside the app, on another tab/view, or in a different chat -> show live notification
          const notifTag = item.referenceId
            ? `chat_${item.referenceId}`
            : item.postId
            ? `post_${item.postId}`
            : `notif_${item.id}`;

          pushLiveNotification({
            title: item.title || 'Новое уведомление в LiteNote',
            message: item.message,
            type: item.type as any,
            avatarUrl: item.actorAvatar,
            imageUrl: item.imageUrl,
            tag: notifTag,
            renotify: true,
            data: {
              convId: item.referenceId,
              postId: item.postId,
              type: item.type,
            },
            actions:
              item.type === 'message' || item.type === 'new_message'
                ? [{ action: 'open', title: '💬 Ответить' }]
                : undefined,
            onClick: () => {
              if (item.type === 'message' || item.type === 'new_message') {
                setActiveTab('messenger');
                if (item.referenceId) {
                  setSelectedConvId(item.referenceId);
                }
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
  }, [user?.uid]);

  // 4. Subscribe to Messages for Selected Conversation & Mark as Read
  useEffect(() => {
    if (!selectedConvId) return;

    const unsub = subscribeMessages(selectedConvId, (msgs) => {
      const prevCount = lastKnownMessageCountRef.current[selectedConvId] || 0;
      if (prevCount > 0 && msgs.length > prevCount) {
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg && user && lastMsg.senderId !== user.uid) {
          playMessageReceivedSound();
        }
      }
      lastKnownMessageCountRef.current[selectedConvId] = msgs.length;

      setMessages((prev) => {
        const next = {
          ...prev,
          [selectedConvId]: msgs,
        };
        try {
          localStorage.setItem('litenote_cache_messages', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

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

  // 5. Subscribe to Incoming WebRTC Calls with Controlled Desktop/Background Notification
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeIncomingCalls(user.uid, (ringingCalls) => {
      if (ringingCalls.length > 0 && !activeCallSession) {
        const call = ringingCalls[0];
        setIncomingCall(call);

        // Check if this specific call has already been notified to avoid 5-6 spam notifications
        if (!notifiedCallIdsRef.current.has(call.id)) {
          notifiedCallIdsRef.current.add(call.id);

          const isDocumentHidden = typeof document !== 'undefined' && document.hidden;

          // If the user is not actively on the tab/app, show a single desktop background notification
          if (isDocumentHidden) {
            pushLiveNotification({
              title: `Входящий ${call.callType === 'video' ? 'видеозвонок' : 'аудиозвонок'}!`,
              message: `${call.callerName} (@${call.callerHandle}) звонит вам в LiteNote...`,
              avatarUrl: call.callerAvatar,
              type: 'call',
              tag: `call_${call.id}`,
              requireInteraction: true,
              skipSound: true, // IncomingCallModal handles ringtone sound without overlapping audio glitches
              skipInAppToast: true, // The IncomingCallModal visual dialog is already displayed on screen
              onClick: () => {
                window.focus();
              },
            });
          }
        }
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
    playReactionSound();
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

  const handleAddComment = async (postId: string, content: string, parentId?: string, commentId?: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const finalCommentId = commentId || `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newComment: Comment = {
      id: finalCommentId,
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
    setComments((prev) => {
      const existing = prev[postId] || [];
      if (existing.some((c) => c.id === finalCommentId)) {
        return prev;
      }
      return {
        ...prev,
        [postId]: [...existing, newComment],
      };
    });

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

  const handleDeleteComment = async (commentId: string, postId: string) => {
    setComments((prev) => ({
      ...prev,
      [postId]: (prev[postId] || []).filter((c) => c.id !== commentId && c.parentId !== commentId),
    }));

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 1) - 1) }
          : p
      )
    );

    try {
      await deleteCommentDoc(commentId, postId);
    } catch (err) {
      console.error('Error deleting comment in App:', err);
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

  const notifyChatParticipants = async (
    convId: string,
    payload: {
      type?: NotificationItem['type'];
      title: string;
      message: string;
      imageUrl?: string;
    }
  ) => {
    if (!user || convId.startsWith('conv_ai_')) return;

    try {
      const targetConv = conversationsRef.current.find((c) => c.id === convId) ||
        conversations.find((c) => c.id === convId);

      let recipientIds: string[] = [];

      if (targetConv && Array.isArray(targetConv.participants) && targetConv.participants.length > 0) {
        recipientIds = targetConv.participants.filter((p) => p !== user.uid);
      } else {
        // Fallback for direct chats formatted like conv_uid1_uid2
        const parts = convId.replace('conv_', '').split('_');
        recipientIds = parts.filter((id) => id && id !== user.uid);
      }

      const uniqueRecipients = Array.from(new Set(recipientIds));

      for (const recipientId of uniqueRecipients) {
        await createNotificationDoc({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId: recipientId,
          type: payload.type || 'message',
          actorId: user.uid,
          actorName: user.displayName,
          actorAvatar: user.avatarUrl,
          referenceId: convId,
          title: payload.title,
          message: payload.message,
          imageUrl: payload.imageUrl,
          createdAt: Date.now(),
          isRead: false,
          read: false,
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Failed to notify chat participants:', e);
    }
  };

  const handleSendMessage = async (convId: string, text: string, replyTo?: Message['replyTo']) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    playMessageSentSound();
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

      // Create notification for recipients in chat
      notifyChatParticipants(convId, {
        type: 'message',
        title: `💬 @${user.handle}`,
        message: text.substring(0, 100),
      });

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
            senderName: 'Litenote AI',
            senderHandle: 'litenote_ai',
            senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=litenote_ai',
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
    playMessageSentSound();
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

      // Create notification for recipients in chat
      notifyChatParticipants(convId, {
        type: 'message',
        title: `🎤 @${user.handle}`,
        message: `Голосовое сообщение (${Math.round(duration)} сек.)`,
      });
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
    playMessageSentSound();
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

      // Create rich notification for recipients in chat
      notifyChatParticipants(convId, {
        type: 'message',
        title: `${payload.mediaType === 'image' ? '📷 Фото' : '🎥 Видео'} от @${user.handle}`,
        message: payload.caption
          ? payload.caption.substring(0, 100)
          : payload.mediaType === 'image'
          ? 'Фотография'
          : 'Видеозапись',
        imageUrl: payload.mediaType === 'image' ? payload.mediaUrl : payload.posterUrl,
      });
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
    playMessageSentSound();
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

      // Create notification for recipients in chat
      notifyChatParticipants(convId, {
        type: 'message',
        title: `📎 Файл от @${user.handle}`,
        message: `${fileName} (${fileSize || 'документ'})`,
      });
    } catch (err) {
      console.error('Error sending file:', err);
    }
  };

  const handleAddMessageReaction = async (convId: string, messageId: string, emoji: string) => {
    if (!user) return;
    playReactionSound();

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

      // Notify the message author if different from current user
      const currentMsgs = messages[convId] || [];
      const targetMsg = currentMsgs.find((m) => m.id === messageId);
      if (targetMsg && targetMsg.senderId !== user.uid) {
        createNotificationDoc({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: targetMsg.senderId,
          type: 'reaction',
          actorId: user.uid,
          actorName: user.displayName,
          actorAvatar: user.avatarUrl,
          referenceId: convId,
          title: `❤️ @${user.handle} отреагировал(а)`,
          message: `${emoji} на «${(targetMsg.text || 'сообщение').substring(0, 50)}»`,
          createdAt: Date.now(),
          isRead: false,
          read: false,
        }).catch(() => {});
      }
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
    const valid = allUsers.filter(
      (u) =>
        u &&
        u.uid &&
        u.uid !== 'undefined' &&
        u.uid !== 'null' &&
        u.handle !== 'undefined' &&
        (Boolean(u.handle) || Boolean(u.displayName))
    );
    if (!user || !user.uid || user.uid === 'undefined') return valid;
    const exists = valid.some((u) => u.uid === user.uid);
    if (!exists) {
      return [user, ...valid];
    }
    return valid.map((u) => (u.uid === user.uid ? { ...u, ...user } : u));
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
      <div className="min-h-screen bg-[#040810] flex items-center justify-center p-4 text-white selection:bg-emerald-500/30 selection:text-white">
        <div className="text-center space-y-4">
          <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-lg animate-pulse" />
            <div className="w-14 h-14 rounded-2xl bg-[#081524] border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/50">
              <Loader2 className="w-7 h-7 animate-spin text-[#00DF89]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="font-extrabold text-lg text-white tracking-tight flex items-center justify-center gap-2">
              <span>LiteNote</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-medium border border-emerald-500/30">
                FORUM
              </span>
            </p>
            <p className="text-xs text-slate-400 font-mono">
              {language === 'ru' ? 'Синхронизация защищенного хаба...' : 'Connecting to sovereign network...'}
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
          ref={mainScrollRef as any}
          onScroll={(e) => setShowScrollToTop(e.currentTarget.scrollTop > 320)}
          className={`flex-1 min-w-0 h-full flex flex-col overflow-hidden ${
            activeTab === 'messenger'
              ? selectedConvId
                ? 'pb-0'
                : 'pb-16 md:pb-0'
              : 'pb-20 md:pb-6 overflow-y-auto'
          }`}
        >
          {activeTab === 'feed' && (
            <PullToRefresh
              onRefresh={async () => {
                await new Promise((resolve) => setTimeout(resolve, 500));
              }}
            >
              <div className="max-w-3xl mx-auto p-3 sm:p-6">
                <FeedView
                  posts={posts}
                  comments={comments}
                  bookmarkedPostIds={bookmarkedPostIds}
                  allUsers={effectiveAllUsers}
                  onToggleReaction={handleToggleReaction}
                  onToggleBookmark={handleToggleBookmark}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  onVotePoll={handleVotePoll}
                  onDeletePost={handleDeletePost}
                />
              </div>
            </PullToRefresh>
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
        onDeleteNotification={(notifId) => deleteNotificationDoc(notifId)}
        onClearReadNotifications={() => user && deleteReadNotificationsDoc(user.uid)}
        onClearAllNotifications={() => user && clearAllNotificationsDoc(user.uid)}
        onSelectNotification={(notif) => {
          if (notif.type === 'message' || notif.type === 'new_message') {
            setActiveTab('messenger');
            if (notif.referenceId) {
              setSelectedConvId(notif.referenceId);
            }
          } else if (notif.postId) {
            setActiveTab('feed');
          } else if (notif.type === 'friend_request' || notif.type === 'friend_accepted') {
            setActiveTab('people');
          }
        }}
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

      {/* Global Quick Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        conversations={conversations}
        allUsers={effectiveAllUsers}
        onSelectConversation={(id) => {
          setSelectedConvId(id);
          setActiveTab('messenger');
        }}
        onNavigateTab={(tab) => {
          setActiveTab(tab as any);
        }}
        onOpenNewChat={() => {
          setActiveTab('messenger');
          setSelectedConvId(null);
        }}
        onOpenCreatePost={() => setOpenCreatePost(true)}
        onOpenDevTools={() => setIsDevToolsOpen(true)}
      />

      {/* Mobile Floating Action Button (Speed Dial) */}
      <MobileQuickActionFAB
        onNewPost={() => setOpenCreatePost(true)}
        onOpenAI={() => {
          setActiveTab('terminal_ai');
          setSelectedConvId(null);
        }}
        onOpenMessenger={() => {
          setActiveTab('messenger');
          setSelectedConvId(null);
        }}
        onOpenSearch={() => setIsCommandPaletteOpen(true)}
        onScrollToTop={handleScrollToTop}
        showScrollToTop={showScrollToTop}
        isVisible={!(activeTab === 'messenger' && selectedConvId)}
      />

      {/* Mobile Connectivity Banner */}
      <MobileNetworkStatus />

      {/* Network Connectivity Offline Toast */}
      <OfflineIndicator />
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
