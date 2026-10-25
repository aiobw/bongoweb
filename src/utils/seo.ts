export interface SEOOptions {
  title: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
}

const DEFAULT_TITLE = 'BongoWeb — Premium Ready-Made Websites for Business';
const DEFAULT_DESC = 'Launch your professional online business in 24 hours. Free .com domain, free hosting lifetime, bKash/Nagad automated checkout, and 24/7 dedicated support.';

export function updatePageSEO(options: SEOOptions): void {
  if (typeof document === 'undefined') return;

  const fullTitle = options.title.includes('BongoWeb')
    ? options.title
    : `${options.title} — BongoWeb`;

  document.title = fullTitle;

  // Meta description
  let descMeta = document.querySelector('meta[name="description"]');
  if (!descMeta) {
    descMeta = document.createElement('meta');
    descMeta.setAttribute('name', 'description');
    document.head.appendChild(descMeta);
  }
  descMeta.setAttribute('content', options.description || DEFAULT_DESC);

  // Helper for meta tags
  const setMetaProperty = (prop: string, val: string) => {
    let el = document.querySelector(`meta[property="${prop}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', prop);
      document.head.appendChild(el);
    }
    el.setAttribute('content', val);
  };

  const setMetaName = (name: string, val: string) => {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', val);
  };

  setMetaProperty('og:title', fullTitle);
  setMetaProperty('og:description', options.description || DEFAULT_DESC);
  setMetaName('twitter:title', fullTitle);
  setMetaName('twitter:description', options.description || DEFAULT_DESC);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bongoweb.xyz';
  const canonicalUrl = `${origin}${options.canonicalPath || (typeof window !== 'undefined' ? window.location.pathname : '')}`;

  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl);
  setMetaProperty('og:url', canonicalUrl);
}
