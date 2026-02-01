import { useEffect, useRef, useState, useCallback } from "react";
import axios from "../api/axios";

function Chat({ sessionId, token, onSessionEnd }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [sessionEnded, setSessionEnded] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const reconnectAttempt = useRef(0);
  const maxReconnects = 3;

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const WS_URL = API_URL.replace('http', 'ws');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Load history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await axios.get(`/chat/messages/${sessionId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(res.data || []);
      } catch (err) {
        console.error("Failed to load history:", err);
      }
    };
    if (sessionId) loadHistory();
  }, [sessionId, token]);

  // WebSocket
  useEffect(() => {
    if (!sessionId || sessionEnded) return;

    const connect = () => {
      const wsUrl = `${WS_URL}/ws/chat/${sessionId}/?token=${token}`;
      console.log("Chat WS: Connecting...");
      setConnectionStatus("connecting");

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("Chat WS: Connected");
        setConnectionStatus("connected");
        reconnectAttempt.current = 0;
      };

      socket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log("Chat WS Message:", data.type);

          if (data.type === "session_ended") {
            setSessionEnded(true);
            setConnectionStatus("ended");
            if (onSessionEnd) onSessionEnd(data.ended_by);
            return;
          }

          if (data.type === "typing") {
            setIsTyping(true);
            clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => setIsTyping(false), 2000);
            return;
          }

          if (data.type === "chat_message") {
            setMessages(prev => [...prev, data]);
            setIsTyping(false);
          }
        } catch (err) {
          console.error("Parse error:", err);
        }
      };

      socket.onerror = () => setConnectionStatus("error");

      socket.onclose = (e) => {
        console.log(`Chat WS closed: ${e.code}`);
        if (e.code === 1000 || sessionEnded) {
          setConnectionStatus("ended");
          return;
        }
        
        if (reconnectAttempt.current < maxReconnects) {
          reconnectAttempt.current++;
          setTimeout(connect, 2000 * reconnectAttempt.current);
        } else {
          setConnectionStatus("failed");
        }
      };
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close(1000, "Component unmount");
      }
      clearTimeout(typingTimeout.current);
    };
  }, [sessionId, token, onSessionEnd, sessionEnded]);

  const sendMessage = () => {
    if (!input.trim() || socketRef.current?.readyState !== WebSocket.OPEN || sessionEnded) return;
    socketRef.current.send(JSON.stringify({ type: "message", content: input.trim() }));
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (!sessionEnded) {
      socketRef.current?.send(JSON.stringify({ type: "typing" }));
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  if (sessionEnded) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-950 rounded-xl border border-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Session Ended</h3>
          <p className="text-sm text-gray-500">This conversation has been closed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500' : connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-400 uppercase">{connectionStatus}</span>
        </div>
        {isTyping && <span className="text-xs text-gray-500 italic">typing...</span>}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">Start the conversation</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender_role === 'SEEKER' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] ${msg.sender_role === 'SEEKER' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`px-4 py-2 rounded-2xl text-sm ${msg.sender_role === 'SEEKER' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-gray-800 text-gray-100 rounded-bl-md border border-gray-700'}`}>
                {msg.content}
              </div>
              <span className="text-[10px] text-gray-500 mt-1 px-1">{formatTime(msg.timestamp)}</span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 resize-none outline-none focus:border-gray-700"
            style={{ minHeight: "40px", maxHeight: "100px" }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
            }}
          />
          <button onClick={sendMessage} disabled={!input.trim() || connectionStatus !== 'connected'} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium transition">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;