import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface MessageProps {
  text: string;
  isUser: boolean;
  timestamp?: Date;
  isError?: boolean;
}

export default function Message({ text, isUser, timestamp, isError }: MessageProps) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        max-w-[85%] md:max-w-[75%] rounded-2xl p-4 relative
        ${isError 
          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800'
          : isUser
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-bl-none'
        }`
      }>
        <div className="whitespace-pre-wrap">{text}</div>
        {timestamp && (
          <div className={`text-xs mt-1 ${
            isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {format(new Date(timestamp), 'a h:mm', { locale: ko })}
          </div>
        )}
        {isUser && (
          <div className="absolute -right-2 -bottom-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
            ✓
          </div>
        )}
      </div>
    </div>
  );
}