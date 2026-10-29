import React from 'react';
import { OfficialAnnouncement } from '../../types';
import { YangwooLogo } from '../YangwooLogo';

interface A4OfficialAnnouncementProps {
  announcement: OfficialAnnouncement;
  onPrint?: () => void;
  className?: string;
}

export const A4OfficialAnnouncement: React.FC<A4OfficialAnnouncementProps> = ({
  announcement,
  className = '',
}) => {
  return (
    <div
      className={`bg-white text-black p-10 md:p-14 max-w-[800px] mx-auto shadow-xl border border-slate-200 font-sans leading-relaxed selection:bg-amber-100 print:shadow-none print:border-none print:p-0 print:max-w-none print:w-full ${className}`}
      style={{ minHeight: '1100px' }}
    >
      {/* Top Motto & Corporate Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-2">
        <span className="text-sm font-bold tracking-wider text-slate-800">
          "고객만족 고객감동"
        </span>
        <YangwooLogo size="md" />
      </div>

      {/* Contact Line */}
      <div className="text-right text-xs text-slate-700 font-medium mb-1">
        담당자 : {announcement.contactPerson} ({announcement.extensionNumber})
      </div>

      {/* Horizontal Divider */}
      <div className="border-t border-black mb-6" />

      {/* Document Meta Table */}
      <div className="space-y-2 text-sm text-slate-900 mb-8 font-medium">
        <div className="flex justify-between items-baseline">
          <div className="flex items-center">
            <span className="w-20 inline-block text-slate-600">문서번호 :</span>
            <span className="font-semibold">{announcement.id}</span>
          </div>
          <div className="text-slate-800 font-semibold tracking-wider">
            시행일자 : {announcement.issueDate}
          </div>
        </div>

        <div className="flex items-center">
          <span className="w-20 inline-block text-slate-600">수&nbsp;&nbsp;&nbsp;&nbsp;신 :</span>
          <span className="font-semibold">{announcement.recipient}</span>
        </div>

        <div className="flex items-center">
          <span className="w-20 inline-block text-slate-600">참&nbsp;&nbsp;&nbsp;&nbsp;조 :</span>
          <span>{announcement.reference || '각 부서장 및 현장소장'}</span>
        </div>

        <div className="flex items-baseline pt-1 border-b border-slate-300 pb-2">
          <span className="w-20 inline-block text-slate-600 font-bold">제&nbsp;&nbsp;&nbsp;&nbsp;목 :</span>
          <span className="font-bold text-base text-slate-950">{announcement.title}</span>
        </div>
      </div>

      {/* Introductory Body */}
      <div className="text-sm leading-relaxed mb-6 indent-2 text-justify">
        {announcement.year}년도 연차휴가 운영계획 및 근로기준법 제61조(연차 유급휴가의 사용촉진)와 관련하여,
        연차휴가 사용촉진을 아래와 같이 실시합니다.
      </div>

      {/* Section Divider */}
      <div className="text-center font-bold text-sm tracking-widest my-4">
        -&nbsp;&nbsp;&nbsp;&nbsp;아&nbsp;&nbsp;&nbsp;&nbsp;래&nbsp;&nbsp;&nbsp;&nbsp;-
      </div>

      {/* Numbered Sections */}
      <div className="space-y-4 text-sm text-slate-900 pl-2">
        <div>
          <span className="font-bold">1. 제출대상 : </span>
          <span>{announcement.targetDescription}</span>
        </div>

        <div>
          <div className="font-bold mb-1">2. 제출서류 :</div>
          <div className="pl-4 space-y-1.5 text-[13px] text-slate-800">
            {announcement.submissionItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <span className="font-semibold">{idx + 1})</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="font-bold mb-1">3. 제출방법 :</div>
          <div className="pl-4 text-[13px] text-slate-800 leading-relaxed">
            {announcement.submissionMethod}
          </div>
        </div>

        <div>
          <span className="font-bold">4. 제출기한 : </span>
          <span className="font-bold text-red-600 underline underline-offset-4">
            {announcement.companyTargetDeadline}
          </span>
          <span className="text-xs text-slate-500 ml-2">
            (※ 근로자 개인별 법정 회신기한은 통지서 수령 후 10일 이내)
          </span>
        </div>

        <div>
          <div className="font-bold mb-1">5. 유의사항 :</div>
          <div className="pl-4 space-y-1 text-[13px] text-slate-700">
            {announcement.notes.map((note, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <span>{idx + 1})</span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attachments */}
      <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-700">
        <div className="font-semibold mb-1">* 첨&nbsp;&nbsp;부 :</div>
        <div className="pl-4 space-y-0.5">
          {announcement.attachments.map((att, idx) => (
            <div key={idx}>{att}</div>
          ))}
        </div>
      </div>

      {/* Bottom Signatory and Seal Omitted Box */}
      <div className="mt-14 mb-8 flex items-center justify-center gap-6">
        <div className="text-xl font-bold tracking-widest text-slate-900">
          {announcement.senderTitle}&nbsp;&nbsp;&nbsp;&nbsp;{announcement.senderName}
        </div>
        {announcement.sealOmitted && (
          <div className="border border-black px-2 py-1 text-xs font-semibold text-center tracking-widest leading-none">
            직 인<br />생 략
          </div>
        )}
      </div>

      {/* Bottom Motto */}
      <div className="border-t-2 border-black pt-3 mt-12 text-center text-sm font-bold tracking-wider text-slate-800">
        "총력수주 · 원가절감 · 리스크관리"
      </div>
    </div>
  );
};
