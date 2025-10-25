const API_BASE = {
  auth: 'https://functions.poehali.dev/b5c747e2-21c1-412e-9bde-8196cc6bf7a2',
  chats: 'https://functions.poehali.dev/f21d726a-a7e8-4613-b3e3-10f59691c0ae',
  messages: 'https://functions.poehali.dev/1b187ed0-99ba-4777-bb69-807b7a530eca',
  users: 'https://functions.poehali.dev/e2b786ab-c042-4798-91ea-833b3b56eaf6',
};

export const api = {
  auth: {
    register: async (username: string, password: string) => {
      const response = await fetch(API_BASE.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', username, password }),
      });
      return response.json();
    },
    login: async (username: string, password: string) => {
      const response = await fetch(API_BASE.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password }),
      });
      return response.json();
    },
  },
  users: {
    getStatus: async (userId: number) => {
      const response = await fetch(`${API_BASE.users}?user_id=${userId}`);
      return response.json();
    },
    updateStatus: async (userId: number, isOnline: boolean) => {
      const response = await fetch(API_BASE.users, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, is_online: isOnline }),
      });
      return response.json();
    },
  },
  chats: {
    getChats: async (userId: number) => {
      const response = await fetch(`${API_BASE.chats}?user_id=${userId}`);
      return response.json();
    },
    createChat: async (user1Id: number, user2Id: number) => {
      const response = await fetch(API_BASE.chats, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user1_id: user1Id, user2_id: user2Id }),
      });
      return response.json();
    },
  },
  messages: {
    getMessages: async (chatId: number) => {
      const response = await fetch(`${API_BASE.messages}?chat_id=${chatId}`);
      return response.json();
    },
    sendMessage: async (chatId: number, senderId: number, content: string, photoUrl?: string) => {
      const response = await fetch(API_BASE.messages, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, sender_id: senderId, content, photo_url: photoUrl }),
      });
      return response.json();
    },
    editMessage: async (messageId: number, content: string) => {
      const response = await fetch(API_BASE.messages, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: messageId, content }),
      });
      return response.json();
    },
    deleteMessage: async (messageId: number) => {
      const response = await fetch(`${API_BASE.messages}?message_id=${messageId}`, {
        method: 'DELETE',
      });
      return response.json();
    },
  },
};