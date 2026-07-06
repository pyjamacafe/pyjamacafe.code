const difficultyClasses = {
  easy: 'text-bg-success',
  medium: 'text-bg-warning',
  hard: 'text-bg-danger',
};

const statusClasses = {
  Unattempted: 'text-bg-secondary',
  'In Progress': 'text-bg-warning',
  Compiled: 'text-bg-info',
  Accepted: 'text-bg-success',
  Wrong: 'text-bg-danger',
  'Compilation Error': 'text-bg-danger',
  'Runtime Error': 'text-bg-danger',
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
const caseTitleEl = document.getElementById('caseTitle');
const codeEditorEl = document.getElementById('codeEditor');
const codeEditorWrapper = document.getElementById('codeEditorWrapper');
const languageLabelEl = document.getElementById('languageLabel');
const consoleOutputEl = document.getElementById('consoleOutput');
const statusTextEl = document.getElementById('statusText');
const workspaceTitleEl = document.getElementById('workspaceTitle');
const runBtn = document.getElementById('runBtn');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const clearConsoleBtn = document.getElementById('clearConsole');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const sidebarPane = document.getElementById('sidebarPane');
const editorPane = document.getElementById('editorPane');
const questionPane = document.getElementById('questionPane');
const consoleArea = document.getElementById('consoleArea');
const resizerCasesCase = document.getElementById('resizerCasesCase');
const resizerCaseWorkspace = document.getElementById('resizerCaseWorkspace');
const resizerEditorConsole = document.getElementById('resizerEditorConsole');

const SUBMISSIONS_STORAGE_KEY = 'pyjamacode-submissions';

let questions = [];
let activeQuestionId = null;
let submissions = {};
let codeMirror = null;
let saveTimeout = null;
let isSettingValue = false;

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
  loadSubmissions();
  initCodeMirror();
  renderQuestionList();
  selectQuestion(activeQuestionId);

  if (questionSearchEl) {
    questionSearchEl.addEventListener('input', (e) => renderQuestionList(e.target.value));
  }
  if (runBtn) runBtn.addEventListener('click', runCode);
  if (submitBtn) submitBtn.addEventListener('click', submitCode);
  if (resetBtn) resetBtn.addEventListener('click', resetCase);
  if (clearConsoleBtn) clearConsoleBtn.addEventListener('click', () => (consoleOutputEl.textContent = ''));
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  document.addEventListener('keydown', handleKeyboardShortcuts);

  initResizers();
}

function handleKeyboardShortcuts(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    if (activeQuestionId) {
      saveCurrentCode();
    }
  }
}

function initResizers() {
  if (resizerCasesCase && sidebarPane) {
    setupHorizontalResize(resizerCasesCase, sidebarPane, 'left');
  }
  if (resizerCaseWorkspace && questionPane) {
    setupHorizontalResize(resizerCaseWorkspace, questionPane, 'left');
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

  const activeQuestion = questions.find((q) => q.id === activeQuestionId);
  const language = activeQuestion?.language || 'c';

  codeMirror = CodeMirror(codeEditorWrapper, {
    value: codeEditorEl ? codeEditorEl.value : '',
    mode: languageModes[language] || 'text/plain',
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
    if (!isSettingValue) {
      debounceSaveCurrentCode();
    }
  });
}

function getCodeMirrorTheme() {
  const theme = htmlEl.getAttribute('data-bs-theme');
  return theme === 'dark' ? 'github-dark' : 'github-light';
}

function updateCodeMirrorMode(language) {
  if (!codeMirror) return;
  const mode = languageModes[language] || 'text/plain';
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
  isSettingValue = true;
  if (codeMirror) {
    codeMirror.setValue(value);
  }
  if (codeEditorEl) {
    codeEditorEl.value = value;
  }
  isSettingValue = false;
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
      <div class="question-meta">${q.difficulty} · ${submissions[q.id]?.status || 'Unattempted'}</div>
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
  if (caseTitleEl) {
    caseTitleEl.textContent = question.title;
  }
  difficultyBadgeEl.textContent = question.difficulty;
  difficultyBadgeEl.className = 'badge ' + (difficultyClasses[question.difficulty] || 'text-bg-secondary');
  if (languageLabelEl) {
    languageLabelEl.textContent = (question.language || 'c').toUpperCase();
  }
  updateCodeMirrorMode(question.language || 'c');

  const savedCode = submissions[id]?.code;
  const starterCode = question.initial_code || '';
  setEditorValue(savedCode || starterCode);

  const sub = submissions[id];
  if (sub) {
    consoleOutputEl.innerHTML = colorizeOutput(sub.output);
    updateStatus(sub.status);
  } else {
    consoleOutputEl.textContent = 'Ready to code. Click Run to compile or Submit to check this case.';
    updateStatus('Unattempted');
  }

  renderQuestionList(questionSearchEl ? questionSearchEl.value : '');
  try {
    history.replaceState(null, '', question.permalink);
  } catch (e) {
    // History API may be restricted on file:// origins.
  }
}

function updateStatus(status) {
  const displayStatus = status || 'Unattempted';
  if (statusTextEl) {
    statusTextEl.textContent = displayStatus;
  }
  if (workspaceTitleEl) {
    workspaceTitleEl.textContent = 'Status: ' + displayStatus;
    workspaceTitleEl.className = 'mb-0 ' + (
      displayStatus === 'Accepted' ? 'text-pass' :
      displayStatus === 'Wrong Answer' || displayStatus === 'Runtime Error' || displayStatus === 'Compilation Error' ? 'text-fail' :
      ''
    );
  }
}

function loadSubmissions() {
  try {
    const saved = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (saved) {
      submissions = JSON.parse(saved) || {};
    }
  } catch (e) {
    console.warn('Failed to load saved submissions:', e);
    submissions = {};
  }
}

function persistSubmissions() {
  try {
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions));
  } catch (e) {
    console.warn('Failed to save submissions:', e);
  }
}

