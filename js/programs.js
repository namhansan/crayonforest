/* 크레용숲 프로그램 데이터 로더 (index.html 카드 목록 + program.html 상세/신청 공용)
 *
 * 프로그램 내용은 content/programs.json 에서 관리해요. 이 파일의 DEFAULT_PROGRAMS 는
 * programs.json 을 못 불러왔을 때(로컬 파일로 열었거나 네트워크 문제)만 쓰는 예비 데이터예요.
 * 평소에는 programs.json 만 고치시면 돼요 — 프로그램 추가/삭제/마감 표시 모두 거기서 해요.
 */
const PROGRAM_COLORS = {
  gold:  { main:'#D3A24C', soft:'#F6E9CC', grad:'linear-gradient(150deg,#F3D9A8,#E0AE6C)' },
  berry: { main:'#8B4B5C', soft:'#EFD9DF', grad:'linear-gradient(150deg,#D9A9B7,#A8647A)' },
  clay:  { main:'#BE6A42', soft:'#F5DDD0', grad:'linear-gradient(150deg,#EBC1A6,#C77B55)' },
  sage:  { main:'#6E8E67', soft:'#DFEAD9', grad:'linear-gradient(150deg,#C4D8BD,#86A57E)' },
  forest:{ main:'#2C4A3B', soft:'#DCE6DF', grad:'linear-gradient(150deg,#7FA08D,#2C4A3B)' }
};
const PROGRAM_CATEGORIES = [
  { key:'all',     label:'전체' },
  { key:'child',   label:'CHILD ART' },
  { key:'youth',   label:'YOUTH ART' },
  { key:'adult',   label:'ADULT ART' },
  { key:'mom',     label:'FOR MOM' },
  { key:'special', label:'특강 · 체험' }
];
// 여정 페이지의 구분 제목 기본값. 실제로는 구글 시트 "수업구분" 탭의 문구가 우선이에요.
const DEFAULT_SECTIONS = [
  { key:'child',   title:'CHILD ART',              sub:'크레용숲 어린이색채학교', order:1 },
  { key:'youth',   title:'YOUTH ART',        sub:'사유의 숲',               order:2 },
  { key:'adult',   title:'ADULT ART',        sub:'예술리추얼',              order:3 },
  { key:'mom',     title:'FOR MOM', sub:'정원사',                    order:4 },
  { key:'special', title:'SPECIAL',         sub:'특강 · 체험',                         order:5 }
];
const DEFAULT_PROGRAMS = [
  {
    id:'child', enabled:true, category:'child', color:'gold', status:'모집중',
    title:'CHILD ART', subtitle:'크레용숲 어린이색채학교 · 감각의 숲(5~7세) · 상징의 숲(초등)',
    target:'5~12세', schedule:'소수정예 연령별 그룹수업', price:'', place:'크레용숲 (위례)',
    image:'',
    summary:'색과 감각, 이야기와 조형이 만나 아이의 자기결이 자라는 월별 감정예술 수업',
    description:'이상해도 괜찮은 미술 안에서 아이는 스스로 고르고, 실험하고, 다시 만들어보며 진짜 예술가처럼 창조하는 경험을 합니다.\n색과 감각, 이야기와 조형이 만나 아이의 자기결이 자라는 색채예술 수업입니다.\n수업마다 아이의 색·재료 선택과 표현이 성장일지에 기록되어, 부모님은 아이의 마음이 자라는 과정을 눈으로 확인하실 수 있어요.',
    curriculum:['월별 감정예술 테마 수업','수업 후 성장일지(성장카르테) 기록 제공','6개월 단위 성장 종합요약'],
    fit:['선·색·형태에 호기심이 많고 손으로 탐색하는 걸 좋아하는 아이','감정표현이 서툴지만 그림에서 마음이 잘 드러나는 아이','정답보다 자기 속도로 탐색하는 경험이 필요한 아이'],
    options:['5~7세 감각의 숲','초등 상징의 숲','잘 모르겠어요 (상담 후 결정)'],
    detail_page:'program-child.html'
  },
  {
    id:'youth', enabled:true, category:'youth', color:'berry', status:'모집중',
    title:'YOUTH ART', subtitle:'크레용숲 사유의 숲',
    target:'중·고등학생', schedule:'주 1회 100분 · 그룹수업(최대 6명)', price:'', place:'크레용숲 (위례)',
    image:'',
    summary:'감각→감정→상징→해석, 4개의 방을 거치며 나만의 세계관을 완성해가는 청소년 사유의 숲',
    description:'감각→감정→상징→해석의 4개 방을 각 3개월씩 거치며 색·기억·상징·언어로 나만의 철학과 세계관을 완성해가는 청소년 사유의 숲입니다.',
    curriculum:['4ROOM 사유구조 (감각 → 감정 → 상징 → 해석)','각 방 3개월, 1년 과정','주 1회 100분 · 최대 6명 그룹수업'],
    fit:['감정의 결이 깊고 마음을 오래 바라보는 성향의 아이','정답보다 자기 생각을 갖고 싶은 아이','입시보다 서사·정체성·내적 성장을 중요하게 여기는 부모님'],
    options:['상담 후 결정'],
    detail_page:'program-youth.html'
  },
  {
    id:'adult', enabled:true, category:'adult', color:'clay', status:'상시',
    title:'ADULT ART', subtitle:'크레용숲 예술리추얼 · 창조의 숲',
    target:'성인 전체', schedule:'일정 공지 후 상시 진행', price:'', place:'크레용숲 (위례)',
    image:'',
    summary:'감정 리추얼 · 컬러링테라피 · 패턴드로잉으로 나만의 색과 서사를 발견하는 시간',
    description:'일상에서 잃어버린 감각과 감정의 언어를 회복하고, 나만의 색·패턴·서사를 발견하는 창의성 회복 프로그램입니다.',
    curriculum:['감정 리추얼','컬러링테라피','패턴드로잉'],
    fit:['오랜만에 나를 위한 시간을 갖고 싶은 분','색과 드로잉을 통해 감정 언어를 배우고 싶은 분','"예술은 어려울까?" 걱정되지만 마음으로 그리는 경험을 원하는 분'],
    options:['일정 안내 후 선택'],
    detail_page:'program-adult.html'
  },
  {
    id:'mom', enabled:true, category:'mom', color:'sage', status:'상시',
    title:'FOR MOM', subtitle:'크레용숲 정원사 · 창조의 숲',
    target:'자녀를 둔 어머니', schedule:'일정 공지 후 상시 진행', price:'', place:'크레용숲 (위례)',
    image:'',
    summary:'엄마 자신의 마음에 물을 주고 다시 감각을 되찾는 웰니스 커뮤니티',
    description:'엄마 자신의 마음에 물을 주고 다시 감각을 되찾는 시간. 완벽한 엄마가 되기보다, 나 자신과 다시 연결되는 길을 함께 걷습니다.',
    curriculum:['마음 돌봄 예술 시간','웰니스 커뮤니티'],
    fit:['무언가를 더 배우기보다 잠시 내려놓고 싶은 엄마','엄마라는 역할 뒤에 가려진 나를 다시 느끼고 싶은 분','작지만 확실한 나만의 시간이 필요한 분'],
    options:['일정 안내 후 선택'],
    detail_page:'program-mom.html'
  }
];

