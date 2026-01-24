import { useEffect, useRef, useState } from "react";
import axios from "../api/axios";

function Chat({ sessionId, token }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [ended, setEnded] = useState(false);
  const [ending, setEnding] = useState(false);

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (ended) return;

    const wsUrl = `ws://127.0.0.1:8000/ws/chat/${sessionId}/?token=${token}`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "typing") {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 1500);
        return;
      }

      if (data.type === "session_ended") {
        setEnded(true);
        socketRef.current.close();
        return;
      }

      setMessages((prev) => [...prev, data]);
    };

    socketRef.current.onerror = (e) => {
      console.error("WebSocket error", e);
    };

    return () => {
      socketRef.current?.close();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [sessionId, token, ended]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (!input.trim() || ended) return;

    socketRef.current.send(
      JSON.stringify({
        type: "message",
        content: input,
      })
    );

    setInput("");
  };

  const handleTyping = () => {
    if (ended) return;
    socketRef.current.send(JSON.stringify({ type: "typing" }));
  };

  const endSession = async () => {
    if (!window.confirm("Are you sure you want to end this session?")) return;

    try {
      setEnding(true);
      await axios.post(`/chat/end/${sessionId}/`);

      // Notify other user via WS
      socketRef.current.send(
        JSON.stringify({ type: "session_ended" })
      );

      setEnded(true);
      socketRef.current.close();
    } catch (err) {
      alert("Failed to end session");
    } finally {
      setEnding(false);
    }
  };

  const formatTime = (timestamp) =>
    timestamp
      ? new Date(timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  return (
    <div className="mt-4 bg-gray-950/60 border border-gray-800 rounded-2xl p-4">

      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-gray-400">
          Conversation
        </span>

        {!ended && (
          <button
            onClick={endSession}
            disabled={ending}
            className="text-xs px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-700 transition disabled:opacity-50"
          >
            End Session
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="h-[320px] overflow-y-auto space-y-4 px-1">

        {messages.length === 0 && !ended && (
          <p className="text-gray-500 text-sm text-center mt-24">
            Start the conversation when you’re ready.
          </p>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.sender_role === "SEEKER"
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div className="flex flex-col max-w-[60%]">
              <div
                className={`inline-block px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm
                  ${
                    msg.sender_role === "SEEKER"
                      ? "bg-sky-500/90 text-white rounded-br-md"
                      : "bg-gray-700/90 text-gray-100 rounded-bl-md"
                  }
                `}
              >
                {msg.content}
              </div>

              <span
                className={`text-xs text-gray-500 mt-1 ${
                  msg.sender_role === "SEEKER"
                    ? "text-right"
                    : "text-left"
                }`}
              >
                {formatTime(msg.timestamp)}
              </span>
            </div>
          </div>
        ))}

        {isTyping && !ended && (
          <div className="flex justify-start">
            <div className="text-xs text-gray-400 italic animate-pulse">
              Volunteer is typing…
            </div>
          </div>
        )}

        {ended && (
          <div className="text-center text-sm text-gray-400 mt-20">
            This session has ended.  
            Thank you for being here.
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!ended && (
        <div className="mt-4 flex items-center gap-3 bg-gray-900/80 border border-gray-800 rounded-2xl px-4 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              handleTyping();
              if (e.key === "Enter") sendMessage();
            }}
            placeholder="Type a message…"
            className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 outline-none"
          />
          <button
            onClick={sendMessage}
            className="bg-sky-600 hover:bg-sky-700 text-sm px-4 py-1.5 rounded-xl transition"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}

export default Chat;
