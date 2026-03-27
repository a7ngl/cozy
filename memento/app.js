const LIFE_EXPECTANCY = 78;
let birthDate = null;

// Page 1 -> Page 2 (auto after 3s)
const page1 = document.getElementById('page1');
const page2 = document.getElementById('page2');

setTimeout(() => {
  page1.classList.add('fade-out');
  setTimeout(() => {
    page1.classList.add('hidden');
    page2.classList.remove('hidden');
    document.getElementById('birthInput').focus();
  }, 600);
}, 3000);

// Page 2 -> Dashboard
const birthInput = document.getElementById('birthInput');
const enterBtn = document.getElementById('enterBtn');

// Auto-format DD/MM/YYYY
birthInput.addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, '');
  if (v.length > 8) v = v.slice(0, 8);
  if (v.length >= 5) {
    v = v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4);
  } else if (v.length >= 3) {
    v = v.slice(0, 2) + '/' + v.slice(2);
  }
  e.target.value = v;
});

birthInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') enterBtn.click();
});

enterBtn.addEventListener('click', () => {
  const val = birthInput.value;
  const parts = val.split('/');
  if (parts.length !== 3) return;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (!day || !month || !year || year < 1900 || year > 2025) return;

  birthDate = new Date(year, month - 1, day);
  if (isNaN(birthDate.getTime())) return;

  document.getElementById('bornDisplay').textContent = val;

  page2.classList.add('fade-out');
  setTimeout(() => {
    page2.classList.add('hidden');
    const dash = document.getElementById('dashboard');
    dash.classList.remove('hidden');
    dash.classList.add('dashboard-enter');
    initDashboard();
  }, 600);
});

function initDashboard() {
  updateYearProgress();
  updateStats();
  buildWeeksGrid();
  startDeathClock();
}

// --- Year Progress ---
function updateYearProgress() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear() + 1, 0, 1);
  const totalDays = Math.ceil((end - start) / 86400000);
  const dayOfYear = Math.ceil((now - start) / 86400000);
  const percent = ((dayOfYear / totalDays) * 100).toFixed(1);

  document.getElementById('yearPercent').textContent = `${percent}% complete`;
  document.getElementById('yearFill').style.width = `${percent}%`;
  document.getElementById('currentDay').textContent = `Day ${dayOfYear} of ${totalDays}`;
}

// --- Birth Stats ---
function updateStats() {
  if (!birthDate) return;
  const now = new Date();
  const diffMs = now - birthDate;
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());

  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();
  if (months < 0) { years--; months += 12; }
  if (now.getDate() < birthDate.getDate()) { months--; if (months < 0) { years--; months += 12; } }

  document.getElementById('daysAlive').textContent = diffDays.toLocaleString();
  document.getElementById('weeksAlive').textContent = diffWeeks.toLocaleString();
  document.getElementById('monthsAlive').textContent = diffMonths.toLocaleString();
  document.getElementById('ageText').textContent = `${years} years, ${months} months`;

  // Life Progress
  const totalExpectedDays = LIFE_EXPECTANCY * 365.25;
  const passed = Math.min(100, (diffDays / totalExpectedDays) * 100);
  document.getElementById('lifePercent').textContent = passed.toFixed(1);
  document.getElementById('lifeFill').style.width = `${passed}%`;
  document.getElementById('lifeBarLabel').textContent = `${passed.toFixed(1)}%`;
}

// --- Life in Weeks Grid ---
function buildWeeksGrid() {
  if (!birthDate) return;
  const now = new Date();
  const weeksLived = Math.floor((now - birthDate) / (7 * 86400000));
  const totalWeeks = Math.round(LIFE_EXPECTANCY * 52.18);

  const grid = document.getElementById('weeksGrid');
  grid.innerHTML = '';

  for (let i = 0; i < totalWeeks; i++) {
    const dot = document.createElement('div');
    dot.className = `week-dot ${i < weeksLived ? 'lived' : 'remaining'}`;
    grid.appendChild(dot);
  }

  document.getElementById('weeksNote').textContent =
    `${weeksLived.toLocaleString()} weeks lived of ${totalWeeks.toLocaleString()} total`;
}

// --- Death Clock ---
function startDeathClock() {
  function tick() {
    if (!birthDate) return;

    const deathDate = new Date(birthDate);
    deathDate.setFullYear(deathDate.getFullYear() + LIFE_EXPECTANCY);

    const now = new Date();
    const diff = deathDate - now;

    if (diff <= 0) {
      document.getElementById('deathYears').textContent = '00';
      document.getElementById('deathDays').textContent = '000';
      document.getElementById('deathHours').textContent = '00';
      document.getElementById('deathMins').textContent = '00';
      document.getElementById('deathSecs').textContent = '00';
      document.getElementById('drainText').textContent = 'Time\'s up.';
      document.getElementById('drainFill').style.width = '0%';
      return;
    }

    const totalSec = Math.floor(diff / 1000);
    const years = Math.floor(totalSec / (365.25 * 86400));
    const remAfterYears = totalSec - years * Math.floor(365.25 * 86400);
    const days = Math.floor(remAfterYears / 86400);
    const hours = Math.floor((remAfterYears % 86400) / 3600);
    const mins = Math.floor((remAfterYears % 3600) / 60);
    const secs = remAfterYears % 60;

    document.getElementById('deathYears').textContent = String(years).padStart(2, '0');
    document.getElementById('deathDays').textContent = String(days).padStart(3, '0');
    document.getElementById('deathHours').textContent = String(hours).padStart(2, '0');
    document.getElementById('deathMins').textContent = String(mins).padStart(2, '0');
    document.getElementById('deathSecs').textContent = String(secs).padStart(2, '0');

    const totalLife = LIFE_EXPECTANCY * 365.25 * 86400000;
    const lived = now - birthDate;
    const percentLeft = Math.max(0, ((totalLife - lived) / totalLife) * 100);
    document.getElementById('drainFill').style.width = `${percentLeft}%`;
    document.getElementById('drainText').textContent = `${percentLeft.toFixed(6)}% remaining... and dropping`;
  }

  tick();
  setInterval(tick, 1000);
}
