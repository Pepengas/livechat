import React from 'react';

interface ReplyPreviewProps {
  reply: any;
  onClick?: () => void;
}

const ReplyPreview: React.FC<ReplyPreviewProps> = ({ reply, onClick }) => {
  if (!reply) return null;
  return (
    <div
      className="mb-1 p-2 rounded bg-panel-2 border-l-2 border-[color:var(--primary)] cursor-pointer overflow-hidden text-sm"
      onClick={onClick}
    >
      {reply.isUnavailable ? (
        <div className="text-[color:var(--text-dim)]">Original message unavailable</div>
      ) : (
        <div>
          <div className="text-xs text-[color:var(--text-dim)]">{reply.senderName}</div>
          <div className="truncate flex items-center gap-2">
            {reply.thumbUrl && (
              <img src={reply.thumbUrl} alt="thumb" className="w-8 h-8 object-cover rounded" />
            )}
            {reply.excerpt}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReplyPreview;
