// web/src/components/Chatbot/TypingIndicator.tsx
export const TypingIndicator = () => (
  <div className="flex justify-start animate-in fade-in duration-500">
    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex-shrink-0 flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-[10px] font-bold mr-3 mt-1">
      A
    </div>
    <div className="bg-zinc-100 dark:bg-zinc-800 px-5 py-4 rounded-[1.5rem] rounded-tl-none flex gap-1.5 items-center shadow-sm">
      <span className="w-1.5 h-1.5 bg-[#eb3489]/60 rounded-full animate-bounce [animation-duration:0.8s]"></span>
      <span className="w-1.5 h-1.5 bg-[#eb3489]/60 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></span>
      <span className="w-1.5 h-1.5 bg-[#eb3489]/60 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></span>
    </div>
  </div>
);