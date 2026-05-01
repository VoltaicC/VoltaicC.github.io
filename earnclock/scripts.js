/* ==========================================
   EARNCLOCK — Live Earnings Dashboard
   scripts.js  v2.1
   ========================================== */

// ── State ────────────────────────────────────────────────────────────────────
const state = {
  running: false,
  hourlyRate: 0,
  sessionStartEpoch: null,  // absolute ms timestamp
  tickInterval: null,
  clockInterval: null,
  lastLoggedMinute: -1,
};

// ── DOM Refs ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const els = {
  earningsValue:  $('earningsValue'),
  hoursWorked:    $('hoursWorked'),
  rateDisplay:    $('rateDisplay'),
  progressFill:   $('progressFill'),
  progressPct:    $('progressPct'),
  progressStart:  $('progressStart'),
  progressEnd:    $('progressEnd'),
  timeRemaining:  $('timeRemaining'),
  liveClock:      $('liveClock'),
  statusDot:      $('statusDot'),
  statusLabel:    $('statusLabel'),
  perMinute:      $('perMinute'),
  projectedTotal: $('projectedTotal'),
  shiftDuration:  $('shiftDuration'),
  sessionTime:    $('sessionTime'),
  hourlyRate:     $('hourlyRate'),
  startDate:      $('startDate'),
  startTime:      $('startTime'),
  endDate:        $('endDate'),
  endTime:        $('endTime'),
  btnStart:       $('btnStart'),
  btnStop:        $('btnStop'),
  btnReset:       $('btnReset'),
  btnClearLog:    $('btnClearLog'),
  logBody:        $('logBody'),
  footerDate:     $('footerDate'),
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatMoney(n, decimals = 2) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatHMS(totalSeconds) {
  const abs = Math.abs(totalSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = Math.floor(abs % 60);
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0'),
  ].join(':');
}

function formatReadable(totalSeconds) {
  const abs = Math.abs(totalSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = Math.floor(abs % 60);
  return `${h}h ${m}m ${s}s`;
}

function formatDuration(totalSeconds) {
  const abs = Math.abs(totalSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  return `${h}h ${m}m`;
}

/**
 * Build an absolute epoch ms from a YYYY-MM-DD date string and HH:MM time string.
 * Returns null if either is missing/invalid.
 */
function buildEpoch(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  if (isNaN(year) || isNaN(hh)) return null;
  return new Date(year, month - 1, day, hh, mm, 0, 0).getTime();
}

/** Today as YYYY-MM-DD */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/** Current time as HH:MM */
function nowTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

/** Date object → YYYY-MM-DD */
function dateToStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/** Format epoch ms to short display, noting "tmr" for tomorrow */
function epochToShort(ms) {
  if (!ms) return '--';
  const d    = new Date(ms);
  const today = new Date(); today.setHours(0,0,0,0);
  const tmr   = new Date(today); tmr.setDate(tmr.getDate()+1);
  const dDay  = new Date(d); dDay.setHours(0,0,0,0);

  let prefix = '';
  if (dDay.getTime() === tmr.getTime()) prefix = 'tmr ';
  else if (dDay.getTime() !== today.getTime()) {
    prefix = d.toLocaleDateString('en-US', {month:'short', day:'numeric'}) + ' ';
  }
  return prefix + d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true });
}

// ── Logging ──────────────────────────────────────────────────────────────────

function addLog(msg, type = '') {
  const el = document.createElement('div');
  el.className = `log-entry log-entry--${type}`;
  const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
  el.textContent = `[ ${ts} ] ${msg}`;
  els.logBody.appendChild(el);
  els.logBody.scrollTop = els.logBody.scrollHeight;
}

// ── Live Clock ───────────────────────────────────────────────────────────────

function startClock() {
  function clockTick() {
    const now = new Date();
    els.liveClock.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    els.footerDate.textContent = now.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    }).toUpperCase();
  }
  clockTick();
  state.clockInterval = setInterval(clockTick, 1000);
}

// ── Get end epoch ─────────────────────────────────────────────────────────────

function getEndEpoch() {
  return buildEpoch(els.endDate.value, els.endTime.value);
}

// ── Update projected/shift stats ──────────────────────────────────────────────

function updateShiftStats() {
  const rate       = parseFloat(els.hourlyRate.value) || 0;
  const startEpoch = buildEpoch(els.startDate.value, els.startTime.value);
  const endEpoch   = getEndEpoch();

  if (startEpoch && endEpoch && endEpoch > startEpoch) {
    const shiftSec  = (endEpoch - startEpoch) / 1000;
    els.shiftDuration.textContent  = formatDuration(shiftSec);
    els.projectedTotal.textContent = formatMoney((shiftSec / 3600) * rate);
  } else {
    els.shiftDuration.textContent  = '--h --m';
    els.projectedTotal.textContent = '0.00';
  }

  els.perMinute.textContent = formatMoney(rate / 60);
}

