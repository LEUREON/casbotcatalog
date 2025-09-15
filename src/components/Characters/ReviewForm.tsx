import React, { useState, useRef, useEffect } from "react";
import { Loader2, Send } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useReviews } from "../../contexts/ReviewsContext";
import { useScrollLock } from "../../hooks/useScrollLock";

const TOKENS = {
  border: "rgba(255,255,255,0.12)",
  itemBg: "rgba(255,255,255,0.06)",
  itemBgActive: "rgba(255,255,255,0.10)",
  accent: "#f7cfe1",
};

interface ReviewFormProps {
  characterId: string;
  parentReviewId?: string;
  rootCommentId?: string;
  onSubmit: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function ReviewForm({
  characterId,
  parentReviewId,
  onSubmit,
  onCancel,
  autoFocus = false,
}: ReviewFormProps) {
  const { user } = useAuth();
  const { addReview } = useReviews(); 
  const { lockScroll, unlockScroll } = useScrollLock();
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

    // Блокируем прокрутку перед отправкой
    lockScroll();
    
    setIsLoading(true);
    setError(null);

    try {
      const success = await addReview({
        characterId: characterId,
        comment: comment,
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
      // Разблокируем прокрутку после завершения
      setTimeout(() => {
        unlockScroll();
      }, 0);
    }
  };

  if (!user) {
    return (
      <div 
        className="text-center p-4 rounded-xl border"
        style={{ borderColor: TOKENS.border, background: TOKENS.itemBg }}
      >
        <p className="text-sm text-slate-400">
          <button onClick={() => window.location.hash = "#/login"} className="text-accent font-semibold hover:underline">Войдите</button>, чтобы оставить комментарий
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-3">
      <img
        src={user.avatar || `https://ui-avatars.com/api/?name=${user.nickname}&background=random`}
        alt="Ваш аватар"
        className="w-10 h-10 rounded-full border border-white/20 mt-1 shrink-0"
      />
      <div className="flex-1">
        <div 
          className="rounded-2xl border transition-colors" 
          style={{ 
            borderColor: TOKENS.border, 
            background: TOKENS.itemBg,
            boxShadow: autoFocus ? `0 0 0 2px ${TOKENS.accent}` : 'none',
          }}
        >
          <textarea
            ref={textareaRef}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={parentReviewId ? "Написать ответ..." : "Написать комментарий..."}
            className="w-full bg-transparent p-3 outline-none resize-none text-sm text-slate-100 placeholder:text-slate-500"
            rows={1}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-end gap-2 mt-2">
          {onCancel && (
             <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg transition"
              >
                Отмена
              </button>
          )}
          <button
            type="submit"
            disabled={isLoading || comment.trim().length === 0}
            className="w-10 h-10 flex items-center justify-center rounded-full text-black transition disabled:opacity-50"
            style={{ background: TOKENS.accent }}
            aria-label="Отправить"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    </form>
  );
}