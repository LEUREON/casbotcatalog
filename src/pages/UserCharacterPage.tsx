// src/pages/UserCharacterPage.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, Variants } from "framer-motion";

// Убираем ReviewCard, ReviewForm
import ThemedBackground from "../components/common/ThemedBackground";
import { GlassPanel } from "../components/ui/GlassPanel";
import { InfoBadge } from "../components/ui/InfoBadge";
import { TagBadge } from "../components/ui/TagBadge";
// Убираем StarRating
// import { StarRating } from "../components/ui/StarRating";
// import { ReviewCard } from "../components/Characters/ReviewCard";
// import { ReviewForm } from "../components/Characters/ReviewForm";

// Используем useAuth для избранного
import { useAuth } from "../contexts/AuthContext";
// import { useReviews } from "../contexts/ReviewsContext"; // Убираем
import { useUserCharacters } from "../contexts/UserCharactersContext";

import { pb } from "../lib/pocketbase";
import { getAgeString } from "../utils/formatters";
// Убираем Review
import { Character, UserCharacter } from "../types";
import { ANIM } from "../lib/animations";

// Добавляем IconHeart, убираем IconMessageSquare
import {
  IconArrowLeft, IconHeart, // <-- Добавляем IconHeart
  IconUser, IconCake, IconInfinity, IconLoader, IconChevronDown
} from "../components/ui/icons";

// AlertTriangle нужен для блока ссылок и модалки
import { Share2, AlertTriangle, Edit3, Trash2, ExternalLink } from "lucide-react";

// --- Утилита форматирования дат (без изменений) ---
const formatDate = (dateString?: string | Date): string => {
  if (!dateString) return 'Неизвестно';
  try {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Некорректная дата';
  }
};
// --- ---


/* -------------------------- нормализация полей -------------------------- */
function toStringArray(input: any): string[] {
  // ... (код функции без изменений) ...
  if (input === undefined || input === null) return [];

  if (typeof input === "string") {
    const s = input.trim();
    if (!s) return [];
    const looksLikeJson = (s.startsWith("[") && s.endsWith("]")) || (s.startsWith("{") && s.endsWith("}"));
    if (looksLikeJson) {
      try {
        return toStringArray(JSON.parse(s));
      } catch {
        /* fallthrough */
      }
    }
    if (s.includes(",")) {
      return Array.from(new Set(s.split(",").map((p) => p.trim()).filter(Boolean)));
    }
    return [s];
  }

  if (Array.isArray(input)) {
    const out: string[] = [];
    for (const item of input) {
      if (item == null) continue;
      if (typeof item === "string" || typeof item === "number") {
        const s = String(item).trim();
        if (!s) continue;
        if (s.includes(",")) s.split(",").map((p) => p.trim()).filter(Boolean).forEach((p) => out.push(p));
        else out.push(s);
        continue;
      }
      if (typeof item === "object") {
        const textLike = (item as any).label ?? (item as any).name ?? (item as any).text ?? (item as any).title ?? (item as any).value;
        if (typeof textLike === "string" || typeof textLike === "number") {
          const s = String(textLike).trim();
          if (s) out.push(s);
          continue;
        }
        Object.entries(item as any).forEach(([k, v]) => {
          if (v && String(k).trim()) out.push(String(k).trim());
        });
      }
    }
    return Array.from(new Set(out.filter(Boolean)));
  }

  if (typeof input === "object") {
    const textLike = (input as any).label ?? (input as any).name ?? (input as any).text ?? (input as any).title ?? (input as any).value;
    if (typeof textLike === "string" || typeof textLike === "number") {
      const s = String(textLike).trim();
      if (!s) return [];
      if (s.includes(",")) {
        return Array.from(new Set(s.split(",").map((p) => p.trim()).filter(Boolean)));
      }
      return [s];
    }
    const out: string[] = [];
    Object.entries(input as any).forEach(([k, v]) => {
      if (v && String(k).trim()) out.push(String(k).trim());
    });
    return Array.from(new Set(out.filter(Boolean)));
  }

  const s = String(input).trim();
  return s ? [s] : [];
}

