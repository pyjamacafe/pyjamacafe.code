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
const articleContentEl = document.getElementById('articleContent');
const quizContentEl = document.getElementById('quizContent');
const tabChallenge = document.getElementById('tabChallenge');
const tabArticle = document.getElementById('tabArticle');
const tabQuiz = document.getElementById('tabQuiz');
const difficultyBadgeEl = document.getElementById('difficultyBadge');
const codeEditorEl = document.getElementById('codeEditor');
const codeEditorWrapper = document.getElementById('codeEditorWrapper');
const languageLabelEl = document.getElementById('languageLabel');
const consoleOutputEl = document.getElementById('consoleOutput');
const statusTextEl = document.getElementById('statusText');
const runBtn = document.getElementById('runBtn');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const resetAllBtn = document.getElementById('resetAllBtn');
const fileTabs = document.getElementById('fileTabs');
const clearConsoleBtn = document.getElementById('clearConsole');
const terminalInput = document.getElementById('terminalInput');
const bookmarkBtn = document.getElementById('bookmarkBtn');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const sidebarPane = document.getElementById('sidebarPane');
const editorPane = document.getElementById('editorPane');
const questionPane = document.getElementById('questionPane');
const consoleArea = document.getElementById('consoleArea');
const editorArea = document.getElementById('editorArea');
const resizerCasesCase = document.getElementById('resizerCasesCase');
const resizerCaseWorkspace = document.getElementById('resizerCaseWorkspace');
const resizerEditorConsole = document.getElementById('resizerEditorConsole');
const questionPaneBody = document.getElementById('questionPaneBody');
const notesArea = document.getElementById('notesArea');
const notesEditorEl = document.getElementById('notesEditor');
const notesEditorWrapper = document.getElementById('notesEditorWrapper');
const notesPreviewEl = document.getElementById('notesPreview');
const notesModeBtn = document.getElementById('notesModeBtn');
const exportNotesBtn = document.getElementById('exportNotesBtn');
const notesMinimizeBtn = document.getElementById('notesMinimizeBtn');
const notesMaximizeBtn = document.getElementById('notesMaximizeBtn');
const notesRestoreBtn = document.getElementById('notesRestoreBtn');
const resizerQuestionNotes = document.getElementById('resizerQuestionNotes');

const SUBMISSIONS_STORAGE_KEY = 'pyjamacode-submissions';
const NOTES_STORAGE_KEY = 'pyjamacode-notes';
const BOOKMARKS_STORAGE_KEY = 'pyjamacode-bookmarks';

let questions = [];
let activeQuestionId = null;
let submissions = {};
let notes = {};
let bookmarks = {};
let unsavedFiles = {};
let quizResults = {};
let codeMirror = null;
let notesCodeMirror = null;
let saveTimeout = null;
let notesSaveTimeout = null;
let isSettingValue = false;
let isSettingNotesValue = false;
let notesPreviewMode = true;
let _viewCount = 0;
let _authNudged = false;
let activeFileIndex = 0;
let fileList = [];
let filePerProblem = {};
let notesSavedHeight = null;
let notesViewState = 'normal';
let treeExpanded = {};

function init() {
  if (!problemDataEl || !activeProblemInput) {
    // Not on a platform page (e.g. /courses/ list page).
    return;
  }

  // Redirect authenticated users from landing page to dashboard
  if (window.location.pathname === '/' || window.location.pathname === '') {
    if (typeof isAuthenticated === 'function' && isAuthenticated()) {
      window.location.replace('/dashboard/');
      return;
    }
  }

  try {
    questions = JSON.parse(problemDataEl.textContent);
    questions.forEach((q) => {
      if ((!q.quiz || !q.quiz.trim()) && q.quiz2) {
        const m = q.quiz2.match(/===QUIZ===\n([\s\S]*)$/);
        if (m) q.quiz = m[1].trim();
      }
      delete q.quiz2;
    });
  } catch (e) {
    console.error('Failed to parse problem data:', e);
    questions = [];
  }

  activeQuestionId = activeProblemInput.value || (questions[0] && questions[0].id);

  loadTheme();
  loadSubmissions();
  loadNotes();
  loadBookmarks();
  try { const qr = localStorage.getItem('pyjamacode-quiz-results'); if (qr) quizResults = JSON.parse(qr) || {}; } catch (e) {}
  initCodeMirror();
  initNotesCodeMirror();
  renderQuestionList();
  // On landing page (no content pane), don't call selectQuestion which would redirect
  if (questionContentEl) selectQuestion(activeQuestionId);
  setNotesPreviewMode(true);
  initTypedTitle();
  notesSavedHeight = notesArea ? notesArea.offsetHeight : 200;

  if (questionSearchEl) {
    questionSearchEl.addEventListener('input', (e) => {
      const isBookmarks = document.getElementById('bookmarksList') && !document.getElementById('bookmarksList').classList.contains('d-none');
      if (isBookmarks) renderBookmarksList(e.target.value);
      else renderQuestionList(e.target.value);
    });
  }
  if (submitBtn) submitBtn.addEventListener('click', submitCode);
  if (resetBtn) resetBtn.addEventListener('click', resetCase);
  if (resetAllBtn) resetAllBtn.addEventListener('click', resetAllFiles);
  initSidebarToggle();
  initSidebarTabs();
  initBookmarkBtn();
  initProblemNav();
  if (clearConsoleBtn) clearConsoleBtn.addEventListener('click', () => { consoleOutputEl.textContent = ''; if (terminalInput) terminalInput.value = ''; });
  if (terminalInput) {
    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = terminalInput.value.trim();
        if (!cmd) return;
        consoleOutputEl.textContent += '\n$ ' + cmd + '\n';
        terminalInput.value = '';
        terminalInput.disabled = true;
        execCommand(cmd).then((res) => {
          consoleOutputEl.textContent += (res.stdout || '') + (res.stderr || '') + (res.exitCode !== 0 ? '\nExit code: ' + res.exitCode : '');
          consoleOutputEl.scrollTop = consoleOutputEl.scrollHeight;
        }).catch((err) => {
          consoleOutputEl.textContent += 'Error: ' + (err.message || 'Connection failed');
          consoleOutputEl.scrollTop = consoleOutputEl.scrollHeight;
        }).finally(() => {
          terminalInput.disabled = false;
          terminalInput.focus();
        });
      }
    });
  }
  // Logo/title link — update href based on auth state and save auto-resume
  // Logo/title link — route based on auth state
  const homeLink = document.getElementById('homeLink');
  if (homeLink) {
    function updateHomeHref() {
      homeLink.href = (typeof isAuthenticated === 'function' && isAuthenticated()) ? '/dashboard/' : '/';
    }
    updateHomeHref();
    if (typeof onAuthChange !== 'undefined') onAuthChange(updateHomeHref);
  }

  // Cancel forced auth (user dismissed) — 3 more views + timer
  window._dismissForceAuth = function() {
    if (questionContentEl) questionContentEl.classList.remove('content-blurred-force');
    if (editorArea) editorArea.classList.remove('content-blurred-force');
    if (authCloseLink) authCloseLink.style.display = '';
    if (authModal) authModal._backdropClose = false;
    // Set forced flag (persists across page refreshes)
    localStorage.setItem('authForced', 'true');
    // Start one-shot timer for forced auth
    const nudgeDelay = (window.__APP_CONFIG__ && window.__APP_CONFIG__.nudgeDelay) || 10000;
    clearTimeout(window._authNudgeTimer);
    window._authNudgeTimer = setTimeout(() => {
      if (!isAuthenticated() && questionContentEl) {
        if (authCloseLink) authCloseLink.style.display = 'none';
        if (authModal) authModal._backdropClose = true;
        questionContentEl.classList.add('content-blurred-force');
        if (editorArea) editorArea.classList.add('content-blurred-force');
        if (typeof openAuthModal === 'function') openAuthModal('signin');
      }
    }, nudgeDelay);
  };

  // Resume button in dropdown — navigate to last saved problem
  const resumeLink = document.getElementById('resumeLink');
  if (resumeLink) {
    resumeLink.addEventListener('click', (e) => {
      e.preventDefault();
      const saved = localStorage.getItem('lastProblemUrl');
      if (saved && saved.includes('/courses/')) {
        window.location.href = saved;
      }
    });
  }
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
  if (notesModeBtn) notesModeBtn.addEventListener('click', toggleNotesMode);
  if (exportNotesBtn) exportNotesBtn.addEventListener('click', exportNotes);
  if (notesMinimizeBtn) notesMinimizeBtn.addEventListener('click', minimizeNotes);
  if (notesMaximizeBtn) notesMaximizeBtn.addEventListener('click', maximizeNotes);
  if (notesRestoreBtn) notesRestoreBtn.addEventListener('click', restoreNotes);
  if (notesPreviewEl) {
    notesPreviewEl.addEventListener('dblclick', (e) => {
      const rect = notesPreviewEl.getBoundingClientRect();
      const lineHeight = parseFloat(getComputedStyle(notesPreviewEl).lineHeight) || 24;
      const paddingTop = parseFloat(getComputedStyle(notesPreviewEl).paddingTop) || 0;
      const relativeY = e.clientY - rect.top - paddingTop;
      const approximateLine = Math.max(0, Math.floor(relativeY / lineHeight));
      setNotesPreviewMode(false, approximateLine);
    });
  }

  document.addEventListener('keydown', handleKeyboardShortcuts);

  initResizers();
  initNotesResizer();
  initTooltips();
  initTabs();
  initFirebase();
  setupAuth();
  initSync();
}

function handleKeyboardShortcuts(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    if (activeQuestionId) {
      saveCurrentCode();
      saveCurrentNotes();
      hideAllUnsavedDots();
    }
  }
  if (e.key === 'Escape' && !notesPreviewMode) {
    e.preventDefault();
    setNotesPreviewMode(true);
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
    // Leave room for header (56px), resizer (8px), and editor-area min-height (80px).
    setupVerticalResize(resizerEditorConsole, consoleArea, editorPane, () => editorPane.offsetHeight - 144);
  }
}

function initNotesResizer() {
  if (resizerQuestionNotes && notesArea && questionPaneBody) {
    // Leave room for resizer (8px) and question-content min-height (60px).
    setupVerticalResize(
      resizerQuestionNotes,
      notesArea,
      questionPaneBody,
      () => questionPaneBody.offsetHeight - 68,
      (height) => {
        if (notesViewState === 'normal') {
          notesSavedHeight = height;
        }
      }
    );
  }
}

function createDragOverlay(cursor) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `position:fixed;inset:0;z-index:9999;cursor:${cursor};`;
  document.body.appendChild(overlay);
  return overlay;
}

