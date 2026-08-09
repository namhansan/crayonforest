/**
 * 크레용숲 백엔드 (v3 — 성장일지 조회 기능 추가)
 * ------------------------------------------------
 * 이 코드는 아래 4가지를 처리합니다.
 * 1) 수강신청 저장 (action=register)
 * 2) 방문자수 카운트 (action=visit) — 오늘/누적 숫자와 별도로, 날짜별 방문수를
 *    "방문통계" 시트 탭에 자동으로 기록합니다. 시트는 처음 방문이 발생할 때
 *    자동으로 만들어지며, 별도 설정이 필요 없습니다. 이 시트는 스프레드시트
 *    소유자만 볼 수 있어서, 그날 확인 못한 방문수도 나중에 언제든 열어서
 *    지난 추이를 확인할 수 있습니다.
 * 3) 관리자용 신청 목록 조회 (action=registrations)
 * 4) 부모용 성장일지 조회 (action=journal) — 이름 + 전화번호 뒷4자리가
 *    정확히 일치하는 아이의 기록만 골라서 돌려줍니다. 스프레드시트 전체를
 *    공개하지 않고, 서버(Apps Script)에서 필터링한 결과만 내려주기 때문에
 *    다른 아이의 정보는 노출되지 않습니다.
 *
 * 사용법은 기존과 동일합니다.
 * 1) 구글 스프레드시트 > 확장 프로그램 > Apps Script
 * 2) 기존 코드 전부 지우고 이 내용 붙여넣기 → 저장
 * 3) 배포 > 배포 관리 > 연필 아이콘 > 새 버전으로 배포 (URL은 안 바뀝니다)
 *
 * 성장일지 시트 준비:
 * 스프레드시트에 "성장일지"라는 이름의 시트 탭을 만들고,
 * 첫 줄(헤더)에 다음 열들을 순서대로 넣어주세요 (순서는 상관없어요, 코드가
 * 이름으로 찾아가요 — 아래는 참고용 나열입니다):
 * 이름 | 전화번호뒷4자리 | 학기 | 월 | 작품제목 | 사진1URL | 사진2URL | 사진3URL | 사진4URL |
 * 수업전마음색 | 수업전 마음 한 줄 | 수업후마음색 | 수업후 마음 한 줄 |
 * 자신을 나타내는 색 | 선택색상1순위 | 선택색상2순위 | 선택색상3순위 | 수업전색상톤 | 수업후색상톤 |
 * 감정,성장키워드 | 몰입도 | 사용재료 | 재료선택의 경향 |
 * 미술능력 | 미술능력근거 | 마음의 능력 | 마음의 능력근거 |
 * 재료의 효과 | 관찰노트 | 이번 회차 목표/주제 | 그림 스타일 특징 | 목표행동 태그
 *
 * "수업전마음색"/"수업후마음색"과 "수업전색상톤"/"수업후색상톤"은 모두 아이의
 * "마음 상태"를 색으로 표현한 거예요 — 작품 만들 때 고른 "선택색상1~3순위"(작품색)와는
 * 다를 수도, 같을 수도 있어요. 색상톤은 항상 마음색의 톤(deep/vivid/pastel)이고,
 * 작품색 자체에는 별도의 톤 값이 없어요.
 *
 * "미술능력"은 다음 9개 중 하나를 그대로 적어주세요 (한 회차에 하나):
 * 집중,지속력 / 언어표현 / 관계,소통력 / 표현기술,조형력 / 탐구,관찰력 /
 * 발상,창의력 / 조화감각,색채력 / 문제해결,도전력 / 응용,표현전개력
 * "마음의 능력"은 다음 5개 중 하나를 그대로 적어주세요 (한 회차에 하나):
 * 마음 알아차림 / 마음표현 / 마음조절 / 마음믿기 / 마음나누기
 * "미술능력근거"/"마음의 능력근거"는 왜 그 능력을 골랐는지 짧은 관찰 문장을
 * 적는 자유 텍스트 칸이에요 (예: "친구와 색을 나눠 쓰며 협동했어요"). 이 문장들은
 * 종합요약의 능력 바퀴 아래 "회차별 근거 장면"에 그대로 모여서 보여져요.
 *
 * 이 두 능력 칸은 회차마다 하나씩 쌓여서, 6개월 종합요약에서 9각형(미술능력) /
 * 5각형(마음의 능력) 성장 바퀴로 자동 집계돼요. teacher-entry.html에서
 * 입력하면 드롭다운으로 골라서 넣을 수 있어서 오타 걱정이 없어요.
 *
 * 사진3URL/사진4URL, 수업전마음색/수업전 마음 한 줄/수업후마음색/수업후 마음 한 줄, 회차목표/스타일특징/목표행동태그는
 * 전부 선택 입력이에요 — 안 적어도 카드에 그냥 안 보일 뿐 문제없이 동작합니다.
 * "목표행동 태그"는 감정키워드처럼 쉼표로 여러 개 적으면 돼요 (예: 집중력, 협동, 자기표현).
 * "수업전마음색"/"수업후마음색"은 "선택색상1순위"와 같은 19개 색상 이름을 그대로 적으면 돼요.
 *
 * 헤더 이름은 띄어쓰기 차이(예: "감정,성장키워드" vs "감정, 성장키워드")는 자동으로
 * 무시하고 찾아가지만, 단어 자체가 바뀌면(예: "선택색상1" ↔ "선택색상1순위") 코드가
 * 그 열을 못 찾게 되니, 아래 코드 안의 이름과 실제 시트 헤더가 정확히 같은 단어인지
 * 한 번 확인해주세요.
 *
 * 색상/색상톤/미술능력/마음의 능력/재료의 효과 열은 드롭다운으로 선택할 수 있게
 * 만들어두는 걸 추천해요 — 이 파일 안의 setupJournalDropdowns() 함수를 Apps Script
 * 편집기에서 한 번만 실행하면 자동으로 걸립니다. (자세한 설명은 해당
 * 함수 위 주석 참고)
 *
 * (선택) 종합 요약 시트 준비 — 6개월 마지막에 한 번만 작성:
 * "성장요약"이라는 이름의 시트 탭을 만들고, 첫 줄에 다음 20개를 순서대로 넣어주세요:
 * 이름 | 전화번호뒷4자리 | 강점 | 성장방향 | 표현_전 | 표현_후 | 색채_전 | 색채_후 | 심리_전 | 심리_후 | 사고_전 | 사고_후 | 눈에띄는성장 | 공개여부 |
 * 한줄요약(직접입력) | 양육힌트(직접입력) | 요약범위시작 | 요약범위끝 | 꽃밭샘피드백 | 숨김섹션
 *
 * "요약범위시작"/"요약범위끝"과 "꽃밭샘피드백"/"숨김섹션"은 전부 teacher-entry.html
 * (선생님 화면)에서 조작하면 자동으로 채워져요 — 손으로 직접 안 쓰셔도 됩니다.
 * "숨김섹션"은 콤마로 구분된 값(예: "colorJourney,keywordCloud")이 들어가요.
 *
 * 마지막 2개(한줄요약/양육힌트 직접입력)는 선택 입력이에요. 성장카르테 화면의
 * "성장 한 줄 요약"과 "양육 힌트"는 원래 성장일지 데이터로 자동 생성되는데,
 * 이 2칸에 직접 문장을 써넣으면 그게 자동 생성된 것 대신 화면에 나와요.
 * 비워두면 지금처럼 자동 생성된 내용이 계속 나옵니다. "양육힌트(직접입력)"에
 * 여러 줄을 쓰고 싶으면 셀 안에서 줄바꿈(Alt+Enter)으로 구분해주세요 — 한 줄씩
 * 하나의 힌트 항목으로 나와요.
 *
 * "공개여부" 열은 체크박스로 만들어주세요 (열 선택 후 삽입 > 체크박스).
 * 월별 성장일지 기록은 언제나 그대로 보입니다. "공개여부"를 체크해야 보이는 건
 * 맨 마지막의 "종합 요약" 부분(색채 차트+강점+성장방향)뿐입니다 — 체크 전에는
 * 그 부분만 화면에서 생략되고, 체크하면 그때부터 나타납니다.
 * (선택) 능력 성장단계 시트 준비 — 횟수(빈도)와 성장단계(질적 판단)를 분리해서 관리:
 * "능력성장단계"라는 이름의 시트 탭을 만들고, 첫 줄에 다음 7개를 순서대로 넣어주세요:
 * 이름 | 전화번호뒷4자리 | 능력유형 | 능력명 | 단계 | 판단근거 | 업데이트일시
 *
 * 이 시트는 teacher-entry.html의 "능력 성장단계" 탭에서 자동으로 만들고 채워줘서
 * 손으로 직접 만들지 않아도 됩니다. 왜 이 시트가 따로 필요한지 설명하면:
 *
 * "미술능력"/"마음의 능력" 열은 회차마다 하나씩 쌓이는 "관찰 빈도" 데이터예요.
 * 그런데 몇 번 관찰됐는지(빈도)와 그 힘을 얼마나 깊이 있게 쓰는지(성장 단계)는
 * 서로 다른 질문이에요 — 예를 들어 응용·전개력이 10번, 문제해결·도전력이 5번
 * 나왔다고 응용·전개력이 "두 배로 성장했다"고 볼 수는 없어요. 그래서 이 시트는
 * 능력마다 별도로 "1단계 발견중 / 2단계 시도중 / 3단계 확장중 / 4단계 자기화중"
 * 판정을 저장해요 — 선생님이 회차별 근거 문장(미술능력근거/마음의 능력근거)들을
 * 직접 읽고 판단하거나, "AI 해석 요청" 버튼으로 도움을 받아 판단할 수 있어요.
 *
 * (AI 해석 기능을 쓰려면 구글 Gemini API 키가 필요해요 — https://aistudio.google.com/apikey
 * 에서 구글 계정으로 무료로 발급받을 수 있고, 카드 등록이 필요 없어요. 무료 사용량 한도
 * 안에서는 요금이 청구되지 않아요. 발급받은 키를 Apps Script 편집기 > 프로젝트 설정 >
 * 스크립트 속성에서 GEMINI_API_KEY 라는 이름으로 등록해주세요. 등록 안 해도 나머지
 * 기능은 전부 정상 동작하고, AI 해석 버튼만 안내 메시지가 떠요.)
 */