// Нормализация фото (с исправлением для гостей)
function normalizeUserChar(uc: Partial<UserCharacter>): Character {
  const photoIdentifier =
    (uc as any)?.photo ||
    (uc as any)?.imageUrl ||
    (uc as any)?.image ||
    (Array.isArray((uc as any)?.images) ? (uc as any)?.images[0] : "") ||
    "";

  let photoUrl = "";
  if (photoIdentifier) {
    if (photoIdentifier.startsWith('http://') || photoIdentifier.startsWith('https://') || photoIdentifier.startsWith('data:')) {
      photoUrl = photoIdentifier;
    } else {
      try {
        photoUrl = pb.getFileUrl(uc as any, photoIdentifier);
      } catch (e) {
        console.warn("Failed to get file URL", e);
        photoUrl = "";
      }
    }
  }

  const occupation = (uc as any)?.occupation || (uc as any)?.role || "";
  const description = (uc as any)?.description || (uc as any)?.shortDescription || "";
  const fullDescription = (uc as any)?.fullDescription || (uc as any)?.contentHTML || "";

  const gender: Character["gender"] =
    (uc as any)?.gender === "female" ? "female" : "male";

  const age: number = Number((uc as any)?.age ?? 0);

  const ageGroup: Character["ageGroup"] =
    (uc as any)?.ageGroup ||
    (age === 0 ? "immortal" : age >= 30 ? "30+" : age >= 18 ? "18+" : "all");

  const category = toStringArray((uc as any)?.category ?? (uc as any)?.categories);
  const tags = toStringArray((uc as any)?.tags);

  const linksRaw: any[] = Array.isArray((uc as any)?.links) ? (uc as any)?.links : [];
  const links = linksRaw
    .map((l) => (typeof l === "string" ? { url: l, label: undefined } : l))
    .filter((l) => l && l.url);

  return {
    id: (uc as any)?.id || "",
    name: (uc as any)?.name || (uc as any)?.title || "Без имени",
    occupation,
    description,
    fullDescription,
    photo: photoUrl,
    gender,
    age,
    ageGroup,
    rating: Number((uc as any)?.rating ?? 0),
    category,
    tags,
    links,
  } as Character;
}
/* --------------------------------------------------------------------------------------- */


