import type { PageResponse } from "../base"

export type ConsultationRequestStatus =
  | "PENDING_REVIEW"
  | "NEED_MORE_INFO"
  | "WAITING_ACCEPTANCE"
  | "WAITING_PAYMENT"
  | "FULFILLED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | string

export type ConsultationStatus = "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED" | string
export type ConsultationSessionStatus = ConsultationStatus
export type ConsultationSourceType = "ADMIN_CREATED" | "MEMBER_REQUEST" | "SYSTEM_RECOMMENDED" | string
export type ConsultationCompletionReason = "PERIOD_ENDED" | "NORMAL_COMPLETION" | "ADMINISTRATIVE_CANCELLATION" | string
export type CareTerminationReason =
  | "MEMBER_REQUESTED"
  | "DOCTOR_UNAVAILABLE"
  | "MEMBER_UNAVAILABLE"
  | "ACCOUNT_SUSPENDED"
  | "SERVICE_VIOLATION"
  | "TECHNICAL_FAILURE"
  | "ADMINISTRATIVE_CLOSURE"
  | "SAFETY_OR_SCOPE_REASON"
  | "OTHER"
  | string

export type CareOperationalReviewReason =
  | "MEMBER_TERMINATION_REQUESTED"
  | "DOCTOR_TERMINATION_REQUESTED"
  | "MEMBER_ACCOUNT_DISABLED"
  | "DOCTOR_ACCOUNT_DISABLED"
  | string

export type ConsultationMessageType = "TEXT" | "IMAGE" | "FILE" | "SYSTEM" | string
export type ConsultationParticipantRole = "MEMBER" | "DOCTOR" | "ADMIN" | "SYSTEM" | string
export type CareServicePackageStatus = "ACTIVE" | "INACTIVE" | "RETIRED" | string
export type DoctorSpecialty = "CARDIOLOGY" | "INTERNAL_MEDICINE" | "GENERAL_PRACTICE" | "OTHER" | string
export type CareServiceSupportPolicy = "ASSIGNED_DOCTOR_SUPPORT_SCHEDULE" | string

export type CareServiceCode =
  | "REMOTE_ONE_ON_ONE_CARE"
  | "SECURE_MESSAGING"
  | "HEALTH_RECORD_REVIEW"
  | "AI_SCREENING_REVIEW"
  | "CARE_MONITORING"
  | "FINAL_CARE_SUMMARY"
  | "EMERGENCY_CARE"
  | "TWENTY_FOUR_SEVEN_SUPPORT"
  | "FORMAL_DIAGNOSIS"
  | "PRESCRIPTION"
  | "VIDEO_CONSULTATION"
  | string

export type ConsultationFinalSummaryStatus = "DRAFT" | "FINALIZED" | string
export type FinalSummaryClosureStatus = "SUMMARY_PENDING" | "SUMMARY_OVERDUE" | "SUMMARY_FINALIZED" | "ESCALATED" | string

export type ConsultationPaymentStatus = "PENDING" | "PAID" | "EXPIRED" | "CANCELLED" | "FAILED" | "REQUIRES_REVIEW" | string
export type ConsultationPaymentPurpose = "INITIAL_CARE" | "RENEWAL" | string
export type ConsultationPaymentProvider = "PAYOS" | string
export type PaymentProviderCancellationStatus = "NOT_REQUESTED" | "PENDING" | "SUCCEEDED" | "FAILED" | "NOT_APPLICABLE" | string

export type ConsultationRenewalStatus =
  | "REQUESTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "PENDING_ACCEPTANCE"
  | "WAITING_PAYMENT"
  | "PAID"
  | "APPLIED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "REQUIRES_REVIEW"
  | string

export type CareServiceAgreementStatus = "DRAFT" | "PENDING_ACCEPTANCE" | "ACCEPTED" | "CONSUMED" | "INVALIDATED" | string
export type CareServiceAgreementType = "INITIAL_CARE" | "RENEWAL" | string
export type CareStartRule = "IMMEDIATE_AFTER_VERIFIED_PAYMENT" | "EXTENSION_FROM_CURRENT_END" | string

