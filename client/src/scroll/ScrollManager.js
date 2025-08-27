export class ScrollManager {
  constructor() {
    this.container = null;
    this.policy = { isUserAtBottom: true, initialLoaded: false };
    this.bottomThreshold = 48;
    this.onScroll = this.onScroll.bind(this);
  }

  attach(container) {
    this.container = container;
    container.addEventListener('scroll', this.onScroll, { passive: true });
    this.recalcBottom();
  }

  detach() {
    if (this.container) {
      this.container.removeEventListener('scroll', this.onScroll);
      this.container = null;
    }
  }

  onScroll() {
    this.recalcBottom();
  }

  recalcBottom() {
    const el = this.container;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    this.policy.isUserAtBottom = dist <= this.bottomThreshold;
  }

  scrollToBottom(behavior = 'auto') {
    const el = this.container;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    this.policy.isUserAtBottom = true;
  }

  shouldFollowNewMessage({ isOwn }) {
    if (isOwn) return true;
    if (!this.policy.initialLoaded) return true;
    return this.policy.isUserAtBottom;
  }
}

export default ScrollManager;
