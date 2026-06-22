/* ============================================================
   EPLAN PRO — Admin (Availability Manager)
   ============================================================ */

'use strict';

// ── Auth ──────────────────────────────────────────────────────
// To change the password, replace this value with btoa('YourNewPassword')
const ADMIN_TOKEN = btoa('EplanPro2026');
const SESSION_KEY = 'adminSession';

const loginView    = document.getElementById('loginView');
const editorView   = document.getElementById('editorView');
const headerActions = document.getElementById('adminHeaderActions');
const pwInput      = document.getElementById('pwInput');
const loginError   = document.getElementById('loginError');

function showEditor() {
  loginView.style.display = 'none';
  editorView.style.display = 'block';
  headerActions.style.display = 'flex';
  renderCalendar();
}

function showLogin() {
  loginView.style.display = 'flex';
  editorView.style.display = 'none';
  headerActions.style.display = 'none';
  setTimeout(() => pwInput?.focus(), 100);
}

function attemptLogin() {
  const pw = pwInput.value || '';
  if (btoa(pw) === ADMIN_TOKEN) {
    sessionStorage.setItem(SESSION_KEY, '1');
    showEditor();
  } else {
    loginError.classList.add('visible');
    pwInput.value = '';
    pwInput.focus();
  }
}

document.getElementById('loginBtn').addEventListener('click', attemptLogin);
pwInput.addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(); });

document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem(SESSION_KEY);
  showLogin();
});

// ── Data helpers ──────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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

function isInRange(y, m) {
  const s = availStartDate();
  const startIdx = s.year * 12 + s.month;
  const endIdx   = startIdx + 35;
  const idx      = y * 12 + m;
  return idx >= startIdx && idx <= endIdx;
}

function loadData() {
  try {
    const raw = localStorage.getItem('availData');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveData(data) {
  localStorage.setItem('availData', JSON.stringify(data));
  flashSaved();
}

function getPct(data, y, m) {
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

let availData = loadData();

// ── Saved indicator ───────────────────────────────────────────
const savedMsg = document.getElementById('savedMsg');
let savedTimer = null;

function flashSaved() {
  savedMsg.textContent = '✓ Saved';
  savedMsg.classList.add('visible');
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => savedMsg.classList.remove('visible'), 1800);
}

// ── Calendar render ───────────────────────────────────────────
function renderCalendar() {
  const container = document.getElementById('availCalendar');
  if (!container) return;

  const s = availStartDate();
  const endDate = addMonths(s.year, s.month, 35);
  const years = [];
  for (let y = s.year; y <= endDate.year; y++) years.push(y);

  let html = '<div class="avail-grid">';
  html += '<div class="avail-grid__corner"></div>';
  MONTHS.forEach(mn => {
    html += `<div class="avail-grid__month-hdr">${mn}</div>`;
  });

  years.forEach(year => {
    html += `<div class="avail-grid__year-lbl">${year}</div>`;
    for (let m = 1; m <= 12; m++) {
      if (!isInRange(year, m)) {
        html += '<div class="avail-grid__empty"></div>';
        continue;
      }
      const pct = getPct(availData, year, m);
      const col = pctColor(pct);
      const hrs = pctHours(pct);
      html += `
        <div class="avail-month avail-month--${col} avail-month--editable"
             data-key="${monthKey(year, m)}" data-year="${year}" data-month="${m}"
             title="Click to edit">
          <span class="avail-dot avail-dot--${col}"></span>
          <span class="avail-month__edit-icon">✎</span>
        </div>`;
    }
  });

  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.avail-month--editable').forEach(cell => {
    cell.addEventListener('click', openPopover);
  });
}

// ── Popover ───────────────────────────────────────────────────
const popover      = document.getElementById('availPopover');
const popoverTitle = document.getElementById('popoverTitle');
const popoverSlider = document.getElementById('popoverSlider');
const popoverNum   = document.getElementById('popoverNum');
const popoverHrs   = document.getElementById('popoverHrs');
const popColorGreen  = document.getElementById('popColorGreen');
const popColorOrange = document.getElementById('popColorOrange');
const popColorRed    = document.getElementById('popColorRed');

let activeKey = null;

function openPopover(e) {
  e.stopPropagation();
  const cell = e.currentTarget;
  activeKey = cell.dataset.key;
  const year = cell.dataset.year;
  const month = parseInt(cell.dataset.month, 10);
  const pct = getPct(availData, parseInt(year, 10), month);

  popoverTitle.textContent = `${MONTHS[month - 1]} ${year}`;
  popoverSlider.value = pct;
  popoverNum.value = pct;
  updatePopoverDisplay(pct);

  const rect = cell.getBoundingClientRect();
  const popW = 220;
  let left = rect.left + rect.width / 2 - popW / 2;
  let top  = rect.bottom + 10 + window.scrollY;
  left = Math.max(8, Math.min(left, window.innerWidth - popW - 8));

  popover.style.left = `${left}px`;
  popover.style.top  = `${top}px`;
  popover.classList.add('visible');
}

function closePopover() {
  popover.classList.remove('visible');
  activeKey = null;
}

function updatePopoverDisplay(pct) {
  pct = Math.max(0, Math.min(100, pct));
  popoverHrs.textContent = `= ${pctHours(pct)}h/wk`;
  const col = pctColor(pct);
  popColorGreen.classList.toggle('active',  col === 'green');
  popColorOrange.classList.toggle('active', col === 'orange');
  popColorRed.classList.toggle('active',    col === 'red');
  const s = popoverSlider;
  const fill = ((s.value - s.min) / (s.max - s.min)) * 100;
  s.style.background = `linear-gradient(to right, var(--accent) ${fill}%, var(--border) ${fill}%)`;
}

popoverSlider.addEventListener('input', () => {
  const v = parseInt(popoverSlider.value, 10);
  popoverNum.value = v;
  updatePopoverDisplay(v);
});

popoverNum.addEventListener('input', () => {
  let v = parseInt(popoverNum.value, 10);
  if (isNaN(v)) return;
  v = Math.max(0, Math.min(100, v));
  popoverSlider.value = v;
  updatePopoverDisplay(v);
});

document.getElementById('popoverSave').addEventListener('click', () => {
  if (!activeKey) return;
  availData[activeKey] = Math.max(0, Math.min(100, parseInt(popoverNum.value, 10) || 0));
  saveData(availData);
  closePopover();
  renderCalendar();
});

document.getElementById('popoverCancel').addEventListener('click', closePopover);

document.addEventListener('click', e => {
  if (popover.classList.contains('visible') &&
      !popover.contains(e.target) &&
      !e.target.closest('.avail-month--editable')) {
    closePopover();
  }
}, true);

document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopover(); });

// ── Reset all ─────────────────────────────────────────────────
document.getElementById('resetAllBtn').addEventListener('click', () => {
  if (confirm('Reset all months to 100% available?')) {
    availData = {};
    saveData(availData);
    renderCalendar();
  }
});

// ── Init ──────────────────────────────────────────────────────
if (sessionStorage.getItem(SESSION_KEY) === '1') {
  showEditor();
} else {
  showLogin();
}