const SHEET_NAME = '수강신청';
const JOURNAL_SHEET_NAME = '성장일지';
const SUMMARY_SHEET_NAME = '성장요약';
const VISIT_SHEET_NAME = '방문통계';
const ABILITY_STAGE_SHEET_NAME = '능력성장단계';

function doGet(e) {
  const action = e.parameter.action;

  if (action === 'register') return jsonOutput(saveRegistration(e.parameter));
  if (action === 'visit') return jsonOutput(recordVisit());
  if (action === 'registrations') return jsonOutput(getRegistrations());
  if (action === 'visitCount') return jsonOutput(getVisitCounts());
  if (action === 'journal') return jsonOutput(getJournal(e.parameter.name, e.parameter.phone4));
  if (action === 'saveSummaryRange') return jsonOutput(saveSummaryRange(e.parameter.name, e.parameter.phone4, e.parameter.from, e.parameter.to));
  if (action === 'saveSectionVisibility') return jsonOutput(saveSectionVisibility(e.parameter.name, e.parameter.phone4, e.parameter.hiddenSections));
  if (action === 'addJournalEntry') return jsonOutput(addJournalEntry(e.parameter));
  if (action === 'updateJournalEntry') return jsonOutput(updateJournalEntry(e.parameter));
  if (action === 'summaryForEdit') return jsonOutput(getSummary(e.parameter.name, e.parameter.phone4) || {});
  if (action === 'saveSummary') return jsonOutput(saveSummary(e.parameter));
  if (action === 'abilityStages') return jsonOutput({ stages: getAbilityStages(e.parameter.name, e.parameter.phone4) });
  if (action === 'saveAbilityStage') {
    try {
      return jsonOutput(saveAbilityStage(e.parameter));
    } catch (err) {
      return jsonOutput({ ok: false, error: err.message });
    }
  }
  if (action === 'aiAbilityAnalysis') {
    try {
      return jsonOutput(requestAIAbilityAnalysis(e.parameter.name, e.parameter.phone4));
    } catch (err) {
      return jsonOutput({ error: err.message });
    }
  }

  return jsonOutput({ ok: true });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    return jsonOutput(saveRegistration(data));
  } catch (err) {
    return jsonOutput({ result: 'error', message: String(err) });
  }
}

