import axiosClient from "@/utils/axiosClient"
import type { ApiResponse, PageResponse } from "@/types/base"
import type {
  AcceptCareServiceAgreementRequest,
  AdminCreateConsultationSessionPayload,
  AdminListRequestsParams,
  ApproveConsultationRequestPayload,
  CareContinuitySummaryResponse,
  CareHistoryEpisodeResponse,
  CareServiceAgreementResponse,
  CareServicePackage,
  CloseConsultationPayload,
  ConsultationFinalSummaryResponse,
  ConsultationMessageItem,
  ConsultationMessagePage,
  ConsultationParticipantItem,
  ConsultationPaymentAttemptItem,
  ConsultationPaymentResponse,
  ConsultationRenewalResponse,
  ConsultationRequestItem,
  ConsultationRequestPage,
  ConsultationRequestReviewResponse,
  ConsultationSessionItem,
  ConsultationSessionPage,
  CreateCareServicePackagePayload,
  CreateConsultationRequestPayload,
  CreateFinalSummaryAddendumPayload,
  DecideConsultationRenewalPayload,
  DoctorCandidateResponse,
  DoctorCareProfilePayload,
  DoctorCareProfileResponse,
  DoctorConsultationDetailResponse,
  DoctorConsultationSessionResponse,
  DoctorRawArtifactResponse,
  DoctorScopedHealthRecordResponse,
  EpisodeHealthRecordAuthorizationResponse,
  FinalSummaryAddendumResponse,
  HealthRecordPage,
  RejectConsultationRequestPayload,
  RequestConsultationRenewalPayload,
  RequestSessionTerminationRequest,
  SendConsultationMessagePayload,
  SessionExtensionResponse,
  SubmitConsultationMoreInfoPayload,
  UpdateCareServicePackagePayload,
  UpsertConsultationFinalSummaryPayload,
} from "@/types/consultation"

type PageParams = {
  page?: number
  size?: number
}

