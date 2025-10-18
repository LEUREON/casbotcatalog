// src/components/Characters/ReviewForm.tsx
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useReviews } from "../../contexts/ReviewsContext";

interface ReviewFormProps {
  characterId: string;
  parentReviewId?: string;
  replyToName?: string;
  onSubmit: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function ReviewForm({ characterId, parentReviewId, replyToName, onSubmit, onCancel, autoFocus = false }: ReviewFormProps) {
  const { user } = useAuth();
  const { addReview } = useReviews();
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [comment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim().length === 0 || !user) return;

    setIsLoading(true);
    setError(null);

    const commentToSend = replyToName ? `@${replyToName} ${comment.trim()}` : comment.trim();

    try {
      const success = await addReview({
        characterId: characterId,
        comment: commentToSend,
        parentReview: parentReviewId,
      });

      if (success) {
        setComment("");
        onSubmit();
      } else {
        setError("Не удалось опубликовать комментарий.");
      }
    } catch (err) {
      setError("Произошла ошибка.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-3">
      <img
        src={user.avatar || `https://ui-avatars.com/api/?name=${user.nickname}&background=random`}
        alt="Ваш аватар"
        className="w-10 h-10 rounded-full border-2 border-default mt-1 shrink-0"
      />
      <div className="flex-1">
        <div className="rounded-xl border border-default bg-item focus-within:ring-2 focus-within:ring-accent-primary transition-all overflow-hidden">
          <textarea
            ref={textareaRef}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={replyToName ? `Ответ пользователю ${replyToName}...` : "Что вы думаете?"}
            className="w-full bg-transparent p-3 outline-none resize-none text-sm text-text-primary placeholder:text-text-muted max-h-40"
            rows={1}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-end gap-2 mt-2">
          {onCancel && (
             <motion.button type="button" onClick={onCancel} disabled={isLoading} className="px-4 py-2 text-xs font-semibold text-text-muted hover:text-text-primary rounded-lg transition-colors" whileTap={{ scale: 0.95 }}>Отмена</motion.button>
          )}
          <motion.button
            type="submit"
            disabled={isLoading || comment.trim().length === 0}
            className="w-10 h-10 flex items-center justify-center rounded-full text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-button"
            style={{ background: `linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))` }}
            whileTap={{ scale: 0.95 }}
            aria-label="Отправить"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </motion.button>
        </div>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    </form>
  );
}
