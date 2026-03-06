export const metadata = {
  title: "개인정보처리방침 | 교안 생성기",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 py-12">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
        개인정보처리방침
      </h1>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            1. 수집하는 개인정보 항목
          </h2>
          <p>서비스는 Google OAuth 로그인을 통해 아래 정보를 수집합니다.</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Google 계정 이름</li>
            <li>이메일 주소</li>
            <li>프로필 사진 URL</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. 수집 목적</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>서비스 이용자 식별 및 인증</li>
            <li>접근 권한 관리 (관리자 승인제)</li>
            <li>서비스 이용 통계 (비식별 처리)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. 보관 기간</h2>
          <p>
            수집된 개인정보는 회원 탈퇴 요청 시 지체 없이 파기합니다. 관련
            법령에 의해 보존이 필요한 경우 해당 기간 동안 별도 보관합니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            4. 제3자 제공
          </h2>
          <p>
            수집된 개인정보는 제3자에게 제공하지 않습니다. 다만, 법령에 의한
            요청이 있는 경우 예외로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. 처리 위탁</h2>
          <table className="w-full border-collapse border border-gray-200 text-sm mt-2">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-2 text-left font-semibold">
                  위탁 업체
                </th>
                <th className="border border-gray-200 px-4 py-2 text-left font-semibold">
                  위탁 업무
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 px-4 py-2">
                  Vercel Inc.
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  웹 애플리케이션 호스팅
                </td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-4 py-2">
                  Google Cloud Platform
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  AI API 처리 및 데이터 저장 (Firestore)
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            6. 정보주체의 권리
          </h2>
          <p>이용자는 언제든지 아래 권리를 행사할 수 있습니다.</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>개인정보 열람 요청</li>
            <li>개인정보 수정 요청</li>
            <li>개인정보 삭제 (회원 탈퇴) 요청</li>
          </ul>
          <p className="mt-2">
            위 요청은 서비스 내 문의 또는 관리자 이메일을 통해 접수할 수
            있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            7. 개인정보의 안전성 확보 조치
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>모든 통신은 HTTPS(TLS)로 암호화</li>
            <li>접근 권한 최소화 (관리자 승인제)</li>
            <li>인증 토큰(JWT) 기반 세션 관리</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. 방침 변경</h2>
          <p>본 방침이 변경되는 경우 시행일 7일 전 서비스 내 공지합니다.</p>
          <p className="mt-4 text-sm text-gray-500">시행일: 2026년 3월 6일</p>
        </section>
      </div>
    </div>
  );
}
