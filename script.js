/* ============================================================
   EPLAN PRO — Script
   ============================================================ */

'use strict';

// ── Language System ─────────────────────────────────────────
let currentLang = localStorage.getItem('lang') || 'en';

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  document.documentElement.lang = lang;

  document.querySelectorAll('[data-en]').forEach(el => {
    const text = el.getAttribute(`data-${lang}`);
    if (text) el.textContent = text;
  });

  document.querySelectorAll('[data-placeholder-en]').forEach(el => {
    const ph = el.getAttribute(`data-placeholder-${lang}`);
    if (ph) el.placeholder = ph;
  });

  // Select options
  document.querySelectorAll('select option[data-en]').forEach(opt => {
    const text = opt.getAttribute(`data-${lang}`);
    if (text) opt.textContent = text;
  });

  // Calc options buttons
  document.querySelectorAll('.calc-option[data-en]').forEach(btn => {
    const text = btn.getAttribute(`data-${lang}`);
    if (text) btn.textContent = text;
  });

  // Lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Refresh calculator display
  updateCalculator();
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => applyLang(btn.dataset.lang));
});

// ── Nav scroll & hamburger ───────────────────────────────────
const nav = document.getElementById('nav');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
  updateProgress();
}, { passive: true });

hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

document.addEventListener('click', e => {
  if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
    mobileMenu.classList.remove('open');
  }
});

// ── Progress Bar ─────────────────────────────────────────────
const progressBar = document.getElementById('progressBar');

function updateProgress() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = `${pct}%`;
}

// ── Particles ────────────────────────────────────────────────
const particlesContainer = document.getElementById('particles');
const PARTICLE_COUNT = 30;

for (let i = 0; i < PARTICLE_COUNT; i++) {
  const p = document.createElement('div');
  p.className = 'particle';
  p.style.cssText = `
    left: ${Math.random() * 100}%;
    top: ${40 + Math.random() * 50}%;
    --duration: ${6 + Math.random() * 8}s;
    --delay: ${Math.random() * 8}s;
    width: ${1 + Math.random() * 2}px;
    height: ${1 + Math.random() * 2}px;
    opacity: ${0.2 + Math.random() * 0.5};
  `;
  particlesContainer.appendChild(p);
}

// ── Counters ─────────────────────────────────────────────────
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(ease * target);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// ── Reveal on scroll ─────────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');

      // Counter
      const counters = entry.target.querySelectorAll('.counter');
      counters.forEach(animateCounter);

      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Counters in hero (triggered separately)
const heroCounterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('.counter').forEach(animateCounter);
      heroCounterObserver.disconnect();
    }
  });
}, { threshold: 0.5 });

const statsEl = document.querySelector('.hero__stats');
if (statsEl) heroCounterObserver.observe(statsEl);

// ── Calculator ───────────────────────────────────────────────
const RATES = {
  base_per_page: 18,
  new_factor: 1.0,
  revision_factor: 0.6,
  conversion_factor: 0.8,
  service_3d: 0.35,
  service_bom: 0.12,
  service_cables: 0.15,
  urgency_normal: 1.0,
  urgency_fast: 1.35,
  urgency_rush: 1.7,
  min_price: 3000,
};

let calcState = {
  type: 'new',
  pages: 20,
  schematics: true,
  d3: false,
  bom: false,
  cables: false,
  urgency: 'normal',
};

function calcPrice() {
  const pages = calcState.pages;
  const typeFactor = RATES[`${calcState.type}_factor`];
  const urgFactor = RATES[`urgency_${calcState.urgency}`];

  let base = pages * RATES.base_per_page * typeFactor;

  let addons = 0;
  const breakdown = [];

  if (calcState.schematics) {
    breakdown.push({ label: { en: 'Eplan Schematics', nl: 'Eplan Schema\'s' }, val: base });
  }
  if (calcState.d3) {
    const v = base * RATES.service_3d;
    addons += v;
    breakdown.push({ label: { en: '3D Views', nl: '3D-aanzichten' }, val: v });
  }
  if (calcState.bom) {
    const v = base * RATES.service_bom;
    addons += v;
    breakdown.push({ label: { en: 'Bill of Materials', nl: 'Stuklijst' }, val: v });
  }
  if (calcState.cables) {
    const v = base * RATES.service_cables;
    addons += v;
    breakdown.push({ label: { en: 'Cable Lists', nl: 'Kabellijsten' }, val: v });
  }

  let total = Math.max((base + addons) * urgFactor, RATES.min_price);

  const low = Math.round(total / 100) * 100;
  const high = Math.round(total * 1.4 / 100) * 100;

  return { low, high, breakdown };
}

function fmtNum(n) {
  return n.toLocaleString('nl-NL');
}

function updateCalculator() {
  const { low, high, breakdown } = calcPrice();

  const amountEl = document.getElementById('calcAmount');
  const rangeEl = document.getElementById('calcRange');
  const breakdownEl = document.getElementById('calcBreakdown');

  if (amountEl) amountEl.textContent = fmtNum(low);
  if (rangeEl) rangeEl.textContent = `– € ${fmtNum(high)}`;

  if (breakdownEl) {
    breakdownEl.innerHTML = breakdown.map(item => `
      <div class="breakdown-item">
        <span>${item.label[currentLang] || item.label.en}</span>
        <span>€ ${fmtNum(Math.round(item.val))}</span>
      </div>
    `).join('');

    if (calcState.urgency !== 'normal') {
      const labels = {
        fast: { en: 'Fast-track surcharge', nl: 'Spoedtoeslag (snel)' },
        rush: { en: 'Rush surcharge', nl: 'Spoedtoeslag' },
      };
      breakdownEl.innerHTML += `
        <div class="breakdown-item" style="color: #fbbf24">
          <span>${labels[calcState.urgency][currentLang] || labels[calcState.urgency].en}</span>
          <span>×${RATES[`urgency_${calcState.urgency}`].toFixed(2)}</span>
        </div>
      `;
    }
  }
}

