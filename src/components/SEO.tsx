import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  noindex?: boolean;
}

export const SEO = ({ title, description, image, noindex = false }: SEOProps) => {
  const location = useLocation();
  const baseUrl = 'https://paletteplot.com';
  const url = `${baseUrl}${location.pathname}`;

  useEffect(() => {
    // Update title - if title is empty string, use just "Palette Plotting", if provided, append it
    if (title === '') {
      document.title = 'Palette Plotting';
    } else if (title) {
      document.title = `${title} | Palette Plotting`;
    }

    // Update or create meta tags
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const selector = isProperty 
        ? `meta[property="${name}"]` 
        : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Update description
    if (description) {
      updateMeta('description', description);
      updateMeta('og:description', description, true);
      updateMeta('twitter:description', description);
    }

    // Update OG tags
    if (title) {
      updateMeta('og:title', `${title} | Palette Plotting`, true);
      updateMeta('twitter:title', `${title} | Palette Plotting`);
    }
    updateMeta('og:url', url, true);
    if (image) {
      updateMeta('og:image', image, true);
      updateMeta('twitter:image', image);
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    // Robots meta
    if (noindex) {
      updateMeta('robots', 'noindex, nofollow');
    } else {
      // Remove noindex if it exists
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta && robotsMeta.getAttribute('content')?.includes('noindex')) {
        robotsMeta.remove();
      }
    }
  }, [title, description, image, url, noindex]);

  return null;
};
