// Pure helpers for feed-selector pins. Operate on ordered arrays of Kowloon IDs
// (circle:…@domain / group:…@domain), first = topmost. Shared by web + mobile so
// the pin/unpin/sort behavior is identical. Persist a new list via
// activities.setPins({ circles } | { groups }).

// New list with `id` pinned to the top (deduped).
export function pin(list, id) {
  const rest = (list || []).filter((x) => x !== id);
  return [id, ...rest];
}

// New list with `id` removed.
export function unpin(list, id) {
  return (list || []).filter((x) => x !== id);
}

// Toggle `id`'s pinned state; newly-pinned goes to the top.
export function togglePin(list, id) {
  return (list || []).includes(id) ? unpin(list, id) : pin(list, id);
}

// True if `id` is currently pinned.
export function isPinned(list, id) {
  return (list || []).includes(id);
}

// Sort `items` (each with `.id`, a Kowloon ID) so pinned ones lead in `pinned`
// order, then the rest keep their original order. Non-destructive.
export function sortByPins(items, pinned) {
  const order = new Map((pinned || []).map((id, i) => [id, i]));
  const pinnedItems = [];
  const rest = [];
  for (const it of items || []) {
    (it && order.has(it.id) ? pinnedItems : rest).push(it);
  }
  pinnedItems.sort((a, b) => order.get(a.id) - order.get(b.id));
  return [...pinnedItems, ...rest];
}
