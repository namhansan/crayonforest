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
 * 첫 줄(헤더)에 다음 22개를 순서대로 넣어주세요:
 * 이름 | 전화번호뒷4자리 | 학기 | 월 | 작품제목 | 사진1URL | 사진2URL |
 * 자신을 나타내는 색 | 선택색상1 | 선택색상2 | 선택색상3 | 색상톤 |
 * 감정,성장키워드 | 몰입도 | 사용재료 | 재료선택의 경향 | 성장하고 있는 능력 |
 * 재료의 효과 | 관찰노트 | 이번 회차 목표/주제 | 그림 스타일 특징 | 목표행동 태그
 *
 * 마지막 3개(회차목표/스타일특징/목표행동태그)는 선택 입력이에요 — 안 적어도
 * 카드에 그냥 안 보일 뿐 문제없이 동작합니다. "목표행동 태그"는 감정키워드처럼
 * 쉼표로 여러 개 적으면 돼요 (예: 집중력, 협동, 자기표현).
 *
 * 색상/색상톤/재료의 효과 열은 드롭다운으로 선택할 수 있게 만들어두는 걸
 * 추천해요 — 이 파일 안의 setupJournalDropdowns() 함수를 Apps Script
 * 편집기에서 한 번만 실행하면 자동으로 걸립니다. (자세한 설명은 해당
 * 함수 위 주석 참고)
 *
 * (선택) 종합 요약 시트 준비 — 6개월 마지막에 한 번만 작성:
 * "성장요약"이라는 이름의 시트 탭을 만들고, 첫 줄에 다음 14개를 순서대로 넣어주세요:
 * 이름 | 전화번호뒷4자리 | 강점 | 성장방향 | 표현_전 | 표현_후 | 색채_전 | 색채_후 | 심리_전 | 심리_후 | 사고_전 | 사고_후 | 눈에띄는성장 | 공개여부
 *
 * "공개여부" 열은 체크박스로 만들어주세요 (열 선택 후 삽입 > 체크박스).
 * 월별 성장일지 기록은 언제나 그대로 보입니다. "공개여부"를 체크해야 보이는 건
 * 맨 마지막의 "종합 요약" 부분(색채 차트+강점+성장방향)뿐입니다 — 체크 전에는
 * 그 부분만 화면에서 생략되고, 체크하면 그때부터 나타납니다.
 */

const SHEET_NAME = '수강신청';
const JOURNAL_SHEET_NAME = '성장일지';
const SUMMARY_SHEET_NAME = '성장요약';
const VISIT_SHEET_NAME = '방문통계';

function doGet(e) {
  const action = e.parameter.action;

  if (action === 'register') return jsonOutput(saveRegistration(e.parameter));
  if (action === 'visit') return jsonOutput(recordVisit());
  if (action === 'registrations') return jsonOutput(getRegistrations());
  if (action === 'visitCount') return jsonOutput(getVisitCounts());
  if (action === 'journal') return jsonOutput(getJournal(e.parameter.name, e.parameter.phone4));

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
    const lastDate = sheet.getRange(lastRow, 1).getValue();
    if (lastDate === dateStr) {
      sheet.getRange(lastRow, 2).setValue(count);
      return;
    }
  }
  sheet.appendRow([dateStr, count]);
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
 * ▶ 실행 버튼을 한 번만 눌러주세요. 그러면 성장일지 시트의
 * H(자신을 나타내는 색), I~K(선택색상1~3), L(색상톤), R(재료의 효과) 열
 * 2~500행에 드롭다운 선택 목록이 자동으로 걸립니다.
 * (나중에 500행을 넘어서면 이 함수를 다시 한 번 실행해주시면 돼요.)
 */
