let historyStack = [];
let currentScreen = null;
let testCache = null;

async function loadTest() {
  if (testCache) return testCache;
  const res = await fetch('test.json');
  testCache = await res.json();
  return testCache;
}

function createButton(text, onClick, extraClass = '', id = '') {
  const btn = document.createElement('button');
  btn.className = `btn btn-primary w-100 ${extraClass}`.trim();
  btn.textContent = text;
  btn.onclick = onClick;
  if (id) btn.id = id;
  return btn;
}

function showStartScreen(test, container, startTest) {
  currentScreen = { type: 'start' };
  historyStack = [];
  setBackBtnInactive(true);
  setResetBtnInactive(true);
  showTestDesc(true);
  container.innerHTML = '<h2 class="mb-4 text-center">Выберите проблему</h2>';
  const btnsDiv = document.createElement('div');
  btnsDiv.className = 'start-btns';
  Object.entries(test.custom_starts).forEach(([label, qid]) => {
    const btn = createButton(label, () => {
      historyStack.push(currentScreen);
      setBackBtnInactive(false);
      setResetBtnInactive(false);
      showTestDesc(false);
      startTest(qid);
    });
    btnsDiv.appendChild(btn);
  });
  const defBtn = createButton('Провести диагностику современного состояния', () => {
    historyStack.push(currentScreen);
    setBackBtnInactive(false);
    setResetBtnInactive(false);
    showTestDesc(false);
    startTest(test.start);
  });
  btnsDiv.appendChild(defBtn);
  container.appendChild(btnsDiv);
}

function showQuestion(qid, test, container, showResult) {
  currentScreen = { type: 'question', qid };
  setBackBtnInactive(false);
  setResetBtnInactive(false);
  showTestDesc(false);
  const q = test.questions[qid];
  if (!q) {
    container.innerHTML = '<div class="alert alert-danger">Вопрос не найден</div>';
    return;
  }
  container.innerHTML = '';
  const qText = document.createElement('div');
  qText.className = 'question-text';
  qText.textContent = q.text;
  container.appendChild(qText);
  const answersDiv = document.createElement('div');
  answersDiv.className = 'answers-row flex-column';
  Object.entries(q.answers).forEach(([answer, nextId]) => {
    const btn = createButton(answer, () => {
      historyStack.push(currentScreen);
      setBackBtnInactive(false);
      setResetBtnInactive(false);
      showTestDesc(false);
      if (nextId.startsWith('result')) {
        showResult(nextId);
      } else {
        showQuestion(nextId, test, container, showResult);
      }
    });
    answersDiv.appendChild(btn);
  });
  container.appendChild(answersDiv);
}

function showResultScreen(resultId, test, container) {
  currentScreen = { type: 'result', resultId };
  setBackBtnInactive(true);
  setResetBtnInactive(true);
  showTestDesc(false);
  const text = test.results[resultId] || 'Результат не найден';
  container.innerHTML = '';
  const block = document.createElement('div');
  block.className = 'result-block';
  block.innerHTML = `
    <h4>Рекомендация</h4>
    <p>${text}</p>
  `;
  container.appendChild(block);
  // Кнопка "Пройти заново" как все остальные
  const btnsDiv = document.createElement('div');
  btnsDiv.className = 'answers-row flex-column';
  btnsDiv.appendChild(createButton('Пройти заново', () => {
    showStartScreen(test, container, (qid) => {
      showQuestion(qid, test, container, (rid) => showResultScreen(rid, test, container));
    });
  }));
  container.appendChild(btnsDiv);
}

function setBackBtnInactive(inactive) {
  const btn = document.getElementById('back-btn');
  if (inactive) btn.classList.add('inactive');
  else btn.classList.remove('inactive');
}
function setResetBtnInactive(inactive) {
  const btn = document.getElementById('restart-btn');
  if (inactive) btn.classList.add('inactive');
  else btn.classList.remove('inactive');
}
function showTestDesc(show) {
  const desc = document.getElementById('test-desc');
  if (!desc) return;
  if (show) desc.classList.remove('hidden');
  else desc.classList.add('hidden');
}