// ── Main Tick ─────────────────────────────────────────────────────────────────

function tick() {
  if (!state.running || !state.sessionStartEpoch) return;

  const now      = Date.now();
  const endEpoch = getEndEpoch();

  // Cap elapsed time at end epoch so earnings never exceed the shift total
  const effectiveNow = (endEpoch && now >= endEpoch) ? endEpoch : now;
  const elapsedMs  = effectiveNow - state.sessionStartEpoch;
  const elapsedSec = elapsedMs / 1000;
  const earned     = (elapsedSec / 3600) * state.hourlyRate;

  // Auto-stop once end time is reached
  if (endEpoch && now >= endEpoch) {
    els.earningsValue.textContent = formatMoney(earned);
    els.hoursWorked.textContent   = formatReadable(elapsedSec);
    els.sessionTime.textContent   = formatHMS(elapsedSec);
    els.progressFill.style.width  = '100%';
    els.progressPct.textContent   = '100.0%';
    els.timeRemaining.textContent = '\u2713 shift complete!';
    clearInterval(state.tickInterval);
    state.running = false;
    setStatus('idle', 'COMPLETE');
    els.btnStart.disabled   = false;
    els.btnStop.disabled    = true;
    els.hourlyRate.disabled = false;
    els.startDate.disabled  = false;
    els.startTime.disabled  = false;
    addLog(`Shift complete! Duration: ${formatReadable(elapsedSec)} | Total earned: $${formatMoney(earned)}`, 'earn');
    return;
  }

  // Earnings display
  const formatted = formatMoney(earned);
  if (els.earningsValue.textContent !== formatted) {
    els.earningsValue.textContent = formatted;
    els.earningsValue.classList.add('tick');
    setTimeout(() => els.earningsValue.classList.remove('tick'), 100);
  }

  els.hoursWorked.textContent = formatReadable(elapsedSec);
  els.sessionTime.textContent = formatHMS(elapsedSec);
  els.perMinute.textContent   = formatMoney(state.hourlyRate / 60);

  // Projected total = full shift duration x rate (fixed)
  if (endEpoch && endEpoch > state.sessionStartEpoch) {
    const shiftSec = (endEpoch - state.sessionStartEpoch) / 1000;
    els.projectedTotal.textContent = formatMoney((shiftSec / 3600) * state.hourlyRate);
    els.shiftDuration.textContent  = formatDuration(shiftSec);
  }

  updateProgress(now, elapsedMs);

  // Milestone log every 15 min
  const elapsedMin = Math.floor(elapsedSec / 60);
  if (elapsedMin > 0 && elapsedMin !== state.lastLoggedMinute && elapsedMin % 15 === 0) {
    state.lastLoggedMinute = elapsedMin;
    addLog(`${elapsedMin} min elapsed — $${formatMoney(earned)} earned`, 'earn');
  }
}

// ── Progress ─────────────────────────────────────────────────────────────────

function updateProgress(now, elapsedMs) {
  const endEpoch   = getEndEpoch();
  const startEpoch = state.sessionStartEpoch;

  els.progressStart.textContent = epochToShort(startEpoch);
  els.progressEnd.textContent   = endEpoch ? epochToShort(endEpoch) : '--:--';

  if (!endEpoch || !startEpoch || endEpoch <= startEpoch) {
    els.progressFill.style.width  = '0%';
    els.progressPct.textContent   = '–';
    els.timeRemaining.textContent = endEpoch ? 'end must be after start' : 'set end to track progress';
    return;
  }

  const totalMs     = endEpoch - startEpoch;
  const pct         = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
  els.progressFill.style.width = pct.toFixed(2) + '%';
  els.progressPct.textContent  = pct.toFixed(1) + '%';

  const remainingMs = endEpoch - now;
  if (remainingMs <= 0) {
    els.timeRemaining.textContent = '✓ shift complete!';
  } else {
    els.timeRemaining.textContent = formatReadable(remainingMs / 1000) + ' remaining';
  }
}

// ── Session Controls ──────────────────────────────────────────────────────────

function startSession() {
  const rate = parseFloat(els.hourlyRate.value);
  if (!rate || rate <= 0) {
    flashCard(els.hourlyRate, 'Please enter a valid hourly rate.');
    return;
  }

  const startEpoch = buildEpoch(els.startDate.value, els.startTime.value);
  if (!startEpoch) {
    flashCard(els.startTime, 'Please set a valid start date and time.');
    return;
  }

  // Allow up to 5 min in the future for rounding tolerance
  if (startEpoch > Date.now() + 5 * 60 * 1000) {
    flashCard(els.startTime, 'Start time cannot be in the future.');
    return;
  }

  state.hourlyRate        = rate;
  state.sessionStartEpoch = startEpoch;
  state.running           = true;
  state.lastLoggedMinute  = -1;

  els.rateDisplay.textContent = '$' + formatMoney(rate) + '/hr';
  setStatus('active', 'RUNNING');
  els.btnStart.disabled   = true;
  els.btnStop.disabled    = false;
  els.hourlyRate.disabled = true;
  els.startDate.disabled  = true;
  els.startTime.disabled  = true;

  const backdated = startEpoch < Date.now() - 5000;
  addLog(
    `Session started ${epochToShort(startEpoch)} @ $${formatMoney(rate)}/hr${backdated ? ' (backdated)' : ''}`,
    'start'
  );

  tick();
  state.tickInterval = setInterval(tick, 50);
}

