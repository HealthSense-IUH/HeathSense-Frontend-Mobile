import { useCallback, useEffect, useState } from 'react';
import { useConsultationSocket } from './useConsultationSocket';
import { consultationApi } from '../../services/consultation.service';
import type {
  ConsultationMessageItem,
  ConsultationRequestItem,
  ConsultationSessionItem,
  CareServicePackage,
} from '@/types/consultation';

export type AlertState = {
  type: 'success' | 'error';
  text: string;
};

export interface RequestFormData {
  packageId: string;
  reasonForCare: string;
  currentConcern: string;
  careGoal: string;
  memberNote: string;
  selectedHealthRecordIds?: string[];
}

const DEFAULT_CHAT_SIZE = 30;

function readError(error: unknown, fallback: string) {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err.response?.data?.message || err.message || fallback;
}

export function useConsultationsLogic() {
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [packages, setPackages] = useState<CareServicePackage[]>([]);
  const [requests, setRequests] = useState<ConsultationRequestItem[]>([]);
  const [sessions, setSessions] = useState<ConsultationSessionItem[]>([]);
  
  const [selectedSession, setSelectedSession] = useState<ConsultationSessionItem | null>(null);
  const [messages, setMessages] = useState<ConsultationMessageItem[]>([]);
  const [messageDraft, setMessageDraft] = useState('');
  
  const [requestForm, setRequestForm] = useState<RequestFormData>({
    packageId: '',
    reasonForCare: '',
    currentConcern: '',
    careGoal: '',
    memberNote: '',
    selectedHealthRecordIds: [],
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load packages
      const pkgRes = await consultationApi.listCareServicePackages();
      if ((pkgRes as any).data?.data?.content) {
        setPackages((pkgRes as any).data.data.content);
      }
      
      // Load requests
      const reqRes = await consultationApi.listMyRequests({ page: 0, size: 50 });
      if ((reqRes as any).data?.data?.content) {
        setRequests((reqRes as any).data.data.content);
      }

      // Load sessions
      const sessRes = await consultationApi.listMySessions({ page: 0, size: 50 });
      if ((sessRes as any).data?.data?.content) {
        setSessions((sessRes as any).data.data.content);
      }
    } catch (err) {
      setAlert({ type: 'error', text: readError(err, 'Lỗi khi tải dữ liệu tư vấn') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      if (active) await loadData();
    };
    void fetchData();
    return () => { active = false; };
  }, [loadData]);

  const handleCreateRequest = async () => {
    if (!requestForm.packageId) {
      setAlert({ type: 'error', text: 'Vui lòng chọn gói dịch vụ' });
      return false;
    }
    setActionLoading(true);
    try {
      await consultationApi.createRequest({
        packageId: Number(requestForm.packageId),
        reasonForCare: requestForm.reasonForCare,
        currentConcern: requestForm.currentConcern,
        careGoal: requestForm.careGoal,
        memberNote: requestForm.memberNote,
        selectedHealthRecordIds: requestForm.selectedHealthRecordIds?.map(Number),
      });
      setAlert({ type: 'success', text: 'Gửi yêu cầu tư vấn thành công' });
      setRequestForm({
        packageId: '',
        reasonForCare: '',
        currentConcern: '',
        careGoal: '',
        memberNote: '',
        selectedHealthRecordIds: [],
      });
      await loadData();
      return true;
    } catch (err) {
      setAlert({ type: 'error', text: readError(err, 'Lỗi khi tạo yêu cầu') });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const loadMessages = useCallback(async (sessionId: string | number) => {
    try {
      const res = await consultationApi.listMessages(sessionId, { page: 0, size: DEFAULT_CHAT_SIZE });
      if ((res as any).data?.data?.content) {
        setMessages((res as any).data.data.content); // Newest to oldest (for inverted FlatList)
      }
    } catch (err) {
      console.warn('Failed to load messages', err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const fetchMessages = async () => {
      if (selectedSession && active) {
        await loadMessages(selectedSession.id);
      } else if (active) {
        setMessages([]);
      }
    };
    void fetchMessages();
    return () => { active = false; };
  }, [selectedSession, loadMessages]);

  const handleIncomingMessage = useCallback((msg: ConsultationMessageItem) => {
    if (selectedSession && String(msg.sessionId) === String(selectedSession.id)) {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [msg, ...prev]; // Add to beginning (for inverted FlatList)
      });
    }
  }, [selectedSession]);

  useConsultationSocket(selectedSession?.id ?? null, handleIncomingMessage);

  const handleSendMessage = async () => {
    if (!selectedSession || !messageDraft.trim()) return;
    
    const content = messageDraft;
    setMessageDraft('');
    setActionLoading(true);
    try {
      await consultationApi.sendMessage(selectedSession.id, {
        type: 'TEXT',
        content: content,
      });
      // The message will come back via Socket
    } catch (err) {
      setAlert({ type: 'error', text: readError(err, 'Gửi tin nhắn thất bại') });
      setMessageDraft(content); // Restore draft
    } finally {
      setActionLoading(false);
    }
  };

  return {
    alert,
    setAlert,
    loading,
    actionLoading,
    packages,
    requests,
    sessions,
    selectedSession,
    setSelectedSession,
    messages,
    messageDraft,
    setMessageDraft,
    requestForm,
    setRequestForm,
    handleCreateRequest,
    handleSendMessage,
    loadData,
  };
}
