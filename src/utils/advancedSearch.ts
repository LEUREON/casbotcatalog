// src/utils/advancedSearch.ts
/* Advanced search utilities with fuzzy matching, synonyms and transliteration (RU<->EN).
   Uses fuse.js if available; otherwise falls back to simple substring matching.
*/
import type { Character } from '../types';

// Lazy type for Fuse to avoid type dependency if not installed
type FuseT = any;

// --- Synonyms (extend as needed) ---
const SYNONYMS: Record<string, string[]> = {
  // professions / roles
  'врач': ['доктор', 'медик', 'хирург', 'терапевт', 'doctor', 'medic', 'surgeon'],
  'полицейский': ['коп', 'охранник', 'детектив', 'сержант', 'officer', 'police', 'detective'],
  'киллер': ['наемник', 'наёмник', 'ассасин', 'убийца', 'killer', 'assassin', 'hitman', 'mercenary'],
  'маг': ['волшебник', 'чародей', 'wizard', 'mage', 'sorcerer'],
  'шпион': ['агент', 'разведчик', 'spy', 'agent', 'operative'],
  'ученый': ['учёный', 'исследователь', 'scientist', 'researcher'],
  'учитель': ['преподаватель', 'teacher', 'tutor', 'lecturer'],
  'хакер': ['программист', 'coder', 'developer', 'hacker'],
  'модель': ['манекенщица', 'model'],
  'певец': ['вокалист', 'певица', 'singer', 'vocalist'],
  'танцор': ['танцовщица', 'танцовщик', 'dancer'],
  'рыцарь': ['воин', 'knight', 'warrior'],
  'вампир': ['упырь', 'vampire'],
  'оборотень': ['волколак', 'werewolf', 'lycan'],
  // adjectives / tags
  'злой': ['жестокий', 'агрессивный', 'evil', 'cruel', 'aggressive'],
  'добрый': ['милый', 'приятный', 'kind', 'nice'],
  'красивый': ['симпатичный', 'привлекательный', 'beautiful', 'pretty', 'handsome'],
};

// transliteration maps (basic)
const RU_TO_EN: Record<string, string> = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
};
const EN_TO_RU: Record<string, string> = {
  'yo':'ё','jo':'ё','zh':'ж','ts':'ц','ch':'ч','sh':'ш','sch':'щ','yu':'ю','ya':'я',
  'a':'а','b':'б','v':'в','g':'г','d':'д','e':'е','z':'з','i':'и','y':'й','k':'к','l':'л','m':'м','n':'н','o':'о','p':'п','r':'р','s':'с','t':'т','u':'у','f':'ф','h':'х'
};

export function normalize(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[ё]/g, 'е')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^\p{L}\p{N}\s-]+/gu, ' ') // keep letters/digits/spaces
    .replace(/\s+/g, ' ')
    .trim();
}

export function translitRuToEn(str: string): string {
  let out = '';
  for (const ch of str.toLowerCase()) out += RU_TO_EN[ch] ?? ch;
  return out;
}
export function translitEnToRu(str: string): string {
  // handle digraphs first
  let s = str.toLowerCase();
  for (const [en, ru] of Object.entries(EN_TO_RU)) {
    s = s.replace(new RegExp(en, 'g'), ru);
  }
  return s;
}

export function expandSynonyms(query: string): string[] {
  const q = normalize(query);
  if (!q) return [];
  const tokens = q.split(' ');
  const variants = new Set<string>([q]);

  tokens.forEach(tok => {
    const syns = SYNONYMS[tok];
    if (syns && syns.length) syns.forEach(s => variants.add(normalize(s)));
  });

  // transliteration variants
  variants.add(normalize(translitRuToEn(q)));
  variants.add(normalize(translitEnToRu(q)));

  return Array.from(variants).filter(Boolean);
}

export type SearchIndexItem = Character & {
  _searchBlob: string;
};

export function buildIndex(characters: Character[]): SearchIndexItem[] {
  return characters.map((c) => {
    const pieces: string[] = [];
    pieces.push(c.name || '');
    pieces.push(c.occupation || '');
    pieces.push(c.description || '');
    if (Array.isArray(c.tags)) pieces.push(c.tags.join(' '));
    if (Array.isArray(c.category)) pieces.push(c.category.join(' ')); else if (typeof (c as any).category === 'string') pieces.push((c as any).category as string);
    pieces.push(c.gender || '');
    pieces.push(c.ageGroup || '');
    const blob = normalize(pieces.join(' '));
    return { ...c, _searchBlob: blob };
  });
}

export function simpleFuzzySearch(items: SearchIndexItem[], query: string): { id: string; score: number }[] {
  const variants = expandSynonyms(query);
  if (!variants.length) return items.map(it => ({ id: it.id, score: 0 }));
  const results: { id: string; score: number }[] = [];
  for (const it of items) {
    let score = 1;
    for (const v of variants) {
      if (it._searchBlob.includes(v)) { score = Math.min(score, 0.1); break; }
      // token-level approx (Levenshtein distance 1..2 heuristic)
      const tokens = it._searchBlob.split(' ');
      const hit = tokens.some(t => {
        if (t.includes(v) || v.includes(t)) return true;
        if (Math.abs(t.length - v.length) > 2) return false;
        let d = 0, i = 0, j = 0;
        while (i < t.length && j < v.length) {
          if (t[i] !== v[j]) { d++; if (d>2) break; i++; j++; }
          else { i++; j++; }
        }
        d += (t.length - i) + (v.length - j);
        return d <= 2;
      });
      if (hit) { score = Math.min(score, 0.4); break; }
    }
    if (score < 1) results.push({ id: it.id, score });
  }
  // If nothing matched approximately, return empty
  return results.length ? results.sort((a,b) => a.score - b.score) : [];
}

export async function createSearch(characters: Character[]) {
  const index = buildIndex(characters);
  // Try dynamic import of fuse.js
  let FuseMod: { default: FuseT } | null = null;
  try {
    // @ts-ignore
    // Optional import: skip Vite pre-bundling; if package is missing we fall back gracefully.
    // @ts-ignore
    FuseMod = await import(/* @vite-ignore */ 'fuse.js');
  } catch {
    FuseMod = null;
  }
  if (!FuseMod) {
    return {
      search: (query: string) => simpleFuzzySearch(index, query),
    };
  }
  const Fuse = (FuseMod as any).default as FuseT;
  const fuse = new Fuse(index, {
    includeScore: true,
    threshold: 0.34,
    ignoreLocation: true,
    findAllMatches: true,
    minMatchCharLength: 2,
    distance: 150,
    keys: [
      { name: 'name', weight: 3 },
      { name: 'occupation', weight: 2 },
      { name: 'description', weight: 1 },
      { name: 'tags', weight: 1.5 },
      { name: 'category', weight: 2 },
      { name: '_searchBlob', weight: 0.5 },
    ],
    useExtendedSearch: false,
  });

  return {
    search: (query: string) => {
      const variants = expandSynonyms(query);
      if (!variants.length) return index.map(it => ({ id: it.id, score: 0 }));
      // Build an OR pattern for Fuse extended search
      const merged = new Map<string, number>();
      for (const v of variants) {
        const part = fuse.search(v) as Array<{ item: SearchIndexItem; score: number }>;
        for (const r of part) {
          const prev = merged.get(r.item.id);
          const sc = r.score ?? 0;
          if (prev === undefined || sc < prev) merged.set(r.item.id, sc);
        }
      }
      return Array.from(merged.entries()).map(([id, score]) => ({ id, score })).sort((a,b)=>a.score-b.score);
    }
  };
}
