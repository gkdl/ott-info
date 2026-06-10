// ─── 욕설·스팸 사전 필터 (클라이언트 1차) ────────────────────────────────────
// DB 트리거(2차)와 이중으로 동작. 클라이언트에서 먼저 차단해 불필요한 네트워크
// 왕복을 줄이고, DB 트리거가 최종 게이트키퍼 역할을 수행한다.
//
// 실무 확장 시: 이 목록을 Edge Function + 외부 욕설 필터 API(예: Perspective API)로
// 교체하면 더 정확한 필터링 가능. 현재는 기본 패턴 기반 오프라인 필터.

// 한국어 욕설 기본 패턴 (정규식 — 실제 서비스에서는 더 광범위한 목록 필요)
const BLOCKED_PATTERNS: RegExp[] = [
  /시\s*발/,
  /씨\s*발/,
  /ㅅ\s*ㅂ/,
  /병\s*신/,
  /ㅂ\s*ㅅ/,
  /개\s*새\s*끼/,
  /ㄱ\s*ㅅ\s*ㄲ/,
  /지\s*랄/,
  /ㅈ\s*ㄹ/,
  /미\s*친/,
  /fuck/i,
  /shit/i,
  /asshole/i,
];

// 스팸 패턴: 동일 문자 5회 이상 반복, URL 도배
const SPAM_PATTERNS: RegExp[] = [
  /(.)\1{4,}/,           // 같은 문자 5회 이상 반복 (예: ㅋㅋㅋㅋㅋ는 허용 but 더 엄격히 조정 가능)
  /(https?:\/\/\S+\s*){2,}/i,  // URL 2개 이상
];

export interface FilterResult {
  passed: boolean;
  reason?: "profanity" | "spam";
}

export function filterContent(text: string): FilterResult {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(normalized)) {
      return { passed: false, reason: "profanity" };
    }
  }

  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(normalized)) {
      return { passed: false, reason: "spam" };
    }
  }

  return { passed: true };
}

export const FILTER_MESSAGES: Record<NonNullable<FilterResult["reason"]>, string> = {
  profanity: "부적절한 표현이 포함되어 있습니다. 수정 후 다시 시도해주세요.",
  spam: "스팸으로 감지된 내용이 포함되어 있습니다.",
};