export interface CareServiceAgreementPackageSnapshot {
  code?: string
  name?: string
  description?: string
  priceAmount?: number
  currency?: string
  durationDays?: number
  renewable?: boolean
  specialty?: string
  requiredSpecialty?: DoctorSpecialty | null
  supportPolicy?: string
  limitations?: string
  termsPolicyReference?: string | null
  includedServiceTypes?: string[]
  excludedServiceTypes?: string[]
  includedServices?: CareServiceCode[] | null
  excludedServices?: CareServiceCode[] | null
  maxExtensionsAllowed?: number
}

export interface CareServiceAgreementDoctorSnapshot {
  doctorId?: number
  displayName?: string
  email?: string
  specialty?: string
  declaredSupportSchedule?: string
  timezone?: string
}

export interface CareServiceAgreementMemberSnapshot {
  memberId?: number
  displayName?: string
  email?: string
  phone?: string
}

export interface CareServiceAgreementResponse {
  id: number | string
  agreementId?: number | string
  requestId?: number | string | null
  renewalId?: number | string | null
  agreementType?: CareServiceAgreementType | string | null
  memberId?: number | string | null
  doctorId?: number | string | null
  packageId?: number | string | null
  packageFamilyId?: number | string | null
  packageCode?: string | null
  packageName?: string | null
  packageVersion?: number | null
  serviceDescription?: string | null
  includedServices?: CareServiceCode[] | null
  excludedServices?: CareServiceCode[] | null
  priceAmount?: number | null
  currency?: string | null
  durationDays?: number | null
  extensionStartsAt?: string | null
  resultingEndsAt?: string | null
  startRule?: CareStartRule | string | null
  supportScheduleSnapshotJson?: string | null
  supportTimezoneSnapshot?: string | null
  supportPolicy?: CareServiceSupportPolicy | null
  renewable?: boolean | null
  termsPolicyReference?: string | null
  cancellationPolicyReference?: string | null
  refundPolicyReference?: string | null
  emergencyLimitation?: string | null
  aiLimitation?: string | null
  serviceLimitation?: string | null
  healthDataScopeDisclosure?: string | null
  status: CareServiceAgreementStatus
  acceptedByMember?: boolean | null
  acceptedAt?: string | null
  validUntil?: string | null
  invalidatedAt?: string | null
  invalidationReason?: string | null
  consumedAt?: string | null
  createdAt?: string | null

  // Legacy snapshot compatibility
  packageSnapshot?: CareServiceAgreementPackageSnapshot | null
  doctorSnapshot?: CareServiceAgreementDoctorSnapshot | null
  memberSnapshot?: CareServiceAgreementMemberSnapshot | null
  limitations?: string | null
  policyRefs?: string[] | null
  rejectedAt?: string | null
  updatedAt?: string | null
}

export interface AcceptCareServiceAgreementRequest {
  agreementId: number | string
  accepted: boolean
}

export interface ConsultationPaymentAttemptItem {
  id?: string | number
  orderCode: number
  amount: number
  currency: string
  status: ConsultationPaymentStatus
  checkoutUrl?: string
  attemptNumber?: number | null
  paymentPurpose?: ConsultationPaymentPurpose | string | null
  expiresAt?: string | null
  paidAt?: string | null
  expiredAt?: string | null
  cancelledAt?: string | null
  providerCancellationStatus?: PaymentProviderCancellationStatus | string | null
  createdAt?: string
  updatedAt?: string
}

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY"

