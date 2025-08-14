// project/src/types/index.ts

export enum LoginStatus {
  SUCCESS = 'SUCCESS',
  WRONG_CREDENTIALS = 'WRONG_CREDENTIALS',
  ERROR = 'ERROR',
}

export interface User {
  id: string;
  username: string;
  nickname: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
  avatar?: string;
  createdAt: Date;
  isBlocked: boolean;
  favorites?: string[];
}

export interface Character {
  id: string;
  name: string;
  occupation: string;
  description: string;
  fullDescription: string;
  photo: string;
  gender: 'male' | 'female';
  age: number;
  ageGroup: '18+' | '45+' | 'immortal';
  rating: number;
  reviewCount: number;
  isNew: boolean;
  createdAt: Date;
  createdBy: string;
  tags: string[];
  links: { label: string; url: string }[];
  dominantColor?: string;
}

export interface UserCharacter extends Character {
  status: 'pending' | 'approved' | 'rejected';
}

export interface Review {
  id: string;
  characterId: string;
  userId: string;
  userName: string;
  rating?: number;
  comment: string;
  createdAt: Date;
  author?: User; 
  likesBy?: string[];
  dislikesBy?: string[];
  parentReview?: string;
} 

export interface CharacterOrder {
  id: string;
  userId: string;
  userName: string;
  description: string;
  referenceImage?: string;
  paymentProof?: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  createdAt: Date;
  adminNotes?: string;
  customFields?: Record<string, any>;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
  actionButtons: { label: string; url: string }[];
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  subject?: string; // Сделаем необязательным, т.к. только у тикета есть тема
  content: string;
  isReadByAdmin: boolean;
  isReadByUser: boolean; // Новое поле
  createdAt: Date;
  updatedAt: Date;
  isTicket: boolean; // Новое поле
  parent?: string; // ID родительского сообщения/тикета
  files?: string[]; // Массив URL-адресов файлов
  expand?: {
    user_id?: User;
  };
}

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  // ▼▼▼ ИЗМЕНЕНИЕ: Добавляем 'support_reply' ▼▼▼
  type: 'reply' | 'status_change' | 'admin_reply' | 'new_order' | 'new_message' | 'new_user_character' | 'like' | 'broadcast' | 'support_reply';
  entityId: string; // Будет ID тикета (parent)
  message?: string;
  isRead: boolean;
  createdAt: Date;
  title?: string;
  content?: string;
  image?: string;
}

export interface Newsletter {
  id: string;
  title: string;
  content: string;
  image?: string;
  sentBy: string;
  status: 'draft' | 'sent';
  createdAt: Date;
  updatedAt: Date;
}

export interface FilterState {
  search: string;
  gender: 'all' | 'male' | 'female';
  ageGroup: 'all' | '18+' | '45+' | 'immortal';
  sortBy: 'rating' | 'newest' | 'name';
}