// Project type buttons
document.querySelectorAll('.calc-option[data-value]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.calc-option[data-value]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    calcState.type = btn.dataset.value;
    updateCalculator();
  });
});

// Urgency buttons
document.querySelectorAll('.calc-option[data-urgency]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.calc-option[data-urgency]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    calcState.urgency = btn.dataset.urgency;
    updateCalculator();
  });
});

// Slider
const slider = document.getElementById('pagesSlider');
const display = document.getElementById('pagesDisplay');

if (slider) {
  slider.addEventListener('input', () => {
    calcState.pages = parseInt(slider.value, 10);
    display.textContent = slider.value;
    updateCalculator();
    updateSliderFill();
  });
}

function updateSliderFill() {
  if (!slider) return;
  const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
  slider.style.background = `linear-gradient(to right, var(--accent) ${pct}%, var(--border) ${pct}%)`;
}

updateSliderFill();

// Checkboxes
[
  ['chk-schematics', 'schematics'],
  ['chk-3d', 'd3'],
  ['chk-bom', 'bom'],
  ['chk-cables', 'cables'],
].forEach(([id, key]) => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('change', () => {
      calcState[key] = el.checked;
      updateCalculator();
    });
  }
});

// ── Forms ────────────────────────────────────────────────────
function handleForm(formId, successId) {
  const form = document.getElementById(formId);
  const success = document.getElementById(successId);
  if (!form || !success) return;

  form.addEventListener('submit', e => {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = currentLang === 'nl' ? 'Bezig met verzenden...' : 'Sending...';
    btn.disabled = true;

    setTimeout(() => {
      form.style.display = 'none';
      success.classList.add('visible');
    }, 900);
  });
}

handleForm('contactForm', 'contactSuccess');
handleForm('quoteForm', 'quoteSuccess');

// ── Smooth anchor scroll with offset ─────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 80;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - offset,
      behavior: 'smooth',
    });
  });
});

// ── Init ─────────────────────────────────────────────────────
applyLang(currentLang);
updateCalculator();

// ── Availability Calendar ─────────────────────────────────────

const MONTH_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_NL = ['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];

function availStartDate() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function monthKey(y, m) {
  return `${y}-${String(m).padStart(2, '0')}`;
}

function addMonths(y, m, n) {
  m += n;
  while (m > 12) { m -= 12; y++; }
  while (m < 1)  { m += 12; y--; }
  return { year: y, month: m };
}

function isInAvailRange(y, m) {
  const s = availStartDate();
  const startIdx = s.year * 12 + s.month;
  const endIdx   = startIdx + 35;
  const idx      = y * 12 + m;
  return idx >= startIdx && idx <= endIdx;
}

function loadAvailData() {
  try {
    const raw = localStorage.getItem('availData');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveAvailData(data) {
  localStorage.setItem('availData', JSON.stringify(data));
}

function getAvailPct(data, y, m) {
  return data[monthKey(y, m)] ?? 100;
}

function pctColor(pct) {
  if (pct >= 80) return 'green';
  if (pct >= 40) return 'orange';
  return 'red';
}

function pctHours(pct) {
  return Math.round(pct / 100 * 40);
}


let availData = loadAvailData();

function renderAvailCalendar() {
  const container = document.getElementById('availCalendar');
  if (!container) return;

  const months = currentLang === 'nl' ? MONTH_NL : MONTH_EN;
  const s = availStartDate();
  const endDate = addMonths(s.year, s.month, 35);

  const years = [];
  for (let y = s.year; y <= endDate.year; y++) years.push(y);

  let html = '<div class="avail-grid">';
  html += '<div class="avail-grid__corner"></div>';
  months.forEach(mn => {
    html += `<div class="avail-grid__month-hdr">${mn}</div>`;
  });

  years.forEach(year => {
    html += `<div class="avail-grid__year-lbl">${year}</div>`;
    for (let m = 1; m <= 12; m++) {
      if (!isInAvailRange(year, m)) {
        html += '<div class="avail-grid__empty"></div>';
        continue;
      }
      const pct = getAvailPct(availData, year, m);
      const col = pctColor(pct);
      const hrs = pctHours(pct);
      html += `
        <div class="avail-month avail-month--${col}"
             title="${months[m-1]} ${year}: ${pct}% (${hrs}h/wk)">
          <span class="avail-month__pct">${pct}%</span>
          <span class="avail-month__hrs">${hrs}h</span>
        </div>`;
    }
  });

  html += '</div>';
  container.innerHTML = html;
}

// Re-render on language change
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setTimeout(renderAvailCalendar, 10));
});

// Live-update if the admin edits availability in another tab
window.addEventListener('storage', e => {
  if (e.key === 'availData') {
    availData = loadAvailData();
    renderAvailCalendar();
  }
});

renderAvailCalendar();
