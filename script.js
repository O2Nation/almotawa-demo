/* Showroom floor interactions */

(() => {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const toastEl = $("[data-toast]");
  let toastTimer;
  const toast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  };

  /* Account */
  const acctBtn = $("[data-account-btn]");
  const acctMenu = $("[data-account-menu]");
  const closeAcct = () => {
    if (!acctMenu) return;
    acctMenu.hidden = true;
    acctBtn?.setAttribute("aria-expanded", "false");
  };
  acctBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = acctMenu.hidden;
    acctMenu.hidden = !open;
    acctBtn.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (e) => {
    if (!$("[data-account]")?.contains(e.target)) closeAcct();
  });

  /* Drawer */
  const drawer = $("[data-drawer]");
  const veil = $("[data-veil]");
  const setDrawer = (open) => {
    drawer?.classList.toggle("open", open);
    if (veil) veil.hidden = !open;
    drawer?.setAttribute("aria-hidden", String(!open));
    $("[data-menu-open]")?.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  };
  $("[data-menu-open]")?.addEventListener("click", () => setDrawer(true));
  $("[data-menu-close]")?.addEventListener("click", () => setDrawer(false));
  veil?.addEventListener("click", () => setDrawer(false));
  $$("[data-drawer] a").forEach((a) => a.addEventListener("click", () => setDrawer(false)));

  /* Search */
  $(".search")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("#q")?.value?.trim();
    if (q) toast(`نتائج البحث عن: ${q}`);
  });

  /* Hero */
  const slides = $$("[data-slide]");
  const dotsWrap = $("[data-hero-dots]");
  let hi = 0;
  let heroTimer;

  const showHero = (i) => {
    if (!slides.length) return;
    hi = (i + slides.length) % slides.length;
    slides.forEach((s, si) => s.classList.toggle("is-active", si === hi));
    if (dotsWrap) {
      [...dotsWrap.children].forEach((d, di) => {
        d.setAttribute("aria-selected", String(di === hi));
        d.tabIndex = di === hi ? 0 : -1;
      });
    }
    if (!reduce) {
      clearInterval(heroTimer);
      heroTimer = setInterval(() => showHero(hi + 1), 6500);
    }
  };

  if (dotsWrap) {
    dotsWrap.innerHTML = "";
    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", `الشريحة ${i + 1}`);
      b.addEventListener("click", () => showHero(i));
      dotsWrap.appendChild(b);
    });
  }
  $("[data-hero-prev]")?.addEventListener("click", () => showHero(hi - 1));
  $("[data-hero-next]")?.addEventListener("click", () => showHero(hi + 1));
  $("[data-hero]")?.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") showHero(hi + 1);
    if (e.key === "ArrowRight") showHero(hi - 1);
  });
  if (slides.length) showHero(0);

  /* Product rails */
  const initRail = (root) => {
    const track = root.querySelector("[data-track]");
    const dots = root.querySelector("[data-dots]");
    if (!track) return;
    const cards = [...track.children];
    let index = 0;
    let sx = 0;
    let dx = 0;

    const perView = () => {
      const w = window.innerWidth;
      if (w >= 1100) return 4;
      if (w >= 768) return 3;
      return 2;
    };
    const gap = () => parseFloat(getComputedStyle(track).gap) || 16;
    const max = () => Math.max(0, cards.length - perView());

    const go = (i) => {
      index = Math.max(0, Math.min(i, max()));
      const w = cards[0]?.getBoundingClientRect().width || 0;
      track.style.transform = `translateX(${index * (w + gap())}px)`;
      if (dots) {
        [...dots.children].forEach((d, di) => d.setAttribute("aria-selected", String(di === index)));
      }
    };

    const buildDots = () => {
      if (!dots) return;
      dots.innerHTML = "";
      for (let i = 0; i <= max(); i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", `مجموعة ${i + 1}`);
        b.addEventListener("click", () => go(i));
        dots.appendChild(b);
      }
    };

    root.querySelector("[data-prev]")?.addEventListener("click", () => go(index - 1));
    root.querySelector("[data-next]")?.addEventListener("click", () => go(index + 1));
    track.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; dx = 0; }, { passive: true });
    track.addEventListener("touchmove", (e) => { dx = e.touches[0].clientX - sx; }, { passive: true });
    track.addEventListener("touchend", () => {
      if (Math.abs(dx) < 40) return;
      go(dx > 0 ? index + 1 : index - 1);
    });
    window.addEventListener("resize", () => { buildDots(); go(Math.min(index, max())); });
    buildDots();
    go(0);
  };
  $$("[data-rail]").forEach(initRail);

  /* Cart + stepper */
  const cartBadge = $("[data-cart-count]");
  let cart = 0;
  const setCart = (n) => {
    cart = Math.max(0, n);
    if (cartBadge) cartBadge.textContent = String(cart);
  };

  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) {
      const card = add.closest("[data-product]");
      const qty = card?.querySelector("[data-qty]");
      add.hidden = true;
      if (qty) qty.hidden = false;
      setCart(cart + 1);
      toast("تمت إضافة المنتج إلى السلة");
      return;
    }

    const minus = e.target.closest("[data-qty-minus]");
    const plus = e.target.closest("[data-qty-plus]");
    if (!minus && !plus) return;
    const wrap = (minus || plus).closest("[data-qty]");
    const valEl = wrap?.querySelector("[data-qty-val]");
    const card = wrap?.closest("[data-product]");
    const addBtn = card?.querySelector("[data-add]");
    let val = Number(valEl?.textContent || 1);

    if (plus) {
      val += 1;
      setCart(cart + 1);
    } else {
      val -= 1;
      setCart(cart - 1);
      if (val < 1) {
        wrap.hidden = true;
        if (addBtn) addBtn.hidden = false;
        if (valEl) valEl.textContent = "1";
        return;
      }
    }
    if (valEl) valEl.textContent = String(val);
  });

  /* Back to top */
  const topBtn = $("[data-top]");
  window.addEventListener("scroll", () => {
    topBtn?.classList.toggle("show", window.scrollY > 500);
  }, { passive: true });
  topBtn?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });

  const year = $("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeAcct();
    setDrawer(false);
  });
})();
