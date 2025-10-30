"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// SVG ICONS
const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
  </svg>
);

const PencilIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
  </svg>
);

// ACTION BUTTON DATA with icons
const ACTIONS = [
  { key: "summarize", label: "Summarize", icon: DocumentIcon },
  { key: "enhance", label: "Enhance", icon: SparklesIcon },
  { key: "write", label: "Write", icon: PencilIcon },
];

// COMPONENT: ChatBubble
function ChatBubble({ sender, text }) {
  return (
    <div className={`flex ${sender === "user" ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`
          px-4 py-3 rounded-2xl shadow-sm max-w-[85%] break-words text-sm
          ${sender === "user"
            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-sm"
            : "bg-white text-gray-800 rounded-bl-sm border border-gray-200"
          }
        `}
        style={{ wordBreak: "break-word" }}
      >
        {text}
      </div>
    </div>
  );
}

// COMPONENT: ActionButton
function ActionButton({ action, onClick, disabled }) {
  const Icon = action.icon;
  return (
    <button
      key={action.key}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm border transition-all
        ${disabled
          ? "bg-gray-100 text-gray-400 border-gray-200 opacity-60 cursor-not-allowed"
          : "bg-white hover:bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300 hover:shadow-sm active:scale-95"
        }
      `}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon />
      {action.label}
    </button>
  );
}

// COMPONENT: TypingIndicator
function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="flex items-center px-4 py-3 rounded-2xl rounded-bl-sm bg-white border border-gray-200 shadow-sm max-w-[50%]">
        <div className="flex space-x-1">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
        </div>
      </div>
    </div>
  );
}

// COMPONENT: ChatWindow
function ChatWindow({
  isOpen,
  closeFn,
  messages,
  loading,
  pendingAction,
  actionsDisabled,
  input,
  setInput,
  handleSend,
  handleAction,
  messagesEndRef,
  inputRef
}) {
  return (
    <div className="fixed bottom-20 right-6 w-[420px] max-w-[calc(100vw-48px)] h-[650px] bg-white shadow-2xl rounded-3xl flex flex-col overflow-hidden border border-gray-200 z-[9999]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 flex justify-between items-center shadow-lg flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <ChatIcon />
          </div>
          <div>
            <span className="font-semibold text-lg">Email Assistant</span>
            <p className="text-xs text-blue-100 mt-0.5">AI-Powered Helper</p>
          </div>
        </div>
        <button 
          onClick={closeFn} 
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors" 
          aria-label="Close chat"
        >
          <span className="text-2xl leading-none">&times;</span>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 flex-shrink-0">
        <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Quick Actions</p>
        <div className="flex gap-2">
          {ACTIONS.map(action =>
            <ActionButton
              key={action.key}
              action={action}
              onClick={() => handleAction(action.key)}
              disabled={actionsDisabled}
            />
          )}
        </div>
      </div>

      {/* Messages - Scrollable */}
      <div 
        className="flex-1 px-4 py-4 overflow-y-auto bg-gradient-to-b from-gray-50 to-white custom-scrollbar"
        style={{ minHeight: 0 }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <ChatIcon />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">How can I help you?</h3>
            <p className="text-sm text-gray-500">Ask me anything about your emails or use quick actions above!</p>
          </div>
        )}
        {messages.map(msg => (
          <ChatBubble key={msg.id} sender={msg.sender} text={msg.text} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - FIXED */}
      <div className="px-4 py-4 border-t border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-2 bg-white rounded-2xl p-2 border-2 border-gray-300 focus-within:border-blue-500 focus-within:shadow-sm transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 text-sm outline-none bg-white text-gray-900 placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || actionsDisabled}
            autoComplete="off"
          />
          <button
            onClick={handleSend}
            disabled={loading || actionsDisabled || !input.trim()}
            className="p-2.5 rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow active:scale-95"
            aria-label="Send"
            type="button"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

// MAIN COMPONENT: AssistantChatPhase2
export default function AssistantChatPhase2() {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // References
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const router = useRouter();

  // Hydrate on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("chatMessagesV2");
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([
          { id: "init-1", sender: "assistant", text: "Hello 👋 I'm your Email Assistant. How can I help you today?" }
        ]);
      }
    }
  }, []);

  // Persist messages
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("chatMessagesV2", JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isOpen, loading]);

  // Focus input
  useEffect(() => {
    if (isOpen && inputRef.current && !loading) {
      inputRef.current.focus();
    }
  }, [isOpen, loading]);

  const actionsDisabled = loading;

  // Parse API response
  function parseReply(data) {
    if (data.navigationPath && data.reply) return data.reply;
    if (data.reply) return data.reply;
    if (data.writtenContent) return data.writtenContent;
    if (data.enhancedContent) return data.enhancedContent;
    if (data.summary) return data.summary;
    if (data.error) return `⚠️ ${data.error}`;
    return "Sorry, I didn't understand the response.";
  }

  // Send message to API
  async function sendMessage({ messageText, actionType }) {
    if (loading) return;
    setLoading(true);
    setPendingAction(actionType);

    setMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}-${Math.random()}`, sender: "user", text: messageText, action: actionType }
    ]);
    setInput("");

    try {
      const res = await fetch("/api/ai/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: messageText, action: actionType }),
      });
      const data = await res.json();
      const replyText = parseReply(data);

      setMessages(prev => [
        ...prev,
        { id: `asst-${Date.now()}-${Math.random()}`, sender: "assistant", text: replyText, action: actionType }
      ]);

      // Navigation handling
      if (data.navigationPath) {
        console.log(`Navigation requested: ${data.navigationPath}`);
        setTimeout(() => {
          setIsOpen(false);
          router.push(data.navigationPath);
        }, 1000);
      }

    } catch (err) {
      console.error("AI Assistant API error:", err);
      setMessages(prev => [
        ...prev,
        { id: `asst-${Date.now()}-${Math.random()}`, sender: "assistant", text: "⚠️ Sorry, I couldn't get a response due to a server error.", action: actionType }
      ]);
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  }

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage({ messageText: input.trim(), actionType: null });
  };

  const handleAction = (actionKey) => {
    if (loading) return;
    const userText = input.trim();
    let fallbackPrompts = {
      summarize: "Summarize the following email or content.",
      enhance: "Enhance the clarity and professionalism of this message.",
      write: "Write a professional email on my behalf."
    };
    sendMessage({
      messageText: userText || fallbackPrompts[actionKey] || "Help me!",
      actionType: actionKey
    });
  };

  return (
    <>
      {isOpen && (
        <ChatWindow
          isOpen={isOpen}
          closeFn={() => setIsOpen(false)}
          messages={messages}
          loading={loading}
          pendingAction={pendingAction}
          actionsDisabled={actionsDisabled}
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          handleAction={handleAction}
          messagesEndRef={messagesEndRef}
          inputRef={inputRef}
        />
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`
          fixed bottom-6 right-6 w-16 h-16 rounded-full flex items-center justify-center
          bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-2xl z-[9999]
          hover:from-blue-700 hover:to-blue-600 transition-all hover:scale-110 active:scale-95
          ${isOpen ? 'rotate-0' : 'hover:rotate-12'}
        `}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        type="button"
      >
        {isOpen ? (
          <span className="text-3xl font-bold">&times;</span>
        ) : (
          <ChatIcon />
        )}
      </button>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </>
  );
}