export interface ConsultationPaymentResponse {
  id: string | number
  requestId?: string | number | null
  renewalId?: string | number | null
  paymentPurpose?: ConsultationPaymentPurpose | string | null
  agreementId?: string | number | null
  attemptNumber?: number | null
  memberId?: string | number | null
  provider?: ConsultationPaymentProvider | string | null
  orderCode: number
  paymentLinkId?: string | null
  checkoutUrl?: string | null
  amount: number
  currency: string
  status: ConsultationPaymentStatus
  expiresAt?: string | null
  paidAt?: string | null
  expiredAt?: string | null
  cancelledAt?: string | null
  providerCancellationStatus?: PaymentProviderCancellationStatus | string | null
  providerCancellationRequestedAt?: string | null
  providerCancellationCompletedAt?: string | null
  providerCancellationLastAttemptAt?: string | null
  providerCancellationError?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface CareServicePackage {
  id: number
  familyId?: number | null
  code: string
  version?: number | null
  name: string
  shortDescription?: string | null
  description?: string | null
  detailedDescription?: string | null
  priceAmount: number
  currency: string
  durationDays: number
  renewable: boolean
  requiredSpecialty?: DoctorSpecialty | null
  specialty?: DoctorSpecialty | null // legacy compatibility
  supportPolicy?: CareServiceSupportPolicy | null
  termsPolicyReference?: string | null
  limitations?: string | null // legacy compatibility
  maxExtensionsAllowed?: number | null
  includedServices?: CareServiceCode[] | null
  includedServiceTypes?: string[] | null // legacy compatibility
  excludedServices?: CareServiceCode[] | null
  excludedServiceTypes?: string[] | null // legacy compatibility
  status: CareServicePackageStatus
  createdAt?: string
  updatedAt?: string
}

export interface CreateCareServicePackagePayload {
  code: string
  name: string
  description?: string | null
  shortDescription?: string | null
  detailedDescription?: string | null
  priceAmount: number
  currency?: string
  durationDays: number
  renewable: boolean
  requiredSpecialty?: DoctorSpecialty | null
  specialty?: DoctorSpecialty | null // legacy fallback
  supportPolicy?: CareServiceSupportPolicy | null
  termsPolicyReference?: string | null
  limitations?: string | null // legacy fallback
  maxExtensionsAllowed?: number | null
  includedServices?: CareServiceCode[] | null
  includedServiceTypes?: string[] | null // legacy fallback
  excludedServices?: CareServiceCode[] | null
  excludedServiceTypes?: string[] | null // legacy fallback
}

export interface UpdateCareServicePackagePayload {
  name: string
  description?: string | null
  shortDescription?: string | null
  detailedDescription?: string | null
  priceAmount: number
  currency?: string
  durationDays: number
  renewable: boolean
  requiredSpecialty?: DoctorSpecialty | null
  specialty?: DoctorSpecialty | null // legacy fallback
  supportPolicy?: CareServiceSupportPolicy | null
  termsPolicyReference?: string | null
  limitations?: string | null // legacy fallback
  maxExtensionsAllowed?: number | null
  includedServices?: CareServiceCode[] | null
  includedServiceTypes?: string[] | null // legacy fallback
  excludedServices?: CareServiceCode[] | null
  excludedServiceTypes?: string[] | null // legacy fallback
}

export interface CareHistoryEpisodeResponse {
  sessionId: number | string
  memberId: number | string
  doctorId: number | string
  doctorName?: string | null
  packageId?: number | string | null
  packageCodeSnapshot?: string | null
  packageNameSnapshot?: string | null
  packagePriceSnapshot?: number | null
  status: ConsultationSessionStatus
  startedAt?: string | null
  endsAt?: string | null
  completedAt?: string | null
  closureStatus?: string | null
  finalSummary?: ConsultationFinalSummaryResponse | null
  authorizedHealthRecords?: HealthRecordItem[] | null
  createdAt?: string | null
}

export interface ConsultationRequestItem {
  id: string | number
  memberId: string | number
  healthRecordId?: string | number | null
  selectedHealthRecordIds?: (number | string)[]
  reason?: string | null
  reasonForCare?: string | null
  currentConcern?: string | null
  careGoal?: string | null
  memberNote?: string | null
  relevantSelfReportedContext?: string | null
  preferredDoctorId?: string | number | null
  status: ConsultationRequestStatus
  assignedDoctorId?: string | number | null
  consultationSessionId?: string | number | null
  reviewedByAdminId?: string | number | null
  reviewedAt?: string | null
  rejectionReason?: string | null
  packageId?: number | null
  moreInfoReason?: string | null
  memberAdditionalNote?: string | null
  paymentDeadline?: string | null
  doctorReservedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface ConsultationSessionItem {
  id: string | number
  memberId: string | number
  doctorId: string | number
  createdByAdminId?: string | number | null
  sourceType?: ConsultationSourceType
  status: ConsultationStatus
  startedAt?: string | null
  endsAt?: string | null
  supportEndsAt?: string | null
  closedAt?: string | null
  closeReason?: string | null
  healthRecordId?: string | number | null
  requestId?: string | number | null
  lastMessageId?: string | null
  lastMessagePreview?: string | null
  lastMessageAt?: string | null
  unreadCount?: number | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface ConsultationMessageItem {
  id: string
  sessionId: string | number
  senderId: string | number
  senderRole: ConsultationParticipantRole
  type: ConsultationMessageType
  content?: string | null
  attachmentUrl?: string | null
  attachmentName?: string | null
  attachmentSize?: number | null
  attachmentContentType?: string | null
  active?: boolean
  createdAt?: string | null
  updatedAt?: string | null
}

export interface ConsultationParticipantItem {
  id: string | number
  sessionId: string | number
  userId: string | number
  role: ConsultationParticipantRole
  lastReadMessageId?: string | null
  lastReadAt?: string | null
  joinedAt?: string | null
  active?: boolean
}

export interface HealthRecordItem {
  id: string | number
  status?: string
  predictionLabel?: string
  originalFileName?: string
  createdAt?: string | null
  updatedAt?: string | null
}

export interface CreateConsultationRequestPayload {
  packageId: number | string
  reasonForCare: string
  currentConcern: string
  careGoal?: string | null
  memberNote?: string | null
  relevantSelfReportedContext?: string | null
  selectedHealthRecordIds?: (number | string)[]
  preferredDoctorId?: number | string | null
  // Legacy / deprecated compatibility
  healthRecordId?: number | string | null
  reason?: string | null
}

export interface SubmitConsultationMoreInfoPayload {
  additionalNote?: string | null
  responseNote?: string | null
  healthRecordId?: number | string | null
  selectedHealthRecordIds?: (number | string)[]
}

export interface ApproveConsultationRequestPayload {
  doctorId: number | string
}

export interface AdminListRequestsParams {
  status?: string
  memberId?: number
  preferredDoctorId?: number
  assignedDoctorId?: number
  fromDate?: string
  toDate?: string
  page?: number
  size?: number
}

export interface DoctorCandidateResponse {
  doctorId: number
  displayName: string
  email: string
  phone?: string | null
  specialty?: string | null
  acceptsOneOnOneCare: boolean
  effectiveLoad: number
  maxActiveConsultations: number | null
  declaredSupportSchedule?: string | null
  timezone?: string | null
  preferredByMember: boolean
  eligible: boolean
  ineligibleReasons: string[]
}

export interface DoctorAvailabilitySlot {
  dayOfWeek: DayOfWeek
  start: string // HH:mm
  end: string // HH:mm
}

export interface DoctorAvailability {
  weekly: DoctorAvailabilitySlot[]
}

export interface DoctorCareProfilePayload {
  specialty: DoctorSpecialty
  acceptsOneOnOneCare: boolean
  maxActiveConsultations: number
  timezone: string
  availability: DoctorAvailability
}

export interface DoctorCareProfileResponse {
  id?: number
  doctorId: number
  specialty?: DoctorSpecialty | null
  acceptsOneOnOneCare: boolean
  maxActiveConsultations: number
  timezone: string
  availability?: DoctorAvailability | null
  availabilityJson?: string | null // legacy fallback
  createdAt?: string | null
  updatedAt?: string | null
}

export interface ConsultationRequestReviewResponse {
  id: number
  memberId: number
  packageId?: number | null
  packageCodeSnapshot?: string | null
  packageNameSnapshot?: string | null
  packagePriceSnapshot?: number | null
  packageDurationDaysSnapshot?: number | null
  reasonForCare?: string | null
  currentConcern?: string | null
  careGoal?: string | null
  memberNote?: string | null
  relevantSelfReportedContext?: string | null
  reason?: string | null
  status: ConsultationRequestStatus
  member?: UserSummaryResponse | null
  preferredDoctor?: UserSummaryResponse | null
  assignedDoctor?: UserSummaryResponse | null
  healthRecord?: HealthRecordSummaryResponse | null
  healthRecords?: HealthRecordSummaryResponse[]
  selectedHealthRecordIds?: (number | string)[]
  moreInfoReason?: string | null
  memberAdditionalNote?: string | null
  assignedDoctorId?: number | null
  doctorReservedAt?: string | null
  paymentDeadline?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface RejectConsultationRequestPayload {
  rejectionReason: string
}

export interface AdminCreateConsultationSessionPayload {
  memberId: string | number
  doctorId: string | number
  healthRecordId?: string | number | null
  startedAt?: string | null
  endsAt: string
  supportEndsAt?: string | null
  initialSystemMessage?: string | null
  overrideReason: string
  packageId?: number | string | null
}

export interface ConsultationRenewalResponse {
  id: number | string
  sessionId: number | string
  memberId: number | string
  doctorId: number | string
  packageFamilyId?: number | string | null
  packageId?: number | string | null
  packageVersion?: number | null
  packageCodeSnapshot?: string | null
  packageNameSnapshot?: string | null
  packagePriceSnapshot?: number | null
  packageDurationDaysSnapshot?: number | null
  durationDays?: number | null
  priceAmount?: number | null
  currency?: string | null
  supportScheduleSnapshotJson?: string | null
  supportTimezoneSnapshot?: string | null
  status: ConsultationRenewalStatus
  previousEndsAt?: string | null
  proposedNewEndsAt?: string | null
  proposedEndsAt?: string | null // legacy compatibility
  agreementId?: number | string | null
  successfulPaymentId?: number | string | null
  requestedAt?: string | null
  reviewedBy?: number | string | null
  reviewedByUserId?: number | string | null // legacy compatibility
  reviewStartedAt?: string | null
  reviewedAt?: string | null
  rejectionReason?: string | null
  paymentDeadline?: string | null
  appliedAt?: string | null
  failureReason?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface RequestConsultationRenewalPayload {
  packageFamilyId?: number
}

export interface DecideConsultationRenewalPayload {
  approved: boolean
  rejectionReason?: string | null
}

export interface SessionExtensionResponse {
  id: number | string
  sessionId: number | string
  renewalId?: number | string | null
  agreementId?: number | string | null
  paymentId?: number | string | null
  previousEndsAt: string
  newEndsAt: string
  durationDays?: number | null
  packageId?: number | string | null
  packageVersion?: number | null
  packageCodeSnapshot?: string | null
  packageNameSnapshot?: string | null
  packagePriceSnapshot?: number | null
  priceAmount?: number | null
  currency?: string | null
  supportScheduleSnapshotJson?: string | null
  supportTimezoneSnapshot?: string | null
  appliedAt: string
  createdAt?: string | null
}

export interface CloseConsultationPayload {
  closeReason: string
  terminationReason?: CareTerminationReason | null
  meaningfulCareOccurred?: boolean | null
}

export interface RequestSessionTerminationRequest {
  reason: CareTerminationReason
  details: string
}

export interface ConsultationMoreInfoCycleResponse {
  id: number | string
  requestedItemsCategory?: string | null
  coordinatorMessage?: string | null
  requestedBy?: number | string | null
  requestedAt?: string | null
  memberResponse?: string | null
  responseHealthRecordIds?: (number | string)[] | null
  responseHealthRecords?: HealthRecordItem[] | null
  respondedAt?: string | null
}

export interface UserSummaryResponse {
  id?: number | string
  userId?: number | string
  email?: string
  displayName?: string
  phone?: string | null
}

export interface HealthRecordSummaryResponse {
  id?: number | string
  recordId?: number | string
  title?: string | null
  summary?: string | null
  status?: string
  predictionLabel?: string | null
  confidence?: number | null
  createdAt?: string
  updatedAt?: string | null
}

export interface SendConsultationMessagePayload {
  type: ConsultationMessageType
  content?: string
  attachmentUrl?: string
  attachmentName?: string
  attachmentSize?: number
  attachmentContentType?: string
  clientMessageId?: string
}

export type ConsultationRequestPage = PageResponse<ConsultationRequestItem>
export type ConsultationSessionPage = PageResponse<ConsultationSessionItem>
export type ConsultationMessagePage = PageResponse<ConsultationMessageItem>
export type HealthRecordPage = PageResponse<HealthRecordItem>

export interface DoctorConsultationSessionResponse {
  id: number | string
  sessionId?: number | string
  memberId: number | string
  doctorId: number | string
  agreementId: number | string
  packageId?: number | string | null
  packageNameSnapshot?: string | null
  packageCodeSnapshot?: string | null
  startedAt?: string | null
  endsAt?: string | null
  status: ConsultationSessionStatus
  supportScheduleSnapshotJson?: string | null
  supportTimezoneSnapshot?: string | null
  unresolvedAttentionCount: number
  createdAt?: string | null
  updatedAt?: string | null
}

export interface DoctorConsultationDetailResponse {
  session: DoctorConsultationSessionResponse
  member?: UserSummaryResponse | Record<string, unknown> | null
  request?: ConsultationRequestReviewResponse | Record<string, unknown> | null
  packageSnapshot?: CareServicePackage | Record<string, unknown> | null
  initialHealthRecord?: HealthRecordItem | null
  attentions?: Record<string, unknown>[]
  unresolvedAttentionCount?: number
}

export interface EpisodeHealthRecordAuthorizationResponse {
  id: number | string
  sessionId: number | string
  healthRecordId: number | string
  authorizedByUserId?: number | string
  authorizedByRole?: string
  source?: string
  createdAt?: string
}

export interface FinalSummaryAddendumResponse {
  id: string | number
  finalSummaryId: string | number
  reason: string
  content: string
  createdByDoctorId?: string | number
  doctorName?: string | null
  createdAt: string
}

export interface CreateFinalSummaryAddendumPayload {
  reason: string
  content: string
}

export interface CareContinuitySummaryResponse {
  sessionId: number | string
  startedAt?: string | null
  endsAt?: string | null
  completedAt?: string | null
  doctorName?: string | null
  doctorId?: number | string | null
  packageName?: string | null
  packageCode?: string | null
  summary: string
  observations?: string | null
  recommendations?: string | null
  followUpRecommendation?: string | null
  finalizedAt?: string | null
  addenda?: FinalSummaryAddendumResponse[] | null
}

export interface DoctorRawArtifactResponse {
  recordId: number | string
  uploadUrl?: string
  downloadUrl?: string
  s3Key?: string
}

export interface ConsultationFinalSummaryResponse {
  id: string | number
  sessionId: string | number
  status: ConsultationFinalSummaryStatus
  summary: string
  observations?: string | null
  recommendations?: string | null
  followUpRecommendation?: string | null
  referencedHealthRecordIds?: (number | string)[] | null
  referencedHealthRecords?: HealthRecordItem[] | null
  addenda?: FinalSummaryAddendumResponse[] | null
  createdByDoctorId: string | number
  doctorName?: string | null
  finalizedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface UpsertConsultationFinalSummaryPayload {
  summary: string
  observations?: string | null
  recommendations?: string | null
  followUpRecommendation?: string | null
  referencedHealthRecordIds?: (number | string)[] | null
}

export interface ConsultationAttentionResponse {
  id: string | number
  sessionId: string | number
  healthRecordId: string | number
  status: "REQUIRES_ATTENTION" | "REVIEWED" | string
  reason: string
  reviewedAt?: string | null
  reviewedByDoctorId?: number | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface DoctorScopedHealthRecordResponse {
  record: HealthRecordItem & {
    userId?: string | number
    fileName?: string
    fileSize?: number
    predictionLabel?: string
    confidence?: number
    hrvFeatures?: Record<string, unknown> | null
  }
  initialAttachedRecord: boolean
  attention?: ConsultationAttentionResponse | null
}