function setupHorizontalResize(resizer, pane, side) {
  if (!resizer || !pane) return;

  resizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = pane.getBoundingClientRect().width;
    const minWidth = 180;
    const maxWidth = Math.max(minWidth, Math.floor(window.innerWidth * 0.45));
    const multiplier = side === 'left' ? 1 : -1;

    resizer.classList.add('resizing');
    document.body.style.userSelect = 'none';
    const overlay = createDragOverlay('col-resize');

    let refreshScheduled = false;
    const scheduleRefresh = () => {
      if (!refreshScheduled) {
        refreshScheduled = true;
        requestAnimationFrame(() => {
          refreshEditors();
          refreshScheduled = false;
        });
      }
    };

    const onMouseMove = (ev) => {
      const deltaX = ev.clientX - startX;
      const newWidth = startWidth + deltaX * multiplier;
      const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
      pane.style.width = `${clampedWidth}px`;
      scheduleRefresh();
    };

    const onMouseUp = () => {
      overlay.remove();
      resizer.classList.remove('resizing');
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      refreshEditors();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

function setupVerticalResize(resizer, pane, container, maxHeightFn = null, onResizeEnd = null) {
  if (!resizer || !pane || !container) return;

  resizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const startHeight = pane.getBoundingClientRect().height;
    const minHeight = 80;
    const rawMaxHeight = maxHeightFn
      ? maxHeightFn()
      : container.getBoundingClientRect().height * 0.7;
    const maxHeight = Math.max(minHeight, Math.floor(rawMaxHeight));

    resizer.classList.add('resizing');
    document.body.style.userSelect = 'none';
    const overlay = createDragOverlay('row-resize');

    let refreshScheduled = false;
    const scheduleRefresh = () => {
      if (!refreshScheduled) {
        refreshScheduled = true;
        requestAnimationFrame(() => {
          refreshEditors();
          refreshScheduled = false;
        });
      }
    };

    const onMouseMove = (ev) => {
      const deltaY = ev.clientY - startY;
      const newHeight = startHeight - deltaY;
      const clampedHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);
      pane.style.height = `${clampedHeight}px`;
      scheduleRefresh();
    };

    const onMouseUp = () => {
      overlay.remove();
      resizer.classList.remove('resizing');
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (onResizeEnd) onResizeEnd(pane.offsetHeight);
      refreshEditors();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

function refreshEditors() {
  if (codeMirror) requestAnimationFrame(() => codeMirror.refresh());
  if (notesCodeMirror) requestAnimationFrame(() => notesCodeMirror.refresh());
}

function initTooltips() {
  if (typeof bootstrap === 'undefined' || !bootstrap.Tooltip) return;
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.forEach((el) => {
    new bootstrap.Tooltip(el, { trigger: 'hover' });
  });
}

function updateTooltip(element, title) {
  if (!element) return;
  element.setAttribute('title', title);
  element.setAttribute('data-bs-original-title', title);
  if (typeof bootstrap === 'undefined' || !bootstrap.Tooltip) return;
  const tooltip = bootstrap.Tooltip.getInstance(element);
  if (tooltip) {
    tooltip.setContent({ '.tooltip-inner': title });
  }
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
    styleActiveLine: true,
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
      showFileUnsavedDot(activeFileIndex);
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
  const theme = getCodeMirrorTheme();
  setEditorTheme(codeMirror, theme);
  forceEditorRepaint(codeMirror);
  if (notesCodeMirror) {
    setEditorTheme(notesCodeMirror, theme);
    forceEditorRepaint(notesCodeMirror);
  }
}

function setEditorTheme(editor, theme) {
  if (!editor || !editor.getWrapperElement) return;
  const wrapper = editor.getWrapperElement();
  // Remove all existing cm-s-* classes
  wrapper.className = wrapper.className.replace(/cm-s-\S+/g, '').trim();
  // Force add via setOption AND classList for reliability
  editor.setOption('theme', theme);
  wrapper.classList.add('cm-s-' + theme);
}

function forceEditorRepaint(editor) {
  if (!editor || !editor.getWrapperElement) return;
  const wrapper = editor.getWrapperElement();
  // Force a reflow by toggling a harmless style
  wrapper.style.opacity = '0.999';
  requestAnimationFrame(() => { wrapper.style.opacity = ''; });
  editor.refresh();
}

function initNotesCodeMirror() {
  if (!notesEditorWrapper) return;

  if (typeof CodeMirror === 'undefined') {
    notesEditorWrapper.style.display = 'none';
    if (notesEditorEl) notesEditorEl.style.display = 'block';
    return;
  }

  notesCodeMirror = CodeMirror(notesEditorWrapper, {
    value: notesEditorEl ? notesEditorEl.value : '',
    mode: 'markdown',
    theme: getCodeMirrorTheme(),
    lineNumbers: true,
    styleActiveLine: true,
    tabSize: 4,
    indentUnit: 4,
    lineWrapping: true,
    autofocus: false,
  });

  notesCodeMirror.on('change', () => {
    if (notesEditorEl) {
      notesEditorEl.value = notesCodeMirror.getValue();
    }
    if (!isSettingNotesValue) {
      showNotesUnsavedDot();
      if (notesPreviewMode) {
        renderNotesPreview();
      }
    }
  });
}

function getNotesEditorValue() {
  return notesCodeMirror ? notesCodeMirror.getValue() : (notesEditorEl ? notesEditorEl.value : '');
}

function setNotesEditorValue(value) {
  isSettingNotesValue = true;
  if (notesCodeMirror) {
    notesCodeMirror.setValue(value);
  }
  if (notesEditorEl) {
    notesEditorEl.value = value;
  }
  isSettingNotesValue = false;
}

function loadNotes() {
  try {
    const saved = localStorage.getItem(NOTES_STORAGE_KEY);
    if (saved) {
      notes = JSON.parse(saved) || {};
    }
  } catch (e) {
    console.warn('Failed to load saved notes:', e);
    notes = {};
  }
}

function loadBookmarks() {
  try {
    const saved = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (saved) {
      bookmarks = JSON.parse(saved) || {};
    }
  } catch (e) {
    bookmarks = {};
  }
}

function persistBookmarks() {
  try {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
  } catch (e) {}
}

function toggleBookmark(id) {
  if (!id) return;
  if (bookmarks[id]) {
    delete bookmarks[id];
  } else {
    bookmarks[id] = true;
  }
  persistBookmarks();
  updateBookmarkBtn(id);
  renderBookmarksList(questionSearchEl ? questionSearchEl.value : '');
}

function updateBookmarkBtn(id) {
  const icon = document.querySelector('#bookmarkBtn i');
  if (!icon) return;
  const isBookmarked = id && bookmarks[id];
  icon.className = isBookmarked ? 'bi bi-bookmark-fill' : 'bi bi-bookmark';
  if (bookmarkBtn) bookmarkBtn.classList.toggle('d-none', !id);
}

function renderBookmarksList(filter) {
  const el = document.getElementById('bookmarksList');
  if (!el) return;
  const ids = Object.keys(bookmarks);
  if (ids.length === 0) {
    el.innerHTML = '<div class="p-3 text-muted small">No bookmarked problems yet. Click the <i class="bi bi-bookmark"></i> icon on a problem to add it here.</div>';
    return;
  }
  const filterLower = (filter || '').toLowerCase();
  const matched = questions.filter((q) => ids.includes(q.id) && (!filterLower || q.title.toLowerCase().includes(filterLower)));
  if (matched.length === 0) {
    el.innerHTML = '<div class="p-3 text-muted small">No bookmarks match your search.</div>';
    return;
  }
  el.innerHTML = matched.map((q) => `
    <div class="tree-leaf" data-id="${q.id}">
      <div class="question-title">${escapeHtml(q.title)}</div>
      <div class="question-meta">${q.difficulty} · ${submissions[q.id]?.status || 'Unattempted'}</div>
    </div>
  `).join('');
  el.querySelectorAll('.tree-leaf').forEach((item) => {
    item.addEventListener('click', () => selectQuestion(item.dataset.id));
  });
}

function initSidebarTabs() {
  const tabLessons = document.getElementById('tabLessons');
  const tabBookmarks = document.getElementById('tabBookmarks');
  const questionList = document.getElementById('questionList');
  const bookmarksList = document.getElementById('bookmarksList');
  if (!tabLessons || !tabBookmarks || !questionList || !bookmarksList) return;

  function setSidebarTab(tab) {
    const isBookmarks = tab === 'bookmarks';
    tabLessons.classList.toggle('active', !isBookmarks);
    tabBookmarks.classList.toggle('active', isBookmarks);
    questionList.classList.toggle('d-none', isBookmarks);
    bookmarksList.classList.toggle('d-none', !isBookmarks);
    if (isBookmarks) renderBookmarksList(questionSearchEl ? questionSearchEl.value : '');
    else renderQuestionList(questionSearchEl ? questionSearchEl.value : '');
  }

  tabLessons.addEventListener('click', () => setSidebarTab('lessons'));
  tabBookmarks.addEventListener('click', () => setSidebarTab('bookmarks'));
}

function initBookmarkBtn() {
  const btn = document.getElementById('bookmarkBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    toggleBookmark(activeQuestionId);
  });
}

function persistNotes() {
  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.warn('Failed to save notes:', e);
  }
}

function saveCurrentNotes() {
  if (!activeQuestionId) return;
  notes[activeQuestionId] = getNotesEditorValue();
  hideNotesUnsavedDot();
  persistNotes();
}

function debounceSaveCurrentNotes() {
  if (notesSaveTimeout) {
    clearTimeout(notesSaveTimeout);
  }
  notesSaveTimeout = setTimeout(() => {
    saveCurrentNotes();
  }, 500);
}

function setNotesPreviewMode(preview, approximateLine = null) {
  notesPreviewMode = preview;
  if (notesPreviewMode) {
    saveCurrentNotes();
    renderNotesPreview();
    if (notesEditorWrapper) notesEditorWrapper.classList.add('d-none');
    if (notesEditorEl) notesEditorEl.style.display = 'none';
    if (notesPreviewEl) notesPreviewEl.classList.remove('d-none');
    if (notesModeBtn) notesModeBtn.innerHTML = '<i class="bi bi-pencil-square"></i>';
    updateTooltip(notesModeBtn, 'Edit notes');
  } else {
    if (notesEditorWrapper) notesEditorWrapper.classList.remove('d-none');
    if (notesEditorEl) notesEditorEl.style.display = 'none';
    if (notesPreviewEl) notesPreviewEl.classList.add('d-none');
    if (notesModeBtn) notesModeBtn.innerHTML = '<i class="bi bi-eye"></i>';
    updateTooltip(notesModeBtn, 'Preview rendered notes');
    if (notesCodeMirror) {
      requestAnimationFrame(() => {
        notesCodeMirror.refresh();
        if (approximateLine !== null) {
          const doc = notesCodeMirror.getDoc();
          const lastLine = doc.lastLine();
          doc.setCursor(Math.min(approximateLine, lastLine), 0);
          notesCodeMirror.focus();
        }
      });
    }
  }
}

function toggleNotesMode() {
  setNotesPreviewMode(!notesPreviewMode);
}

function minimizeNotes() {
  hideTooltip(notesMinimizeBtn);
  if (notesViewState === 'normal') {
    notesSavedHeight = notesArea ? notesArea.offsetHeight : notesSavedHeight;
  }
  notesViewState = 'minimized';
  if (questionPaneBody) questionPaneBody.classList.remove('notes-maximized');
  const headerHeight = notesArea ? notesArea.querySelector('.notes-header')?.offsetHeight || 40 : 40;
  if (notesArea) notesArea.style.height = `${headerHeight}px`;
  updateNotesViewButtons();
  refreshEditors();
}

function maximizeNotes() {
  hideTooltip(notesMaximizeBtn);
  if (notesViewState === 'normal') {
    notesSavedHeight = notesArea ? notesArea.offsetHeight : notesSavedHeight;
  }
  notesViewState = 'maximized';
  if (questionPaneBody) questionPaneBody.classList.add('notes-maximized');
  updateNotesViewButtons();
  refreshEditors();
}

function restoreNotes() {
  hideTooltip(notesRestoreBtn);
  notesViewState = 'normal';
  if (questionPaneBody) questionPaneBody.classList.remove('notes-maximized');
  if (notesArea) {
    notesArea.style.height = notesSavedHeight ? `${notesSavedHeight}px` : '';
  }
  updateNotesViewButtons();
  refreshEditors();
}

function updateNotesViewButtons() {
  if (notesMinimizeBtn) {
    notesMinimizeBtn.classList.toggle('d-none', notesViewState === 'minimized');
    notesMinimizeBtn.style.order = notesViewState === 'minimized' ? '3' : '1';
  }
  if (notesMaximizeBtn) {
    notesMaximizeBtn.classList.toggle('d-none', notesViewState === 'maximized');
    notesMaximizeBtn.style.order = notesViewState === 'maximized' ? '3' : '2';
  }
  if (notesRestoreBtn) {
    notesRestoreBtn.classList.toggle('d-none', notesViewState === 'normal');
    notesRestoreBtn.style.order = notesViewState === 'minimized' ? '1' : notesViewState === 'maximized' ? '2' : '3';
  }
}

function hideTooltip(element) {
  if (!element || typeof bootstrap === 'undefined' || !bootstrap.Tooltip) return;
  const tooltip = bootstrap.Tooltip.getInstance(element);
  if (tooltip) tooltip.hide();
}

function renderNotesPreview() {
  if (!notesPreviewEl) return;
  const markdown = getNotesEditorValue() || '*No notes yet.*';
  let html = '';
  if (typeof marked !== 'undefined') {
    try {
      html = marked.parse(markdown, { breaks: true, gfm: true });
    } catch (e) {
      html = escapeHtml(markdown);
    }
  } else {
    html = escapeHtml(markdown);
  }
  notesPreviewEl.innerHTML = html;
}

function exportNotes() {
  if (!activeQuestionId) return;
  const question = questions.find((q) => q.id === activeQuestionId);
  const title = question ? question.title : activeQuestionId;
  const content = getNotesEditorValue() || '';
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = title.replace(/[^a-z0-9\u00C0-\u024F\u1E00-\u1EFF]/gi, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'notes';
  a.download = `${safeTitle}-notes.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

function buildQuestionTree() {
  const tree = {};
  questions.forEach((q) => {
    const topic = q.topic || '';
    const subtopic = q.subtopic || '';
    if (!tree[topic]) tree[topic] = {};
    if (!tree[topic][subtopic]) tree[topic][subtopic] = [];
    tree[topic][subtopic].push(q);
  });
  return tree;
}

function toggleTopic(topic) {
  treeExpanded[topic] = !treeExpanded[topic];
  renderQuestionList(questionSearchEl ? questionSearchEl.value : '');
}

function toggleSubtopic(topic, subtopic) {
  const key = topic + '/' + subtopic;
  treeExpanded[key] = !treeExpanded[key];
  renderQuestionList(questionSearchEl ? questionSearchEl.value : '');
}

function getWeight(q, key, fallback) {
  const v = q[key];
  return (v !== null && v !== undefined && v !== '') ? Number(v) : fallback;
}

function renderQuestionList(filter = '') {
  questionListEl.innerHTML = '';

  const tree = buildQuestionTree();
  const filterLower = filter.toLowerCase();

  // Compute min weight for each topic and subtopic
  const topicWeight = {};
  const subtopicWeight = {};
  questions.forEach((q) => {
    const t = q.topic || '';
    const st = q.subtopic || '';
    const tw = getWeight(q, 'topic_weight', 99);
    const sw = getWeight(q, 'subtopic_weight', 99);
    if (topicWeight[t] === undefined || tw < topicWeight[t]) topicWeight[t] = tw;
    const sk = t + '/' + st;
    if (subtopicWeight[sk] === undefined || sw < subtopicWeight[sk]) subtopicWeight[sk] = sw;
  });

  const sortedTopics = Object.keys(tree).sort(
    (a, b) => (topicWeight[a] ?? 99) - (topicWeight[b] ?? 99)
  );

  sortedTopics.forEach((topic, topicIndex) => {
    const subtopics = tree[topic];
    const isTopicExpanded = treeExpanded[topic] || filter.length > 0;

    let hasVisibleChildren = false;
    Object.keys(subtopics).forEach((subtopic) => {
      const questions = subtopics[subtopic];
      const visibleQ = filter.length > 0
        ? questions.filter((q) => q.title.toLowerCase().includes(filterLower))
        : questions;
      if (visibleQ.length > 0 || (isTopicExpanded && questions.length > 0)) {
        hasVisibleChildren = true;
      }
    });

    if (!hasVisibleChildren) return;

    // Topic header
    const topicDiv = document.createElement('div');
    topicDiv.className = 'tree-topic';
    topicDiv.dataset.topicIndex = topicIndex;
    if (filter.length > 0) topicDiv.classList.add('expanded');
    else topicDiv.classList.toggle('expanded', !!treeExpanded[topic]);
    topicDiv.innerHTML = `
      <span class="tree-toggle">
        <i class="bi ${treeExpanded[topic] || filter.length > 0 ? 'bi-chevron-down' : 'bi-chevron-right'}"></i>
      </span>
      <span class="tree-label">${escapeHtml(topic)}</span>
    `;
    topicDiv.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTopic(topic);
    });
    questionListEl.appendChild(topicDiv);

    // Subtopic containers
    if (!treeExpanded[topic] && filter.length === 0) return;

    const sortedSubtopics = Object.keys(subtopics).sort((a, b) => {
      const skA = topic + '/' + a;
      const skB = topic + '/' + b;
      return (subtopicWeight[skA] ?? 99) - (subtopicWeight[skB] ?? 99);
    });

    sortedSubtopics.forEach((subtopic) => {
      const questions = subtopics[subtopic];
      const visibleQ = filter.length > 0
        ? questions.filter((q) => q.title.toLowerCase().includes(filterLower))
        : questions;
      if (visibleQ.length === 0 && !(isTopicExpanded && questions.length > 0)) return;

      const subKey = topic + '/' + subtopic;
      const isSubExpanded = treeExpanded[subKey] || filter.length > 0;

      // Subtopic header
      const subDiv = document.createElement('div');
      subDiv.className = 'tree-subtopic';
      subDiv.dataset.topicIndex = topicIndex;
      if (filter.length > 0) subDiv.classList.add('expanded');
      else subDiv.classList.toggle('expanded', !!treeExpanded[subKey]);
      subDiv.innerHTML = `
        <span class="tree-toggle">
          <i class="bi ${treeExpanded[subKey] || filter.length > 0 ? 'bi-chevron-down' : 'bi-chevron-right'}"></i>
        </span>
        <span class="tree-label">${escapeHtml(subtopic)}</span>
      `;
      subDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSubtopic(topic, subtopic);
      });
      questionListEl.appendChild(subDiv);

      // Questions
      if (!isSubExpanded) return;

      const sortedQuestions = [...questions].sort(
        (a, b) => (getWeight(a, 'weight', 99) - getWeight(b, 'weight', 99))
      );

      sortedQuestions.forEach((q) => {
        if (filter.length > 0 && !q.title.toLowerCase().includes(filterLower)) return;

        const item = document.createElement('div');
        item.className = 'tree-leaf';
        item.dataset.id = q.id;
        item.dataset.topicIndex = topicIndex;
        if (q.id === activeQuestionId) item.classList.add('active');
        if (submissions[q.id]?.status === 'Accepted') item.classList.add('solved');

        item.innerHTML = `
          <div class="question-title">${escapeHtml(q.title)}</div>
          <div class="question-meta">${q.difficulty} · ${submissions[q.id]?.status || 'Unattempted'}</div>
        `;

        item.addEventListener('click', (e) => {
          e.stopPropagation();
          selectQuestion(q.id);
        });
        questionListEl.appendChild(item);
      });
    });
  });
}

function updateTreeItemStatus(id, status) {
  const item = questionListEl?.querySelector(`.tree-leaf[data-id="${id}"]`);
  if (!item) return;
  const meta = item.querySelector('.question-meta');
  if (meta) {
    const parts = meta.textContent.split('·');
    meta.textContent = (parts[0] || '').trim() + ' · ' + status;
  }
  item.classList.toggle('solved', status === 'Accepted');
}

function selectQuestion(id) {
  activeQuestionId = id;
  const question = questions.find((q) => q.id === id);
  if (!question) return;

  // On landing page (no question content element), just expand tree and update URL
  if (!questionContentEl) {
    // Landing page — redirect to the problem page
    window.location.href = question.permalink;
    return;
  }

  // Auth nudge for unauthenticated users
  if (!isAuthenticated()) {
    const freeViews = (window.__APP_CONFIG__ && window.__APP_CONFIG__.freeViews) || 3;
    const nudgeDelay = (window.__APP_CONFIG__ && window.__APP_CONFIG__.nudgeDelay) || 10000;

    // Check if user is already in forced state (persisted across refreshes)
    const isForced = localStorage.getItem('authForced') === 'true';

    if (isForced) {
      // Let content load first, then show auth modal
      requestAnimationFrame(() => {
        if (authCloseLink) authCloseLink.style.display = 'none';
        if (authModal) authModal._backdropClose = true;
        questionContentEl.classList.add('content-blurred-force');
        if (editorArea) editorArea.classList.add('content-blurred-force');
        if (typeof openAuthModal === 'function') openAuthModal('signin');
      });
      // Do NOT return — let content load normally
    }

    // Free views counter (in-memory only, resets on page refresh)
    if (!_authNudged) {
      _viewCount++;
      if (_viewCount > freeViews) {
        _authNudged = true;
        questionContentEl.classList.add('content-blurred-force');
        if (editorArea) editorArea.classList.add('content-blurred-force');
        if (authCloseLink) authCloseLink.style.display = '';
        if (authModal) authModal._backdropClose = false;
        if (typeof openAuthModal === 'function') openAuthModal('signin');
      }
    }
  }

  // Set up tabs
  const hasArticle = question.article && question.article.trim().length > 0;
  let quizRaw = question.quiz;
  if (!quizRaw || !quizRaw.trim()) {
    quizRaw = question._raw_quiz;
  }
  const hasQuiz = quizRaw && quizRaw.trim().length > 0;
  if (tabArticle) {
    tabArticle.classList.toggle('d-none', !hasArticle);
  }
  if (tabQuiz) {
    tabQuiz.classList.toggle('d-none', !hasQuiz);
  }
  // Remember tab before resetting URL
  const prevTab = new URL(window.location).searchParams.get('tab') || 'challenge';
  setActiveTab('challenge');

  questionContentEl.innerHTML = question.content;
  enhanceCodeBlocks(questionContentEl);
  initImageZoom(questionContentEl);
  embedYouTubeLinks(questionContentEl);
  initVimeoPlayers(questionContentEl);
  if (articleContentEl) {
    articleContentEl.innerHTML = hasArticle ? question.article : '';
    enhanceCodeBlocks(articleContentEl);
    initImageZoom(articleContentEl);
    embedYouTubeLinks(articleContentEl);
    initVimeoPlayers(articleContentEl);
  }

  // Inject difficulty badge into the first h2 (Problem Statement)
  const firstH2 = questionContentEl.querySelector('h2:first-of-type');
  if (firstH2) {
    // Remove existing badge margin-right span if any
    const existing = firstH2.querySelector('.diff-badge');
    if (existing) existing.remove();
    const badge = document.createElement('span');
    badge.className = 'diff-badge badge ' + (difficultyClasses[question.difficulty] || 'text-bg-secondary');
    badge.textContent = question.difficulty;
    firstH2.appendChild(badge);
  }

  // Set difficulty class on content for background styling
  questionContentEl.classList.remove('diff-easy', 'diff-medium', 'diff-hard');
  if (question.difficulty) {
    questionContentEl.classList.add('diff-' + question.difficulty);
  }

  // Update case title in the center pane titlebar
  const caseTitleEl = document.getElementById('caseTitle');
  if (caseTitleEl) caseTitleEl.textContent = question.title;
  updateBookmarkBtn(activeQuestionId);
  if (languageLabelEl) {
    languageLabelEl.textContent = (question.language || 'c').toUpperCase();
  }
  updateCodeMirrorMode(question.language || 'c');

  // Build file tabs from ===CODE=== section
  buildFileTabs(question);

  const savedNotes = notes[id] || '';
  setNotesEditorValue(savedNotes);
  if (notesPreviewMode) {
    renderNotesPreview();
  }

  consoleOutputEl.textContent = 'When ready, hit Check to compile and run the code.';
  updateStatus('Unattempted');

  // Expand the tree to show the active problem
  if (question.topic) {
    treeExpanded[question.topic] = true;
    if (question.subtopic) {
      treeExpanded[question.topic + '/' + question.subtopic] = true;
    }
  }
  renderQuestionList(questionSearchEl ? questionSearchEl.value : '');
  try {
    // Preserve tab and hash when updating URL
    let url = question.permalink;
    if (prevTab && prevTab !== 'challenge') {
      url += (url.includes('?') ? '&' : '?') + 'tab=' + encodeURIComponent(prevTab);
    }
    url += window.location.hash;
    history.replaceState(null, '', url);
    maybeSaveProblemUrl(url);
  } catch (e) {
    // History API may be restricted on file:// origins.
  }

  // Restore tab
  if (prevTab && prevTab !== 'challenge' && tabArticle && !tabArticle.classList.contains('d-none')) {
    setActiveTab(prevTab);
  }

  // Scroll to hash if present (e.g. #listing-1)
  setTimeout(() => {
    const hash = window.location.hash;
    if (hash) {
      const id = hash.slice(1);
      const target = document.getElementById(id);
      if (target) {
        // Switch to the tab that contains the target
        if (articleContentEl && articleContentEl.contains(target) && tabArticle) {
          setActiveTab('explanation');
        } else if (questionContentEl && questionContentEl.contains(target) && tabChallenge) {
          setActiveTab('challenge');
        }
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, 100);
}

function updateStatus(status) {
  const displayStatus = status || 'Unattempted';
  if (statusTextEl) {
    statusTextEl.textContent = displayStatus;
    statusTextEl.className = 'small ' + (displayStatus === 'Accepted' ? 'text-pass' :
      displayStatus === 'Wrong Answer' || displayStatus === 'Runtime Error' || displayStatus === 'Compilation Error' ? 'text-fail' : '');
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

  if (fileList.length > 0) {
    // Reset active file only
    const file = fileList[activeFileIndex];
    if (!submissions[activeQuestionId]) submissions[activeQuestionId] = {};
    if (!submissions[activeQuestionId].files) submissions[activeQuestionId].files = {};
    submissions[activeQuestionId].files[file.filename] = file.content;
    setEditorValue(file.content);
    consoleOutputEl.textContent = 'Reset: ' + file.filename;
  } else {
    delete submissions[activeQuestionId];
    setEditorValue(question.initial_code || '');
    consoleOutputEl.textContent = 'Code reset to initial state.';
  }
  if (!submissions[activeQuestionId]) submissions[activeQuestionId] = { status: 'Unattempted', output: '' };
  submissions[activeQuestionId].status = 'Unattempted';
  updateStatus('Unattempted');
  persistSubmissions();
  // Clear unsaved dot for the reset file
  if (fileList.length > 0) {
    const file = fileList[activeFileIndex];
    delete unsavedFiles[file.filename];
    refreshFileUnsavedDots();
  } else {
    unsavedFiles = {};
    hideAllUnsavedDots();
  }
  renderQuestionList(questionSearchEl ? questionSearchEl.value : '');
}

function resetAllFiles() {
  if (!activeQuestionId) return;
  const question = questions.find((q) => q.id === activeQuestionId);
  if (!question || fileList.length === 0) return;

  fileList.forEach((file) => {
    if (!submissions[activeQuestionId]) submissions[activeQuestionId] = {};
    if (!submissions[activeQuestionId].files) submissions[activeQuestionId].files = {};
    submissions[activeQuestionId].files[file.filename] = file.content;
  });
  setEditorValue(fileList[activeFileIndex].content);
  consoleOutputEl.textContent = 'All files reset to starter.';
  submissions[activeQuestionId].status = 'Unattempted';
  updateStatus('Unattempted');
  unsavedFiles = {};
  hideAllUnsavedDots();
  persistSubmissions();
  renderQuestionList(questionSearchEl ? questionSearchEl.value : '');
}

function saveCurrentCode() {
  if (!activeQuestionId) return;
  const code = getEditorValue();
  if (fileList.length > 0) {
    const file = fileList[activeFileIndex];
    if (!submissions[activeQuestionId]) submissions[activeQuestionId] = {};
    if (!submissions[activeQuestionId].files) submissions[activeQuestionId].files = {};
    submissions[activeQuestionId].files[file.filename] = code;
  } else {
    if (!submissions[activeQuestionId]) {
      submissions[activeQuestionId] = { status: 'In Progress', output: '', code: '' };
    }
    submissions[activeQuestionId].code = code;
  }
  if (!submissions[activeQuestionId].status || submissions[activeQuestionId].status === 'Unattempted') {
    submissions[activeQuestionId].status = 'In Progress';
    updateStatus('In Progress');
    updateTreeItemStatus(activeQuestionId, 'In Progress');
  }
  hideFileUnsavedDot();
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

const JUDGE_URL = window.__APP_CONFIG__ && window.__APP_CONFIG__.judgeUrl
  ? window.__APP_CONFIG__.judgeUrl
  : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:4000'
    : 'https://judge.code.pyjamacafe.com';

function execCommand(cmd) {
  return fetch(JUDGE_URL + '/api/exec', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: cmd })
  }).then((r) => r.json());
}

function submitCode() {
  if (!activeQuestionId) {
    consoleOutputEl.textContent = 'Please select a case first.';
    return;
  }

  saveCurrentCode();
  consoleOutputEl.textContent = 'Running...\n';

  // Collect files from file tabs or fallback to single editor
  const files = [];
  const question = questions.find((q) => q.id === activeQuestionId);
  if (!question) return;

  if (fileList.length > 0) {
    fileList.forEach((f) => {
      const saved = submissions[activeQuestionId]?.files?.[f.filename];
      files.push({ name: f.filename, content: saved || f.content });
    });
  } else {
    const code = getEditorValue();
    const lang = question.language || 'c';
    const ext = { c: 'c', cpp: 'cpp', python: 'py', assembly: 's' }[lang] || 'c';
    files.push({ name: 'main.' + ext, content: code || '' });
  }

  fetch(JUDGE_URL + '/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files, language: question.language || 'c' })
  })
  .then((r) => r.json())
  .then((res) => {
    let status, outputHtml;
    if (res.exitCode === 0) {
      status = 'Accepted';
      outputHtml = '<span class="text-pass">All test cases passed.</span>\n' + ansiToHtml(res.stdout || '') + '\n<small class="text-muted">Exit code: 0</small>';
    } else {
      const phase = res.phase || 'run';
      status = phase === 'compile' ? 'Compilation Error' : 'Runtime Error';
      outputHtml = '<span class="text-fail">' + status + '</span>\n' + ansiToHtml(res.stderr || res.stdout || 'No output');
    }

    consoleOutputEl.innerHTML = outputHtml;
    consoleOutputEl.scrollTop = consoleOutputEl.scrollHeight;
    updateStatus(status);
    renderQuestionList(questionSearchEl ? questionSearchEl.value : '');
  })
  .catch((err) => {
    consoleOutputEl.innerHTML = '<span class="text-fail">Connection error</span>\nCould not reach the judge server. Is docker running?\n' + escapeHtml(err.message || '');
    consoleOutputEl.scrollTop = consoleOutputEl.scrollHeight;
  });
}

function toggleTheme() {
  const currentTheme = htmlEl.getAttribute('data-bs-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  htmlEl.setAttribute('data-bs-theme', newTheme);
  updateThemeIcon(newTheme);
  updateCodeMirrorTheme();
  updateHighlightJsTheme(newTheme);
  try {
    localStorage.setItem('pyjamacode-theme', newTheme);
  } catch (e) {
    // localStorage may be unavailable (e.g. file:// origins).
  }
}

function updateHighlightJsTheme(theme) {
  const lightCss = document.getElementById('hljs-light-css');
  const darkCss = document.getElementById('hljs-dark-css');
  if (lightCss) lightCss.disabled = theme === 'dark';
  if (darkCss) darkCss.disabled = theme === 'light';
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
  updateHighlightJsTheme(savedTheme);
}

function colorizeOutput(output) {
  if (!output) return '';
  if (output.includes('<span')) return output;
  output = output.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
  return output
    .replace(/(All test cases passed\.?)/gi, '<span class="text-pass">$1</span>')
    .replace(/(Test case \d+ failed\.?)/gi, '<span class="text-fail">$1</span>')
    .replace(/(Build succeeded\.?)/gi, '<span class="text-pass">$1</span>')
    .replace(/(Compilation Error\.?)/gi, '<span class="text-fail">$1</span>')
    .replace(/(Runtime Error\.?)/gi, '<span class="text-fail">$1</span>');
}

function initTabs() {
  if (tabChallenge) {
    tabChallenge.addEventListener('click', () => setActiveTab('challenge'));
  }
  if (tabArticle) {
    tabArticle.addEventListener('click', () => setActiveTab('explanation'));
  }
  if (tabQuiz) {
    tabQuiz.addEventListener('click', () => setActiveTab('quiz'));
  }
}

function parseQuizData(raw) {
  if (!raw) return [];
  const blocks = raw.split(/\n##\s*/).filter(Boolean);
  return blocks.map((block) => {
    const lines = block.trim().split('\n');
    let question = lines[0].replace(/^##\s*/, '').trim();
    const label = question.toLowerCase();
    if (label === 'question' || label === 'q' || label === 'quiz') {
      question = lines.slice(1).find((l) => l.trim()) || '';
      question = question.trim();
    }
    const options = [];
    let correct = -1;
    let explanation = '';
    let optIdx = 0;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^-\s*\[.\]/.test(line)) {
        const marker = line[3];
        const text = line.slice(5).trim();
        const letters = 'ABCDEFGH';
        options.push({ letter: letters[optIdx] || '', text });
        if (marker.toUpperCase() === 'X') correct = optIdx;
        optIdx++;
      } else if (/^Correct:\s*([A-D])/i.test(line)) {
        const match = line.match(/^Correct:\s*([A-D])/i);
        if (match) correct = match[1].toUpperCase().charCodeAt(0) - 65;
      } else if (/^Explanation:/i.test(line)) {
        explanation = line.replace(/^Explanation:\s*/i, '').trim();
      }
    }
    return { question, options, correct, explanation };
  });
}

function renderQuiz() {
  if (!quizContentEl) return;
  const question = questions.find((q) => q.id === activeQuestionId);
  let quizRaw = question && question.quiz;
  if (!quizRaw || !quizRaw.trim()) {
    quizRaw = question && question._raw_quiz;
  }
  if (!quizRaw || !quizRaw.trim()) {
    quizContentEl.innerHTML = '<p class="text-muted">No quiz available for this lesson.</p>';
    return;
  }
  const items = parseQuizData(quizRaw);
  if (items.length === 0) {
    quizContentEl.innerHTML = '<p class="text-muted">No quiz available for this lesson.</p>';
    return;
  }
  const quizId = activeQuestionId || 'quiz-unknown';
  const savedResults = quizResults[quizId] || {};

  quizContentEl.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <span class="small text-muted">Quiz: ${escapeHtml(question.title)}</span>
      <button id="resetQuizBtn" class="btn btn-sm btn-outline-secondary">Reset Quiz</button>
    </div>
    ${items.map((item, qi) => `
      <div class="quiz-question mb-4" data-q="${qi}" data-solved="${savedResults[qi] === true ? 'true' : ''}">
        <p class="fw-semibold mb-2">${escapeHtml(item.question)}</p>
        <div class="quiz-options">
          ${item.options.map((opt, oi) => {
            const wasCorrect = savedResults[qi] === true;
            const isSelected = savedResults[qi] === true && oi === item.correct;
            return `
              <label class="quiz-option d-block py-1 px-2 mb-1" data-qi="${qi}" data-oi="${oi}"
                ${wasCorrect && isSelected ? 'style="border-color:var(--bs-success);background:var(--bs-success-bg-subtle)"' : ''}>
                <input type="radio" name="quiz-${qi}" value="${oi}" class="me-2"
                  ${wasCorrect ? 'disabled' : ''}
                  ${wasCorrect && isSelected ? 'checked' : ''}>
                <span class="option-letter">${opt.letter}.</span> ${escapeHtml(opt.text)}
              </label>
            `;
          }).join('')}
        </div>
        <div class="quiz-feedback mt-1 small ${savedResults[qi] === true ? '' : 'd-none'}">
          ${savedResults[qi] === true ? '<span class="fw-semibold text-pass">&#10003; Correct!</span> ' + escapeHtml(item.explanation) : ''}
        </div>
      </div>
    `).join('')}`;

  function saveQuizResults() {
    try { localStorage.setItem('pyjamacode-quiz-results', JSON.stringify(quizResults)); } catch (e) {}
  }

  quizContentEl.querySelectorAll('.quiz-option input[type="radio"]').forEach((input) => {
    input.addEventListener('change', (e) => {
      const label = e.target.closest('.quiz-option');
      const qi = parseInt(label.dataset.qi);
      const oi = parseInt(label.dataset.oi);
      const item = items[qi];
      const qDiv = quizContentEl.querySelector(`.quiz-question[data-q="${qi}"]`);
      const feedback = qDiv.querySelector('.quiz-feedback');
      const allLabels = qDiv.querySelectorAll('.quiz-option');

      if (qDiv.dataset.solved === 'true') return;

      allLabels.forEach((l) => { l.style.borderColor = ''; l.style.background = ''; });
      feedback.classList.add('d-none');

      if (oi === item.correct) {
        label.style.borderColor = 'var(--bs-success)';
        label.style.background = 'var(--bs-success-bg-subtle)';
        allLabels.forEach((l) => l.querySelector('input').disabled = true);
        qDiv.dataset.solved = 'true';
        if (!quizResults[quizId]) quizResults[quizId] = {};
        quizResults[quizId][qi] = true;
        saveQuizResults();
        feedback.className = 'quiz-feedback mt-1 small text-pass';
        feedback.innerHTML = '<span class="fw-semibold">&#10003; Correct!</span> ' + escapeHtml(item.explanation);
        feedback.classList.remove('d-none');
      } else {
        label.style.borderColor = 'var(--bs-danger)';
        label.style.background = 'var(--bs-danger-bg-subtle)';
        const nudges = [
          'Not quite. Look at each option carefully — which one matches the definition we explored?',
          'Close, but not right. Compare the options against what you know about this concept.',
          'Almost there. Think about which option best fits the description from the lesson.',
          'Not this one. Try eliminating the options you know are wrong first.',
          'Hmm, not quite. Re-read the question and consider each choice on its own merits.',
          'Good attempt! Now think about why your choice doesn\'t fit — what would need to be true for it to be correct?',
        ];
        feedback.className = 'quiz-feedback mt-1 small text-fail';
        feedback.innerHTML = '<span class="fw-semibold">&#10007;</span> ' + nudges[qi % nudges.length];
        feedback.classList.remove('d-none');
      }
    });
  });

  const resetBtn = document.getElementById('resetQuizBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      delete quizResults[quizId];
      saveQuizResults();
      renderQuiz();
    });
  }
}

