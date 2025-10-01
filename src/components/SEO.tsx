// src/components/SEO.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

export type SEOProps = {{
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  image?: string; // absolute or relative path
  jsonLd?: object | object[]; // structured data
}};

const ABSOLUTE = (url?: string) => {{
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return 'https://cascharacters.ru' + (url.startsWith('/') ? url : '/' + url);
}};

export const SEO: React.FC<SEOProps> = ({{ title, description, canonical, noindex, image, jsonLd }}) => {{
  const absCanonical = ABSOLUTE(canonical);
  const absImage = ABSOLUTE(image);
  return (
    <Helmet>
      {{title && <title>{{title}}</title>}}
      {{description && <meta name="description" content={{description}} />}}

      {{absCanonical && <link rel="canonical" href={{absCanonical}} />}}
      {{noindex && <meta name="robots" content="noindex,nofollow" />}}

      {/* Open Graph */}
      {{title && <meta property="og:title" content={{title}} />}}
      {{description && <meta property="og:description" content={{description}} />}}
      <meta property="og:type" content="website" />
      {{absCanonical && <meta property="og:url" content={{absCanonical}} />}}
      {{absImage && <meta property="og:image" content={{absImage}} />}}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      {{title && <meta name="twitter:title" content={{title}} />}}
      {{description && <meta name="twitter:description" content={{description}} />}}
      {{absImage && <meta name="twitter:image" content={{absImage}} />}}

      {/* JSON-LD */}
      {{jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
        }} />
      )}}
    </Helmet>
  );
}};

export default SEO;