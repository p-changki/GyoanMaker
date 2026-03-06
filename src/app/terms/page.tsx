export const metadata = {
  title: "이용약관 | 교안 생성기",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 py-12">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">이용약관</h1>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">제1조 (목적)</h2>
          <p>
            본 약관은 교안 생성기(이하 &quot;서비스&quot;)의 이용 조건 및 절차에
            관한 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제2조 (서비스 범위)
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>AI 기반 영어 교안 자동 생성</li>
            <li>생성된 교안의 인라인 편집</li>
            <li>인쇄용 PDF 출력</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제3조 (이용 자격)
          </h2>
          <p>
            서비스는 Google 계정으로 로그인한 후, 관리자의 승인을 받은 사용자만
            이용할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제4조 (사용 제한)
          </h2>
          <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>서비스를 이용한 교안의 상업적 재판매</li>
            <li>자동화된 도구를 이용한 대량 요청</li>
            <li>서비스의 정상 운영을 방해하는 행위</li>
            <li>타인의 계정을 도용하는 행위</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제5조 (저작권)
          </h2>
          <p>
            AI가 생성한 교안의 저작권은 해당 교안을 생성한 이용자에게
            귀속됩니다. 다만, 서비스 개선을 위해 비식별 통계 목적으로 생성
            데이터를 활용할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">제6조 (면책)</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              AI가 생성한 결과물의 정확성, 완전성을 보장하지 않습니다. 이용자는
              생성된 교안을 검토 후 사용해야 합니다.
            </li>
            <li>
              서비스 이용 중 발생한 데이터 손실에 대해 책임지지 않습니다. 중요한
              교안은 별도로 저장해 주세요.
            </li>
            <li>
              외부 서비스(Google, Vercel, GCP)의 장애로 인한 서비스 중단에 대해
              책임지지 않습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제7조 (서비스 변경 및 중단)
          </h2>
          <p>
            서비스는 사전 공지 후 내용을 변경하거나 중단할 수 있습니다. 긴급한
            경우 사후 공지할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            제8조 (약관 변경)
          </h2>
          <p>
            약관이 변경되는 경우 시행일 7일 전 서비스 내 공지합니다. 변경된
            약관에 동의하지 않는 경우 서비스 이용을 중단할 수 있습니다.
          </p>
          <p className="mt-4 text-sm text-gray-500">시행일: 2026년 3월 6일</p>
        </section>
      </div>
    </div>
  );
}