function setActiveTab(tab) {
  if (questionContentEl) questionContentEl.classList.toggle('d-none', tab !== 'challenge');
  if (articleContentEl) articleContentEl.classList.toggle('d-none', tab !== 'explanation');
  if (quizContentEl) quizContentEl.classList.toggle('d-none', tab !== 'quiz');
  if (tabChallenge) tabChallenge.classList.toggle('active', tab === 'challenge');
  if (tabArticle) tabArticle.classList.toggle('active', tab === 'explanation');
  if (tabQuiz) tabQuiz.classList.toggle('active', tab === 'quiz');

  if (tab === 'quiz') renderQuiz();

  // Show/hide auth blur based on tab
  updateAuthBlur();

  // Update URL with tab parameter
  const url = new URL(window.location);
  if (tab === 'challenge') {
    url.searchParams.delete('tab');
  } else {
    url.searchParams.set('tab', tab);
  }
  try {
    history.replaceState(null, '', url.toString());
  } catch (e) {}

  // Scroll to hash after tab switch
  setTimeout(() => {
    if (window.location.hash) {
      const target = document.getElementById(window.location.hash.slice(1));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 50);
}

function initTypedTitle() {
  const typedEl = document.getElementById('typedTitle');
  if (!typedEl || typeof Typed === 'undefined') return;
  const title = typedEl.textContent || '';
  typedEl.textContent = '';
  new Typed('#typedTitle', {
    strings: [title],
    typeSpeed: 60,
    loop: false,
    showCursor: true,
    cursorChar: '_',
  });
}

function initImageZoom(root) {
  if (!root) return;
  root.querySelectorAll('figure img').forEach((img) => {
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      const overlay = document.getElementById('imageZoomOverlay');
      const zoomImg = document.getElementById('imageZoomImg');
      zoomImg.src = img.src;
      zoomImg.alt = img.alt;
      overlay.style.display = 'flex';
    });
  });
}

