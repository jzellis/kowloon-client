// Rich-media embed registry.
//
// Add a provider the same way you add an ActivityParser handler: drop a file in
// ./providers, export a { name, hosts, match(url), embed(match) } descriptor,
// and register it in PROVIDERS below.
//
// resolveEmbed(url) is the single, shared recognizer used by the server
// (/preview), the web frontend, and the mobile app — so what counts as
// embeddable, and how each iframe `src` is built, lives in exactly one audited
// place. Users only ever supply a plain URL; a descriptor is derived at render
// time, never authored or stored as markup.
//
// A descriptor:
//   {
//     provider:   string,               // e.g. "youtube"
//     mode:       "inline" | "linkout", // can it play in-place, or just link?
//     embedUrl?:  string,               // iframe src (inline mode)
//     thumbnail?: string,               // poster / featured image
//     aspectRatio?: number,             // width / height (default 16/9)
//     title?:     string,
//     allow?:     string,               // iframe allow attribute
//     sandbox?:   string,               // iframe sandbox attribute
//   }

import youtube from "./providers/youtube.js";

// Order matters only if two providers could claim the same host (none do yet).
const PROVIDERS = [youtube];

/**
 * Resolve a URL to a rich-media embed descriptor, or null if no provider
 * recognizes it (in which case it should render as an ordinary link).
 * @param {string} url
 * @returns {object|null}
 */
export function resolveEmbed(url) {
  if (!url || typeof url !== "string") return null;
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;

  const host = u.hostname.toLowerCase();
  for (const provider of PROVIDERS) {
    if (!provider.hosts.has(host)) continue;
    let match = null;
    try {
      match = provider.match(u);
    } catch {
      match = null;
    }
    if (!match) continue;
    try {
      return { aspectRatio: 16 / 9, mode: "inline", ...provider.embed(match) };
    } catch {
      return null;
    }
  }
  return null;
}

/** True if a URL resolves to any known embed provider. */
export function isEmbeddable(url) {
  return resolveEmbed(url) !== null;
}

export { PROVIDERS };