/* ---------- 수강신청 ---------- */
function saveRegistration(data) {
  const sheet = getOrCreateSheet();
  const now = new Date();
  sheet.appendRow([
    now, data.name || '', data.phone || '', data.program || '', data.message || '',
    Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd')
  ]);
  return { result: 'success' };
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['신청일시', '이름', '연락처', '관심프로그램', '문의내용', '날짜']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getRegistrations() {
  const sheet = getOrCreateSheet();
  const rows = sheet.getDataRange().getValues();
  rows.shift();
  return rows.map(r => ({
    timestamp: r[0], name: r[1], phone: r[2], program: r[3], message: r[4], date: r[5]
  })).reverse();
}

/* ---------- 방문자수 ---------- */
function recordVisit() {
  const props = PropertiesService.getScriptProperties();
  const todayStr = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
  const todayKey = 'visits_' + todayStr;
  const todayCount = Number(props.getProperty(todayKey) || 0) + 1;
  const totalCount = Number(props.getProperty('total_visits') || 0) + 1;
  props.setProperty(todayKey, String(todayCount));
  props.setProperty('total_visits', String(totalCount));
  logDailyVisitToSheet(todayStr, todayCount);
  return { today: todayCount, total: totalCount };
}

function getVisitCounts() {
  const props = PropertiesService.getScriptProperties();
  const todayStr = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
  return {
    today: Number(props.getProperty('visits_' + todayStr) || 0),
    total: Number(props.getProperty('total_visits') || 0)
  };
}

// 날짜별 방문수를 "방문통계" 시트에 기록. 같은 날 안에서는 마지막 줄 숫자만
// 계속 갱신하고, 날짜가 바뀌면 새 줄을 추가합니다 (시트 전체를 매번 훑지
// 않도록 마지막 줄만 확인해서 빠르게 처리).
function logDailyVisitToSheet(dateStr, count) {
  const sheet = getOrCreateVisitSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const rawDate = sheet.getRange(lastRow, 1).getValue();
    // 구글시트가 "2026-08-02" 같은 문자열을 자동으로 날짜 타입으로 바꿔버리기
    // 때문에, 비교 전에 항상 같은 형식의 문자열로 맞춰줘야 함.
    const lastDateStr = rawDate instanceof Date
      ? Utilities.formatDate(rawDate, 'Asia/Seoul', 'yyyy-MM-dd')
      : String(rawDate);
    if (lastDateStr === dateStr) {
      sheet.getRange(lastRow, 2).setValue(count);
      return;
    }
  }
  sheet.appendRow([dateStr, count]);
}

// 위 버그 때문에 하루에 여러 줄로 쪼개져 쌓인 기존 기록을, 날짜별로 하나의
// 줄(그날의 최댓값 = 실제 누적 방문수)로 정리해줍니다. Apps Script 편집기에서
// 딱 한 번만 실행해주세요.
function dedupeVisitSheet() {
  const sheet = getOrCreateVisitSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  const header = data[0];
  const order = [];
  const maxByDate = {};
  data.slice(1).forEach(r => {
    const raw = r[0];
    const dateStr = raw instanceof Date ? Utilities.formatDate(raw, 'Asia/Seoul', 'yyyy-MM-dd') : String(raw);
    const count = Number(r[1]) || 0;
    if (!(dateStr in maxByDate)) order.push(dateStr);
    maxByDate[dateStr] = Math.max(maxByDate[dateStr] || 0, count);
  });
  sheet.clearContents();
  sheet.appendRow(header);
  order.forEach(d => sheet.appendRow([d, maxByDate[d]]));
}

function getOrCreateVisitSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(VISIT_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(VISIT_SHEET_NAME);
    sheet.appendRow(['날짜', '방문수']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/* ---------- 성장일지 드롭다운 설정 (최초 1회만 직접 실행) ----------
 * Apps Script 편집기 상단에서 함수 목록을 "setupJournalDropdowns"로 바꾼 뒤
 * ▶ 실행 버튼을 한 번만 눌러주세요. 그러면 성장일지 시트의 "자신을 나타내는 색",
 * "선택색상1~3", "색상톤", "재료의 효과" 열(헤더 이름으로 자동으로 찾음)
 * 2~500행에 드롭다운 선택 목록이 자동으로 걸립니다. 열 순서가 바뀌어 있어도
 * 헤더 이름만 같으면 정확한 열을 찾아서 적용해요.
 * (나중에 500행을 넘어서면 이 함수를 다시 한 번 실행해주시면 돼요.)
 */
function setupJournalDropdowns() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(JOURNAL_SHEET_NAME);
  if (!sheet) { throw new Error('"성장일지" 시트를 먼저 만들어주세요.'); }

  const col = getHeaderIndexMap(sheet);
  const LAST_ROW = 500;

  // 전화번호뒷4자리 열 전체를 "일반 텍스트" 서식으로 지정해요. 그래야 시트에
  // 직접 0312처럼 입력해도 앞자리 0이 312로 사라지지 않아요. (이미 0이 사라진
  // 예전 값은 서식만으로는 복구되지 않으니, 그 줄만 다시 0312로 고쳐 입력해주세요.)
  const phoneKey = normalizeHeader('전화번호뒷4자리');
  if (phoneKey in col) {
    sheet.getRange(2, col[phoneKey] + 1, LAST_ROW - 1, 1).setNumberFormat('@');
  }

  const colorList = ['검정', '빨강', '주황', '노랑', '연두', '초록', '파랑', '보라', '핑크', '회색', '청록', '무지개', '골드', '갈색', '은색', '하늘색', '흰색', '청보라', '자주색'];
  const toneList = ['deep', 'vivid', 'pastel'];
  const effectList = ['감정활동(발산효과)', '뉴트럴(중립)', '사고활동(집중효과)'];
  const artAbilityList = ['집중,지속력', '언어표현', '관계,소통력', '표현기술,조형력', '탐구,관찰력', '발상,창의력', '조화감각,색채력', '문제해결,도전력', '응용,표현전개력'];
  const mindAbilityList = ['마음 알아차림', '마음표현', '마음조절', '마음믿기', '마음나누기'];

  const colorRule = SpreadsheetApp.newDataValidation().requireValueInList(colorList, true).setAllowInvalid(false).build();
  const toneRule = SpreadsheetApp.newDataValidation().requireValueInList(toneList, true).setAllowInvalid(false).build();
  const effectRule = SpreadsheetApp.newDataValidation().requireValueInList(effectList, true).setAllowInvalid(false).build();
  const artAbilityRule = SpreadsheetApp.newDataValidation().requireValueInList(artAbilityList, true).setAllowInvalid(false).build();
  const mindAbilityRule = SpreadsheetApp.newDataValidation().requireValueInList(mindAbilityList, true).setAllowInvalid(false).build();

  const missing = [];
  ['자신을 나타내는 색', '선택색상1순위', '선택색상2순위', '선택색상3순위', '수업전마음색', '수업후마음색'].forEach(h => {
    const key = normalizeHeader(h);
    if (key in col) sheet.getRange(2, col[key] + 1, LAST_ROW - 1, 1).setDataValidation(colorRule);
    else missing.push(h);
  });
  ['수업전색상톤', '수업후색상톤'].forEach(h => {
    const key = normalizeHeader(h);
    if (key in col) sheet.getRange(2, col[key] + 1, LAST_ROW - 1, 1).setDataValidation(toneRule);
    else missing.push(h);
  });
  const effectKey = normalizeHeader('재료의 효과');
  if (effectKey in col) sheet.getRange(2, col[effectKey] + 1, LAST_ROW - 1, 1).setDataValidation(effectRule);
  else missing.push('재료의 효과');
  const artKey = normalizeHeader('미술능력');
  if (artKey in col) sheet.getRange(2, col[artKey] + 1, LAST_ROW - 1, 1).setDataValidation(artAbilityRule);
  else missing.push('미술능력');
  const mindKey = normalizeHeader('마음의 능력');
  if (mindKey in col) sheet.getRange(2, col[mindKey] + 1, LAST_ROW - 1, 1).setDataValidation(mindAbilityRule);
  else missing.push('마음의 능력');

  if (missing.length) {
    throw new Error('다음 헤더 열을 찾을 수 없어서 드롭다운을 걸지 못했어요: ' + missing.join(', ') + ' — 헤더 이름 철자를 확인해주세요.');
  }
}

/* ---------- 성장일지 (개인정보 보호용 필터링 조회) ---------- */
// 열 위치가 아니라 "헤더 이름"으로 데이터를 찾기 위한 도우미. 시트 중간에
// 열이 하나 삽입되어 순서가 밀리더라도, 헤더 텍스트만 그대로면 코드가 알아서
// 올바른 열을 다시 찾아가기 때문에 데이터가 어긋나지 않습니다.
// 공백 차이("감정,성장키워드" vs "감정, 성장키워드")는 무시하도록 정규화합니다.
function normalizeHeader(s) {
  return String(s).trim().replace(/\s+/g, '');
}
function getHeaderIndexMap(sheet) {
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  header.forEach((h, i) => { map[normalizeHeader(h)] = i; });
  return map;
}

// 전화번호 뒷 4자리 비교용 도우미. 구글 시트가 "0312" 같은 값을 숫자로 인식해서
// 앞자리 0을 지워버리는 경우가 있어서(=312로 저장됨), 순수 숫자면 항상 4자리로
// 0을 채워서 비교해요. 이렇게 하면 시트에 0312로 저장했든 312로 저장했든,
// 학부모가 0312를 입력하면 똑같이 매칭돼요.
function normalizePhone4(v) {
  const s = String(v == null ? '' : v).trim();
  if (/^\d+$/.test(s) && s.length <= 4) return s.padStart(4, '0');
  return s;
}

function getJournal(name, phone4) {
  if (!name || !phone4) {
    return { found: false, message: '이름과 전화번호 뒷자리를 모두 입력해주세요.' };
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(JOURNAL_SHEET_NAME);
  if (!sheet) {
    return { found: false, message: '아직 등록된 성장일지 데이터가 없어요.' };
  }
  const col = getHeaderIndexMap(sheet);
  // 필수 열(이름/전화번호)이 없어졌거나 헤더 텍스트가 바뀌었을 때를 대비한 안전장치
  const need = ['이름', '전화번호뒷4자리'];
  const missing = need.filter(h => !(normalizeHeader(h) in col));
  if (missing.length) {
    return { found: false, message: `시트 헤더에서 "${missing.join(', ')}" 열을 찾을 수 없어요. 첫 줄(헤더) 이름이 바뀌었는지 확인해주세요.` };
  }
  const get = (row, headerName, fallback) => {
    const key = normalizeHeader(headerName);
    return (key in col) ? row[col[key]] : fallback;
  };

  const rows = sheet.getDataRange().getValues();
  rows.shift(); // 헤더 제거

  const nameTrim = String(name).trim();
  const phoneTrim = normalizePhone4(phone4);

  const matched = rows.filter(r =>
    String(get(r, '이름', '')).trim() === nameTrim && normalizePhone4(get(r, '전화번호뒷4자리', '')) === phoneTrim
  );

  if (matched.length === 0) {
    return { found: false, message: '이름 또는 전화번호 뒷자리가 일치하는 기록이 없어요. 다시 확인해주세요.' };
  }

  const term = get(matched[0], '학기', '');
  const entries = matched.map(r => {
    const color1 = get(r, '선택색상1순위', '');
    return {
      classLabel: get(r, '학기', ''),
      month: get(r, '월', ''),
      title: get(r, '작품제목', ''),
      photo1: get(r, '사진1URL', ''),
      photo2: get(r, '사진2URL', ''),
      photo3: get(r, '사진3URL', ''),
      photo4: get(r, '사진4URL', ''),
      beforeColor: get(r, '수업전마음색', ''),
      beforeMoodNote: get(r, '수업전 마음 한 줄', ''),
      afterColor: get(r, '수업후마음색', ''),
      afterMoodNote: get(r, '수업후 마음 한 줄', ''),
      selfColor: get(r, '자신을 나타내는 색', ''),
      color1: color1,
      color2: get(r, '선택색상2순위', ''),
      color3: get(r, '선택색상3순위', ''),
      beforeTone: String(get(r, '수업전색상톤', '') || '').trim().toLowerCase(),
      afterTone: String(get(r, '수업후색상톤', '') || '').trim().toLowerCase(),
      mainColor: color1, // 색채 바퀴/타임라인은 선택색상1순위를 대표색으로 사용
      emotionKeywords: String(get(r, '감정,성장키워드', '') || '').split(/[,、\n]/).map(s => s.trim()).filter(Boolean),
      engagement: get(r, '몰입도', ''),
      materials: get(r, '사용재료', ''),
      materialTendency: get(r, '재료선택의 경향', ''),
      artAbility: get(r, '미술능력', ''),
      artAbilityNote: get(r, '미술능력근거', ''),
      mindAbility: get(r, '마음의 능력', ''),
      mindAbilityNote: get(r, '마음의 능력근거', ''),
      materialEffect: get(r, '재료의 효과', ''),
      note: get(r, '관찰노트', ''),
      sessionTheme: get(r, '이번 회차 목표/주제', ''),
      styleNotes: get(r, '그림 스타일 특징', ''),
      goalTags: String(get(r, '목표행동 태그', '') || '').split(/[,、\n]/).map(s => s.trim()).filter(Boolean)
    };
  });

  const summary = getSummary(nameTrim, phoneTrim);
  const publishedSummary = (summary && summary.published === true) ? summary : null;
  const range = getSummaryRange(nameTrim, phoneTrim);

  return {
    found: true, name: nameTrim, term: term, entries: entries, summary: publishedSummary,
    narrativeOverride: summary ? summary.narrativeOverride : '',
    hintsOverride: summary ? summary.hintsOverride : [],
    range: range,
    feedbackA: summary ? summary.feedbackA : '',
    hiddenSections: summary ? summary.hiddenSections : []
  };
}

/* ---------- 능력 성장단계 (횟수와는 별개인 "질적 판단" 데이터) ----------
 * "능력성장단계" 시트에서 이름+전화번호가 일치하는 줄들을 모아서 돌려줘요.
 * 능력 하나(예: "문제해결,도전력")당 최대 한 줄만 있고, 다시 저장하면 그 줄을
 * 덮어써요(새로 쌓이지 않음) — 항상 "가장 최근 판단"만 남깁니다.
 */
function getAbilityStages(name, phone4) {
  if (!name || !phone4) return [];
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABILITY_STAGE_SHEET_NAME);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  data.shift();
  const nameTrim = String(name).trim(), phoneTrim = normalizePhone4(phone4);
  return data
    .filter(r => String(r[0]).trim() === nameTrim && normalizePhone4(r[1]) === phoneTrim)
    .map(r => ({ type: String(r[2] || '').trim(), ability: String(r[3] || '').trim(), stage: Number(r[4]) || 0, reason: String(r[5] || ''), updatedAt: r[6] || '' }))
    .filter(s => s.type && s.ability);
}

// 능력 하나의 성장단계(1~4)와 판단근거를 저장해요. 같은 아이+같은 능력이면 새로 쌓지
// 않고 그 줄을 덮어써서, 시트가 무한히 늘어나지 않고 항상 최신 판단만 남아요.
function saveAbilityStage(p) {
  if (!p.name || !p.phone4 || !p.type || !p.ability) {
    throw new Error('이름/전화번호/능력유형(미술 또는 마음)/능력명이 모두 필요해요.');
  }
  // 동시에 여러 요청이 들어와도(예: 여러 능력을 한꺼번에 저장) 시트 생성/줄 찾기가
  // 서로 겹치지 않도록 잠깐 순서를 기다려요. 이게 없으면 시트가 아직 없을 때
  // 두 요청이 동시에 새로 만들려다가 "_conflict" 이름의 중복 탭이 생길 수 있어요.
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(ABILITY_STAGE_SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(ABILITY_STAGE_SHEET_NAME);
      sheet.appendRow(['이름', '전화번호뒷4자리', '능력유형', '능력명', '단계', '판단근거', '업데이트일시']);
    }
    const data = sheet.getDataRange().getValues();
    let rowIdx = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(p.name).trim() &&
          normalizePhone4(data[i][1]) === normalizePhone4(p.phone4) &&
          String(data[i][2]).trim() === String(p.type).trim() &&
          String(data[i][3]).trim() === String(p.ability).trim()) {
        rowIdx = i + 1;
        break;
      }
    }
    const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
    const row = [p.name, normalizePhone4(p.phone4), p.type, p.ability, p.stage || '', p.reason || '', now];
    if (rowIdx === -1) {
      sheet.appendRow(row);
      sheet.getRange(sheet.getLastRow(), 2).setNumberFormat('@');
    } else {
      sheet.getRange(rowIdx, 2).setNumberFormat('@');
      sheet.getRange(rowIdx, 1, 1, row.length).setValues([row]);
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/* ---------- AI 능력 해석 요청 (구글 Gemini API — 무료 티어) ----------
 * 이 아이의 회차별 "미술능력근거"/"마음의 능력근거" 문장들을 능력별로 모아서
 * Gemini API에게 보내고, 빈도가 아니라 "사용 방식이 얼마나 깊어졌는지"를 기준으로
 * 1~4단계를 제안받아요. 결과는 저장되지 않고 teacher-entry.html 화면에 제안으로만
 * 표시되며, 선생님이 검토하고 수정한 뒤 "저장"을 눌러야 실제로 반영돼요.
 *
 * 이 함수를 쓰려면 https://aistudio.google.com/apikey 에서 구글 계정으로 무료
 * API 키를 발급받아(카드 등록 불필요), Apps Script 편집기 > 프로젝트 설정 >
 * 스크립트 속성에서 GEMINI_API_KEY 값으로 등록해주세요. 무료 사용량 한도 안에서는
 * 요금이 청구되지 않아요 (아이 한 명당 요청 한 번은 아주 적은 사용량이라, 일반적인
 * 사용 빈도로는 무료 한도를 넘기 어려워요).
 */
function requestAIAbilityAnalysis(name, phone4) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('AI 해석을 쓰려면 먼저 https://aistudio.google.com/apikey 에서 무료 API 키를 발급받아, Apps Script 편집기 > 프로젝트 설정 > 스크립트 속성에 GEMINI_API_KEY로 등록해주세요.');
  }
  const journal = getJournal(name, phone4);
  if (!journal.found || !journal.entries || !journal.entries.length) {
    throw new Error('먼저 성장일지 회차 데이터가 있어야 AI 해석을 요청할 수 있어요.');
  }

  const artNotes = {}, mindNotes = {};
  journal.entries.forEach(e => {
    if (e.artAbility && e.artAbilityNote) (artNotes[e.artAbility] = artNotes[e.artAbility] || []).push(`${e.month || ''}: ${e.artAbilityNote}`);
    if (e.mindAbility && e.mindAbilityNote) (mindNotes[e.mindAbility] = mindNotes[e.mindAbility] || []).push(`${e.month || ''}: ${e.mindAbilityNote}`);
  });
  if (!Object.keys(artNotes).length && !Object.keys(mindNotes).length) {
    throw new Error('근거 문장(미술능력근거/마음의 능력근거)이 하나도 없어서 AI가 판단할 자료가 없어요. 회차 기록에 근거 문장을 먼저 적어주세요.');
  }

  const lines = [];
  lines.push('아래는 한 아동의 미술 수업 회차별 관찰 기록입니다. 능력별로 선생님이 남긴 근거 문장들을 보고,');
  lines.push('그 능력의 "사용 방식이 얼마나 깊어졌는지"를 판단해서 1~4단계로 분류해주세요.');
  lines.push('단계 기준: 1=발견중(그 힘이 처음 나타남), 2=시도중(스스로 해보려 시도함),');
  lines.push('3=확장중(다른 상황에서도 반복적으로, 더 복잡하게 사용함), 4=자기화중(완전히 자기 것으로 만들어 자기만의 언어/방식으로 표현함).');
  lines.push('중요: 문장 개수(횟수)가 많다고 무조건 높은 단계가 아닙니다. "수용 → 재시도 → 스스로 해결책 고안"처럼');
  lines.push('내용이 질적으로 깊어졌는지를 근거로 판단하세요. 문장이 비슷한 수준으로만 반복되면 낮은 단계에 머물 수 있습니다.');
  lines.push('');
  lines.push('[미술능력 근거]');
  Object.keys(artNotes).forEach(k => lines.push(`- ${k}: ${artNotes[k].join(' / ')}`));
  lines.push('');
  lines.push('[마음의 능력 근거]');
  Object.keys(mindNotes).forEach(k => lines.push(`- ${k}: ${mindNotes[k].join(' / ')}`));
  lines.push('');
  lines.push('아래 JSON 형식으로만 답하세요 (다른 설명이나 코드블록 없이 JSON 텍스트만):');
  lines.push('{"art":[{"ability":"능력명","stage":1,"reason":"한두 문장 근거"}],"mind":[{"ability":"능력명","stage":1,"reason":"한두 문장 근거"}]}');
  lines.push('근거 문장이 없는 능력은 배열에서 제외하세요.');

  // 'gemini-flash-latest'는 구글이 자동으로 최신 Flash 모델을 가리키도록 관리하는
  // 별칭이에요. 특정 버전 이름(예: gemini-2.5-flash)을 직접 쓰면 그 모델이 나중에
  // 없어졌을 때 404 에러가 나서, 항상 최신을 가리키는 이 별칭을 쓰는 게 더 안전해요.
  const model = 'gemini-flash-latest';
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(apiKey);
  const payload = JSON.stringify({
    contents: [{ parts: [{ text: lines.join('\n') }] }],
    generationConfig: { temperature: 0.3 }
  });

  // 503(서버 혼잡)/429(요청 과다)는 보통 몇 초 안에 풀리는 일시적인 상태라,
  // 곧바로 실패로 끝내지 않고 짧게 대기했다가 최대 3번까지 자동으로 다시
  // 시도해요. 그래도 안 되면 그때 진짜 에러로 알려드려요.
  let res, code, bodyText;
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: payload,
      muteHttpExceptions: true
    });
    code = res.getResponseCode();
    bodyText = res.getContentText();
    if (code === 200) break;
    if ((code === 503 || code === 429) && attempt < maxAttempts) {
      Utilities.sleep(1500 * attempt); // 1.5초, 3초로 점점 늘려가며 대기
      continue;
    }
    break;
  }

  if (code !== 200) {
    let detail = '';
    try {
      const errBody = JSON.parse(bodyText);
      detail = (errBody.error && errBody.error.message) ? errBody.error.message : bodyText.slice(0, 200);
    } catch (e) {
      detail = bodyText.slice(0, 200);
    }
    throw new Error('AI 요청이 실패했어요 (코드 ' + code + '): ' + detail);
  }
  const body = JSON.parse(bodyText);
  const textOut = body.candidates && body.candidates[0] && body.candidates[0].content &&
    body.candidates[0].content.parts && body.candidates[0].content.parts[0] &&
    body.candidates[0].content.parts[0].text;
  if (!textOut) throw new Error('AI 응답을 이해하지 못했어요. 다시 시도해주세요.');

  let parsed;
  try {
    const cleaned = textOut.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error('AI 응답을 해석하지 못했어요. 다시 시도해주세요.');
  }
  return { ok: true, art: parsed.art || [], mind: parsed.mind || [] };
}

