// YouTube embed provider.
//
// Recognizes the various YouTube URL shapes and returns a descriptor the
// renderers use to build a player. The iframe `src` is ALWAYS constructed here
// from a strictly-validated 11-char video id against a fixed template — user
// input never reaches the src beyond that whitelisted id, so there is no path
// from a shared link to an arbitrary iframe source.

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

// Parse a YouTube start time: "90", "90s", "1m30s", "1h2m3s" → seconds.
function parseStart(raw) {
  if (!raw) return 0;
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  const m = String(raw).match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
  if (!m) return 0;
  const [, h, mn, s] = m;
  return (parseInt(h || 0, 10) * 3600) + (parseInt(mn || 0, 10) * 60) + parseInt(s || 0, 10);
}

function idFrom(u) {
  const host = u.hostname.replace(/^www\./, "");
  // youtu.be/<id>
  if (host === "youtu.be") return u.pathname.split("/").filter(Boolean)[0] || null;
  // /watch?v=<id>
  if (u.pathname === "/watch") return u.searchParams.get("v");
  // /shorts/<id>, /embed/<id>, /live/<id>, /v/<id>
  const m = u.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/);
  if (m) return m[1];
  return null;
}

export default {
  name: "youtube",
  hosts: HOSTS,

  // → { id, start } | null
  match(u) {
    const id = idFrom(u);
    if (!id || !VIDEO_ID.test(id)) return null;
    const start = parseStart(u.searchParams.get("t") || u.searchParams.get("start"));
    return { id, start };
  },

  embed({ id, start }) {
    const params = new URLSearchParams({ rel: "0", modestbranding: "1" });
    if (start) params.set("start", String(start));
    return {
      provider: "youtube",
      mode: "inline",
      // Privacy-preserving host; id is regex-validated above.
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      aspectRatio: 16 / 9,
      title: "YouTube video",
      allow: "autoplay; encrypted-media; picture-in-picture; fullscreen; web-share",
      sandbox: "allow-scripts allow-same-origin allow-presentation allow-popups",
    };
  },
};
