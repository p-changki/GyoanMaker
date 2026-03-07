export const metadata = {
  title: "이용약관 | GyoanMaker",
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
            제2조 (서비스 범위)
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>AI 기반 영어 교안 생성</li>
            <li>생성된 교안의 인라인 편집</li>
            <li>인쇄용 PDF 내보내기</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제3조 (이용 자격)
          </h2>
          <p>
            서비스는 Google 계정으로 로그인한 후 관리자 승인을 받은 사용자만
            이용할 수 있습니다.
          </p>
          <p className="mt-2">
            본 서비스는 만 14세 이상만 이용할 수 있습니다. 만 14세 미만의
            이용자는 법정대리인의 동의 없이 서비스를 이용할 수 없습니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제4조 (이용 제한)
          </h2>
          <p>이용자는 다음 행위를 하여서는 안 됩니다.</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>서비스를 통해 생성한 교안의 상업적 재판매</li>
            <li>자동화 도구를 이용한 대량 요청</li>
            <li>정상적인 서비스 운영을 방해하는 행위</li>
            <li>타인의 계정을 무단으로 사용하는 행위</li>
            <li>
              서비스의 보안을 침해하거나 소스코드를 역분석하는 행위, 또는
              시스템에 과도한 부하를 유발하는 행위
            </li>
          </ul>
          <p className="mt-3">
            위 행위가 확인되는 경우, 서비스는 사전 통지 없이 해당 이용자의
            계정을 정지하거나 삭제할 수 있습니다. 이 경우 이용자에게
            사후 통지하며, 이용자는 이의를 제기할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제5조 (유료 서비스 및 결제)
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
                    Flash 월 한도
                  </th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                    Pro 월 한도
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">Free</td>
                  <td className="border border-gray-200 px-3 py-2">무료</td>
                  <td className="border border-gray-200 px-3 py-2">10회</td>
                  <td className="border border-gray-200 px-3 py-2">2회</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">Basic</td>
                  <td className="border border-gray-200 px-3 py-2">14,900원</td>
                  <td className="border border-gray-200 px-3 py-2">250회</td>
                  <td className="border border-gray-200 px-3 py-2">30회</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">Standard</td>
                  <td className="border border-gray-200 px-3 py-2">34,900원</td>
                  <td className="border border-gray-200 px-3 py-2">500회</td>
                  <td className="border border-gray-200 px-3 py-2">120회</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">Pro</td>
                  <td className="border border-gray-200 px-3 py-2">79,000원</td>
                  <td className="border border-gray-200 px-3 py-2">1,000회</td>
                  <td className="border border-gray-200 px-3 py-2">400회</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            월간 한도 소진 후에도 별도의 크레딧을 충전하여 추가 이용이
            가능합니다. 결제는 토스페이먼츠(TossPayments)를 통해 처리됩니다.
          </p>
          <p className="mt-2">
            결제 과정에서 발생하는 오류 또는 이용자의 결제 수단 문제로 인한
            결제 실패에 대해 서비스는 책임을 지지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제6조 (환불 정책)
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              구독 결제 후 7일 이내이며 서비스를 이용하지 않은 경우, 전액
              환불됩니다.
            </li>
            <li>
              구독 결제 후 7일이 경과하였거나 서비스를 이용한 경우, 잔여 기간에
              대해 일할 계산하여 환불됩니다.
            </li>
            <li>
              크레딧 충전은 구매일로부터 90일간 유효하며, 만료된 크레딧은 환불
              대상이 아닙니다.
            </li>
            <li>
              환불 요청은 계정 설정 또는 관리자 이메일을 통해 접수할 수 있습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제7조 (구독 해지)
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
              유지됩니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제8조 (저작권)
          </h2>
          <p>
            AI가 생성한 교안의 저작권은 이를 생성한 이용자에게 귀속됩니다. 다만,
            서비스는 서비스 개선 목적으로 익명화된 생성 데이터를 활용할 수
            있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제9조 (면책 조항)
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
              외부 서비스(Google, Vercel, GCP)로 인한 서비스 중단에 대해 책임을
              지지 않습니다.
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
            제10조 (서비스 변경 및 중단)
          </h2>
          <p>
            서비스는 사전 고지 후 서비스 내용을 변경하거나 중단할 수 있습니다.
            긴급한 경우에는 사후에 고지할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제11조 (준거법 및 관할)
          </h2>
          <p>
            본 약관의 해석 및 적용에 관하여는 대한민국 법률을 준거법으로 합니다.
            서비스 이용과 관련하여 분쟁이 발생하는 경우 서울중앙지방법원을
            전속관할 법원으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제12조 (약관 변경)
          </h2>
          <p>
            본 약관의 변경 사항은 시행일 최소 7일 전에 서비스 내에서 공지합니다.
            변경된 약관에 동의하지 않는 이용자는 서비스 이용을 중단할 수
            있습니다.
          </p>
          <p className="mt-4 text-sm text-gray-500">시행일: 2026년 3월 7일</p>
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
