"use client";
import { useState, useEffect, useRef } from "react";

// SVG ICONS
const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const SendIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </svg>
);

// ACTION BUTTON DATA
const ACTIONS = [
  { key: "summarize", label: "Summarize" },
  { key: "enhance", label: "Enhance" },
  { key: "write", label: "Write" },
];

// COMPONENT: ChatBubble
function ChatBubble({ sender, text }) {
  return (
    <div className={`flex ${sender === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          px-4 py-2 rounded-2xl shadow mb-1 max-w-[85%] break-words
          ${sender === "user"
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-gray-100 text-gray-800 rounded-bl-none"
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
  return (
    <button
      key={action.key}
      className={`
        mr-2 mb-2 px-3 py-1 rounded-lg font-medium text-sm border transition
        ${disabled
          ? "bg-gray-100 text-gray-400 border-gray-200 opacity-60 cursor-not-allowed"
          : "bg-blue-50 hover:bg-blue-200 text-blue-800 border-blue-200"
        }
      `}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {action.label}
    </button>
  );
}

// COMPONENT: TypingIndicator
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center px-4 py-2 rounded-2xl rounded-bl-none bg-gray-100 text-gray-800 shadow max-w-[50%] mb-1">
        <span className="inline-flex space-x-1">
          <span className="animate-bounce">•</span>
          <span className="animate-bounce200">•</span>
          <span className="animate-bounce400">•</span>
        </span>
        <style jsx>{`
          .animate-bounce { animation: bounce 1.2s infinite; }
          .animate-bounce200 { animation: bounce 1.2s infinite 0.2s; }
          .animate-bounce400 { animation: bounce 1.2s infinite 0.4s; }
          @keyframes bounce {
            0%,80%,100%{transform:scale(1)}
            40%{transform:scale(1.25)}
          }
        `}</style>
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
    <div className="fixed bottom-24 right-6 w-96 max-w-[95vw] bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden border border-gray-200 z-[9999]">
      {/* Header */}
      <div className="bg-blue-600 text-white px-5 py-3 flex justify-between items-center font-semibold shadow-md">
        <span>Email Assistant 🤖</span>
        <button onClick={closeFn} className="text-2xl leading-none text-blue-200 hover:text-white transition-colors" aria-label="Close chat">&times;</button>
      </div>
      {/* Actions */}
      <div className="flex flex-row px-4 pt-3 bg-gray-50 flex-wrap">
        {ACTIONS.map(action =>
          <ActionButton
            key={action.key}
            action={action}
            onClick={() => handleAction(action.key)}
            disabled={actionsDisabled}
          />
        )}
      </div>
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2 bg-gray-50 h-96">
        {messages.map(msg => (
          <ChatBubble key={msg.id} sender={msg.sender} text={msg.text} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      {/* Input */}
      <div className="flex items-center p-2 border-t bg-white">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Ask your assistant or type your email..."
          className="flex-1 px-3 py-2 text-sm outline-none bg-transparent disabled:opacity-50"
          disabled={loading || actionsDisabled}
          autoComplete="off"
        />
        <button
          onClick={handleSend}
          disabled={loading || actionsDisabled || !input.trim()}
          className="ml-2 p-2 rounded-full text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 transition-all"
          aria-label="Send"
          type="button"
        >
          <SendIcon />
        </button>
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

  // Hydrate on mount - sessionStorage for chatMessagesV2
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("chatMessagesV2");
      if (saved) setMessages(JSON.parse(saved));
      else setMessages([
        { id: "init-1", sender: "assistant", text: "Hello 👋 I’m your Email Assistant. How can I help?" }
      ]);
    }
  }, []);

  // Persist messages to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("chatMessagesV2", JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom when messages or open/close changes
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isOpen, loading]);

  // Focus input on open or after response
  useEffect(() => {
    if (isOpen && inputRef.current && !loading) inputRef.current.focus();
  }, [isOpen, loading]);

  // Prevent rapid API calls: block new calls while loading
  const actionsDisabled = loading;

  // Determines replyText from API response fields
  function parseReply(data) {
    if (data.reply) return data.reply;
    if (data.writtenContent) return data.writtenContent;
    if (data.enhancedContent) return data.enhancedContent;
    if (data.summary) return data.summary;
    if (data.error) return `⚠️ ${data.error}`;
    return "Sorry, I didn't understand the response.";
  }

  // API send
  async function sendMessage({ messageText, actionType }) {
    if (loading) return; // avoid race
    setLoading(true);
    setPendingAction(actionType);

    // User message
    setMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}-${Math.random()}`, sender: "user", text: messageText, action: actionType }
    ]);
    setInput("");

    try {
      const res = await fetch("/api/ai/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // allow cookie-based auth
        body: JSON.stringify({ message: messageText, action: actionType }),
      });
      const data = await res.json();
      const replyText = parseReply(data);

      setMessages(prev => [
        ...prev,
        { id: `asst-${Date.now()}-${Math.random()}`, sender: "assistant", text: replyText, action: actionType }
      ]);
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

  // Handle normal send from input
  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage({ messageText: input.trim(), actionType: null });
  };

  // Handle action button click: provide default prompts if no input
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

  // Optionally, clear on logout or user switch
  const clearMessages = () => {
    setMessages([
      { id: "init-1", sender: "assistant", text: "Hello 👋 I’m your Email Assistant. How can I help?" }
    ]);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("chatMessagesV2");
    }
  };

  // Responsive width
  const widthClass = "w-96 max-w-[95vw]";

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
          bg-blue-600 text-white shadow-xl z-[9999]
          hover:bg-blue-700 transition-transform hover:scale-110
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
      {/* (Optional) Add this somewhere to expose clear function:
        <button onClick={clearMessages}>Clear</button>
      */}
    </>
  );
}
