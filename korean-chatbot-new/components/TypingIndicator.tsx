export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-2 flex space-x-1">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i}
            className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  );
}