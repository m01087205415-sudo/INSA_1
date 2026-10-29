/**
 * Types for Yangwoo General Construction (양우종합건설)
 * Annual Leave Promotion & Planning Mobile/Web Workflow System
 */

export type EmployeeRole = 'WORKER' | 'MANAGER' | 'HR' | 'ADMIN';

export type EmploymentStatus = '재직' | '휴직' | '신입(1년미만)' | '임원(검토대상)' | '퇴직';

export type CalculationMethod = '회계연도' | '입사일';

export type LeaveType = '일반연차' | '1년미만월단위' | '단시간/현채';

export interface Employee {
  id: string; // 사번 e.g. YW2021008
  name: string; // 성명 e.g. 윤형근
  department: string; // 소속 e.g. 외주구매팀, 인사총무팀, 건축사업본부
  site: string; // 현장/근무지 e.g. 본사, 세종 4-2 신축현장, 인천 청라현장
  position: string; // 직급 e.g. 부장, 과장, 대리, 사원
  hireDate: string; // 입사일 YYYY-MM-DD
  status: EmploymentStatus;
  phone: string; // 휴대폰 010-XXXX-XXXX
  managerId: string; // 소속 부서장/현장소장 사번
  managerName?: string;
  year: number; // 운영연도 (2027)

  // 연차 내역
  totalGranted: number; // 발생 연차일수
  usedDays: number; // 사용일수 (하계휴가 등 포함 여부 명시)
  remainingDays: number; // 미사용 연차일수
  carriedOverDays?: number; // 이월 연차
  specialAgreementDays?: number; // 약정휴가

  calculationBaseDate: string; // 산정 기준일 e.g. 2027-06-30
  leaveExpirationDate: string; // 사용기간 종료일 e.g. 2027-12-31
  leaveType: LeaveType;
  calcMethod: CalculationMethod;

  // 법정 일정 산출
  noticeWindowStart: string; // 6개월 전 10일 이내 시작
  noticeWindowEnd: string;
  statutoryReplyDeadline: string; // 통지 수령 후 10일 이내
}

export type NoticeStatus = 
  | 'DRAFT' // 통지 준비
  | 'ISSUED' // 통지 발급
  | 'DISPATCH_REQUESTED' // 알림 전송요청
  | 'DISPATCHED' // 제공자 접수
  | 'DELIVERED' // 기술적 수신
  | 'VIEWED' // 통지 열람
  | 'SIGNED' // 수령확인 서명
  | 'PLAN_SUBMITTED' // 계획 통보 (최초 통보시각 고정)
  | 'MANAGER_APPROVED' // 부서장 승인
  | 'MANAGER_REJECTED' // 부서장 반려
  | 'HR_RECEIVED' // 인사 접수
  | 'EMAIL_SENT'; // 인사팀 메일 발송

export interface NoticeDocument {
  id: string; // e.g. NOT-2027-07-001
  employeeId: string;
  year: number;
  issueDate: string; // 발급일 (KST)
  calculationBaseDate: string;
  totalGranted: number;
  usedDays: number;
  remainingDays: number;
  statutoryReplyDeadline: string; // 개인별 회신기한
  sealApplied: boolean;
  sealDetails: {
    sealName: string;
    appliedAt: string;
    hash: string;
  };
  docHash: string; // SHA-256
}

export interface ReceiptConfirmation {
  id: string; // e.g. RCP-2027-001
  noticeId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  site: string;
  signedAt: string; // 실제 서명 시각 (KST)
  signatureDataUrl: string; // 자필 서명 Canvas Base64
  confirmationText: string;
  authMethod: 'MOBILE_OTP' | 'EXTERNAL_IDENTITY';
  authLevel: string;
  docHash: string;
}

export type LeaveSlot = 'ALL' | 'AM' | 'PM';

export interface LeavePlanItem {
  id: string;
  startDate: string;
  endDate: string;
  slot: LeaveSlot;
  days: number; // 0.5 or 1 or multiple
  note: string; // 연차촉진, 하계휴가 등
}

export interface LeavePlan {
  id: string; // e.g. PLN-2027-001
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  year: number;
  version: number;
  items: LeavePlanItem[];
  totalPlannedDays: number;
  remainingUnplannedDays: number;
  firstSubmittedAt: string; // 직원이 회사에 통보한 최초 시각 (부서장 결재 지연에도 불변)
  lastSubmittedAt: string;
  statementText: string;

  // 결재 정보
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  managerId: string;
  managerName: string;
  approvalStep: 'TEAM_HEAD' | 'SITE_DIRECTOR' | 'DIRECTOR';
  approvedAt?: string;
  rejectedAt?: string;
  rejectReason?: string;
  isDelegated?: boolean; // 대결/위임 여부
  delegatorNote?: string;

  // 인사 접수 및 이메일 전송 정보
  hrReceivedAt?: string;
  hrReceiverName?: string;
  emailSentAt?: string;
  emailStatus?: 'NOT_CONNECTED' | 'QUEUED' | 'SENT' | 'FAILED';
  emailRecipient?: string;
  emailError?: string;

  docHash: string;
}

export interface OfficialAnnouncement {
  id: string; // e.g. 인사 제 2027-07-01호
  year: number;
  issueDate: string; // YYYY. MM. DD. (작성일 KST 고정)
  contactPerson: string; // e.g. 엄민호 부장
  extensionNumber: string; // e.g. 내선 2461
  recipient: string; // 수신: 전 임직원
  reference: string; // 참조: 각 부서장 및 현장소장
  title: string; // 2027년도 연차휴가 사용계획서 제출 요청
  targetDescription: string;
  submissionItems: string[];
  submissionMethod: string;
  companyTargetDeadline: string; // e.g. 2027. 07. 16(금)
  notes: string[];
  attachments: string[];
  senderTitle: string; // 경영지원본부장
  senderName: string; // 양성택
  sealOmitted: boolean; // 직인생략
}

export interface AuditEvent {
  id: string;
  timestamp: string; // KST formatted
  utcTimestamp: string;
  employeeId: string;
  employeeName: string;
  eventType: 
    | 'NOTICE_ISSUED' 
    | 'ALARM_DISPATCHED' 
    | 'NOTICE_VIEWED' 
    | 'RECEIPT_SIGNED' 
    | 'PLAN_NOTIFIED' 
    | 'MANAGER_APPROVED' 
    | 'MANAGER_REJECTED' 
    | 'HR_RECEIVED' 
    | 'EMAIL_DISPATCHED'
    | 'SEAL_REGISTERED';
  summary: string;
  actor: string;
  ipAddress?: string;
  hash: string;
}

export interface VerificationScenario {
  id: number;
  title: string;
  description: string;
  status: 'PENDING' | 'PASSED' | 'FAILED';
  resultDetails: string;
}