function setupJournalDropdowns() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(JOURNAL_SHEET_NAME);
  if (!sheet) { throw new Error('"성장일지" 시트를 먼저 만들어주세요.'); }

  const LAST_ROW = 500;
  const colorList = ['검정', '빨강', '주황', '노랑', '연두', '초록', '파랑', '보라', '핑크'];
  const toneList = ['deep', 'vivid', 'pastel'];
  const effectList = ['감정활동(발산효과)', '뉴트럴(중립)', '사고활동(집중효과)'];

  const colorRule = SpreadsheetApp.newDataValidation().requireValueInList(colorList, true).setAllowInvalid(false).build();
  const toneRule = SpreadsheetApp.newDataValidation().requireValueInList(toneList, true).setAllowInvalid(false).build();
  const effectRule = SpreadsheetApp.newDataValidation().requireValueInList(effectList, true).setAllowInvalid(false).build();

  // H, I, J, K = 자신을 나타내는 색 / 선택색상1 / 선택색상2 / 선택색상3
  sheet.getRange(2, 8, LAST_ROW - 1, 4).setDataValidation(colorRule);
  // L = 색상톤
  sheet.getRange(2, 12, LAST_ROW - 1, 1).setDataValidation(toneRule);
  // R = 재료의 효과
  sheet.getRange(2, 18, LAST_ROW - 1, 1).setDataValidation(effectRule);
}

/* ---------- 성장일지 (개인정보 보호용 필터링 조회) ---------- */
function getJournal(name, phone4) {
  if (!name || !phone4) {
    return { found: false, message: '이름과 전화번호 뒷자리를 모두 입력해주세요.' };
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(JOURNAL_SHEET_NAME);
  if (!sheet) {
    return { found: false, message: '아직 등록된 성장일지 데이터가 없어요.' };
  }
  const rows = sheet.getDataRange().getValues();
  rows.shift(); // 헤더 제거

  const nameTrim = String(name).trim();
  const phoneTrim = String(phone4).trim();

  const matched = rows.filter(r =>
    String(r[0]).trim() === nameTrim && String(r[1]).trim() === phoneTrim
  );

  if (matched.length === 0) {
    return { found: false, message: '이름 또는 전화번호 뒷자리가 일치하는 기록이 없어요. 다시 확인해주세요.' };
  }

  const term = matched[0][2];
  const entries = matched.map(r => ({
    month: r[3],
    title: r[4],
    photo1: r[5],
    photo2: r[6],
    selfColor: r[7],
    color1: r[8],
    color2: r[9],
    color3: r[10],
    tone: String(r[11] || '').trim().toLowerCase(),
    mainColor: r[8], // 색채 바퀴/타임라인은 선택색상1을 대표색으로 사용
    emotionKeywords: String(r[12] || '').split(/[,、\n]/).map(s => s.trim()).filter(Boolean),
    engagement: r[13],
    materials: r[14],
    materialTendency: r[15],
    growingAbility: r[16],
    materialEffect: r[17],
    note: r[18],
    sessionTheme: r[19],
    styleNotes: r[20],
    goalTags: String(r[21] || '').split(/[,、\n]/).map(s => s.trim()).filter(Boolean)
  }));

  const summary = getSummary(nameTrim, phoneTrim);
  const publishedSummary = (summary && summary.published === true) ? summary : null;

  return { found: true, name: nameTrim, term: term, entries: entries, summary: publishedSummary };
}

function getSummary(name, phone4) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (!sheet) return null;

  const rows = sheet.getDataRange().getValues();
  rows.shift();
  const row = rows.find(r => String(r[0]).trim() === name && String(r[1]).trim() === phone4);
  if (!row) return null;

  return {
    strength: row[2], direction: row[3],
    expression: { before: row[4], after: row[5] },
    color: { before: row[6], after: row[7] },
    psychology: { before: row[8], after: row[9] },
    thinking: { before: row[10], after: row[11] },
    highlights: String(row[12] || '').split('\n').map(s => s.trim()).filter(Boolean),
    published: row[13] === true
  };
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
