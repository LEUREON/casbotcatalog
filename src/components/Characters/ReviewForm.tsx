// project/src/components/Characters/ReviewForm.tsx

import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

interface ReviewFormProps {
  characterId: string;
  onSubmit: () => void;
  parentReviewId?: string;
  onCancel?: () => void;
}

export function ReviewForm({ characterId, onSubmit, parentReviewId, onCancel }: ReviewFormProps) {
  const { addReview } = useData();
  const { user } = useAuth();
  const [newReview, setNewReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleReviewSubmit = async () => {
    if (!newReview.trim()) {
        setError("Пожалуйста, напишите комментарий.");
        setTimeout(() => setError(""), 3000);
        return;
    }
    if (!user) {
        setError("Нужно войти, чтобы оставить отзыв.");
        setTimeout(() => setError(""), 3000);
        return;
    }
    
    setIsSubmitting(true);
    const reviewData: {
        characterId: string;
        comment: string;
        parentReview?: string;
    } = {
        characterId: characterId,
        comment: newReview,
    };
    
    if (parentReviewId) {
        reviewData.parentReview = parentReviewId;
    }

    const success = await addReview(reviewData);

    if (success) {
        setNewReview("");
        onSubmit();
    } else {
        setError("Не удалось отправить отзыв.");
        setTimeout(() => setError(""), 3000);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="glass-light p-4 rounded-xl border border-white/10">
        <textarea 
            value={newReview} 
            onChange={(e) => setNewReview(e.target.value)} 
            rows={3} 
            className="w-full px-4 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all resize-none custom-scrollbar" 
            placeholder={parentReviewId ? "Напишите ваш ответ..." : "Напишите комментарий..."}
        />
        <div className="flex justify-end items-center mt-2 space-x-2">
            {error && <span className="text-xs text-red-400 mr-auto">{error}</span>}
            
            {onCancel && (
                <button 
                    onClick={onCancel} 
                    className="flex items-center space-x-1 px-4 py-2 text-slate-300 rounded-lg hover:bg-slate-700/50 transition-all text-sm font-semibold"
                >
                    <X className="h-4 w-4" />
                    <span>Отмена</span>
                </button>
            )}

            <button 
                onClick={handleReviewSubmit} 
                disabled={isSubmitting || !newReview.trim()} 
                className="flex items-center space-x-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all disabled:opacity-50 font-semibold text-sm"
            >
                <span>Отправить</span>
                <Send className="h-4 w-4" />
            </button>
        </div>
    </div>
  );
}