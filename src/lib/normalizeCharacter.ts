// src/lib/normalizeCharacter.ts
export type NormalizedCharacter = {
  id: string;
  name: string;
  photo?: string | null;
  occupation?: string | null;
  gender?: string | null;
  age?: number | null;
  ageGroup?: string | null;
  description?: string | null;
  isNew?: boolean | null;

  // ВАЖНО: сюда кладём итоговые категории/теги
  categories?: string[];
  tags?: string[];

  // для FavoritesPage → прокидываем в CharacterCard.isUserCreated
  __isUserCreated?: boolean;
};

function toStringArray(input: any): string[] {
  if (input === undefined || input === null) return [];
  if (typeof input === 'string') {
    const s = input.trim();
    if (!s) return [];
    try {
      if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
        const parsed = JSON.parse(s);
        return toStringArray(parsed);
      }
    } catch {}
    if (s.includes(',')) return [...new Set(s.split(',').map((p) => p.trim()).filter(Boolean))];
    return [s];
  }
  if (Array.isArray(input)) {
    const out: string[] = [];
    for (const item of input) {
      if (item == null) continue;
      if (typeof item === 'string' || typeof item === 'number') {
        String(item).split(',').map((p) => p.trim()).filter(Boolean).forEach((p) => out.push(p));
        continue;
      }
      if (typeof item === 'object') {
        const textLike = (item as any).label ?? (item as any).name ?? (item as any).text ?? (item as any).title ?? (item as any).value;
        if (textLike != null) {
          const s = String(textLike).trim();
          if (s) out.push(s);
          continue;
        }
        Object.entries(item as any).forEach(([k, v]) => { if (v && String(k).trim()) out.push(String(k).trim()); });
      }
    }
    return [...new Set(out.filter(Boolean))];
  }
  if (typeof input === 'object') {
    const textLike = (input as any).label ?? (input as any).name ?? (input as any).text ?? (input as any).title ?? (input as any).value;
    if (textLike != null) return toStringArray(String(textLike));
    const out: string[] = [];
    Object.entries(input as any).forEach(([k, v]) => { if (v && String(k).trim()) out.push(String(k).trim()); });
    return [...new Set(out.filter(Boolean))];
  }
  const s = String(input).trim();
  return s ? [s] : [];
}

function getId(x: any): string {
  return x?.id ?? x?._id ?? x?.uuid ?? x?.slug ?? '';
}

function isUserCreated(raw: any): boolean {
  return Boolean(
    raw?.source === 'user' ||
    raw?.collection === 'user_characters' ||
    raw?.isUser === true ||
    raw?.authorId || raw?.author_id
  );
}

export function normalizeCharacter(raw: any): NormalizedCharacter {
  const categories = toStringArray(raw?.categories ?? raw?.category);
  const tags = toStringArray(raw?.tags);

  return {
    id: String(getId(raw)),
    name: raw?.name ?? raw?.title ?? 'Без имени',
    photo: raw?.photo ?? raw?.imageUrl ?? raw?.image_url ?? null,
    occupation: raw?.occupation ?? raw?.job ?? null,
    gender: raw?.gender ?? null,
    age: raw?.age ?? null,
    ageGroup: raw?.ageGroup ?? raw?.age_group ?? null,
    description: raw?.description ?? raw?.bio ?? null,
    isNew: Boolean(raw?.isNew),
    categories,
    tags,
    __isUserCreated: isUserCreated(raw),
  };
}
