// src/components/Characters/ReviewCard.tsx
import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare as LucideMessageSquare, ChevronDown } from "lucide-react";
import type { Review } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import { useReviews } from "../../contexts/ReviewsContext";
import { ReviewForm } from "./ReviewForm";
import { motion, AnimatePresence } from "framer-motion";
import { ANIM } from "../../lib/animations";

const Icons = {
  ThumbsUp: (props: any) => <ThumbsUp size={14} {...props} />,
  ThumbsDown: (props: any) => <ThumbsDown size={14} {...props} />,
  MessageSquare: (props: any) => <LucideMessageSquare size={14} {...props} />,
  ChevronDown: (props: any) => <ChevronDown size={14} {...props} />,
};

type ReviewTreeNode = Review & { replies: ReviewTreeNode[], replyToName?: string };

interface ReviewCardProps {
  review: ReviewTreeNode;
  characterId: string;
}

export function ReviewCard({ review, characterId }: ReviewCardProps) {
  const { user } = useAuth();
  const { toggleReviewLike, toggleReviewDislike } = useReviews();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const author = review.author;
  const displayName = author?.nickname || review.userName;
  const avatarSrc = author?.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
  const hasLiked = user && review.likesBy?.includes(user.id);
  const hasDisliked = user && review.dislikesBy?.includes(user.id);

  const commentText = (review.replyToName ? review.comment.replace(`@${review.replyToName}`, '') : review.comment).trim();

  // Используем isRoot, чтобы различать фон у ответов и корневых комментариев
  const isReply = !!review.parentReview;

  const renderCardContent = () => (
    <div className={`rounded-xl border backdrop-blur-sm overflow-hidden ${isReply ? 'bg-reply' : 'bg-item'}`}>
        <div className="p-3.5">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-text-primary">{displayName}</span>
                {review.replyToName && (
                  <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent-primary/20 text-accent-primary border border-accent-primary/30">
                    Ответ для: {review.replyToName}
                  </div>
                )}
            </div>
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed text-text-secondary mt-1.5">{commentText || " "}</p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2.5 border-t border-default">
            <motion.button {...ANIM.buttonTap} onClick={() => toggleReviewLike(review.id)} disabled={!user} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors ${hasLiked ? 'bg-green-500/20 text-green-300' : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'}`}>
                <Icons.ThumbsUp /> <span>{review.likesBy?.length || 0}</span>
            </motion.button>
            <motion.button {...ANIM.buttonTap} onClick={() => toggleReviewDislike(review.id)} disabled={!user} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors ${hasDisliked ? 'bg-red-500/20 text-red-300' : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'}`}>
                <Icons.ThumbsDown /> <span>{review.dislikesBy?.length || 0}</span>
            </motion.button>
            {user && (
                <motion.button {...ANIM.buttonTap} onClick={() => setShowReplyForm(p => !p)} className="ml-auto flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 text-accent-primary hover:bg-white/10 hover:text-white transition-colors">
                    <Icons.MessageSquare /> <span>{showReplyForm ? "Отмена" : "Ответить"}</span>
                </motion.button>
            )}
        </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="flex space-x-3">
        <img src={avatarSrc} alt={displayName} className="w-10 h-10 rounded-full border-2 border-default flex-shrink-0 bg-item" />
        <div className="flex-1 min-w-0">
          {renderCardContent()}
          <AnimatePresence>
            {showReplyForm && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 overflow-hidden">
                <ReviewForm characterId={characterId} parentReviewId={review.id} replyToName={displayName} onSubmit={() => setShowReplyForm(false)} onCancel={() => setShowReplyForm(false)} autoFocus />
              </motion.div>
            )}
          </AnimatePresence>
          
          {review.replies && review.replies.length > 0 && (
            <motion.button 
              {...ANIM.buttonTap}
              onClick={() => setShowReplies(prev => !prev)} 
              className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-accent-primary transition-colors mt-3"
            >
              <motion.div animate={{ rotate: showReplies ? 180 : 0 }}><Icons.ChevronDown /></motion.div>
              {showReplies ? 'Скрыть ответы' : `Показать ответы (${review.replies.length})`}
            </motion.button>
          )}

        </div>
      </div>
      
      {/* ▼▼▼ ИЗМЕНЕНИЕ ЗДЕСЬ ▼▼▼ */}
      {/* Мы удаляем отступ 'pl-[52px]' и декоративную линию, чтобы ответы были на одном уровне */}
      <AnimatePresence>
        {showReplies && review.replies && review.replies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="pt-4 space-y-4 overflow-hidden" // Убрали 'pl-[52px]' и 'relative'
          >
            {/* Декоративная линия удалена */}
            {review.replies.map(reply => (
              <ReviewCard key={reply.id} review={reply as ReviewTreeNode} characterId={characterId} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {/* ▲▲▲ КОНЕЦ ИЗМЕНЕНИЯ ▲▲▲ */}
    </div>
  );
}