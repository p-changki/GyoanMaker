export const metadata = {
  title: "개인정보처리방침 | GyoanMaker",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 py-12">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
        개인정보처리방침
      </h1>

      <p className="text-gray-700 leading-relaxed mb-10">
        박창기(GyoanMaker)는 정보주체의 자유와 권리 보호를 위해
        「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여, 적법하게
        개인정보를 처리하고 안전하게 관리하고 있습니다. 이에 「개인정보
        보호법」 제30조에 따라 정보주체에게 개인정보의 처리와 보호에 관한
        절차 및 기준을 안내하고, 이와 관련한 고충을 신속하고 원활하게 처리할
        수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을
        수립·공개합니다.
      </p>

      <div className="space-y-10 text-gray-700 leading-relaxed">
        {/* 1. 수집 항목, 목적, 보유기간 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            1. 개인정보의 처리 목적, 수집 항목, 보유 및 이용기간
          </h2>
          <p className="mb-3">
            GyoanMaker는 「개인정보 보호법」에 따라 서비스 제공을 위해 필요
            최소한의 범위에서 개인정보를 수집·이용합니다.
          </p>

          <h3 className="font-semibold text-gray-800 mb-2">
            가. 정보주체의 동의를 받지 않고 처리하는 개인정보
          </h3>
          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse border border-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                    법적 근거
                  </th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                    처리 목적
                  </th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                    처리 항목
                  </th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                    보유기간
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">
                    개인정보보호법 제15조제1항제4호
                    <br />
                    (계약 이행)
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    이용자 식별 및 인증, 접근 권한 관리
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    Google 계정 이름, 이메일 주소, 프로필 사진 URL
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    회원 탈퇴 시까지
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-semibold text-gray-800 mb-2">
            나. 서비스 이용 과정에서 자동으로 수집되는 개인정보
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                    구분
                  </th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                    처리 목적
                  </th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                    처리 항목
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">
                    접속 정보
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    서비스 안정성 확보 및 보안
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    IP 주소, 브라우저 종류, 접속 일시
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">
                    이용 내역
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    서비스 이용 통계 (익명화 처리)
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    교안 생성 횟수, 모델 사용 이력
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 2. 만 14세 미만 아동 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            2. 만 14세 미만 아동의 개인정보 처리
          </h2>
          <p>
            GyoanMaker는 만 14세 미만 아동의 개인정보를 수집하지 않으며,
            만 14세 미만의 이용자는 법정대리인의 동의 없이 서비스를 이용할 수
            없습니다. 만 14세 미만 아동의 개인정보가 수집된 사실이 확인되는
            경우, 해당 정보를 지체 없이 파기합니다.
          </p>
        </section>

        {/* 3. 제3자 제공 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            3. 개인정보의 제3자 제공
          </h2>
          <p>
            수집된 개인정보는 법령에 의한 경우를 제외하고 제3자에게 제공하지
            않습니다.
          </p>
        </section>

        {/* 4. 처리위탁 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            4. 개인정보 처리업무의 위탁
          </h2>
          <p className="mb-2">
            GyoanMaker는 원활한 개인정보 업무처리를 위하여 다음과 같이
            개인정보 처리업무를 위탁하고 있습니다.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left font-semibold">
                    위탁받는 자 (수탁자)
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
                <tr>
                  <td className="border border-gray-200 px-4 py-2">
                    토스페이먼츠(TossPayments)
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    결제 처리 및 정산
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm">
            위탁업무의 내용이나 수탁자가 변경될 경우에는 지체 없이 본
            개인정보 처리방침을 통하여 공개하겠습니다.
          </p>
        </section>

        {/* 5. 국외 이전 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            5. 개인정보의 국외 이전
          </h2>
          <p className="mb-2">
            GyoanMaker는 서비스 제공을 위해 수집한 개인정보를 아래와 같이
            국외에 이전하고 있으며, 「개인정보 보호법」 제28조의8제2항에 따라
            안내합니다. 국외 이전을 원치 않을 경우 계정 설정에서 회원 탈퇴를
            진행하거나 dnsxj12345aa@gmail.com으로 요청할 수 있습니다.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                    이전받는 자
                  </th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                    이전 국가
                  </th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                    이용 목적
                  </th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                    이전 항목
                  </th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                    보유기간
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">
                    Vercel Inc.
                  </td>
                  <td className="border border-gray-200 px-3 py-2">미국</td>
                  <td className="border border-gray-200 px-3 py-2">
                    웹 호스팅
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    접속 로그, 쿠키
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    서비스 이용 기간
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-3 py-2">
                    Google Cloud Platform
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    미국 등
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    AI 처리 및 데이터 저장 (데이터 센터는 미국 등
                    해외에 위치할 수 있음)
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    이메일, 이름, 교안 데이터
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    회원 탈퇴 시까지
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 6. 파기 절차 및 방법 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            6. 개인정보의 파기 절차 및 방법
          </h2>
          <p className="mb-2">
            GyoanMaker는 개인정보 보유기간의 경과, 처리목적 달성 등
            개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를
            파기합니다.
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <span className="font-semibold">파기절차:</span> 파기 사유가
              발생한 개인정보를 선정하고, 개인정보 보호책임자의 확인을 거쳐
              파기합니다.
            </li>
            <li>
              <span className="font-semibold">파기방법:</span> 전자적 파일
              형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록
              파기합니다.
            </li>
          </ul>
          <p className="mt-2">
            계정 삭제 시 생성된 교안 데이터 및 관련 정보는 즉시 삭제됩니다.
            서비스 운영 목적의 통계 데이터는 익명화 처리되어 보존될 수
            있습니다.
          </p>
        </section>

        {/* 7. 쿠키 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            7. 개인정보 자동 수집 장치의 설치·운영 및 거부
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              서비스는 인증 목적의 세션 쿠키(next-auth)를 사용하며,
              유효기간은 최대 30일입니다.
            </li>
            <li>마케팅 또는 광고 목적의 쿠키는 사용하지 않습니다.</li>
            <li>
              이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이
              경우 서비스 이용이 제한될 수 있습니다.
            </li>
          </ul>
          <div className="mt-3 text-sm text-gray-600">
            <p className="font-semibold mb-1">쿠키 차단 방법:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Chrome: 오른쪽 상단 ⋮ → 설정 → 개인정보 보호 및 보안 →
                서드파티 쿠키 차단
              </li>
              <li>
                Edge: 오른쪽 상단 … → 설정 → 쿠키 및 사이트 권한 → 타사
                쿠키 차단
              </li>
              <li>Safari: 설정 → Safari → 고급 → 모든 쿠키 차단</li>
            </ul>
          </div>
        </section>

        {/* 8. AI 데이터 처리 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            8. AI 데이터 처리
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              교안 생성을 위해 이용자가 입력한 영어 지문은 Google Gemini
              API로 전송됩니다.
            </li>
            <li>
              전송된 입력 텍스트는 서비스 서버에 별도 보관하지 않으며, AI
              응답 처리 후 즉시 폐기됩니다.
            </li>
            <li>
              Google Gemini API 이용약관에 따라 입력 데이터는 모델 학습에
              사용되지 않습니다.
            </li>
          </ul>
        </section>

        {/* 9. 정보주체 권리 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            9. 정보주체와 법정대리인의 권리·의무 및 행사방법
          </h2>
          <p className="mb-2">
            정보주체는 GyoanMaker에 대해 언제든지 개인정보
            열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다.
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <span className="font-semibold">서비스 내 행사:</span> 계정
              설정 페이지에서 개인정보 조회·수정·삭제(계정 삭제) 가능
            </li>
            <li>
              <span className="font-semibold">이메일 행사:</span>{" "}
              dnsxj12345aa@gmail.com 으로 열람 등 요구 가능
            </li>
          </ul>
          <p className="mt-2">
            권리 행사는 「개인정보 보호법 시행령」 제41조제1항에 따라 서면,
            전자우편 등을 통하여 하실 수 있으며, GyoanMaker는 이에 대해 지체
            없이 조치하겠습니다.
          </p>
        </section>

        {/* 10. 안전성 확보조치 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            10. 개인정보의 안전성 확보조치
          </h2>
          <p className="mb-2">
            GyoanMaker는 개인정보의 안전성 확보를 위해 다음과 같은 조치를
            취하고 있습니다.
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <span className="font-semibold">기술적 조치:</span> 모든 통신
              HTTPS(TLS) 암호화, JWT 기반 세션 관리, 접근통제시스템 운영
            </li>
            <li>
              <span className="font-semibold">관리적 조치:</span> 최소한의
              접근 권한 부여 (관리자 승인 시스템), 개인정보 접근 권한 제한
            </li>
          </ul>
        </section>

        {/* 11. 개인정보 보호책임자 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            11. 개인정보 보호책임자 및 고충처리
          </h2>
          <p className="mb-2">
            GyoanMaker는 개인정보 처리에 관한 업무를 총괄해서 책임지고,
            개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을
            위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm mb-4">
            <p className="font-semibold text-gray-800">
              개인정보 보호책임자
            </p>
            <p>성명: 박창기</p>
            <p>직책: 운영자</p>
            <p>연락처: dnsxj12345aa@gmail.com</p>
          </div>
          <p className="mb-2">
            정보주체는 개인정보침해로 인한 구제를 받기 위하여 아래 기관에
            분쟁해결이나 상담 등을 신청할 수 있습니다.
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>
              개인정보 분쟁조정위원회: (국번없이) 1833-6972
              (www.kopico.go.kr)
            </li>
            <li>
              개인정보침해 신고센터: (국번없이) 118 (privacy.kisa.or.kr)
            </li>
            <li>대검찰청: (국번없이) 1301 (www.spo.go.kr)</li>
            <li>경찰청: (국번없이) 182 (ecrm.police.go.kr)</li>
          </ul>
        </section>

        {/* 12. 방침 변경 */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            12. 개인정보 처리방침의 변경
          </h2>
          <p>
            본 방침의 변경 사항은 시행일 최소 7일 전에 서비스 내에서
            공지합니다.
          </p>
          <p className="mt-4 text-sm text-gray-500">시행일: 2026년 3월 7일</p>
        </section>
      </div>
    </div>
  );
}