function resetCase() {
  if (!activeQuestionId) return;
  const question = questions.find((q) => q.id === activeQuestionId);
  if (!question) return;

  delete submissions[activeQuestionId];
  persistSubmissions();

  setEditorValue(question.initial_code || '');
  consoleOutputEl.textContent = 'Code reset to initial state.';
  updateStatus('Unattempted');
  renderQuestionList(questionSearchEl ? questionSearchEl.value : '');
}

function saveCurrentCode() {
  if (!activeQuestionId) return;
  if (!submissions[activeQuestionId]) {
    submissions[activeQuestionId] = { status: 'In Progress', output: '', code: '' };
  }
  submissions[activeQuestionId].code = getEditorValue();
  if (submissions[activeQuestionId].status === 'Unattempted') {
    submissions[activeQuestionId].status = 'In Progress';
    updateStatus('In Progress');
    renderQuestionList(questionSearchEl ? questionSearchEl.value : '');
  }
  persistSubmissions();
}

function debounceSaveCurrentCode() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    saveCurrentCode();
  }, 500);
}

function runCode() {
  if (!activeQuestionId) {
    consoleOutputEl.textContent = 'Please select a case first.';
    return;
  }

  saveCurrentCode();
  consoleOutputEl.innerHTML = 'Compiling...\n';

  setTimeout(() => {
    const output = 'Build succeeded. (Simulation mode)\n';
    consoleOutputEl.innerHTML += output;
    updateStatus('Compiled');
    if (submissions[activeQuestionId]) {
      submissions[activeQuestionId].status = 'Compiled';
      submissions[activeQuestionId].output = output;
      persistSubmissions();
      renderQuestionList(questionSearchEl ? questionSearchEl.value : '');
    }
  }, 600);
}

function submitCode() {
  if (!activeQuestionId) {
    consoleOutputEl.textContent = 'Please select a case first.';
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

    let status, outputHtml;
    if (hasContent && Math.random() > 0.3) {
      status = 'Accepted';
      outputHtml = `<span class="text-pass">All test cases passed.</span>\n${escapeHtml(expected)}\nExecution time: 12 ms`;
    } else {
      status = 'Wrong';
      outputHtml = `<span class="text-fail">Test case 2 failed.</span>\nExpected: ${escapeHtml(expected)}\nGot: incomplete implementation`;
    }

    submissions[activeQuestionId] = { status, output: outputHtml, code };
    persistSubmissions();

    consoleOutputEl.innerHTML = outputHtml;
    updateStatus(status);
    renderQuestionList(questionSearchEl ? questionSearchEl.value : '');
  }, 1000);
}

function toggleTheme() {
  const currentTheme = htmlEl.getAttribute('data-bs-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  htmlEl.setAttribute('data-bs-theme', newTheme);
  updateThemeIcon(newTheme);
  updateCodeMirrorTheme();
  try {
    localStorage.setItem('pyjamacode-theme', newTheme);
  } catch (e) {
    // localStorage may be unavailable (e.g. file:// origins).
  }
}

function updateThemeIcon(theme) {
  if (!themeIcon) return;
  themeIcon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
}

function loadTheme() {
  let savedTheme = 'dark';
  try {
    savedTheme = localStorage.getItem('pyjamacode-theme') || 'dark';
  } catch (e) {
    // localStorage may be unavailable (e.g. file:// origins).
  }
  htmlEl.setAttribute('data-bs-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function colorizeOutput(output) {
  if (!output) return '';
  // If already HTML, return as-is.
  if (output.includes('<span')) return output;

  return output
    .replace(/(All test cases passed\.?)/gi, '<span class="text-pass">$1</span>')
    .replace(/(Test case \d+ failed\.?)/gi, '<span class="text-fail">$1</span>')
    .replace(/(Build succeeded\.?)/gi, '<span class="text-pass">$1</span>')
    .replace(/(Compilation Error\.?)/gi, '<span class="text-fail">$1</span>')
    .replace(/(Runtime Error\.?)/gi, '<span class="text-fail">$1</span>');
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
