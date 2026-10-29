import React from 'react';
import { Employee, ReceiptConfirmation } from '../../types';
import { ShieldCheck } from 'lucide-react';

interface A4ReceiptConfirmationProps {
  employee: Employee;
  receipt: ReceiptConfirmation;
  noticeIssueDate?: string;
  className?: string;
}

export const A4ReceiptConfirmation: React.FC<A4ReceiptConfirmationProps> = ({
  employee,
  receipt,
  noticeIssueDate = '2027. 07. 01.',
  className = '',
}) => {
  return (
    <div
      className={`bg-white text-black p-10 md:p-14 max-w-[800px] mx-auto shadow-xl border border-slate-200 font-sans leading-relaxed relative print:shadow-none print:border-none print:p-0 print:max-w-none print:w-full ${className}`}
      style={{ minHeight: '1000px' }}
    >
      {/* Top Document Header */}
      <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-200 pb-2 mb-8">
        <div>
          확인증 번호: <span className="font-mono font-semibold text-slate-700">{receipt.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> 전자서명 검증완료
          </span>
          <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded">
            SHA256: {receipt.docHash.substring(0, 16)}...
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center my-10">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-widest underline underline-offset-8 decoration-2 text-slate-950 font-serif">
          연차휴가 사용촉진 통지서 수령 확인증
        </h1>
        <p className="text-xs text-slate-500 mt-3">
          (개인정보보호 및 전자문서 증거보존 개별 확인서식)
        </p>
      </div>

      {/* Body Notice Reference */}
      <div className="text-sm leading-relaxed my-8 indent-2 text-justify">
        양우종합건설(주)에서 {noticeIssueDate} 자에 통지한 「{employee.year}년 연차휴가 사용촉진 통지서」(문서번호: {receipt.noticeId})를
        수령하였음을 아래와 같이 확인합니다.
      </div>

      {/* Confirmation & Metadata Table */}
      <table className="w-full border-collapse border border-black text-sm my-8">
        <tbody>
          <tr>
            <th className="border border-black bg-slate-50 py-3 px-4 w-32 text-center font-bold">
              팀(현장) 명
            </th>
            <td className="border border-black py-3 px-4 font-semibold text-slate-900" colSpan={3}>
              {receipt.department} {receipt.site ? `(${receipt.site})` : ''}
            </td>
          </tr>
          <tr>
            <th className="border border-black bg-slate-50 py-3 px-4 w-32 text-center font-bold">
              수&nbsp;&nbsp;령&nbsp;&nbsp;자
            </th>
            <td className="border border-black py-3 px-4 font-bold text-base w-48">
              {receipt.employeeName} ({employee.position})
            </td>
            <th className="border border-black bg-slate-50 py-3 px-4 w-28 text-center font-bold">
              사&nbsp;&nbsp;&nbsp;&nbsp;번
            </th>
            <td className="border border-black py-3 px-4 font-mono font-semibold">
              {receipt.employeeId}
            </td>
          </tr>
          <tr>
            <th className="border border-black bg-slate-50 py-3 px-4 w-32 text-center font-bold">
              수 령 일 시
            </th>
            <td className="border border-black py-3 px-4 font-mono font-semibold text-blue-900" colSpan={3}>
              {receipt.signedAt}
            </td>
          </tr>
          <tr>
            <th className="border border-black bg-slate-50 py-3 px-4 w-32 text-center font-bold">
              본인인증 방식
            </th>
            <td className="border border-black py-3 px-4 text-xs text-slate-700" colSpan={3}>
              {receipt.authMethod === 'MOBILE_OTP' ? '휴대폰 번호 + 일회용 인증번호(OTP) 일치 확인' : '공인 전자서명 인증'} ({receipt.authLevel})
            </td>
          </tr>
        </tbody>
      </table>

      {/* Statutory Protection Statement Box */}
      <div className="my-8 p-5 bg-slate-50 border border-slate-300 rounded-lg text-sm leading-relaxed text-slate-800">
        <div className="font-bold text-slate-950 mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          수령 확인 및 권리 보호 문구
        </div>
        <p className="indent-1 text-justify">
          "{receipt.confirmationText}"
        </p>
      </div>

      {/* Signature Section */}
      <div className="my-12 p-6 border-2 border-slate-300 rounded-xl bg-white flex flex-col items-center">
        <div className="text-sm font-bold text-slate-800 mb-4 tracking-wider">
          수 령 자&nbsp;&nbsp;&nbsp;&nbsp;자 필 서 명
        </div>

        <div className="w-64 h-32 border border-slate-200 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden shadow-inner relative">
          {receipt.signatureDataUrl ? (
            <img
              src={receipt.signatureDataUrl}
              alt={`${receipt.employeeName} 자필서명`}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <span className="text-xs text-slate-400">서명 이미지 없음</span>
          )}
          <div className="absolute bottom-1 right-2 text-[10px] text-slate-400 font-mono">
            Verified Signature
          </div>
        </div>

        <div className="text-base font-bold text-slate-900 mt-4 tracking-widest font-serif">
          확인자: {receipt.employeeName} (서명)
        </div>
      </div>

      {/* Evidence Integrity & Legal Footnote */}
      <div className="mt-16 pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
        <div className="flex justify-between">
          <span>전자서명법 제3조 및 전자문서 및 전자거래 기본법 제4조의2 준수</span>
          <span>원문 해시: {receipt.docHash}</span>
        </div>
        <p>
          ※ 본 확인증은 원본 연차사용촉진 통지서 수령 사실을 증명하는 전자문서로서 시스템 감사로그에 영구 보존됩니다.
        </p>
      </div>
    </div>
  );
};