/* ---------- 종합요약 회차 범위 (선생님이 지정하면 학부모 화면에도 동일하게 반영) ----------
 * "성장요약" 시트의 17, 18번째 열(요약범위시작 / 요약범위끝)에 회차 번호(1부터 시작하는
 * 숫자)를 저장해둡니다. "공개여부"와 무관하게 항상 적용돼요 — 범위는 자동 생성 종합요약
 * 부분에만 영향을 주고, 원장님이 직접 쓰신 강점/방향 같은 수동 요약과는 별개예요.
 */
function getSummaryRange(name, phone4) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (!sheet) return null;
  const rows = sheet.getDataRange().getValues();
  rows.shift();
  const row = rows.find(r => String(r[0]).trim() === String(name).trim() && normalizePhone4(r[1]) === normalizePhone4(phone4));
  if (!row) return null;
  const from = row[16], to = row[17];
  if (!from && !to) return null;
  return { from: Number(from) || null, to: Number(to) || null };
}

function saveSummaryRange(name, phone4, from, to) {
  if (!name || !phone4) throw new Error('이름과 전화번호 뒷자리가 필요해요.');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SUMMARY_SHEET_NAME);
    sheet.appendRow(['이름','전화번호뒷4자리','강점','성장방향','표현_전','표현_후','색채_전','색채_후','심리_전','심리_후','사고_전','사고_후','눈에띄는성장','공개여부','한줄요약(직접입력)','양육힌트(직접입력)','요약범위시작','요약범위끝','꽃밭샘피드백','숨김섹션']);
  }
  const data = sheet.getDataRange().getValues();
  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(name).trim() && normalizePhone4(data[i][1]) === normalizePhone4(phone4)) { rowIdx = i + 1; break; }
  }
  if (rowIdx === -1) {
    sheet.appendRow([name, phone4, '', '', '', '', '', '', '', '', '', '', '', false, '', '', from, to]);
  } else {
    sheet.getRange(rowIdx, 17, 1, 2).setValues([[from, to]]);
  }
  return { ok: true };
}

