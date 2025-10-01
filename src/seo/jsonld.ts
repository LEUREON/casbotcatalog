// src/seo/jsonld.ts
export const orgJsonLd = ({ name = "CAS Каталог", url = "https://cascharacters.ru", logo = "/favicon.svg" } = {}) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name,
  url,
  logo: url + (logo.startsWith('/') ? logo : '/' + logo)
});

export const websiteJsonLd = ({ name = "CAS Каталог", url = "https://cascharacters.ru" } = {}) => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name,
  url
  // You can add potentialAction SearchAction later if you expose a search URL with ?q=
});

export const collectionPageJsonLd = ({ name = "Персонажи", url = "https://cascharacters.ru/characters" } = {}) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name,
  url
});

export const characterJsonLd = (c: { id: string; name: string; description?: string; image?: string; rating?: number; reviewCount?: number }) => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://cascharacters.ru/characters/" + c.id,
  name: c.name,
  description: c.description,
  image: c.image && (c.image.startsWith('http') ? c.image : "https://cascharacters.ru" + (c.image.startsWith('/') ? c.image : '/' + c.image))
});