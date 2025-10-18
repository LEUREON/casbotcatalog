// src/contexts/ReviewsContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { pb } from '../lib/pocketbase';
import { Review, User } from '../types';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import { toast } from 'sonner'; // --- НОВЫЙ КОД ---

// Helper functions
const formatUser = (model: any): User => ({
  id: model.id,
  username: model.username,
  nickname: model.nickname,
  email: model.email,
  role: model.role,
  avatar: model.avatar ? pb.getFileUrl(model, model.avatar) : undefined,
  createdAt: new Date(model.created),
  isBlocked: model.is_blocked || false,
  favorites: model.favorites || [],
});
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
    likesBy: record.expand?.likesBy?.map((u: any) => u.id) || [],
    dislikesBy: record.expand?.dislikesBy?.map((u: any) => u.id) || [],
  };
  if (record.expand?.user_id) formatted.author = formatUser(record.expand.user_id);
  return formatted;
};

interface ReviewsContextType {
  reviews: Review[];
  loading: boolean;
  addReview: (
    review: Partial<
      Omit<Review, 'id' | 'createdAt' | 'userId' | 'userName' | 'author'>
    >,
  ) => Promise<boolean>;
  updateReview: (reviewId: string, updates: Partial<Review>) => Promise<boolean>;
  toggleReviewLike: (reviewId: string) => Promise<void>;
  toggleReviewDislike: (reviewId: string) => Promise<void>;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addNotification, loadNotifications } = useData();
  const isFetching = useRef(false);

  const loadReviews = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    try {
      const records = await pb.collection('reviews').getFullList({
        sort: '-created',
        expand: 'user_id,likesBy,dislikesBy',
        $autoCancel: false,
      });
      setReviews(records.map(formatReview));
    } catch (error: any) { // --- ИЗМЕНЕНО ---
      if (!(error as any).isAbort) {
        console.error('Failed to reload reviews:', error);
        toast.error('Не удалось загрузить комментарии', { // --- НОВЫЙ КОД ---
          description: error.message,
        });
      }
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const addReview = useCallback(
    async (reviewData: any) => {
      if (!user) return false;
      try {
        const dataToCreate = {
          user_id: user.id,
          userName: user.nickname,
          character_id: reviewData.characterId,
          comment: reviewData.comment,
          parentReview: reviewData.parentReview,
          rating: reviewData.rating,
        };

        const record = await pb
          .collection('reviews')
          .create(dataToCreate, { expand: 'user_id,likesBy,dislikesBy' });

        const newReview = formatReview(record);
        setReviews((prev) => [newReview, ...prev]);

        if (reviewData.parentReview) {
          const parentReview = reviews.find(
            (r) => r.id === reviewData.parentReview,
          );
          if (parentReview && parentReview.userId !== user.id) {
            await addNotification({
              recipientId: parentReview.userId,
              senderId: user.id,
              senderName: user.nickname,
              type: 'reply',
              entityId: reviewData.characterId,
              message: `ответил на ваш комментарий: "${parentReview.comment.slice(
                0,
                30,
              )}..."`,
            });
          }
        }
        return true;
      } catch (e: any) { // --- ИЗМЕНЕНО ---
        console.error('Error adding review:', e);
        toast.error('Ошибка добавления комментария', { description: e.message }); // --- НОВЫЙ КОД ---
        return false;
      }
    },
    [user, reviews, addNotification],
  );

  const updateReview = useCallback(async (reviewId: string, updates: Partial<Review>) => {
    try {
      const updatedRecord = await pb
        .collection('reviews')
        .update(reviewId, updates, { expand: 'user_id,likesBy,dislikesBy' });
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? formatReview(updatedRecord) : r)),
      );
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const toggleReviewFeedback = useCallback(
    async (reviewId: string, type: 'like' | 'dislike') => {
      // --- ИЗМЕНЕНО --- (Добавлена проверка с toast)
      if (!user) {
        toast.error('Пожалуйста, войдите в систему, чтобы оценить.');
        return;
      }
      const review = reviews.find((r) => r.id === reviewId);
      if (!review) return;

      const originalReview = {
        ...review,
        likesBy: [...(review.likesBy || [])],
        dislikesBy: [...(review.dislikesBy || [])],
      };
      const likes = new Set(originalReview.likesBy);
      const dislikes = new Set(originalReview.dislikesBy);

      if (type === 'like') {
        likes.has(user.id) ? likes.delete(user.id) : likes.add(user.id);
        dislikes.delete(user.id);
      } else {
        dislikes.has(user.id) ? dislikes.delete(user.id) : dislikes.add(user.id);
        likes.delete(user.id);
      }

      const updatedReview = {
        ...review,
        likesBy: Array.from(likes),
        dislikesBy: Array.from(dislikes),
      };
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? updatedReview : r)),
      );

      try {
        await pb.collection('reviews').update(reviewId, {
          likesBy: updatedReview.likesBy,
          dislikesBy: updatedReview.dislikesBy,
        });
        if (review.userId !== user.id) {
          await addNotification({
            recipientId: review.userId,
            senderId: user.id,
            senderName: user.nickname,
            type: type,
            entityId: review.characterId,
            message: `${
              type === 'like' ? 'оценил' : 'негативно оценил'
            } ваш комментарий.`,
          });
          await loadNotifications();
        }
      } catch (error: any) { // --- ИЗМЕНЕНО --- (Блок catch полностью переписан)
        console.error(`Failed to toggle ${type}:`, error);

        // --- НОВЫЙ КОД ---
        // Проверяем на ошибку 404 (Not Found)
        if (error.status === 404) {
          toast.error('Этот комментарий, похоже, был удален.');
          // Удаляем "мертвый" отзыв из локального состояния
          setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        } else {
          // Откатываем оптимистичное обновление, если была другая ошибка
          toast.error('Не удалось оценить комментарий.');
          setReviews((prev) =>
            prev.map((r) => (r.id === reviewId ? originalReview : r)),
          );
        }
        // --- КОНЕЦ НОВОГО КОДА ---
      }
    },
    [user, reviews, addNotification, loadNotifications],
  );

  const toggleReviewLike = useCallback(
    (reviewId: string) => toggleReviewFeedback(reviewId, 'like'),
    [toggleReviewFeedback],
  );
  const toggleReviewDislike = useCallback(
    (reviewId: string) => toggleReviewFeedback(reviewId, 'dislike'),
    [toggleReviewFeedback],
  );

  const value = {
    reviews,
    loading,
    addReview,
    updateReview,
    toggleReviewLike,
    toggleReviewDislike,
  };
  return (
    <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>
  );
}

export const useReviews = () => {
  const context = useContext(ReviewsContext);
  if (!context) throw new Error('useReviews must be used within a ReviewsProvider');
  return context;
};