function embedYouTubeLinks(root) {
  if (!root) return;
  root.querySelectorAll('p, div, li').forEach((el) => {
    el.childNodes.forEach((node) => {
      if (node.nodeType === 3 && node.textContent) {
        const m = node.textContent.match(/https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
        if (m) {
          const span = document.createElement('span');
          span.innerHTML = '<br><div class="ratio ratio-16x9 my-3"><iframe src="https://www.youtube.com/embed/' + m[1] + '" allowfullscreen></iframe></div><br>';
          node.parentNode.replaceChild(span, node);
        }
      }
    });
  });
}

function enhanceCodeBlocks(root) {
  if (!root) return;
  let listingCounter = 0;
  const blocks = root.querySelectorAll('pre > code');
  blocks.forEach((codeEl) => {
    const pre = codeEl.parentElement;
    if (pre.classList.contains('cm-wrapper')) return;

    listingCounter++;
    const lang = extractLanguage(codeEl);
    const title = codeEl.getAttribute('data-title') || pre.getAttribute('data-title') || lang;
    const note = codeEl.getAttribute('data-note') || pre.getAttribute('data-note') || '';
    const rawCode = codeEl.textContent || '';

    // Apply highlight.js syntax highlighting
    if (typeof hljs !== 'undefined') {
      hljs.highlightElement(codeEl);
    }

    // Preserve syntax-highlighted HTML, split by newlines
    const html = codeEl.innerHTML;
    const lineHtmls = html.split(/\n/);
    const lineCount = lineHtmls.length;

    // Build line-numbered HTML preserving syntax spans
    let numberedHtml = '';
    for (let i = 0; i < lineCount; i++) {
      const lineNum = i + 1;
      numberedHtml += `<div class="cb-line" data-line="${lineNum}">`;
      numberedHtml += `<span class="cb-ln">${lineNum}</span>`;
      numberedHtml += `<span class="cb-code">${lineHtmls[i] || ' '}</span>`;
      numberedHtml += `</div>`;
    }
    codeEl.innerHTML = numberedHtml;

    const wrapper = document.createElement('div');
    wrapper.className = 'cb-wrapper';
    const listingId = 'listing-' + listingCounter;

    // Title bar
    const titleBar = document.createElement('div');
    titleBar.className = 'cb-titlebar';
    const titleSpan = document.createElement('span');
    titleSpan.className = 'cb-title';
    titleSpan.textContent = title;
    titleBar.appendChild(titleSpan);
    const copyBtn = document.createElement('button');
    copyBtn.className = 'cb-copy';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(rawCode).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
      });
    });
    titleBar.appendChild(copyBtn);
    wrapper.appendChild(titleBar);

    // Code area
    const codeArea = document.createElement('div');
    codeArea.className = 'cb-code-area';
    codeArea.appendChild(codeEl);
    wrapper.appendChild(codeArea);

    // Caption with anchor (outside wrapper)
    const caption = 'Listing ' + listingCounter + (note ? '. ' + note : '.');
    pre.parentElement.replaceChild(wrapper, pre);
    if (caption) {
      const captionEl = document.createElement('div');
      captionEl.className = 'cb-note';
      const anchor = document.createElement('a');
      anchor.className = 'cb-listing-link';
      anchor.id = listingId;
      anchor.href = '#' + listingId;
      anchor.textContent = caption;
      captionEl.appendChild(anchor);
      wrapper.after(captionEl);
    }
  });

  // Click-to-highlight lines (skip if user is selecting text)
  root.querySelectorAll('.cb-line').forEach((line) => {
    line.addEventListener('click', (e) => {
      if (e.target.closest('.cb-ln')) return;
      if (window.getSelection().toString().length > 0) return;
      const wasActive = line.classList.contains('active');
      const parent = line.closest('.cb-code-area');
      if (parent) {
        parent.querySelectorAll('.cb-line.active').forEach((l) => l.classList.remove('active'));
      }
      if (!wasActive) {
        line.classList.add('active');
      }
    });
  });
}