function showAboutModal() {
  let modal = document.getElementById('about-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'about-modal';
    modal.tabIndex = 0;
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.25)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '9999';
    modal.innerHTML = `
      <div style="background:var(--container-bg,#fff); color:var(--text,#222); border-radius:16px; max-width:400px; padding:2rem 1.5rem; box-shadow:0 8px 32px 0 rgba(0,0,0,0.18); text-align:center; position:relative;">
        <button style="position:absolute;top:10px;right:10px;" class="btn-close" id="close-about" aria-label="Закрыть"></button>
        <h5>О тесте</h5>
        <p>Эколого-водохозяйственная оценка направлена на выявление проблем в сфере водоснабжения населенных пунктов. Она учитывает природные особенности территории и затрагивает социально-экономические аспекты развития районов и населенных пунктов, в том числе состояние водохозяйственной сферы.  
Алгоритм эколого-водохозяйственной оценки является инструментом для систематического анализа и принятия решений в сфере водоснабжения, учитывая экологические, экономические и социальные аспекты. Она позволяет структурировать процессы и обеспечить комплексный подход к решению проблем водоснабжения, что особенно важно для долгосрочного планирования и устойчивого развития территорий.</p>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('close-about').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    document.addEventListener('keydown', escClose, { once: true });
    function escClose(e) { if (e.key === 'Escape') modal.remove(); }
    setTimeout(() => modal.focus(), 10);
  } else {
    modal.focus();
  }
}

function setThemeIcon() {
  const icon = document.getElementById('theme-icon');
  const dark = document.body.classList.contains('dark');
  icon.innerHTML = dark
    // Flat moon
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-moon" viewBox="0 0 16 16"><path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278M4.858 1.311A7.27 7.27 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.32 7.32 0 0 0 5.205-2.162q-.506.063-1.029.063c-4.61 0-8.343-3.714-8.343-8.29 0-1.167.242-2.278.681-3.286"/></svg>`
    // Flat sun
    : `<svg width="26" height="26" viewBox="0 0 26 26" fill="none"><circle cx="13" cy="13" r="7" fill="#FFD600"/><g stroke="#FFD600" stroke-width="2"><line x1="13" y1="2" x2="13" y2="6"/><line x1="13" y1="20" x2="13" y2="24"/><line x1="2" y1="13" x2="6" y2="13"/><line x1="20" y1="13" x2="24" y2="13"/><line x1="5.22" y1="5.22" x2="8.05" y2="8.05"/><line x1="17.95" y1="17.95" x2="20.78" y2="20.78"/><line x1="5.22" y1="20.78" x2="8.05" y2="17.95"/><line x1="17.95" y1="8.05" x2="20.78" y2="5.22"/></g></svg>`;
}

function toggleTheme() {
  const body = document.body;
  const dark = body.classList.toggle('dark');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  setThemeIcon();
}

function applySavedTheme() {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
  setThemeIcon();
}

window.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('test-app');
  const test = await loadTest();

  function start(qid) {
    showQuestion(qid, test, container, (rid) => showResultScreen(rid, test, container));
  }

  showStartScreen(test, container, start);
  applySavedTheme();

  // Header buttons
  document.getElementById('about-btn').onclick = showAboutModal;
  document.getElementById('restart-btn').onclick = () => {
    if (currentScreen && (currentScreen.type === 'start' || currentScreen.type === 'result')) return;
    showStartScreen(test, container, start);
  };
  document.getElementById('back-btn').onclick = () => {
    if (currentScreen && (currentScreen.type === 'start' || currentScreen.type === 'result')) return;
    if (historyStack.length > 0) {
      const prev = historyStack.pop();
      if (!prev) return;
      if (prev.type === 'start') {
        showStartScreen(test, container, start);
      } else if (prev.type === 'question') {
        showQuestion(prev.qid, test, container, (rid) => showResultScreen(rid, test, container));
      } else if (prev.type === 'result') {
        showResultScreen(prev.resultId, test, container);
      }
    } else {
      showStartScreen(test, container, start);
    }
  };
  document.getElementById('theme-toggle').onclick = () => {
    toggleTheme();
  };
}); 
