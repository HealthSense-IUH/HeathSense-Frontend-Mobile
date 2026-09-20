import { useEffect, useRef, useState } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, preserveUnsafeIntegers, ACCESS_TOKEN_KEY } from '@/utils/axiosClient';
import { ConsultationMessageItem } from '@/types/consultation';

export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'error';

export const getWebSocketUrl = (baseUrl: string): string => {
  const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
  const cleanUrl = baseUrl.replace(/^https?:\/\//, '');
  return `${wsProtocol}://${cleanUrl}/ws/consultations/websocket`;
};

export function useConsultationSocket(
  sessionId: string | number | null,
  onMessage: (message: ConsultationMessageItem) => void
) {
  const [connectionStatus, setConnectionStatus] = useState<SocketStatus>('idle');
  const clientRef = useRef<Client | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!sessionId || sessionId === 'undefined') {
      if (clientRef.current) {
        console.log('[ConsultationSocket] Deactivating socket (no session ID)');
        void clientRef.current.deactivate();
        clientRef.current = null;
      }
      setConnectionStatus('idle');
      return;
    }

    let isMounted = true;
    let stompClient: Client | null = null;

    const connectSocket = async () => {
      try {
        setConnectionStatus('connecting');
        const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

        if (!accessToken || !isMounted) {
          console.warn('[ConsultationSocket] No access token or unmounted');
          setConnectionStatus('idle');
          return;
        }

        const brokerURL = getWebSocketUrl(API_BASE_URL);
        console.log(`[ConsultationSocket] Connecting to ${brokerURL} for session ${sessionId}...`);

        stompClient = new Client({
          brokerURL,
          reconnectDelay: 4000,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          forceBinaryWSFrames: true,
          appendMissingNULLonIncoming: true,
          connectHeaders: {
            Authorization: `Bearer ${accessToken}`,
          },
          beforeConnect: async () => {
            try {
              const freshToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
              if (freshToken && stompClient) {
                stompClient.connectHeaders = {
                  Authorization: `Bearer ${freshToken}`,
                };
              }
            } catch (err) {
              console.warn('[ConsultationSocket] Error fetching fresh token:', err);
            }
          },
          debug: (str) => {
            if (__DEV__) {
              console.log('[ConsultationSocket DEBUG]', str);
            }
          },
          onConnect: () => {
            if (!isMounted) return;
            console.log(`[ConsultationSocket] Connected to STOMP broker! Subscribing to session ${sessionId}...`);
            setConnectionStatus('connected');

            stompClient?.subscribe(`/topic/consultation-sessions/${sessionId}`, (frame: IMessage) => {
              try {
                console.log('[ConsultationSocket] Frame received:', frame.body);
                const parsed = JSON.parse(preserveUnsafeIntegers(frame.body));
                const messageData: ConsultationMessageItem | undefined = parsed?.data
                  ? parsed.data
                  : parsed?.id
                  ? parsed
                  : undefined;

                if (messageData && messageData.id) {
                  console.log('[ConsultationSocket] Message dispatched to listener:', messageData.id, messageData.content);
                  onMessageRef.current(messageData);
                } else {
                  console.warn('[ConsultationSocket] Frame does not contain valid message item:', frame.body);
                }
              } catch (e) {
                console.warn('[ConsultationSocket] Failed to parse STOMP message frame:', e, frame.body);
              }
            });
          },
          onStompError: (error) => {
            console.warn('[ConsultationSocket] STOMP Error frame:', error);
            if (isMounted) setConnectionStatus('error');
          },
          onWebSocketError: (error) => {
            console.warn('[ConsultationSocket] WebSocket transport error:', error);
            if (isMounted) setConnectionStatus('error');
          },
          onDisconnect: () => {
            console.log('[ConsultationSocket] STOMP disconnected');
            if (isMounted) setConnectionStatus('idle');
          },
        });

        clientRef.current = stompClient;
        stompClient.activate();
      } catch (e) {
        console.warn('[ConsultationSocket] Connect socket error:', e);
        if (isMounted) setConnectionStatus('error');
      }
    };

    void connectSocket();

    return () => {
      isMounted = false;
      if (stompClient) {
        console.log('[ConsultationSocket] Cleanup deactivating socket');
        void stompClient.deactivate();
      }
      clientRef.current = null;
    };
  }, [sessionId]);

  return { status: connectionStatus };
}
