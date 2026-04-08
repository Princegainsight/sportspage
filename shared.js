// shared.js — session helpers used across all pages

// ── 1. Gainsight PX Tag ───────────────────────────────────────────────────
(function(n,t,a,e,co){
  var i="aptrinsic";
  n[i]=n[i]||function(){(n[i].q=n[i].q||[]).push(arguments)};
  n[i].p=e; n[i].c=co;
  var r=t.createElement("script");
  r.async=!0, r.src=a+"?a="+e;
  var c=t.getElementsByTagName("script")[0];
  c.parentNode.insertBefore(r,c);
})(window, document, "https://web-sdk.aptrinsic.com/api/aptrinsic.js", "AP-NUB1I4HQ7CAH-2");

// ── 2. Identify call — fires on every page if user is logged in ───────────
(function fireIdentifyIfLoggedIn() {
  const raw = sessionStorage.getItem('sp_user');
  if (!raw) return; // not logged in — skip silently

  const user = JSON.parse(raw);
  const firstName = user.name.split(' ')[0];
  const lastName  = user.name.split(' ').slice(1).join(' ');

  window.addEventListener('load', function () {
    if (typeof aptrinsic !== 'function') return;

    aptrinsic("identify",
      {
        // ── User Fields ──────────────────────────────
        "id"         : user.email,        // Required — unique user identifier
        "email"      : user.email,
        "firstName"  : firstName,
        "lastName"   : lastName,
        "signUpDate" : Date.now(),          // current date as unix ms
        "plan"       : "gold",            // custom attribute
        "price"      : 95.5,             // custom attribute
        "userHash"   : ""                 // optional HMAC — leave empty if not using
      },
      {
        // ── Account Fields ───────────────────────────
        "id"      : "IBM",                        // Required — account identifier
        "name"    : "International Business Machine",
        "Program" : "Platinum"                    // custom attribute
      }
    );
  });
})();

function getUser() {
  const raw = sessionStorage.getItem('sp_user');
  return raw ? JSON.parse(raw) : null;
}

function setUser(name, email) {
  sessionStorage.setItem('sp_user', JSON.stringify({ name, email }));
}

function clearUser() {
  sessionStorage.removeItem('sp_user');
}

function requireAuth() {
  const user = getUser();
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

function doLogout() {
  clearUser();
  window.location.href = 'index.html';
}

function populateNav(user) {
  const initials = user.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const avatar = document.getElementById('nav-avatar');
  const nameEl = document.getElementById('nav-name');
  if (avatar) avatar.textContent = initials;
  if (nameEl) nameEl.textContent = user.name;
}

function showToast(title, sub) {
  const t = document.getElementById('toast');
  if (!t) return;
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-sub').textContent = sub || '';
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3500);
}

function fireEvent(name, label) {
  if (typeof aptrinsic === 'function') aptrinsic('track', name, { label });
  showToast('PX: ' + name, label);
}

function trackPX(eventName, props) {
  if (typeof aptrinsic === 'function') aptrinsic('track', eventName, props);
  logEvent(eventName, props);
  showToast('⚡ ' + eventName, JSON.stringify(props));
}

function logEvent(name, props) {
  const emptyMsg = document.getElementById('log-empty');
  if (emptyMsg) emptyMsg.style.display = 'none';
  const log = document.getElementById('event-log');
  if (!log) return;
  const row = document.createElement('div');
  row.className = 'log-row';
  row.style.animation = 'fadeIn .3s';
  row.innerHTML = `<span class="log-time">${new Date().toLocaleTimeString()}</span><span class="log-name">${name}</span><span class="log-props">${JSON.stringify(props)}</span>`;
  log.insertBefore(row, log.children[1] || null);
}

// Custom dropdown
function initCustomSelect() {
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#customSel')) {
      const sel = document.getElementById('customSel');
      if (sel) sel.classList.remove('open');
    }
  });
}

function toggleCustom() {
  document.getElementById('customSel').classList.toggle('open');
}

function selectCustom(el, val) {
  document.getElementById('custom-val').textContent = val;
  document.querySelectorAll('.cs-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('customSel').classList.remove('open');
  fireEvent('division_select', 'Division: ' + val);
}

function pillToggle(el, val) {
  el.classList.toggle('sel');
  const days = [...document.querySelectorAll('.pill-opt.sel')].map(e => e.textContent).join(', ');
  fireEvent('training_days_change', 'Days: ' + days);
}

function segClick(btn, val) {
  btn.closest('.btn-seg').querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  fireEvent('category_filter', 'Category: ' + val);
}

function tagClick(btn, val) {
  document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  fireEvent('skill_filter', 'Level: ' + val);
}

function toggleSwitch(btn, label) {
  btn.classList.toggle('on');
  fireEvent('preference_toggle', label + ': ' + (btn.classList.contains('on') ? 'on' : 'off'));
}

function updateRange(v) {
  document.getElementById('rangeVal').textContent = v;
}

let loadTimer;
function toggleLoad() {
  const btn = document.getElementById('btn-load');
  btn.classList.toggle('is-loading');
  clearTimeout(loadTimer);
  if (btn.classList.contains('is-loading'))
    loadTimer = setTimeout(() => btn.classList.remove('is-loading'), 2500);
}
