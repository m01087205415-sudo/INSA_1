import React from 'react';
import { Employee, NoticeDocument } from '../../types';
import { OfficialSeal } from '../OfficialSeal';

interface A4NoticeDocumentProps {
  employee: Employee;
  notice: NoticeDocument;
  customSealUrl?: string | null;
  sealConfig?: {
    size: number;
    rotation: number;
    opacity: number;
  };
  className?: string;
}

export const A4NoticeDocument: React.FC<A4NoticeDocumentProps> = ({
  employee,
  notice,
  customSealUrl,
  sealConfig = { size: 76, rotation: -3, opacity: 0.9 },
  className = '',
}) => {
  return (
    <div
      className={`bg-white text-black p-10 md:p-14 max-w-[800px] mx-auto shadow-xl border border-slate-200 font-sans leading-relaxed relative print:shadow-none print:border-none print:p-0 print:max-w-none print:w-full ${className}`}
      style={{ minHeight: '1100px' }}
    >
      {/* Top Evidence Metadata Header */}
      <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-200 pb-2 mb-8">
        <div>
          문서번호: <span className="font-mono font-semibold text-slate-700">{notice.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>인증발행</span>
          <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded">
            SHA256: {notice.docHash.substring(0, 16)}...
          </span>
        </div>
      </div>

      {/* Main Title */}
      <div className="text-center my-10">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-widest underline underline-offset-8 decoration-2 text-slate-950 font-serif">
          {notice.year}년 연차휴가 사용촉진 통지서
        </h1>
      </div>

      {/* Employee Identification Table (No resident number, identified by 사번 as required) */}
      <table className="w-full border-collapse border border-black text-sm my-8">
        <tbody>
          <tr>
            <th className="border border-black bg-slate-50 py-2.5 px-4 w-28 text-center font-bold">
              소&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;속
            </th>
            <td className="border border-black py-2.5 px-4 text-center font-medium">
              {employee.department} {employee.site && `(${employee.site})`}
            </td>
            <th className="border border-black bg-slate-50 py-2.5 px-4 w-28 text-center font-bold">
              직&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;급
            </th>
            <td className="border border-black py-2.5 px-4 text-center font-medium">
              {employee.position}
            </td>
          </tr>
          <tr>
            <th className="border border-black bg-slate-50 py-2.5 px-4 text-center font-bold">
              성&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;명
            </th>
            <td className="border border-black py-2.5 px-4 text-center font-bold text-base">
              {employee.name}
            </td>
            <th className="border border-black bg-slate-50 py-2.5 px-4 text-center font-bold">
              사&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;번
            </th>
            <td className="border border-black py-2.5 px-4 text-center font-mono font-semibold">
              {employee.id}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Body Notification Paragraph */}
      <div className="text-sm leading-relaxed my-8 indent-2 text-justify">
        {notice.year}년 개인별 미사용 연차휴가 잔여일수 ({notice.calculationBaseDate} 기준)를
        다음과 같이 알려드리오니 참고하신 후 연차휴가 사용계획서를 작성하여 기한 내 제출하여 주시기 바랍니다.
      </div>

      {/* Sub-divider */}
      <div className="text-center font-bold text-sm tracking-widest my-6">
        -&nbsp;&nbsp;&nbsp;&nbsp;아&nbsp;&nbsp;&nbsp;&nbsp;래&nbsp;&nbsp;&nbsp;&nbsp;-
      </div>

      {/* Leave Balance Table */}
      <table className="w-full border-collapse border border-black text-sm my-6 text-center">
        <thead>
          <tr className="bg-slate-50 font-bold">
            <th className="border border-black py-3 px-4 w-1/3">
              발생 연차일수
            </th>
            <th className="border border-black py-3 px-4 w-1/3">
              사용일수 (하계휴가 포함)
            </th>
            <th className="border border-black py-3 px-4 w-1/3 text-red-600">
              미사용 연차일수
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="font-bold text-lg">
            <td className="border border-black py-4 px-4 font-mono">
              {notice.totalGranted.toFixed(1)} 일
            </td>
            <td className="border border-black py-4 px-4 font-mono">
              {notice.usedDays.toFixed(1)} 일
            </td>
            <td className="border border-black py-4 px-4 font-mono text-red-600 text-xl font-extrabold">
              {notice.remainingDays.toFixed(1)} 일
            </td>
          </tr>
        </tbody>
      </table>

      {/* Notes on Details (Carried over, etc.) */}
      {(employee.carriedOverDays || employee.specialAgreementDays) ? (
        <div className="text-xs text-slate-500 -mt-3 mb-6 pl-2">
          ※ 세부 산정근거: 당해연도 발생 {employee.totalGranted}일
          {employee.carriedOverDays ? ` + 이월연차 ${employee.carriedOverDays}일` : ''}
          {employee.specialAgreementDays ? ` + 약정휴가 ${employee.specialAgreementDays}일` : ''}
        </div>
      ) : null}

      {/* Notice Clauses */}
      <div className="space-y-3.5 text-sm my-8 pl-2">
        <div className="flex items-start">
          <span className="font-bold w-28">1. 제 출 기 한 : </span>
          <div>
            <span className="font-bold text-slate-900">본 안내문을 수령한 날로부터 10일 이내</span>
            <span className="text-xs text-blue-700 font-semibold ml-2">
              (수령일 기준 산출 회신기한: {notice.statutoryReplyDeadline})
            </span>
          </div>
        </div>

        <div className="flex items-start">
          <span className="font-bold w-28">2. 제&nbsp;&nbsp;출&nbsp;&nbsp;처 : </span>
          <span className="font-medium">인사총무팀 (모바일 전자문서 시스템 제출)</span>
        </div>

        <div>
          <div className="font-bold mb-1">3. 기&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;타 : </div>
          <div className="pl-4 space-y-1.5 text-[13px] text-slate-800">
            <div>
              ① 만약 기한 내에 제출하지 않을 경우 본인에게 불이익이 돌아갈 수 있으니 이 점 양지하시어 기한을 엄수하여 주시기 바랍니다.
            </div>
            <div>
              ② 연차휴가 사용계획 시기는 현장 및 업무사정에 따라 협의 후 변경할 수 있습니다.
            </div>
          </div>
        </div>
      </div>

      {/* Issue Date */}
      <div className="text-center font-serif text-base tracking-widest my-14 text-slate-900">
        {notice.issueDate}
      </div>

      {/* Signatory & Corporate Seal */}
      <div className="relative text-center my-8">
        <div className="text-xl md:text-2xl font-bold tracking-widest text-slate-950 font-serif">
          양우종합건설 주식회사
        </div>
        <div className="text-xl md:text-2xl font-bold tracking-[0.4em] text-slate-950 mt-2 font-serif relative inline-block pl-4">
          대 표 이 사&nbsp;&nbsp;고&nbsp;&nbsp;혜&nbsp;&nbsp;진
          {/* Stamped Corporate Seal positioned authentically over the representative name */}
          <div className="absolute -top-6 -right-16 pointer-events-none">
            <OfficialSeal
              size={sealConfig.size}
              rotation={sealConfig.rotation}
              opacity={sealConfig.opacity}
              customImageUrl={customSealUrl}
            />
          </div>
        </div>
      </div>

      {/* Legal Reference Footer */}
      <div className="mt-16 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between items-center">
        <span>근로기준법 제61조 제1항에 의거한 1차 연차유급휴가 사용촉진 통지서</span>
        <span>보존기간: 3년 (근로기준법 제42조)</span>
      </div>
    </div>
  );
};
