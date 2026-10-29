import React, { useState } from 'react';
import { Employee, NoticeDocument, ReceiptConfirmation, LeavePlan, LeavePlanItem } from '../../types';
import { A4NoticeDocument } from '../documents/A4NoticeDocument';
import { A4ReceiptConfirmation } from '../documents/A4ReceiptConfirmation';
import { A4LeavePlanDocument } from '../documents/A4LeavePlanDocument';
import { SignatureCanvas } from '../SignatureCanvas';
import { getKSTNow, calculateEffectiveLeaveDays } from '../../utils/dateUtils';
import { computeSHA256 } from '../../utils/crypto';
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Plus,
  Trash2,
  Send,
  FileDown,
  Mail,
  AlertCircle,
  Eye,
  FileCheck,
  ChevronRight,
  Printer,
  Info
} from 'lucide-react';

interface WorkerPortalProps {
  currentEmployee: Employee;
  allEmployees: Employee[];
  notice: NoticeDocument;
  receipt?: ReceiptConfirmation;
  plan?: LeavePlan;
  onSelectEmployee: (emp: Employee) => void;
  onRecordView: (empId: string) => void;
  onSaveReceipt: (receipt: ReceiptConfirmation) => void;
  onSubmitPlan: (plan: LeavePlan) => void;
  onSendToHrEmail: (planId: string) => void;
  customSealUrl?: string | null;
}

