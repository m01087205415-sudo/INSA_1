import React, { useState } from 'react';
import {
  Employee,
  NoticeDocument,
  ReceiptConfirmation,
  LeavePlan,
  OfficialAnnouncement,
  AuditEvent
} from '../../types';
import { A4OfficialAnnouncement } from '../documents/A4OfficialAnnouncement';
import { A4NoticeDocument } from '../documents/A4NoticeDocument';
import { A4ReceiptConfirmation } from '../documents/A4ReceiptConfirmation';
import { A4LeavePlanDocument } from '../documents/A4LeavePlanDocument';
import { OfficialSeal } from '../OfficialSeal';
import { getKSTNow, formatKST } from '../../utils/dateUtils';
import { computeSHA256 } from '../../utils/crypto';
import {
  Users,
  Send,
  CheckCircle2,
  AlertTriangle,
  Upload,
  FileSpreadsheet,
  FileText,
  Mail,
  Shield,
  Download,
  Search,
  Eye,
  RefreshCw,
  Printer,
  Copy,
  Check,
  Building2,
  Clock,
  Sparkles
} from 'lucide-react';

interface HrDashboardProps {
  currentYear: number;
  onYearChange: (year: number) => void;
  employees: Employee[];
  notices: Record<string, NoticeDocument>;
  receipts: Record<string, ReceiptConfirmation>;
  plans: Record<string, LeavePlan>;
  auditLogs: AuditEvent[];
  announcement: OfficialAnnouncement;
  onUpdateAnnouncement: (announcement: OfficialAnnouncement) => void;
  onAddEmployee: (employee: Employee) => void;
  onBatchIssueNotices: () => void;
  onHrReceivePlan: (planId: string, receiverName: string) => void;
  onSendHrEmail: (planId: string) => void;
  customSealUrl?: string | null;
  onOpenDiffModal: () => void;
}

