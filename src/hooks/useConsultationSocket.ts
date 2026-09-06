import { useEffect, useRef, useState } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from '@/utils/axiosClient';
import { ConsultationMessageItem } from '@/types/consultation';

type SocketStatus = 'idle' | 'connecting' | 'connected' | 'error';

export function useConsultationSocket(
  sessionId: string | number | null,
  onMessage: (message: ConsultationMessageItem) => void
) {
  const [connectionStatus, setConnectionStatus] = useState<SocketStatus>('idle');
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let isMounted = true;
    let stompClient: Client | null = null;

    const connectSocket = async () => {
      try {
        setConnectionStatus('connecting');
        const { ACCESS_TOKEN_KEY } = await import('@/utils/axiosClient');
        const SecureStore = await import('expo-secure-store');
        const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

        if (!accessToken || !isMounted) return;

        stompClient = new Client({
          reconnectDelay: 4000,
          connectHeaders: {
            Authorization: `Bearer ${accessToken}`,
          },
          webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws/consultations`),
          forceBinaryWSFrames: true,
          appendMissingNULLonIncoming: true,
          onConnect: () => {
            setConnectionStatus('connected');
            stompClient?.subscribe(`/topic/consultation-sessions/${sessionId}`, (frame: IMessage) => {
              try {
                const parsed = JSON.parse(frame.body);
                if (parsed.data) {
                  onMessage(parsed.data);
                }
              } catch (e) {
                console.warn('Failed to parse STOMP message', e);
              }
            });
          },
          onStompError: (error) => {
            console.warn('STOMP Error:', error);
            setConnectionStatus('error');
          },
          onWebSocketError: (error) => {
            console.warn('WebSocket Error:', error);
            setConnectionStatus('error');
          },
        });

        clientRef.current = stompClient;
        stompClient.activate();
      } catch (e) {
        console.warn('Socket connect error', e);
        setConnectionStatus('error');
      }
    };

    connectSocket();

    return () => {
      isMounted = false;
      if (stompClient) {
        stompClient.deactivate();
      }
      clientRef.current = null;
    };
  }, [sessionId, onMessage]);

  return { status: connectionStatus };
}
