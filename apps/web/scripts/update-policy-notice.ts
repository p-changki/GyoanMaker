/**
 * Update script: Fix refund policy in the policy notice post.
 * Run: npx tsx apps/web/scripts/update-policy-notice.ts
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

const DOC_ID = "lPEq5GYnhyuwaKitnioR";

const UPDATED_CONTENT = `<h2>요금제 안내 및 환불 정책</h2>
<p>교안메이커의 요금제와 환불 규정을 안내드립니다.</p>

<h3>요금제 안내</h3>
<p>교안메이커는 <strong>4가지 요금제</strong>를 제공합니다.</p>
<ul>
<li><strong>무료 (Free)</strong> — 기본 기능 체험, 월 제한 횟수 제공</li>
<li><strong>베이직 (Basic)</strong> — 소규모 사용에 적합</li>
<li><strong>스탠다드 (Standard)</strong> — 중규모 사용, 더 많은 생성 횟수</li>
<li><strong>프로 (Pro)</strong> — 대규모 사용, 최대 생성 횟수 + 우선 지원</li>
</ul>
<p>각 요금제의 상세 내용과 가격은 <a href="/pricing" target="_blank"><strong>요금제 페이지</strong></a>에서 확인하실 수 있습니다.</p>

<h3>환불 정책 요약</h3>
<p>아래는 환불 규정의 핵심 내용입니다. 전문은 <a href="/terms" target="_blank"><strong>이용약관 제8조</strong></a>를 참고해 주세요.</p>

<h4>1. 플랜 이용권 환불</h4>
<ul>
<li>결제 후 <strong>7일 이내</strong> + 서비스 미이용 → <strong>전액 환불</strong></li>
<li>결제 후 7일 경과 또는 서비스 이용 시 → <strong>환불 불가</strong></li>
</ul>

<h4>2. 크레딧 환불</h4>
<ul>
<li>충전 후 <strong>7일 이내</strong> + 미사용 → <strong>전액 환불</strong></li>
<li>7일 경과 또는 일부 사용 시 → <strong>환불 불가</strong></li>
<li>유효기간 만료 크레딧은 환불 불가</li>
</ul>

<h4>3. 플랜 만료 안내</h4>
<ul>
<li>유료 플랜은 결제일 기준 <strong>30일 이용권</strong>으로 제공됩니다.</li>
<li>이용권 만료 후 재결제하지 않으면 <strong>무료 플랜으로 자동 전환</strong>됩니다.</li>
</ul>

<hr>
<p><strong>환불 요청 방법:</strong> 관리자 이메일 <strong>dnsxj12345aa@gmail.com</strong>으로 문의해 주세요.</p>
<p>환불은 요청일로부터 <strong>영업일 기준 7~14일 이내</strong>에 처리됩니다.</p>
<p>자세한 내용은 <a href="/terms" target="_blank"><strong>이용약관 전문</strong></a>을 확인해 주세요.</p>`;

async function main() {
  await db.collection("posts").doc(DOC_ID).update({
    content: UPDATED_CONTENT,
    updatedAt: new Date().toISOString(),
  });

  console.log(`Policy notice updated: ${DOC_ID}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
