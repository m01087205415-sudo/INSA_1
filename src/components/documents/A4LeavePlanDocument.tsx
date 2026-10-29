import React from 'react';
import { LeavePlan } from '../../types';
import { CheckCircle2, Clock } from 'lucide-react';

interface A4LeavePlanDocumentProps {
  plan: LeavePlan;
  className?: string;
  showOriginalWaiverText?: boolean; // For comparison in admin view
}

export const A4LeavePlanDocument: React.FC<A4LeavePlanDocumentProps> = ({
  plan,
  className = '',
  showOriginalWaiverText = false,
}) => {
  return (
    <div
      className={`bg-white text-black p-10 md:p-14 max-w-[800px] mx-auto shadow-xl border border-slate-200 font-sans leading-relaxed relative print:shadow-none print:border-none print:p-0 print:max-w-none print:w-full ${className}`}
      style={{ minHeight: '1100px' }}
    >
      {/* Top Header with Approval Grid */}
      <div className="flex justify-between items-start mb-6">
        <div className="text-xs text-slate-500 font-mono pt-1">
          <div>계획서 번호: {plan.id} (v{plan.version})</div>
          <div>최초 통보시각: {plan.firstSubmittedAt}</div>
        </div>

        {/* Top 5-column Approval Box from Page 4: 신청인 | 팀장/소장 | 본부장 | 부사장 | 대표이사 */}
        <div className="border border-black text-xs">
          <table className="border-collapse text-center">
            <thead>
              <tr className="bg-slate-50 border-b border-black font-semibold text-[11px]">
                <th className="border-r border-black px-2.5 py-1 w-16">신청인</th>
                <th className="border-r border-black px-2.5 py-1 w-16">팀장/소장</th>
                <th className="border-r border-black px-2.5 py-1 w-16">본부장</th>
                <th className="border-r border-black px-2.5 py-1 w-16">부사장</th>
                <th className="px-2.5 py-1 w-16">대표이사</th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-14 text-[11px]">
                <td className="border-r border-black px-1 py-1 align-middle">
                  <div className="font-semibold text-slate-900">{plan.employeeName}</div>
                  <div className="text-[9px] text-emerald-700 font-bold flex items-center justify-center gap-0.5 mt-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> 신청
                  </div>
                </td>
                <td className="border-r border-black px-1 py-1 align-middle">
                  {plan.status === 'APPROVED' ? (
                    <div>
                      <div className="font-semibold text-slate-900">{plan.managerName}</div>
                      <div className="text-[9px] text-blue-700 font-bold flex items-center justify-center gap-0.5 mt-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> 결재완료
                      </div>
                    </div>
                  ) : plan.status === 'REJECTED' ? (
                    <div className="text-[10px] text-rose-600 font-bold">반려</div>
                  ) : (
                    <div className="text-[10px] text-amber-600 font-medium flex items-center justify-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> 결재대기
                    </div>
                  )}
                </td>
                <td className="border-r border-black px-1 py-1 text-slate-300 align-middle">-</td>
                <td className="border-r border-black px-1 py-1 text-slate-300 align-middle">-</td>
                <td className="px-1 py-1 text-slate-300 align-middle">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Title */}
      <div className="text-center my-6">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-widest text-slate-950 font-serif">
          (&nbsp;&nbsp;{plan.year}년&nbsp;&nbsp;)&nbsp;&nbsp;연차휴가 사용계획서
        </h1>
      </div>

      {/* Employee Identification Bar */}
      <div className="border border-black text-sm my-6">
        <div className="grid grid-cols-3 divide-x divide-black">
          <div className="py-2.5 px-4 flex items-center">
            <span className="font-bold w-14">성&nbsp;&nbsp;명 :</span>
            <span className="font-bold text-base">{plan.employeeName}</span>
          </div>
          <div className="py-2.5 px-4 flex items-center">
            <span className="font-bold w-14">직&nbsp;&nbsp;위 :</span>
            <span className="font-medium">{plan.position}</span>
          </div>
          <div className="py-2.5 px-4 flex items-center">
            <span className="font-bold w-14">소&nbsp;&nbsp;속 :</span>
            <span className="font-medium">{plan.department}</span>
          </div>
        </div>
      </div>

      {/* Vacation Plan Schedule Table */}
      <table className="w-full border-collapse border border-black text-xs md:text-sm my-6 text-center">
        <thead>
          <tr className="bg-slate-50 font-bold border-b border-black">
            <th className="border-r border-black py-2.5 px-2 w-14">NO</th>
            <th className="border-r border-black py-2.5 px-4 w-64">휴 가 일 자</th>
            <th className="border-r border-black py-2.5 px-3 w-20">일 수</th>
            <th className="py-2.5 px-4">비&nbsp;&nbsp;&nbsp;&nbsp;고</th>
          </tr>
        </thead>
        <tbody>
          {plan.items.map((item, idx) => (
            <tr key={item.id} className="border-b border-black">
              <td className="border-r border-black py-2.5 px-2 font-mono font-medium">
                {idx + 1}
              </td>
              <td className="border-r border-black py-2.5 px-4 font-mono font-medium text-slate-900">
                {item.startDate.replace(/-/g, '.')} ~ {item.endDate.replace(/-/g, '.')}
              </td>
              <td className="border-r border-black py-2.5 px-3 font-mono font-bold text-slate-900">
                {item.days.toFixed(1)}
              </td>
              <td className="py-2.5 px-4 text-left font-medium text-slate-800">
                {item.note} {item.slot === 'AM' ? '(오전)' : item.slot === 'PM' ? '(오후)' : ''}
              </td>
            </tr>
          ))}

          {/* Padding rows to maintain standard A4 look if items < 8 */}
          {Array.from({ length: Math.max(0, 8 - plan.items.length) }).map((_, padIdx) => (
            <tr key={`pad-${padIdx}`} className="border-b border-black h-8 text-slate-200">
              <td className="border-r border-black">{plan.items.length + padIdx + 1}</td>
              <td className="border-r border-black"></td>
              <td className="border-r border-black"></td>
              <td></td>
            </tr>
          ))}

          {/* Total Sum Row */}
          <tr className="bg-slate-50 font-bold border-t-2 border-black text-sm">
            <td colSpan={2} className="border-r border-black py-3 px-4 text-center tracking-widest">
              합&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;계
            </td>
            <td className="border-r border-black py-3 px-3 font-mono font-extrabold text-blue-900 text-base">
              {plan.totalPlannedDays.toFixed(1)}
            </td>
            <td className="py-3 px-4 text-xs text-slate-500 text-left">
              {plan.remainingUnplannedDays > 0 ? (
                <span className="text-amber-700 font-semibold">
                  (미계획 잔여: {plan.remainingUnplannedDays.toFixed(1)}일)
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold">
                  (미사용 연차 전액 계획 완료)
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Confirmation Statement */}
      <div className="my-10 p-5 rounded-lg border border-slate-300 bg-slate-50 text-sm leading-relaxed text-justify">
        {showOriginalWaiverText ? (
          <div className="space-y-2">
            <div className="text-xs font-bold text-rose-700 bg-rose-100 p-1.5 rounded">
              [경고: 원본의 법정수당 포기 문구 - 근로기준법상 무효 소지 있음]
            </div>
            <p className="line-through text-slate-500">
              "본인은 {plan.year}년도 미사용한 연차에 대하여 상기와 같이 사용할 시기를 지정하였기에 본 계획서를 제출하며,
              지정일에 사용하지 아니한 연차휴가 일수에 대해서는 연차휴가 수당을 지급받지 않는 것에 동의합니다."
            </p>
          </div>
        ) : (
          <div>
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              연차휴가 사용시기 통보 확인
            </div>
            <p className="text-slate-800">
              "{plan.statementText || `본인은 위와 같이 연차휴가 사용시기를 정하여 통보합니다. 사용계획 변경이 필요한 경우 회사의 신청·협의 절차에 따라 처리하겠습니다.`}"
            </p>
          </div>
        )}
      </div>

      {/* Bottom Approval Box: 인사총무 담당 / 검토 / 검토 / 승인 */}
      <div className="flex justify-between items-end mt-12 pt-6 border-t border-slate-300">
        <div className="text-xs text-slate-500 font-mono space-y-1">
          <div>제출 근로자: {plan.employeeName} ({plan.employeeId})</div>
          <div>최종 승인일시: {plan.approvedAt || '진행중'}</div>
          {plan.isDelegated && (
            <div className="text-amber-700 font-bold">
              [대결 승인] 사유: {plan.delegatorNote}
            </div>
          )}
        </div>

        <div className="border border-black text-xs">
          <table className="border-collapse text-center">
            <thead>
              <tr className="bg-slate-50 border-b border-black font-semibold text-[11px]">
                <th rowSpan={2} className="border-r border-black px-1.5 py-1 w-8 writing-mode-vertical">
                  인사총무
                </th>
                <th className="border-r border-black px-3 py-1 w-16">담당</th>
                <th className="border-r border-black px-3 py-1 w-16">검토</th>
                <th className="border-r border-black px-3 py-1 w-16">검토</th>
                <th className="px-3 py-1 w-16">승인</th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-12 text-[11px]">
                <td className="border-r border-black px-1 py-1 align-middle">
                  {plan.hrReceivedAt ? (
                    <div>
                      <div className="font-semibold text-slate-900">{plan.hrReceiverName || '오정환'}</div>
                      <div className="text-[9px] text-emerald-700 font-bold">접수완료</div>
                    </div>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className="border-r border-black px-1 py-1 text-slate-300 align-middle">-</td>
                <td className="border-r border-black px-1 py-1 text-slate-300 align-middle">-</td>
                <td className="px-1 py-1 text-slate-300 align-middle">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