/* ---------- 선생님용 성장일지 입력 (teacher-entry.html에서 사용) ----------
 * 구글시트를 직접 열지 않고도 웹 폼에서 회차 기록을 저장할 수 있게 해줍니다.
 * 열 위치가 아니라 헤더 "이름"으로 값을 채워 넣기 때문에, 시트의 열 순서가
 * 달라져 있어도 정확한 칸에 들어갑니다.
 */
// 전화번호뒷4자리 칸이 시트에서 "숫자"로 인식되면 0312 같은 값의 앞자리 0이
// 사라지므로, 저장할 때마다 그 칸만 "일반 텍스트" 서식으로 강제 지정해요.
function forcePhoneCellAsText(sheet, rowIdx, col) {
  const key = normalizeHeader('전화번호뒷4자리');
  if (key in col) {
    sheet.getRange(rowIdx, col[key] + 1).setNumberFormat('@');
  }
}

function addJournalEntry(p) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(JOURNAL_SHEET_NAME);
  if (!sheet) throw new Error('"성장일지" 시트를 먼저 만들어주세요.');
  if (!p.name || !p.phone4) throw new Error('이름과 전화번호 뒷자리는 꼭 입력해주세요.');

  const col = getHeaderIndexMap(sheet);
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const newRow = new Array(lastCol).fill('');
  const set = (headerName, value) => {
    const key = normalizeHeader(headerName);
    if (key in col && value !== undefined && value !== null && value !== '') newRow[col[key]] = value;
  };

  set('이름', p.name);
  set('전화번호뒷4자리', normalizePhone4(p.phone4));
  set('학기', p.term);
  set('월', p.month);
  set('작품제목', p.title);
  set('사진1URL', p.photo1);
  set('사진2URL', p.photo2);
  set('사진3URL', p.photo3);
  set('사진4URL', p.photo4);
  set('수업전마음색', p.beforeColor);
  set('수업전 마음 한 줄', p.beforeMoodNote);
  set('수업후마음색', p.afterColor);
  set('수업후 마음 한 줄', p.afterMoodNote);
  set('자신을 나타내는 색', p.selfColor);
  set('선택색상1순위', p.color1);
  set('선택색상2순위', p.color2);
  set('선택색상3순위', p.color3);
  set('수업전색상톤', p.beforeTone);
  set('수업후색상톤', p.afterTone);
  set('감정,성장키워드', p.keywords);
  set('몰입도', p.engagement);
  set('사용재료', p.materials);
  set('재료선택의 경향', p.materialTendency);
  set('미술능력', p.artAbility);
  set('미술능력근거', p.artAbilityNote);
  set('마음의 능력', p.mindAbility);
  set('마음의 능력근거', p.mindAbilityNote);
  set('재료의 효과', p.materialEffect);
  set('관찰노트', p.note);
  set('이번 회차 목표/주제', p.sessionTheme);
  set('그림 스타일 특징', p.styleNotes);
  set('목표행동 태그', p.goalTags);

  const nextRow = sheet.getLastRow() + 1;
  forcePhoneCellAsText(sheet, nextRow, col);
  sheet.appendRow(newRow);
  return { ok: true };
}

