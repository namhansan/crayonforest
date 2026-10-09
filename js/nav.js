/* 크레용숲 공통 메뉴 — 모든 페이지가 같은 메뉴를 쓰도록 한 곳에서 관리해요.
   메뉴를 바꾸고 싶으면 아래 MENU만 고치면 돼요. */
(function(){
  var MENU = [
    { t:'크레용숲 여정', h:'classes.html', sub:[
        ['전체 수업 보기','classes.html'],
        ['커리큘럼 소개','curriculum.html'],
        ['수업 일정','index.html#events'] ] },
    { t:'소개', h:'index.html#about', sub:[
        ['크레용숲 소개','index.html#about'],
        ['우리의 순간','index.html#moments'],
        ['숲 이야기','index.html#story'] ] },
    { t:'성장일지', h:'journal.html' },
    { t:'문의하기', h:'index.html#contact' }
  ];
  var CTA = ['수강신청','classes.html'];

  var css = document.createElement('style');
  css.textContent =
    'nav.menu .nav-dd{position:relative; display:inline-block; padding:10px 0;}' +
    'nav.menu .nav-dd > a::after{content:"▾"; font-size:10px; margin-left:5px; opacity:.55;}' +
    'nav.menu .nav-dd-menu{display:none; position:absolute; top:100%; left:50%; transform:translateX(-50%); min-width:168px; background:#FFFDF8; border:2px solid #2A2622; border-radius:18px; box-shadow:4px 5px 0 #2A2622; padding:8px; z-index:300;}' +
    'nav.menu .nav-dd:hover .nav-dd-menu, nav.menu .nav-dd:focus-within .nav-dd-menu{display:block;}' +
    'nav.menu .nav-dd-menu a{display:block !important; padding:9px 14px; border-radius:12px; font-size:14px; font-weight:600; color:#2C4A3B; opacity:1; white-space:nowrap;}' +
    'nav.menu .nav-dd-menu a:hover{background:#FFF0C9;}' +
    '.mobile-menu .m-sub{padding-left:18px; font-weight:500 !important; font-size:14px !important; color:#6b6459 !important;}';
  document.head.appendChild(css);

  function desktop(){
    return MENU.map(function(m){
      if(!m.sub) return '<a href="'+m.h+'">'+m.t+'</a>';
      return '<div class="nav-dd"><a href="'+m.h+'">'+m.t+'</a><div class="nav-dd-menu">' +
        m.sub.map(function(s){ return '<a href="'+s[1]+'">'+s[0]+'</a>'; }).join('') + '</div></div>';
    }).join('') + '<a href="'+CTA[1]+'" class="cta-btn">'+CTA[0]+'</a>';
  }
  function mobile(){
    return MENU.map(function(m){
      return '<a href="'+m.h+'">'+m.t+'</a>' + (m.sub ? m.sub.map(function(s){ return '<a class="m-sub" href="'+s[1]+'">└ '+s[0]+'</a>'; }).join('') : '');
    }).join('') + '<a href="'+CTA[1]+'" class="cta-btn" style="text-align:center;">'+CTA[0]+'</a>';
  }
  var nav = document.querySelector('nav.menu');
  if(nav) nav.innerHTML = desktop();
  var mm = document.getElementById('mobileMenu');
  if(mm) mm.innerHTML = mobile();
})();