export const HrDashboard: React.FC<HrDashboardProps> = ({
  currentYear,
  onYearChange,
  employees,
  notices,
  receipts,
  plans,
  auditLogs,
  announcement,
  onUpdateAnnouncement,
  onAddEmployee,
  onBatchIssueNotices,
  onHrReceivePlan,
  onSendHrEmail,
  customSealUrl,
  onOpenDiffModal,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EMPLOYEES' | 'ANNOUNCEMENT' | 'EVIDENCE' | 'AUDIT'>('OVERVIEW');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedEmpForPreview, setSelectedEmpForPreview] = useState<Employee | null>(null);
  const [previewDocType, setPreviewDocType] = useState<'NOTICE' | 'RECEIPT' | 'PLAN' | 'BUNDLE'>('NOTICE');

  // Announcement Editor State
  const [editingAnnouncement, setEditingAnnouncement] = useState<OfficialAnnouncement>(announcement);
  const [copiedAnnouncementText, setCopiedAnnouncementText] = useState(false);

  // CSV Upload modal state
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvErrors, setCsvErrors] = useState<string[]>([]);

  // Calculation of KPIs
  const totalEmployees = employees.length;
  const noticesIssuedCount = Object.keys(notices).length;
  const receiptsSignedCount = Object.keys(receipts).length;
  const plansSubmittedCount = Object.values(plans).filter(p => p.status === 'SUBMITTED' || p.status === 'APPROVED').length;
  const plansApprovedCount = Object.values(plans).filter(p => p.status === 'APPROVED').length;
  const hrReceivedCount = Object.values(plans).filter(p => !!p.hrReceivedAt).length;
  const emailSentCount = Object.values(plans).filter(p => p.emailStatus === 'SENT').length;

  // Filtered employees list
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.name.includes(searchTerm) ||
      emp.id.includes(searchTerm) ||
      emp.department.includes(searchTerm) ||
      emp.site.includes(searchTerm);
    if (!matchesSearch) return false;

    if (statusFilter === 'SIGNED') return !!receipts[emp.id];
    if (statusFilter === 'APPROVED') return plans[emp.id]?.status === 'APPROVED';
    if (statusFilter === 'PENDING') return !receipts[emp.id];
    if (statusFilter === 'REVIEW_NEEDED') {
      return emp.status === '신입(1년미만)' || emp.status === '휴직' || emp.status === '임원(검토대상)';
    }
    return true;
  });

  const handleSaveAnnouncement = () => {
    onUpdateAnnouncement(editingAnnouncement);
    alert('사내게시판용 공문이 저장되었습니다. (발행일자 KST 고정됨)');
  };

  const handleCopyAnnouncementText = () => {
    const text = `[공문] ${editingAnnouncement.title}
문서번호 : ${editingAnnouncement.id}
시행일자 : ${editingAnnouncement.issueDate}
수    신 : ${editingAnnouncement.recipient}
참    조 : ${editingAnnouncement.reference}
담당부서 : ${editingAnnouncement.contactPerson} (${editingAnnouncement.extensionNumber})

1. 관련근거: 근로기준법 제61조(연차 유급휴가의 사용촉진)
2. 제출대상: ${editingAnnouncement.targetDescription}
3. 제출방법: 모바일 연차촉진 시스템 접속 (본인확인 -> 서명 -> 계획작성 -> 부서장결재)
4. 회사 제출목표일: ${editingAnnouncement.companyTargetDeadline}
   (※ 개인별 법정 회신기한은 각 임직원 통지서 수령 후 10일 이내)

발신 : ${editingAnnouncement.senderTitle} ${editingAnnouncement.senderName}`;

    navigator.clipboard.writeText(text);
    setCopiedAnnouncementText(true);
    setTimeout(() => setCopiedAnnouncementText(false), 2500);
  };

  const handleParseCsv = () => {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) {
      setCsvErrors(['데이터가 비어 있습니다.']);
      return;
    }

    const errors: string[] = [];
    let addedCount = 0;

    lines.forEach((line, idx) => {
      // Skip header if present
      if (idx === 0 && line.includes('사번')) return;

      const cols = line.split(',').map(c => c.trim());
      if (cols.length < 10) {
        errors.push(`${idx + 1}행: 컬럼 수가 부족합니다 (최소 10개 필요)`);
        return;
      }

      const [id, name, department, site, position, hireDate, phone, grantedStr, usedStr, remainingStr] = cols;

      const totalGranted = parseFloat(grantedStr);
      const usedDays = parseFloat(usedStr);
      const remainingDays = parseFloat(remainingStr);

      if (isNaN(totalGranted) || isNaN(usedDays) || isNaN(remainingDays)) {
        errors.push(`${idx + 1}행 (${name}): 연차 일수는 숫자여야 합니다.`);
        return;
      }

      // Check 0.5 unit rule
      if (totalGranted % 0.5 !== 0 || usedDays % 0.5 !== 0 || remainingDays % 0.5 !== 0) {
        errors.push(`${idx + 1}행 (${name}): 연차 일수는 0.5일 단위여야 합니다.`);
        return;
      }

      // Check 발생 - 사용 = 미사용
      if (Math.abs((totalGranted - usedDays) - remainingDays) > 0.001) {
        errors.push(`${idx + 1}행 (${name}): 발생(${totalGranted}) - 사용(${usedDays}) != 미사용(${remainingDays}) 불일치`);
        return;
      }

      // Check duplicate ID
      if (employees.some(e => e.id === id)) {
        errors.push(`${idx + 1}행 (${id}): 이미 존재하는 사번입니다.`);
        return;
      }

      const newEmp: Employee = {
        id,
        name,
        department,
        site: site || '본사',
        position,
        hireDate,
        status: hireDate >= '2026-10-01' ? '신입(1년미만)' : '재직',
        phone,
        managerId: 'YW2010005',
        managerName: '양성택',
        year: currentYear,
        totalGranted,
        usedDays,
        remainingDays,
        calculationBaseDate: `${currentYear}-06-30`,
        leaveExpirationDate: `${currentYear}-12-31`,
        leaveType: '일반연차',
        calcMethod: '회계연도',
        noticeWindowStart: `${currentYear}-07-01`,
        noticeWindowEnd: `${currentYear}-07-10`,
        statutoryReplyDeadline: `${currentYear}-07-20`
      };

      onAddEmployee(newEmp);
      addedCount++;
    });

    if (errors.length > 0) {
      setCsvErrors(errors);
    } else {
      alert(`총 ${addedCount}명의 직원 데이터가 정상 업로드 및 검증되었습니다.`);
      setIsCsvModalOpen(false);
      setCsvText('');
      setCsvErrors([]);
    }
  };

  const handleDownloadEvidenceBundle = (emp: Employee) => {
    const noticeDoc = notices[emp.id];
    const receiptDoc = receipts[emp.id];
    const planDoc = plans[emp.id];
    const empLogs = auditLogs.filter(l => l.employeeId === emp.id);

    const bundleData = {
      company: '양우종합건설 주식회사',
      operatingYear: currentYear,
      exportedAt: getKSTNow().kstString,
      employee: {
        id: emp.id,
        name: emp.name,
        department: emp.department,
        position: emp.position,
        leaveSnapshot: {
          totalGranted: emp.totalGranted,
          usedDays: emp.usedDays,
          remainingDays: emp.remainingDays
        }
      },
      documents: {
        notice: noticeDoc || '미발행',
        receipt: receiptDoc || '미서명',
        plan: planDoc || '미제출'
      },
      auditTrail: empLogs
    };

    const blob = new Blob([JSON.stringify(bundleData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `양우건설_연차촉진증빙_${emp.name}_${emp.id}_${currentYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Corporate Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-blue-600 rounded text-xs font-bold tracking-wider uppercase">
              HR Administration
            </span>
            <span className="text-xs text-slate-400">
              양우종합건설 인사총무팀 연차촉진 관리 콘솔
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Building2 className="w-6 h-6 text-sky-400" />
            연차휴가 사용촉진 전자문서 관리 시스템
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            근로기준법 제61조 준수 · 개인별 1차 통지 · 서명확인 · 사용계획 · 부서장 결재 · 인사 접수 이원화
          </p>
        </div>

        {/* Operating Year & Difference Viewer Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenDiffModal}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-400/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-sky-400" />
            기존 서식 vs 개정 서식 1:1 비교
          </button>

          <div className="flex items-center bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400 mr-2">운영연도:</span>
            <select
              value={currentYear}
              onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
              className="bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer"
            >
              <option value={2026} className="bg-slate-800">2026년</option>
              <option value={2027} className="bg-slate-800">2027년 (운영기준)</option>
              <option value={2028} className="bg-slate-800">2028년</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Status Cards: Honest Legal Lifecycle Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-semibold">1. 총 대상 임직원</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalEmployees}명</div>
          <div className="text-[10px] text-slate-400 mt-0.5">본사/현장 합계</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-semibold">2. 통지서 발급</div>
          <div className="text-xl font-bold text-blue-700 mt-1">{noticesIssuedCount}건</div>
          <div className="text-[10px] text-blue-600 mt-0.5">인감 전자날인 완료</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-semibold">3. 수령확인 서명</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{receiptsSignedCount}건</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">
            진행률: {totalEmployees ? Math.round((receiptsSignedCount / totalEmployees) * 100) : 0}%
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-semibold">4. 계획 통보</div>
          <div className="text-xl font-bold text-indigo-700 mt-1">{plansSubmittedCount}건</div>
          <div className="text-[10px] text-indigo-600 mt-0.5">최초 통보시각 고정</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-semibold">5. 부서장 결재완료</div>
          <div className="text-xl font-bold text-purple-700 mt-1">{plansApprovedCount}건</div>
          <div className="text-[10px] text-purple-600 mt-0.5">현장소장/팀장 승인</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-semibold">6. 인사 접수</div>
          <div className="text-xl font-bold text-teal-700 mt-1">{hrReceivedCount}건</div>
          <div className="text-[10px] text-teal-600 mt-0.5">인사팀 최종 도달</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-semibold">7. 메일 발송</div>
          <div className="text-xl font-bold text-slate-700 mt-1">{emailSentCount}건</div>
          <div className="text-[10px] text-slate-500 mt-0.5">tecs_hr 전송</div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-6 gap-3 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`py-3.5 border-b-2 transition-colors ${
            activeTab === 'OVERVIEW'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          직원별 진행 현황 & 증빙 관리
        </button>

        <button
          onClick={() => setActiveTab('ANNOUNCEMENT')}
          className={`py-3.5 border-b-2 transition-colors ${
            activeTab === 'ANNOUNCEMENT'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          사내게시판 공문 작성기 (PDF 1쪽 재현)
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`py-3.5 border-b-2 transition-colors ${
            activeTab === 'AUDIT'
              ? 'border-blue-600 text-blue-700 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          감사 로그 & 무결성 해시 기록 ({auditLogs.length}건)
        </button>
      </div>

      {/* TAB 1: OVERVIEW & EMPLOYEES */}
      {activeTab === 'OVERVIEW' && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-6 space-y-4">
          {/* Action Tools Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="성명, 사번, 소속팀, 현장 검색..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-slate-50 font-semibold"
              >
                <option value="ALL">전체 상태</option>
                <option value="SIGNED">서명 완료</option>
                <option value="APPROVED">결재 완료</option>
                <option value="PENDING">미서명</option>
                <option value="REVIEW_NEEDED">검토대상 (신입/휴직/임원)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCsvModalOpen(true)}
                className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                엑셀/CSV 일괄 업로드
              </button>

              <button
                onClick={onBatchIssueNotices}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                전체 통지서 일괄 발급 및 날인
              </button>
            </div>
          </div>

          {/* Legal Advisory Callout */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>인사담당자 실무 주의:</strong> 1차 사용촉진 통지 및 계획 제출만으로 '수당 지급의무 면제'가 자동 확정되지 않습니다.
              신입사원(1년 미만자) 및 휴직자는 일반 대상과 다른 법정 기한이 적용되므로 <span className="font-bold underline">별도 검토 대상</span>으로 분류하여 심사하십시오.
            </div>
          </div>

          {/* Employees Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3">사번 / 성명</th>
                  <th className="py-3 px-3">소속 / 현장</th>
                  <th className="py-3 px-3">재직 구분</th>
                  <th className="py-3 px-3 text-center">발생 / 사용 / 잔여</th>
                  <th className="py-3 px-3 text-center">수령 확인증</th>
                  <th className="py-3 px-3 text-center">사용계획 통보</th>
                  <th className="py-3 px-3 text-center">부서장 결재</th>
                  <th className="py-3 px-3 text-center">인사 접수</th>
                  <th className="py-3 px-3 text-center">증빙 및 작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEmployees.map(emp => {
                  const receipt = receipts[emp.id];
                  const plan = plans[emp.id];
                  const isUnderOneYear = emp.status === '신입(1년미만)';
                  const isExecutive = emp.status === '임원(검토대상)';
                  const isLeaveOfAbsence = emp.status === '휴직';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 text-sm">{emp.name}</div>
                        <div className="font-mono text-slate-500 text-[11px]">{emp.id} · {emp.position}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{emp.department}</div>
                        <div className="text-slate-500 text-[11px]">{emp.site}</div>
                      </td>

                      <td className="py-3 px-3">
                        {isUnderOneYear ? (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded text-[10px]">
                            1년미만(별도검토)
                          </span>
                        ) : isExecutive ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px]">
                            임원(근로자성검토)
                          </span>
                        ) : isLeaveOfAbsence ? (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 font-bold rounded text-[10px]">
                            휴직자(별도검토)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                            일반재직
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-mono">
                        <span className="text-slate-600">{emp.totalGranted}</span> /{' '}
                        <span className="text-slate-600">{emp.usedDays}</span> /{' '}
                        <span className="font-bold text-red-600">{emp.remainingDays}일</span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {receipt ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> 서명완료
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">미서명</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {plan ? (
                          <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold text-[11px]">
                            {plan.totalPlannedDays}일 통보
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {plan?.status === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 text-purple-700 font-bold text-[11px] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            승인됨 ({plan.managerName})
                          </span>
                        ) : plan?.status === 'REJECTED' ? (
                          <span className="text-rose-600 font-bold text-[11px]">반려</span>
                        ) : plan ? (
                          <span className="text-amber-600 font-medium text-[11px]">결재대기</span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {plan?.hrReceivedAt ? (
                          <span className="text-teal-700 font-bold text-[11px] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            접수완료
                          </span>
                        ) : plan?.status === 'APPROVED' ? (
                          <button
                            onClick={() => onHrReceivePlan(plan.id, '인사총무 오정환 대리')}
                            className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[10px] font-bold"
                          >
                            인사 접수 처리
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedEmpForPreview(emp);
                              setPreviewDocType('BUNDLE');
                            }}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded"
                            title="문서 열람"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDownloadEvidenceBundle(emp)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded"
                            title="증빙 패키지 JSON 다운로드"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: OFFICIAL ANNOUNCEMENT EDITOR */}
      {activeTab === 'ANNOUNCEMENT' && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                사내게시판 연차휴가 사용계획서 제출 요청 공문 작성 및 관리
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                PDF 1쪽 양식을 편집 가능한 템플릿으로 재현하며, 작성일자는 KST 실시간 기준으로 자동 확정됩니다.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyAnnouncementText}
                className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedAnnouncementText ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>게시판 텍스트 복사됨!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>게시판 텍스트 복사</span>
                  </>
                )}
              </button>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                A4 인쇄 / PDF
              </button>

              <button
                onClick={handleSaveAnnouncement}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                공문 저장 및 발행 확정
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Editable Fields */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">문서번호</label>
                  <input
                    type="text"
                    value={editingAnnouncement.id}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, id: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">시행일자 (KST 자동입력)</label>
                  <input
                    type="text"
                    value={editingAnnouncement.issueDate}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, issueDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">담당자</label>
                  <input
                    type="text"
                    value={editingAnnouncement.contactPerson}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, contactPerson: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">내선번호</label>
                  <input
                    type="text"
                    value={editingAnnouncement.extensionNumber}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, extensionNumber: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">수신</label>
                  <input
                    type="text"
                    value={editingAnnouncement.recipient}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, recipient: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">참조</label>
                  <input
                    type="text"
                    value={editingAnnouncement.reference}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, reference: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">제목</label>
                <input
                  type="text"
                  value={editingAnnouncement.title}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">1. 제출대상</label>
                <textarea
                  rows={2}
                  value={editingAnnouncement.targetDescription}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, targetDescription: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">3. 제출방법 (모바일 시스템 대체)</label>
                <textarea
                  rows={2}
                  value={editingAnnouncement.submissionMethod}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, submissionMethod: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">4. 회사 제출목표일</label>
                  <input
                    type="text"
                    value={editingAnnouncement.companyTargetDeadline}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, companyTargetDeadline: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg font-bold text-red-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">발신 직책 및 성명</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingAnnouncement.senderTitle}
                      onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, senderTitle: e.target.value })}
                      className="w-1/2 p-2.5 border border-slate-300 rounded-lg font-bold"
                    />
                    <input
                      type="text"
                      value={editingAnnouncement.senderName}
                      onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, senderName: e.target.value })}
                      className="w-1/2 p-2.5 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Live A4 Preview */}
            <div className="bg-slate-200 p-4 rounded-xl overflow-y-auto max-h-[750px] shadow-inner">
              <A4OfficialAnnouncement announcement={editingAnnouncement} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                전자문서 무결성 감사로그 (Audit Trail)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                모든 통지, 발송, 열람, 전자서명, 계획제출, 결재, 인사접수는 UTC 저장 및 한국시간(KST)으로 기록됩니다.
              </p>
            </div>
            <span className="text-xs font-mono bg-slate-100 px-3 py-1 rounded-full text-slate-600">
              총 {auditLogs.length}건 보존
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-[600px]">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                  <th className="py-2.5 px-3">발생시각 (KST)</th>
                  <th className="py-2.5 px-3">이벤트 구분</th>
                  <th className="py-2.5 px-3">대상 임직원</th>
                  <th className="py-2.5 px-3">수행자 / 환경</th>
                  <th className="py-2.5 px-3">상세 내용</th>
                  <th className="py-2.5 px-3 font-mono">SHA-256 해시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-700 whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-sans font-bold text-[10px]">
                        {log.eventType}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-sans font-medium text-slate-900 whitespace-nowrap">
                      {log.employeeName} ({log.employeeId})
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-600 whitespace-nowrap">{log.actor}</td>
                    <td className="py-2 px-3 font-sans text-slate-800">{log.summary}</td>
                    <td className="py-2 px-3 text-slate-400 text-[10px]">{log.hash.substring(0, 16)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              임직원 및 연차 데이터 엑셀/CSV 업로드
            </h3>
            <p className="text-xs text-slate-500">
              형식: 사번, 성명, 소속, 현장, 직급, 입사일(YYYY-MM-DD), 휴대폰, 발생일수, 사용일수, 미사용일수
              (※ 0.5일 단위 지원, 발생-사용=미사용 자동 검증)
            </p>

            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="YW2021099, 홍길동, 토목기술팀, 본사, 과장, 2021-03-01, 010-1234-5678, 18.0, 5.5, 12.5"
              className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />

            {csvErrors.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-1 max-h-32 overflow-y-auto">
                <div className="font-bold">검증 실패 항목 ({csvErrors.length}건):</div>
                {csvErrors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setIsCsvModalOpen(false);
                  setCsvErrors([]);
                }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50"
              >
                닫기
              </button>
              <button
                onClick={handleParseCsv}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
              >
                검증 및 등록
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal for Individual Document Inspection */}
      {selectedEmpForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-100 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm text-slate-900">
                  {selectedEmpForPreview.name} 님의 연차촉진 법정 서식 일람
                </span>
                <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold gap-1">
                  <button
                    onClick={() => setPreviewDocType('NOTICE')}
                    className={`px-2.5 py-1 rounded ${previewDocType === 'NOTICE' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600'}`}
                  >
                    1. 통지서
                  </button>
                  <button
                    onClick={() => setPreviewDocType('RECEIPT')}
                    className={`px-2.5 py-1 rounded ${previewDocType === 'RECEIPT' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600'}`}
                  >
                    2. 수령확인증
                  </button>
                  <button
                    onClick={() => setPreviewDocType('PLAN')}
                    className={`px-2.5 py-1 rounded ${previewDocType === 'PLAN' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600'}`}
                  >
                    3. 사용계획서
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> 인쇄
                </button>
                <button
                  onClick={() => setSelectedEmpForPreview(null)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold"
                >
                  닫기
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
              {previewDocType === 'NOTICE' && notices[selectedEmpForPreview.id] && (
                <A4NoticeDocument
                  employee={selectedEmpForPreview}
                  notice={notices[selectedEmpForPreview.id]}
                  customSealUrl={customSealUrl}
                />
              )}

              {previewDocType === 'RECEIPT' && (
                receipts[selectedEmpForPreview.id] ? (
                  <A4ReceiptConfirmation
                    employee={selectedEmpForPreview}
                    receipt={receipts[selectedEmpForPreview.id]}
                  />
                ) : (
                  <div className="bg-white p-12 text-center text-slate-400 text-sm rounded-xl">
                    아직 근로자가 수령 확인증에 서명하지 않았습니다.
                  </div>
                )
              )}

              {previewDocType === 'PLAN' && (
                plans[selectedEmpForPreview.id] ? (
                  <A4LeavePlanDocument plan={plans[selectedEmpForPreview.id]} />
                ) : (
                  <div className="bg-white p-12 text-center text-slate-400 text-sm rounded-xl">
                    아직 근로자가 사용계획서를 제출하지 않았습니다.
                  </div>
                )
              )}

              {previewDocType === 'BUNDLE' && (
                <div className="space-y-8">
                  {notices[selectedEmpForPreview.id] && (
                    <A4NoticeDocument
                      employee={selectedEmpForPreview}
                      notice={notices[selectedEmpForPreview.id]}
                      customSealUrl={customSealUrl}
                    />
                  )}
                  {receipts[selectedEmpForPreview.id] && (
                    <A4ReceiptConfirmation
                      employee={selectedEmpForPreview}
                      receipt={receipts[selectedEmpForPreview.id]}
                    />
                  )}
                  {plans[selectedEmpForPreview.id] && (
                    <A4LeavePlanDocument plan={plans[selectedEmpForPreview.id]} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
