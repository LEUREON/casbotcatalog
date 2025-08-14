// project/src/pages/CharacterPage.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useReviews } from '../contexts/ReviewsContext';
import { Character, Review, UserCharacter } from '../types';
import { pb } from '../lib/pocketbase';
import { Loader2, Star, MessageSquare, Heart, Clock, XCircle, CheckCircle, ArrowLeft, ExternalLink, Venus, Mars, CakeSlice } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getAgeString } from '../utils/formatters';
import { ReviewForm } from '../components/Characters/ReviewForm';
import { ReviewCard } from '../components/Characters/ReviewCard';

type ReviewTreeNode = Review & { replies: ReviewTreeNode[] };

export function CharacterPage() {
  const { characterId: id } = useParams<{ characterId: string }>();
  const { users, loadUsers, toggleFavorite } = useData();
  const { reviews, addReview, toggleReviewLike, toggleReviewDislike } = useReviews();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [character, setCharacter] = useState<Character | UserCharacter | null>(null);
  const [characterLoading, setCharacterLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [favoriteStatus, setFavoriteStatus] = useState(false);
  const [isUserCharacter, setIsUserCharacter] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  const characterReviews = useMemo(() => reviews.filter(review => review.characterId === id), [reviews, id]);
  const ratedReviews = useMemo(() => characterReviews.filter(r => r.rating && r.rating > 0), [characterReviews]);
  const averageRating = useMemo(() => ratedReviews.length > 0 ? (ratedReviews.reduce((sum, r) => sum + r.rating!, 0) / ratedReviews.length).toFixed(1) : 'Нет оценок', [ratedReviews]);

  const { commentTree, totalTopLevelCount } = useMemo(() => {
    const reviewsMap = new Map<string, ReviewTreeNode>(characterReviews.map(r => [r.id, { ...r, replies: [] }]));
    const topLevel: ReviewTreeNode[] = [];

    for (const review of characterReviews) {
      if (review.parentReview && reviewsMap.has(review.parentReview)) {
        reviewsMap.get(review.parentReview)!.replies.push(reviewsMap.get(review.id)!);
      } else {
        topLevel.push(reviewsMap.get(review.id)!);
      }
    }
    
    topLevel.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    reviewsMap.forEach(node => node.replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));

    return { commentTree: topLevel.slice(0, visibleCount), totalTopLevelCount: topLevel.length };
  }, [characterReviews, visibleCount]);

  const fetchCharacter = useCallback(async () => {
    setCharacterLoading(true);
    setError(null);
    try {
      const rec = await pb.collection('characters').getOne(id!, { "$autoCancel": false });
      setCharacter({ ...rec, id: rec.id, createdAt: new Date(rec.created), tags: rec.tags || [], links: rec.links || [] });
      setIsUserCharacter(false);
    } catch (e) {
      try {
        const userRec = await pb.collection('user_characters').getOne(id!, { "$autoCancel": false });
        setCharacter({ ...userRec, id: userRec.id, createdAt: new Date(userRec.created), tags: userRec.tags || [], links: userRec.links || [], status: userRec.status });
        setIsUserCharacter(true);
      } catch (err) { setError('Персонаж не найден или недоступен.'); setCharacter(null); }
    } finally { setCharacterLoading(false); }
  }, [id]);

  useEffect(() => { if (id) fetchCharacter(); if (users.length === 0) loadUsers(); }, [id, fetchCharacter, users.length, loadUsers]);
  useEffect(() => { if (user) { const userRev = characterReviews.filter(r => r.userId === user.id && r.rating).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]; if (userRev?.rating) setUserRating(userRev.rating); } }, [characterReviews, user]);
  useEffect(() => { if (user && character) setFavoriteStatus(user.favorites?.includes(character.id) || false); }, [user, character]);
  
  const handleToggleFavorite = async () => { if (!user || !character) return; await toggleFavorite(character.id); setFavoriteStatus(prev => !prev); };
  const handleRatingSubmit = async (rating: number) => { if (!user || !character) return; setIsRatingSubmitting(true); const success = await addReview({ characterId: character.id, rating: rating, comment: "" }); if (success) setUserRating(rating); setIsRatingSubmitting(false); };

  if (characterLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-16 w-16 text-purple-400 animate-spin" /></div>;
  if (error || !character) return <div className="min-h-screen flex items-center justify-center p-4"><div className="glass rounded-3xl p-8 border border-red-500/20 text-center"><XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" /><h2 className="text-2xl font-bold text-white mb-2">{error ? "Ошибка" : "Не найдено"}</h2><p className="text-slate-400">{error || 'Персонаж не найден.'}</p><button onClick={() => navigate(-1)} className="mt-6 px-6 py-3 bg-slate-700/50 text-white rounded-xl">Назад</button></div></div>;
  
  const userChar = character as UserCharacter;
  const isApproved = isUserCharacter && userChar.status === 'approved';
  const isOwner = user && isUserCharacter && userChar.createdBy === user.id;
  const isLoggedIn = !!user;

  if (isUserCharacter && !isApproved && !isOwner && !isAdmin) return <div className="min-h-screen flex items-center justify-center p-4"><div className="glass rounded-3xl p-8 border border-orange-500/20 text-center"><Clock className="h-16 w-16 text-orange-400 mx-auto mb-4" /><h2 className="text-2xl font-bold text-white mb-2">Персонаж ожидает одобрения</h2></div></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen p-4 lg:p-8">
      <div className="max-w-4xl mx-auto glass rounded-3xl border border-white/10 overflow-hidden shadow-xl">
        <div className="relative h-64 bg-slate-900"><img src={character.photo} alt={character.name} className="w-full h-full object-cover opacity-60"/><div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div><button onClick={() => navigate(-1)} className="absolute top-6 left-6 p-3 bg-black/30 backdrop-blur-lg border border-white/10 text-slate-300 hover:text-white rounded-full z-20"><ArrowLeft className="h-6 w-6" /></button><div className="absolute bottom-0 left-0 p-6 flex items-end w-full"><img src={character.photo} alt={character.name} className="w-32 h-32 rounded-2xl object-cover border-4 border-slate-700 shadow-lg shrink-0"/><div className="ml-6 flex-grow"><h1 className="text-4xl font-extrabold text-white">{character.name}</h1><p className="text-purple-300 text-lg font-semibold">{character.occupation}</p></div></div>{isLoggedIn && <div className="absolute top-6 right-6"><button onClick={handleToggleFavorite} className={`p-3 rounded-full transition-all ${favoriteStatus ? 'bg-red-500/80 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}><Heart className="h-5 w-5" fill={favoriteStatus ? 'currentColor' : 'none'} /></button></div>}</div>
        <div className="p-6 lg:p-8 space-y-8">
          {isUserCharacter && (userChar.status === 'pending' || userChar.status === 'rejected') && (isOwner || isAdmin) && (<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="p-4 bg-orange-500/20 border border-orange-500/30 text-orange-300 rounded-xl text-sm flex items-center space-x-2">{userChar.status === 'pending' ? <Clock className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}<span>Статус: <span className="font-bold">{userChar.status === 'pending' ? 'Ожидает' : 'Отклонен'}</span>.</span></motion.div>)}
          <div className="glass-light rounded-xl p-6 border border-white/10"><h3 className="text-xl font-bold text-white mb-4">Общая информация</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-white"><div className="flex items-center space-x-3"><Star className="h-5 w-5 text-yellow-400 fill-yellow-400 shrink-0" /><span className="font-semibold">Рейтинг:</span><span>{averageRating} / 5</span></div><div className="flex items-center space-x-3">{character.gender === 'male' ? <Mars className="h-5 w-5 text-blue-400 shrink-0" /> : <Venus className="h-5 w-5 text-pink-400 shrink-0" />}<span className="font-semibold">Пол:</span><span>{character.gender === 'male' ? 'Мужской' : 'Женский'}</span></div><div className="flex items-center space-x-3"><CakeSlice className="h-5 w-5 text-green-400 shrink-0" /><span className="font-semibold">Возраст:</span><span>{getAgeString(character.age)} ({character.ageGroup})</span></div></div>{character.tags?.length > 0 && (<><div className="border-t border-white/10 my-4"></div><div className="flex flex-wrap gap-2">{character.tags.map(tag => <span key={tag} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">{tag}</span>)}</div></>)}</div>
          {character.links?.length > 0 && (<div className="space-y-3">{character.links.map(link => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500/10 text-white rounded-xl hover:bg-blue-500/20 transition-all font-semibold border border-blue-500/20"><ExternalLink className="h-5 w-5" /><span>{link.label || "Ссылка"}</span></a>)}</div>)}
          <div><h2 className="text-xl font-bold text-white mb-3">Описание</h2><p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{character.fullDescription || character.description}</p></div>
          
          <div className="border-t border-white/10 pt-8 mt-8"><div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold text-white">Отзывы ({characterReviews.length})</h2>{isLoggedIn && <button onClick={() => setShowReviewForm(!showReviewForm)} className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 transition-all"><MessageSquare className="h-4 w-4" /><span>{showReviewForm ? 'Скрыть' : 'Комментировать'}</span></button>}</div>
            {isLoggedIn && (<div className="glass-light p-4 rounded-xl mb-6 border border-white/10"><h3 className="text-lg font-bold text-white text-center mb-3">{userRating > 0 ? 'Ваша оценка' : 'Оцените персонажа'}</h3><div className="flex justify-center space-x-2 mb-2">{[1,2,3,4,5].map(star => <button key={star} onClick={() => handleRatingSubmit(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} disabled={isRatingSubmitting} className="disabled:opacity-50"><Star className={`w-8 h-8 transition-all ${(hoverRating||userRating) >= star ? 'text-yellow-400 fill-current scale-110' : 'text-slate-600'}`} /></button>)}</div>{isRatingSubmitting && <p className="text-center text-sm text-slate-400 animate-pulse">Сохранение...</p>}</div>)}
            <AnimatePresence>{showReviewForm && <motion.div initial={{y:-20,opacity:0}} animate={{y:0,opacity:1}} exit={{y:-20,opacity:0}} className="mb-6"><ReviewForm characterId={character.id} onSubmit={() => setShowReviewForm(false)} /></motion.div>}</AnimatePresence>
            {commentTree.length > 0 ? (<div className="space-y-4">{commentTree.map(review => <ReviewCard key={review.id} review={review} characterId={character.id} replies={review.replies} />)}{totalTopLevelCount > visibleCount && (<div className="pt-4 text-center"><button onClick={() => setVisibleCount(p => p + 20)} className="px-6 py-2 glass rounded-xl font-semibold bg-white/5 text-white hover:bg-white/10">Показать еще</button></div>)}</div>) : (<p className="text-slate-400 text-center py-8">Пока нет ни одного комментария.</p>)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}