export const consultationApi = {
  listMyHealthRecords(params: PageParams = {}) {
    return axiosClient.get<ApiResponse<HealthRecordPage>, ApiResponse<HealthRecordPage>>(
      "/api/health-records/my-records",
      { params }
    )
  },
  createRequest(payload: CreateConsultationRequestPayload) {
    return axiosClient.post<ApiResponse<ConsultationRequestItem>, ApiResponse<ConsultationRequestItem>>(
      "/api/consultation-requests",
      payload
    )
  },
  listMyRequests(params: PageParams = {}) {
    return axiosClient.get<ApiResponse<ConsultationRequestPage>, ApiResponse<ConsultationRequestPage>>("/api/consultation-requests", {
      params,
    })
  },
  listAdminRequests(params: AdminListRequestsParams = {}) {
    return axiosClient.get<ApiResponse<ConsultationRequestPage>, ApiResponse<ConsultationRequestPage>>("/api/admin/consultation-requests", {
      params,
    })
  },
  getMyRequest(requestId: string | number) {
    return axiosClient.get<ApiResponse<ConsultationRequestItem>, ApiResponse<ConsultationRequestItem>>(
      `/api/consultation-requests/${requestId}`
    )
  },
  cancelRequest(requestId: string | number) {
    return axiosClient.patch<ApiResponse<ConsultationRequestItem>, ApiResponse<ConsultationRequestItem>>(
      `/api/consultation-requests/${requestId}/cancel`
    )
  },

  approveRequest(requestId: string | number, payload: ApproveConsultationRequestPayload) {
    return axiosClient.patch<ApiResponse<ConsultationRequestItem>, ApiResponse<ConsultationRequestItem>>(
      `/api/admin/consultation-requests/${requestId}/approve`,
      payload
    )
  },
  rejectRequest(requestId: string | number, payload: RejectConsultationRequestPayload) {
    return axiosClient.patch<ApiResponse<ConsultationRequestItem>, ApiResponse<ConsultationRequestItem>>(
      `/api/admin/consultation-requests/${requestId}/reject`,
      payload
    )
  },
  listMySessions(params: PageParams = {}) {
    return axiosClient.get<ApiResponse<ConsultationSessionPage>, ApiResponse<ConsultationSessionPage>>(
      "/api/consultation-sessions",
      { params }
    )
  },
  getSession(sessionId: string | number) {
    return axiosClient.get<ApiResponse<ConsultationSessionItem>, ApiResponse<ConsultationSessionItem>>(
      `/api/consultation-sessions/${sessionId}`
    )
  },
  createSessionByAdmin(payload: AdminCreateConsultationSessionPayload) {
    return axiosClient.post<ApiResponse<ConsultationSessionItem>, ApiResponse<ConsultationSessionItem>>(
      "/api/admin/consultation-sessions",
      payload
    )
  },
  listAdminSessions(params: PageParams = {}) {
    return axiosClient.get<ApiResponse<ConsultationSessionPage>, ApiResponse<ConsultationSessionPage>>(
      "/api/admin/consultation-sessions",
      { params }
    )
  },
  requestRenewal(sessionId: string | number, payload?: RequestConsultationRenewalPayload) {
    return axiosClient.post<ApiResponse<ConsultationRenewalResponse>, ApiResponse<ConsultationRenewalResponse>>(
      `/api/consultation-sessions/${sessionId}/renewals`,
      payload
    )
  },
  listSessionRenewals(sessionId: string | number) {
    return axiosClient.get<ApiResponse<ConsultationRenewalResponse[]>, ApiResponse<ConsultationRenewalResponse[]>>(
      `/api/consultation-sessions/${sessionId}/renewals`
    )
  },
  cancelRenewal(renewalId: string | number) {
    return axiosClient.patch<ApiResponse<ConsultationRenewalResponse>, ApiResponse<ConsultationRenewalResponse>>(
      `/api/consultation-renewals/${renewalId}/cancel`
    )
  },
  getSessionExtensions(sessionId: string | number) {
    return axiosClient.get<ApiResponse<SessionExtensionResponse[]>, ApiResponse<SessionExtensionResponse[]>>(
      `/api/consultation-sessions/${sessionId}/extensions`
    )
  },
  beginRenewalReview(renewalId: string | number) {
    return axiosClient.patch<ApiResponse<ConsultationRenewalResponse>, ApiResponse<ConsultationRenewalResponse>>(
      `/api/admin/consultation-renewals/${renewalId}/begin-review`
    )
  },
  decideRenewal(renewalId: string | number, payload: DecideConsultationRenewalPayload) {
    return axiosClient.patch<ApiResponse<ConsultationRenewalResponse>, ApiResponse<ConsultationRenewalResponse>>(
      `/api/admin/consultation-renewals/${renewalId}/decision`,
      payload
    )
  },
  getRenewalAgreement(renewalId: string | number) {
    return axiosClient.get<ApiResponse<CareServiceAgreementResponse>, ApiResponse<CareServiceAgreementResponse>>(
      `/api/consultation-renewals/${renewalId}/agreement`
    )
  },
  acceptRenewalAgreement(renewalId: string | number, payload: AcceptCareServiceAgreementRequest) {
    return axiosClient.post<ApiResponse<CareServiceAgreementResponse>, ApiResponse<CareServiceAgreementResponse>>(
      `/api/consultation-renewals/${renewalId}/agreement/accept`,
      payload
    )
  },
  createRenewalPayment(renewalId: string | number) {
    return axiosClient.post<ApiResponse<ConsultationPaymentResponse>, ApiResponse<ConsultationPaymentResponse>>(
      `/api/consultation-renewals/${renewalId}/payment`
    )
  },
  getRenewalPaymentAttempts(renewalId: string | number) {
    return axiosClient.get<ApiResponse<ConsultationPaymentAttemptItem[]>, ApiResponse<ConsultationPaymentAttemptItem[]>>(
      `/api/consultation-renewals/${renewalId}/payment/attempts`
    )
  },
  closeSession(sessionId: string | number, payload: CloseConsultationPayload) {
    return axiosClient.patch<ApiResponse<ConsultationSessionItem>, ApiResponse<ConsultationSessionItem>>(
      `/api/admin/consultation-sessions/${sessionId}/close`,
      payload
    )
  },
  expireOverdueSessions() {
    return axiosClient.post<ApiResponse<void>, ApiResponse<void>>(
      "/api/admin/consultation-sessions/expire-overdue"
    )
  },
  activateScheduledSessions() {
    return axiosClient.post<ApiResponse<void>, ApiResponse<void>>(
      "/api/admin/consultation-sessions/activate-scheduled"
    )
  },
  expireWaitingPaymentRequests() {
    return axiosClient.post<ApiResponse<void>, ApiResponse<void>>(
      "/api/admin/consultation-requests/expire-waiting-payment"
    )
  },
  listMessages(sessionId: string | number, params: PageParams = {}) {
    return axiosClient.get<ApiResponse<ConsultationMessagePage>, ApiResponse<ConsultationMessagePage>>(
      `/api/consultation-sessions/${sessionId}/messages`,
      { params }
    )
  },
  listMessagesBefore(sessionId: string | number, beforeMessageId: string, params: PageParams = {}) {
    return axiosClient.get<ApiResponse<ConsultationMessagePage>, ApiResponse<ConsultationMessagePage>>(
      `/api/consultation-sessions/${sessionId}/messages/before/${beforeMessageId}`,
      { params }
    )
  },
  sendMessage(sessionId: string | number, payload: SendConsultationMessagePayload) {
    return axiosClient.post<ApiResponse<ConsultationMessageItem>, ApiResponse<ConsultationMessageItem>>(
      `/api/consultation-sessions/${sessionId}/messages`,
      payload
    )
  },
  markRead(sessionId: string | number, lastReadMessageId: string) {
    return axiosClient.patch<ApiResponse<ConsultationParticipantItem>, ApiResponse<ConsultationParticipantItem>>(
      `/api/consultation-sessions/${sessionId}/messages/read`,
      { lastReadMessageId }
    )
  },
  listCareServicePackages(params: PageParams = {}) {
    return axiosClient.get<ApiResponse<PageResponse<CareServicePackage>>, ApiResponse<PageResponse<CareServicePackage>>>(
      "/api/care-service-packages",
      { params }
    )
  },
  getCareServicePackage(packageId: string | number) {
    return axiosClient.get<ApiResponse<CareServicePackage>, ApiResponse<CareServicePackage>>(
      `/api/care-service-packages/${packageId}`
    )
  },
  submitMoreInfo(requestId: string | number, payload: SubmitConsultationMoreInfoPayload) {
    return axiosClient.patch<ApiResponse<ConsultationRequestItem>, ApiResponse<ConsultationRequestItem>>(
      `/api/consultation-requests/${requestId}/more-info`,
      payload
    )
  },
  getAgreement(requestId: string | number) {
    return axiosClient.get<ApiResponse<CareServiceAgreementResponse>, ApiResponse<CareServiceAgreementResponse>>(
      `/api/consultation-requests/${requestId}/agreement`
    )
  },
  acceptAgreement(requestId: string | number, payload: AcceptCareServiceAgreementRequest) {
    return axiosClient.post<ApiResponse<CareServiceAgreementResponse>, ApiResponse<CareServiceAgreementResponse>>(
      `/api/consultation-requests/${requestId}/agreement/accept`,
      payload
    )
  },
  getRequestDetail(requestId: string | number) {
    return axiosClient.get<ApiResponse<ConsultationRequestReviewResponse>, ApiResponse<ConsultationRequestReviewResponse>>(
      `/api/admin/consultation-requests/${requestId}`
    )
  },
  requestMoreInfo(requestId: string | number, payload: { reason: string }) {
    return axiosClient.patch<ApiResponse<ConsultationRequestReviewResponse>, ApiResponse<ConsultationRequestReviewResponse>>(
      `/api/admin/consultation-requests/${requestId}/need-more-info`,
      payload
    )
  },
  listDoctorCandidates(requestId: string | number, params: { specialty?: string; keyword?: string; eligibleOnly?: boolean; page?: number; size?: number } = {}) {
    return axiosClient.get<ApiResponse<PageResponse<DoctorCandidateResponse>>, ApiResponse<PageResponse<DoctorCandidateResponse>>>(
      `/api/admin/consultation-requests/${requestId}/doctor-candidates`,
      { params }
    )
  },
  getDoctorCareProfile(doctorId: string | number) {
    return axiosClient.get<ApiResponse<DoctorCareProfileResponse>, ApiResponse<DoctorCareProfileResponse>>(
      `/api/admin/doctors/${doctorId}/care-profile`
    )
  },
  updateDoctorCareProfile(doctorId: string | number, payload: DoctorCareProfilePayload) {
    return axiosClient.put<ApiResponse<DoctorCareProfileResponse>, ApiResponse<DoctorCareProfileResponse>>(
      `/api/admin/doctors/${doctorId}/care-profile`,
      payload
    )
  },
  listAdminCareServicePackages(params: { status?: string; page?: number; size?: number } = {}) {
    return axiosClient.get<ApiResponse<PageResponse<CareServicePackage>>, ApiResponse<PageResponse<CareServicePackage>>>(
      "/api/admin/care-service-packages",
      { params }
    )
  },
  getAdminCareServicePackage(packageId: string | number) {
    return axiosClient.get<ApiResponse<CareServicePackage>, ApiResponse<CareServicePackage>>(
      `/api/admin/care-service-packages/${packageId}`
    )
  },
  createCareServicePackage(payload: CreateCareServicePackagePayload) {
    return axiosClient.post<ApiResponse<CareServicePackage>, ApiResponse<CareServicePackage>>(
      "/api/admin/care-service-packages",
      payload
    )
  },
  updateCareServicePackage(packageId: string | number, payload: UpdateCareServicePackagePayload) {
    return axiosClient.patch<ApiResponse<CareServicePackage>, ApiResponse<CareServicePackage>>(
      `/api/admin/care-service-packages/${packageId}`,
      payload
    )
  },
  activateCareServicePackage(packageId: string | number) {
    return axiosClient.patch<ApiResponse<CareServicePackage>, ApiResponse<CareServicePackage>>(
      `/api/admin/care-service-packages/${packageId}/activate`
    )
  },
  deactivateCareServicePackage(packageId: string | number) {
    return axiosClient.patch<ApiResponse<CareServicePackage>, ApiResponse<CareServicePackage>>(
      `/api/admin/care-service-packages/${packageId}/deactivate`
    )
  },
  retireCareServicePackage(packageId: string | number) {
    return axiosClient.patch<ApiResponse<CareServicePackage>, ApiResponse<CareServicePackage>>(
      `/api/admin/care-service-packages/${packageId}/retire`
    )
  },
  createConsultationPayment(requestId: string | number) {
    return axiosClient.post<ApiResponse<ConsultationPaymentResponse>, ApiResponse<ConsultationPaymentResponse>>(
      `/api/consultation-requests/${requestId}/payment`
    )
  },
  getConsultationPayment(requestId: string | number) {
    return axiosClient.get<ApiResponse<ConsultationPaymentResponse>, ApiResponse<ConsultationPaymentResponse>>(
      `/api/consultation-requests/${requestId}/payment`
    )
  },
  getPaymentAttempts(requestId: string | number) {
    return axiosClient.get<ApiResponse<ConsultationPaymentAttemptItem[]>, ApiResponse<ConsultationPaymentAttemptItem[]>>(
      `/api/consultation-requests/${requestId}/payment/attempts`
    )
  },
  getDoctorSessions(params: PageParams = {}) {
    return axiosClient.get<ApiResponse<PageResponse<DoctorConsultationSessionResponse>>, ApiResponse<PageResponse<DoctorConsultationSessionResponse>>>(
      "/api/doctor/consultation-sessions",
      { params }
    )
  },
  getDoctorSessionDetail(sessionId: string | number) {
    return axiosClient.get<ApiResponse<DoctorConsultationDetailResponse>, ApiResponse<DoctorConsultationDetailResponse>>(
      `/api/doctor/consultation-sessions/${sessionId}`
    )
  },
  shareHealthRecord(sessionId: string | number, recordId: string | number) {
    return axiosClient.post<ApiResponse<EpisodeHealthRecordAuthorizationResponse>, ApiResponse<EpisodeHealthRecordAuthorizationResponse>>(
      `/api/consultation-sessions/${sessionId}/health-records/${recordId}/share`
    )
  },
  getDoctorScopedRecords(sessionId: string | number, params: PageParams = {}) {
    return axiosClient.get<ApiResponse<PageResponse<DoctorScopedHealthRecordResponse>>, ApiResponse<PageResponse<DoctorScopedHealthRecordResponse>>>(
      `/api/doctor/consultation-sessions/${sessionId}/health-records`,
      { params }
    )
  },
  getDoctorScopedRecordDetail(sessionId: string | number, recordId: string | number) {
    return axiosClient.get<ApiResponse<DoctorScopedHealthRecordResponse>, ApiResponse<DoctorScopedHealthRecordResponse>>(
      `/api/doctor/consultation-sessions/${sessionId}/health-records/${recordId}`
    )
  },
  getDoctorScopedRawArtifact(sessionId: string | number, recordId: string | number) {
    return axiosClient.get<ApiResponse<DoctorRawArtifactResponse>, ApiResponse<DoctorRawArtifactResponse>>(
      `/api/doctor/consultation-sessions/${sessionId}/health-records/${recordId}/raw-artifact`
    )
  },
  reviewDoctorScopedRecordAttention(sessionId: string | number, recordId: string | number) {
    return axiosClient.patch<ApiResponse<DoctorScopedHealthRecordResponse>, ApiResponse<DoctorScopedHealthRecordResponse>>(
      `/api/doctor/consultation-sessions/${sessionId}/health-records/${recordId}/attention/review`
    )
  },
  requestSessionTermination(sessionId: string | number, payload: RequestSessionTerminationRequest) {
    return axiosClient.post<ApiResponse<ConsultationSessionItem>, ApiResponse<ConsultationSessionItem>>(
      `/api/consultation-sessions/${sessionId}/termination-request`,
      payload
    )
  },
  getDoctorContinuitySummaries(sessionId: string | number) {
    return axiosClient.get<ApiResponse<CareContinuitySummaryResponse[]>, ApiResponse<CareContinuitySummaryResponse[]>>(
      `/api/doctor/consultation-sessions/${sessionId}/continuity-summaries`
    )
  },
  getDoctorFinalSummary(sessionId: string | number) {
    return axiosClient.get<ApiResponse<ConsultationFinalSummaryResponse>, ApiResponse<ConsultationFinalSummaryResponse>>(
      `/api/doctor/consultation-sessions/${sessionId}/final-summary`
    )
  },
  updateDoctorFinalSummary(sessionId: string | number, payload: UpsertConsultationFinalSummaryPayload) {
    return axiosClient.put<ApiResponse<ConsultationFinalSummaryResponse>, ApiResponse<ConsultationFinalSummaryResponse>>(
      `/api/doctor/consultation-sessions/${sessionId}/final-summary`,
      payload
    )
  },
  finalizeDoctorFinalSummary(sessionId: string | number) {
    return axiosClient.patch<ApiResponse<ConsultationFinalSummaryResponse>, ApiResponse<ConsultationFinalSummaryResponse>>(
      `/api/doctor/consultation-sessions/${sessionId}/final-summary/finalize`
    )
  },
  addDoctorFinalSummaryAddendum(sessionId: string | number, payload: CreateFinalSummaryAddendumPayload) {
    return axiosClient.post<ApiResponse<FinalSummaryAddendumResponse>, ApiResponse<FinalSummaryAddendumResponse>>(
      `/api/doctor/consultation-sessions/${sessionId}/final-summary/addenda`,
      payload
    )
  },
  getMemberFinalSummary(sessionId: string | number) {
    return axiosClient.get<ApiResponse<ConsultationFinalSummaryResponse>, ApiResponse<ConsultationFinalSummaryResponse>>(
      `/api/consultation-sessions/${sessionId}/final-summary`
    )
  },
  getAdminFinalSummary(sessionId: string | number) {
    return axiosClient.get<ApiResponse<ConsultationFinalSummaryResponse>, ApiResponse<ConsultationFinalSummaryResponse>>(
      `/api/admin/consultation-sessions/${sessionId}/final-summary`
    )
  },
  getCareHistory(params?: { page?: number; size?: number }) {
    return axiosClient.get<ApiResponse<PageResponse<CareHistoryEpisodeResponse>>, ApiResponse<PageResponse<CareHistoryEpisodeResponse>>>(
      "/api/care-history",
      { params }
    )
  },
  getCareHistoryEpisode(sessionId: string | number) {
    return axiosClient.get<ApiResponse<CareHistoryEpisodeResponse>, ApiResponse<CareHistoryEpisodeResponse>>(
      `/api/care-history/${sessionId}`
    )
  },
}
