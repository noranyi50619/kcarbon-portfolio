/* =========================================================
   황지영 업무 포트폴리오 — 공통 동작
   1) 섹션이 부드럽게 올라오는 효과
   2) images 폴더의 이미지를 찾아서 있으면 보여 주기
   3) 결과물 갤러리 크게 보기
   4) 이메일 주소 복사
   5) 온라인 문의 → 구글 폼 보내기
   6) 첫 화면 배경: 움직이는 입자
   7) 회사소식·기술동향: 글이 있으면 '등록된 글이 없습니다' 안내 숨기기
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 1) 부드럽게 올라오는 효과 ---------- */
  var reveals = document.querySelectorAll(".reveal");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function showAll() {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  if (reduceMotion || !("IntersectionObserver" in window)) {
    showAll();
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- 2) 이미지 자동 표시 ----------
     data-img="hero" 처럼 적힌 자리는 images/hero.jpg → .png → .jpeg → .webp 순서로 찾습니다.
     파일이 있으면 보이고, 없으면 숨긴 채로 둡니다. (파일을 넣고 새로고침하면 바로 나옵니다) */
  var EXTS = ["jpg", "png", "jpeg", "webp"];

  function loadImage(img, done) {
    var base = img.getAttribute("data-img");
    var i = 0;

    img.onload = function () {
      img.onload = img.onerror = null;
      img.hidden = false;
      var host = img.closest("[data-img-host]");
      if (host) host.classList.add("has-img");
      if (done) done(true);
    };
    img.onerror = function () {
      if (i < EXTS.length) {
        img.src = "images/" + base + "." + EXTS[i++];
      } else {
        img.onload = img.onerror = null;
        img.removeAttribute("src");
        img.hidden = true;
        if (done) done(false);
      }
    };
    img.onerror();
  }

  document.querySelectorAll("img[data-img]").forEach(function (img) {
    if (img.closest(".gallery-item")) return; // 갤러리는 아래에서 따로 처리
    loadImage(img);
  });

  /* ---------- 3) 결과물 갤러리 ---------- */
  var gallery = document.getElementById("gallery");
  if (gallery) {
    var items = gallery.querySelectorAll(".gallery-item");
    var loaded = 0;
    var finished = 0;

    items.forEach(function (item) {
      loadImage(item.querySelector("img"), function (ok) {
        finished++;
        if (ok) {
          loaded++;
          item.hidden = false;
        }
        // product 이미지가 3장 이상 있을 때만 갤러리를 보여 줍니다
        if (finished === items.length && loaded >= 3) {
          gallery.hidden = false;
        }
      });
    });

    var box = gallery.querySelector(".lightbox");
    var boxImg = box.querySelector("img");
    var boxCap = box.querySelector("p");

    items.forEach(function (item) {
      item.addEventListener("click", function () {
        var img = item.querySelector("img");
        boxImg.src = img.src;
        boxImg.alt = img.alt;
        boxCap.textContent = item.querySelector(".cap").textContent;
        if (typeof box.showModal === "function") {
          box.showModal();
        } else {
          window.open(img.src, "_blank");
        }
      });
    });

    box.querySelector(".lightbox-close").addEventListener("click", function () { box.close(); });
    box.addEventListener("click", function (e) {
      if (e.target === box) box.close();
    });
  }

  /* ---------- 4) 이메일 주소 복사 ---------- */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    var status = document.querySelector(".copy-status");

    function say(msg) {
      if (status) status.textContent = msg;
    }

    function fallbackCopy(text) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "absolute";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(area);
      return ok;
    }

    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () {
          say("이메일 주소를 복사했습니다.");
        }, function () {
          say(fallbackCopy(text) ? "이메일 주소를 복사했습니다." : "복사하지 못했습니다. 주소를 직접 선택해 복사해 주세요.");
        });
      } else {
        say(fallbackCopy(text) ? "이메일 주소를 복사했습니다." : "복사하지 못했습니다. 주소를 직접 선택해 복사해 주세요.");
      }
    });
  });

  /* ---------- 5) 온라인 문의 → 구글 폼 ----------
     구글 폼과 연결하려면 아래 GOOGLE_FORM 두 곳만 채우면 됩니다.
     - action: 구글 폼 주소 끝의 'viewform'을 'formResponse'로 바꾼 주소
     - entry : 각 질문의 번호 (구글 폼 '미리 채워진 링크'에서 확인, 예: "entry.123456789")
     비어 있으면 방문자의 메일 프로그램을 열어 같은 내용을 이메일로 보내게 합니다. */
  var GOOGLE_FORM = {
    action: "",
    entry: {
      name: "",
      org: "",
      email: "",
      message: "",
      consent: ""
    }
  };
  var MAIL_TO = "info@kcarbon.or.kr";

  var inquiry = document.getElementById("inquiry-form");
  if (inquiry) {
    var submitBtn = inquiry.querySelector(".form-submit");
    var submitLabel = submitBtn.innerHTML;
    var formStatus = inquiry.querySelector(".form-status");
    var linked = !!(GOOGLE_FORM.action && GOOGLE_FORM.entry.name && GOOGLE_FORM.entry.email && GOOGLE_FORM.entry.message);

    var field = function (n) { return inquiry.elements[n].value.trim(); };

    inquiry.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = {
        name: field("name"),
        org: field("org"),
        email: field("email"),
        message: field("message"),
        consent: "동의함"
      };

      if (!linked) {
        var body = "이름: " + v.name + "\n소속: " + (v.org || "-") + "\n이메일: " + v.email +
          "\n\n" + v.message + "\n\n개인정보 수집·이용: " + v.consent;
        window.location.href = "mailto:" + MAIL_TO +
          "?subject=" + encodeURIComponent("[홈페이지 문의] " + v.name) +
          "&body=" + encodeURIComponent(body);
        formStatus.textContent = "메일 프로그램이 열리면 내용을 확인하고 보내 주세요.";
        return;
      }

      var data = new URLSearchParams();
      Object.keys(GOOGLE_FORM.entry).forEach(function (k) {
        if (GOOGLE_FORM.entry[k]) data.append(GOOGLE_FORM.entry[k], v[k]);
      });

      submitBtn.disabled = true;
      submitBtn.textContent = "보내는 중…";
      formStatus.textContent = "";

      // 구글 폼은 결과를 돌려주지 않으므로(no-cors) 전송이 끝나면 완료로 안내합니다
      fetch(GOOGLE_FORM.action, { method: "POST", mode: "no-cors", body: data })
        .then(function () {
          inquiry.reset();
          formStatus.textContent = "문의를 보냈습니다. 감사합니다.";
        })
        .catch(function () {
          formStatus.textContent = "보내지 못했습니다. 인터넷 연결을 확인하거나 " + MAIL_TO + "로 메일을 보내 주세요.";
        })
        .then(function () {
          submitBtn.disabled = false;
          submitBtn.innerHTML = submitLabel;
        });
    });
  }

  /* ---------- 6) 첫 화면 배경: 움직이는 입자 ----------
     React 'Antigravity' 효과를 외부 코드 없이 캔버스로 다시 만든 것입니다.
     입자들이 마우스(가만히 있으면 자동으로 떠다니는 점) 주위에 물결치는 고리를 만듭니다.
     아래 값을 바꾸면 모양이 달라집니다. */
  var heroCanvas = document.querySelector(".hero-canvas");
  if (heroCanvas && heroCanvas.getContext) {
    antigravity(heroCanvas, {
      colors: ["#5b9cff", "#2563eb", "#f8fbff"], // 밝은 하늘 파랑 · 코발트 블루 · 맑은 흰색
      count: 1500,
      magnetRadius: 9,
      ringRadius: 7,
      particleSize: 0.9,
      autoAnimate: true,
      colorMode: "conic",
      colorSpeed: 0.05,
      particleShape: "capsule",
      particleVariance: 1,
      fieldStrength: 10,
      waveAmplitude: 1,
      waveCount: 3,
      waveSpeed: 0.4,
      rotationSpeed: 0,
      pulseSpeed: 3,
      depthFactor: 1,
      ambient: 0.25,
      lerpSpeed: 0.05,
      interactive: true,
      clickBurst: true,
      intro: true
    });
  }

  function antigravity(canvas, o) {
    var ctx = canvas.getContext("2d");
    var host = canvas.closest(".hero") || canvas.parentNode;
    var TAU = Math.PI * 2;
    var palette = o.colors.map(function (h) {
      var n = parseInt(h.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    });
    var W = 0, H = 0, unit = 1, parts = [];
    var pointer = { x: 0, y: 0, last: -1e9 };
    var magnet = { x: 0, y: 0 };
    var t0 = performance.now();
    var raf = 0, onScreen = true;

    if (reduceMotion) o.intro = false;

    // 화면이 좁으면 입자 수를 줄여 휴대폰에서도 가볍게
    function particleCount() {
      return Math.round(o.count * (W < 600 ? 0.4 : W < 1000 ? 0.7 : 1));
    }

    function build() {
      parts = [];
      for (var i = 0, n = particleCount(); i < n; i++) {
        var bx = Math.random() * W, by = Math.random() * H;
        parts.push({
          bx: bx, by: by,
          x: o.intro ? W / 2 : bx, y: o.intro ? H / 2 : by,
          vx: 0, vy: 0, near: 0,
          z: Math.random() * 2 - 1,
          s: Math.max(0.3, 1 + (Math.random() - 0.5) * o.particleVariance),
          ph: Math.random() * TAU,
          rot: Math.random() * Math.PI,
          c: i % palette.length
        });
      }
      magnet.x = W / 2;
      magnet.y = H / 2;
    }

    function resize() {
      var r = host.getBoundingClientRect();
      var w = r.width, h = r.height;
      if (!w || !h) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (parts.length && w === W) {
        // 높이만 바뀌면(휴대폰 주소창 등) 입자를 새로 만들지 않고 위치만 맞춥니다
        var k = h / H;
        parts.forEach(function (p) { p.by *= k; p.y *= k; });
        H = h;
      } else {
        W = w;
        H = h;
        build();
      }
      unit = H / 31.5; // 3D 장면의 1칸 → 화면 픽셀
      if (reduceMotion) draw(t0);
    }

    function colorAt(i, ang, t) {
      if (o.colorMode !== "conic") return palette[i];
      var n = palette.length;
      var f = (((ang / TAU + t * o.colorSpeed) % 1) + 1) % 1 * n;
      var k = Math.floor(f), m = f - k;
      var a = palette[k % n], b = palette[(k + 1) % n];
      return [a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m, a[2] + (b[2] - a[2]) * m];
    }

    function draw(now) {
      var t = (now - t0) / 1000;
      var still = reduceMotion;

      // 고리의 중심: 마우스를 움직이면 마우스, 가만히 있으면 천천히 자동으로 떠다님
      var tx = pointer.x, ty = pointer.y;
      if (!o.interactive || now - pointer.last > 2500) {
        tx = o.autoAnimate ? W * (0.5 + 0.32 * Math.sin(t * 0.21)) : W / 2;
        ty = o.autoAnimate ? H * (0.5 + 0.26 * Math.sin(t * 0.33 + 1.3)) : H / 2;
      }
      magnet.x += (tx - magnet.x) * 0.06;
      magnet.y += (ty - magnet.y) * 0.06;

      var magR = o.magnetRadius * unit, ringR = o.ringRadius * unit;
      var fade = o.intro ? Math.min(1, t / 1.4) : 1;
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = "round";

      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var bx = p.bx + Math.sin(t * 0.4 + p.ph) * unit * 0.25;
        var by = p.by + Math.cos(t * 0.33 + p.ph) * unit * 0.25;
        var dx = bx - magnet.x, dy = by - magnet.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 0.001;
        var ang = Math.atan2(dy, dx);
        var gx = bx, gy = by, near = 0;

        if (!still && d < magR) {
          near = Math.min(1, (1 - d / magR) * o.fieldStrength * 0.25);
          var rr = ringR
            + Math.sin(ang * o.waveCount + t * o.waveSpeed * TAU) * o.waveAmplitude * unit
            + p.z * o.depthFactor * unit * 0.8;
          gx = bx + (magnet.x + Math.cos(ang) * rr - bx) * near;
          gy = by + (magnet.y + Math.sin(ang) * rr - by) * near;
        }

        if (still) {
          p.x = gx;
          p.y = gy;
        } else {
          p.x += (gx - p.x) * o.lerpSpeed + p.vx;
          p.y += (gy - p.y) * o.lerpSpeed + p.vy;
          p.vx *= 0.9;
          p.vy *= 0.9;
        }
        p.near += (near - p.near) * 0.1;

        var depth = (p.z + 1) / 2; // 0 = 뒤, 1 = 앞
        var pulse = 0.85 + 0.15 * Math.sin(t * o.pulseSpeed + p.ph);
        var size = o.particleSize * unit * 0.24 * p.s
          * (1 - o.depthFactor * 0.4 + o.depthFactor * 0.6 * depth)
          * (0.6 + 0.6 * p.near) * pulse;
        var alpha = (o.ambient + (1 - o.ambient) * p.near) * (0.45 + 0.55 * depth) * fade;
        if (alpha < 0.02 || size < 0.3) continue;

        var c = colorAt(p.c, ang, t);
        ctx.strokeStyle = ctx.fillStyle =
          "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + "," + alpha.toFixed(3) + ")";

        if (o.particleShape === "capsule") {
          var a = p.near > 0.3 ? ang : p.rot + t * o.rotationSpeed;
          var hx = Math.cos(a) * size * 1.3, hy = Math.sin(a) * size * 1.3;
          ctx.lineWidth = size;
          ctx.beginPath();
          ctx.moveTo(p.x - hx, p.y - hy);
          ctx.lineTo(p.x + hx, p.y + hy);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, size / 2, 0, TAU);
          ctx.fill();
        }
      }
    }

    function loop(now) {
      draw(now);
      raf = requestAnimationFrame(loop);
    }
    function play() {
      if (!raf && !reduceMotion && onScreen && !document.hidden) raf = requestAnimationFrame(loop);
    }
    function pause() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    if (o.interactive && !reduceMotion) {
      host.addEventListener("pointermove", function (e) {
        var r = host.getBoundingClientRect();
        pointer.x = e.clientX - r.left;
        pointer.y = e.clientY - r.top;
        pointer.last = performance.now();
      });
      host.addEventListener("pointerleave", function () { pointer.last = -1e9; });
    }

    // 누른 자리의 입자가 바깥으로 퍼졌다가 돌아옵니다
    if (o.clickBurst && !reduceMotion) {
      host.addEventListener("pointerdown", function (e) {
        var r = host.getBoundingClientRect();
        var cx = e.clientX - r.left, cy = e.clientY - r.top;
        var R = o.magnetRadius * unit * 1.2;
        parts.forEach(function (p) {
          var dx = p.x - cx, dy = p.y - cy;
          var d = Math.sqrt(dx * dx + dy * dy) || 0.001;
          if (d < R) {
            var f = (1 - d / R) * unit * 0.6;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        });
      });
    }

    // 첫 화면이 안 보이거나 다른 탭에 있을 때는 멈춰서 컴퓨터를 쉬게 합니다
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen) play(); else pause();
      }).observe(host);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) pause(); else play();
    });
    window.addEventListener("resize", resize);

    resize();
    t0 = performance.now();
    play();
  }

  /* ---------- 7) 회사소식·기술동향 ---------- */
  document.querySelectorAll(".post-list").forEach(function (list) {
    var empty = list.querySelector(".post-empty");
    if (empty && list.querySelector(".post")) empty.hidden = true;
  });
})();
