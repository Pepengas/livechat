# Chat Components

This chat UI groups consecutive messages from the same sender into a `MessageGroup` when messages are within five minutes of each other. Each group shows the sender's avatar and name only on the first message. Subsequent messages align under the first entry without repeating avatar or name.

Use `groupMessages(messages, windowMinutes)` from `src/utils/groupMessages` to build the groups. Date changes automatically insert a `DateDivider` in `MessageList`.