function escHtml(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function nl2br(s){ return escHtml(s).replace(/\n/g, '<br>'); }


/* ---------- 수업 데이터 불러오기 ----------
 * 1순위: 구글 시트 "수업목록" (선생님이 class-admin.html에서 올린 수업)
 * 2순위: content/programs.json (시트가 비어 있거나 연결이 안 될 때의 예비 목록)
 * 3순위: 이 파일 안의 DEFAULT_PROGRAMS
 * 처음 열 때 느리지 않도록, 직전에 받은 목록을 브라우저에 기억해 두었다가 먼저 보여주고
 * 곧바로 최신 목록으로 바꿔 줘요. */
const CLASSES_URL = "https://script.google.com/macros/s/AKfycbyahvBkqM7NVzHde2vdtpWTGdOhaUs8i-ewGe9WBpuyyetVIv1VEPJrhhCNy3fgrmad/exec";
const CLASS_CACHE_KEY = 'cf_classes_v1';
function cacheGet(){ try{ return JSON.parse(localStorage.getItem(CLASS_CACHE_KEY) || 'null'); }catch(e){ return null; } }
function cacheSet(d){ try{ localStorage.setItem(CLASS_CACHE_KEY, JSON.stringify(d)); }catch(e){} }

function loadFallbackPrograms(){
  return fetch('content/programs.json', { cache:'no-store' })
    .then(r => { if(!r.ok) throw new Error('http'); return r.json(); })
    .then(j => (j && Array.isArray(j.items) && j.items.length) ? j.items : DEFAULT_PROGRAMS)
    .catch(() => DEFAULT_PROGRAMS)
    .then(items => ({ items: items.filter(p => p && p.enabled !== false && p.id), sections: DEFAULT_SECTIONS, counts: null }));
}
function normalizeClassData(d){
  const items = (d.items || []).filter(p => p && p.enabled !== false && p.id);
  return { items, sections: (d.sections && d.sections.length) ? d.sections : DEFAULT_SECTIONS, counts: d.counts || null };
}
// onData(data, source) 는 처음 한 번, 그리고 최신 목록이 도착하면 한 번 더 불려요.
function loadClassData(onData){
  let delivered = false;
  const deliver = (d, src) => { delivered = true; onData(normalizeClassData(d), src); };
  const cached = cacheGet();
  if(cached && cached.items && cached.items.length) deliver(cached, 'cache');
  return fetch(CLASSES_URL + '?action=classes')
    .then(r => r.json())
    .then(d => {
      if(d && Array.isArray(d.items) && d.items.length){ cacheSet(d); deliver(d, 'live'); return; }
      throw new Error('empty');
    })
    .catch(() => { if(!delivered) return loadFallbackPrograms().then(d => deliver(d, 'fallback')); });
}

// counts: { 수업id: 신청 인원 합계 } 또는 null(모름)
function seatInfo(p, counts){
  const cap = Number(p.capacity) || 0;
  const manualClosed = p.status === '마감';
  if(!cap) return { cap:0, left:null, full:manualClosed, status:p.status || '' };
  if(!counts) return { cap, left:null, full:manualClosed, status:p.status || '' };
  const used = Number(counts[p.id]) || 0;
  const left = Math.max(cap - used, 0);
  const full = manualClosed || left <= 0;
  return { cap, left, full, status: full ? '마감' : (p.status || '모집중') };
}

function seatLabel(si){
  if(!si.cap) return '';
  if(si.full) return `정원 ${si.cap}명 · 마감`;
  return `정원 ${si.cap}명`;
}

// 카드 한 장 — 사진이 위, 제목, 구분선, 기간 / 요일·시간 / 정원 (클릭하면 상세·신청)
function renderProgramCard(p, counts){
  const c = PROGRAM_COLORS[p.color] || PROGRAM_COLORS.gold;
  const si = seatInfo(p, counts);
  const tag = (PROGRAM_CATEGORIES.find(x => x.key === p.category) || {}).label || '';
  const lines = [];
  if(p.period) lines.push(escHtml(p.period));
  if(p.day_time) lines.push(escHtml(p.day_time));
  if(!p.period && !p.day_time){ if(p.schedule) lines.push(escHtml(p.schedule)); if(p.target) lines.push(escHtml(p.target)); }
  const seat = seatLabel(si);
  const seatCls = si.full ? ' full' : (si.left !== null && si.left <= 2 ? ' low' : '');
  return `
  <a class="cls-card" href="program.html?id=${encodeURIComponent(p.id)}">
    <div class="cls-photo" style="background:${c.grad};">
      ${p.image ? `<img src="${escHtml(p.image)}" alt="${escHtml(p.title)}" loading="lazy">` : `<span class="cls-ph">${escHtml(tag || 'CRAYON')}</span>`}
      ${si.status ? `<span class="cls-status${si.full ? ' closed' : ''}">${escHtml(si.status)}</span>` : ''}
    </div>
    <div class="cls-body">
      <h3 class="cls-title">${escHtml(p.title)}</h3>
      <div class="cls-meta">
        ${lines.map(l => `<div>${l}</div>`).join('')}
        ${seat ? `<div class="cls-seat${seatCls}">${seat}</div>` : ''}
        ${!lines.length && !seat ? `<div>${p.price ? escHtml(p.price) : '자세히 보기'}</div>` : ''}
      </div>
    </div>
  </a>`;
}

// 구분별 섹션(제목 + 카드 줄) HTML. perSection: 구분마다 보여줄 최대 장수(0이면 전부)
function renderClassSections(data, perSection){
  const items = data.items, counts = data.counts;
  const known = new Set(data.sections.map(s => s.key));
  const sections = data.sections.slice();
  items.forEach(p => {   // 구분표에 없는 분류가 있어도 빠지지 않게
    if(!known.has(p.category)){
      known.add(p.category);
      sections.push({ key:p.category, title:(PROGRAM_CATEGORIES.find(x => x.key === p.category) || {}).label || '기타', sub:'', order:99 });
    }
  });
  const html = sections.map(sec => {
    const list = items.filter(p => p.category === sec.key);
    if(!list.length) return '';
    const shown = perSection ? list.slice(0, perSection) : list;
    return `
    <section class="cls-section" id="sec-${escHtml(sec.key)}">
      <div class="cls-sec-head"><h2>${escHtml(sec.title)}</h2>${sec.sub ? `<span>${escHtml(sec.sub)}</span>` : ''}</div>
      <div class="cls-grid">${shown.map(p => renderProgramCard(p, counts)).join('')}</div>
    </section>`;
  }).join('');
  return html || '<div class="prog-empty">지금 모집 중인 수업이 없어요. 곧 새 수업이 열릴 거예요 🌿</div>';
}
