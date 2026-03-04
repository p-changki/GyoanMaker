import LandingCta from "@/components/landing/LandingCta";

export default function LandingPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#f0f4ff] via-[#f8f9fc] to-[#eef2ff] py-24 sm:py-32">
        <div className="mx-auto max-w-[1100px] px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-8">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>AI</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            AI 기반 교안 자동 생성
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
            영어 지문 분석부터
            <br />
            <span className="text-blue-600">교안 출력까지, 한 번에</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            영어 지문을 입력하면 AI가 문장 분석, 핵심 어휘, 요약까지 자동으로
            생성합니다. 인쇄용 PDF로 바로 출력하세요.
          </p>
          <div className="mt-10">
            <LandingCta />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="mx-auto max-w-[1100px] px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              핵심 기능
            </h2>
            <p className="mt-4 text-gray-500 text-lg">
              교안 제작에 필요한 모든 것을 AI가 처리합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white border border-gray-200/60 rounded-[2rem] p-8 shadow-premium space-y-4 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>지문 분석</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">지문 분석</h3>
              <p className="text-gray-500 leading-relaxed">
                영어 지문의 문장별 한영 대조 번역과 주제문을 자동으로
                식별합니다.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-gray-200/60 rounded-[2rem] p-8 shadow-premium space-y-4 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>어휘 생성</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                핵심 어휘 & 요약
              </h3>
              <p className="text-gray-500 leading-relaxed">
                B2/C1 수준 핵심 어휘의 동의어·반의어와 지문 요약을 자동
                생성합니다.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-gray-200/60 rounded-[2rem] p-8 shadow-premium space-y-4 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>PDF 출력</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">PDF 출력</h3>
              <p className="text-gray-500 leading-relaxed">
                학원 형식에 맞는 인쇄용 교안을 PDF로 바로 다운로드합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 sm:py-24 bg-gradient-to-b from-[#f8f9fc] to-white">
        <div className="mx-auto max-w-[1100px] px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              사용 방법
            </h2>
            <p className="mt-4 text-gray-500 text-lg">
              3단계로 교안을 완성하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-700 text-2xl font-extrabold">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900">지문 입력</h3>
              <p className="text-gray-500">
                영어 지문을 텍스트로 붙여넣거나 카드 형태로 개별 입력합니다.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 text-2xl font-extrabold">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900">AI 분석</h3>
              <p className="text-gray-500">
                AI가 문장 분석, 어휘 추출, 요약, 글의 흐름까지 자동으로
                생성합니다.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 text-2xl font-extrabold">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900">편집 & 출력</h3>
              <p className="text-gray-500">
                결과를 확인하고 인라인 편집 후 인쇄용 PDF로 다운로드합니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