function extractLanguage(codeEl) {
  for (const cls of codeEl.classList) {
    if (cls.startsWith('language-')) {
      let lang = cls.slice(9);
      const map = { c: 'C', cpp: 'C++', cs: 'C#', js: 'JavaScript', ts: 'TypeScript',
        py: 'Python', rb: 'Ruby', go: 'Go', rs: 'Rust', asm: 'Assembly', gas: 'Assembly',
        bash: 'Bash', sh: 'Shell', makefile: 'Makefile', text: 'Text', plaintext: 'Text',
        html: 'HTML', css: 'CSS', json: 'JSON', xml: 'XML', yaml: 'YAML', toml: 'TOML',
        md: 'Markdown', markdown: 'Markdown', sql: 'SQL', diff: 'Diff' };
      return map[lang] || lang.toUpperCase();
    }
  }
  return '';
}

function initProblemNav() {
  const prevBtn = document.getElementById('prevProblemBtn');
  const nextBtn = document.getElementById('nextProblemBtn');
  if (!prevBtn || !nextBtn) return;

  function getFlatTree() {
    const tree = buildQuestionTree();
    const result = [];
    const topicKeys = Object.keys(tree).sort(
      (a, b) => (getTopicWeight(a) ?? 99) - (getTopicWeight(b) ?? 99)
    );
    topicKeys.forEach((topic) => {
      const subtopics = tree[topic];
      const subKeys = Object.keys(subtopics).sort((a, b) => {
        const skA = topic + '/' + a;
        const skB = topic + '/' + b;
        return (getSubtopicWeight(skA) ?? 99) - (getSubtopicWeight(skB) ?? 99);
      });
      subKeys.forEach((sub) => {
        const qs = [...subtopics[sub]].sort(
          (a, b) => (getWeight(a, 'weight', 99) - getWeight(b, 'weight', 99))
        );
        qs.forEach((q) => result.push(q));
      });
    });
    return result;
  }

  function getTopicWeight(topic) {
    let w;
    questions.forEach((q) => {
      if (q.topic === topic) {
        const tw = getWeight(q, 'topic_weight', 99);
        if (w === undefined || tw < w) w = tw;
      }
    });
    return w;
  }

  function getSubtopicWeight(key) {
    let w;
    questions.forEach((q) => {
      const sk = q.topic + '/' + q.subtopic;
      if (sk === key) {
        const sw = getWeight(q, 'subtopic_weight', 99);
        if (w === undefined || sw < w) w = sw;
      }
    });
    return w;
  }

  const navigate = (dir) => {
    const flat = getFlatTree();
    const idx = flat.findIndex((q) => q.id === activeQuestionId);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= flat.length) return;
    selectQuestion(flat[target].id);
  };

  prevBtn.addEventListener('click', () => navigate(-1));
  nextBtn.addEventListener('click', () => navigate(1));
}

