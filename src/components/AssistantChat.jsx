"use client";
import { useState, useEffect, useRef } from "react";

// --- SVG Icon Components ---
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

export default function AssistantChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: "init-1", sender: "assistant", text: "Hello 👋 I’m your Email Assistant. How can I help?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // After mount, hydrate messages from sessionStorage (fixes hydration mismatch)
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = sessionStorage.getItem("chatMessages");
            if (saved) setMessages(JSON.parse(saved));
        }
    }, []);

    // Scroll to bottom when messages update or on open
    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    }, [messages, isOpen]);

    // Persist messages to sessionStorage on update (guarded for browser)
    useEffect(() => {
        if (typeof window !== "undefined") {
            sessionStorage.setItem("chatMessages", JSON.stringify(messages));
        }
    }, [messages]);

    // Focus input when open or after loading is done
    useEffect(() => {
        if (isOpen && inputRef.current && !loading) {
            inputRef.current.focus();
        }
    }, [isOpen, loading]);

    async function sendMessageToAPI(message) {
        try {
            const res = await fetch("/api/ai/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            });
            const data = await res.json();
            return data.reply;
        } catch (err) {
            console.error("API error:", err);
            return "Sorry, I couldn't get a response.";
        }
    }

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = { id: `user-${Date.now()}`, sender: "user", text: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        const reply = await sendMessageToAPI(userMessage.text);
        setLoading(false);

        const assistantMessage = { id: `asst-${Date.now()}`, sender: "assistant", text: reply };
        setMessages((prev) => [...prev, assistantMessage]);
    };

    const ChatWindow = () => (
        <div className="fixed bottom-24 right-6 w-96 bg-white shadow-2xl rounded-2xl flex flex-col overflow-hidden border border-gray-200/80 z-[9999]">
            <div className="bg-blue-600 text-white px-5 py-3 flex justify-between items-center font-semibold shadow-md">
                <span>Email Assistant 🤖</span>
                <button onClick={() => setIsOpen(false)} className="text-2xl leading-none text-blue-200 hover:text-white transition-colors">&times;</button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 h-96 bg-gray-50">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`p-3 rounded-xl max-w-[85%] text-sm ${msg.sender === "user"
                            ? "ml-auto bg-blue-500 text-white rounded-br-none"
                            : "mr-auto bg-gray-200 text-gray-800 rounded-bl-none"
                        }`}
                    >
                        {msg.text}
                    </div>
                ))}
                {loading && (
                    <div className="mr-auto bg-gray-200 text-gray-800 p-3 rounded-xl max-w-[50%] rounded-bl-none animate-pulse">
                        Typing...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="flex items-center p-2 border-t bg-white">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSend();
                    }}
                    placeholder="Ask your assistant..."
                    className="flex-1 px-3 py-2 text-sm outline-none bg-transparent disabled:opacity-50"
                    disabled={loading}
                />
                <button
                    onClick={handleSend}
                    disabled={loading}
                    className="p-2 rounded-full text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 transition-all"
                >
                    <SendIcon />
                </button>
            </div>
        </div>
    );

    return (
        <>
            {isOpen && <ChatWindow />}
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-blue-700 transition-transform hover:scale-110 z-[9999]"
            >
                {isOpen ? (
                    <span className="text-3xl font-bold">&times;</span>
                ) : (
                    <ChatIcon />
                )}
            </button>
        </>
    );
}
