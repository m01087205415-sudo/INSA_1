import React, { useState, useEffect } from 'react';
import {
  Employee,
  NoticeDocument,
  ReceiptConfirmation,
  LeavePlan,
  OfficialAnnouncement,
  AuditEvent,
  EmployeeRole
} from './types';
import { INITIAL_EMPLOYEES, INITIAL_ANNOUNCEMENT } from './data/mockData';
import { getKSTNow, calculateStatutoryDeadline } from './utils/dateUtils';
import { computeSHA256 } from './utils/crypto';
import { YangwooLogo } from './components/YangwooLogo';
import { WorkerPortal } from './components/worker/WorkerPortal';
import { ManagerPortal } from './components/manager/ManagerPortal';
import { HrDashboard } from './components/hr/HrDashboard';
import { DocumentDiffModal } from './components/documents/DocumentDiffModal';
import { AdminSettingsModal } from './components/admin/AdminSettingsModal';
import {
  Smartphone,
  Building2,
  Users,
  Settings,
  ShieldCheck,
  FileText,
  Clock,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export default function App() {
  // Current Operating Year (Default 2027 as required)
  const [operatingYear, setOperatingYear] = useState<number>(2027);

  // Active Role Portal: WORKER (Mobile), MANAGER (Approvals), HR (Console)
  const [activeRole, setActiveRole] = useState<EmployeeRole>('WORKER');

  // Device layout mode: 'RESPONSIVE' or 'MOBILE_FRAME'
  const [viewMode, setViewMode] = useState<'RESPONSIVE' | 'MOBILE_FRAME'>('RESPONSIVE');

  // Core Data Collections
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [notices, setNotices] = useState<Record<string, NoticeDocument>>({});
  const [receipts, setReceipts] = useState<Record<string, ReceiptConfirmation>>({});
  const [plans, setPlans] = useState<Record<string, LeavePlan>>({});
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [announcement, setAnnouncement] = useState<OfficialAnnouncement>(INITIAL_ANNOUNCEMENT);

  // Active worker & manager selections
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(INITIAL_EMPLOYEES[0].id); // 윤형근 부장
  const [selectedManagerId, setSelectedManagerId] = useState<string>('YW2010005'); // 양성택 본부장

  // Official Seal Settings & Custom Image
  const [customSealUrl, setCustomSealUrl] = useState<string | null>(null);
  const [sealConfig, setSealConfig] = useState({ size: 76, rotation: -4, opacity: 0.9 });

  // Modals
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);

  // Helper to add audit event
  const addAuditLog = async (
    employeeId: string,
    employeeName: string,
    eventType: AuditEvent['eventType'],
    summary: string,
    actor: string
  ) => {
    const { kstString, isoString } = getKSTNow();
    const hash = await computeSHA256({ employeeId, eventType, summary, kstString });
    const newLog: AuditEvent = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: kstString,
      utcTimestamp: isoString,
      employeeId,
      employeeName,
      eventType,
      summary,
      actor,
      hash
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Initial batch generation of notices on first load
  useEffect(() => {
    const initialNotices: Record<string, NoticeDocument> = {};
    const { kstString } = getKSTNow();

    employees.forEach(async (emp) => {
      const deadline = calculateStatutoryDeadline(`${operatingYear}-07-01`);
      const noticeId = `NOT-${operatingYear}-07-${emp.id.slice(-3)}`;
      const hash = await computeSHA256({
        id: noticeId,
        year: operatingYear,
        employeeId: emp.id,
        remainingDays: emp.remainingDays,
        issuedAt: `${operatingYear}. 07. 01.`
      });

      initialNotices[emp.id] = {
        id: noticeId,
        employeeId: emp.id,
        year: operatingYear,
        issueDate: `${operatingYear}. 07. 01.`,
        calculationBaseDate: `${operatingYear}-06-30`,
        totalGranted: emp.totalGranted,
        usedDays: emp.usedDays,
        remainingDays: emp.remainingDays,
        statutoryReplyDeadline: deadline,
        sealApplied: true,
        sealDetails: {
          sealName: '양우종합건설(주) 대표이사지인',
          appliedAt: kstString,
          hash: hash.substring(0, 16)
        },
        docHash: hash
      };
    });

    setNotices(initialNotices);

    // Initial audit log
    addAuditLog(
      'SYSTEM',
      '시스템 자동',
      'SEAL_REGISTERED',
      `${operatingYear}년도 양우종합건설 공인 사용인감 및 촉진 통지서 초기 스냅샷 등록`,
      '인사총무팀 자동발급'
    );
  }, [operatingYear]);

  // Handlers for Worker Flow
  const handleRecordView = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    addAuditLog(
      emp.id,
      emp.name,
      'NOTICE_VIEWED',
      `연차휴가 사용촉진 통지서 본인인증 및 열람 확인 (잔여연차: ${emp.remainingDays}일)`,
      `${emp.name} (모바일 본인)`
    );
  };

  const handleSaveReceipt = (receipt: ReceiptConfirmation) => {
    setReceipts(prev => ({ ...prev, [receipt.employeeId]: receipt }));
    addAuditLog(
      receipt.employeeId,
      receipt.employeeName,
      'RECEIPT_SIGNED',
      `수령 확인증 전자서명 완료 (확인증 번호: ${receipt.id}, 해시: ${receipt.docHash.substring(0, 12)}...)`,
      `${receipt.employeeName} (자필 전자서명)`
    );
  };

  const handleSubmitPlan = (plan: LeavePlan) => {
    setPlans(prev => ({ ...prev, [plan.employeeId]: plan }));
    addAuditLog(
      plan.employeeId,
      plan.employeeName,
      'PLAN_NOTIFIED',
      `연차휴가 사용계획 ${plan.totalPlannedDays}일 통보 및 부서장 결재 요청 (최초통보시각 고정)`,
      `${plan.employeeName} (기안)`
    );
  };

  const handleSendToHrEmail = (planId: string) => {
    const targetPlan = Object.values(plans).find(p => p.id === planId);
    if (!targetPlan) return;

    const { kstString } = getKSTNow();
    const updatedPlan: LeavePlan = {
      ...targetPlan,
      emailSentAt: kstString,
      emailStatus: 'SENT',
      emailRecipient: 'tecs_hr@ywconst.com'
    };

    setPlans(prev => ({ ...prev, [targetPlan.employeeId]: updatedPlan }));
    addAuditLog(
      targetPlan.employeeId,
      targetPlan.employeeName,
      'EMAIL_DISPATCHED',
      `서명 확인증 및 결재완료 사용계획서 tecs_hr@ywconst.com 이메일 송부 접수`,
      `시스템 자동발송`
    );
    alert(`인사총무팀(tecs_hr@ywconst.com)으로 정상 송부되었습니다.\n(발송기록 시각: ${kstString})`);
  };

  // Handlers for Manager Flow
  const handleApprovePlan = (planId: string, managerName: string, isDelegated?: boolean, delegatorNote?: string) => {
    const targetPlan = Object.values(plans).find(p => p.id === planId);
    if (!targetPlan) return;

    const { kstString } = getKSTNow();
    const updatedPlan: LeavePlan = {
      ...targetPlan,
      status: 'APPROVED',
      approvedAt: kstString,
      managerName,
      isDelegated,
      delegatorNote
    };

    setPlans(prev => ({ ...prev, [targetPlan.employeeId]: updatedPlan }));
    addAuditLog(
      targetPlan.employeeId,
      targetPlan.employeeName,
      'MANAGER_APPROVED',
      `연차사용계획 결재 승인 완료 (${managerName} 부서장/소장)` + (isDelegated ? ` [대결: ${delegatorNote}]` : ''),
      managerName
    );
    alert(`${targetPlan.employeeName} 님의 연차사용계획서가 승인되었습니다.`);
  };

  const handleRejectPlan = (planId: string, reason: string) => {
    const targetPlan = Object.values(plans).find(p => p.id === planId);
    if (!targetPlan) return;

    const { kstString } = getKSTNow();
    const updatedPlan: LeavePlan = {
      ...targetPlan,
      status: 'REJECTED',
      rejectedAt: kstString,
      rejectReason: reason
    };

    setPlans(prev => ({ ...prev, [targetPlan.employeeId]: updatedPlan }));
    addAuditLog(
      targetPlan.employeeId,
      targetPlan.employeeName,
      'MANAGER_REJECTED',
      `연차사용계획 결재 반려 처리 (사유: ${reason})`,
      '소속 부서장'
    );
  };

  // Handlers for HR Flow
  const handleBatchIssueNotices = () => {
    const { kstString } = getKSTNow();
    employees.forEach(emp => {
      addAuditLog(
        emp.id,
        emp.name,
        'NOTICE_ISSUED',
        `${operatingYear}년도 연차휴가 사용촉진 통지서 일괄 재발급 및 회사 인감 전자날인`,
        '인사총무팀 엄민호 부장'
      );
    });
    alert(`총 ${employees.length}명 임직원의 ${operatingYear}년도 통지서가 일괄 발급되었습니다.`);
  };

  const handleHrReceivePlan = (planId: string, receiverName: string) => {
    const targetPlan = Object.values(plans).find(p => p.id === planId);
    if (!targetPlan) return;

    const { kstString } = getKSTNow();
    const updatedPlan: LeavePlan = {
      ...targetPlan,
      hrReceivedAt: kstString,
      hrReceiverName: receiverName
    };

    setPlans(prev => ({ ...prev, [targetPlan.employeeId]: updatedPlan }));
    addAuditLog(
      targetPlan.employeeId,
      targetPlan.employeeName,
      'HR_RECEIVED',
      `인사총무팀 정식 접수 처리 완료 (접수자: ${receiverName})`,
      receiverName
    );
    alert(`${targetPlan.employeeName} 님의 계획서가 인사총무팀에 정식 접수 처리되었습니다.`);
  };

  const currentWorker = employees.find(e => e.id === selectedWorkerId) || employees[0];
  const currentManager = employees.find(e => e.id === selectedManagerId) || employees[6]; // 양성택 본부장

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Corporate Nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Corporate Title */}
          <div className="flex items-center gap-3">
            <YangwooLogo size="sm" />
            <div className="hidden sm:block border-l border-slate-300 pl-3">
              <span className="text-xs font-bold text-slate-800 block">
                연차휴가 사용촉진 모바일 업무 시스템
              </span>
              <span className="text-[10px] text-slate-500">
                양우내안愛 · 성실시공 책임시공
              </span>
            </div>
          </div>

          {/* Role Navigation Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
            <button
              onClick={() => setActiveRole('WORKER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeRole === 'WORKER'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>근로자 모바일 뷰</span>
            </button>

            <button
              onClick={() => setActiveRole('MANAGER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeRole === 'MANAGER'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>부서장/소장 결재함</span>
            </button>

            <button
              onClick={() => setActiveRole('HR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeRole === 'HR'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>인사총무 관리 콘솔</span>
            </button>
          </div>

          {/* Action Buttons: Diff Modal & System Settings */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDiffModalOpen(true)}
              className="px-3 py-1.5 bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden md:inline">2026 원본 vs 2027 개정</span>
              <span className="md:hidden">서식비교</span>
            </button>

            <button
              onClick={() => setIsAdminSettingsOpen(true)}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="시스템 설정 & 10대 시나리오 검증"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Realtime KST & Legal Safety Status Bar */}
        <div className="bg-slate-900 text-slate-300 px-4 py-1.5 text-[11px] flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 font-mono">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold font-sans">
              <ShieldCheck className="w-3.5 h-3.5" /> 근로기준법 제61조 제1항 적합
            </span>
            <span className="text-slate-600">|</span>
            <span>한국표준시(KST): {getKSTNow().kstString}</span>
          </div>

          <div className="flex items-center gap-3 font-sans">
            <span className="text-slate-400">기준 운영연도: <strong className="text-white">{operatingYear}년</strong></span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-300 text-[10px]">※ 2차 촉진 배제 및 권리포기 무강제 보장</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6">
        {activeRole === 'WORKER' && (
          <div className="space-y-4">
            {/* View Mode Switcher for Worker Mobile Testing */}
            <div className="max-w-3xl mx-auto flex justify-end gap-2 text-[11px] font-semibold text-slate-600">
              <button
                onClick={() => setViewMode('RESPONSIVE')}
                className={`px-2.5 py-1 rounded-md ${viewMode === 'RESPONSIVE' ? 'bg-slate-800 text-white' : 'bg-slate-200'}`}
              >
                전체화면 반응형
              </button>
              <button
                onClick={() => setViewMode('MOBILE_FRAME')}
                className={`px-2.5 py-1 rounded-md ${viewMode === 'MOBILE_FRAME' ? 'bg-slate-800 text-white' : 'bg-slate-200'}`}
              >
                스마트폰 모바일 프레임 보기
              </button>
            </div>

            {viewMode === 'MOBILE_FRAME' ? (
              <div className="max-w-[420px] mx-auto bg-slate-900 p-3 rounded-[40px] shadow-2xl border-4 border-slate-700">
                <div className="bg-white rounded-[32px] overflow-hidden min-h-[780px] p-2">
                  <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto my-1" />
                  <div className="p-2">
                    <WorkerPortal
                      currentEmployee={currentWorker}
                      allEmployees={employees}
                      notice={notices[currentWorker.id] || {
                        id: `NOT-${operatingYear}-07-${currentWorker.id.slice(-3)}`,
                        employeeId: currentWorker.id,
                        year: operatingYear,
                        issueDate: `${operatingYear}. 07. 01.`,
                        calculationBaseDate: `${operatingYear}-06-30`,
                        totalGranted: currentWorker.totalGranted,
                        usedDays: currentWorker.usedDays,
                        remainingDays: currentWorker.remainingDays,
                        statutoryReplyDeadline: `${operatingYear}-07-20`,
                        sealApplied: true,
                        sealDetails: { sealName: '양우종합건설(주)인', appliedAt: getKSTNow().kstString, hash: 'init' },
                        docHash: 'init'
                      }}
                      receipt={receipts[currentWorker.id]}
                      plan={plans[currentWorker.id]}
                      onSelectEmployee={(emp) => setSelectedWorkerId(emp.id)}
                      onRecordView={handleRecordView}
                      onSaveReceipt={handleSaveReceipt}
                      onSubmitPlan={handleSubmitPlan}
                      onSendToHrEmail={handleSendToHrEmail}
                      customSealUrl={customSealUrl}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <WorkerPortal
                currentEmployee={currentWorker}
                allEmployees={employees}
                notice={notices[currentWorker.id] || {
                  id: `NOT-${operatingYear}-07-${currentWorker.id.slice(-3)}`,
                  employeeId: currentWorker.id,
                  year: operatingYear,
                  issueDate: `${operatingYear}. 07. 01.`,
                  calculationBaseDate: `${operatingYear}-06-30`,
                  totalGranted: currentWorker.totalGranted,
                  usedDays: currentWorker.usedDays,
                  remainingDays: currentWorker.remainingDays,
                  statutoryReplyDeadline: `${operatingYear}-07-20`,
                  sealApplied: true,
                  sealDetails: { sealName: '양우종합건설(주)인', appliedAt: getKSTNow().kstString, hash: 'init' },
                  docHash: 'init'
                }}
                receipt={receipts[currentWorker.id]}
                plan={plans[currentWorker.id]}
                onSelectEmployee={(emp) => setSelectedWorkerId(emp.id)}
                onRecordView={handleRecordView}
                onSaveReceipt={handleSaveReceipt}
                onSubmitPlan={handleSubmitPlan}
                onSendToHrEmail={handleSendToHrEmail}
                customSealUrl={customSealUrl}
              />
            )}
          </div>
        )}

        {activeRole === 'MANAGER' && (
          <ManagerPortal
            currentManager={currentManager}
            allManagers={employees.filter(e => e.position.includes('본부장') || e.position.includes('부장') || e.position.includes('소장'))}
            onSelectManager={(mgr) => setSelectedManagerId(mgr.id)}
            plans={Object.values(plans)}
            employees={employees}
            onApprovePlan={handleApprovePlan}
            onRejectPlan={handleRejectPlan}
          />
        )}

        {activeRole === 'HR' && (
          <HrDashboard
            currentYear={operatingYear}
            onYearChange={(year) => setOperatingYear(year)}
            employees={employees}
            notices={notices}
            receipts={receipts}
            plans={plans}
            auditLogs={auditLogs}
            announcement={announcement}
            onUpdateAnnouncement={(newAnn) => setAnnouncement(newAnn)}
            onAddEmployee={(newEmp) => setEmployees(prev => [...prev, newEmp])}
            onBatchIssueNotices={handleBatchIssueNotices}
            onHrReceivePlan={handleHrReceivePlan}
            onSendHrEmail={handleSendToHrEmail}
            customSealUrl={customSealUrl}
            onOpenDiffModal={() => setIsDiffModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 print:hidden">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span>양우종합건설 주식회사 · 인사총무팀</span>
          <span>·</span>
          <span>대표 수신: tecs_hr@ywconst.com</span>
          <span>·</span>
          <span>내선: 2461</span>
          <span>·</span>
          <span>근로기준법 제61조 연차유급휴가 사용촉진 준수 시스템</span>
        </div>
      </footer>

      {/* Modals */}
      <DocumentDiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
      />

      <AdminSettingsModal
        isOpen={isAdminSettingsOpen}
        onClose={() => setIsAdminSettingsOpen(false)}
        customSealUrl={customSealUrl}
        onUpdateSealUrl={setCustomSealUrl}
        sealConfig={sealConfig}
        onUpdateSealConfig={setSealConfig}
      />
    </div>
  );
}
