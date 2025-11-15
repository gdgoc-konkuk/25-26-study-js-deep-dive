interface Reactions {
  '+1': number;
  '-1': number;
  laugh: number;
  hooray: number;
  confused: number;
  heart: number;
  rocket: number;
  eyes: number;
}

interface CommentReactionsProps {
  reactions: Reactions;
}

const REACTION_EMOJIS: Record<keyof Reactions, string> = {
  '+1': '👍',
  '-1': '👎',
  laugh: '😄',
  hooray: '🎉',
  confused: '😕',
  heart: '❤️',
  rocket: '🚀',
  eyes: '👀',
};

export default function CommentReactions({ reactions }: CommentReactionsProps) {
  const hasReactions = Object.values(reactions).some(count => count > 0);

  if (!hasReactions) return null;

  return (
    <div className="flex items-center gap-2 mt-2 flex-wrap">
      {Object.entries(reactions).map(([key, count]) => {
        if (count === 0) return null;

        return (
          <span
            key={key}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full border border-gray-300 dark:border-gray-600"
            title={`${count} reaction${count > 1 ? 's' : ''}`}
          >
            <span>{REACTION_EMOJIS[key as keyof Reactions]}</span>
            <span className="text-gray-600 dark:text-gray-400">{count}</span>
          </span>
        );
      })}
    </div>
  );
}
