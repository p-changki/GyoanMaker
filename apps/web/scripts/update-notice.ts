/**
 * Update the existing notice post with free tier info.
 * Run: npx tsx apps/web/scripts/update-notice.ts
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

import admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase credentials in .env.local");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

const db = admin.firestore();

const UPDATED_CONTENT = `<h2>교안메이커에 오신 것을 환영합니다!</h2>
<p>교안메이커는 <strong>AI 기반 영어 교안 자동 생성 서비스</strong>입니다.</p>
<p>영어 지문을 입력하면 <strong>문장 분석, 핵심 어휘, 요약, 논리 흐름</strong>을 자동으로 생성하고, 맞춤형 PDF 교안으로 내보낼 수 있습니다.</p>

<h3>주요 기능</h3>
<ul>
<li><strong>AI 교안 생성</strong> — 지문 입력만으로 완성도 높은 교안 자동 생성</li>
<li><strong>난이도 선택</strong> — 기본(A2~B1) / 심화(B2~C1) 맞춤 설정</li>
<li><strong>AI 일러스트</strong> — 지문에 맞는 일러스트를 AI로 생성하여 교안에 삽입</li>
<li><strong>템플릿 스튜디오</strong> — 글꼴, 색상, 레이아웃을 커스터마이징</li>
<li><strong>단어 테스트</strong> — 교안 핵심 어휘로 유의어 5지선다 시험지 자동 생성</li>
<li><strong>PDF 내보내기</strong> — 인쇄용 PDF로 교안과 시험지를 다운로드</li>
</ul>

<h3>무료 체험으로 직접 사용해 보세요!</h3>
<p>교안메이커는 <strong>무료 플랜(프리 티어)</strong>을 제공합니다. 결제 없이 바로 시작할 수 있어요.</p>
<ul>
<li>빠른 모드 지문 <strong>10개/월</strong>, 정밀 모드 지문 <strong>5개/월</strong></li>
<li>AI 일러스트 삽입 <strong>5회/월</strong></li>
<li>교안 저장 <strong>최대 3개</strong></li>
<li>PDF 다운로드 + 단어 테스트 <strong>무제한</strong></li>
</ul>
<p>회원가입 후 바로 교안을 만들어 보세요! 신용카드 등록 없이 체험 가능합니다.</p>

<hr>

<h3>무료 샘플 교안을 받아보세요!</h3>
<p>직접 만들어 보기 전에 결과물을 먼저 확인하고 싶으신가요?</p>
<p><strong>비밀글</strong>로 아래 내용을 작성해 주시면, 샘플 교안을 이메일로 보내드립니다.</p>
<p>지문이 없으셔도 괜찮아요! <strong>미리 제작된 샘플</strong>을 보내드릴 수 있으니, 부담 없이 요청해 주세요.</p>

<blockquote>
<strong>샘플 요청 방법</strong><br>
1. 게시판에서 "글쓰기" 버튼을 눌러주세요.<br>
2. 비밀글로 작성해 주세요 (비밀번호 4자리 설정).<br>
3. 제목에 "샘플 요청"이라고 적어주세요.<br>
4. 원하시는 영어 지문이 있다면 내용에 붙여넣어 주세요 (없으면 미리 제작된 샘플을 보내드립니다).<br>
5. 회신 이메일은 자동으로 입력됩니다 (변경 가능).
</blockquote>

<h3>제공되는 샘플</h3>
<ul>
<li>기본 난이도(A2~B1) 교안 + AI 일러스트 적용 — 1부</li>
<li>심화 난이도(B2~C1) 교안 + AI 일러스트 적용 — 1부</li>
<li>단어 테스트 시험지(유의어 5지선다) + 답안지 — 1부</li>
</ul>
<p>총 <strong>3종 세트</strong>를 PDF로 제작하여 보내드립니다.</p>

<hr>
<p>문의 및 샘플 요청: <strong>dnsxj12345aa@gmail.com</strong></p>
<p>감사합니다!</p>`;

async function main() {
  // Find the existing notice
  const snapshot = await db
    .collection("posts")
    .where("type", "==", "notice")
    .where("pinned", "==", true)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.error("No notice post found. Run seed-notice.ts first.");
    process.exit(1);
  }

  const doc = snapshot.docs[0];
  await doc.ref.update({
    content: UPDATED_CONTENT,
    replyEmail: null,
    updatedAt: new Date().toISOString(),
  });

  console.log(`Notice updated: ${doc.id}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