function stopSession() {
  if (!state.running) return;
  clearInterval(state.tickInterval);
  state.running = false;

  const elapsedSec = (Date.now() - state.sessionStartEpoch) / 1000;
  const earned     = (elapsedSec / 3600) * state.hourlyRate;

  setStatus('idle', 'STOPPED');
  els.btnStart.disabled   = false;
  els.btnStop.disabled    = true;
  els.hourlyRate.disabled = false;
  els.startDate.disabled  = false;
  els.startTime.disabled  = false;

  addLog(
    `Session stopped. Duration: ${formatReadable(elapsedSec)} | Total earned: $${formatMoney(earned)}`,
    'stop'
  );
}

function resetSession() {
  clearInterval(state.tickInterval);
  state.running           = false;
  state.sessionStartEpoch = null;
  state.lastLoggedMinute  = -1;

  els.earningsValue.textContent   = '0.00';
  els.hoursWorked.textContent     = '0h 0m 0s';
  els.rateDisplay.textContent     = '$0.00/hr';
  els.perMinute.textContent       = '0.00';
  els.projectedTotal.textContent  = '0.00';
  els.shiftDuration.textContent   = '--h --m';
  els.sessionTime.textContent     = '00:00:00';
  els.progressFill.style.width    = '0%';
  els.progressPct.textContent     = '0%';
  els.timeRemaining.textContent   = '-- remaining';
  els.progressStart.textContent   = '--:--';
  els.progressEnd.textContent     = '--:--';

  els.hourlyRate.disabled  = false;
  els.startDate.disabled   = false;
  els.startTime.disabled   = false;
  els.btnStart.disabled    = false;
  els.btnStop.disabled     = true;

  setStatus('', 'IDLE');
  addLog('Dashboard reset.', 'reset');
}

// ── Status ────────────────────────────────────────────────────────────────────

function setStatus(dotClass, label) {
  els.statusDot.className    = 'status-dot' + (dotClass ? ' ' + dotClass : '');
  els.statusLabel.textContent = label;
}

// ── Flash validation ──────────────────────────────────────────────────────────

function flashCard(inputEl, msg) {
  const card = inputEl.closest('.control-card') || inputEl.parentElement;
  card.style.boxShadow   = '0 0 0 2px rgba(255, 68, 68, 0.4)';
  card.style.borderColor = 'rgba(255,68,68,0.6)';
  addLog(`⚠ ${msg}`, 'stop');
  setTimeout(() => {
    card.style.boxShadow   = '';
    card.style.borderColor = '';
  }, 1500);
  inputEl.focus();
}

// ── Event Listeners ───────────────────────────────────────────────────────────

els.btnStart.addEventListener('click', startSession);
els.btnStop.addEventListener('click', stopSession);
els.btnReset.addEventListener('click', resetSession);

els.btnClearLog.addEventListener('click', () => {
  els.logBody.innerHTML = '';
  addLog('Log cleared.', 'system');
});

els.hourlyRate.addEventListener('keydown', e => {
  if (e.key === 'Enter') startSession();
});

// Recalculate projected/shift whenever any input changes
[els.hourlyRate, els.startDate, els.startTime, els.endDate, els.endTime].forEach(el => {
  el.addEventListener('input', updateShiftStats);
  el.addEventListener('change', updateShiftStats);
});

// Log end-time update during active session
[els.endDate, els.endTime].forEach(el => {
  el.addEventListener('change', () => {
    if (state.running) {
      const ep = getEndEpoch();
      if (ep) addLog(`End time updated to ${epochToShort(ep)}`, 'system');
    }
  });
});

// ── Init ──────────────────────────────────────────────────────────────────────

(function init() {
  startClock();

  // Defaults: start = right now
  els.startDate.value = todayStr();
  els.startTime.value = nowTimeStr();

  // End = now + 8 hours (correctly handles midnight crossing via Date arithmetic)
  const endDefault = new Date();
  endDefault.setHours(endDefault.getHours() + 8);
  els.endDate.value = dateToStr(endDefault);
  els.endTime.value = `${String(endDefault.getHours()).padStart(2,'0')}:${String(endDefault.getMinutes()).padStart(2,'0')}`;

  els.footerDate.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  }).toUpperCase();

  setStatus('', 'IDLE');
  updateShiftStats();
})();