export function UserCharacterPage() {
  const navigate = useNavigate();
  const { id: characterId = "" } = useParams();

  // --- Получаем данные и функции из AuthContext ---
  const { user, userCharacterFavorites, toggleUserCharacterFavorite } = useAuth();
  // ---

  const { userCharacters = [], loading: ctxLoading } = useUserCharacters();

  const [noticeOpen, setNoticeOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [pbRecord, setPbRecord] = useState<any | null>(null);
  const [pbLoading, setPbLoading] = useState(true);
  const [pbError, setPbError] = useState<string | null>(null);

  const [authorData, setAuthorData] = useState<{ name: string; avatar: string }>({
    name: 'Загрузка...',
    avatar: 'https://api.dicebear.com/8.x/initials/svg?seed=?'
  });

  // --- Состояния для кнопки Избранное ---
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [showFavoritePulse, setShowFavoritePulse] = useState(false);
  // ---

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { scrollY } = useScroll();
  const bgIntensity = useTransform(scrollY, [0, 500], [0.35, 0.1]);
  const titleY = useTransform(scrollY, [0, 300], [0, -25]);
  const imageScale = useTransform(scrollY, [0, 200], [1, 1.05]);

  const fromCtx = useMemo(
    () => (userCharacters as any[]).find((uc) => uc?.id === characterId),
    [userCharacters, characterId]
  );

  useEffect(() => {
    // ... (загрузка pbRecord без изменений) ...
    let cancelled = false;
    if (fromCtx) {
      setPbRecord(null);
      setPbLoading(false);
      setPbError(null);
      return;
    }
    setPbLoading(true);
    setPbError(null);
    pb.collection("user_characters")
      .getOne(characterId, { expand: "user" })
      .then((rec) => {
        if (cancelled) return;
        setPbRecord(rec);
        setPbLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setPbError("not_found");
        setPbLoading(false);
      });
    return () => { cancelled = true; };
  }, [characterId, fromCtx]);

  const rawUser = useMemo(() => pbRecord || fromCtx, [fromCtx, pbRecord]);
  const character: Character | undefined = useMemo(
    () => (rawUser ? normalizeUserChar(rawUser) : undefined),
    [rawUser]
  );

  // --- Загрузка данных автора (без изменений) ---
  useEffect(() => {
    if (!rawUser) return;

    let cancelled = false;
    const defaultAvatar = (name: string) => `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name.trim() || '?')}`;

    const expandedUser = (rawUser as any)?.expand?.user;
    if (expandedUser) {
      const name = expandedUser.nickname || expandedUser.username || expandedUser.name || 'Неизвестно';
      const avatar = expandedUser.avatar
        ? pb.getFileUrl(expandedUser, expandedUser.avatar)
        : defaultAvatar(name);
      setAuthorData({ name, avatar });
      return;
    }

    const fallbackName = (rawUser as any)?.authorName ||
                         (rawUser as any)?.ownerName ||
                         (rawUser as any)?.nickname ||
                         (rawUser as any)?.username ||
                         (rawUser as any)?.userName;

    if (fallbackName && !fallbackName.includes('000000')) {
      setAuthorData({ name: fallbackName, avatar: defaultAvatar(fallbackName) });
      return;
    }

    const userId = (rawUser as any)?.user;
    if (userId && typeof userId === 'string') {
      pb.collection('users').getOne(userId)
        .then((userData) => {
          if (cancelled) return;
          const name = userData.nickname || userData.username || userData.name || 'Неизвестно';
          const avatar = userData.avatar
            ? pb.getFileUrl(userData, userData.avatar)
            : defaultAvatar(name);
          setAuthorData({ name, avatar });
        })
        .catch(() => {
          if (cancelled) return;
          setAuthorData({ name: 'Неизвестно', avatar: defaultAvatar('?') });
        });
    } else {
      setAuthorData({ name: 'Неизвестно', avatar: defaultAvatar('?') });
    }

    return () => { cancelled = true; };
  }, [rawUser]);
  // --- ---

  const createdAt: string | undefined = (rawUser as any)?.created || (rawUser as any)?.createdAt;
  const updatedAt: string | undefined = (rawUser as any)?.updated || (rawUser as any)?.updatedAt;

  // --- ОПРЕДЕЛЕНИЕ ПРАВ ДОСТУПА (без изменений) ---
  const userId = (user as any)?.id || (user as any)?.uid;
  const isAdmin = !!((user as any)?.role === "admin" || (user as any)?.isAdmin);
  const isOwner = !!(userId && rawUser && (((rawUser as any).user === userId) || ((rawUser as any).authorId === userId) || ((rawUser as any).userId === userId)));
  const canModify = !!(user && (isAdmin || isOwner));
  // ---

  // --- Определяем, в избранном ли эта карточка ---
  const isFavorited = useMemo(() => {
    if (!user || !characterId) return false;
    return userCharacterFavorites.includes(characterId);
  }, [user, characterId, userCharacterFavorites]);
  // ---

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return `/user-characters/${characterId}`;
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}#/user-characters/${encodeURIComponent(characterId)}`;
  }, [characterId]);

  const doShare = async () => {
    try {
      if ((navigator as any)?.share) {
        await (navigator as any).share({
          title: String(character?.name || "Персонаж"),
          text: character?.description || "",
          url: shareUrl,
        });
        return;
      }
    } catch {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  // --- Обработчик для кнопки Избранное ---
  const handleToggleFavorite = async () => {
    if (!user || !characterId || isFavoriteLoading) return;
    setIsFavoriteLoading(true);
    try {
      await toggleUserCharacterFavorite(characterId);
      // Показываем анимацию только при *добавлении* в избранное
      if (!isFavorited) { // Проверяем предыдущее состояние
        setShowFavoritePulse(true);
        setTimeout(() => setShowFavoritePulse(false), 400);
      }
    } catch (error) {
      console.error("Failed to toggle user character favorite:", error);
      // Можно показать уведомление об ошибке
    } finally {
      setIsFavoriteLoading(false);
    }
  };
  // ---

  const handleDelete = async () => {
    setDeleteError(null);
    setDeleting(true);
    try {
      await pb.collection("user_characters").delete(characterId);
      navigate("/favorites", { replace: true });
    } catch (e) {
      setDeleteError("Не удалось удалить карточку. Попробуйте позже.");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const pageIsLoading = ctxLoading || pbLoading;

  if (pageIsLoading) {
    return <div>Загрузка...</div>;
  }

  if (!rawUser || !character) {
    return (
      <div className="relative min-h-screen p-6 text-center">
        <ThemedBackground intensity={bgIntensity} />
        <div className="relative z-10 max-w-xl mx-auto mt-20">
          <GlassPanel>
            <h2 className="text-2xl font-bold mb-2">Карточка недоступна</h2>
            <p className="text-white/70">
              Возможно, запись была удалена, не прошла модерацию или у вас нет прав на её просмотр.
            </p>
          </GlassPanel>
        </div>
      </div>
    );
  }

  /* -------------------------------- рендер -------------------------------- */
  return (
    <div className="relative min-h-screen p-3 sm:p-5 font-body text-text-primary bg-dark">
      <ThemedBackground intensity={bgIntensity} />

      <motion.button
        {...ANIM.buttonTap}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        onClick={() => navigate(-1)}
        className="fixed top-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center bg-floating backdrop-blur-lg shadow-glass"
        aria-label="Назад"
      >
        <IconArrowLeft />
      </motion.button>

      <motion.div
        initial="initial"
        animate="animate"
        variants={ANIM.fadeInUp() as Variants}
        className="relative z-10 w-full max-w-4xl mx-auto space-y-8 pb-28" // Добавлен pb-28
      >
        {/* Фото + бейдж */}
        <motion.div style={{ scale: imageScale }} className="w-full aspect-square rounded-xl overflow-hidden relative shadow-2xl">
          <img
            src={character.photo || undefined}
            alt={character.name}
            className="w-full h-full object-cover bg-black/20"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide bg-pink-500/90 text-white border border-pink-300/60 shadow-[0_6px_18px_rgba(236,72,153,0.35)]">
              <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
              Создано пользователем
            </span>
          </div>
        </motion.div>

        {/* Заголовок/описание/автор */}
        <motion.div variants={ANIM.fadeInUp(0.1) as Variants} className="space-y-6 text-center">
          <motion.h1 style={{ y: titleY }} className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight bg-gradient-to-r from-white via-accent-primary to-accent-secondary bg-clip-text text-transparent font-heading">
            {character.name}
          </motion.h1>
          <p className="text-xl sm:text-2xl font-medium text-text-secondary">{character.occupation}</p>
          <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto px-2 text-text-muted" style={{ lineHeight: "1.75" }}>
            {character.description}
          </p>

          {/* Карточка автора */}
          <motion.div
            variants={ANIM.fadeInUp(0.15) as Variants}
            className="inline-block mt-4 p-4 rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm shadow-lg"
          >
            <div className="text-xs uppercase font-semibold tracking-wider text-text-muted mb-3">
              Автор
            </div>
            <div className="flex flex-col items-center gap-2">
              <img
                src={authorData.avatar}
                alt={`Аватар ${authorData.name}`}
                className="w-16 h-16 rounded-full border-2 border-white/20 object-cover bg-black/20"
              />
              <span className="text-lg font-semibold text-text-primary">{authorData.name}</span>
              <div className="text-xs text-text-muted flex flex-col items-center mt-1">
                <span className="font-semibold text-text-secondary mb-0.5">Карточка:</span>
                <span>Создана: {formatDate(createdAt)}</span>
                {updatedAt && createdAt && new Date(updatedAt).getTime() > new Date(createdAt).getTime() + 60000 && (
                   <span>Обновлена: {formatDate(updatedAt)}</span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Бейджи */}
          <div className="flex flex-wrap justify-center gap-3 my-4">
            <InfoBadge icon={<IconUser />} text={character.gender === "male" ? "Мужчина" : "Женщина"} colorClass="bg-badge-male text-white" />
            <InfoBadge icon={character.ageGroup === "immortal" ? <IconInfinity /> : <IconCake />} text={character.ageGroup === "immortal" ? "Бессмертный" : getAgeString(character.age)} colorClass={character.ageGroup === "immortal" ? "bg-badge-immortal text-dark" : "bg-badge-age text-white"} />
          </div>

          {/* Категории */}
          {character.category?.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2.5 my-2">
              <AnimatePresence>
                {character.category.map((cat, i) => (
                  <motion.div key={`${cat}-${i}`} variants={ANIM.fadeInStagger(i * 0.05) as Variants} initial="initial" animate="animate">
                    <TagBadge text={cat} isCategory />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Теги */}
          {character.tags?.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2.5 my-2">
              <AnimatePresence>
                {character.tags.map((tag, i) => (
                  <motion.div key={`${tag}-${i}`} variants={ANIM.fadeInStagger(i * 0.05) as Variants} initial="initial" animate="animate">
                    <TagBadge text={tag} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* --- ВОЗВРАЩЕННАЯ КНОПКА ИЗБРАННОЕ --- */}
          {user && (
            <div className="flex justify-center mt-6">
              <motion.button
                {...ANIM.buttonTap}
                animate={showFavoritePulse ? (ANIM.buttonPulse as any).animate : {}}
                transition={ANIM.buttonPulse?.transition as any}
                onClick={handleToggleFavorite}
                disabled={isFavoriteLoading}
                aria-label={isFavorited ? "Удалить из избранного" : "Добавить в избранное"}
                className={`inline-flex items-center gap-2.5 px-7 py-4 rounded-full font-bold text-sm relative transition-smooth ${
                  isFavorited
                    ? 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-button'
                    : 'bg-accent-primary/10 text-text-primary border-2 border-accent-primary'
                }`}
              >
                {isFavoriteLoading
                  ? <IconLoader />
                  : <> <IconHeart filled={isFavorited} /> {isFavorited ? "В избранном" : "В избранное"} </>}
              </motion.button>
            </div>
          )}
          {/* --- КОНЕЦ КНОПКИ ИЗБРАННОЕ --- */}

          {/* --- ДЕЙСТВИЯ (Поделиться, Редактировать, Удалить) --- */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <motion.button
              {...ANIM.buttonTap}
              onClick={doShare}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-floating backdrop-blur-lg shadow-glass border border-white/10 hover:bg-white/20 transition-colors"
              title="Поделиться ссылкой"
            >
              <Share2 size={16} />
              {copied ? "Скопировано" : "Поделиться"}
            </motion.button>
            {canModify && (
              <>
                <motion.button
                  {...ANIM.buttonTap}
                  onClick={() => navigate(`/submit-character?edit=${characterId}`, { state: { editId: characterId } })}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-button"
                  style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }}
                  title="Редактировать карточку"
                >
                  <Edit3 size={16} />
                  Редактировать
                </motion.button>
                <motion.button
                  {...ANIM.buttonTap}
                  onClick={() => setConfirmOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border bg-rose-500/15 border-rose-400/30 text-rose-100 hover:bg-rose-500/20"
                  title="Удалить карточку"
                >
                  <Trash2 size={16} />
                  Удалить
                </motion.button>
              </>
            )}
          </div>
        </motion.div>

        {/* Важно к прочтению */}
        {character.fullDescription && (
           <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="w-full max-w-4xl mx-auto">
            <div className="rounded-xl border px-4 py-3 sm:px-5 sm:py-4" style={{ background: "rgba(250, 204, 21, 0.10)", borderColor: "rgba(250, 204, 21, 0.45)", boxShadow: "0 8px 24px rgba(250, 204, 21, 0.05)", color: "rgb(253, 230, 138)" }}>
              <button type="button" onClick={() => setNoticeOpen((v) => !v)} aria-expanded={noticeOpen} className="w-full flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="12" cy="17" r="1.2" fill="currentColor" />
                  </svg>
                  <span className="font-bold tracking-wide text-sm sm:text-base uppercase">Важно к прочтению</span>
                </div>
                <span className={"transition-transform duration-200 inline-flex" + (noticeOpen ? " rotate-180" : "")} aria-hidden="true">
                  <IconChevronDown size={18} />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {noticeOpen && (
                  <motion.div key="notice-content" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }} className="overflow-hidden">
                    <div className="pt-3 sm:pt-4 text-[15px] leading-relaxed prose prose-sm prose-invert max-w-none">
                      {/* ... текст предупреждения ... */}
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
        )}

        {/* Описание */}
        {character.fullDescription && (
          <GlassPanel delay={0.4}>
            <h2 className="text-2xl font-bold mb-5 flex items-center justify-center gap-2 text-text-primary" style={{ background: "linear-gradient(120deg, #ffffff 0%, #d7aefb 50%, #ff6bd6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", color: "transparent", fontFamily: "var(--font-family-heading)", textShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
              📜 Описание
            </h2>
            <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-h2:my-2 prose-h3:my-1" dangerouslySetInnerHTML={{ __html: character.fullDescription }} />
          </GlassPanel>
        )}

        {/* Ссылки */}
        {character.links && character.links.length > 0 && (
          <GlassPanel delay={0.5}>
            <h2 className="text-2xl font-bold mb-5 flex items-center justify-center gap-2 text-text-primary" style={{ background: "linear-gradient(120deg, #ffffff 0%, #d7aefb 50%, #ff6bd6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", color: "transparent", fontFamily: "var(--font-family-heading)", textShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
              🔗 Ссылки
            </h2>
            <div
              className="mb-4 rounded-xl border px-4 py-3 sm:px-5 sm:py-4"
              style={{
                background: "rgba(250, 204, 21, 0.10)",
                borderColor: "rgba(250, 204, 21, 0.45)",
                boxShadow: "0 8px 24px rgba(250, 204, 21, 0.05)",
                color: "rgb(253, 230, 138)"
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <AlertTriangle size={20} className="flex-shrink-0" />
                <span className="font-bold tracking-wide text-sm sm:text-base uppercase">
                  Внимание
                </span>
              </div>
              <div className="pt-3 text-[15px] leading-relaxed">
                <p>Администрация сайта не проверяет предоставленные авторами ссылки и не несет ответственности за их содержание. Переходите на свой страх и риск.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {character.links.map((link, i) =>
                link.url && (link as any).label ? (
                  <motion.a key={i} variants={ANIM.fadeInStagger(i * 0.05) as Variants} initial="initial" animate="animate" href={link.url} target="_blank" rel="noopener noreferrer nofollow" className="flex w-full items-center justify-center gap-2 rounded-xl p-4 font-medium bg-item hover:bg-glass-hover border transition-smooth text-center" whileHover={{ scale: 1.03 }}>
                    <span>{(link as any).label}</span>
                  </motion.a>
                ) : link.url ? (
                  <motion.a key={i} variants={ANIM.fadeInStagger(i * 0.05) as Variants} initial="initial" animate="animate" href={link.url} target="_blank" rel="noopener noreferrer nofollow" className="flex w-full items-center justify-center gap-2 rounded-xl p-4 font-medium bg-item hover:bg-glass-hover border transition-smooth text-center break-all" whileHover={{ scale: 1.03 }}>
                    <ExternalLink size={16} />
                    <span>{link.url}</span>
                  </motion.a>
                ) : null
              )}
            </div>
          </GlassPanel>
        )}

      </motion.div>

      {/* Модалка удаления */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div key="delete-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm grid place-items-center px-4" role="dialog" aria-modal="true">
            <motion.div key="delete-modal" initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ duration: 0.2 }} className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.06] shadow-[0_16px_48px_rgba(0,0,0,1)]">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-3 text-rose-200">
                  <AlertTriangle size={20} />
                  <h3 className="text-lg font-bold">Удалить карточку?</h3>
                </div>
                <p className="mt-3 text-sm text-white/100">Действие необратимо: карточка и все связанные данные будут удалены. Вы уверены?</p>
                {deleteError && <div className="mt-3 text-sm text-rose-200/90">{deleteError}</div>}
                <div className="mt-5 flex items-center justify-end gap-2">
                  <motion.button {...ANIM.buttonTap} onClick={() => setConfirmOpen(false)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-glass hover:bg-glass-hover border" disabled={deleting}>
                    Отмена
                  </motion.button>
                  <motion.button {...ANIM.buttonTap} onClick={handleDelete} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #f43f5e, #fb7185)" }} disabled={deleting}>
                    {deleting ? "Удаляю..." : "Удалить"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default React.memo(UserCharacterPage);