// src/seo/routesMeta.ts
export const META = {
  "/": {
    title: "CAS Каталог — лучшие персонажи ИИ-чатов",
    description:
      "Найдите идеального собеседника для Character.AI, janitor-ai, chai и других платформ. Каталог, рейтинги, отзывы, подборки и фильтры."
  },
  "/characters": {
    title: "Каталог персонажей — поиск и фильтры",
    description:
      "Сотни персонажей, удобные фильтры по жанрам, тегам и рейтингу. Быстрый поиск и избранное."
  },
  "/rating": {
    title: "Топ персонажей — рейтинг и тренды",
    description:
      "Еженедельно обновляемый топ: что сейчас популярно у пользователей CAS Каталога."
  },
  "/favorites": {
    title: "Избранные персонажи",
    description: "Ваша личная коллекция понравившихся персонажей."
  },
  "/user-characters": {
    title: "Мои персонажи",
    description: "Управляйте вашими персонажами: редактируйте, публикуйте, делитесь ссылками."
  },
  "/submit-character": {
    title: "Добавить персонажа",
    description: "Опубликуйте своего персонажа в каталоге: описание, теги, ссылки и превью."
  },
  "/notifications": {
    title: "Уведомления",
    description: "Лайки, отзывы и системные обновления.",
    noindex: true
  },
  "/profile": {
    title: "Профиль",
    description: "Настройки аккаунта и персональные данные.",
    noindex: true
  },
  "/support": {
    title: "Поддержка — связь с нами",
    description: "Задайте вопрос, сообщите об ошибке, оставьте предложение."
  },
  "/login": { title: "Войти", description: "Авторизация в CAS Каталоге.", noindex: true },
  "/register": { title: "Регистрация", description: "Создайте аккаунт в CAS Каталоге.", noindex: true },
  "/shop": { title: "Магазин", description: "Подборки и премиальные персонажи.", noindex: false }
  // Для dynamic: characters/:characterId — задавайте на странице персонажа.
} as const;

export type RouteKey = keyof typeof META;