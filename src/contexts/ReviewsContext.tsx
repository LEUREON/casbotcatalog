// project/src/contexts/ReviewsContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { pb } from '../lib/pocketbase';
import { Review, User } from '../types';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';

const formatUser = (model: any): User => ({ id: model.id, username: model.username, nickname: model.nickname, email: model.email, role: model.role, avatar: model.avatar ? pb.getFileUrl(model, model.avatar) : undefined, createdAt: new Date(model.created), isBlocked: model.is_blocked || false, favorites: model.favorites || [] });

const formatReview = (record: any): Review => {
    const formatted: Review = { ...record, id: record.id, createdAt: new Date(record.created), characterId: record.character_id, userId: record.user_id, userName: record.user_name, rating: record.rating, comment: record.comment, parentReview: record.parent_review, likesBy: record.expand?.likes_by?.map((u:any) => u.id) || [], dislikesBy: record.expand?.dislikes_by?.map((u:any) => u.id) || [] };
    if (record.expand?.user_id) formatted.author = formatUser(record.expand.user_id);
    return formatted;
};

interface ReviewsContextType {
  reviews: Review[];
  loading: boolean;
  loadReviews: () => Promise<void>;
  addReview: (review: Partial<Omit<Review, 'id' | 'createdAt' | 'userId' | 'userName' | 'author'>>) => Promise<boolean>;
  toggleReviewLike: (reviewId: string) => Promise<void>;
  toggleReviewDislike: (reviewId: string) => Promise<void>;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addNotification, loadCharacters, loadNotifications } = useData();

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const reviewRecords = await pb.collection('reviews').getFullList({ 
        sort: '-created', 
        expand: 'user_id,likes_by,dislikes_by',
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
      const dataForDatabase: { [key: string]: any } = { character_id: reviewData.characterId, user_id: user.id, user_name: user.nickname, comment: reviewData.comment };
      if (reviewData.rating && reviewData.rating > 0) dataForDatabase.rating = reviewData.rating;
      if (reviewData.parentReview) dataForDatabase.parent_review = reviewData.parentReview;

      await pb.collection('reviews').create(dataForDatabase);
      
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
      
      await loadReviews();
      if (dataForDatabase.rating) {
        await loadCharacters();
      }
      return true;
    } catch (e) {
      console.error("Error adding review:", e);
      return false;
    }
  }, [user, reviews, loadReviews, addNotification, loadCharacters]);

  const toggleReviewLike = useCallback(async (reviewId: string) => {
    if (!user) return;
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;

    const isCurrentlyLiked = review.likesBy?.includes(user.id);

    const newLikes = isCurrentlyLiked
      ? review.likesBy.filter(id => id !== user.id)
      : [...(review.likesBy || []), user.id];
    const newDislikes = review.dislikesBy?.filter(id => id !== user.id) || [];
    
    await pb.collection('reviews').update(reviewId, { likes_by: newLikes, dislikes_by: newDislikes });

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
      await loadNotifications(); // Обновляем список уведомлений
    }

    await loadReviews();
  }, [user, reviews, loadReviews, addNotification, loadNotifications]);

  const toggleReviewDislike = useCallback(async (reviewId: string) => {
    if (!user) return;
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;
    
    const isCurrentlyDisliked = review.dislikesBy?.includes(user.id);

    const newDislikes = isCurrentlyDisliked
      ? review.dislikesBy.filter(id => id !== user.id)
      : [...(review.dislikesBy || []), user.id];
    const newLikes = review.likesBy?.filter(id => id !== user.id) || [];
    
    await pb.collection('reviews').update(reviewId, { likes_by: newLikes, dislikes_by: newDislikes });
    
    // Уведомления о дизлайках обычно не отправляют, чтобы не поощрять негатив,
    // но если вы хотите их добавить, раскомментируйте код ниже.
    
    if (!isCurrentlyDisliked && review.userId !== user.id) {
      await addNotification({
        recipientId: review.userId,
        senderId: user.id,
        senderName: user.nickname,
        type: 'dislike', // Потребуется добавить этот тип в схему и типы
        entityId: review.characterId,
        message: `негативно оценил ваш комментарий: "${review.comment.slice(0, 30)}..."`,
        isRead: false,
      });
      await loadNotifications();
    }
    

    await loadReviews();
  }, [user, reviews, loadReviews, addNotification, loadNotifications]);

  const value = { reviews, loading, loadReviews, addReview, toggleReviewLike, toggleReviewDislike };

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
}

export const useReviews = () => {
  const context = useContext(ReviewsContext);
  if (!context) throw new Error('useReviews must be used within a ReviewsProvider');
  return context;
};