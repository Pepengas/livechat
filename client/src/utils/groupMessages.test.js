import { groupMessages } from './groupMessages';

describe('groupMessages', () => {
  const userA = { id: 'a', name: 'A' };
  const userB = { id: 'b', name: 'B' };

  it('groups consecutive messages from same sender within window', () => {
    const msgs = [
      { id: '1', sender: userA, createdAt: '2020-01-01T00:00:00Z' },
      { id: '2', sender: userA, createdAt: '2020-01-01T00:03:00Z' },
    ];
    const groups = groupMessages(msgs);
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(2);
  });

  it('starts new group when sender changes', () => {
    const msgs = [
      { id: '1', sender: userA, createdAt: '2020-01-01T00:00:00Z' },
      { id: '2', sender: userB, createdAt: '2020-01-01T00:01:00Z' },
    ];
    const groups = groupMessages(msgs);
    expect(groups).toHaveLength(2);
  });

  it('starts new group when time gap exceeds window', () => {
    const msgs = [
      { id: '1', sender: userA, createdAt: '2020-01-01T00:00:00Z' },
      { id: '2', sender: userA, createdAt: '2020-01-01T00:06:00Z' },
    ];
    const groups = groupMessages(msgs);
    expect(groups).toHaveLength(2);
  });

  it('handles system messages separately', () => {
    const msgs = [
      { id: '1', sender: userA, createdAt: '2020-01-01T00:00:00Z' },
      { id: '2', isSystem: true, text: 'User joined', createdAt: '2020-01-01T00:01:00Z' },
      { id: '3', sender: userA, createdAt: '2020-01-01T00:02:00Z' },
    ];
    const groups = groupMessages(msgs);
    expect(groups).toHaveLength(3);
    expect(groups[1].sender).toBeNull();
  });

  it('maintains order for messages with identical timestamps', () => {
    const msgs = [
      { id: '1', sender: userA, createdAt: '2020-01-01T00:00:00Z' },
      { id: '2', sender: userB, createdAt: '2020-01-01T00:00:00Z' },
      { id: '3', sender: userA, createdAt: '2020-01-01T00:00:00Z' },
    ];
    const groups = groupMessages(msgs);
    expect(groups.map((g) => g.items[0].id)).toEqual(['1', '2', '3']);
  });
});
