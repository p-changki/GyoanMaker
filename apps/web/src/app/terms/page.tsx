import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관",
  description:
    "교안메이커 서비스 이용약관입니다. 서비스 이용 조건, 결제·환불 정책, 저작권, 면책 사항 등을 안내합니다.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 py-12">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">이용약관</h1>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제1조 (목적)
          </h2>
          <p>
            본 약관은 GyoanMaker(이하 &quot;서비스&quot;)의 이용 조건 및 절차에
            관한 사항을 규정함을 목적으로 합니다.
          </p>
          <p className="mt-2">
            이용자가 서비스에 가입하거나 이용을 개시하는 경우, 본 약관의
            내용을 충분히 숙지하고 이에 동의한 것으로 간주합니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제2조 (정의)
          </h2>
          <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              &quot;서비스&quot;라 함은 GyoanMaker가 운영하는 웹사이트
              (https://gyoan-maker.store)를 통해 제공하는 AI 기반 영어 교안
              생성, 편집, PDF 내보내기 및 관련 제반 서비스를 의미합니다.
            </li>
            <li>
              &quot;이용자&quot;라 함은 본 약관에 따라 서비스에 가입하여
              이용하는 자를 말합니다.
            </li>
            <li>
              &quot;교안&quot;이라 함은 서비스의 AI를 통해 생성된 워크시트,
              분석 결과, 어휘 자료 등 일체의 콘텐츠를 의미합니다.
            </li>
            <li>
              &quot;구독&quot;이라 함은 월 단위 정기 결제를 통해 이용하는
              유료 서비스를 의미합니다.
            </li>
            <li>
              &quot;크레딧&quot;이라 함은 월간 한도 소진 후 추가 이용을 위해
              충전하는 선불 결제 수단을 의미합니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제3조 (서비스 범위)
          </h2>
          <p>서비스는 이용자에게 아래와 같은 기능을 제공합니다.</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>AI 기반 영어 지문 분석 및 교안 생성</li>
            <li>생성된 교안의 인라인 편집 및 템플릿 커스터마이징</li>
            <li>인쇄용 PDF 내보내기</li>
            <li>AI 일러스트 생성 및 교안 삽입</li>
            <li>교안 저장 및 관리</li>
            <li>기타 서비스가 추가 개발하여 제공하는 일체의 기능</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제4조 (이용 자격 및 계약 체결)
          </h2>
          <p>
            서비스는 Google 계정으로 로그인한 후 관리자 승인을 받은 사용자만
            이용할 수 있습니다.
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>
              본 서비스는 만 14세 이상만 이용할 수 있습니다. 만 14세 미만의
              이용자는 법정대리인의 동의 없이 서비스를 이용할 수 없습니다.
            </li>
            <li>
              이용 계약은 이용자가 본 약관에 동의하고 서비스 가입을 완료한
              시점에 체결됩니다.
            </li>
            <li>
              허위 정보를 기재하거나 타인의 정보를 도용한 경우, 서비스는
              가입을 거부하거나 사후에 이용 계약을 해지할 수 있습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제5조 (계정 관리 및 공유 금지)
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              정상적인 서비스 이용을 위하여 1인 1계정을 원칙으로 합니다.
            </li>
            <li>
              이용자는 자신의 계정을 제3자에게 공유, 양도, 대여할 수 없습니다.
            </li>
            <li>
              계정 공유가 확인되는 경우, 서비스는 제10조(이용 제한)에 따라
              해당 계정의 이용을 제한할 수 있습니다.
            </li>
            <li>
              이용자는 계정의 무단 사용을 인지한 경우 즉시 서비스에
              통지하여야 하며, 통지 전 발생한 불이익에 대해 서비스는 책임을
              지지 않습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제6조 (유료 서비스 및 결제)
          </h2>
          <p className="mb-3">
            서비스는 다음과 같은 월간 구독 요금제를 제공합니다.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                    요금제
                  </th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                    월 요금
                  </th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                    빠른 모드 지문/월
                  </th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                    정밀 모드 지문/월
                  </th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                    일러스트 삽입/월
                  </th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                    일러스트 샘플
                  </th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                    일러스트 테스트/일
                  </th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                    저장 공간
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">무료</td>
                  <td className="border border-gray-200 px-3 py-2">무료</td>
                  <td className="border border-gray-200 px-3 py-2">10개</td>
                  <td className="border border-gray-200 px-3 py-2">5개</td>
                  <td className="border border-gray-200 px-3 py-2">5회</td>
                  <td className="border border-gray-200 px-3 py-2">10개</td>
                  <td className="border border-gray-200 px-3 py-2">3회</td>
                  <td className="border border-gray-200 px-3 py-2">최대 3개</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">베이직</td>
                  <td className="border border-gray-200 px-3 py-2">14,900원</td>
                  <td className="border border-gray-200 px-3 py-2">250개</td>
                  <td className="border border-gray-200 px-3 py-2">30개</td>
                  <td className="border border-gray-200 px-3 py-2">10회</td>
                  <td className="border border-gray-200 px-3 py-2">20개</td>
                  <td className="border border-gray-200 px-3 py-2">5회</td>
                  <td className="border border-gray-200 px-3 py-2">무제한</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">스탠다드</td>
                  <td className="border border-gray-200 px-3 py-2">34,900원</td>
                  <td className="border border-gray-200 px-3 py-2">500개</td>
                  <td className="border border-gray-200 px-3 py-2">120개</td>
                  <td className="border border-gray-200 px-3 py-2">30회</td>
                  <td className="border border-gray-200 px-3 py-2">30개</td>
                  <td className="border border-gray-200 px-3 py-2">10회</td>
                  <td className="border border-gray-200 px-3 py-2">무제한</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">프로</td>
                  <td className="border border-gray-200 px-3 py-2">89,000원</td>
                  <td className="border border-gray-200 px-3 py-2">1,000개</td>
                  <td className="border border-gray-200 px-3 py-2">400개</td>
                  <td className="border border-gray-200 px-3 py-2">60회</td>
                  <td className="border border-gray-200 px-3 py-2">30개</td>
                  <td className="border border-gray-200 px-3 py-2">10회</td>
                  <td className="border border-gray-200 px-3 py-2">무제한</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul className="list-disc pl-6 mt-3 space-y-1">
            <li>
              월간 한도 소진 후에도 별도의 크레딧을 충전하여 추가 이용이
              가능합니다.
            </li>
            <li>
              결제는 토스페이먼츠(TossPayments)를 통해 처리됩니다.
            </li>
            <li>
              정기 구독은 매월 결제일에 자동으로 갱신되며, 갱신일 전까지
              해지하지 않으면 동일 조건으로 연장됩니다.
            </li>
            <li>
              결제 과정에서 발생하는 오류 또는 이용자의 결제 수단 문제로 인한
              결제 실패에 대해 서비스는 책임을 지지 않습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제7조 (크레딧 이용)
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              크레딧은 월간 한도 초과 시 추가 교안 생성을 위해 사용되는 선불
              결제 수단으로, 신용카드, 계좌이체 등의 결제를 통해 충전할 수
              있습니다.
            </li>
            <li>
              충전된 크레딧의 유효기간은 구매일로부터 90일이며, 유효기간
              만료 시 자동 소멸되고 복구되지 않습니다.
            </li>
            <li>
              크레딧은 본인의 계정에서만 사용할 수 있으며, 타인에게 양도하거나
              판매할 수 없습니다.
            </li>
            <li>
              이용자가 부정한 방법으로 크레딧을 취득한 경우, 서비스는 해당
              크레딧을 회수할 수 있습니다.
            </li>
            <li>
              회원 탈퇴 시 잔여 크레딧은 소멸되며, 탈퇴 전 환불을 신청하지
              않은 경우 환불하지 않습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제8조 (환불 정책)
          </h2>
          <h3 className="text-base font-semibold text-gray-800 mt-3 mb-2">
            1. 구독 환불
          </h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              구독 결제 후 7일 이내이며 서비스를 이용(교안 생성)하지 않은 경우,
              전액 환불됩니다.
            </li>
            <li>
              결제 후 7일이 경과하였거나 서비스를 이용한 경우, 이용 기간에
              해당하는 금액을 차감한 후 잔여 금액의 80%를 환불합니다
              (위약금 20%).
            </li>
          </ul>
          <h3 className="text-base font-semibold text-gray-800 mt-3 mb-2">
            2. 크레딧 환불
          </h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              크레딧 충전 후 7일 이내이며 사용하지 않은 경우, 전액 환불됩니다.
            </li>
            <li>
              충전 후 7일이 경과하였거나 일부 사용한 경우, 사용분을 차감한
              잔여 금액의 80%를 환불합니다.
            </li>
            <li>유효기간이 만료된 크레딧은 환불 대상이 아닙니다.</li>
          </ul>
          <h3 className="text-base font-semibold text-gray-800 mt-3 mb-2">
            3. 공통
          </h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              환불 요청은 관리자 이메일
              (dnsxj12345aa@gmail.com)을 통해 접수할 수 있습니다.
            </li>
            <li>환불은 요청일로부터 영업일 기준 7일 이내에 처리됩니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제9조 (구독 해지)
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              이용자는 계정 설정 페이지에서 언제든지 구독을 해지할 수 있습니다.
            </li>
            <li>
              해지 시 현재 결제 기간이 종료될 때까지 서비스를 계속 이용할 수
              있으며, 이후 Free 요금제로 전환됩니다.
            </li>
            <li>
              해지 후에도 저장된 교안은 Free 요금제의 저장 한도 내에서
              유지됩니다. 한도를 초과하는 교안은 최신순으로 보존되며, 초과분에
              대해서는 다운로드만 가능하고 신규 저장이 제한될 수 있습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제10조 (이용 제한)
          </h2>
          <p>이용자는 다음 행위를 하여서는 안 됩니다.</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>서비스를 통해 생성한 교안의 상업적 재판매 (제12조 참조)</li>
            <li>자동화 도구를 이용한 대량 요청</li>
            <li>정상적인 서비스 운영을 방해하는 행위</li>
            <li>타인의 계정을 무단으로 사용하거나 공유하는 행위</li>
            <li>
              서비스의 보안을 침해하거나 소스코드를 역분석하는 행위, 또는
              시스템에 과도한 부하를 유발하는 행위
            </li>
            <li>허위 정보를 등록하거나 타인의 정보를 도용하는 행위</li>
            <li>서비스 및 제3자의 지적재산권을 침해하는 행위</li>
          </ul>
          <p className="mt-3">
            위반 행위가 확인되는 경우, 서비스는 다음과 같이 단계적으로
            이용을 제한할 수 있습니다.
          </p>
          <ul className="list-decimal pl-6 mt-2 space-y-1">
            <li>
              <strong>경고</strong> — 위반 사실을 통지하고 시정을 요구합니다.
            </li>
            <li>
              <strong>일시 정지</strong> — 일정 기간 서비스 이용을 정지합니다.
            </li>
            <li>
              <strong>영구 이용 정지</strong> — 계정을 영구적으로 정지하며,
              잔여 크레딧 및 구독 혜택은 소멸됩니다.
            </li>
          </ul>
          <p className="mt-2">
            다만, 관련 법률 위반(명의 도용, 불법 프로그램 사용, 해킹 등)의
            경우 즉시 영구 이용 정지될 수 있습니다.
          </p>
          <p className="mt-2">
            이용자는 이용 제한에 대해 관리자 이메일을 통해 이의를 신청할 수
            있으며, 이의가 정당하다고 인정되는 경우 서비스는 즉시 이용을
            재개합니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제11조 (저작권 및 지적재산권)
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              서비스의 소프트웨어, 디자인, 기술, 브랜드에 대한 지적재산권은
              서비스 운영자에게 귀속됩니다.
            </li>
            <li>
              AI가 생성한 교안의 저작권은 이를 생성한 이용자에게 귀속됩니다.
              다만, 서비스는 서비스 개선 목적으로 익명화된 생성 데이터를
              활용할 수 있습니다.
            </li>
            <li>
              이용자가 업로드한 이미지(로고, 캐릭터 등)의 저작권은 해당
              이용자에게 귀속되며, 서비스는 교안 렌더링 목적으로만 사용합니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제12조 (AI 생성 콘텐츠 사용 범위 및 재판매 금지)
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              이용자는 서비스를 통해 생성한 교안을 <strong>개인적인 교육
              목적</strong>(수업 자료, 학습 보조 등)으로만 사용할 수 있습니다.
            </li>
            <li>
              서비스의 명시적인 서면 동의 없이 생성된 교안을 복제, 배포, 대여,
              전송, 판매, 재판매하거나 제3자에게 제공할 수 없습니다.
            </li>
            <li>
              교안을 상업적 목적(유료 배포, 타 플랫폼 판매 등)으로 활용하려는
              경우, 반드시 서비스 운영자의 사전 승인을 받아야 합니다.
            </li>
            <li>
              본 조항을 위반하여 콘텐츠를 무단으로 재판매하거나 유포한 사실이
              확인될 경우, 서비스는 즉시 계정 정지, 법적 조치, 손해배상 청구
              등의 조치를 취할 수 있습니다.
            </li>
            <li>
              이용자가 본 조항을 위반하여 발생한 모든 문제에 대해 서비스는
              어떠한 책임도 지지 않습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제13조 (면책 조항)
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              AI가 생성한 결과물의 정확성과 완전성은 보장되지 않습니다. 이용자는
              생성된 교안을 사용 전에 검토해야 합니다.
            </li>
            <li>
              본 서비스는 AI 기반 자동 생성 시스템을 사용하며, 생성된 콘텐츠의
              법적 책임은 이를 사용하는 이용자에게 있습니다.
            </li>
            <li>
              이용 중 발생하는 데이터 손실에 대해 서비스는 책임을 지지 않습니다.
              중요한 교안은 별도로 저장하시기 바랍니다.
            </li>
            <li>
              천재지변, 외부 서비스(Google, Vercel, GCP) 장애 등 불가항력으로
              인한 서비스 중단에 대해 책임을 지지 않습니다.
            </li>
            <li>
              이용자 간 또는 이용자와 제3자 사이에서 서비스를 매개로 발생한
              분쟁에 대해 서비스는 책임이 면제됩니다.
            </li>
            <li>
              서비스 이용과 관련하여 서비스가 부담하는 손해배상 책임은
              이용자가 해당 사유 발생일 기준 직전 1개월간 서비스에 지불한
              금액을 초과하지 않습니다. 무료 이용자의 경우 서비스는 금전적
              배상 책임을 부담하지 않습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제14조 (서비스 변경 및 중단)
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              서비스는 운영상, 기술상의 필요에 따라 제공하고 있는 서비스의
              전부 또는 일부를 변경할 수 있습니다.
            </li>
            <li>
              서비스 내용, 이용 방법에 변경이 있는 경우, 변경 사유 및 내용을
              변경 전에 서비스 내에 공지합니다. 긴급한 경우에는 사후에
              공지할 수 있습니다.
            </li>
            <li>
              무료로 제공되는 서비스의 일부 또는 전부를 서비스의 정책 및
              운영상 필요에 따라 수정, 중단, 변경할 수 있으며, 이에 대하여
              관련법에 특별한 규정이 없는 한 이용자에게 별도의 보상을 하지
              않습니다.
            </li>
            <li>
              서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다. 다만,
              시스템 점검, 보수, 장애 등의 사유로 일시적으로 중단될 수
              있습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제15조 (개인정보 보호)
          </h2>
          <p>
            서비스는 &quot;개인정보 보호법&quot; 및 &quot;정보통신망
            이용촉진 및 정보보호 등에 관한 법률&quot; 등 관계 법령이 정하는
            바에 따라 이용자의 개인정보를 보호하기 위해 노력합니다.
            개인정보의 보호 및 사용에 대해서는 별도의{" "}
            <a href="/privacy" className="text-[#5E35B1] hover:underline">
              개인정보처리방침
            </a>
            이 적용됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제16조 (이용자에 대한 통지)
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              서비스가 이용자에게 통지를 하는 경우, 이용자의 가입 이메일 또는
              서비스 내 공지를 통해 할 수 있습니다.
            </li>
            <li>
              전체 이용자에 대한 통지의 경우, 7일 이상 서비스 내에
              게시함으로써 개별 통지를 갈음할 수 있습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제17조 (계약 해지 및 탈퇴)
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              이용자는 계정 설정 페이지를 통하여 언제든지 이용 계약 해지
              (회원 탈퇴)를 신청할 수 있으며, 서비스는 관련 법령에 따라
              이를 즉시 처리합니다.
            </li>
            <li>
              탈퇴 시 이용자의 모든 데이터(교안, 설정, 크레딧 등)는 즉시
              삭제되며, 관련 법령에 따라 보존이 필요한 정보는 해당 기간
              동안 보관됩니다.
            </li>
            <li>
              탈퇴 전 환불 가능한 잔여 구독료 또는 크레딧이 있는 경우,
              제8조(환불 정책)에 따라 환불을 신청할 수 있습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제18조 (약관 변경)
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              서비스는 관련 법률을 위배하지 않는 범위에서 본 약관을 개정할 수
              있습니다.
            </li>
            <li>
              약관 변경 시, 적용일자 및 주요 변경 사유를 명시하여 시행일
              최소 7일 전에 서비스 내에서 공지합니다. 이용자에게 불리한 변경의
              경우 30일 전에 공지합니다.
            </li>
            <li>
              공지 후 30일 이내 이용자가 명시적으로 거부 의사를 표시하지 않은
              경우, 변경된 약관에 동의한 것으로 간주합니다.
            </li>
            <li>
              변경된 약관에 동의하지 않는 이용자는 서비스 이용을 중단하고
              탈퇴를 요청할 수 있습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제19조 (준거법 및 관할)
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              본 약관의 해석 및 적용에 관하여는 대한민국 법률을 준거법으로
              합니다.
            </li>
            <li>
              서비스 이용과 관련하여 분쟁이 발생하는 경우, 이용자의 주소지를
              관할하는 지방법원을 전속관할 법원으로 합니다. 다만, 주소가
              명확하지 않은 경우 서울중앙지방법원을 관할 법원으로 합니다.
            </li>
          </ul>
          <p className="mt-4 text-sm text-gray-500">시행일: 2026년 3월 8일</p>
        </section>
      </div>

      {/* 사업자 정보 */}
      <div className="mt-16 pt-8 border-t border-gray-200 text-sm text-gray-500 space-y-1">
        <p className="font-semibold text-gray-600">사업자 정보</p>
        <p>운영자: 박창기</p>
        <p>서비스명: GyoanMaker</p>
        <p>문의: dnsxj12345aa@gmail.com</p>
      </div>
    </div>
  );
}
