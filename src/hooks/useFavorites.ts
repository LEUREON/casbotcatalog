// src/hooks/useFavorites.ts
import { useEffect, useState } from 'react';
import { normalizeCharacter, NormalizedCharacter } from '@/lib/normalizeCharacter';

type FavoriteItem = { id: string; source?: 'official' | 'user' };

// при необходимости поправь пути к API под свой бэкенд
async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

export function useFavorites(userId?: string) {
  const [data, setData] = useState<NormalizedCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Получаем список избранного
        const favs: FavoriteItem[] = await fetchJSON(`/api/favorites?userId=${encodeURIComponent(userId || '')}`);

        const officialIds = favs.filter(f => f.source === 'official').map(f => f.id);
        const userIds = favs.filter(f => f.source === 'user').map(f => f.id);
        const unknownIds = favs.filter(f => !f.source).map(f => f.id); // на случай старых записей без source

        // 2) Тянем батчем оба источника (и пробуем “неизвестные” в обоих)
        const [officialRaw, userRaw] = await Promise.all([
          (officialIds.length || unknownIds.length)
            ? fetchJSON<any[]>(`/api/characters/bulk?ids=${[...new Set([...officialIds, ...unknownIds])].join(',')}`)
            : Promise.resolve([]),
          (userIds.length || unknownIds.length)
            ? fetchJSON<any[]>(`/api/user_characters/bulk?ids=${[...new Set([...userIds, ...unknownIds])].join(',')}`)
            : Promise.resolve([]),
        ]);

        const official = (officialRaw || []).map((x) => normalizeCharacter({ ...x, source: 'official' }));
        const users = (userRaw || []).map((x) => normalizeCharacter({ ...x, source: 'user' }));

        // 3) Составляем словарь по id для обоих источников
        const oDict = new Map(official.map((c) => [c.id, c]));
        const uDict = new Map(users.map((c) => [c.id, c]));

        // 4) Сохраняем порядок, как в избранном
        const merged: NormalizedCharacter[] = [];
        for (const f of favs) {
          if (f.source === 'official') {
            const item = oDict.get(f.id);
            if (item) merged.push(item);
            continue;
          }
          if (f.source === 'user') {
            const item = uDict.get(f.id);
            if (item) merged.push(item);
            continue;
          }
          // старые записи без source — пробуем найти в обоих
          const item = uDict.get(f.id) || oDict.get(f.id);
          if (item) merged.push(item);
        }

        if (alive) setData(merged);
      } catch (e) {
        if (alive) {
          setError(e);
          setData([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [userId]);

  return { data, loading, error };
}
