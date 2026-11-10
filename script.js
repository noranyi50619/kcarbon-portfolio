/* ==========================================================================
   한국탄소산업진흥원 기업응답센터 홈페이지 — 공통 스크립트
   외부 라이브러리 없이 동작합니다.
   ========================================================================== */
(function () {
  'use strict';

  /* 센터 이메일 — 바꿀 때는 여기와 HTML의 mailto: 주소를 함께 바꿉니다. */
  var EMAIL = 'jyhwang@kcarbon.or.kr';
  var MAIL_BODY =
    '안녕하세요. 기업응답센터에 상담을 요청드립니다.\n\n' +
    '회사명:\n' +
    '담당자 성함·직함:\n' +
    '회사 소개(주요 제품·기술):\n' +
    '궁금한 점(시제품·특허·해외진출·지원사업 등):\n' +
    '회신받을 연락처:\n';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* 1. 첫 화면 등장: 제목·설명·버튼이 차례로 올라옵니다 */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { root.classList.add('is-loaded'); });
  });

  /* 2. 상단 메뉴: 스크롤하면 흐린 유리 배경 */
  var header = document.querySelector('.site-header');
  function onScrollHeader() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
  }
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* 3. 모바일 메뉴 열기·닫기 */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  function setMenu(open) {
    if (!toggle || !nav) return;
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    if (header) header.classList.toggle('menu-open', open);
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* 4. 이메일 버튼: 제목과 기본 양식을 채워서 메일 프로그램을 엽니다 */
  document.querySelectorAll('a.js-mail').forEach(function (a) {
    var subject = (a.getAttribute('data-subject') || '[상담 문의]') + ' 회사명: ';
    a.setAttribute('href', 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(MAIL_BODY));
  });

  /* 5. 스크롤 등장 모션 (카드는 0.08초 간격) */
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.setAttribute('data-reveal', '');
      child.style.setProperty('--i', i);
    });
  });
  var revealEls = document.querySelectorAll('[data-reveal]');
  function finishReveal(el) {
    el.classList.add('is-in');
    el.addEventListener('transitionend', function done() {
      el.removeAttribute('data-reveal');
      el.style.removeProperty('--i');
      el.removeEventListener('transitionend', done);
    });
  }
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { finishReveal(entry.target); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* 6. 숫자 카운트업 (공개 자료의 실제 숫자만) */
  var counters = document.querySelectorAll('[data-count]');
  function runCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }
  if (!reduceMotion && 'IntersectionObserver' in window && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runCount(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* 7. 대형 이미지 띠: 사진이 있으면 스크롤에 따라 천천히 움직임(패럴랙스) */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  if (!reduceMotion && finePointer && parallaxEls.length && window.innerWidth >= 1024) {
    var ticking = false;
    var updateParallax = function () {
      var vh = window.innerHeight;
      parallaxEls.forEach(function (el) {
        var band = el.closest('.band');
        if (!band || band.classList.contains('no-photo')) return;
        var r = band.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var progress = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.transform = 'translate3d(0,' + (progress * -56).toFixed(1) + 'px,0)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(updateParallax); ticking = true; }
    }, { passive: true });
    updateParallax();
  }

  /* 8. 제품·현장 사진: images 폴더에 파일이 있을 때만 자동으로 나타납니다 */
  function buildPhotos(box) {
    var prefix = box.getAttribute('data-prefix') || 'product-';
    var from = parseInt(box.getAttribute('data-from'), 10);
    var to = parseInt(box.getAttribute('data-to'), 10);
    var alt = box.getAttribute('data-alt') || '사진';
    var section = box.closest('[data-photo-section]');
    for (var i = from; i <= to; i++) {
      (function (n) {
        var fig = document.createElement('figure');
        fig.className = 'pf';
        fig.hidden = true;
        box.appendChild(fig);
        var img = new Image();
        img.decoding = 'async';
        img.alt = alt + ' ' + n;
        img.onload = function () {
          fig.appendChild(img);
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.setAttribute('aria-label', img.alt + ' 크게 보기');
          fig.appendChild(btn);
          fig.hidden = false;
          if (section) section.hidden = false;
          document.dispatchEvent(new CustomEvent('photos:changed'));
        };
        img.onerror = function () { fig.remove(); document.dispatchEvent(new CustomEvent('photos:changed')); };
        img.src = 'images/' + prefix + n + '.jpg';
      })(i);
    }
  }
  document.querySelectorAll('[data-photos]').forEach(buildPhotos);

  /* 갤러리 페이지: 사진이 하나도 없을 때 안내 */
  var galleryEmpty = document.querySelector('[data-gallery-empty]');
  if (galleryEmpty) {
    document.addEventListener('photos:changed', function () {
      var box = document.querySelector('.gallery-grid');
      var pending = box.querySelectorAll('.pf[hidden]').length;
      var shown = box.querySelectorAll('.pf:not([hidden])').length;
      galleryEmpty.hidden = !(pending === 0 && shown === 0);
    });
  }

  /* product-3.jpg가 있으면(사진 3장 이상) 메뉴에 '갤러리'를 보여줍니다 */
  var probe = new Image();
  probe.onload = function () {
    document.querySelectorAll('.nav-gallery').forEach(function (el) { el.hidden = false; });
  };
  probe.src = 'images/product-3.jpg';

  /* 9. 사진 확대 보기(라이트박스): 좌우 버튼·방향키로 넘기기 */
  var lb = null, lbImg, lbCount, list = [], idx = 0, lastFocus = null;
  function makeLightbox() {
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.hidden = true;
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', '사진 크게 보기');
    var x = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
    var l = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
    var r = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
    lb.innerHTML = '<img alt=""><button type="button" class="lb-btn lb-close" aria-label="닫기">' + x +
      '</button><button type="button" class="lb-btn lb-prev" aria-label="이전 사진">' + l +
      '</button><button type="button" class="lb-btn lb-next" aria-label="다음 사진">' + r +
      '</button><p class="lb-count" aria-live="polite"></p>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector('img');
    lbCount = lb.querySelector('.lb-count');
    lb.querySelector('.lb-close').addEventListener('click', closeLb);
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (!lb || lb.hidden) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }
  function show(n) {
    if (!list.length) return;
    idx = (n + list.length) % list.length;
    lbImg.src = list[idx].src;
    lbImg.alt = list[idx].alt;
    lbCount.textContent = (idx + 1) + ' / ' + list.length;
  }
  function closeLb() {
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.pf button');
    if (!btn) return;
    if (!lb) makeLightbox();
    lastFocus = btn;
    list = Array.prototype.slice.call(document.querySelectorAll('.pf:not([hidden]) img'));
    var img = btn.parentElement.querySelector('img');
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    show(list.indexOf(img));
    lb.querySelector('.lb-close').focus();
  });
})();
