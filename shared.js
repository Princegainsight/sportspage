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

// ── 2. Safe PX wrappers — retry until SDK is fully loaded ────────────────
// Always use pxTrack() and pxIdentify() — never call aptrinsic() directly.
// Retries every 200ms for up to 10 seconds, eliminating async race conditions.

function waitForPX(callback, attempts) {
  attempts = attempts || 0;
  if (attempts > 50) {
    console.warn('[PX] SDK not ready after 10s — giving up.');
    return;
  }
  if (typeof aptrinsic === 'function' && aptrinsic.p) {
    callback();
  } else {
    setTimeout(function() { waitForPX(callback, attempts + 1); }, 200);
  }
}

function pxIdentify(userFields, accountFields) {
  waitForPX(function() {
    aptrinsic('identify', userFields, accountFields);
    console.log('[PX] identify fired for:', userFields.id);
  });
}

function pxTrack(eventName, props) {
  waitForPX(function() {
    aptrinsic('track', eventName, props || {});
    console.log('[PX] track fired:', eventName, props);
  });
}

// ── 3. Auto-identify on every page load if user session exists ────────────
(function fireIdentifyIfLoggedIn() {
  var raw = sessionStorage.getItem('sp_user');
  if (!raw) return;

  var user = JSON.parse(raw);
  var firstName = user.name.split(' ')[0];
  var lastName  = user.name.split(' ').slice(1).join(' ');

  pxIdentify(
    {
      "id"        : user.email,
      "email"     : user.email,
      "firstName" : firstName,
      "lastName"  : lastName,
      "signUpDate": Date.now(),
      "plan"      : "gold",
      "price"     : 95.5,
      "userHash"  : ""
    },
    {
      "id"      : "IBM",
      "name"    : "International Business Machine",
      "Program" : "Platinum"
    }
  );
})();

// ── 4. Session helpers ────────────────────────────────────────────────────

function getUser() {
  var raw = sessionStorage.getItem('sp_user');
  return raw ? JSON.parse(raw) : null;
}

function setUser(name, email) {
  sessionStorage.setItem('sp_user', JSON.stringify({ name: name, email: email }));
}

function clearUser() {
  sessionStorage.removeItem('sp_user');
}

function requireAuth() {
  var user = getUser();
  if (!user) { window.location.href = 'index.html'; return null; }
  return user;
}

function doLogout() {
  clearUser();
  window.location.href = 'index.html';
}

function populateNav(user) {
  var initials = user.name.split(' ').map(function(w){ return w[0]; }).join('').substring(0,2).toUpperCase();
  var avatar = document.getElementById('nav-avatar');
  var nameEl = document.getElementById('nav-name');
  if (avatar) avatar.textContent = initials;
  if (nameEl)  nameEl.textContent = user.name;
}

// ── 5. Toast ──────────────────────────────────────────────────────────────

function showToast(title, sub) {
  var t = document.getElementById('toast');
  if (!t) return;
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-sub').textContent = sub || '';
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(function(){ t.classList.remove('show'); }, 3500);
}

// ── 6. PX event helpers ───────────────────────────────────────────────────

function fireEvent(name, label) {
  pxTrack(name, { label: label });
  showToast('PX: ' + name, label);
}

function trackPX(eventName, props) {
  pxTrack(eventName, props);
  logEvent(eventName, props);
  showToast('⚡ ' + eventName, JSON.stringify(props));
}

function logEvent(name, props) {
  var emptyMsg = document.getElementById('log-empty');
  if (emptyMsg) emptyMsg.style.display = 'none';
  var log = document.getElementById('event-log');
  if (!log) return;
  var row = document.createElement('div');
  row.className = 'log-row';
  row.style.animation = 'fadeIn .3s';
  row.innerHTML = '<span class="log-time">' + new Date().toLocaleTimeString() + '</span>'
    + '<span class="log-name">' + name + '</span>'
    + '<span class="log-props">' + JSON.stringify(props) + '</span>';
  log.insertBefore(row, log.children[1] || null);
}

// ── 7. UI component helpers ───────────────────────────────────────────────

function initCustomSelect() {
  document.addEventListener('click', function(e) {
    if (!e.target.closest('#customSel')) {
      var sel = document.getElementById('customSel');
      if (sel) sel.classList.remove('open');
    }
  });
}

function toggleCustom() {
  document.getElementById('customSel').classList.toggle('open');
}

function selectCustom(el, val) {
  document.getElementById('custom-val').textContent = val;
  document.querySelectorAll('.cs-option').forEach(function(o){ o.classList.remove('selected'); });
  el.classList.add('selected');
  document.getElementById('customSel').classList.remove('open');
  fireEvent('division_select', 'Division: ' + val);
}

function pillToggle(el) {
  el.classList.toggle('sel');
  var days = Array.from(document.querySelectorAll('.pill-opt.sel')).map(function(e){ return e.textContent; }).join(', ');
  fireEvent('training_days_change', 'Days: ' + days);
}

function segClick(btn, val) {
  btn.closest('.btn-seg').querySelectorAll('button').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  fireEvent('category_filter', 'Category: ' + val);
}

function tagClick(btn, val) {
  document.querySelectorAll('.tag-btn').forEach(function(b){ b.classList.remove('active'); });
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

var loadTimer;
function toggleLoad() {
  var btn = document.getElementById('btn-load');
  btn.classList.toggle('is-loading');
  clearTimeout(loadTimer);
  if (btn.classList.contains('is-loading'))
    loadTimer = setTimeout(function(){ btn.classList.remove('is-loading'); }, 2500);
}
