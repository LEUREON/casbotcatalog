// src/types/index.ts

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

export interface CharacterLink {
  label: string;
  url: string;
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
  category: string[];
  dominantColor?: string;
  links: CharacterLink[];
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
  subject?: string;
  content: string;
  isReadByAdmin: boolean;
  isReadByUser: boolean;
  createdAt: Date;
  updatedAt: Date;
  isTicket: boolean;
  parent?: string;
  files?: string[];
  expand?: {
    user_id?: User;
  };
}

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  type: 'reply' | 'status_change' | 'admin_reply' | 'new_message' | 'new_user_character' | 'like' | 'broadcast' | 'support_reply' | 'dislike';
  entityId: string;
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
  includeTags: string[];
  excludeTags: string[];
  includeCategories: string[];
  excludeCategories: string[];
}