// web/src/components/Chatbot/MessageBubble.tsx
interface MessageProps {
  role: 'user' | 'bot';
  text: string;
}

export const MessageBubble = ({ role, text }: MessageProps) => {
  const isUser = role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#eb3489] to-orange-400 flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold mr-3 mt-1 shadow-md">
          A
        </div>
      )}
      <div 
        className={`max-w-[85%] px-5 py-3.5 rounded-[1.5rem] shadow-sm relative transition-all duration-300
          ${isUser 
            ? 'bg-gradient-to-br from-[#eb3489] to-[#d42c7a] text-white rounded-tr-none shadow-pink-500/10' 
            : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-700/50 rounded-tl-none shadow-zinc-200/50 dark:shadow-none'
          }`}
      >
        <p className="text-[15px] leading-[1.6] font-medium tracking-tight">
          {text}
        </p>
        
        {/* Subtle timestamp or indicator could go here */}
        <div className={`absolute bottom-[-18px] ${isUser ? 'right-0' : 'left-0'} text-[10px] opacity-40 font-semibold uppercase tracking-wider`}>
          {isUser ? 'You' : 'Amma'}
        </div>
      </div>
    </div>
  );
};