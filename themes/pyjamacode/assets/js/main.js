const difficultyClasses = {
  easy: 'text-bg-success',
  medium: 'text-bg-warning',
  hard: 'text-bg-danger',
};

const statusClasses = {
  Ready: 'text-bg-secondary',
  Compiled: 'text-bg-info',
  Accepted: 'text-bg-success',
  'Wrong Answer': 'text-bg-danger',
  'Compilation Error': 'text-bg-danger',
  'In progress': 'text-bg-warning',
};

const languageModes = {
  c: 'text/x-csrc',
  cpp: 'text/x-c++src',
  python: 'python',
  assembly: 'gas',
};

const htmlEl = document.documentElement;
const problemDataEl = document.getElementById('problem-data');
const activeProblemInput = document.getElementById('active-problem-id');
const questionListEl = document.getElementById('questionList');
const questionSearchEl = document.getElementById('questionSearch');
const questionContentEl = document.getElementById('questionContent');
const difficultyBadgeEl = document.getElementById('difficultyBadge');
const codeEditorEl = document.getElementById('codeEditor');
const codeEditorWrapper = document.getElementById('codeEditorWrapper');
const languageSelectEl = document.getElementById('languageSelect');
const consoleOutputEl = document.getElementById('consoleOutput');
const statusTextEl = document.getElementById('statusText');
const runBtn = document.getElementById('runBtn');
const submitBtn = document.getElementById('submitBtn');
const clearConsoleBtn = document.getElementById('clearConsole');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const sidebarPane = document.getElementById('sidebarPane');
const editorPane = document.getElementById('editorPane');
const questionPane = document.getElementById('questionPane');
const consoleArea = document.getElementById('consoleArea');
const resizerSidebarEditor = document.getElementById('resizerSidebarEditor');
const resizerEditorQuestion = document.getElementById('resizerEditorQuestion');
const resizerEditorConsole = document.getElementById('resizerEditorConsole');

let questions = [];
let activeQuestionId = null;
let submissions = {};
let codeMirror = null;

function init() {
  if (!problemDataEl || !activeProblemInput) {
    // Not on a platform page (e.g. /problems/ list page).
    return;
  }

  try {
    questions = JSON.parse(problemDataEl.textContent);
  } catch (e) {
    console.error('Failed to parse problem data:', e);
    questions = [];
  }

  activeQuestionId = activeProblemInput.value || (questions[0] && questions[0].id);

  loadTheme();
  initCodeMirror();
  renderQuestionList();
  selectQuestion(activeQuestionId);

  if (questionSearchEl) {
    questionSearchEl.addEventListener('input', (e) => renderQuestionList(e.target.value));
  }
  if (languageSelectEl) {
    languageSelectEl.addEventListener('change', updateCodeMirrorMode);
  }
  if (runBtn) runBtn.addEventListener('click', runCode);
  if (submitBtn) submitBtn.addEventListener('click', submitCode);
  if (clearConsoleBtn) clearConsoleBtn.addEventListener('click', () => (consoleOutputEl.textContent = ''));
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  initResizers();
}

function initResizers() {
  if (resizerSidebarEditor && sidebarPane) {
    setupHorizontalResize(resizerSidebarEditor, sidebarPane, 'left');
  }
  if (resizerEditorQuestion && questionPane) {
    setupHorizontalResize(resizerEditorQuestion, questionPane, 'right');
  }
  if (resizerEditorConsole && consoleArea && editorPane) {
    setupVerticalResize(resizerEditorConsole, consoleArea, editorPane);
  }
}

