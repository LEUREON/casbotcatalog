import React, { useEffect, useLayoutEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Star, MessageSquare, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { useReviews } from "../contexts/ReviewsContext";
import { pb } from "../lib/pocketbase";
import ThemedBackground from "../components/common/ThemedBackground";
import { ReviewCard } from "../components/Characters/ReviewCard";
import { ReviewForm } from "../components/Characters/ReviewForm";
import { getAgeString } from "../utils/formatters";
import { Review } from "../types";

const TOKENS = {
  border: "rgba(255,255,255,0.12)",
  itemBg: "rgba(255,255,255,0.06)",
  itemBgActive: "rgba(255,255,255,0.10)",
  accent: "#f7cfe1",
};

const PANEL_CLASS = `rounded-2xl sm:rounded-3xl border backdrop-blur-md p-4`;

// ===== BADGE
const Badge = React.memo(({ text }: { text: string }) => (
  <div
    className="flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold"
    style={{ background: TOKENS.itemBgActive, color: '#fff', border: `1px solid ${TOKENS.border}`}}
  >
    <span>{text}</span>
  </div>
));
Badge.displayName = 'Badge';

// ===== STAR RATING
const StarRating = React.memo(({ 
  value = 0, 
  onChange, 
  size = 22, 
  readOnly = false 
}: { 
  value?: number; 
  onChange?: (v: number) => void; 
  size?: number; 
  readOnly?: boolean; 
}) => {
  const [hover, setHover] = useState<number | null>(null);
  const filledToShow = hover ?? value;
  return (
    <div className="flex items-center gap-1" aria-label={readOnly ? `Оценка: ${value} из 5` : "Выставить рейтинг"}>
      {Array.from({ length: 5 }).map((_, i) => {
        const idx = i + 1;
        const filled = filledToShow >= idx;
        return (
          <button
            key={idx}
            type="button"
            aria-label={`${idx} ${idx === 1 ? "звезда" : "звезды"}`}
            onMouseEnter={() => !readOnly && setHover(idx)}
            onMouseLeave={() => !readOnly && setHover(null)}
            onClick={() => !readOnly && onChange?.(idx)}
            className={`transition-transform ${readOnly ? "cursor-default" : "hover:scale-110"}`}
            style={{ lineHeight: 0 }}
            disabled={readOnly}
          >
            <Star size={size} className={filled ? "text-yellow-400 fill-current" : "text-slate-500"} />
          </button>
        );
      })}
    </div>
  );
});
StarRating.displayName = 'StarRating';

// ===== SAFE MARKDOWN (with leading spaces preserved)
function escapeHTML(str: string) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function mdInline(text: string) {
  let t = escapeHTML(text);
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*(.+?)\*/g, "<em>$1</em>");
  t = t.replace(/`(.+?)`/g, "<code>$1</code>");
  return t;
}
function preserveLeadingSpacesHtml(s: string) {
  const m = s.match(/^([ \t]+)/);
  if (!m) return s;
  const raw = m[0];
  let prefix = "";
  for (const ch of raw) prefix += ch === "\t" ? "&nbsp;&nbsp;" : "&nbsp;";
  return prefix + s.slice(raw.length);
}
function renderMarkdownSafe(src: string) {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let inUL = false, inOL = false, inBQ = false;

  const closeLists = () => {
    if (inUL) { out.push("</ul>"); inUL = false; }
    if (inOL) { out.push("</ol>"); inOL = false; }
  };
  const closeBQ = () => { if (inBQ) { out.push("</blockquote>"); inBQ = false; } };

  for (const rawLine of lines) {
    const line = rawLine;

    if (/^##\s+/.test(line)) {
      closeLists(); closeBQ();
      const content = preserveLeadingSpacesHtml(mdInline(line.replace(/^##\s+/, "")));
      out.push(`<h2 class="mt-3 mb-2 font-semibold text-lg">${content}</h2>`);
      continue;
    }
    if (/^###\s+/.test(line)) {
      closeLists(); closeBQ();
      const content = preserveLeadingSpacesHtml(mdInline(line.replace(/^###\s+/, "")));
      out.push(`<h3 class="mt-2 mb-1 font-semibold">${content}</h3>`);
      continue;
    }

    if (/^>\s?/.test(line)) {
      closeLists();
      if (!inBQ) { inBQ = true; out.push('<blockquote class="border-l-2 border-white/20 pl-3 my-2 opacity-90">'); }
      const content = preserveLeadingSpacesHtml(mdInline(line.replace(/^>\s?/, "")));
      out.push(content + "<br/>");
      continue;
    } else {
      closeBQ();
    }

    if (/^\s*[-*]\s+/.test(line)) {
      if (!inUL) { closeLists(); inUL = true; out.push('<ul class="list-disc ml-6 my-2 space-y-1">'); }
      const content = preserveLeadingSpacesHtml(mdInline(line.replace(/^\s*[-*]\s+/, "")));
      out.push(`<li>${content}</li>`);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (!inOL) { closeLists(); inOL = true; out.push('<ol class="list-decimal ml-6 my-2 space-y-1">'); }
      const content = preserveLeadingSpacesHtml(mdInline(line.replace(/^\s*\d+\.\s+/, "")));
      out.push(`<li>${content}</li>`);
      continue;
    }

    if (/^\s*$/.test(line)) {
      closeLists(); closeBQ();
      out.push("<br/>");
      continue;
    }

    closeLists(); closeBQ();
    const content = preserveLeadingSpacesHtml(mdInline(line));
    out.push(`<p class="my-1">${content}</p>`);
  }
  closeLists(); closeBQ();

  return `<div class="break-words leading-relaxed">${out.join("\n")}</div>`;
}

export function CharacterPage() {
  const navigate = useNavigate();
  const { characterId = "" } = useParams();
  const { user, toggleFavorite } = useAuth();
  const { characters, loadCharacters, characterLinks } = useData();
  const { reviews, loadReviews, addReview, updateReview } = useReviews();

  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const commentsSectionRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);
  const isRestoringScrollRef = useRef(false);

  const character = useMemo(() => {
    return characters.find(c => c.id === characterId);
  }, [characters, characterId]);

  const linksForThisCharacter = useMemo(() => {
    if (!characterId) return [];
    return characterLinks.filter(link => link.character_id === characterId && link.expand?.preset_id);
  }, [characterLinks, characterId]);

  const { avgRating, reviewsCount } = useMemo(() => {
    const characterReviews = reviews.filter(r => r.characterId === characterId && r.rating && r.rating > 0);
    if (characterReviews.length === 0) return { avgRating: 0, reviewsCount: 0 };
    const sum = characterReviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return { avgRating: sum / characterReviews.length, reviewsCount: characterReviews.length };
  }, [reviews, characterId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (characters.length === 0) await loadCharacters();
      if (reviews.length === 0) await loadReviews();
      if (user) {
        try {
          const userReview = await pb.collection('reviews').getFirstListItem(`character_id = "${characterId}" && user_id = "${user.id}"`);
          setUserRating(userReview.rating || 0);
        } catch { setUserRating(0); }
      }
      setLoading(false);
    };
    loadData();
  }, [characterId, user, characters.length, reviews.length, loadCharacters, loadReviews]);

  const handleToggleFavorite = async () => {
    if (!user || !character || isFavoriteLoading) return;
    setIsFavoriteLoading(true);
    await toggleFavorite(character.id);
    setIsFavoriteLoading(false);
  };

  // === ВАЖНО: фикс скролла при добавлении комментария ===
  const handleReviewSubmit = useCallback(() => {
    // 1) сохраняем текущую позицию
    scrollPositionRef.current = window.scrollY;
    // 2) ставим флаг восстановления после обновления списка
    isRestoringScrollRef.current = true;
    // 3) на всякий случай фокусируем секцию комментариев (без прокрутки)
    commentsSectionRef.current?.setAttribute("tabindex", "-1");
    commentsSectionRef.current?.focus({ preventScroll: true });
  }, []);

  // Когда список комментариев для этого персонажа меняется — восстанавливаем позицию синхронно перед кадром
  const characterCommentsCount = useMemo(
    () => reviews.filter(r => r.characterId === characterId && r.comment && r.comment.trim()).length,
    [reviews, characterId]
  );

  useLayoutEffect(() => {
    if (!isRestoringScrollRef.current) return;
    // Несколько кадров подряд — чтобы перекрыть возможные перестройки DOM/изображений
    let frames = 0;
    let raf = 0;
    const restore = () => {
      window.scrollTo(0, scrollPositionRef.current);
      frames++;
      if (frames < 3) {
        raf = requestAnimationFrame(restore);
      } else {
        isRestoringScrollRef.current = false;
      }
    };
    raf = requestAnimationFrame(restore);
    return () => cancelAnimationFrame(raf);
  }, [characterCommentsCount]);

  const handleRate = useCallback(async (rating: number) => {
    if (!user) return;
    try {
      let existingReview;
      try {
        existingReview = await pb.collection('reviews').getFirstListItem(`character_id = "${characterId}" && user_id = "${user.id}"`);
      } catch {}
      if (existingReview) {
        await updateReview(existingReview.id, { rating });
      } else {
        await addReview({ characterId, rating, comment: '' } as any);
      }
      setUserRating(rating);
    } catch (error) {
      console.error('Failed to update rating:', error);
    }
  }, [user, characterId, updateReview, addReview]);

  const characterReviews = useMemo(() => {
    return reviews.filter(r => r.characterId === characterId && r.comment && r.comment.trim());
  }, [reviews, characterId]);

  const reviewTree = useMemo(() => {
    const reviewMap = new Map(characterReviews.map(r => [r.id, r]));
    const findThreadRootId = (reviewId: string, depth = 0): string => {
      if (depth > 10) { return reviewId; }
      const review = reviewMap.get(reviewId);
      if (!review || !review.parentReview) { return reviewId; }
      const parent = reviewMap.get(review.parentReview);
      if (!parent) { return reviewId; }
      return findThreadRootId(parent.id, depth + 1);
    };
    const repliesByRootId = new Map<string, Review[]>();
    const topLevelReviews: Review[] = [];
    for (const review of characterReviews) {
      if (!review.parentReview) {
        topLevelReviews.push(review);
      } else {
        const rootId = findThreadRootId(review.id);
        if (rootId === review.id) {
          topLevelReviews.push(review);
        } else {
          if (!repliesByRootId.has(rootId)) {
            repliesByRootId.set(rootId, []);
          }
          repliesByRootId.get(rootId)!.push(review);
        }
      }
    }
    return topLevelReviews.map(review => {
      const replies = repliesByRootId.get(review.id) || [];
      replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return { ...review, replies: replies.map(r => ({...r, replies: []})) };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [characterReviews]);

  // === Safe fullDescription HTML (хук вызывается всегда ДО раннего return)
  const fullDescriptionSrc = character?.fullDescription ?? "";
  const fullDescriptionHTML = useMemo(
    () => renderMarkdownSafe(fullDescriptionSrc),
    [fullDescriptionSrc]
  );

  if (loading || !character) {
    return (
      <div className="min-h-screen relative p-4">
        <ThemedBackground intensity={0.9} animated />
        <div className="mb-4">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 text-sm font-medium text-white hover:bg-white/10 transition backdrop-blur-sm">
            <ArrowLeft size={16} /> Вернуться
          </button>
        </div>
        <div className={`${PANEL_CLASS} animate-pulse h-[70vh] max-w-6xl mx-auto`} style={{borderColor: TOKENS.border, background: TOKENS.itemBg}}/>
      </div>
    );
  }

  const isFavorited = user?.favorites?.includes(character.id) || false;

  return (
    <div className="min-h-screen relative p-2 sm:p-4">
      <ThemedBackground intensity={0.9} animated />
      
      <div className="relative z-10 w-full max-w-6xl mx-auto space-y-3">
        <div className="mb-3">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition active:scale-[0.98] bg-black/30 backdrop-blur-sm">
            <ArrowLeft size={16} /> <span>Назад</span>
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`${PANEL_CLASS} overflow-hidden p-0 sm:p-0 grid grid-cols-1 md:grid-cols-2`} style={{borderColor: TOKENS.border, background: TOKENS.itemBg}}>
          <div className="relative w-full aspect-square">
            <img src={character.photo} alt={character.name} className="h-full w-full object-cover" loading="lazy" />
            {user && (
              <button
                onClick={handleToggleFavorite}
                disabled={isFavoriteLoading}
                aria-label={isFavorited ? 'Удалить из избранного' : 'Добавить в избранное'}
                className="absolute right-4 top-4 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 backdrop-blur-[10px] border"
                style={{
                  background: isFavorited ? 'transparent' : 'rgba(255,255,255,0.1)',
                  borderColor: isFavorited ? TOKENS.accent : TOKENS.border,
                }}
              >
                {isFavoriteLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <Heart
                    className="w-5 h-5 transition-colors duration-300"
                    style={{
                      color: isFavorited ? TOKENS.accent : '#fff',
                      fill: isFavorited ? TOKENS.accent : 'none',
                    }}
                  />
                )}
              </button>
            )}
          </div>
          
          <div className="p-4 md:p-6 flex flex-col justify-center">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-1">{character.name}</h1>
            <p className="text-lg lg:text-xl text-slate-300 mb-3">{character.occupation}</p>
            <p className="text-slate-400 text-sm mb-3 leading-relaxed">{character.description}</p>
            
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge text={character.gender === 'male' ? 'Мужчина' : 'Женщина'} />
              <Badge text={character.ageGroup === 'immortal' ? 'Бессмертный' : getAgeString(character.age)} />
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              {character.tags.map(tag => <Badge key={tag} text={tag} />)}
            </div>

            <div className="mt-auto pt-4 border-t" style={{borderColor: TOKENS.border}}>
              <h4 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Общий рейтинг ({reviewsCount} оценок)</h4>
              <StarRating value={avgRating} readOnly />
            </div>
          </div>
        </motion.div>

        {character.fullDescription && (
          <section className={`${PANEL_CLASS}`} style={{borderColor: TOKENS.border, background: TOKENS.itemBg}}>
            <h2 className="text-xl font-semibold text-white mb-2">Описание</h2>
            <div
              className="max-w-none text-slate-300"
              dangerouslySetInnerHTML={{ __html: fullDescriptionHTML }}
            />
          </section>
        )}

        <section ref={commentsSectionRef} className={`${PANEL_CLASS}`} style={{borderColor: TOKENS.border, background: TOKENS.itemBg}}>
          <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
            <MessageSquare size={20} /> Комментарии
          </h2>
          {user && (
            <div className="mb-4">
              <ReviewForm characterId={characterId} onSubmit={handleReviewSubmit} />
            </div>
          )}
          <div className="space-y-4">
            {reviewTree.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Пока нет комментариев — будьте первыми!</p>
            ) : (
              reviewTree.map((review) => (
                <ReviewCard 
                  key={review.id} 
                  review={review} 
                  characterId={characterId} 
                  replies={review.replies} 
                  rootCommentId={review.id} 
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default React.memo(CharacterPage);