/* ---------- 성장일지 회차 수정 (teacher-entry.html '기존 회차 수정하기'에서 사용) ----------
 * 이름+전화번호뒷4자리+원래 회차(월) 값으로 정확한 줄을 찾아서 그 줄을 통째로
 * 덮어씁니다(appendRow로 새 줄을 추가하지 않음). "월" 값 자체를 수정해도, 찾는
 * 기준은 저장 당시의 originalMonth이기 때문에 정확한 줄을 계속 찾아갑니다.
 */
function updateJournalEntry(p) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(JOURNAL_SHEET_NAME);
  if (!sheet) throw new Error('"성장일지" 시트를 먼저 만들어주세요.');
  if (!p.name || !p.phone4 || !p.originalMonth) throw new Error('수정할 회차를 찾을 정보(이름/전화번호/원래 회차)가 부족해요.');

  const col = getHeaderIndexMap(sheet);
  const need = ['이름', '전화번호뒷4자리', '월'];
  const missingHeaders = need.filter(h => !(normalizeHeader(h) in col));
  if (missingHeaders.length) throw new Error('시트 헤더에서 "' + missingHeaders.join(', ') + '" 열을 찾을 수 없어요.');

  const data = sheet.getDataRange().getValues();
  const nameCol = col[normalizeHeader('이름')], phoneCol = col[normalizeHeader('전화번호뒷4자리')], monthCol = col[normalizeHeader('월')];
  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][nameCol]).trim() === String(p.name).trim() &&
        normalizePhone4(data[i][phoneCol]) === normalizePhone4(p.phone4) &&
        String(data[i][monthCol]).trim() === String(p.originalMonth).trim()) {
      rowIdx = i + 1;
      break;
    }
  }
  if (rowIdx === -1) throw new Error('수정할 회차를 찾지 못했어요. 이름/전화번호/회차가 맞는지 확인해주세요.');

  const lastCol = sheet.getLastColumn();
  const rowValues = sheet.getRange(rowIdx, 1, 1, lastCol).getValues()[0];
  const set = (headerName, value) => {
    const key = normalizeHeader(headerName);
    if (key in col) rowValues[col[key]] = (value !== undefined && value !== null) ? value : '';
  };

  set('이름', p.name);
  set('전화번호뒷4자리', normalizePhone4(p.phone4));
  set('학기', p.term);
  set('월', p.month);
  set('작품제목', p.title);
  set('사진1URL', p.photo1);
  set('사진2URL', p.photo2);
  set('사진3URL', p.photo3);
  set('사진4URL', p.photo4);
  set('수업전마음색', p.beforeColor);
  set('수업전 마음 한 줄', p.beforeMoodNote);
  set('수업후마음색', p.afterColor);
  set('수업후 마음 한 줄', p.afterMoodNote);
  set('자신을 나타내는 색', p.selfColor);
  set('선택색상1순위', p.color1);
  set('선택색상2순위', p.color2);
  set('선택색상3순위', p.color3);
  set('수업전색상톤', p.beforeTone);
  set('수업후색상톤', p.afterTone);
  set('감정,성장키워드', p.keywords);
  set('몰입도', p.engagement);
  set('사용재료', p.materials);
  set('재료선택의 경향', p.materialTendency);
  set('미술능력', p.artAbility);
  set('미술능력근거', p.artAbilityNote);
  set('마음의 능력', p.mindAbility);
  set('마음의 능력근거', p.mindAbilityNote);
  set('재료의 효과', p.materialEffect);
  set('관찰노트', p.note);
  set('이번 회차 목표/주제', p.sessionTheme);
  set('그림 스타일 특징', p.styleNotes);
  set('목표행동 태그', p.goalTags);

  forcePhoneCellAsText(sheet, rowIdx, col);
  sheet.getRange(rowIdx, 1, 1, lastCol).setValues([rowValues]);
  return { ok: true };
}

