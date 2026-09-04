export type AccentColor = 'emerald' | 'cyan' | 'amber' | 'violet' | 'lime' | 'rose' | 'indigo' | 'gold';

export type Language = 'en' | 'ru';

export interface UserPenalty {
  type: 'mute' | 'ban';
  expiresAt: number; // timestamp in ms; 0 means permanent
  reason: string;
  issuedAt: number;
  issuedBy?: string;
  issuedByName?: string;
}

export interface UserCustomization {
  avatarStyle?: string;
  avatarFrame?: string; // 'none' | 'cyber_glow' | 'hologram' | 'tokyo_violet' | 'matrix_green' | 'gold_elite' | 'rose_flare'
  bannerPreset?: string;
  profileTheme?: string;
  pronouns?: string;
  techStack?: string[];
  pinnedPostId?: string;
  soundEffects?: boolean;
  socialLinks?: {
    telegram?: string;
    twitter?: string;
    github?: string;
    discord?: string;
    website?: string;
  };
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  handle: string; // e.g. "neo_matrix"
  avatarUrl: string;
  bannerUrl: string;
  bio: string;
  status: 'online' | 'idle' | 'busy' | 'offline';
  customStatus?: string; // e.g. "Compiling Linux kernel..."
  accentColor: AccentColor;
  language: Language;
  location?: string;
  website?: string;
  github?: string;
  role?: 'creator' | 'admin' | 'moderator' | 'user';
  penalty?: UserPenalty | null;
  customization?: UserCustomization;
  createdAt: number;
  badges: string[]; // e.g. ["root_access", "cyber_pioneer", "matrix_architect"]
  privacy: {
    profileVisibility: 'all' | 'friends' | 'private';
    allowDMs: 'all' | 'friends';
    showOnlineStatus: boolean;
  };
  stats: {
    postsCount: number;
    friendsCount: number;
    followersCount: number;
    followingCount: number;
  };
}

export interface PostReaction {
  emoji: string;
  userIds: string[];
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  authorEmail?: string;
  authorBadges?: string[];
  content: string;
  summary?: string;
  codeSnippet?: {
    code: string;
    language: string;
    title?: string;
    output?: string;
  };
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  poll?: {
    question: string;
    options: { text: string; votes: number; voters?: string[] }[];
  };
  visibility?: 'public' | 'friends' | 'private';
  tags: string[];
  reactions: Record<string, string[]>; // { "🔥": ["uid1"], "⚡": ["uid2"], "💻": ["uid3"], "🛡️": ["uid1"], "🚀": ["uid2"] }
  commentsCount: number;
  createdAt: number;
  updatedAt?: number;
  isPinned?: boolean;
  bookmarksCount?: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  content: string;
  parentId?: string; // for threaded responses
  createdAt: number;
  likes?: string[];
  reactions?: Record<string, string[]>;
}

export type MessageType = 'text' | 'voice' | 'video' | 'video_note' | 'file' | 'image' | 'call' | 'code' | 'sticker' | 'system';

export interface Message {
  id: string;
  conversationId?: string;
  convId?: string;
  senderId: string;
  senderName: string;
  senderHandle: string;
  senderAvatar?: string;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  mediaDuration?: number; // duration in seconds for audio/video
  waveform?: number[]; // waveform sample points
  fileName?: string;
  fileSize?: string;
  codeSnippet?: {
    code: string;
    language: string;
    title?: string;
  };
  callInfo?: {
    callType: 'voice' | 'video';
    durationSeconds: number;
    status: 'completed' | 'missed' | 'declined';
    endedAt?: number;
  };
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
    type?: MessageType;
  };
  read?: boolean;
  posterUrl?: string;
  thumbnailUrl?: string;
  isChunked?: boolean;
  totalChunks?: number;
  isPinned?: boolean;
  reactions?: Record<string, string[]>;
  status: 'sent' | 'delivered' | 'read';
  readBy?: string[];
  deletedFor?: string[];
  isDeletedForAll?: boolean;
  createdAt: number;
}

export interface DevTeamMember {
  id: string;
  uid: string;
  displayName: string;
  handle: string;
  avatarUrl: string;
  email?: string;
  roleTitle: string; // e.g. "Founder & Lead Architect", "Co-Founder", "Core Systems Engineer"
  roleBadge: 'creator' | 'cofounder' | 'core_dev' | 'security_lead' | 'ai_architect';
  bio?: string;
  github?: string;
  techStack?: string[];
  joinedAt?: number;
  addedBy?: string;
}

export interface CallSession {
  id: string;
  conversationId: string;
  callerId: string;
  callerName: string;
  callerHandle: string;
  callerAvatar?: string;
  calleeId: string;
  calleeName: string;
  calleeHandle: string;
  calleeAvatar?: string;
  callType: 'voice' | 'video';
  status: 'ringing' | 'connected' | 'declined' | 'missed' | 'ended';
  startedAt: number;
  connectedAt?: number;
  endedAt?: number;
  durationSeconds?: number;
  participants?: string[];
  isGroup?: boolean;
  isGroupCall?: boolean;
  groupName?: string;
  groupAvatar?: string;
  offer?: {
    type: string;
    sdp: string;
  };
  answer?: {
    type: string;
    sdp: string;
  };
  callerCandidates?: any[];
  calleeCandidates?: any[];
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'channel' | 'ai_bot';
  name?: string;
  avatarUrl?: string;
  description?: string;
  ownerId?: string;
  admins?: string[];
  permissions?: {
    onlyAdminsCanPost?: boolean;
    onlyAdminsCanEditInfo?: boolean;
    onlyAdminsCanInvite?: boolean;
  };
  participants: string[];
  participantDetails: Record<string, {
    displayName: string;
    handle: string;
    avatarUrl: string;
    status?: 'online' | 'idle' | 'busy' | 'offline';
  }>;
  lastMessage?: {
    text: string;
    senderId: string;
    senderName?: string;
    createdAt?: number;
    timestamp?: number;
    type: MessageType;
    fileName?: string;
  };
  pinnedMessageId?: string;
  pinnedMessage?: Message;
  updatedAt: number;
  createdAt?: number;
  unreadCount?: Record<string, number>;
  isEncrypted?: boolean;
  deletedForUsers?: string[];
}

export interface Friendship {
  id: string;
  requesterId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: number;
  updatedAt?: number;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  fromUserId?: string;
  fromUserName?: string;
  fromUserAvatar?: string;
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  title?: string;
  type: 'friend_request' | 'friend_accepted' | 'post_reaction' | 'reaction' | 'comment' | 'mention' | 'new_message' | 'message' | 'system';
  message: string;
  referenceId?: string;
  postId?: string;
  read: boolean;
  isRead?: boolean;
  createdAt: number;
}

export interface Bookmark {
  id: string;
  userId: string;
  postId: string;
  createdAt: number;
}

export interface ActivityLog {
  id: string;
  type: 'login' | 'post' | 'comment' | 'message' | 'friend_connect' | 'vote' | 'system' | 'moderation';
  title: string;
  userId?: string;
  userName?: string;
  userHandle?: string;
  action?: string;
  detail?: string;
  targetId?: string;
  targetName?: string;
  timestamp: number;
  meta?: Record<string, any>;
}

export type ActiveTab =
  | 'feed'
  | 'messenger'
  | 'directory'
  | 'people'
  | 'terminal_ai'
  | 'bookmarks'
  | 'analytics'
  | 'profile'
  | 'settings';
