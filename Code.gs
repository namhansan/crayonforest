/**
 * 크레용숲 백엔드 (v3 — 성장일지 조회 기능 추가)
 * ------------------------------------------------
 * 이 코드는 아래 4가지를 처리합니다.
 * 1) 수강신청 저장 (action=register)
 * 2) 방문자수 카운트 (action=visit)
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
 * 첫 줄(헤더)에 다음 10개를 순서대로 넣어주세요:
 * 이름 | 전화번호뒷4자리 | 학기 | 월 | 작품제목 | 사진1URL | 사진2URL | 메인컬러 | 사용재료 | 관찰노트
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
    month: r[3], title: r[4], photo1: r[5], photo2: r[6], mainColor: r[7], materials: r[8], note: r[9]
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