function initSidebarToggle() {
  const hideBtn = document.getElementById('sidebarHideBtn');
  const showBtn = document.getElementById('sidebarShowBtn');
  const sidebar = document.getElementById('sidebarPane');
  const body = document.body;
  if (!hideBtn || !showBtn || !sidebar) return;

  function updateUI(collapsed) {
    body.classList.toggle('sidebar-collapsed', collapsed);
    hideBtn.classList.toggle('d-none', collapsed);
    showBtn.classList.toggle('d-none', !collapsed);
    hideBtn.setAttribute('title', collapsed ? 'Show sidebar' : 'Collapse sidebar');
    showBtn.setAttribute('title', collapsed ? 'Show sidebar' : 'Collapse sidebar');
    sidebar.style.width = '';
  }

  const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  if (collapsed) updateUI(true);

  function toggle() {
    const isCollapsed = !body.classList.contains('sidebar-collapsed');
    updateUI(isCollapsed);
    localStorage.setItem('sidebarCollapsed', isCollapsed);
    [hideBtn, showBtn].forEach((btn) => {
      if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tp = bootstrap.Tooltip.getInstance(btn);
        if (tp) tp.hide();
      }
    });
    setTimeout(() => { if (codeMirror) codeMirror.refresh(); }, 250);
  }

  hideBtn.addEventListener('click', toggle);
  showBtn.addEventListener('click', toggle);
}

function initVimeoPlayers(root) {
  if (!root) return;
  root.querySelectorAll('.vm-wrapper').forEach((wrapper) => {
    if (wrapper.dataset.vmInit) return;
    wrapper.dataset.vmInit = '1';

    const videoId = wrapper.dataset.videoId;
    const thumb = wrapper.querySelector('.vm-thumb');
    const playerDiv = wrapper.querySelector('.vm-player');
    const shield = wrapper.querySelector('.vm-shield');
    const controls = wrapper.querySelector('.vm-controls');
    const playBtn = controls ? controls.querySelector('.vmc-play i') : null;
    const muteBtn = controls ? controls.querySelector('.vmc-mute i') : null;
    const fsBtn = controls ? controls.querySelector('.vmc-fs') : null;
    const fill = controls ? controls.querySelector('.vmc-fill') : null;
    const currentEl = controls ? controls.querySelector('.vmc-current') : null;
    const durationEl = controls ? controls.querySelector('.vmc-duration') : null;
    const track = controls ? controls.querySelector('.vmc-track') : null;
    if (!videoId) return;

    let player = null;
    let seeking = false;

    const show = () => {
      playerDiv.style.display = 'block';
      if (shield) shield.style.display = 'block';
      if (controls) controls.style.display = 'flex';
      const img = thumb.querySelector('img');
      const pbtn = thumb.querySelector('.vm-playbtn');
      if (img) img.style.display = 'none';
      if (pbtn) pbtn.style.display = 'none';

      const iframe = playerDiv.querySelector('iframe');
      if (typeof Vimeo !== 'undefined' && Vimeo.Player) {
        player = new Vimeo.Player(iframe);
        player.setVolume(1);
        player.play();

        player.on('play', () => {
          if (controls) { controls.style.opacity = '1'; controls.classList.add('vm-controls-show'); }
          if (playBtn) playBtn.className = 'bi bi-pause-fill';
          startProgress();
          hideControlsAfterDelay();
        });

        player.on('pause', () => {
          if (playBtn) playBtn.className = 'bi bi-play-fill';
          stopProgress();
          if (controls) controls.style.opacity = '1';
        });

        player.on('ended', () => {
          if (playBtn) playBtn.className = 'bi bi-play-fill';
          stopProgress();
          if (controls) controls.style.opacity = '1';
        });

        player.on('timeupdate', (data) => {
          if (seeking) return;
          const pct = data.percent * 100;
          if (fill) fill.style.width = pct + '%';
          if (currentEl) currentEl.textContent = formatTimeV(data.seconds);
        });

        player.getDuration().then((d) => {
          if (durationEl) durationEl.textContent = formatTimeV(d);
        });
      }
    };

    wrapper.addEventListener('click', (e) => {
      if (e.target.closest('.vmc-btn') || e.target.closest('.vmc-track')) return;
      if (player) {
        player.getPaused().then((p) => { if (p) player.play(); else player.pause(); });
      } else {
        show();
      }
    });

    if (playBtn) {
      playBtn.closest('.vmc-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (player) {
          player.getPaused().then((p) => { if (p) player.play(); else player.pause(); });
        } else {
          show();
        }
      });
    }

    if (muteBtn) {
      muteBtn.closest('.vmc-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (player) {
          player.getVolume().then((v) => {
            if (v > 0) { player.setVolume(0); muteBtn.className = 'bi bi-volume-mute-fill'; }
            else { player.setVolume(1); muteBtn.className = 'bi bi-volume-up-fill'; }
          });
        }
      });
    }

    if (fsBtn) {
      fsBtn.closest('.vmc-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (document.fullscreenElement) document.exitFullscreen();
        else wrapper.requestFullscreen();
      });
    }

    // Quality selector
    const qualityMenu = wrapper.querySelector('.vmc-quality-menu');
    const qualityBtn = wrapper.querySelector('.vmc-quality-btn');
    if (qualityBtn && qualityMenu) {
      const content = qualityMenu.querySelector('.vmc-dropdown-content');
      qualityBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = content.style.display === 'block';
        // Close all dropdowns
        wrapper.querySelectorAll('.vmc-dropdown-content').forEach((c) => c.style.display = 'none');
        if (!isOpen && player) content.style.display = 'block';
      });
      wrapper.addEventListener('click', () => { if (content) content.style.display = 'none'; });
      if (player) {
        player.getQualities().then((qs) => {
          if (qs.length > 1) {
            content.innerHTML = qs.map((q) => {
              const label = q.label || q.id;
              const active = q.active ? 'active' : '';
              return '<a data-quality="' + q.id + '" class="' + active + '">' + label + '</a>';
            }).join('');
            content.querySelectorAll('a').forEach((el) => {
              el.addEventListener('click', (e) => {
                e.stopPropagation();
                player.setQuality(el.dataset.quality);
                content.querySelectorAll('a').forEach((a) => a.classList.remove('active'));
                el.classList.add('active');
                qualityBtn.textContent = el.textContent;
                content.style.display = 'none';
              });
            });
          } else {
            qualityMenu.style.display = 'none';
          }
        });
      }
    }

    // Speed selector
    const speedMenu = wrapper.querySelector('.vmc-speed-menu');
    const speedBtn = wrapper.querySelector('.vmc-speed-btn');
    if (speedBtn && speedMenu) {
      const content = speedMenu.querySelector('.vmc-dropdown-content');
      const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
      content.innerHTML = speeds.map((s) => {
        const active = s === 1 ? 'active' : '';
        return '<a data-speed="' + s + '" class="' + active + '">' + s + 'x</a>';
      }).join('');
      speedBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = content.style.display === 'block';
        wrapper.querySelectorAll('.vmc-dropdown-content').forEach((c) => c.style.display = 'none');
        if (!isOpen && player) content.style.display = 'block';
      });
      content.querySelectorAll('a').forEach((el) => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const speed = parseFloat(el.dataset.speed);
          if (player) player.setPlaybackRate(speed);
          content.querySelectorAll('a').forEach((a) => a.classList.remove('active'));
          el.classList.add('active');
          speedBtn.textContent = speed + 'x';
          content.style.display = 'none';
        });
      });
    }

    if (track) {
      track.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        seeking = true;
        seekV(e);
        const onMove = (ev) => seekV(ev);
        const onUp = () => { seeking = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }

    let ctrlTimer = null;
    const showControlsFade = () => {
      if (controls && controls.style.display !== 'none') {
        controls.style.opacity = '1';
        clearTimeout(ctrlTimer);
        if (player) {
          player.getPaused().then((p) => {
            if (!p) ctrlTimer = setTimeout(() => { if (controls) controls.style.opacity = '0'; }, 3000);
          }).catch(() => {});
        }
      }
    };

    wrapper.addEventListener('mousemove', showControlsFade);

    function hideControlsAfterDelay() {
      clearTimeout(ctrlTimer);
      ctrlTimer = setTimeout(() => { if (controls) controls.style.opacity = '0'; }, 3000);
    }
    function clearControlsTimer() { if (ctrlTimer) { clearTimeout(ctrlTimer); ctrlTimer = null; } }

    function seekV(e) {
      if (!player || !track) return;
      const rect = track.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      player.setCurrentTime(pct * 1);
      player.getDuration().then((d) => { player.setCurrentTime(pct * d); });
    }

    let progInterval = null;
    function startProgress() { stopProgress(); progInterval = setInterval(() => {
      if (!player || !fill || !currentEl) return;
      if (seeking) return;
      player.getCurrentTime().then((ct) => {
        player.getDuration().then((d) => {
          if (d > 0) fill.style.width = (ct / d * 100) + '%';
          currentEl.textContent = formatTimeV(ct);
        });
      });
    }, 200); }
    function stopProgress() { if (progInterval) { clearInterval(progInterval); progInterval = null; } }
  });
}

