export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api';
export const DEFAULT_GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? '';

export const STORAGE_KEYS = {
  token: 'intelliwheels-token',
  user: 'intelliwheels-user',
  chatSessions: 'intelliwheels-chat-sessions',
  theme: 'intelliwheels-theme',
  serviceMode: 'intelliwheels-service-mode',
};

export const CHAT_HISTORY_LIMIT = 40;
