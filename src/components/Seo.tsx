import { useEffect } from "react";

interface SeoProps {
  title: string;
  description: string;
  path?: string;
  noindex?: boolean;
}

function setMeta(name: string, content: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    if (property) element.setAttribute("property", name);
    else element.setAttribute("name", name);
    document.head.appendChild(element);
  }
  element.content = content;
}

export default function Seo({ title, description, path = "/", noindex = false }: SeoProps) {
  useEffect(() => {
    document.title = title;
    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("robots", noindex ? "noindex, nofollow" : "index, follow");

    const siteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "");
    if (!siteUrl) return;
    const canonicalUrl = `${siteUrl}${path}`;
    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
    setMeta("og:url", canonicalUrl, true);
  }, [description, noindex, path, title]);

  return null;
}