function formatTimeV(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function ansiToHtml(text) {
  if (!text) return '';
  let s = text.split('\n').map(l => { const p = l.split('\r'); return p[p.length-1]; }).join('\n');
  s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\t/g, '  ');

  const AN = {
    1: [0,'b'], 3: [0,'i'], 4: [0,'u'],
    30:[1,0], 31:[1,1], 32:[1,2], 33:[1,3], 34:[1,4], 35:[1,5], 36:[1,6], 37:[1,7],
    90:[1,8], 91:[1,9], 92:[1,10], 93:[1,11], 94:[1,12], 95:[1,13], 96:[1,14], 97:[1,15],
    40:[2,0], 41:[2,1], 42:[2,2], 43:[2,3], 44:[2,4], 45:[2,5], 46:[2,6], 47:[2,7],
    100:[2,8], 101:[2,9], 102:[2,10], 103:[2,11], 104:[2,12], 105:[2,13], 106:[2,14], 107:[2,15],
  };
  const STYLES = [
    '', 'font-weight:bold', 'font-style:italic', 'text-decoration:underline',
  ];

  const re = /\x1b\[([0-9;]*)m/g;
  let out = '', last = 0, state = {}, open = false, m;
  while ((m = re.exec(s)) !== null) {
    out += s.slice(last, m.index);
    if (open) { out += '</span>'; open = false; }
    const codes = m[1] ? m[1].split(';') : ['0'];
    for (const c of codes) {
      if (c === '0' || c === '') { state = {}; }
      else if (AN[c]) {
        const [type, val] = AN[c];
        if (type === 0) state['s'+val] = true;
        else if (type === 1) state.fg = val;
        else if (type === 2) state.bg = val;
      }
    }
    const parts = [];
    if (state.sb) parts.push(STYLES[1]);
    if (state.si) parts.push(STYLES[2]);
    if (state.su) parts.push(STYLES[3]);
    if (state.fg !== undefined) parts.push('color:var(--ansi-'+state.fg+')');
    if (state.bg !== undefined) parts.push('background-color:var(--ansi-'+state.bg+')');
    if (parts.length) { out += '<span style="'+parts.join(';')+'">'; open = true; }
    last = m.index + m[0].length;
  }
  out += s.slice(last);
  if (open) out += '</span>';
  return out;
}

/* ─── File Tabs ─── */
function buildFileTabs(question) {
  fileList = [];
  activeFileIndex = 0;
  unsavedFiles = {};

  if (question.codes) {
    const div = document.createElement('div');
    div.innerHTML = question.codes;
    const pres = div.querySelectorAll('pre');
    pres.forEach((pre) => {
      const codeEl = pre.querySelector('code');
      if (!codeEl) return;
      const raw = pre.getAttribute('data-title') || '';
      const lang = extractLanguage(codeEl);
      const filename = raw || 'untitled.' + (lang || 'c').toLowerCase();
      const content = codeEl.textContent || '';
      fileList.push({ filename: filename, language: lang || 'c', content: content });
    });
  }

  if (fileList.length === 0 && question.initial_code) {
    fileList.push({ filename: 'main.c', language: 'c', content: question.initial_code });
  }

  // Render tabs
  if (fileTabs) {
    fileTabs.innerHTML = '';
    fileList.forEach((file, idx) => {
      const tab = document.createElement('div');
      tab.className = 'file-tab' + (idx === activeFileIndex ? ' active' : '');
      const dot = document.createElement('i');
      dot.className = 'bi bi-dot';
      dot.style.fontSize = '1em';
      dot.style.verticalAlign = 'middle';
      tab.appendChild(dot);
      tab.appendChild(document.createTextNode(file.filename));
      tab.addEventListener('click', () => switchFileTab(idx));
      fileTabs.appendChild(tab);
    });
  }

  // Show/hide reset all button
  if (resetAllBtn) resetAllBtn.classList.toggle('d-none', fileList.length <= 1);

  // Load active file content
  loadActiveFile(question);
}

function loadActiveFile(question) {
  if (!question) return;
  const id = question.id;
  let code = '';
  if (fileList.length > 0) {
    const file = fileList[activeFileIndex];
    const saved = submissions[id]?.files?.[file.filename];
    code = saved || file.content;
    const lang = file.language || 'c';
    if (languageLabelEl) languageLabelEl.textContent = lang.toUpperCase();
    updateCodeMirrorMode(lang);
  } else {
    const saved = submissions[id]?.code;
    const starter = question.initial_code || '';
    code = saved || starter;
    if (languageLabelEl) languageLabelEl.textContent = (question.language || 'c').toUpperCase();
    updateCodeMirrorMode(question.language || 'c');
  }
  setEditorValue(code);
}

function switchFileTab(idx) {
  if (idx === activeFileIndex) return;
  // Save current file code
  if (activeQuestionId && fileList.length > 0) {
    const file = fileList[activeFileIndex];
    if (!submissions[activeQuestionId]) submissions[activeQuestionId] = {};
    if (!submissions[activeQuestionId].files) submissions[activeQuestionId].files = {};
    submissions[activeQuestionId].files[file.filename] = getEditorValue();
    delete unsavedFiles[file.filename];
  }
  activeFileIndex = idx;
  // Update tab styles
  if (fileTabs) {
    fileTabs.querySelectorAll('.file-tab').forEach((tab, i) => {
      tab.classList.toggle('active', i === idx);
    });
  }
  // Load new file
  const question = questions.find((q) => q.id === activeQuestionId);
  if (question) loadActiveFile(question);
  persistSubmissions();
  refreshFileUnsavedDots();
}

function getActiveFileTab() {
  if (!fileTabs) return null;
  return fileTabs.querySelector('.file-tab.active');
}

function getFilenameForIndex(idx) {
  if (!fileList || idx < 0 || idx >= fileList.length) return null;
  return fileList[idx].filename;
}

function showFileUnsavedDot(idx) {
  const name = getFilenameForIndex(idx);
  if (!name) return;
  unsavedFiles[name] = true;
  const tab = fileTabs ? fileTabs.querySelectorAll('.file-tab')[idx] : null;
  if (tab) {
    const dot = tab.querySelector('.bi-dot');
    if (dot) dot.classList.add('d-unsaved');
  }
}

function hideFileUnsavedDot() {
  const name = getFilenameForIndex(activeFileIndex);
  if (!name) return;
  delete unsavedFiles[name];
  const tab = fileTabs ? fileTabs.querySelectorAll('.file-tab')[activeFileIndex] : null;
  if (tab) {
    const dot = tab.querySelector('.bi-dot');
    if (dot) dot.classList.remove('d-unsaved');
  }
}

function hideAllUnsavedDots() {
  unsavedFiles = {};
  if (!fileTabs) return;
  fileTabs.querySelectorAll('.file-tab .bi-dot').forEach((d) => d.classList.remove('d-unsaved'));
}

function refreshFileUnsavedDots() {
  if (!fileTabs) return;
  fileTabs.querySelectorAll('.file-tab').forEach((tab, idx) => {
    const name = getFilenameForIndex(idx);
    const dot = tab.querySelector('.bi-dot');
    if (!dot || !name) return;
    dot.classList.toggle('d-unsaved', !!unsavedFiles[name]);
  });
}

function showNotesUnsavedDot() {
  const el = document.getElementById('notesUnsavedDot');
  if (el) el.classList.add('d-unsaved');
}

function hideNotesUnsavedDot() {
  const el = document.getElementById('notesUnsavedDot');
  if (el) el.classList.remove('d-unsaved');
}

/* ─── Auth ─── */
let authMode = 'signin';
const authOverlay = document.getElementById('authOverlay');
const authModal = document.getElementById('authModal');
const authModalTitle = document.getElementById('authModalTitle');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authActionBtn = document.getElementById('authActionBtn');
const authError = document.getElementById('authError');
const authToggleLink = document.getElementById('authToggleLink');
const authToggleText = document.getElementById('authToggleText');
const authCloseLink = document.getElementById('authCloseLink');
const authShowBtn = document.getElementById('authShowBtn');
const authLoginBtn = document.getElementById('authLoginBtn');
const authUserMenu = document.getElementById('authUserMenu');
const authAvatar = document.getElementById('authAvatar');
const authUserName = document.getElementById('authUserName');
const authUserEmail = document.getElementById('authUserEmail');
const authLogoutLink = document.getElementById('authLogoutLink');
const themeToggleDropdown = document.getElementById('themeToggleDropdown');
const resetProfileLink = document.getElementById('resetProfileLink');
const authGoogleBtn = document.getElementById('authGoogleBtn');
/* ─── Resume (track last problem URL) ─── */
function maybeSaveProblemUrl(url) {
  if (url && url.includes('/courses/')) {
    localStorage.setItem('lastProblemUrl', url);
  }
}

(function() {
  maybeSaveProblemUrl(window.location.href);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) maybeSaveProblemUrl(window.location.href);
  });

  window.addEventListener('popstate', () => {
    maybeSaveProblemUrl(window.location.href);
  });
})();

function updateAuthBlur() {
  const authed = isAuthenticated();
  const ready = typeof isAuthReady === 'undefined' ? true : isAuthReady();
  const onLectureTab = articleContentEl && !articleContentEl.classList.contains('d-none');
  if (articleContentEl && authOverlay) {
    if (authed || !onLectureTab || !ready) {
      articleContentEl.classList.remove('article-content-blurred');
      authOverlay.classList.remove('show');
    } else {
      articleContentEl.classList.add('article-content-blurred');
      authOverlay.classList.add('show');
    }
  }
}

