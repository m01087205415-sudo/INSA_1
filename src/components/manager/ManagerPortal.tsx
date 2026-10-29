import React, { useState } from 'react';
import { Employee, LeavePlan } from '../../types';
import { A4LeavePlanDocument } from '../documents/A4LeavePlanDocument';
import { getKSTNow } from '../../utils/dateUtils';
import {
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  ShieldCheck,
  Calendar,
  Eye,
  Building2,
  AlertCircle
} from 'lucide-react';

interface ManagerPortalProps {
  currentManager: Employee;
  allManagers: Employee[];
  onSelectManager: (mgr: Employee) => void;
  plans: LeavePlan[];
  employees: Employee[];
  onApprovePlan: (planId: string, managerName: string, isDelegated?: boolean, delegatorNote?: string) => void;
  onRejectPlan: (planId: string, reason: string) => void;
}

export const ManagerPortal: React.FC<ManagerPortalProps> = ({
  currentManager,
  allManagers,
  onSelectManager,
  plans,
  employees,
  onApprovePlan,
  onRejectPlan,
}) => {
  // Filter plans assigned to this manager (or let manager switch)
  const managerPlans = plans.filter(p => {
    const emp = employees.find(e => e.id === p.employeeId);
    return emp?.managerId === currentManager.id || p.managerId === currentManager.id;
  });

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(managerPlans[0]?.id || null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDelegated, setIsDelegated] = useState(false);
  const [delegatorNote, setDelegatorNote] = useState('현장 소장 부재로 인한 차상위 관리자 대결');
  const [previewPlan, setPreviewPlan] = useState<LeavePlan | null>(null);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || managerPlans[0];
  const targetEmployee = employees.find(e => e.id === selectedPlan?.employeeId);

  const handleApprove = () => {
    if (!selectedPlan) return;
    onApprovePlan(
      selectedPlan.id,
      currentManager.name,
      isDelegated,
      isDelegated ? delegatorNote : undefined
    );
  };

  const handleRejectConfirm = () => {
    if (!selectedPlan || !rejectReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }
    onRejectPlan(selectedPlan.id, rejectReason);
    setIsRejectModalOpen(false);
    setRejectReason('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Manager Selector / Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-slate-800 text-sm">부서장 / 현장소장 결재 포털</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">현재 결재권자:</span>
          <select
            value={currentManager.id}
            onChange={(e) => {
              const mgr = allManagers.find(m => m.id === e.target.value);
              if (mgr) onSelectManager(mgr);
            }}
            className="border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-900 bg-slate-50 focus:ring-2 focus:ring-blue-500"
          >
            {allManagers.map(mgr => (
              <option key={mgr.id} value={mgr.id}>
                {mgr.name} ({mgr.position} / {mgr.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Pending List (Left) & Detailed Review (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Pending Plans List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span className="font-bold text-sm text-slate-900">소속 임직원 계획서 목록</span>
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
              총 {managerPlans.length}건
            </span>
          </div>

          {managerPlans.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              배정된 결재 대상 연차계획서가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {managerPlans.map(p => {
                const isSelected = p.id === (selectedPlan?.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">
                        {p.employeeName} ({p.position})
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status === 'APPROVED' ? '승인완료' : p.status === 'REJECTED' ? '반려' : '결재대기'}
                      </span>
                    </div>

                    <div className="text-slate-500 text-[11px] flex justify-between">
                      <span>{p.department}</span>
                      <span className="font-mono font-semibold text-slate-700">계획: {p.totalPlannedDays}일</span>
                    </div>

                    <div className="mt-1.5 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                      <span>통보시각: {p.firstSubmittedAt.split(' ')[0]}</span>
                      <span>v{p.version}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Detailed Approval & Conflict Inspector */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          {!selectedPlan ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              왼쪽에서 검토할 결재 건을 선택해주세요.
            </div>
          ) : (
            <>
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedPlan.employeeName} 님의 {selectedPlan.year}년 연차사용계획서 결재 검토
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    소속: {selectedPlan.department} | 사번: {selectedPlan.employeeId} | 직급: {selectedPlan.position}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewPlan(selectedPlan)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4 text-slate-500" />
                  A4 서식 미리보기
                </button>
              </div>

              {/* Status Alert */}
              {selectedPlan.status === 'APPROVED' && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    <strong>승인 완료 건:</strong> {selectedPlan.approvedAt} 에 {selectedPlan.managerName} 님이 결재를 완료하였습니다.
                    {selectedPlan.isDelegated && ` (대결: ${selectedPlan.delegatorNote})`}
                  </span>
                </div>
              )}

              {selectedPlan.status === 'REJECTED' && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 font-medium">
                  <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>
                    <strong>반려 처리됨:</strong> 반려 사유: {selectedPlan.rejectReason}
                  </span>
                </div>
              )}

              {/* Schedule List Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    신청된 휴가 사용 일정 ({selectedPlan.items.length}구간)
                  </span>
                  <span className="text-slate-500">
                    총 신청일수: <strong className="text-blue-700 text-sm font-mono">{selectedPlan.totalPlannedDays}일</strong>
                    {targetEmployee && ` (잔여연차: ${targetEmployee.remainingDays}일)`}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
                  {selectedPlan.items.map((item, idx) => (
                    <div key={item.id} className="p-3 bg-white flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[11px]">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-semibold text-slate-900 font-mono text-xs">
                            {item.startDate} ~ {item.endDate}
                          </span>
                          <span className="ml-2 font-bold text-blue-700">
                            {item.days}일 ({item.slot === 'AM' ? '오전반차' : item.slot === 'PM' ? '오후반차' : '전일'})
                          </span>
                        </div>
                      </div>
                      <div className="text-slate-500 text-xs">{item.note}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Construction Site Schedule Conflict Verification Notice */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  현장 공정 및 주휴일/휴무일 점검 결과
                </div>
                <div className="text-[11px] text-slate-600">
                  • 주휴일(일요일) 및 현장 휴무일이 정확히 제외되어 실차감 일수가 계산되었습니다.
                  <br />
                  • 동료 팀원과의 공정 겹침 여부를 확인하신 후 승인을 진행하시기 바랍니다.
                </div>
              </div>

              {/* Delegation / Proxy Approval Support */}
              <div className="p-3.5 border border-slate-200 rounded-xl bg-amber-50/30 text-xs space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={isDelegated}
                    onChange={(e) => setIsDelegated(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                  />
                  <span>부서장 부재 또는 권한 위임에 따른 대결(위임 결재) 처리</span>
                </label>

                {isDelegated && (
                  <div className="pl-6 space-y-1">
                    <label className="block text-[11px] text-slate-600">위임 근거 및 대결 사유</label>
                    <input
                      type="text"
                      value={delegatorNote}
                      onChange={(e) => setDelegatorNote(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs"
                      placeholder="예: 현장 출장으로 인한 직무대리 결재"
                    />
                  </div>
                )}
              </div>

              {/* Approval Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  disabled={selectedPlan.status === 'REJECTED'}
                  className="px-4 py-2.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors disabled:opacity-40"
                >
                  반려 (사유 입력)
                </button>

                <button
                  onClick={handleApprove}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {selectedPlan.status === 'APPROVED' ? '승인 정보 업데이트' : '사용계획 승인 결재'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              연차사용계획 반려 사유 입력
            </h3>
            <p className="text-xs text-slate-500">
              반려 사유는 근로자 화면에 투명하게 표시되며, 근로자는 일정을 수정하여 재제출할 수 있습니다.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="예: 8월 둘째주 세종현장 타설 일정 집중으로 해당 일자 조정 요망"
              className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50"
              >
                취소
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
              >
                반려 확정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A4 Preview Modal */}
      {previewPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-100 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900">사용계획서 A4 서식 검토</span>
              <button
                onClick={() => setPreviewPlan(null)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold"
              >
                닫기
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <A4LeavePlanDocument plan={previewPlan} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
