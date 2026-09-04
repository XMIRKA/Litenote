import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile as updateAuthProfile
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  increment,
  deleteField,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import {
  UserProfile,
  Post,
  Comment,
  Conversation,
  Message,
  Friendship,
  Follow,
  NotificationItem,
  Bookmark,
  CallSession,
  DevTeamMember
} from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Test server connection as per skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client offline check:', error.message);
    }
  }
}
testConnection();

// Skill standard error handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Strips all undefined fields recursively to prevent Firestore write crashes.
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => (item !== null && typeof item === 'object' ? cleanFirestoreData(item) : item)) as any;
  }
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof Timestamp)) {
      result[key] = cleanFirestoreData(value);
    } else if (Array.isArray(value)) {
      result[key] = value
        .filter((item) => item !== undefined)
        .map((item) => (item !== null && typeof item === 'object' ? cleanFirestoreData(item) : item));
    } else {
      result[key] = value;
    }
  }
  return result;
}

// -------------------------------------------------------------
// Real-time Firestore API Helpers
// -------------------------------------------------------------

// Check if a handle/username is already in use by another user
export async function checkHandleAvailable(handle: string, excludeUid?: string): Promise<boolean> {
  const clean = handle.trim().replace(/^@/, '').toLowerCase();
  if (!clean) return false;
  try {
    const q = query(collection(db, 'users'), where('handle', '==', clean));
    const snap = await getDocs(q);
    if (snap.empty) return true;
    // If excludeUid is provided, check if the only match is the current user
    if (excludeUid) {
      return snap.docs.every((d) => d.id === excludeUid);
    }
    return false;
  } catch (error) {
    console.warn('Error checking handle availability:', error);
    return true; // Fallback to allowing if check fails
  }
}