function setupAuth() {
  if (typeof onAuthChange === 'undefined') return;

  // One-time button listeners
  if (authLoginBtn) authLoginBtn.addEventListener('click', () => openAuthModal('signin'));
  if (authLogoutLink) authLogoutLink.addEventListener('click', () => { signOut().catch(() => {}); });
  if (themeToggleDropdown) themeToggleDropdown.addEventListener('click', () => { toggleTheme(); });
  const resetDialog = document.getElementById('resetConfirmModal');
  if (resetProfileLink) {
    resetProfileLink.addEventListener('click', () => {
      if (resetDialog) resetDialog.showModal();
    });
  }
  const resetConfirmYes = document.getElementById('resetConfirmYes');
  const resetConfirmNo = document.getElementById('resetConfirmNo');
  if (resetConfirmNo) resetConfirmNo.addEventListener('click', () => {
    if (resetDialog) resetDialog.close();
  });
  if (resetConfirmYes) {
    resetConfirmYes.addEventListener('click', () => {
      if (resetDialog) resetDialog.close();
      // Use firebase.auth().currentUser directly — always up to date
      let uid = null;
      try {
        if (typeof firebase !== 'undefined' && firebase.apps.length && firebase.auth().currentUser) {
          uid = firebase.auth().currentUser.uid;
        }
      } catch (e) {}
      const deletePromise = uid
        ? firebase.firestore().collection('userData').doc(uid).delete()
        : Promise.resolve();
      if (uid) {
        deletePromise.then(() => {
          localStorage.removeItem('pyjamacode-submissions');
          localStorage.removeItem('pyjamacode-notes');
          localStorage.removeItem('pyjamacode-theme');
          localStorage.removeItem('pyjamacode-bookmarks');
          localStorage.removeItem('pyjamacode-quiz-results');
          localStorage.removeItem('lastProblemUrl');
          window.location.href = '/dashboard/';
        }).catch((e) => {
          console.error('Failed to delete cloud data:', e);
          localStorage.removeItem('pyjamacode-submissions');
          localStorage.removeItem('pyjamacode-notes');
          localStorage.removeItem('pyjamacode-theme');
          localStorage.removeItem('pyjamacode-bookmarks');
          localStorage.removeItem('pyjamacode-quiz-results');
          localStorage.removeItem('lastProblemUrl');
          window.location.href = '/dashboard/';
        });
      } else {
        localStorage.removeItem('pyjamacode-submissions');
        localStorage.removeItem('pyjamacode-notes');
        localStorage.removeItem('pyjamacode-theme');
        localStorage.removeItem('pyjamacode-bookmarks');
          localStorage.removeItem('pyjamacode-quiz-results');
        localStorage.removeItem('lastProblemUrl');
        window.location.href = '/dashboard/';
      }
    });
  }
  if (authGoogleBtn) authGoogleBtn.addEventListener('click', () => {
    signInWithGoogle().then(() => { closeAuthModal(); }).catch((err) => {
      showAuthError(err.message || 'Google sign-in failed.');
    });
  });

  onAuthChange((user) => {
    const isAuthed = user !== null;

    // Clear force blur and reset view count on login
    if (isAuthed) {
      if (questionContentEl) questionContentEl.classList.remove('content-blurred-force');
      if (editorArea) editorArea.classList.remove('content-blurred-force');
      if (authCloseLink) authCloseLink.style.display = '';
      if (authModal) authModal._backdropClose = false;
      clearTimeout(window._authNudgeTimer);
      localStorage.removeItem('authForced');
      _viewCount = 0;
      _authNudged = false;

      // Redirect to dashboard after login if on landing page
      if (isAuthed && (window.location.pathname === '/' || window.location.pathname === '')) {
        window.location.replace('/dashboard/');
        return;
      }
    }

    if (authLoginBtn) authLoginBtn.classList.toggle('d-none', isAuthed);
    if (authUserMenu) authUserMenu.classList.toggle('d-none', !isAuthed);
    if (themeToggle) themeToggle.classList.toggle('d-none', isAuthed);
    if (user) {
      const name = user.displayName || user.email || '';
      const initial = (user.displayName || user.email || '?').charAt(0).toUpperCase();
      if (authUserName) authUserName.textContent = name;
      if (authAvatar) {
        if (user.photoURL) {
          authAvatar.innerHTML = '<img src="' + user.photoURL + '" alt="">';
        } else {
          authAvatar.textContent = initial;
        }
      }
      if (authUserEmail) authUserEmail.textContent = user.email;
    }

    updateAuthBlur();
  });

  // Auth overlay button → open modal
  if (authShowBtn) authShowBtn.addEventListener('click', () => openAuthModal('signin'));

  // Auth modal toggle (Sign In ↔ Sign Up)
  if (authToggleLink) {
    authToggleLink.addEventListener('click', () => {
      if (authMode === 'signin') openAuthModal('signup');
      else openAuthModal('signin');
    });
  }

  // Close modal
  if (authCloseLink) authCloseLink.addEventListener('click', closeAuthModal);
  if (authModal) authModal.addEventListener('click', (e) => { if (e.target === authModal && !authModal._backdropClose) closeAuthModal(); });

  // Action button
  if (authActionBtn) authActionBtn.addEventListener('click', handleAuthAction);

  // Enter key in password field
  if (authPassword) authPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAuthAction(); });
}

function openAuthModal(mode) {
  authMode = mode;
  if (authModalTitle) authModalTitle.textContent = mode === 'signin' ? 'Sign In' : 'Sign Up';
  if (authActionBtn) authActionBtn.textContent = mode === 'signin' ? 'Sign In' : 'Sign Up';
  if (authToggleText) authToggleText.textContent = mode === 'signin' ? "Don't have an account? " : 'Already have an account? ';
  if (authToggleLink) authToggleLink.textContent = mode === 'signin' ? 'Sign Up' : 'Sign In';
  if (authError) authError.style.display = 'none';
  if (authEmail) authEmail.value = '';
  if (authPassword) authPassword.value = '';
  if (authModal) authModal.classList.add('show');
  if (authEmail) setTimeout(() => authEmail.focus(), 100);
}
window.openAuthModal = openAuthModal;

function closeAuthModal() {
  if (authModal) authModal.classList.remove('show');
  if (authError) authError.style.display = 'none';
  // If force auth is active, dismiss and start timer
  if (questionContentEl && questionContentEl.classList.contains('content-blurred-force')) {
    if (typeof window._dismissForceAuth === 'function') window._dismissForceAuth();
    return;
  }
}

function handleAuthAction() {
  const email = authEmail ? authEmail.value.trim() : '';
  const password = authPassword ? authPassword.value : '';

  if (!email || !password) {
    showAuthError('Please enter email and password.');
    return;
  }

  if (authActionBtn) authActionBtn.disabled = true;

  const promise = authMode === 'signin' ? signIn(email, password) : signUp(email, password);

  promise
    .then(() => { closeAuthModal(); })
    .catch((err) => {
      let msg = err.message || 'An error occurred.';
      // Simplify common Firebase errors
      if (msg.includes('email-already-in-use')) msg = 'This email is already registered.';
      else if (msg.includes('wrong-password') || msg.includes('user-not-found')) msg = 'Invalid email or password.';
      else if (msg.includes('weak-password')) msg = 'Password should be at least 6 characters.';
      else if (msg.includes('invalid-email')) msg = 'Please enter a valid email address.';
      showAuthError(msg);
    })
    .finally(() => { if (authActionBtn) authActionBtn.disabled = false; });
}

function showAuthError(msg) {
  if (authError) {
    authError.textContent = msg;
    authError.style.display = 'block';
  }
}

/* ─── Cloud Sync ─── */
function initSync() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;
  const db = firebase.firestore();
  let syncUid = null;
  let syncTimer = null;

  function getData() {
    return {
      submissions: localStorage.getItem('pyjamacode-submissions') || '{}',
      notes: localStorage.getItem('pyjamacode-notes') || '{}',
      theme: localStorage.getItem('pyjamacode-theme') || 'dark',
      tab: new URL(window.location).searchParams.get('tab') || '',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
  }

  function getFilteredData() {
    const raw = getData();
    let subs = {};
    try { subs = JSON.parse(raw.submissions); } catch (e) { subs = {}; }
    let filteredSubs = {};
    for (const id of Object.keys(subs)) {
      const q = questions.find((x) => x.id === id);
      if (!q) continue;
      const starter = q.initial_code || '';
      const sub = subs[id];
      const code = sub.code || sub.files?.['main.c'] || '';
      const hasCodeChange = multiFileChangesExist(q, sub);
      const hasStatus = sub.status && sub.status !== 'Unattempted';
      if (hasCodeChange || hasStatus) {
        filteredSubs[id] = sub;
      }
    }
    let filteredNotes = {};
    try {
      const allNotes = JSON.parse(raw.notes);
      for (const id of Object.keys(allNotes)) {
        if (allNotes[id] && allNotes[id].trim()) filteredNotes[id] = allNotes[id];
      }
    } catch (e) {}
    return {
      submissions: JSON.stringify(filteredSubs),
      notes: JSON.stringify(filteredNotes),
      theme: raw.theme,
      tab: raw.tab,
      updatedAt: raw.updatedAt
    };
  }

  function multiFileChangesExist(q, sub) {
    if (!q.codes || !sub.files) return false;
    const div = document.createElement('div');
    div.innerHTML = q.codes;
    const pres = div.querySelectorAll('pre');
    for (const pre of pres) {
      const raw = pre.getAttribute('data-title') || '';
      const codeEl = pre.querySelector('code');
      const content = codeEl ? codeEl.textContent || '' : '';
      const filename = raw || 'untitled.c';
      const saved = sub.files[filename];
      if (saved !== undefined && saved !== content) return true;
    }
    return false;
  }

  let isPushingLocally = false;
  let cloudUnsub = null;

  function applyCloudData(d) {
    if (activeQuestionId) saveCurrentCode();
    let changed = false;
    if (d.submissions) {
      localStorage.setItem('pyjamacode-submissions', d.submissions);
      try { submissions = JSON.parse(d.submissions) || {}; } catch (e) { submissions = {}; }
      changed = true;
    }
    if (d.notes) {
      localStorage.setItem('pyjamacode-notes', d.notes);
      try { notes = JSON.parse(d.notes) || {}; } catch (e) { notes = {}; }
      changed = true;
    }
      if (d.theme) {
        localStorage.setItem('pyjamacode-theme', d.theme);
        htmlEl.setAttribute('data-bs-theme', d.theme);
        updateThemeIcon(d.theme);
        updateCodeMirrorTheme();
        updateHighlightJsTheme(d.theme);
        changed = true;
      }
    if (changed) refreshUI();
  }

  function pushToCloud() {
    if (!syncUid) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      isPushingLocally = true;
      db.collection('userData').doc(syncUid).set(getData()).then(() => {
        setTimeout(() => { isPushingLocally = false; }, 1000);
      }).catch(() => { isPushingLocally = false; });
    }, 300);
  }

  function startCloudListener(uid) {
    if (cloudUnsub) cloudUnsub();
    cloudUnsub = db.collection('userData').doc(uid).onSnapshot((snap) => {
      if (isPushingLocally) return;
      if (snap.exists) { applyCloudData(snap.data()); setDirty(false); }
    });
  }

  function stopCloudListener() {
    if (cloudUnsub) { cloudUnsub(); cloudUnsub = null; }
  }

  function pullFromCloud(uid) {
    return db.collection('userData').doc(uid).get().then((snap) => {
      if (!snap.exists) {
        db.collection('userData').doc(uid).set(getFilteredData()).then(() => setDirty(false)).catch(() => {});
        return;
      }
      applyCloudData(snap.data());
      setDirty(false);
    });
  }

  function refreshUI() {
    loadSubmissions();
    loadNotes();
    if (activeQuestionId && questionContentEl) selectQuestion(activeQuestionId);
    else renderQuestionList(questionSearchEl ? questionSearchEl.value : '');
  }

  // Listen for auth changes
  onAuthChange((user) => {
    if (user) {
      syncUid = user.uid;
      pullFromCloud(user.uid).then(() => {
        refreshUI();
        startCloudListener(user.uid);
        setDirty(false);
      }).catch(() => {
        db.collection('userData').doc(user.uid).set(getFilteredData()).then(() => setDirty(false)).catch(() => {});
        startCloudListener(user.uid);
      });
    } else {
      syncUid = null;
      stopCloudListener();
      setDirty(false);
    }
  });

  let dirty = false;

  function setDirty(v) {
    if (!syncUid) return;
    dirty = v;
    const base = document.title.replace(/^\* /, '');
    document.title = v ? '* ' + base : base;
  }

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (!syncUid) return;
      saveCurrentCode();
      saveCurrentNotes();
      isPushingLocally = true;
      db.collection('userData').doc(syncUid).set(getFilteredData()).then(() => {
        setTimeout(() => { isPushingLocally = false; }, 1000);
        setDirty(false);
      }).catch(() => { isPushingLocally = false; });
    }
  });

  const origToggleTheme = toggleTheme;
  toggleTheme = function() {
    origToggleTheme();
    if (syncUid) {
      db.collection('userData').doc(syncUid).set(getFilteredData()).catch(() => {});
    }
  };

  const origPersistSubmissions = persistSubmissions;
  persistSubmissions = function() {
    origPersistSubmissions();
  };

  const origPersistNotes = persistNotes;
  persistNotes = function() {
    origPersistNotes();
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
