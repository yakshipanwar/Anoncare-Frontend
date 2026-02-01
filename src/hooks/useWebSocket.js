import { useEffect, useRef, useState, useCallback } from 'react';

export const useWebSocket = (url, options = {}) => {
  const { onMessage, onConnect, onDisconnect, reconnectInterval = 3000 } = options;
  
  const [status, setStatus] = useState('disconnected');
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const heartbeatInterval = useRef(null);
  const missedPongs = useRef(0);
  const isConnecting = useRef(false); // Prevent duplicate connections
  const lastReconnect = useRef(0);

  const connect = useCallback(() => {
    // CRITICAL: Prevent multiple simultaneous connection attempts
    if (isConnecting.current || ws.current?.readyState === WebSocket.OPEN) {
      console.log("Already connecting or connected, skipping");
      return;
    }
    
    // Rate limit reconnects (max 1 per 2 seconds)
    const now = Date.now();
    if (now - lastReconnect.current < 2000) {
      console.log("Reconnect rate limited");
      return;
    }
    lastReconnect.current = now;
    isConnecting.current = true;
    
    console.log(`WS Connecting: ${url.split('?')[0]}...`);
    setStatus('connecting');

    try {
      const socket = new WebSocket(url);
      ws.current = socket;

      socket.onopen = () => {
        console.log('WS Connected');
        isConnecting.current = false;
        setStatus('connected');
        missedPongs.current = 0;
        onConnect?.();
        
        // Heartbeat every 30s
        heartbeatInterval.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            if (missedPongs.current >= 2) {
              console.log('Missed pongs, reconnecting');
              socket.close();
              return;
            }
            socket.send(JSON.stringify({ type: 'ping' }));
            missedPongs.current++;
          }
        }, 30000);
      };

      socket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'pong') {
            missedPongs.current = 0;
            return;
          }
          if (data.type === 'ping') {
            socket.send(JSON.stringify({ type: 'pong' }));
            return;
          }
          onMessage?.(data);
        } catch (err) {
          console.error('WS Parse error:', err);
        }
      };

      socket.onerror = (e) => {
        console.error('WS Error');
        isConnecting.current = false;
        setStatus('error');
      };

      socket.onclose = (e) => {
        console.log(`WS Closed: ${e.code}`);
        isConnecting.current = false;
        setStatus('disconnected');
        clearInterval(heartbeatInterval.current);
        onDisconnect?.(e);
        
        // Only auto-reconnect if not intentionally closed
        if (e.code !== 1000 && e.code !== 1001) {
          const delay = Math.max(reconnectInterval, 2000); // Minimum 2s delay
          reconnectTimeout.current = setTimeout(connect, delay);
        }
      };

    } catch (err) {
      console.error('WS Exception:', err);
      isConnecting.current = false;
      setStatus('error');
    }
  }, [url, onMessage, onConnect, onDisconnect, reconnectInterval]);

  const disconnect = useCallback((code = 1000, reason = 'Client disconnect') => {
    clearTimeout(reconnectTimeout.current);
    clearInterval(heartbeatInterval.current);
    if (ws.current) {
      ws.current.close(code, reason);
      ws.current = null;
    }
  }, []);

  const send = useCallback((data) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect(1000, 'Component unmount');
  }, [connect, disconnect]);

  return { status, error: status === 'error', send, disconnect, reconnect: connect };
};