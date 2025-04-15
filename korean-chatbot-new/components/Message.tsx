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
      <div className={`max-w-[85%] rounded-2xl p-4 relative
        ${isError 
          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          : isUser
            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-gray-800 dark:text-gray-200 rounded-br-none'
            : 'bg-gray-100 dark:bg-[#2d2d2d] text-gray-800 dark:text-gray-200 rounded-bl-none'
        }`
      }>
        <div className="whitespace-pre-wrap">{text}</div>
        {timestamp && (
          <div className={`text-xs mt-2 ${
            isUser ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {format(new Date(timestamp), 'a h:mm', { locale: ko })}
          </div>
        )}
      </div>
    </div>
  );
}