// Users
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    const cleaned = cleanFirestoreData(profile);
    await setDoc(doc(db, 'users', profile.uid), cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeUsers(callback: (users: UserProfile[]) => void) {
  const path = 'users';
  return onSnapshot(
    collection(db, 'users'),
    (snap) => {
      const list: UserProfile[] = [];
      snap.forEach((d) => list.push(d.data() as UserProfile));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Posts
export function subscribePosts(callback: (posts: Post[]) => void) {
  const path = 'posts';
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snap) => {
      const list: Post[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createPostDoc(post: Post): Promise<void> {
  const path = `posts/${post.id}`;
  try {
    const cleaned = cleanFirestoreData(post);
    await setDoc(doc(db, 'posts', post.id), cleaned);
    // increment author stats
    await updateDoc(doc(db, 'users', post.authorId), {
      'stats.postsCount': increment(1),
    }).catch(() => {});
    // log activity
    await logActivity('post_create', `New post by @${post.authorHandle}`, post.authorId, post.authorName);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function togglePostReaction(postId: string, emoji: string, userId: string): Promise<void> {
  const path = `posts/${postId}`;
  try {
    const postRef = doc(db, 'posts', postId);
    const snap = await getDoc(postRef);
    if (!snap.exists()) return;
    const postData = snap.data() as Post;
    const reactions = { ...(postData.reactions || {}) };

    const hadThisEmoji = (reactions[emoji] || []).includes(userId);

    // Filter out user from ALL emoji reactions on this post (max 1 reaction per user)
    for (const [key, userList] of Object.entries(reactions)) {
      reactions[key] = (userList || []).filter((id) => id !== userId);
      if (reactions[key].length === 0) {
        delete reactions[key];
      }
    }

    // If the user didn't already have this reaction, add it now
    if (!hadThisEmoji) {
      reactions[emoji] = [...(reactions[emoji] || []), userId];
    }

    await updateDoc(postRef, { reactions });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePostDoc(postId: string, authorId: string): Promise<void> {
  const path = `posts/${postId}`;
  try {
    await deleteDoc(doc(db, 'posts', postId));
    await updateDoc(doc(db, 'users', authorId), {
      'stats.postsCount': increment(-1),
    }).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Comments
export function subscribeComments(postId: string, callback: (comments: Comment[]) => void) {
  const path = `comments`;
  const q = query(collection(db, 'comments'), where('postId', '==', postId));
  return onSnapshot(
    q,
    (snap) => {
      const list: Comment[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createCommentDoc(comment: Comment): Promise<void> {
  const path = `comments/${comment.id}`;
  try {
    const cleaned = cleanFirestoreData(comment);
    await setDoc(doc(db, 'comments', comment.id), cleaned);
    await updateDoc(doc(db, 'posts', comment.postId), {
      commentsCount: increment(1),
    }).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCommentDoc(commentId: string, postId: string): Promise<void> {
  const path = `comments/${commentId}`;
  try {
    await deleteDoc(doc(db, 'comments', commentId));
    await updateDoc(doc(db, 'posts', postId), {
      commentsCount: increment(-1),
    }).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Conversations & Messages
export function subscribeConversations(userId: string, callback: (convs: Conversation[]) => void) {
  const path = 'conversations';
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: Conversation[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createOrGetConversation(conv: Conversation): Promise<string> {
  const path = `conversations/${conv.id}`;
  try {
    const cleaned = cleanFirestoreData(conv);
    await setDoc(doc(db, 'conversations', conv.id), cleaned, { merge: true });
    return conv.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return conv.id;
  }
}

const CHUNK_SIZE = 200000;
const mediaCache = new Map<string, string>();

function getSessionCachedMedia(msgId: string): string | null {
  try {
    return sessionStorage.getItem(`media_${msgId}`);
  } catch (e) {
    return null;
  }
}

function setSessionCachedMedia(msgId: string, data: string): void {
  try {
    if (data && data.length < 5000000) {
      sessionStorage.setItem(`media_${msgId}`, data);
    }
  } catch (e) {}
}

export async function fetchMessageMedia(convId: string, messageId: string): Promise<string> {
  if (mediaCache.has(messageId)) {
    return mediaCache.get(messageId)!;
  }
  const sessionData = getSessionCachedMedia(messageId);
  if (sessionData) {
    mediaCache.set(messageId, sessionData);
    return sessionData;
  }

  try {
    const chunkSnap = await getDocs(
      collection(db, 'conversations', convId, 'messages', messageId, 'chunks')
    );
    if (chunkSnap.empty) return '';

    const chunkList: { index: number; chunk: string }[] = [];
    chunkSnap.forEach((cd) => {
      const cdata = cd.data();
      if (cdata && typeof cdata.chunk === 'string') {
        chunkList.push({
          index: typeof cdata.index === 'number' ? cdata.index : 0,
          chunk: cdata.chunk,
        });
      }
    });
    chunkList.sort((a, b) => a.index - b.index);
    const assembled = chunkList.map((c) => c.chunk).join('');
    if (assembled) {
      mediaCache.set(messageId, assembled);
      setSessionCachedMedia(messageId, assembled);
      return assembled;
    }
  } catch (err) {
    console.warn('Error fetching message media chunks:', err);
  }
  return '';
}

export function subscribeMessages(convId: string, callback: (messages: Message[]) => void) {
  const path = `conversations/${convId}/messages`;
  const q = query(
    collection(db, 'conversations', convId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(100)
  );
  return onSnapshot(
    q,
    async (snap) => {
      const list: Message[] = [];
      const pendingChunkFetches: Promise<void>[] = [];

      snap.forEach((d) => {
        const msg = { id: d.id, ...(d.data() as any) } as Message;
        if (msg.isChunked && !msg.mediaUrl) {
          const cached = mediaCache.get(msg.id) || getSessionCachedMedia(msg.id);
          if (cached) {
            msg.mediaUrl = cached;
          } else {
            const p = fetchMessageMedia(convId, msg.id).then((assembled) => {
              if (assembled) {
                msg.mediaUrl = assembled;
              }
            });
            pendingChunkFetches.push(p);
          }
        } else if (msg.mediaUrl) {
          mediaCache.set(msg.id, msg.mediaUrl);
          setSessionCachedMedia(msg.id, msg.mediaUrl);
        }
        list.push(msg);
      });

      // Immediate first emission
      callback(list);

      // If any chunked messages were assembled asynchronously, notify with hydrated list
      if (pendingChunkFetches.length > 0) {
        await Promise.all(pendingChunkFetches);
        const updatedList = list.map((m) => {
          const cached = mediaCache.get(m.id) || getSessionCachedMedia(m.id);
          if (cached) {
            return { ...m, mediaUrl: cached };
          }
          return { ...m };
        });
        callback(updatedList);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function sendMessageDoc(convId: string, message: Message): Promise<void> {
  const path = `conversations/${convId}/messages/${message.id}`;
  try {
    const rawMedia = message.mediaUrl || '';
    // If rawMedia is longer than 200k chars, chunk it to stay well within Firestore doc limits
    const shouldChunk = rawMedia.length > 200000;

    let mediaUrlToStore = rawMedia;
    let isChunked = false;
    let totalChunks = 0;

    if (rawMedia) {
      mediaCache.set(message.id, rawMedia);
      setSessionCachedMedia(message.id, rawMedia);
    }

    if (shouldChunk) {
      isChunked = true;
      const chunks: string[] = [];
      for (let i = 0; i < rawMedia.length; i += CHUNK_SIZE) {
        chunks.push(rawMedia.substring(i, i + CHUNK_SIZE));
      }
      totalChunks = chunks.length;
      mediaUrlToStore = ''; // Main document remains compact and lightweight

      // Write chunks in controlled batches
      try {
        const chunkWrites = chunks.map((chunk, index) =>
          setDoc(
            doc(db, 'conversations', convId, 'messages', message.id, 'chunks', `chunk_${index}`),
            { index, chunk }
          )
        );
        await Promise.all(chunkWrites);
      } catch (chunkErr) {
        console.warn('Chunk write warning:', chunkErr);
      }
    }

    const cleaned = cleanFirestoreData({
      ...message,
      mediaUrl: mediaUrlToStore,
      isChunked: isChunked ? true : undefined,
      totalChunks: totalChunks > 0 ? totalChunks : undefined,
      read: message.read ?? false,
      status: message.status || 'sent',
      readBy: message.readBy || [message.senderId],
    });
    await setDoc(doc(db, 'conversations', convId, 'messages', message.id), cleaned);
    
    // Prepare preview snippet
    let previewText = message.text || 'Вложение';
    if (message.type === 'voice') previewText = '🎤 Голосовое сообщение';
    if (message.type === 'video_note' || message.type === 'video') previewText = '📹 Видеосообщение';
    if (message.type === 'call') previewText = message.callInfo?.callType === 'video' ? '📹 Видеозвонок' : '📞 Аудиозвонок';
    if (message.type === 'file') previewText = `📎 ${message.fileName || 'Файл'}`;
    if (message.type === 'image') previewText = '🖼 Фото';

    await setDoc(
      doc(db, 'conversations', convId),
      {
        lastMessage: {
          text: previewText,
          senderId: message.senderId,
          senderName: message.senderName,
          createdAt: message.createdAt,
          type: message.type,
        },
        updatedAt: message.createdAt,
      },
      { merge: true }
    ).catch(() => {});
  } catch (error) {
    console.error('sendMessageDoc write caught error:', error);
    // Still keep in local cache so sender sees it
    if (message.mediaUrl) {
      mediaCache.set(message.id, message.mediaUrl);
      setSessionCachedMedia(message.id, message.mediaUrl);
    }
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function markConversationMessagesReadDoc(
  convId: string,
  userId: string,
  unreadMessageIds: string[]
): Promise<void> {
  if (!convId || !userId || !unreadMessageIds || unreadMessageIds.length === 0) return;
  try {
    const updates = unreadMessageIds.map((msgId) => {
      const msgRef = doc(db, 'conversations', convId, 'messages', msgId);
      return updateDoc(msgRef, {
        read: true,
        status: 'read',
        readBy: arrayUnion(userId),
      }).catch((e) => console.warn('Message read sync error:', e));
    });
    const convRef = doc(db, 'conversations', convId);
    const convUpdate = updateDoc(convRef, {
      [`unreadCount.${userId}`]: 0,
    }).catch(() => {});
    await Promise.all([...updates, convUpdate]);
  } catch (error) {
    console.warn('markConversationMessagesReadDoc error:', error);
  }
}

export async function deleteMessageForMeDoc(convId: string, messageId: string, userId: string): Promise<void> {
  const path = `conversations/${convId}/messages/${messageId}`;
  try {
    const msgRef = doc(db, 'conversations', convId, 'messages', messageId);
    await updateDoc(msgRef, {
      deletedFor: arrayUnion(userId),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteMessageForEveryoneDoc(convId: string, messageId: string): Promise<void> {
  const path = `conversations/${convId}/messages/${messageId}`;
  try {
    // Also delete any stored chunks
    const chunksSnap = await getDocs(collection(db, 'conversations', convId, 'messages', messageId, 'chunks')).catch(() => null);
    if (chunksSnap && !chunksSnap.empty) {
      const deletes = chunksSnap.docs.map((d) => deleteDoc(d.ref).catch(() => {}));
      await Promise.all(deletes);
    }
    await deleteDoc(doc(db, 'conversations', convId, 'messages', messageId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteMessageDoc(convId: string, messageId: string): Promise<void> {
  return deleteMessageForEveryoneDoc(convId, messageId);
}

export async function clearConversationMessagesDoc(convId: string): Promise<void> {
  const path = `conversations/${convId}/messages`;
  try {
    const snap = await getDocs(collection(db, 'conversations', convId, 'messages'));
    const deletes = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletes);

    // Reset last message on conversation
    await updateDoc(doc(db, 'conversations', convId), {
      lastMessage: {
        text: 'История переписки очищена',
        senderId: 'system',
        createdAt: Date.now(),
        type: 'system',
      },
      pinnedMessageId: deleteField(),
      pinnedMessage: deleteField(),
      updatedAt: Date.now(),
    }).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteConversationDoc(convId: string): Promise<void> {
  const path = `conversations/${convId}`;
  try {
    // Delete all messages inside
    const snap = await getDocs(collection(db, 'conversations', convId, 'messages'));
    const deletes = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletes);

    // Delete conversation document
    await deleteDoc(doc(db, 'conversations', convId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// Group & Channel Administration
// -------------------------------------------------------------
export async function updateGroupInfoDoc(
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
): Promise<void> {
  const path = `conversations/${convId}`;
  try {
    const cleaned = cleanFirestoreData(updates);
    await updateDoc(doc(db, 'conversations', convId), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function addGroupMembersDoc(convId: string, newMembers: UserProfile[]): Promise<void> {
  const path = `conversations/${convId}`;
  try {
    if (!newMembers || newMembers.length === 0) return;
    const convRef = doc(db, 'conversations', convId);
    const snap = await getDoc(convRef);
    if (!snap.exists()) return;
    const conv = snap.data() as Conversation;

    const updatedParticipants = Array.from(
      new Set([...(conv.participants || []), ...newMembers.map((m) => m.uid)])
    );

    const updatedDetails = { ...(conv.participantDetails || {}) };
    newMembers.forEach((m) => {
      updatedDetails[m.uid] = {
        displayName: m.displayName,
        handle: m.handle,
        avatarUrl: m.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.handle}`,
        status: m.status || 'online',
      };
    });

    await updateDoc(convRef, {
      participants: updatedParticipants,
      participantDetails: updatedDetails,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeGroupMemberDoc(convId: string, memberUid: string): Promise<void> {
  const path = `conversations/${convId}`;
  try {
    const convRef = doc(db, 'conversations', convId);
    const snap = await getDoc(convRef);
    if (!snap.exists()) return;
    const conv = snap.data() as Conversation;

    const updatedParticipants = (conv.participants || []).filter((id) => id !== memberUid);
    const updatedAdmins = (conv.admins || []).filter((id) => id !== memberUid);
    const updatedDetails = { ...(conv.participantDetails || {}) };
    delete updatedDetails[memberUid];

    await updateDoc(convRef, {
      participants: updatedParticipants,
      admins: updatedAdmins,
      participantDetails: updatedDetails,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleGroupAdminDoc(convId: string, memberUid: string, isAdmin: boolean): Promise<void> {
  const path = `conversations/${convId}`;
  try {
    const convRef = doc(db, 'conversations', convId);
    if (isAdmin) {
      await updateDoc(convRef, {
        admins: arrayUnion(memberUid),
      });
    } else {
      await updateDoc(convRef, {
        admins: arrayRemove(memberUid),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------
// Official LiteNote Dev Team Management
// -------------------------------------------------------------
export function subscribeDevTeam(callback: (members: DevTeamMember[]) => void) {
  const path = 'dev_team';
  return onSnapshot(
    collection(db, 'dev_team'),
    (snap) => {
      const list: DevTeamMember[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      callback(list);
    },
    (error) => {
      console.warn('Dev team subscription error:', error);
    }
  );
}

export async function addDevTeamMemberDoc(member: DevTeamMember): Promise<void> {
  const path = `dev_team/${member.id}`;
  try {
    const cleaned = cleanFirestoreData(member);
    await setDoc(doc(db, 'dev_team', member.id), cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeDevTeamMemberDoc(memberId: string): Promise<void> {
  const path = `dev_team/${memberId}`;
  try {
    await deleteDoc(doc(db, 'dev_team', memberId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function pinMessageDoc(convId: string, message: Message | null): Promise<void> {
  const path = `conversations/${convId}`;
  try {
    if (message) {
      await updateDoc(doc(db, 'conversations', convId), {
        pinnedMessageId: message.id,
        pinnedMessage: cleanFirestoreData(message),
      });
    } else {
      await updateDoc(doc(db, 'conversations', convId), {
        pinnedMessageId: deleteField(),
        pinnedMessage: deleteField(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleMessageReactionDoc(
  convId: string,
  messageId: string,
  emoji: string,
  userId: string
): Promise<void> {
  const path = `conversations/${convId}/messages/${messageId}`;
  try {
    const msgRef = doc(db, 'conversations', convId, 'messages', messageId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return;
    const msg = snap.data() as Message;
    const reactions = { ...(msg.reactions || {}) };
    const existingList = Array.isArray(reactions[emoji]) ? reactions[emoji] : [];

    let updatedList: string[];
    if (existingList.includes(userId)) {
      updatedList = existingList.filter((id) => id !== userId);
    } else {
      updatedList = [...existingList, userId];
    }

    if (updatedList.length > 0) {
      reactions[emoji] = updatedList;
    } else {
      delete reactions[emoji];
    }

    await updateDoc(msgRef, { reactions });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Friendships & Follows
export function subscribeFriendships(userId: string, callback: (friends: Friendship[]) => void) {
  const path = 'friendships';
  const q = query(
    collection(db, 'friendships'),
    where('status', 'in', ['pending', 'accepted'])
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: Friendship[] = [];
      snap.forEach((d) => {
        const data = d.data() as Friendship;
        if (data.requesterId === userId || data.recipientId === userId) {
          list.push({ id: d.id, ...data });
        }
      });
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function sendFriendRequestDoc(friendship: Friendship): Promise<void> {
  const path = `friendships/${friendship.id}`;
  try {
    await setDoc(doc(db, 'friendships', friendship.id), friendship);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateFriendshipStatusDoc(friendshipId: string, status: 'accepted' | 'declined'): Promise<void> {
  const path = `friendships/${friendshipId}`;
  try {
    await updateDoc(doc(db, 'friendships', friendshipId), {
      status,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeFollows(userId: string, callback: (follows: Follow[]) => void) {
  const path = 'follows';
  const q = query(collection(db, 'follows'), where('followerId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const list: Follow[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function toggleFollowDoc(followerId: string, followingId: string, isFollowing: boolean): Promise<void> {
  const followId = `fol_${followerId}_${followingId}`;
  const path = `follows/${followId}`;
  try {
    if (isFollowing) {
      await deleteDoc(doc(db, 'follows', followId));
      await updateDoc(doc(db, 'users', followerId), { 'stats.followingCount': increment(-1) }).catch(() => {});
      await updateDoc(doc(db, 'users', followingId), { 'stats.followersCount': increment(-1) }).catch(() => {});
    } else {
      await setDoc(doc(db, 'follows', followId), {
        id: followId,
        followerId,
        followingId,
        createdAt: Date.now(),
      });
      await updateDoc(doc(db, 'users', followerId), { 'stats.followingCount': increment(1) }).catch(() => {});
      await updateDoc(doc(db, 'users', followingId), { 'stats.followersCount': increment(1) }).catch(() => {});
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Notifications
export function subscribeNotifications(userId: string, callback: (items: NotificationItem[]) => void) {
  const path = 'notifications';
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(30)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: NotificationItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createNotificationDoc(notif: NotificationItem): Promise<void> {
  const path = `notifications/${notif.id}`;
  try {
    await setDoc(doc(db, 'notifications', notif.id), notif);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function markNotificationReadDoc(notifId: string): Promise<void> {
  const path = `notifications/${notifId}`;
  try {
    await updateDoc(doc(db, 'notifications', notifId), { isRead: true, read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markAllNotificationsReadDoc(userId: string): Promise<void> {
  const path = 'notifications';
  try {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const updates = snap.docs.map((d) => updateDoc(d.ref, { isRead: true, read: true }));
    await Promise.all(updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function startDirectConversationDoc(
  user1: UserProfile,
  user2: UserProfile
): Promise<string> {
  const sortedIds = [user1.uid, user2.uid].sort();
  const convId = `conv_${sortedIds[0]}_${sortedIds[1]}`;
  const path = `conversations/${convId}`;

  try {
    const convRef = doc(db, 'conversations', convId);
    const snap = await getDoc(convRef);
    if (!snap.exists()) {
      const newConv: Conversation = {
        id: convId,
        type: 'direct',
        participants: [user1.uid, user2.uid],
        participantDetails: {
          [user1.uid]: {
            displayName: user1.displayName,
            handle: user1.handle,
            avatarUrl: user1.avatarUrl,
            status: user1.status || 'online',
          },
          [user2.uid]: {
            displayName: user2.displayName,
            handle: user2.handle,
            avatarUrl: user2.avatarUrl,
            status: user2.status || 'online',
          },
        },
        updatedAt: Date.now(),
        unreadCount: {
          [user1.uid]: 0,
          [user2.uid]: 0,
        },
      };
      await setDoc(convRef, newConv);
    }
    return convId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return convId;
  }
}

export async function createGroupConversationDoc(
  creator: UserProfile,
  groupName: string,
  members: UserProfile[],
  options?: { description?: string; avatarUrl?: string; type?: 'group' | 'channel' }
): Promise<string> {
  const convId = `conv_grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `conversations/${convId}`;
  const allMembers = [creator, ...members.filter((m) => m.uid !== creator.uid)];
  const participantIds = allMembers.map((m) => m.uid);

  const participantDetails: Record<string, any> = {};
  const unreadCount: Record<string, number> = {};
  allMembers.forEach((m) => {
    participantDetails[m.uid] = {
      displayName: m.displayName,
      handle: m.handle,
      avatarUrl: m.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${m.handle}`,
      status: m.status || 'online',
    };
    unreadCount[m.uid] = 0;
  });

  const newConv: Conversation = {
    id: convId,
    type: options?.type || 'group',
    ownerId: creator.uid,
    admins: [creator.uid],
    name: groupName,
    avatarUrl:
      options?.avatarUrl ||
      `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(groupName)}`,
    description: options?.description || '',
    participants: participantIds,
    participantDetails,
    updatedAt: Date.now(),
    unreadCount,
    lastMessage: {
      text: `${creator.displayName} создал(а) ${options?.type === 'channel' ? 'канал' : 'группу'} "${groupName}"`,
      senderId: creator.uid,
      senderName: creator.displayName,
      createdAt: Date.now(),
      type: 'text',
    },
  };

  try {
    const cleaned = cleanFirestoreData(newConv);
    await setDoc(doc(db, 'conversations', convId), cleaned);
    return convId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return convId;
  }
}

// Bookmarks
export function subscribeBookmarks(userId: string, callback: (bookmarks: Bookmark[]) => void) {
  const path = 'bookmarks';
  const q = query(collection(db, 'bookmarks'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const list: Bookmark[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      callback(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function toggleBookmarkDoc(userId: string, postId: string, isBookmarked: boolean): Promise<void> {
  const bookmarkId = `bm_${userId}_${postId}`;
  const path = `bookmarks/${bookmarkId}`;
  try {
    if (isBookmarked) {
      await deleteDoc(doc(db, 'bookmarks', bookmarkId));
      await updateDoc(doc(db, 'posts', postId), { bookmarksCount: increment(-1) }).catch(() => {});
    } else {
      await setDoc(doc(db, 'bookmarks', bookmarkId), {
        id: bookmarkId,
        userId,
        postId,
        createdAt: Date.now(),
      });
      await updateDoc(doc(db, 'posts', postId), { bookmarksCount: increment(1) }).catch(() => {});
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// Interactive Polls
// -------------------------------------------------------------
export async function votePollDoc(postId: string, optionIndex: number, userId: string): Promise<void> {
  const path = `posts/${postId}`;
  try {
    const postRef = doc(db, 'posts', postId);
    const snap = await getDoc(postRef);
    if (!snap.exists()) return;
    const postData = snap.data() as Post;
    if (!postData.poll || !postData.poll.options) return;

    const options = postData.poll.options.map((opt, idx) => {
      const voters = opt.voters || [];
      const hasVotedThis = voters.includes(userId);

      if (idx === optionIndex) {
        if (!hasVotedThis) {
          return {
            ...opt,
            votes: (opt.votes || 0) + 1,
            voters: [...voters, userId],
          };
        }
        return opt;
      } else {
        // Remove vote from previous option if any
        if (hasVotedThis) {
          return {
            ...opt,
            votes: Math.max(0, (opt.votes || 0) - 1),
            voters: voters.filter((id) => id !== userId),
          };
        }
        return opt;
      }
    });

    await updateDoc(postRef, {
      'poll.options': options,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------
// Real-time Traffic Analytics & Presence Tracking
// -------------------------------------------------------------
export interface ActiveSession {
  uid: string;
  displayName: string;
  handle: string;
  avatarUrl: string;
  lastActiveAt: number;
  device?: string;
}

export async function updateUserPresence(user: UserProfile): Promise<void> {
  if (!user?.uid) return;
  const path = `sessions/${user.uid}`;
  try {
    const sessionData: ActiveSession = {
      uid: user.uid,
      displayName: user.displayName || 'User',
      handle: user.handle || 'user',
      avatarUrl: user.avatarUrl || '',
      lastActiveAt: Date.now(),
      device: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop') : 'Web',
    };
    await setDoc(doc(db, 'sessions', user.uid), sessionData, { merge: true });
    // Also record daily traffic aggregation
    const today = new Date().toISOString().split('T')[0];
    await setDoc(
      doc(db, 'analytics', `traffic_${today}`),
      {
        date: today,
        timestamp: Date.now(),
        lastPing: Date.now(),
        totalVisits: increment(1),
      },
      { merge: true }
    ).catch(() => {});
  } catch (error) {
    // Non-blocking for presence
    console.warn('Presence sync:', error);
  }
}

export function subscribeActiveSessions(callback: (sessions: ActiveSession[]) => void) {
  const path = 'sessions';
  return onSnapshot(
    collection(db, 'sessions'),
    (snap) => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const list: ActiveSession[] = [];
      snap.forEach((d) => {
        const s = d.data() as ActiveSession;
        if (s.lastActiveAt && s.lastActiveAt >= fiveMinutesAgo) {
          list.push(s);
        }
      });
      callback(list);
    },
    (error) => {
      console.warn('Sessions subscribe error:', error);
    }
  );
}

export async function logActivity(
  type: string,
  title: string,
  userId?: string,
  userName?: string,
  meta?: Record<string, any>
): Promise<void> {
  const logId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const path = `activity_logs/${logId}`;
  try {
    await setDoc(doc(db, 'activity_logs', logId), {
      id: logId,
      type,
      title,
      userId: userId || null,
      userName: userName || 'Anonymous',
      timestamp: Date.now(),
      meta: meta || {},
    });
  } catch (error) {
    console.warn('Activity log write error:', error);
  }
}

export function subscribeActivityLogs(callback: (logs: any[]) => void) {
  const path = 'activity_logs';
  const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      callback(list);
    },
    (error) => {
      console.warn('Activity logs subscribe error:', error);
    }
  );
}

// -------------------------------------------------------------
// Synchronize User Nickname & Avatar to All Conversations
// -------------------------------------------------------------
export async function syncUserProfileToConversations(user: UserProfile): Promise<void> {
  if (!user?.uid) return;
  try {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid)
    );
    const snap = await getDocs(q);
    const updatePromises = snap.docs.map((docSnap) => {
      return updateDoc(docSnap.ref, {
        [`participantDetails.${user.uid}`]: {
          displayName: user.displayName,
          handle: user.handle,
          avatarUrl: user.avatarUrl,
          status: user.status || 'online',
        },
      }).catch((e) => console.warn('Sync conv participant error:', e));
    });
    await Promise.all(updatePromises);
  } catch (error) {
    console.warn('Error syncing profile to conversations:', error);
  }
}

// -------------------------------------------------------------
// Moderator & Administration Management
// -------------------------------------------------------------
export async function setUserPenaltyDoc(
  targetUserId: string,
  targetUserName: string,
  penalty: {
    type: 'mute' | 'ban';
    expiresAt: number;
    reason: string;
    issuedAt: number;
    issuedBy?: string;
    issuedByName?: string;
  }
): Promise<void> {
  const path = `users/${targetUserId}`;
  try {
    await updateDoc(doc(db, 'users', targetUserId), {
      penalty: cleanFirestoreData(penalty),
    });
    // Log moderation action
    await logActivity(
      'moderation',
      `[MOD ACTION] ${penalty.type.toUpperCase()} issued to @${targetUserName}`,
      penalty.issuedBy || 'moderator',
      penalty.issuedByName || 'Moderator',
      {
        penaltyType: penalty.type,
        reason: penalty.reason,
        expiresAt: penalty.expiresAt,
        targetUserId,
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeUserPenaltyDoc(
  targetUserId: string,
  targetUserName: string,
  moderatorId?: string,
  moderatorName?: string
): Promise<void> {
  const path = `users/${targetUserId}`;
  try {
    await updateDoc(doc(db, 'users', targetUserId), {
      penalty: null,
    });
    await logActivity(
      'moderation',
      `[MOD ACTION] Penalty removed for @${targetUserName}`,
      moderatorId || 'moderator',
      moderatorName || 'Moderator',
      { targetUserId }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteUserAccountDoc(
  targetUserId: string,
  targetUserName: string,
  moderatorId?: string,
  moderatorName?: string
): Promise<void> {
  const path = `users/${targetUserId}`;
  try {
    // Delete user profile doc
    await deleteDoc(doc(db, 'users', targetUserId));
    // Remove active session
    await deleteDoc(doc(db, 'sessions', targetUserId)).catch(() => {});
    // Log moderation action
    await logActivity(
      'moderation',
      `[MOD ACTION] User account deleted: @${targetUserName}`,
      moderatorId || 'moderator',
      moderatorName || 'Moderator',
      { targetUserId, targetUserName }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// Realtime Audio / Video Calling & WebRTC Signaling
// -------------------------------------------------------------
export async function createCallDoc(call: CallSession): Promise<void> {
  const path = `calls/${call.id}`;
  try {
    const cleaned = cleanFirestoreData(call);
    await setDoc(doc(db, 'calls', call.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCallDoc(callId: string, updates: Partial<CallSession>): Promise<void> {
  const path = `calls/${callId}`;
  try {
    const cleaned = cleanFirestoreData(updates);
    await updateDoc(doc(db, 'calls', callId), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeActiveCall(callId: string, callback: (call: CallSession | null) => void) {
  const path = `calls/${callId}`;
  return onSnapshot(
    doc(db, 'calls', callId),
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...(snap.data() as any) } as CallSession);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.warn('Call subscription snapshot error:', error);
    }
  );
}

export function subscribeIncomingCalls(userId: string, callback: (calls: CallSession[]) => void) {
  const path = 'calls';
  // Listen for direct ringing calls for this user
  const qDirect = query(
    collection(db, 'calls'),
    where('calleeId', '==', userId),
    where('status', '==', 'ringing')
  );

  // Also listen for group calls where user is in participants list and not caller
  const qGroup = query(
    collection(db, 'calls'),
    where('participants', 'array-contains', userId),
    where('status', '==', 'ringing')
  );

  let directCalls: CallSession[] = [];
  let groupCalls: CallSession[] = [];

  const emitCombined = () => {
    const combined = [...directCalls, ...groupCalls.filter((g) => g.callerId !== userId)];
    const unique = Array.from(new Map(combined.map((c) => [c.id, c])).values());
    callback(unique);
  };

  const unsubDirect = onSnapshot(
    qDirect,
    (snap) => {
      directCalls = [];
      snap.forEach((d) => directCalls.push({ id: d.id, ...(d.data() as any) } as CallSession));
      emitCombined();
    },
    (error) => {
      console.warn('Incoming direct calls subscription error:', error);
    }
  );

  const unsubGroup = onSnapshot(
    qGroup,
    (snap) => {
      groupCalls = [];
      snap.forEach((d) => groupCalls.push({ id: d.id, ...(d.data() as any) } as CallSession));
      emitCombined();
    },
    (error) => {
      console.warn('Incoming group calls subscription error:', error);
    }
  );

  return () => {
    unsubDirect();
    unsubGroup();
  };
}

export async function addCallCandidateDoc(
  callId: string,
  candidate: RTCIceCandidateInit,
  isCaller: boolean
): Promise<void> {
  const path = `calls/${callId}`;
  try {
    const field = isCaller ? 'callerCandidates' : 'calleeCandidates';
    const plainCandidate = {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex,
    };
    await updateDoc(doc(db, 'calls', callId), {
      [field]: arrayUnion(plainCandidate),
    });
  } catch (error) {
    // Non-blocking for candidate exchange
    console.warn('Candidate add error:', error);
  }
}


