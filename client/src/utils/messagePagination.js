export const mergeMessages = (existing, incoming) => {
  const idSet = new Set(existing.map(m => m._id));
  const filtered = incoming.filter(m => !idSet.has(m._id));
  return [...filtered, ...existing];
};

export const retainScrollPosition = (el, prevHeight) => {
  if (!el) return;
  const diff = el.scrollHeight - prevHeight;
  if (diff > 0) {
    el.scrollTop += diff;
  }
};

export const shouldLoadMore = ({ hasMore, loading }) => hasMore && !loading;

export default { mergeMessages, retainScrollPosition, shouldLoadMore };
