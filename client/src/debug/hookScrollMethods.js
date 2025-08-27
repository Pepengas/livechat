export function hookScrollMethods(el, tag = 'chat') {
  const origScrollTo = el.scrollTo.bind(el);
  el.scrollTo = (...args) => {
    console.warn(`[SCROLL-TRACE:${tag}] scrollTo`, args, new Error().stack);
    return origScrollTo(...args);
  };
  const origSIV = el.scrollIntoView && el.scrollIntoView.bind(el);
  if (origSIV) {
    el.scrollIntoView = (...args) => {
      console.warn(`[SCROLL-TRACE:${tag}] scrollIntoView`, args, new Error().stack);
      return origSIV(...args);
    };
  }
}
