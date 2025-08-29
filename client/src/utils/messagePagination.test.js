import { mergeMessages, retainScrollPosition, shouldLoadMore } from './messagePagination';

describe('message pagination utils', () => {
  const genMsgs = (count, start = 0) => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({ _id: `${start + i}`, createdAt: new Date().toISOString() });
    }
    return arr;
  };

  test('initial load returns 20 items', () => {
    const initial = genMsgs(20);
    const merged = mergeMessages([], initial);
    expect(merged).toHaveLength(20);
  });

  test('top-scroll load prepends 20 older items', () => {
    const initial = genMsgs(20, 20);
    let merged = mergeMessages([], initial);
    merged = mergeMessages(merged, genMsgs(20, 0));
    expect(merged).toHaveLength(40);
    expect(merged[0]._id).toBe('0');
  });

  test('deduping avoids duplicates', () => {
    const existing = genMsgs(20, 10);
    const older = genMsgs(20, 0); // includes overlap 10-19
    const merged = mergeMessages(existing, older);
    expect(merged).toHaveLength(30);
  });

  test('retainScrollPosition keeps anchor', () => {
    const el = { scrollHeight: 1000, scrollTop: 100 };
    const prev = el.scrollHeight;
    el.scrollHeight = 1200; // after prepending 200px
    retainScrollPosition(el, prev);
    expect(el.scrollTop).toBe(300);
  });

  test('shouldLoadMore respects hasMore flag', () => {
    expect(shouldLoadMore({ hasMore: true, loading: false })).toBe(true);
    expect(shouldLoadMore({ hasMore: false, loading: false })).toBe(false);
  });
});