function setupHorizontalResize(resizer, pane, side) {
  let startX = 0;
  let startWidth = 0;

  resizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startX = e.clientX;
    startWidth = pane.offsetWidth;
    resizer.classList.add('resizing');
    document.body.style.userSelect = 'none';

    const onMouseMove = (e) => {
      const deltaX = e.clientX - startX;
      const multiplier = side === 'left' ? 1 : -1;
      const newWidth = startWidth + deltaX * multiplier;
      const clampedWidth = clamp(newWidth, 180, window.innerWidth * 0.45);
      pane.style.width = `${clampedWidth}px`;
      if (codeMirror) requestAnimationFrame(() => codeMirror.refresh());
    };

    const onMouseUp = () => {
      resizer.classList.remove('resizing');
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (codeMirror) codeMirror.refresh();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

function setupVerticalResize(resizer, pane, container) {
  let startY = 0;
  let startHeight = 0;

  resizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startY = e.clientY;
    startHeight = pane.offsetHeight;
    resizer.classList.add('resizing');
    document.body.style.userSelect = 'none';

    const onMouseMove = (e) => {
      const deltaY = e.clientY - startY;
      const newHeight = startHeight - deltaY;
      const minHeight = 80;
      const maxHeight = container.offsetHeight * 0.7;
      const clampedHeight = clamp(newHeight, minHeight, maxHeight);
      pane.style.height = `${clampedHeight}px`;
      if (codeMirror) requestAnimationFrame(() => codeMirror.refresh());
    };

    const onMouseUp = () => {
      resizer.classList.remove('resizing');
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (codeMirror) codeMirror.refresh();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function initCodeMirror() {
  if (!codeEditorWrapper) return;

  if (typeof CodeMirror === 'undefined') {
    // Fallback to plain textarea if CodeMirror failed to load.
    codeEditorWrapper.style.display = 'none';
    if (codeEditorEl) codeEditorEl.style.display = 'block';
    return;
  }

  codeMirror = CodeMirror(codeEditorWrapper, {
    value: codeEditorEl ? codeEditorEl.value : '',
    mode: languageModes[languageSelectEl ? languageSelectEl.value : 'c'] || 'text/plain',
    theme: getCodeMirrorTheme(),
    lineNumbers: true,
    tabSize: 4,
    indentUnit: 4,
    lineWrapping: true,
    autofocus: false,
  });

  codeMirror.on('change', () => {
    if (codeEditorEl) {
      codeEditorEl.value = codeMirror.getValue();
    }
  });
}

function getCodeMirrorTheme() {
  const theme = htmlEl.getAttribute('data-bs-theme');
  return theme === 'dark' ? 'monokai' : 'eclipse';
}

function updateCodeMirrorMode() {
  if (!codeMirror || !languageSelectEl) return;
  const mode = languageModes[languageSelectEl.value] || 'text/plain';
  codeMirror.setOption('mode', mode);
}

function updateCodeMirrorTheme() {
  if (!codeMirror) return;
  codeMirror.setOption('theme', getCodeMirrorTheme());
}

function getEditorValue() {
  return codeMirror ? codeMirror.getValue() : (codeEditorEl ? codeEditorEl.value : '');
}

function setEditorValue(value) {
  if (codeMirror) {
    codeMirror.setValue(value);
  }
  if (codeEditorEl) {
    codeEditorEl.value = value;
  }
}

function renderQuestionList(filter = '') {
  questionListEl.innerHTML = '';

  const filtered = questions.filter((q) =>
    q.title.toLowerCase().includes(filter.toLowerCase())
  );

  filtered.forEach((q) => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    if (q.id === activeQuestionId) li.classList.add('active');
    if (submissions[q.id]?.status === 'Accepted') li.classList.add('solved');

    li.innerHTML = `
      <div class="question-title">${escapeHtml(q.title)}</div>
      <div class="question-meta">${q.difficulty} · ${submissions[q.id]?.status || 'Not attempted'}</div>
    `;

    li.addEventListener('click', () => selectQuestion(q.id));
    questionListEl.appendChild(li);
  });
}

function selectQuestion(id) {
  activeQuestionId = id;
  const question = questions.find((q) => q.id === id);
  if (!question) return;

  questionContentEl.innerHTML = question.content;
  difficultyBadgeEl.textContent = question.difficulty;
  difficultyBadgeEl.className = 'badge ' + (difficultyClasses[question.difficulty] || 'text-bg-secondary');

  const savedCode = submissions[id]?.code;
  const starterCode = question.initial_code || '';
  setEditorValue(savedCode || starterCode);

  const sub = submissions[id];
  if (sub) {
    consoleOutputEl.textContent = sub.output;
    updateStatus(sub.status);
  } else {
    consoleOutputEl.textContent = 'Ready to code. Click Run to compile or Submit to check your solution.';
    updateStatus('Ready');
  }

  renderQuestionList(questionSearchEl ? questionSearchEl.value : '');
  try {
    history.replaceState(null, '', question.permalink);
  } catch (e) {
    // History API may be restricted on file:// origins.
  }
}

function updateStatus(status) {
  statusTextEl.textContent = status;
  statusTextEl.className = 'badge ' + (statusClasses[status] || 'text-bg-secondary');
}

function saveCurrentCode() {
  if (!activeQuestionId) return;
  if (!submissions[activeQuestionId]) {
    submissions[activeQuestionId] = { status: 'In progress', output: '', code: '' };
  }
  submissions[activeQuestionId].code = getEditorValue();
}

function runCode() {
  if (!activeQuestionId) {
    consoleOutputEl.textContent = 'Please select a question first.';
    return;
  }

  saveCurrentCode();
  consoleOutputEl.textContent = 'Compiling...\n';

  setTimeout(() => {
    consoleOutputEl.textContent += 'Build succeeded. (Simulation mode)\n';
    updateStatus('Compiled');
  }, 600);
}

function submitCode() {
  if (!activeQuestionId) {
    consoleOutputEl.textContent = 'Please select a question first.';
    return;
  }

  saveCurrentCode();
  consoleOutputEl.textContent = 'Running tests...\n';

  setTimeout(() => {
    const question = questions.find((q) => q.id === activeQuestionId);
    const code = getEditorValue().trim();
    const starter = question.initial_code || '';
    const hasContent = code.length > starter.length * 0.8;
    const testCases = question.test_cases || [];
    const expected = testCases[0]?.expected || 'All tests passed';

    let status, output;
    if (hasContent && Math.random() > 0.3) {
      status = 'Accepted';
      output = `All test cases passed.\n${expected}\nExecution time: 12 ms`;
    } else {
      status = 'Wrong Answer';
      output = `Test case 2 failed.\nExpected: ${expected}\nGot: incomplete implementation`;
    }

    submissions[activeQuestionId] = { status, output, code };

    consoleOutputEl.textContent = output;
    updateStatus(status);
    renderQuestionList(questionSearchEl ? questionSearchEl.value : '');
  }, 1000);
}

function toggleTheme() {
  const currentTheme = htmlEl.getAttribute('data-bs-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  htmlEl.setAttribute('data-bs-theme', newTheme);
  themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  updateCodeMirrorTheme();
  try {
    localStorage.setItem('pyjamacode-theme', newTheme);
  } catch (e) {
    // localStorage may be unavailable (e.g. file:// origins).
  }
}

function loadTheme() {
  let savedTheme = 'dark';
  try {
    savedTheme = localStorage.getItem('pyjamacode-theme') || 'dark';
  } catch (e) {
    // localStorage may be unavailable (e.g. file:// origins).
  }
  htmlEl.setAttribute('data-bs-theme', savedTheme);
  themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