export const WorkerPortal: React.FC<WorkerPortalProps> = ({
  currentEmployee,
  allEmployees,
  notice,
  receipt,
  plan,
  onSelectEmployee,
  onRecordView,
  onSaveReceipt,
  onSubmitPlan,
  onSendToHrEmail,
  customSealUrl,
}) => {
  // Step state: 1 (Auth) -> 2 (Notice View) -> 3 (Sign Receipt) -> 4 (Leave Plan) -> 5 (Status & Email)
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (plan?.status === 'APPROVED' || plan?.emailStatus === 'SENT') return 5;
    if (plan?.status === 'SUBMITTED') return 5;
    if (receipt) return 4;
    return 1;
  });

  // Authentication State
  const [authEmpId, setAuthEmpId] = useState(currentEmployee.id);
  const [authPhone, setAuthPhone] = useState(currentEmployee.phone);
  const [authOtp, setAuthOtp] = useState('123456');
  const [otpSent, setOtpSent] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);
  const [authError, setAuthError] = useState('');

  // Signature state
  const [signatureData, setSignatureData] = useState<string>('');
  const [receiptAgreed, setReceiptAgreed] = useState(false);

  // Leave Plan Editor State
  const [planItems, setPlanItems] = useState<LeavePlanItem[]>(() => {
    if (plan && plan.items.length > 0) return plan.items;
    return [
      {
        id: 'item-1',
        startDate: `${currentEmployee.year}-08-02`,
        endDate: `${currentEmployee.year}-08-06`,
        slot: 'ALL',
        days: 5.0,
        note: '하계휴가 및 연차촉진'
      },
      {
        id: 'item-2',
        startDate: `${currentEmployee.year}-09-13`,
        endDate: `${currentEmployee.year}-09-17`,
        slot: 'ALL',
        days: 5.0,
        note: '추석 전후 연차촉진'
      },
      {
        id: 'item-3',
        startDate: `${currentEmployee.year}-10-22`,
        endDate: `${currentEmployee.year}-10-22`,
        slot: 'PM',
        days: 0.5,
        note: '오후반차 (가족행사)'
      }
    ];
  });

  const [newItemStart, setNewItemStart] = useState(`${currentEmployee.year}-11-01`);
  const [newItemEnd, setNewItemEnd] = useState(`${currentEmployee.year}-11-01`);
  const [newItemSlot, setNewItemSlot] = useState<'ALL' | 'AM' | 'PM'>('ALL');
  const [newItemNote, setNewItemNote] = useState('연차촉진');

  const [printDocumentType, setPrintDocumentType] = useState<'NONE' | 'NOTICE' | 'RECEIPT' | 'PLAN'>('NONE');

  // Calculate planned sum
  const totalPlannedDays = planItems.reduce((acc, curr) => acc + curr.days, 0);
  const remainingUnplannedDays = Math.max(0, currentEmployee.remainingDays - totalPlannedDays);

  const handleSendOtp = () => {
    setOtpSent(true);
    setAuthError('');
  };

  const handleVerifyAuth = () => {
    if (authEmpId !== currentEmployee.id) {
      setAuthError('입력하신 사번과 현재 로그인 정보가 일치하지 않습니다.');
      return;
    }
    if (!authPhone.trim()) {
      setAuthError('휴대폰 번호를 입력해주세요.');
      return;
    }
    if (authOtp !== '123456') {
      setAuthError('인증번호 6자리(테스트 기본값 123456)를 정확히 입력해주세요.');
      return;
    }
    setAuthVerified(true);
    setAuthError('');
    onRecordView(currentEmployee.id);
    setCurrentStep(2);
  };

  const handleAddPlanItem = () => {
    const isSite = currentEmployee.site.includes('현장');
    const days = calculateEffectiveLeaveDays(newItemStart, newItemEnd, newItemSlot, isSite);
    
    // Check duplication
    const isDuplicate = planItems.some(
      item => item.startDate === newItemStart && item.endDate === newItemEnd && item.slot === newItemSlot
    );
    if (isDuplicate) {
      alert('이미 동일한 일정이 등록되어 있습니다.');
      return;
    }

    if (totalPlannedDays + days > currentEmployee.remainingDays) {
      alert(`미사용 잔여 연차(${currentEmployee.remainingDays}일)를 초과할 수 없습니다.`);
      return;
    }

    const newItem: LeavePlanItem = {
      id: `item-${Date.now()}`,
      startDate: newItemStart,
      endDate: newItemEnd,
      slot: newItemSlot,
      days,
      note: newItemNote
    };

    setPlanItems([...planItems, newItem]);
  };

  const handleRemovePlanItem = (id: string) => {
    setPlanItems(planItems.filter(item => item.id !== id));
  };

  const handleCompleteReceipt = async () => {
    if (!signatureData) {
      alert('자필 서명을 입력해주세요.');
      return;
    }
    if (!receiptAgreed) {
      alert('수령 확인 문구 및 개인정보 확인 체크박스에 동의해주세요.');
      return;
    }

    const { kstString } = getKSTNow();
    const hashPayload = {
      noticeId: notice.id,
      employeeId: currentEmployee.id,
      signedAt: kstString,
      statement: '수령 확인 완료'
    };
    const docHash = await computeSHA256(hashPayload);

    const newReceipt: ReceiptConfirmation = {
      id: `RCP-${currentEmployee.year}-${currentEmployee.id.slice(-4)}`,
      noticeId: notice.id,
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      department: currentEmployee.department,
      site: currentEmployee.site,
      signedAt: kstString,
      signatureDataUrl: signatureData,
      confirmationText: `본인은 문서번호 ${notice.id}의 ${notice.year}년도 연차휴가 사용촉진 통지서와 표시된 연차내역(${notice.remainingDays}일)을 수령·확인하였습니다. 이 확인은 문서 수령 사실에 관한 것이며 법정 권리의 포기를 의미하지 않습니다.`,
      authMethod: 'MOBILE_OTP',
      authLevel: '휴대폰 점유확인 (Level 1 OTP)',
      docHash
    };

    onSaveReceipt(newReceipt);
    setCurrentStep(4); // Move to Leave Planning
  };

  const handleSubmitLeavePlan = async () => {
    if (planItems.length === 0) {
      alert('최소 1개 이상의 휴가 사용계획을 등록해주세요.');
      return;
    }

    const { kstString } = getKSTNow();
    const hash = await computeSHA256({
      employeeId: currentEmployee.id,
      items: planItems,
      submittedAt: kstString
    });

    const newPlan: LeavePlan = {
      id: plan?.id || `PLN-${currentEmployee.year}-${currentEmployee.id.slice(-4)}`,
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      department: currentEmployee.department,
      position: currentEmployee.position,
      year: currentEmployee.year,
      version: (plan?.version || 0) + 1,
      items: planItems,
      totalPlannedDays,
      remainingUnplannedDays,
      firstSubmittedAt: plan?.firstSubmittedAt || kstString, // KEEP ORIGINAL IF EXISTS
      lastSubmittedAt: kstString,
      statementText: '본인은 위와 같이 연차휴가 사용시기를 정하여 통보합니다. 사용계획 변경이 필요한 경우 회사의 신청·협의 절차에 따라 처리하겠습니다.',
      status: 'SUBMITTED',
      managerId: currentEmployee.managerId,
      managerName: currentEmployee.managerName || '소속부서장',
      approvalStep: 'TEAM_HEAD',
      docHash: hash
    };

    onSubmitPlan(newPlan);
    setCurrentStep(5);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Employee Quick Switcher (For Demo & Multi-persona testing) */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Smartphone className="w-4 h-4 text-sky-600" />
          모바일 근로자 시뮬레이터 :
        </div>
        <div className="flex items-center gap-2">
          <select
            value={currentEmployee.id}
            onChange={(e) => {
              const emp = allEmployees.find(x => x.id === e.target.value);
              if (emp) onSelectEmployee(emp);
            }}
            className="border border-slate-300 rounded-lg px-2.5 py-1 font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {allEmployees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.position} / {emp.department}) - 잔여 {emp.remainingDays}일
              </option>
            ))}
          </select>
          <span className="text-slate-400">|</span>
          <span className="font-mono text-slate-600">사번: {currentEmployee.id}</span>
        </div>
      </div>

      {/* Progress Steps Indicator */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
          <button
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-1.5 ${currentStep === 1 ? 'text-blue-600 font-bold' : ''}`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              authVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
            }`}>1</span>
            본인인증
          </button>
          <ChevronRight className="w-4 h-4 text-slate-300" />

          <button
            onClick={() => authVerified && setCurrentStep(2)}
            disabled={!authVerified}
            className={`flex items-center gap-1.5 ${currentStep === 2 ? 'text-blue-600 font-bold' : ''} disabled:opacity-40`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              receipt ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
            }`}>2</span>
            통지서 열람
          </button>
          <ChevronRight className="w-4 h-4 text-slate-300" />

          <button
            onClick={() => authVerified && setCurrentStep(3)}
            disabled={!authVerified}
            className={`flex items-center gap-1.5 ${currentStep === 3 ? 'text-blue-600 font-bold' : ''} disabled:opacity-40`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              receipt ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
            }`}>3</span>
            수령확인 서명
          </button>
          <ChevronRight className="w-4 h-4 text-slate-300" />

          <button
            onClick={() => receipt && setCurrentStep(4)}
            disabled={!receipt}
            className={`flex items-center gap-1.5 ${currentStep === 4 ? 'text-blue-600 font-bold' : ''} disabled:opacity-40`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              plan ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
            }`}>4</span>
            사용계획 작성
          </button>
          <ChevronRight className="w-4 h-4 text-slate-300" />

          <button
            onClick={() => plan && setCurrentStep(5)}
            disabled={!plan}
            className={`flex items-center gap-1.5 ${currentStep === 5 ? 'text-blue-600 font-bold' : ''} disabled:opacity-40`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              plan?.emailStatus === 'SENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
            }`}>5</span>
            결재 & 제출
          </button>
        </div>
      </div>

      {/* STEP 1: Authentication */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">양우종합건설 본인확인</h2>
            <p className="text-xs text-slate-500">
              안전한 개인정보 보호와 법적 증거보존을 위해 등록된 사번 및 휴대폰으로 본인인증을 진행합니다.
            </p>
          </div>

          <div className="space-y-4 max-w-md mx-auto">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">성명 및 소속</label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800">
                {currentEmployee.name} ({currentEmployee.position}) · {currentEmployee.department}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">사번 (Employee ID)</label>
              <input
                type="text"
                value={authEmpId}
                onChange={(e) => setAuthEmpId(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="YWxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">등록 휴대폰 번호</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  className="flex-1 p-3 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="010-XXXX-XXXX"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl whitespace-nowrap transition-colors"
                >
                  {otpSent ? '재전송' : '인증번호 발송'}
                </button>
              </div>
            </div>

            {otpSent && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  인증번호 6자리 (테스트용 기본값: 123456)
                </label>
                <input
                  type="text"
                  value={authOtp}
                  onChange={(e) => setAuthOtp(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm font-mono tracking-widest text-center font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="123456"
                />
                <div className="text-[11px] text-emerald-600 flex items-center gap-1 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 테스트 번호 [123456]가 자동 수신되었습니다.
                </div>
              </div>
            )}

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleVerifyAuth}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                본인인증 완료 및 통지서 열람하기
              </button>
            </div>

            <div className="text-[11px] text-slate-400 text-center leading-relaxed">
              ※ 본 인증은 휴대폰 점유확인 절차이며 전자서명법에 따른 증빙로그로 기록됩니다.
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Notice Document View */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-700" />
              <span>
                <strong>{currentEmployee.name}</strong> 님 앞 연차휴가 사용촉진 통지서가 정상 열람되었습니다.
              </span>
            </div>
            <span className="font-mono text-slate-600 text-[11px]">
              수령기한: {notice.statutoryReplyDeadline} (10일 이내)
            </span>
          </div>

          {/* Render A4 Notice */}
          <div className="bg-slate-200 p-2 md:p-6 rounded-2xl overflow-x-auto">
            <A4NoticeDocument
              employee={currentEmployee}
              notice={notice}
              customSealUrl={customSealUrl}
            />
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500">
              통지서 내용을 확인하셨으면 수령 확인증에 전자서명을 진행해주세요.
            </div>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              수령 확인증 서명하러 가기
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Sign Receipt Confirmation */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              연차휴가 사용촉진 통지서 수령 확인증 서명
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              개인정보보호를 위해 개별 전자문서로 서명하며, 법정 권리포기를 강제하지 않습니다.
            </p>
          </div>

          {/* Receipt Statement Notice */}
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-2 text-sm leading-relaxed text-slate-800">
            <div className="font-bold text-slate-950 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              수령 확인 문구
            </div>
            <p className="indent-1 text-justify">
              "본인은 문서번호 <strong>{notice.id}</strong>의 {notice.year}년도 연차휴가 사용촉진 통지서와
              표시된 연차내역(미사용 잔여 {notice.remainingDays}일)을 수령·확인하였습니다.
              <span className="font-bold text-blue-900"> 이 확인은 문서 수령 사실에 관한 것이며 법정 권리의 포기를 의미하지 않습니다.</span>"
            </p>
          </div>

          {/* Touch Canvas */}
          <div className="space-y-3">
            <SignatureCanvas
              employeeName={currentEmployee.name}
              initialSignature={receipt?.signatureDataUrl}
              onSignatureComplete={(dataUrl) => setSignatureData(dataUrl)}
              onClear={() => setSignatureData('')}
            />

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={receiptAgreed}
                onChange={(e) => setReceiptAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700 leading-relaxed font-medium">
                본인은 위 문서를 열람하고 사실대로 수령하였음을 확인하며, 입력한 전자서명이 본인의 진정한 의사에 의한 자필 서명임을 인정합니다.
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold"
            >
              ← 이전 (통지서 다시보기)
            </button>
            <button
              onClick={handleCompleteReceipt}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              서명 완료하고 연차 사용계획 작성하기
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Vacation Plan Editor */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-600" />
                {currentEmployee.year}년 연차휴가 사용계획서 작성
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                건설현장 및 본사 근무일정에 맞추어 미사용 잔여 연차 일수를 분할/전일 지정합니다.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="bg-slate-100 px-3 py-1.5 rounded-lg">
                발생: <span className="font-bold">{currentEmployee.totalGranted}일</span>
              </div>
              <div className="bg-slate-100 px-3 py-1.5 rounded-lg">
                기사용: <span className="font-bold">{currentEmployee.usedDays}일</span>
              </div>
              <div className="bg-blue-50 text-blue-900 px-3 py-1.5 rounded-lg border border-blue-200">
                미사용 잔여: <span className="font-extrabold text-blue-700">{currentEmployee.remainingDays}일</span>
              </div>
            </div>
          </div>

          {/* Progress balance bar */}
          <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700">연차 사용계획 배분 현황</span>
              <span>
                계획 {totalPlannedDays.toFixed(1)}일 / 잔여 미계획 {remainingUnplannedDays.toFixed(1)}일
              </span>
            </div>
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (totalPlannedDays / currentEmployee.remainingDays) * 100)}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500">
              {remainingUnplannedDays === 0 ? (
                <span className="text-emerald-700 font-semibold">✓ 미사용 잔여 연차 전액에 대한 계획이 모두 수립되었습니다.</span>
              ) : (
                <span className="text-amber-700">※ 가급적 잔여 연차 전부에 대해 계획을 수립하시길 권장합니다. (부분 제출 시에도 기록 보존)</span>
              )}
            </div>
          </div>

          {/* Add schedule item widget */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              휴가 일정 추가하기
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">시작일</label>
                <input
                  type="date"
                  value={newItemStart}
                  min={`${currentEmployee.year}-07-01`}
                  max={`${currentEmployee.year}-12-31`}
                  onChange={(e) => {
                    setNewItemStart(e.target.value);
                    if (e.target.value > newItemEnd) setNewItemEnd(e.target.value);
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">종료일</label>
                <input
                  type="date"
                  value={newItemEnd}
                  min={newItemStart}
                  max={`${currentEmployee.year}-12-31`}
                  onChange={(e) => setNewItemEnd(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">단위 (반차 지원)</label>
                <select
                  value={newItemSlot}
                  onChange={(e) => setNewItemSlot(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold"
                >
                  <option value="ALL">전일 (1.0일)</option>
                  <option value="AM">오전반차 (0.5일)</option>
                  <option value="PM">오후반차 (0.5일)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">구분 / 비고</label>
                <input
                  type="text"
                  value={newItemNote}
                  onChange={(e) => setNewItemNote(e.target.value)}
                  placeholder="예: 연차촉진, 하계휴가"
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddPlanItem}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                일정에 추가
              </button>
            </div>
          </div>

          {/* Current Planned List */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700">작성된 휴가 일정 목록 ({planItems.length}건)</div>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
              {planItems.map((item, idx) => (
                <div key={item.id} className="p-3 bg-white flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900">
                        {item.startDate} ~ {item.endDate}
                        <span className="ml-2 font-bold text-blue-700 font-mono">
                          {item.days}일 ({item.slot === 'AM' ? '오전반차' : item.slot === 'PM' ? '오후반차' : '전일'})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">{item.note}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemovePlanItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="일정 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation text */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed text-slate-700">
            <span className="font-bold text-slate-900">통보 확인 문구: </span>
            "본인은 위와 같이 연차휴가 사용시기를 정하여 통보합니다. 사용계획 변경이 필요한 경우 회사의 신청·협의 절차에 따라 처리하겠습니다."
          </div>

          {/* Submission Button */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold"
            >
              ← 이전 (확인증 서명)
            </button>
            <button
              onClick={handleSubmitLeavePlan}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              사용시기 통보 및 부서장 결재 요청
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Status Tracking, Manager Approval & Final HR Email Submission */}
      {currentStep === 5 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-start justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                사용계획 통보 및 결재 진행 상태
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                기한 내 최초 제출 시각이 스냅샷으로 안전하게 고정 보존됩니다.
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-500">결재 상태: </span>
              <span className={`font-bold px-2.5 py-1 rounded-full ${
                plan?.status === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : plan?.status === 'REJECTED'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {plan?.status === 'APPROVED' ? '부서장 승인완료' : plan?.status === 'REJECTED' ? '반려됨' : '부서장 결재 대기중'}
              </span>
            </div>
          </div>

          {/* Submission Evidence Snapshots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-slate-500">근로자 최초 계획 통보 시각</div>
              <div className="font-mono font-bold text-slate-900 text-sm">
                {plan?.firstSubmittedAt || '-'}
              </div>
              <div className="text-[10px] text-emerald-700">
                ※ 부서장 결재 지연과 무관하게 법적 최초 회신시각으로 보호됨
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-slate-500">결재권자 (부서장/현장소장)</div>
              <div className="font-bold text-slate-900 text-sm">
                {currentEmployee.managerName || '소속 부서장'} (사번: {currentEmployee.managerId})
              </div>
              <div className="text-[10px] text-slate-500">
                {plan?.approvedAt ? `승인 완료: ${plan.approvedAt}` : '결재 승인 대기중'}
              </div>
            </div>
          </div>

          {/* Action 1: If Manager Approved -> Send to HR Email */}
          <div className="p-5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-sm text-slate-900">
                  인사총무팀 최종 이메일 제출 ({plan?.emailRecipient || 'tecs_hr@ywconst.com'})
                </span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                plan?.emailStatus === 'SENT'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {plan?.emailStatus === 'SENT' ? '발송 완료' : '미제출'}
              </span>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed">
              부서장 결재가 완료된 후 '인사총무팀에 서류 보내기' 버튼을 누르면
              서명된 수령 확인증과 결재 완료된 사용계획서 PDF가 인사총무팀 대표 메일로 전송 접수됩니다.
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => plan && onSendToHrEmail(plan.id)}
                disabled={plan?.status !== 'APPROVED' || plan?.emailStatus === 'SENT'}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {plan?.emailStatus === 'SENT' ? '인사총무팀 제출 완료' : '인사총무팀에 서류 보내기'}
              </button>

              {plan?.status !== 'APPROVED' && (
                <span className="text-xs text-amber-700">
                  (※ 상단 부서장/소장의 결재 승인 후 전송 가능합니다)
                </span>
              )}
            </div>

            {plan?.emailSentAt && (
              <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                ✓ 발송 성공 기록: {plan.emailSentAt} (제출 제목: [연차사용계획 제출] {plan.year} {plan.department} {plan.employeeName} {plan.employeeId})
              </div>
            )}
          </div>

          {/* Action 2: Document Inspection & Printing / PDF Export */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-700">작성 완료된 법정 문서 및 증빙 확인</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setPrintDocumentType('NOTICE')}
                className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-left transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">1. 촉진 통지서</div>
                  <div className="text-[10px] text-slate-500">인감 날인본</div>
                </div>
                <Printer className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setPrintDocumentType('RECEIPT')}
                className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-left transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">2. 수령 확인증</div>
                  <div className="text-[10px] text-slate-500">자필 전자서명본</div>
                </div>
                <Printer className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setPrintDocumentType('PLAN')}
                className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-left transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">3. 사용계획서</div>
                  <div className="text-[10px] text-slate-500">결재 상태 포함</div>
                </div>
                <Printer className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Modal for Document View / Print */}
          {printDocumentType !== 'NONE' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
              <div className="bg-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
                <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">
                    A4 문서 미리보기 및 인쇄 / PDF 저장
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" /> 인쇄 / PDF 다운로드
                    </button>
                    <button
                      onClick={() => setPrintDocumentType('NONE')}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold"
                    >
                      닫기
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto">
                  {printDocumentType === 'NOTICE' && (
                    <A4NoticeDocument employee={currentEmployee} notice={notice} customSealUrl={customSealUrl} />
                  )}
                  {printDocumentType === 'RECEIPT' && receipt && (
                    <A4ReceiptConfirmation employee={currentEmployee} receipt={receipt} noticeIssueDate={notice.issueDate} />
                  )}
                  {printDocumentType === 'PLAN' && plan && (
                    <A4LeavePlanDocument plan={plan} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
