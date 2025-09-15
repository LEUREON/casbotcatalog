// project/src/contexts/ReviewsContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { pb } from '../lib/pocketbase';
import { Review, User } from '../types';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';

const formatUser = (model: any): User => ({ id: model.id, username: model.username, nickname: model.nickname, email: model.email, role: model.role, avatar: model.avatar ? pb.getFileUrl(model, model.avatar) : undefined, createdAt: new Date(model.created), isBlocked: model.is_blocked || false, favorites: model.favorites || [] });

const formatReview = (record: any): Review => {
    const formatted: Review = { 
      ...record, 
      id: record.id, 
      createdAt: new Date(record.created), 
      characterId: record.character_id, 
      userId: record.user_id, 
      userName: record.userName, 
      rating: record.rating, 
      comment: record.comment, 
      parentReview: record.parentReview, 
      likesBy: record.expand?.likesBy?.map((u:any) => u.id) || [], 
      dislikesBy: record.expand?.dislikesBy?.map((u:any) => u.id) || [] 
    };
    if (record.expand?.user_id) formatted.author = formatUser(record.expand.user_id);
    return formatted;
};

interface ReviewsContextType {
  reviews: Review[];
  loading: boolean;
  loadReviews: () => Promise<void>;
  addReview: (review: Partial<Omit<Review, 'id' | 'createdAt' | 'userId' | 'userName' | 'author'>>) => Promise<boolean>;
  updateReview: (reviewId: string, updates: Partial<Review>) => Promise<boolean>; // Убедимся, что это здесь
  toggleReviewLike: (reviewId: string) => Promise<void>;
  toggleReviewDislike: (reviewId: string) => Promise<void>;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  // ▼▼▼ ИЗМЕНЕНИЕ 1: loadCharacters здесь больше не нужен, убираем его ▼▼▼
  const { addNotification, loadNotifications } = useData();

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const reviewRecords = await pb.collection('reviews').getFullList({ 
        sort: '-created', 
        expand: 'user_id,likesBy,dislikesBy',
        '$autoCancel': false
      });
      setReviews(reviewRecords.map(formatReview));
    } catch (error) {
      console.error("Failed to reload reviews:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const addReview = useCallback(async (reviewData: Partial<Omit<Review, 'id' | 'createdAt' | 'userId' | 'userName' | 'author'>>) => {
    if (!user) return false;
    try {
      const dataForDatabase: { [key: string]: any } = { character_id: reviewData.characterId, user_id: user.id, userName: user.nickname, comment: reviewData.comment };
      if (reviewData.rating && reviewData.rating > 0) dataForDatabase.rating = reviewData.rating;
      if (reviewData.parentReview) dataForDatabase.parentReview = reviewData.parentReview; 

      const newRecord = await pb.collection('reviews').create(dataForDatabase, {
        expand: 'user_id,likesBy,dislikesBy'
      });
      const formattedNewReview = formatReview(newRecord);
      setReviews(prev => [formattedNewReview, ...prev]);
      
      if (reviewData.parentReview && reviewData.characterId) {
        const parentReview = reviews.find(r => r.id === reviewData.parentReview);
        if (parentReview && parentReview.userId !== user.id) {
          await addNotification({
            recipientId: parentReview.userId,
            senderId: user.id,
            senderName: user.nickname,
            type: 'reply',
            entityId: reviewData.characterId,
            message: `ответил на ваш комментарий: "${parentReview.comment.slice(0, 30)}..."`,
            isRead: false
          });
        }
      }
      
      // ▼▼▼ ИЗМЕНЕНИЕ 2: Эта строка удалена. Она вызывала сброс скролла. ▼▼▼
      // if (dataForDatabase.rating) {
      //   await loadCharacters();
      // }
      // ▲▲▲ КОНЕЦ ИЗМЕНЕНИЯ 2 ▲▲▲
      
      return true;
    } catch (e) {
      console.error("Error adding review:", e);
      return false;
    }
  }, [user, reviews, addNotification]); // loadCharacters удален из зависимостей

  
  const updateReview = useCallback(async (reviewId: string, updates: Partial<Review>) => {
    const originalReviews = [...reviews]; 
    let originalReview: Review | undefined;

    setReviews(prev => prev.map(r => {
        if (r.id === reviewId) {
            originalReview = {...r}; 
            return { ...r, ...updates };
        }
        return r;
    }));

    try {
        await pb.collection('reviews').update(reviewId, updates);
        
        // ▼▼▼ ИЗМЕНЕНИЕ 3: Эта строка удалена. Она вызывала сброс скролла. ▼▼▼
        // if (updates.rating !== undefined) {
        //     await loadCharacters();
        // }
        // ▲▲▲ КОНЕЦ ИЗМЕНЕНИЯ 3 ▲▲▲
        return true;

    } catch (error) {
        console.error("Failed to update review (reverting):", error);
        setReviews(originalReviews); 
        return false;
    }
  }, [reviews]); // loadCharacters удален из зависимостей


  // (toggleReviewLike и toggleReviewDislike остаются оптимистичными)
  const toggleReviewLike = useCallback(async (reviewId: string) => {
    if (!user) return;
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;
    const originalLikes = review.likesBy || [];
    const originalDislikes = review.dislikesBy || [];
    const isCurrentlyLiked = originalLikes.includes(user.id);
    const newLikes = isCurrentlyLiked ? originalLikes.filter(id => id !== user.id) : [...originalLikes, user.id];
    const newDislikes = originalDislikes.filter(id => id !== user.id); 
    setReviews(prevReviews => prevReviews.map(r => r.id === reviewId ? { ...r, likesBy: newLikes, dislikesBy: newDislikes } : r));
    (async () => {
      try {
        await pb.collection('reviews').update(reviewId, { likesBy: newLikes, dislikesBy: newDislikes }); 
        if (!isCurrentlyLiked && review.userId !== user.id) {
          await addNotification({
            recipientId: review.userId,
            senderId: user.id,
            senderName: user.nickname,
            type: 'like',
            entityId: review.characterId,
            message: `оценил ваш комментарий: "${review.comment.slice(0, 30)}..."`,
            isRead: false,
          });
          await loadNotifications(); 
        }
      } catch (error) {
        console.error("Failed to update like status (reverting):", error);
        setReviews(prevReviews => prevReviews.map(r => r.id === reviewId ? { ...r, likesBy: originalLikes, dislikesBy: originalDislikes } : r));
      }
    })();
  }, [user, reviews, addNotification, loadNotifications]);

  const toggleReviewDislike = useCallback(async (reviewId: string) => {
    if (!user) return;
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;
    const originalLikes = review.likesBy || [];
    const originalDislikes = review.dislikesBy || [];
    const isCurrentlyDisliked = originalDislikes.includes(user.id);
    const newDislikes = isCurrentlyDisliked ? originalDislikes.filter(id => id !== user.id) : [...originalDislikes, user.id];
    const newLikes = originalLikes.filter(id => id !== user.id); 
    setReviews(prevReviews => prevReviews.map(r => r.id === reviewId ? { ...r, likesBy: newLikes, dislikesBy: newDislikes } : r));
    (async () => {
        try {
            await pb.collection('reviews').update(reviewId, { likesBy: newLikes, dislikesBy: newDislikes }); 
            if (!isCurrentlyDisliked && review.userId !== user.id) {
              await addNotification({
                recipientId: review.userId,
                senderId: user.id,
                senderName: user.nickname,
                type: 'dislike', 
                entityId: review.characterId,
                message: `негативно оценил ваш комментарий: "${review.comment.slice(0, 30)}..."`,
                isRead: false,
              });
              await loadNotifications(); 
            }
        } catch (error) {
            console.error("Failed to update dislike status (reverting):", error);
             setReviews(prevReviews => prevReviews.map(r => r.id === reviewId ? { ...r, likesBy: originalLikes, dislikesBy: originalDislikes } : r));
        }
    })();
  }, [user, reviews, addNotification, loadNotifications]);

  const value = { reviews, loading, loadReviews, addReview, updateReview, toggleReviewLike, toggleReviewDislike };

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
}

export const useReviews = () => {
  const context = useContext(ReviewsContext);
  if (!context) throw new Error('useReviews must be used within a ReviewsProvider');
  return context;
};