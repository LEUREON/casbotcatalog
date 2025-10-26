// src/pages/CharacterPage.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, Variants } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { useReviews } from "../contexts/ReviewsContext";
import { pb } from "../lib/pocketbase";
import { getAgeString } from "../utils/formatters";
import { Review, Character } from "../types"; // ✅ 1. Импортируем Character
import ThemedBackground from "../components/common/ThemedBackground";
import { ReviewCard } from "../components/Characters/ReviewCard";
import { ReviewForm } from "../components/Characters/ReviewForm";
import { GlassPanel } from "../components/ui/GlassPanel";
import { InfoBadge } from "../components/ui/InfoBadge";
import { TagBadge } from "../components/ui/TagBadge";
import { StarRating } from "../components/ui/StarRating";
import {
  IconArrowLeft, IconHeart, IconMessageSquare,
  IconUser, IconCake, IconInfinity, IconLoader, IconChevronDown
} from '../components/ui/icons';
import { ANIM } from '../lib/animations';

// ✅ 2. Импортируем хук личных персонажей
import { useUserCharacters } from "../contexts/UserCharactersContext";

export function CharacterPage() {
  const navigate = useNavigate();
  const { characterId = "" } = useParams();
  const { user, toggleFavorite } = useAuth();
  const { characters, loading: dataLoading } = useData();
  const { reviews, addReview, updateReview, loading: reviewsLoading } = useReviews();

  // ✅ 3. Получаем личных персонажей
  const { userCharacters, loading: userCharsLoading } = useUserCharacters();

  const [localLoading, setLocalLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  // ❌ const [isFavorited, setIsFavorited] = useState(false); // УДАЛЕНО: Это вызывало ошибки
  const [showFavoritePulse, setShowFavoritePulse] = useState(false);
  const [visibleComments, setVisibleComments] = useState(15);
  const [noticeOpen, setNoticeOpen] = useState(false);

  
  const { scrollY } = useScroll();
  const bgIntensity = useTransform(scrollY, [0, 500], [0.35, 0.1]);
  const titleY = useTransform(scrollY, [0, 300], [0, -25]);
  const imageScale = useTransform(scrollY, [0, 200], [1, 1.05]);

  // ✅ 4. ГЛАВНОЕ ИСПРАВЛЕНИЕ:
  // Ищем персонажа СНАЧАЛА в публичном списке, ПОТОМ в личном.
  const character = useMemo(() => {
    // 1. Ищем в публичных
    const publicChar = characters.find((c) => c.id === characterId);
    if (publicChar) {
      return publicChar;
    }
    // 2. Если не нашли, ищем в личных (приводим к типу Character)
    const privateChar = userCharacters.find((c) => c.id === characterId) as Character | undefined;
    return privateChar;

  }, [characters, userCharacters, characterId]); // ✅ 5. Добавлены зависимости
  
  // ✅ 6. ИСПРАВЛЕНИЕ 'isFavorited':
  // Берем "избранное" напрямую из 'user', а не из локального стейта
  const isFavorited = useMemo(() => {
    if (!user || !character) return false;
    return user.favorites?.includes(character.id) || false;
  }, [user, character]);


  const { avgRating, reviewsCount } = useMemo(() => {
    const characterReviews = reviews.filter((r) => r.characterId === characterId && r.rating && r.rating > 0);
    if (characterReviews.length === 0) return { avgRating: 0, reviewsCount: 0 };
    const sum = characterReviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return { avgRating: sum / characterReviews.length, reviewsCount: characterReviews.length };
  }, [reviews, characterId]);

  useEffect(() => {
    // ✅ 7. Обновляем условие загрузки
    if (dataLoading || reviewsLoading || userCharsLoading) {
      setLocalLoading(true);
      return;
    }
    const setupPageData = async () => {
      if (user && character) {
        try {
          const userReview = await pb.collection("reviews").getFirstListItem(
            `character_id = "${characterId}" && user_id = "${user.id}"`,
            { requestKey: `user-rating-${characterId}-${user.id}` } 
          );
          setUserRating(userReview.rating || 0);
        } catch { setUserRating(0); }
        // ❌ setIsFavorited(user?.favorites?.includes(character.id) || false); // УДАЛЕНО
      }
      setLocalLoading(false);
    };
    setupPageData();
  }, [characterId, user, character, dataLoading, reviewsLoading, userCharsLoading]); // ✅ 8. Добавлена зависимость
    
  const handleToggleFavorite = async () => {
    if (!user || !character || isFavoriteLoading) return;
    setIsFavoriteLoading(true);
    await toggleFavorite(character.id);
    // ❌ setIsFavorited(!isFavorited); // УДАЛЕНО (isFavorited теперь из useMemo)
    setShowFavoritePulse(true);
    setTimeout(() => setShowFavoritePulse(false), 400);
    setIsFavoriteLoading(false);
  };

  const handleRate = useCallback(async (rating: number) => {
    if (!user) return;
    try {
      let existingReview;
      try { existingReview = await pb.collection("reviews").getFirstListItem(`character_id = "${characterId}" && user_id = "${user.id}"`); } catch {}
      if (existingReview) {
        await updateReview(existingReview.id, { rating });
      } else {
        await addReview({ characterId, rating, comment: "" } as any);
      }
      setUserRating(rating);
    } catch (error) { console.error("Failed to update rating:", error); }
  }, [user, characterId, updateReview, addReview]);
  
  const handleReviewSubmit = useCallback(() => {}, []);

  const characterReviews = useMemo(() => reviews.filter((r) => r.characterId === characterId && r.comment && r.comment.trim()), [reviews, characterId]);

  const reviewTree = useMemo(() => {
    type ReviewWithReplies = Review & { replies: ReviewWithReplies[], replyToName?: string };
    
    const reviewMap = new Map<string, ReviewWithReplies>(
        characterReviews.map(r => [r.id, { ...r, replies: [] }])
    );
    
    const topLevelReviews: ReviewWithReplies[] = [];
    
    for (const review of reviewMap.values()) {
        if (review.parentReview && reviewMap.has(review.parentReview)) {
            const parent = reviewMap.get(review.parentReview)!;
            review.replyToName = parent.author?.nickname || parent.userName;
            parent.replies.push(review);
        } else {
            topLevelReviews.push(review);
        }
    }

    const sortRepliesRecursive = (replyList: ReviewWithReplies[]) => {
        replyList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        for (const reply of replyList) {
            if (reply.replies.length > 1) {
                sortRepliesRecursive(reply.replies);
            }
        }
    }
    
    for (const review of reviewMap.values()) {
        if (review.replies.length > 1) {
            sortRepliesRecursive(review.replies);
        }
    }
    
    return topLevelReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [characterReviews]);
  
  // ✅ 9. Обновляем общую загрузку
  const pageIsLoading = dataLoading || reviewsLoading || userCharsLoading || localLoading;

  if (pageIsLoading || !character) {
      return <div>Загрузка...</div>
  }

  // (Далее весь код рендеринга JSX без изменений)
  // ...
  return (
    <div className="relative min-h-screen p-3 sm:p-5 font-body text-text-primary bg-dark">
      <ThemedBackground intensity={bgIntensity} />
      <motion.button {...ANIM.buttonTap} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} onClick={() => navigate(-1)} className="fixed top-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center bg-floating backdrop-blur-lg shadow-glass" aria-label="Назад">
        <IconArrowLeft />
      </motion.button>

      <motion.div initial="initial" animate="animate" variants={ANIM.fadeInUp() as Variants} className="relative z-10 w-full max-w-4xl mx-auto space-y-8">
        <motion.div style={{ scale: imageScale }} className="w-full aspect-square rounded-xl overflow-hidden relative shadow-2xl">
          <img src={character.photo} alt={character.name} className="w-full h-full object-cover" loading="lazy" />
        </motion.div>

        <motion.div variants={ANIM.fadeInUp(0.1) as Variants} className="space-y-6 text-center">
            <motion.h1 style={{ y: titleY }} className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight bg-gradient-to-r from-white via-accent-primary to-accent-secondary bg-clip-text text-transparent font-heading">{character.name}</motion.h1>
            <p className="text-xl sm:text-2xl font-medium text-text-secondary">{character.occupation}</p>
            <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto px-2 text-text-muted" style={{ lineHeight: "1.75" }}>{character.description}</p>
            <div className="flex flex-wrap justify-center gap-3 my-4">
                <InfoBadge icon={<IconUser />} text={character.gender === "male" ? "Мужчина" : "Женщина"} colorClass="bg-badge-male text-white" />
                <InfoBadge icon={character.ageGroup === "immortal" ? <IconInfinity /> : <IconCake />} text={character.ageGroup === "immortal" ? "Бессмертный" : getAgeString(character.age)} colorClass={character.ageGroup === "immortal" ? "bg-badge-immortal text-dark" : "bg-badge-age text-white"} />
            </div>
            {character.category && character.category.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2.5 my-2">
                <AnimatePresence>
                  {character.category.map((cat, i) => (
                    <motion.div key={cat} variants={ANIM.fadeInStagger(i * 0.05) as Variants} initial="initial" animate="animate"><TagBadge text={cat} isCategory /></motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
            {character.tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2.5 my-2">
                    <AnimatePresence>
                        {character.tags.map((tag, i) => (
                           <motion.div key={tag} variants={ANIM.fadeInStagger(i * 0.05) as Variants} initial="initial" animate="animate"><TagBadge text={tag} /></motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
            {user && (
                 <div className="flex justify-center mt-6">
                    <motion.button {...ANIM.buttonTap} animate={showFavoritePulse ? (ANIM.buttonPulse as any).animate : {}} transition={ANIM.buttonPulse.transition as any} onClick={handleToggleFavorite} disabled={isFavoriteLoading} aria-label={isFavorited ? "Удалить из избранного" : "Добавить в избранное"}
                        className={`inline-flex items-center gap-2.5 px-7 py-4 rounded-full font-bold text-sm relative transition-smooth ${isFavorited ? 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-button' : 'bg-accent-primary/10 text-text-primary border-2 border-accent-primary'}`}>
                        {isFavoriteLoading ? <IconLoader /> : <> <IconHeart filled={isFavorited} /> {isFavorited ? "В избранном" : "В избранное"} </>}
                    </motion.button>
                 </div>
            )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <GlassPanel delay={0.2}>
              <div className="flex flex-col items-center text-center space-y-3">
                <h4 className="text-xs uppercase tracking-widest text-text-muted">Общий рейтинг</h4>
                <div className="text-4xl font-extrabold text-star-filled">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</div>
                <StarRating value={avgRating} readOnly size={28} />
                <div className="text-xs text-text-muted">На основе {reviewsCount} {reviewsCount === 1 ? "оценки" : "оценок"}</div>
              </div>
            </GlassPanel>
            {user && (
              <GlassPanel delay={0.3}>
                <h2 className="text-lg font-bold mb-4 text-center text-text-primary">{userRating > 0 ? `💖 Ваша оценка` : "Поставьте оценку!"}</h2>
                <div className="flex justify-center"><StarRating value={userRating} onChange={handleRate} size={36} /></div>
              </GlassPanel>
            )}
        </div>


        {character.fullDescription && (<>
{/* ВАЖНО К ПРОЧТЕНИЮ — разворачиваемый жёлтый блок */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-4xl mx-auto"
        >
          <div
            className="rounded-xl border px-4 py-3 sm:px-5 sm:py-4"
            style={{
              background: "rgba(250, 204, 21, 0.10)", // yellow-400/10
              borderColor: "rgba(250, 204, 21, 0.45)", // yellow-400/45
              boxShadow: "0 8px 24px rgba(250, 204, 21, 0.05)",
              color: "rgb(253, 230, 138)" // text-yellow-200
            }}
          >
            <button
              type="button"
              onClick={() => setNoticeOpen((v) => !v)}
              aria-expanded={noticeOpen}
              className="w-full flex items-center justify-between gap-3 text-left"
            >
              <div className="flex items-center gap-3">
                {/* Треугольник с восклицательным знаком */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="17" r="1.2" fill="currentColor"/>
                </svg>
                <span className="font-bold tracking-wide text-sm sm:text-base uppercase">Важно к прочтению</span>
              </div>
              <span
                className={"transition-transform duration-200 inline-flex" + (noticeOpen ? " rotate-180" : "")}
                aria-hidden="true"
              >
                <IconChevronDown size={18} />
              </span>
            </button>

            <AnimatePresence initial={false}>
              {noticeOpen && (
                <motion.div
                  key="notice-content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 sm:pt-4 text-[15px] leading-relaxed prose prose-sm prose-invert max-w-none">
                    <p>&nbsp;- Данный сайт содержит материалы для лиц старше 18 лет.</p>
                    <p>&nbsp;- Все персонажи и описываемые события являются вымышленными.</p>
                    <p>&nbsp;- Любое совпадение с реальными людьми или событиями, является случайностью.</p>
                    <p>&nbsp;- В наших текстах может присутствовать нецензурная лексика, жестокие персонажи и употребление различных веществ.</p>
                    <p>&nbsp;- Мы предупреждаем о наличии сцен, которые могут быть травмирующими или оскорбительными для некоторых читателей.</p>
                    <p>&nbsp;- Контент несет исключительно развлекательный характер и не имеет цели кого-то задеть или оскорбить.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
</>)}

        {character.fullDescription && (<GlassPanel delay={0.4}>
         
          <h2 className="text-2xl font-bold mb-5 flex items-center justify-center gap-2 text-text-primary" style={{ background: "linear-gradient(120deg, #ffffff 0%, #d7aefb 50%, #ff6bd6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", color: "transparent", fontFamily: "var(--font-family-heading)", textShadow: "0 4px 12px rgba(0,0,0,0.2)"}}>
            📜 Описание
          </h2> 
            <div
              className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-h2:my-2 prose-h3:my-1"
              dangerouslySetInnerHTML={{ __html: character.fullDescription }}
            />
        </GlassPanel>)}
        
        {character.links && character.links.length > 0 && (
          <GlassPanel delay={0.5}>
         <h2 className="text-2xl font-bold mb-5 flex items-center justify-center gap-2 text-text-primary" style={{ background: "linear-gradient(120deg, #ffffff 0%, #d7aefb 50%, #ff6bd6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", color: "transparent", fontFamily: "var(--font-family-heading)", textShadow: "0 4px 12px rgba(0,0,0,0.2)"}}>
            🔗 Ссылки
          </h2> 
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {character.links.map((link, i) => (
                link.url && link.label && (
                  <motion.a
                    key={i}
                    variants={ANIM.fadeInStagger(i * 0.05) as Variants}
                    initial="initial"
                    animate="animate"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl p-4 font-medium bg-item hover:bg-glass-hover border transition-smooth text-center"
                    whileHover={{ scale: 1.03 }}
                  >
                    <span>{link.label}</span></motion.a>
                )
              ))}
            </div>
          </GlassPanel>
        )}
        
        <GlassPanel delay={0.6}>
          <h2 className="text-2xl font-bold mb-5 flex items-center justify-center gap-2 text-text-primary" style={{ background: "linear-gradient(120deg, #ffffff 0%, #d7aefb 50%, #ff6bd6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", color: "transparent", fontFamily: "var(--font-family-heading)", textShadow: "0 4px 12px rgba(0,0,0,0.2)"}}>
            💭 Комментарии
          </h2> 
        
          {user && (<div className="mb-6 p-4 rounded-xl bg-badge-tag border"><ReviewForm characterId={characterId} onSubmit={handleReviewSubmit} /></div>)}
          <div className="space-y-6">
            {reviewTree.length === 0 ? (
              <div className="text-center py-16">
                <motion.div {...ANIM.float} className="w-16 h-16 mx-auto mb-6 text-text-muted"><IconMessageSquare /></motion.div>
                <p className="text-xl font-medium mb-2 text-text-secondary">Будьте первым!</p>
              </div>
            ) : (
              <>
                <AnimatePresence>
                  {reviewTree.slice(0, visibleComments).map((review) => (
                    <motion.div key={review.id} variants={ANIM.fadeInUp(0) as Variants} initial="initial" animate="animate" exit="initial" layout>
                      <ReviewCard review={review} characterId={characterId} />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {reviewTree.length > visibleComments && (
                  <div className="mt-6 text-center">
                    <motion.button {...ANIM.buttonTap} onClick={() => setVisibleComments(p => p + 20)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-glass hover:bg-glass-hover border transition-smooth">
                      <IconChevronDown size={16} />Показать ещё
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}
 
export default React.memo(CharacterPage);