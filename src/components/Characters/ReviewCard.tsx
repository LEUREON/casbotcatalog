// src/components/Characters/ReviewCard.tsx

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Review } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useReviews } from '../../contexts/ReviewsContext';
import { ReviewForm } from './ReviewForm';
import { motion, AnimatePresence } from 'framer-motion';

type ReviewTreeNode = Review & { replies: ReviewTreeNode[] };

interface ReviewCardProps {
  review: ReviewTreeNode;
  characterId: string;
  replies: ReviewTreeNode[];
  rootCommentId: string; 
}

const TOKENS = {
  border: "rgba(255,255,255,0.1)",
  itemBg: "rgba(255,255,255,0.04)",
  accent: "#f7cfe1", 
};

export function ReviewCard({ review, characterId, replies, rootCommentId }: ReviewCardProps) {
    const { user } = useAuth();
    const { toggleReviewLike, toggleReviewDislike } = useReviews();
    const [showReplyForm, setShowReplyForm] = useState(false);
    
    const [repliesExpanded, setRepliesExpanded] = useState(false);
    
    const author = review.author;
    const displayName = author?.nickname || review.userName;
    const displaySeed = author?.username || review.userName; 
    
    const avatarSrc = author?.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(displaySeed)}`;

    const hasLiked = user ? review.likesBy?.includes(user.id) : false;
    const hasDisliked = user ? review.dislikesBy?.includes(user.id) : false;

    const handleLike = () => user && toggleReviewLike(review.id);
    const handleDislike = () => user && toggleReviewDislike(review.id);

    const totalReplies = replies.length;
    const visibleReplies = repliesExpanded ? replies : replies.slice(0, 3);

    return (
        <div className="w-full">
            <div className="flex space-x-3 sm:space-x-4">
                <img 
                    src={avatarSrc} 
                    alt={displayName} 
                    className="w-10 h-10 rounded-full object-cover bg-slate-700 shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <div className="p-3 sm:p-4 rounded-xl border" style={{borderColor: TOKENS.border, background: TOKENS.itemBg}}>
                        <span className="font-bold text-white text-sm">{displayName}</span>
                        
                        {/* ▼▼▼ ИЗМЕНЕНИЕ ЗДЕСЬ: Разделяем @mention и текст комментария ▼▼▼ */}
                        {review.comment.startsWith('@') ? (
                          <>
                            {/* Рендерим @mention в своем теге <p> (или span block) */}
                            <p className="font-semibold text-pink-300 text-sm mt-1 mb-0.5"> 
                              {review.comment.split(' ')[0]}
                            </p>
                            {/* Рендерим остальной текст комментария */}
                            <p className="text-slate-300 text-sm whitespace-pre-wrap break-words">
                                {review.comment.substring(review.comment.indexOf(' ') + 1)}
                            </p>
                          </>
                        ) : (
                          // Обычный комментарий без @mention
                          <p className="text-slate-300 mt-1 text-sm whitespace-pre-wrap break-words">{review.comment}</p>
                        )}
                         {/* ▲▲▲ КОНЕЦ ИЗМЕНЕНИЯ ▲▲▲ */}
                    </div>
                    
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 pl-2 text-slate-400 text-xs">
                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-x-4">
                            <button onClick={handleLike} className={`flex items-center space-x-1 hover:text-white transition-colors ${hasLiked ? 'text-green-400' : ''}`}><ThumbsUp className="h-4 w-4" /><span>{review.likesBy?.length || 0}</span></button>
                            <button onClick={handleDislike} className={`flex items-center space-x-1 hover:text-white transition-colors ${hasDisliked ? 'text-red-400' : ''}`}><ThumbsDown className="h-4 w-4" /><span>{review.dislikesBy?.length || 0}</span></button>
                        </div>
                        {user && <button onClick={() => setShowReplyForm(p => !p)} className="flex items-center space-x-1 hover:text-white transition-colors"><MessageSquare className="h-4 w-4" /><span>{showReplyForm ? 'Отмена' : 'Ответить'}</span></button>}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showReplyForm && (
                    <motion.div 
                        initial={{y:-10,opacity:0}} 
                        animate={{y:0,opacity:1}} 
                        exit={{y:-10,opacity:0}} 
                        className="mt-2 ml-8 sm:ml-14"
                    >
                        <ReviewForm
                            characterId={characterId}
                            parentReviewId={rootCommentId} 
                            replyToName={displayName} 
                            onSubmit={() => setShowReplyForm(false)}
                            onCancel={() => setShowReplyForm(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            
            {visibleReplies.length > 0 && (
                <div className="pt-4 pl-4 sm:pl-6 md:pl-8 border-l-2 border-white/10 ml-5 mt-4 space-y-4">
                    {visibleReplies.map(reply => <ReviewCard key={reply.id} review={reply} characterId={characterId} replies={[]} rootCommentId={rootCommentId} />)}
                </div>
            )}
            {totalReplies > 3 && (
                 <button 
                    onClick={() => setRepliesExpanded(!repliesExpanded)}
                    className="ml-14 mt-3 text-sm font-semibold hover:text-white"
                    style={{color: TOKENS.accent}}
                 >
                    {repliesExpanded ? 'Скрыть ответы' : `Показать еще ${totalReplies - 3} отв.`}
                 </button>
            )}
        </div>
    );
}