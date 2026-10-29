import React, { useState } from 'react';
import { X, ArrowRight, ShieldCheck, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

interface DocumentDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentDiffModal: React.FC<DocumentDiffModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'ANNOUNCEMENT' | 'NOTICE' | 'RECEIPT' | 'PLAN' | 'SEAL'>('PLAN');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              양우종합건설 기존 서식 vs 법정준수 신규 전자문서 1:1 비교 검토
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              2026년 첨부 원본 PDF(SKM_C301i26102915590.pdf)와 2027년 개정 시스템 서식의 조항별 개선 사항
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-6 gap-2 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'PLAN', label: '4쪽 사용계획서 (권리포기 문구 배제)' },
            { id: 'RECEIPT', label: '3쪽 수령 확인증 (개인정보 보호 & 1인 서식)' },
            { id: 'NOTICE', label: '2쪽 촉진 통지서 (사번 식별 & 인감 관리)' },
            { id: 'ANNOUNCEMENT', label: '1쪽 사내공문 (ERP 경로 대체)' },
            { id: 'SEAL', label: '5쪽 사용인감 (전자날인 & 위변조 방지)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3.5 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700 bg-white font-bold shadow-xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {activeTab === 'PLAN' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-900">핵심 법률 검토: 연차수당 미지급 동의 강제 배제</div>
                  <div className="text-xs text-amber-800 mt-1 leading-relaxed">
                    근로기준법 제61조에 따른 사용촉진 절차를 거치더라도, 근로자가 계획일에 출근하여 노무를 제공하고 회사가 노무수령 거부의사를 명확히 표시하지 않은 경우 수당 지급의무가 발생합니다. 종전 서식의 일방적 사전 수당포기 문구는 법 위반 및 분쟁 소지가 있으므로 법정 통보 문구로 개편되었습니다.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 2026 Original */}
                <div className="border border-rose-300 rounded-xl p-4 bg-rose-50/40">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-800 mb-2 border-b border-rose-200 pb-1.5">
                    <span>2026년 종전 서식 (PDF 4쪽 원본)</span>
                    <span className="px-2 py-0.5 bg-rose-200 rounded text-rose-900">법적 하자 위험</span>
                  </div>
                  <div className="p-3 bg-white border border-rose-200 rounded-lg text-xs leading-relaxed text-slate-700 font-mono">
                    "본인은 2026년도 미사용한 연차에 대하여 상기와 같이 사용할 시기를 지정하였기에 본 계획서를 제출하며, <span className="text-rose-600 font-bold underline bg-rose-50">지정일에 사용하지 아니한 연차휴가 일수에 대해서는 연차휴가 수당을 지급받지 않는 것에 동의합니다.</span>"
                  </div>
                  <div className="mt-3 text-[11px] text-rose-700 space-y-1">
                    <div>• 근로기준법상 강행규정 위반 소지</div>
                    <div>• 근로자가 수당 포기 문구 서명을 거부할 경우 갈등 발생</div>
                  </div>
                </div>

                {/* 2027 New Compliant */}
                <div className="border border-emerald-300 rounded-xl p-4 bg-emerald-50/40">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 mb-2 border-b border-emerald-200 pb-1.5">
                    <span>2027년 개정 서식 (시스템 적용 표준)</span>
                    <span className="px-2 py-0.5 bg-emerald-200 rounded text-emerald-900 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> 권리보호 적법 서식
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-emerald-200 rounded-lg text-xs leading-relaxed text-slate-800 font-mono">
                    "<span className="text-emerald-700 font-bold">본인은 위와 같이 연차휴가 사용시기를 정하여 통보합니다. 사용계획 변경이 필요한 경우 회사의 신청·협의 절차에 따라 처리하겠습니다.</span>"
                  </div>
                  <div className="mt-3 text-[11px] text-emerald-800 space-y-1">
                    <div>• 근로기준법 제61조 제1항 '사용시기 통보' 요건 정확히 충족</div>
                    <div>• 근로자에게 부당한 사전 권리포기를 강제하지 않음</div>
                    <div>• 결재 지연에도 '최초 통보 시각' 타임스탬프 영구 고정</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'RECEIPT' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-blue-900">개인정보보호법 준수: 팀별 다인 명부에서 1인 단독 확인증으로 전환</div>
                  <div className="text-xs text-blue-800 mt-1 leading-relaxed">
                    종전 3쪽 서식은 1장의 종이에 20명의 팀원이 순번대로 서명하여 동료들의 서명 여부와 신상정보가 노출되었습니다. 모바일 앱에서는 각 직원이 본인의 확인증만 열람·서명하도록 개편되어 완벽한 개인정보보호를 실현합니다.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-300 rounded-xl p-4 bg-slate-50">
                  <div className="text-xs font-bold text-slate-700 mb-2 pb-1.5 border-b border-slate-200">
                    종전 3쪽 다인 서명 명부
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-600">
                    <li>• 한 장의 표에 순번 1~20명 동시 기재 및 서명</li>
                    <li>• 다른 직원의 서명 여부와 필적 노출 (개인정보보호 위반 우려)</li>
                    <li>• 실제 서명 시각이 초 단위로 기록되지 않고 날짜만 수기 작성</li>
                  </ul>
                </div>
                <div className="border border-blue-300 rounded-xl p-4 bg-blue-50/40">
                  <div className="text-xs font-bold text-blue-900 mb-2 pb-1.5 border-b border-blue-200 flex items-center justify-between">
                    <span>개정 1인 디지털 확인증</span>
                    <span className="text-[10px] bg-blue-200 px-2 py-0.5 rounded text-blue-900">보안 최우선</span>
                  </div>
                  <ul className="text-xs space-y-1.5 text-blue-900">
                    <li>• 오직 로그인한 본인만의 문서만 표시 (타인 접근 불가)</li>
                    <li>• 모바일 터치 자필 서명 + OTP 2차 인증 결합</li>
                    <li>• KST 서버 타임스탬프 및 SHA-256 무결성 해시 영구 보존</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'NOTICE' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="font-bold text-slate-900 text-sm mb-2">
                  주요 개정 포인트 (PDF 2쪽 연차휴가 사용촉진 통지서)
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">주민등록번호 대신 사번 식별:</span> 원본의 "생년월일(750111-*******)"은 불필요한 개인정보 수집 최소화 원칙에 따라 "사번(YWxxxxxxx)"으로 대체.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">개인별 법정 회신기한 분리:</span> 회사 목표일과 별개로 근로자가 실제 수령한 날로부터 계산되는 10일 이내 법정 회신기한을 명시.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">연차 스냅샷 고정:</span> 발급 시점의 잔여일수 수치를 스냅샷으로 영구 고정하고, 차후 변동 시 새 버전으로 이력 관리.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ANNOUNCEMENT' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="font-bold text-slate-900 text-sm mb-2">
                  사내 공문 현대화 (PDF 1쪽 공문 개정)
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <div>• 종전의 "ERP → 인사 → 근태 → 연차사용계획 등록에서 작성 후 출력하여 오정환 대리에게 원본 제출"이라는 구식 종이 절차를 완전 모바일 원스톱 결재 시스템으로 대체.</div>
                  <div>• 작성일자(시행일자)는 신규 작성 시 KST 실시간 일자로 자동 입력되며, 발행 후 수정 불가하도록 고정.</div>
                  <div>• 직책 "경영지원본부장" 및 발신인 성명은 고정되지 않고 인사 설정에서 언제든 직책 변경 가능.</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SEAL' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="font-bold text-slate-900 text-sm mb-2">
                  사용인감 관리 및 전자날인 정책 (PDF 5쪽)
                </div>
                <div className="space-y-2 text-xs text-slate-700">
                  <div>• 원본 PDF 5쪽에서 확인된 양우종합건설 공인 인감 형태를 벡터 SVG로 정밀 구현.</div>
                  <div>• 관리자 권한에서 고해상도 인감 파일 추가 등록, 크기·각도·투명도 미세 조절 지원.</div>
                  <div>• 인감 날인 시 서버 시각과 날인자 사번이 감사로그에 연동 기록됨.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