/* ---------- 성장요약 저장 (teacher-entry.html '성장요약 입력' 탭에서 사용) ----------
 * 요약범위시작/끝(17,18번째 열)은 journal.html 선생님 모드에서 따로 관리하기
 * 때문에, 여기서는 건드리지 않고 그대로 둡니다.
 */
function saveSummary(p) {
  if (!p.name || !p.phone4) throw new Error('이름과 전화번호 뒷자리가 필요해요.');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SUMMARY_SHEET_NAME);
    sheet.appendRow(['이름','전화번호뒷4자리','강점','성장방향','표현_전','표현_후','색채_전','색채_후','심리_전','심리_후','사고_전','사고_후','눈에띄는성장','공개여부','한줄요약(직접입력)','양육힌트(직접입력)','요약범위시작','요약범위끝','꽃밭샘피드백','숨김섹션']);
  }
  const data = sheet.getDataRange().getValues();
  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(p.name).trim() && normalizePhone4(data[i][1]) === normalizePhone4(p.phone4)) { rowIdx = i + 1; break; }
  }
  const published = (p.published === 'true' || p.published === true);
  const values = [
    p.name, p.phone4,
    p.strength || '', p.direction || '',
    p.expressionBefore || '', p.expressionAfter || '',
    p.colorBefore || '', p.colorAfter || '',
    p.psychologyBefore || '', p.psychologyAfter || '',
    p.thinkingBefore || '', p.thinkingAfter || '',
    p.highlights || '', published,
    p.narrativeOverride || '', p.hintsOverride || ''
  ];
  if (rowIdx === -1) {
    // 새 줄이라 요약범위(17,18열)는 비워서 시작 (필요하면 나중에 journal.html에서 지정)
    sheet.appendRow(values.concat(['', '', p.feedbackA || '', p.hiddenSections || '']));
  } else {
    sheet.getRange(rowIdx, 1, 1, 16).setValues([values]); // 17,18열(요약범위)은 그대로 둠
    sheet.getRange(rowIdx, 19, 1, 2).setValues([[p.feedbackA || '', p.hiddenSections || '']]);
  }
  return { ok: true };
}

// B/E/F/G/H 섹션의 학부모 공개 여부만 빠르게 저장 (다른 성장요약 내용은 안 건드림)
function saveSectionVisibility(name, phone4, hiddenSections) {
  if (!name || !phone4) throw new Error('이름과 전화번호 뒷자리가 필요해요.');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SUMMARY_SHEET_NAME);
    sheet.appendRow(['이름','전화번호뒷4자리','강점','성장방향','표현_전','표현_후','색채_전','색채_후','심리_전','심리_후','사고_전','사고_후','눈에띄는성장','공개여부','한줄요약(직접입력)','양육힌트(직접입력)','요약범위시작','요약범위끝','꽃밭샘피드백','숨김섹션']);
  }
  const data = sheet.getDataRange().getValues();
  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(name).trim() && normalizePhone4(data[i][1]) === normalizePhone4(phone4)) { rowIdx = i + 1; break; }
  }
  if (rowIdx === -1) {
    sheet.appendRow([name, phone4, '', '', '', '', '', '', '', '', '', '', '', false, '', '', '', '', '', hiddenSections || '']);
  } else {
    sheet.getRange(rowIdx, 20, 1, 1).setValue(hiddenSections || '');
  }
  return { ok: true };
}

function getSummary(name, phone4) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (!sheet) return null;

  const rows = sheet.getDataRange().getValues();
  rows.shift();
  const row = rows.find(r => String(r[0]).trim() === String(name).trim() && normalizePhone4(r[1]) === normalizePhone4(phone4));
  if (!row) return null;

  return {
    strength: row[2], direction: row[3],
    expression: { before: row[4], after: row[5] },
    color: { before: row[6], after: row[7] },
    psychology: { before: row[8], after: row[9] },
    thinking: { before: row[10], after: row[11] },
    highlights: String(row[12] || '').split('\n').map(s => s.trim()).filter(Boolean),
    published: row[13] === true,
    narrativeOverride: row[14] || '',
    hintsOverride: String(row[15] || '').split('\n').map(s => s.trim()).filter(Boolean),
    feedbackA: row[18] || '',
    hiddenSections: String(row[19] || '').split(',').map(s => s.trim()).filter(Boolean)
  };
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
