// src/components/Characters/ReviewCard.tsx

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Review } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useReviews } from '../../contexts/ReviewsContext'; // <-- ИЗМЕНЕНИЕ ЗДЕСЬ
import { ReviewForm } from './ReviewForm';
import { motion, AnimatePresence } from 'framer-motion';

type ReviewTreeNode = Review & { replies: ReviewTreeNode[] };

interface ReviewCardProps {
  review: ReviewTreeNode;
  characterId: string;
  replies: ReviewTreeNode[];
}

export function ReviewCard({ review, characterId, replies }: ReviewCardProps) {
    const { user } = useAuth();
    const { toggleReviewLike, toggleReviewDislike } = useReviews(); // <-- ИЗМЕНЕНИЕ ЗДЕСЬ
    const [showReplyForm, setShowReplyForm] = useState(false);
    
    const author = review.author;
    const displayName = author?.nickname || review.userName;
    const displaySeed = author?.username || review.userName; 
    
    const avatarSrc = author?.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(displaySeed)}`;

    const hasLiked = user ? review.likesBy?.includes(user.id) : false;
    const hasDisliked = user ? review.dislikesBy?.includes(user.id) : false;

    const handleLike = () => user && toggleReviewLike(review.id);
    const handleDislike = () => user && toggleReviewDislike(review.id);

    return (
        <div className="w-full">
            <div className="flex space-x-3 sm:space-x-4">
                <img 
                    src={avatarSrc} 
                    alt={displayName} 
                    className="w-10 h-10 rounded-full object-cover bg-slate-700 shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <div className="glass-light p-3 sm:p-4 rounded-xl border border-white/10">
                        <span className="font-bold text-white text-sm">{displayName}</span>
                        <p className="text-slate-300 mt-1 text-sm whitespace-pre-wrap break-words">{review.comment}</p>
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
                            parentReviewId={review.id}
                            onSubmit={() => setShowReplyForm(false)}
                            onCancel={() => setShowReplyForm(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            
            {replies.length > 0 && (
                <div className="pt-4 pl-4 sm:pl-6 md:pl-8 border-l-2 border-slate-800/50 ml-5 mt-4 space-y-4">
                    {replies.map(reply => <ReviewCard key={reply.id} review={reply} characterId={characterId} replies={reply.replies} />)}
                </div>
            )}
        </div>
    );
}