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
const tabChallenge = document.getElementById('tabChallenge');
const tabArticle = document.getElementById('tabArticle');
const difficultyBadgeEl = document.getElementById('difficultyBadge');
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

let questions = [];
let activeQuestionId = null;
let submissions = {};
let notes = {};
let codeMirror = null;
let notesCodeMirror = null;
let saveTimeout = null;
let notesSaveTimeout = null;
let isSettingValue = false;
let isSettingNotesValue = false;
let notesPreviewMode = true;
let notesSavedHeight = null;
let notesViewState = 'normal';
let treeExpanded = {};

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
  loadNotes();
  initCodeMirror();
  initNotesCodeMirror();
  renderQuestionList();
  selectQuestion(activeQuestionId);
  setNotesPreviewMode(true);
  initTypedTitle();
  notesSavedHeight = notesArea ? notesArea.offsetHeight : 200;

  if (questionSearchEl) {
    questionSearchEl.addEventListener('input', (e) => renderQuestionList(e.target.value));
  }
  if (runBtn) runBtn.addEventListener('click', runCode);
  if (submitBtn) submitBtn.addEventListener('click', submitCode);
  if (resetBtn) resetBtn.addEventListener('click', resetCase);
  if (clearConsoleBtn) clearConsoleBtn.addEventListener('click', () => (consoleOutputEl.textContent = ''));
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
}

function handleKeyboardShortcuts(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    if (activeQuestionId) {
      saveCurrentCode();
      saveCurrentNotes();
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
  if (notesCodeMirror) {
    notesCodeMirror.setOption('theme', getCodeMirrorTheme());
  }
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
      debounceSaveCurrentNotes();
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

function selectQuestion(id) {
  activeQuestionId = id;
  const question = questions.find((q) => q.id === id);
  if (!question) return;

  // Set up tabs
  const hasArticle = question.article && question.article.trim().length > 0;
  if (tabArticle) {
    tabArticle.classList.toggle('d-none', !hasArticle);
  }
  // Remember tab before resetting URL
  const prevTab = new URL(window.location).searchParams.get('tab') || 'challenge';
  setActiveTab('challenge');

  questionContentEl.innerHTML = question.content;
  enhanceCodeBlocks(questionContentEl);
  if (articleContentEl) {
    articleContentEl.innerHTML = hasArticle ? question.article : '';
    enhanceCodeBlocks(articleContentEl);
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
  if (languageLabelEl) {
    languageLabelEl.textContent = (question.language || 'c').toUpperCase();
  }
  updateCodeMirrorMode(question.language || 'c');

  const savedCode = submissions[id]?.code;
  const starterCode = question.initial_code || '';
  setEditorValue(savedCode || starterCode);

  const savedNotes = notes[id] || '';
  setNotesEditorValue(savedNotes);
  if (notesPreviewMode) {
    renderNotesPreview();
  }

  const sub = submissions[id];
  if (sub) {
    consoleOutputEl.innerHTML = colorizeOutput(sub.output);
    updateStatus(sub.status);
  } else {
    consoleOutputEl.textContent = 'Ready to code. Click Run to compile or Submit to check this case.';
    updateStatus('Unattempted');
  }

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
  // If already HTML, return as-is.
  if (output.includes('<span')) return output;

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
}

function setActiveTab(tab) {
  if (questionContentEl) questionContentEl.classList.toggle('d-none', tab !== 'challenge');
  if (articleContentEl) articleContentEl.classList.toggle('d-none', tab !== 'explanation');
  if (tabChallenge) tabChallenge.classList.toggle('active', tab === 'challenge');
  if (tabArticle) tabArticle.classList.toggle('active', tab === 'explanation');

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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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
const authGoogleBtn = document.getElementById('authGoogleBtn');

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
  if (authGoogleBtn) authGoogleBtn.addEventListener('click', () => {
    signInWithGoogle().then(() => { closeAuthModal(); }).catch((err) => {
      showAuthError(err.message || 'Google sign-in failed.');
    });
  });

  onAuthChange((user) => {
    const isAuthed = user !== null;

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
  if (authModal) authModal.addEventListener('click', (e) => { if (e.target === authModal) closeAuthModal(); });

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

function closeAuthModal() {
  if (authModal) authModal.classList.remove('show');
  if (authError) authError.style.display = 'none';
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
