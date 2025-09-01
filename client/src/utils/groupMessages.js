export function groupMessages(messages, windowMinutes = 5) {
  const windowMs = windowMinutes * 60 * 1000;

  const sorted = messages
    .filter((m) => !Number.isNaN(Date.parse(m.createdAt)))
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

  const groups = [];
  const isSameGroup = (a, b) => {
    const senderA = a.sender?.id || a.sender?._id;
    const senderB = b.sender?.id || b.sender?._id;
    return (
      senderA &&
      senderA === senderB &&
      Math.abs(Date.parse(a.createdAt) - Date.parse(b.createdAt)) <= windowMs &&
      !a.isSystem &&
      !b.isSystem
    );
  };

  for (let i = 0; i < sorted.length; i++) {
    const m = sorted[i];
    if (m.isSystem) {
      groups.push({
        key: `sys-${m.id || m._id}`,
        sender: null,
        startAt: new Date(m.createdAt),
        items: [m],
      });
      continue;
    }
    const prevGroup = groups[groups.length - 1];
    const last = prevGroup?.items[prevGroup.items.length - 1];
    if (prevGroup && last && prevGroup.sender && isSameGroup(last, m)) {
      prevGroup.items.push(m);
    } else {
      groups.push({
        key: `${(m.sender?.id || m.sender?._id)}-${m.id || m._id}`,
        sender: m.sender,
        startAt: new Date(m.createdAt),
        items: [m],
      });
    }
  }
  return groups;
}

export default groupMessages;
