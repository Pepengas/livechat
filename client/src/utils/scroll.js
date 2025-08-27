export const isAtBottom = (el, thresholdPx = 4) => {
  if (!el) return false;
  return el.scrollHeight - el.scrollTop - el.clientHeight <= thresholdPx;
};
