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
let _freeUsed = (function() { try { return localStorage.getItem('pyjamacode-free-used') === 'true'; } catch(e) { return false; } })();

function persistFreeUsed() {
  try { localStorage.setItem('pyjamacode-free-used', 'true'); } catch(e) {}
}

function checkFreeUse() {
  if (typeof isAuthenticated !== 'function' || isAuthenticated()) return true;
  if (!_freeUsed) {
    _freeUsed = true;
    persistFreeUsed();
    return true;
  }
  if (typeof openAuthModal === 'function') openAuthModal('signin');
  return false;
}

function authNudgeEnabled() {
  return !(window.__APP_CONFIG__ && window.__APP_CONFIG__.disableAuthNudge === true);
}

let codeMirror = null;
let notesCodeMirror = null;
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
var _dirtySubmissions = {};
var _dirtyNotes = {};
var _dirtyQuizzes = {};

// Persisted dirty IDs — survive page refresh for modal listing
function getDirtyIds() {
  try { return JSON.parse(localStorage.getItem('pyjamacode-dirty-ids') || '[]'); } catch (e) { return []; }
}

function addDirtyId(id) {
  var ids = getDirtyIds();
  if (ids.indexOf(id) === -1) ids.push(id);
  try { localStorage.setItem('pyjamacode-dirty-ids', JSON.stringify(ids)); } catch (e) {}
}

function clearDirtyIds() {
  try { localStorage.removeItem('pyjamacode-dirty-ids'); } catch (e) {}
}

function bumpLocalVersion() {
  try {
    var cur = localStorage.getItem('pyjamacode-local-version');
    var v = (cur ? parseInt(cur, 10) : 0) + 1;
    localStorage.setItem('pyjamacode-local-version', String(v));
  } catch (e) {}
}

function setSyncedVersion() {
  try {
    var lv = localStorage.getItem('pyjamacode-local-version');
    localStorage.setItem('pyjamacode-synced-version', lv || '0');
  } catch (e) {}
}

function hasDirtyData() {
  if (Object.keys(_dirtySubmissions).length > 0 || Object.keys(_dirtyNotes).length > 0 || Object.keys(_dirtyQuizzes).length > 0) return true;
  // Check persisted version mismatch (survives page refresh)
  try {
    return localStorage.getItem('pyjamacode-local-version') !== localStorage.getItem('pyjamacode-synced-version');
  } catch (e) { return false; }
}

function updateSyncIndicator() {
  var authed = typeof isAuthenticated === 'function' && isAuthenticated();
  var dot = document.getElementById('syncDot');

  // Update dropdown button
  var btn = document.getElementById('syncBtn');
  var el = document.getElementById('syncIndicator');
  var label = document.getElementById('syncLabel');

  // Update footer indicator
  var btnF = document.getElementById('syncBtnFooter');
  var elF = document.getElementById('syncIndicatorFooter');
  var labelF = document.getElementById('syncLabelFooter');

  if (!btn || !el || !label) return;

  if (!authed) {
    btn.classList.add('d-none');
    if (btnF) btnF.classList.add('d-none');
    if (dot) dot.style.display = 'none';
    return;
  }
  btn.classList.remove('d-none');
  if (btnF) btnF.classList.remove('d-none');
  if (dot) dot.style.display = '';

  var icon = el.querySelector('i');
  var iconF = elF ? elF.querySelector('i') : null;
  if (!icon) return;

  btn.className = 'sync-dropdown-item';
  if (btnF) btnF.className = 'sync-btn-footer';
  if (dot) dot.className = 'sync-dot';

  var stateClass, stateIcon, stateLabel, stateTitle;
  if (window._isPushingLocally) {
    stateClass = 'syncing';
    stateIcon = 'bi bi-arrow-repeat';
    stateLabel = 'Sync to cloud';
    stateTitle = 'Syncing...';
  } else if (hasDirtyData()) {
    stateClass = 'dirty';
    stateIcon = 'bi bi-cloud-arrow-up';
    stateLabel = 'Sync to cloud';
    stateTitle = 'Unsaved changes — click to sync';
  } else {
    stateClass = 'synced';
    stateIcon = 'bi bi-cloud-check';
    stateLabel = 'Synced to cloud';
    stateTitle = 'In sync';
  }

  icon.className = stateIcon;
  btn.classList.add(stateClass);
  btn.title = stateTitle;
  label.textContent = stateLabel;

  if (iconF) iconF.className = stateIcon;
  if (btnF) { btnF.classList.add(stateClass); btnF.title = stateTitle; }
  if (labelF) labelF.textContent = stateLabel;
  if (dot) dot.classList.add(stateClass);
}

// Click handler for sync button — show confirmation modal with unsaved changes
document.addEventListener('click', function(e) {
  var btn = e.target.closest('#syncBtn') || e.target.closest('#syncBtnFooter');
  if (!btn || btn.classList.contains('d-none') || !hasDirtyData() || window._isPushingLocally) return;
  var listEl = document.getElementById('syncChangesList');
  var dialog = document.getElementById('syncConfirmModal');
  var confirmBtn = document.getElementById('syncConfirmYes');
  if (!listEl || !dialog || !confirmBtn) return;
  // Read persisted dirty IDs (survives page refresh, covers all tabs)
  var dirtyIds = getDirtyIds();
  var seen = {};
  var items = [];
  dirtyIds.forEach(function(id) {
    if (seen[id]) return;
    seen[id] = true;
    var q = questions.find(function(q) { return q.id === id; });
    var title = q ? q.title : id;
    items.push('<div><span class="text-in-progress">\u2714</span> ' + escapeHtml(title) + '</div>');
  });
  listEl.innerHTML = items.length ? items.join('') : '<div class="text-muted">No unsaved changes</div>';
  dialog.showModal();
});

document.addEventListener('click', function(e) {
  if (e.target.id === 'syncConfirmYes' || e.target.closest('#syncConfirmYes')) {
    // Save current problem state first so dirty flags are up to date
    if (typeof saveCurrentCode === 'function' && activeQuestionId) saveCurrentCode();
    if (typeof saveCurrentNotes === 'function' && activeQuestionId) saveCurrentNotes();
    document.dispatchEvent(new CustomEvent('cloud-sync-requested'));
  }
});

function init() {
  // Ensure clean dirty state on every page load
  _dirtySubmissions = {};
  _dirtyNotes = {};
  _dirtyQuizzes = {};
  // Show session expired message if redirected here
  if (window.location.search.indexOf('session=expired') !== -1) {
    var msg = document.createElement('div');
    msg.className = 'alert alert-warning text-center m-0 rounded-0';
    msg.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Signed out — your account was accessed from another browser.';
    document.body.prepend(msg);
    setTimeout(function() { msg.remove(); }, 6000);
  }

  if (!problemDataEl || !activeProblemInput) {
    return;
  }

  // Dashboard page — skip full platform init but keep sidebar functional
  if (window.location.pathname === '/dashboard/' || window.location.pathname === '/dashboard') {
    try { questions = JSON.parse(problemDataEl.textContent) || []; } catch (e) { questions = []; }
    loadTheme();
    initFirebase();
    initTypedTitle();
    // Load local data for tree and dashboard progress
    loadSubmissions();
    try { var qr = localStorage.getItem('pyjamacode-quiz-results'); if (qr) quizResults = JSON.parse(qr) || {}; } catch (e) {}
    setupAuth();
    initSidebarToggle();
    initEditorToggle();
    initSidebarTabs();
    renderQuestionList();
    renderDashboard();
    updateSyncIndicator();
    // Live refresh: re-render dashboard when data changes (same-browser tabs)
    window.addEventListener('storage', function() {
      loadSubmissions();
      try { var qr2 = localStorage.getItem('pyjamacode-quiz-results'); if (qr2) quizResults = JSON.parse(qr2) || {}; } catch (e) {}
      renderQuestionList();
      renderDashboard();
    });
    // Periodic Firestore poll for cross-browser/device sync
    if (typeof firebase !== 'undefined' && firebase.apps.length) {
      (function startPoll() {
        var pollTimer = setInterval(function() {
          var user = firebase.auth().currentUser;
          if (!user) return;
          var db = firebase.firestore();
          db.collection('users').doc(user.uid).collection('codes').get().then(function(snap) {
            var changed = false;
            snap.forEach(function(doc) {
              var data = doc.data();
              if (!submissions[doc.id]) submissions[doc.id] = {};
              if (data.code !== undefined && submissions[doc.id].code !== data.code) { submissions[doc.id].code = data.code; changed = true; }
              if (data.status && submissions[doc.id].status !== data.status) { submissions[doc.id].status = data.status; changed = true; }
            });
            if (changed) { persistSubmissions(); renderQuestionList(); renderDashboard(); }
          });
          db.collection('users').doc(user.uid).collection('quizzes').get().then(function(snap) {
            var changed = false;
            snap.forEach(function(doc) {
              var data = doc.data();
              if (data.results && JSON.stringify(quizResults[doc.id]) !== JSON.stringify(data.results)) {
                quizResults[doc.id] = data.results;
                changed = true;
              }
            });
            if (changed) {
              try { localStorage.setItem('pyjamacode-quiz-results', JSON.stringify(quizResults)); } catch (e) {}
              renderQuestionList(); renderDashboard();
            }
          });
        }, 30000);
      })();
    }
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

  // Detect course landing page — select the intro question and expand tree
  const courseMatch = window.location.pathname.match(/^\/courses\/([^\/]+)\/?$/);
  if (courseMatch) {
    const introQ = questions.find((q) => q.isIntro && q.topic === courseMatch[1]);
    if (introQ) {
      activeQuestionId = introQ.id;
      treeExpanded[courseMatch[1]] = true;
    }
    // Wire the next button to go to the first lesson
    const nextBtn = document.getElementById('nextProblemBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        const firstLesson = questions.find((q) => !q.isIntro && q.topic === courseMatch[1]);
        if (firstLesson) window.location.href = firstLesson.permalink;
      });
    }
  }

  loadTheme();
  loadSubmissions();
  loadNotes();
  loadBookmarks();
  try { const qr = localStorage.getItem('pyjamacode-quiz-results'); if (qr) quizResults = JSON.parse(qr) || {}; } catch (e) {}
  initCodeMirror();
  initNotesCodeMirror();
  renderQuestionList();
  // Skip selectQuestion for intro questions (landing page content is already rendered)
  const _q = questions.find((q) => q.id === activeQuestionId);
  if (questionContentEl && (!_q || !_q.isIntro)) selectQuestion(activeQuestionId);
  setNotesPreviewMode(true);
  initTypedTitle();
  notesSavedHeight = notesArea ? notesArea.offsetHeight : 200;
  // Start with notes minimized
  setTimeout(() => minimizeNotes(), 50);

  // Double-click notes header to toggle minimize/restore
  const notesHeader = notesArea ? notesArea.querySelector('.notes-header') : null;
  if (notesHeader) {
    notesHeader.addEventListener('dblclick', () => {
      if (notesViewState === 'minimized') restoreNotes();
      else minimizeNotes();
    });
  }

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
  initEditorToggle();
  initSidebarTabs();
  initBookmarkBtn();
  initProblemNav();
  if (clearConsoleBtn) clearConsoleBtn.addEventListener('click', () => { consoleOutputEl.textContent = ''; if (terminalInput) terminalInput.value = ''; });
  if (terminalInput) {
    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (!checkFreeUse()) {
          terminalInput.value = '';
          terminalInput.placeholder = 'Sign in to use the terminal';
          terminalInput.disabled = true;
          setTimeout(() => { terminalInput.disabled = false; terminalInput.placeholder = 'type a command...'; }, 3000);
          return;
        }
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
    if (!authNudgeEnabled()) return;
    localStorage.setItem('authForced', 'true');
    const nudgeDelay = (window.__APP_CONFIG__ && window.__APP_CONFIG__.nudgeDelay) || 10000;
    clearTimeout(window._authNudgeTimer);
    window._authNudgeTimer = setTimeout(() => {
      if (!isAuthenticated() && questionContentEl) {
        if (authCloseLink) authCloseLink.style.display = 'none';
        if (authModal) authModal._backdropClose = true;
        if (typeof openAuthModal === 'function') openAuthModal('signin');
      }
    }, nudgeDelay);
  };

  // Resume button in dropdown — navigate to last saved problem + tab
  function setupResumeLink(link) {
    if (!link) return;
    var saved = localStorage.getItem('lastProblemUrl');
    if (saved && saved.includes('/courses/')) {
      link.textContent = 'Resume';
      link.onclick = function(e) {
        e.preventDefault();
        var tab = localStorage.getItem('lastProblemTab');
        var url = saved;
        if (tab && tab !== 'challenge') url += (url.indexOf('?') === -1 ? '?' : '&') + 'tab=' + tab;
        window.location.href = url;
      };
    } else {
      link.textContent = 'Start Learning';
      link.onclick = function(e) {
        e.preventDefault();
        // Navigate to the first course landing page
        if (questions.length) {
          var topics = {};
          questions.forEach(function(q) {
            if (!q.isIntro && q.topic && !topics[q.topic]) topics[q.topic] = q.topic_weight || 99;
          });
          var sorted = Object.keys(topics).sort(function(a, b) { return (topics[a] || 99) - (topics[b] || 99); });
          if (sorted.length) window.location.href = '/courses/' + sorted[0] + '/';
          else window.location.href = '/dashboard/';
        } else {
          window.location.href = '/dashboard/';
        }
      };
    }
  }
  if (typeof resumeLink !== 'undefined') setupResumeLink(resumeLink);
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
  updateSyncIndicator();
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
      // Debounced auto-save to localStorage (not cloud)
      if (window._codeSaveTimer) clearTimeout(window._codeSaveTimer);
      window._codeSaveTimer = setTimeout(function() {
        if (activeQuestionId) saveCurrentCode();
      }, 1500);
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
      if (!checkFreeUse()) {
        notesCodeMirror.setValue(notes[activeQuestionId] || '');
        return;
      }
      showNotesUnsavedDot();
      if (notesPreviewMode) {
        renderNotesPreview();
      }
      // Debounced auto-save to localStorage (not cloud)
      if (window._notesSaveTimer) clearTimeout(window._notesSaveTimer);
      window._notesSaveTimer = setTimeout(function() {
        if (activeQuestionId) saveCurrentNotes();
      }, 1500);
    }
  });

  notesCodeMirror.on('blur', function() {
    if (activeQuestionId && getNotesEditorValue() !== notes[activeQuestionId]) {
      saveCurrentNotes();
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
      <div class="question-title">${(function(){var s=getLessonState(q.id);return q.isIntro?'':'<i class="bi '+(s==='completed'?'bi-check-circle-fill text-pass':s==='in-progress'?'bi-circle-half text-in-progress':'bi-circle text-muted')+' me-1"></i>'})()}${escapeHtml(q.title)}</div>
      <div class="question-meta">${q.isIntro ? 'Course Overview' : (q.difficulty + ' · ' + (submissions[q.id]?.status || 'Unattempted'))}</div>
    </div>
  `).join('');
  el.querySelectorAll('.tree-leaf').forEach((item) => {
    item.addEventListener('click', () => {
      if (!checkFreeUse()) return;
      selectQuestion(item.dataset.id);
    });
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
  var val = getNotesEditorValue();
  if ((notes[activeQuestionId] || '') === (val || '')) {
    hideNotesUnsavedDot();
    return;
  }
  notes[activeQuestionId] = val;
  hideNotesUnsavedDot();
  _dirtyNotes[activeQuestionId] = true;
  addDirtyId(activeQuestionId);
  bumpLocalVersion();
  updateSyncIndicator();
  persistNotes();
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
    if (q.isIntro) return;
    const topic = q.topic || '';
    const subtopic = q.subtopic || '';
    if (!tree[topic]) tree[topic] = {};
    if (!tree[topic][subtopic]) tree[topic][subtopic] = [];
    tree[topic][subtopic].push(q);
  });
  return tree;
}

// Cache for quiz question counts per lesson
var _quizCountCache = {};

function getLessonState(id) {
  var q = questions.find(function(q) { return q.id === id; });
  if (!q) return 'unattempted';
  var codeStatus = submissions[id]?.status || '';
  var codeAccepted = codeStatus === 'Accepted';
  var codeInProgress = codeStatus && codeStatus !== 'Unattempted';
  var correctCount = quizResults[id] ? Object.keys(quizResults[id]).length : 0;
  var totalQuiz = 0;
  if (q.quiz && q.quiz.trim()) {
    if (_quizCountCache[id] === undefined) {
      // Parse quiz to count real questions (trimmed blocks that look like questions)
      var blocks = q.quiz.split(/\n##\s*/).filter(function(b) { return b.trim().length > 0; });
      // Exclude the lead-in block (just whitespace before first ##)
      _quizCountCache[id] = blocks.length;
    }
    totalQuiz = _quizCountCache[id];
  }
  // All correct
  if (codeAccepted && (totalQuiz === 0 || correctCount >= totalQuiz)) return 'completed';
  // Code accepted but quiz not fully correct
  if (codeAccepted && totalQuiz > 0 && correctCount < totalQuiz) return 'in-progress';
  // Any quiz progress
  if (correctCount > 0) return 'in-progress';
  // Code in progress (no quiz progress)
  if (codeInProgress) return 'in-progress';
  return 'unattempted';
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

function renderDashboard() {
  var contentEl = document.getElementById('dashboardContent');
  if (!contentEl || !questions.length) return;

  // Load local data for progress computation
  var subs = {};
  try { subs = JSON.parse(localStorage.getItem('pyjamacode-submissions') || '{}'); } catch (e) {}
  var quizRes = {};
  try { quizRes = JSON.parse(localStorage.getItem('pyjamacode-quiz-results') || '{}'); } catch (e) {}

  function localLessonState(id) {
    var q = questions.find(function(q) { return q.id === id; });
    if (!q) return 'unattempted';
    var codeStatus = subs[id]?.status || '';
    var codeAccepted = codeStatus === 'Accepted';
    var codeInProgress = codeStatus && codeStatus !== 'Unattempted';
    var correctCount = quizRes[id] ? Object.keys(quizRes[id]).length : 0;
    var totalQuiz = 0;
    if (q.quiz && q.quiz.trim()) {
      var blocks = q.quiz.split(/\n##\s*/).filter(function(b) { return b.trim().length > 0; });
      totalQuiz = blocks.length;
    }
    if (codeAccepted && (totalQuiz === 0 || correctCount >= totalQuiz)) return 'completed';
    if (codeAccepted && totalQuiz > 0 && correctCount < totalQuiz) return 'in-progress';
    if (correctCount > 0) return 'in-progress';
    if (codeInProgress) return 'in-progress';
    return 'unattempted';
  }

  var topics = {};
  questions.forEach(function(q) {
    if (q.isIntro || !q.topic) return;
    if (!topics[q.topic]) topics[q.topic] = { lessons: [], topicWeight: q.topic_weight || 99 };
    topics[q.topic].lessons.push(q);
  });

  var sortedTopics = Object.keys(topics).sort(function(a, b) {
    return (topics[a].topicWeight || 99) - (topics[b].topicWeight || 99);
  });

  function firstLesson(lessonList) {
    lessonList.sort(function(a, b) { return (a.weight || 99) - (b.weight || 99); });
    return lessonList[0];
  }

  function resumeLesson(lessonList) {
    lessonList.sort(function(a, b) { return (a.weight || 99) - (b.weight || 99); });
    for (var i = 0; i < lessonList.length; i++) {
      var s = subs[lessonList[i].id];
      if (!s || !s.status || s.status === 'Unattempted') return lessonList[i];
    }
    return null;
  }

  // Load course metadata (description, og_image from _index.md)
  var courseMeta = {};
  try { courseMeta = JSON.parse(document.getElementById('course-meta').textContent || '{}'); } catch (e) {}

  var html = '<div class="dashboard-courses">';
  sortedTopics.forEach(function(topic) {
    var info = topics[topic];
    var lessonList = info.lessons;
    lessonList.sort(function(a, b) { return (a.weight || 99) - (b.weight || 99); });
    var topicTitle = topic;
    if (lessonList[0] && lessonList[0].topic_title) topicTitle = lessonList[0].topic_title;

    var meta = courseMeta[topic] || {};
    var topicDesc = meta.description || '';
    var topicImage = meta.og_image || '';

    var total = lessonList.length;
    var completed = 0;
    var inProgress = 0;
    lessonList.forEach(function(q) {
      var st = localLessonState(q.id);
      if (st === 'completed') completed++;
      else if (st === 'in-progress') inProgress++;
    });
    var pct = total ? Math.round((completed / total) * 100) : 0;

    var resumeUrl = '/courses/' + topic + '/';
    if (pct > 0 && pct < 100) {
      var resume = resumeLesson(lessonList);
      if (resume) resumeUrl = resume.permalink;
    }

    html += '<div class="course-card">' +
      (topicImage ? '<img src="' + escapeHtml(topicImage) + '" alt="" class="course-card-img" loading="lazy" onerror="this.style.display=\'none\'">' : '') +
      '<div class="course-card-body">' +
        '<h4 class="course-card-title">' + escapeHtml(topicTitle) + '</h4>' +
        (topicDesc ? '<p class="course-card-desc">' + escapeHtml(topicDesc) + '</p>' : '') +
        '<div class="progress mb-2" style="height:6px">' +
          '<div class="progress-bar" role="progressbar" style="width:' + pct + '%"></div>' +
        '</div>' +
        '<div class="course-card-footer">' +
          '<span class="course-card-stat">' + completed + '/' + total + (pct === 100 ? ' <span class="text-pass fw-semibold">Complete</span>' : inProgress > 0 ? ' <span class="text-in-progress">' + inProgress + ' active</span>' : '') + '</span>';
    if (resumeUrl) {
      var btnLabel = pct >= 100 ? 'Start Again' : (pct > 0 ? 'Resume' : 'Start');
      html += '<a href="' + resumeUrl + '" class="btn btn-sm btn-outline-primary">' + btnLabel + '</a>';
    }
    html += '</div></div></div>';
  });
  html += '</div>';

  var existing = contentEl.querySelector('.dashboard-courses');
  if (existing) existing.remove();
  var p = contentEl.querySelector('p');
  if (p) p.insertAdjacentHTML('afterend', html);
  else contentEl.insertAdjacentHTML('beforeend', html);
}

function getWeight(q, key, fallback) {
  const v = q[key];
  return (v !== undefined && v !== null) ? v : fallback;
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
    // Use course title from _index.md if available, fall back to directory name
    var topicTitle = topic;
    var tq = questions.find(function(q) { return q.topic === topic && q.topic_title; });
    if (tq) topicTitle = tq.topic_title;

    let hasVisibleChildren = false;
    // Check if there are intro questions for this topic
    const topicIntroQs = questions.filter((q) => q.isIntro && q.topic === topic);
    if (topicIntroQs.length > 0) hasVisibleChildren = true;
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
      <span class="tree-label">${escapeHtml(topicTitle)}</span>
    `;
    topicDiv.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTopic(topic);
    });
    questionListEl.appendChild(topicDiv);

    // Introduction leaf nodes (right under the course, above all subtopics)
    if (treeExpanded[topic] || filter.length > 0) {
      const introQs = questions.filter((q) => q.isIntro && q.topic === topic);
      introQs.sort((a, b) => (getWeight(a, 'weight', 99) - getWeight(b, 'weight', 99)));
      introQs.forEach((q) => {
        if (filter.length > 0 && !q.title.toLowerCase().includes(filterLower)) return;
        const item = document.createElement('div');
        item.className = 'tree-leaf';
        item.dataset.id = q.id;
        item.dataset.topicIndex = topicIndex;
        if (q.id === activeQuestionId) item.classList.add('active');
        item.innerHTML = `
          <div class="question-title">${escapeHtml(q.title)}</div>
          <div class="question-meta">Course Overview</div>
        `;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!checkFreeUse()) return;
          window.location.href = q.permalink || ('/courses/' + q.topic + '/');
        });
        questionListEl.appendChild(item);
      });
    }

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
        if (q.isIntro) return;
        if (filter.length > 0 && !q.title.toLowerCase().includes(filterLower)) return;

        const item = document.createElement('div');
        item.className = 'tree-leaf';
        item.dataset.id = q.id;
        item.dataset.topicIndex = topicIndex;
        if (q.id === activeQuestionId) item.classList.add('active');
        if (submissions[q.id]?.status === 'Accepted') item.classList.add('solved');

        var lessonState = getLessonState(q.id);
        var iconClass = lessonState === 'completed' ? 'bi-check-circle-fill text-pass' : (lessonState === 'in-progress' ? 'bi-circle-half text-in-progress' : 'bi-circle text-muted');
        item.innerHTML = `
          <div class="question-title"><i class="bi ${iconClass} me-1"></i>${escapeHtml(q.title)}</div>
          <div class="question-meta">${q.difficulty} · ${submissions[q.id]?.status || 'Unattempted'}</div>
        `;

        item.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!checkFreeUse()) return;
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
  const question = questions.find((q) => q.id === id);
  if (!question) return;

  // Course intro question — navigate to the course landing page
  if (question.isIntro) {
    window.location.href = question.permalink || ('/courses/' + question.topic + '/');
    return;
  }

  // If the full platform isn't loaded (no editor), redirect to the lesson URL
  if (!document.getElementById('editorArea') || !document.getElementById('consoleArea')) {
    window.location.href = question.permalink;
    return;
  }

  activeQuestionId = id;

  // Restore full platform elements (hidden by intro or landing page)
  if (editorArea) editorArea.classList.remove('d-none');
  if (consoleArea) consoleArea.classList.remove('d-none');
  if (notesArea) notesArea.classList.remove('d-none');
  if (fileTabs) fileTabs.classList.remove('d-none');
  const ct = document.getElementById('centerTabs');
  if (ct) ct.classList.remove('d-none');

  // On landing page (no question content element), just expand tree and update URL
  if (!questionContentEl) {
    window.location.href = question.permalink;
    return;
  }

  // Auth nudge for unauthenticated users
  if (!isAuthenticated()) {
    const freeViews = (window.__APP_CONFIG__ && window.__APP_CONFIG__.freeViews) || 3;
    const nudgeDelay = (window.__APP_CONFIG__ && window.__APP_CONFIG__.nudgeDelay) || 10000;

    // Check if user is already in forced state (persisted across refreshes)
    const isForced = authNudgeEnabled() && localStorage.getItem('authForced') === 'true';

      if (isForced) {
        requestAnimationFrame(() => {
          if (authCloseLink) authCloseLink.style.display = 'none';
          if (authModal) authModal._backdropClose = true;
          if (typeof openAuthModal === 'function') openAuthModal('signin');
        });
      }

      // Free views counter (in-memory only, resets on page refresh)
      if (!_authNudged) {
        _viewCount++;
        if (_viewCount > freeViews) {
          _authNudged = true;
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
  // Restore last tab for this problem, or default to Lecture if available
  var savedTab = getSavedTab(id);
  if (savedTab && (savedTab === 'explanation' ? hasArticle : savedTab === 'quiz' ? hasQuiz : true)) {
    setActiveTab(savedTab);
  } else {
    setActiveTab(hasArticle ? 'explanation' : 'challenge');
  }

  questionContentEl.innerHTML = question.content;
  applyAuthGates(questionContentEl);
  enhanceCodeBlocks(questionContentEl);
  initImageZoom(questionContentEl);
  embedYouTubeLinks(questionContentEl);
  initVimeoPlayers(questionContentEl);
  if (articleContentEl) {
    articleContentEl.innerHTML = hasArticle ? question.article : '';
    applyAuthGates(articleContentEl);
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

  // Restore saved console output or show default
  consoleOutputEl.innerHTML = submissions[id] && submissions[id].output ? submissions[id].output : 'When ready, hit Check to compile and run the code.';
  updateStatus(submissions[id] && submissions[id].status ? submissions[id].status : 'Unattempted');

  // Expand the tree to show the active problem
  if (question.topic) {
    treeExpanded[question.topic] = true;
    if (question.subtopic) {
      treeExpanded[question.topic + '/' + question.subtopic] = true;
    }
  }
  renderQuestionList(questionSearchEl ? questionSearchEl.value : '');
  try {
    let url = question.permalink;
    url += window.location.hash;
    history.replaceState(null, '', url);
    maybeSaveProblemUrl(url);
  } catch (e) {
    // History API may be restricted on file:// origins.
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
  _dirtySubmissions[activeQuestionId] = true;
  addDirtyId(activeQuestionId);
  if (notes[activeQuestionId] && notes[activeQuestionId].trim()) { _dirtyNotes[activeQuestionId] = true; addDirtyId(activeQuestionId); }
  bumpLocalVersion();
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
  _dirtySubmissions[activeQuestionId] = true;
  addDirtyId(activeQuestionId);
  if (notes[activeQuestionId] && notes[activeQuestionId].trim()) { _dirtyNotes[activeQuestionId] = true; addDirtyId(activeQuestionId); }
  bumpLocalVersion();
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
    if (submissions[activeQuestionId].files[file.filename] === code) { hideFileUnsavedDot(); return; }
    submissions[activeQuestionId].files[file.filename] = code;
  } else {
    if (!submissions[activeQuestionId]) {
      submissions[activeQuestionId] = { status: 'In Progress', output: '', code: '' };
    }
    if (submissions[activeQuestionId].code === code) { hideFileUnsavedDot(); return; }
    submissions[activeQuestionId].code = code;
  }
  if (!submissions[activeQuestionId].status || submissions[activeQuestionId].status === 'Unattempted') {
    submissions[activeQuestionId].status = 'In Progress';
    updateStatus('In Progress');
    updateTreeItemStatus(activeQuestionId, 'In Progress');
  }
  hideFileUnsavedDot();
  _dirtySubmissions[activeQuestionId] = true;
  addDirtyId(activeQuestionId);
  bumpLocalVersion();
  updateSyncIndicator();
  persistSubmissions();
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
  if (!checkFreeUse()) {
    consoleOutputEl.textContent = 'Sign in to continue checking solutions.';
    return;
  }
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
    if (!submissions[activeQuestionId]) submissions[activeQuestionId] = {};
    submissions[activeQuestionId].status = status;
    submissions[activeQuestionId].output = outputHtml;
    _dirtySubmissions[activeQuestionId] = true;
    addDirtyId(activeQuestionId);
    updateSyncIndicator();
    persistSubmissions();
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

function getSystemTheme() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

function loadTheme() {
  let savedTheme = 'dark';
  try {
    savedTheme = localStorage.getItem('pyjamacode-theme');
  } catch (e) {}
  if (!savedTheme && (typeof isAuthenticated !== 'function' || !isAuthenticated())) {
    savedTheme = getSystemTheme();
  } else if (!savedTheme) {
    savedTheme = 'dark';
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
    _dirtyQuizzes[quizId] = true;
    addDirtyId(quizId);
    bumpLocalVersion();
    updateSyncIndicator();
  }

  quizContentEl.querySelectorAll('.quiz-option input[type="radio"]').forEach((input) => {
    input.addEventListener('change', (e) => {
      if (!checkFreeUse()) {
        e.target.checked = false;
        return;
      }
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
        renderQuestionList(questionSearchEl ? questionSearchEl.value : '');
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
      // Refresh tree to reflect updated lesson status
      renderQuestionList(questionSearchEl ? questionSearchEl.value : '');
    });
  }
}

// Per-problem tab persistence
function saveActiveTab(pid, tab) {
  if (!pid) return;
  var tabs = {};
  try { tabs = JSON.parse(localStorage.getItem('pyjamacode-tabs') || '{}'); } catch (e) { tabs = {}; }
  if (tabs[pid] === tab) return;
  tabs[pid] = tab;
  localStorage.setItem('pyjamacode-tabs', JSON.stringify(tabs));
}

function getSavedTab(pid) {
  if (!pid) return null;
  try {
    var tabs = JSON.parse(localStorage.getItem('pyjamacode-tabs') || '{}');
    return tabs[pid] || null;
  } catch (e) { return null; }
}

function buildTabsMap() {
  var tabs = {};
  try { tabs = JSON.parse(localStorage.getItem('pyjamacode-tabs') || '{}'); } catch (e) { tabs = {}; }
  return tabs;
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

  // Save per-problem tab state
  saveActiveTab(activeQuestionId, tab);

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
  if (window.location.pathname === '/' || window.location.pathname === '') {
    typedEl.textContent = '';
    new Typed('#typedTitle', {
      strings: [title],
      typeSpeed: 60,
      loop: false,
      showCursor: true,
      cursorChar: '_',
    });
  } else {
    typedEl.textContent = title;
    typedEl.innerHTML = title + '<span class="typed-cursor typed-cursor--blink" aria-hidden="true">_</span>';
  }
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

function applyAuthGates(container) {
  if (!container) return false;
  const html = container.innerHTML;
  const openTag = '<!--auth-->';
  const closeTag = '<!--/auth-->';
  if (html.indexOf(openTag) === -1) return false;

  container.innerHTML = '';
  let remaining = html;
  let lastEnd = 0;
  const authed = isAuthenticated();

  const addFragment = (text) => {
    if (!text) return;
    const div = document.createElement('div');
    div.innerHTML = text;
    while (div.firstChild) container.appendChild(div.firstChild);
  };

  while (true) {
    const start = remaining.indexOf(openTag, lastEnd);
    if (start === -1) break;
    const end = remaining.indexOf(closeTag, start + openTag.length);
    if (end === -1) break;

    // Content before this gate pair — always visible
    addFragment(remaining.slice(lastEnd, start));

    // Gated content
    const gatedContent = remaining.slice(start + openTag.length, end);

    const gatedDiv = document.createElement('div');
    gatedDiv.style.position = 'relative';

    const blurInner = document.createElement('div');
    blurInner.className = 'auth-gated';
    blurInner.innerHTML = gatedContent;
    gatedDiv.appendChild(blurInner);

    const overlay = document.createElement('div');
    overlay.className = 'gated-overlay';
    overlay.innerHTML = '<p>Sign in to access the content, save progress and execute code.</p><button class="btn btn-sm btn-primary" onclick="if(typeof openAuthModal===\'function\')openAuthModal(\'signin\')">Sign in</button>';
    gatedDiv.appendChild(overlay);

    container.appendChild(gatedDiv);

    blurInner.classList.toggle('content-blurred-force', !authed);
    overlay.classList.toggle('show', !authed);

    lastEnd = end + closeTag.length;
  }

  // Content after the last gate pair
  addFragment(remaining.slice(lastEnd));

  // Guard: if someone deletes the overlay from devtools, also delete the gated content
  if (!window._gateGuard) {
    var _gating = false;
    window._gateGuard = new MutationObserver(function() {
      if (_gating) return;
      _gating = true;
      document.querySelectorAll('.gated-overlay').forEach(function(overlay) {
        if (!document.body.contains(overlay)) {
          var parent = overlay.closest('[style*="position: relative"]');
          if (parent) {
            var blurInner = parent.querySelector('.auth-gated');
            if (blurInner) blurInner.remove();
            parent.remove();
          }
        }
      });
      _gating = false;
    });
    window._gateGuard.observe(document.body, { childList: true, subtree: true });
  }

  return true;
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

  function getAvailableTabs() {
    const tabs = ['explanation', 'quiz', 'challenge'];
    return tabs.filter((t) => {
      if (t === 'explanation') return hasArticleForId(activeQuestionId);
      if (t === 'quiz') return hasQuizForId(activeQuestionId);
      return true;
    });
  }

  function hasArticleForId(id) {
    const q = questions.find((x) => x.id === id);
    return q && q.article && q.article.trim().length > 0;
  }

  function hasQuizForId(id) {
    const q = questions.find((x) => x.id === id);
    if (!q || !q.quiz) return false;
    let raw = q.quiz;
    if ((!raw || !raw.trim()) && q.quiz2) {
      const m = q.quiz2.match(/===QUIZ===\n([\s\S]*)$/);
      if (m) raw = m[1].trim();
    }
    return raw && raw.trim().length > 0;
  }

  const navigate = (dir) => {
    const flat = getFlatTree();
    const idx = flat.findIndex((q) => q.id === activeQuestionId);
    if (idx < 0) return;

    // Get current tab index
    const currentTab = getActiveTabName();
    const available = getAvailableTabs();
    const currentTabIdx = available.indexOf(currentTab);

    if (currentTabIdx === -1) {
      // Fallback: navigate to next/prev problem
      const target = idx + dir;
      if (target < 0 || target >= flat.length) return;
      selectQuestion(flat[target].id);
      return;
    }

    const nextTabIdx = currentTabIdx + dir;

    if (nextTabIdx >= 0 && nextTabIdx < available.length) {
      // Same chapter, different tab
      setActiveTab(available[nextTabIdx]);
    } else {
      // Move to next/prev chapter
      const target = idx + dir;
      if (target < 0 || target >= flat.length) return;
      selectQuestion(flat[target].id);
    }
  };

  function getActiveTabName() {
    if (articleContentEl && !articleContentEl.classList.contains('d-none')) return 'explanation';
    if (quizContentEl && !quizContentEl.classList.contains('d-none')) return 'quiz';
    return 'challenge';
  }

  prevBtn.addEventListener('click', () => navigate(-1));
  nextBtn.addEventListener('click', () => navigate(1));
}

function initSidebarToggle() {
  const hideBtn = document.getElementById('sidebarHideBtn');
  const showBtn = document.getElementById('sidebarShowBtn');
  const closeBtn = document.getElementById('sidebarCloseBtn');
  const sidebar = document.getElementById('sidebarPane');
  const body = document.body;
  if (!hideBtn || !showBtn || !sidebar) return;

  // Create backdrop for mobile overlay
  let backdrop = document.querySelector('.sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

  function isMobile() {
    const bp = (window.__APP_CONFIG__ && window.__APP_CONFIG__.mobileBreakpoint) || 800;
    return window.innerWidth <= bp;
  }

  function updateUI(collapsed) {
    if (isMobile()) {
      sidebar.classList.toggle('sidebar-open', !collapsed);
      backdrop.classList.toggle('show', !collapsed);
      showBtn.classList.toggle('d-none', !collapsed);
      hideBtn.classList.add('d-none');
      if (closeBtn) closeBtn.classList.toggle('d-none', collapsed);
    } else {
      body.classList.toggle('sidebar-collapsed', collapsed);
      hideBtn.classList.toggle('d-none', collapsed);
      showBtn.classList.toggle('d-none', !collapsed);
      sidebar.style.width = '';
      sidebar.classList.remove('sidebar-open');
      backdrop.classList.remove('show');
      if (closeBtn) closeBtn.classList.add('d-none');
    }
    hideBtn.setAttribute('title', collapsed ? 'Show sidebar' : 'Collapse sidebar');
    showBtn.setAttribute('title', collapsed ? 'Show sidebar' : 'Collapse sidebar');
  }

  // Restore saved state (only for desktop collapse)
  if (!isMobile() && localStorage.getItem('sidebarCollapsed') === 'true') {
    updateUI(true);
  }

  function toggle() {
    const isCollapsed = isMobile()
      ? !sidebar.classList.contains('sidebar-open')
      : body.classList.contains('sidebar-collapsed');
    updateUI(!isCollapsed);
    if (!isMobile()) localStorage.setItem('sidebarCollapsed', !isCollapsed);
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
  if (closeBtn) closeBtn.addEventListener('click', toggle);
  backdrop.addEventListener('click', () => {
    if (isMobile()) {
      sidebar.classList.remove('sidebar-open');
      backdrop.classList.remove('show');
      showBtn.classList.remove('d-none');
    }
  });

  // Listen for resize to switch between mobile/desktop modes
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (isMobile()) {
        sidebar.classList.remove('sidebar-open');
        backdrop.classList.remove('show');
        hideBtn.classList.add('d-none');
        showBtn.classList.remove('d-none');
      } else {
        sidebar.classList.remove('sidebar-open');
        backdrop.classList.remove('show');
        const wasCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (wasCollapsed) {
          body.classList.add('sidebar-collapsed');
          hideBtn.classList.add('d-none');
          showBtn.classList.remove('d-none');
        } else {
          body.classList.remove('sidebar-collapsed');
          hideBtn.classList.remove('d-none');
          showBtn.classList.add('d-none');
        }
      }
      if (closeBtn) closeBtn.classList.toggle('d-none', !isMobile());
    }, 200);
  });

  // Initial state on page load
  if (isMobile()) {
    sidebar.classList.remove('sidebar-open');
    backdrop.classList.remove('show');
    hideBtn.classList.add('d-none');
    showBtn.classList.remove('d-none');
    if (closeBtn) closeBtn.classList.remove('d-none');
  }
}

function initEditorToggle() {
  const showBtn = document.getElementById('editorShowBtn');
  const closeBtn = document.getElementById('editorCloseBtn');
  const editor = document.getElementById('editorPane');
  if (!showBtn || !closeBtn || !editor) return;

  let backdrop = document.querySelector('.editor-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'editor-backdrop';
    document.body.appendChild(backdrop);
  }

  function isMobile() {
    const bp = (window.__APP_CONFIG__ && window.__APP_CONFIG__.mobileBreakpoint) || 800;
    return window.innerWidth <= bp;
  }

  function setDesktopCollapsed(collapsed) {
    editor.classList.toggle('editor-collapsed', collapsed);
    showBtn.classList.toggle('d-none', !collapsed);
    closeBtn.classList.toggle('d-none', collapsed);
  }

  function setMobileOpen(open) {
    editor.classList.toggle('editor-open', open);
    backdrop.classList.toggle('show', open);
    showBtn.classList.toggle('d-none', open);
    closeBtn.classList.toggle('d-none', !open);
  }

  showBtn.addEventListener('click', function() {
    if (isMobile()) setMobileOpen(true);
    else setDesktopCollapsed(false);
  });

  closeBtn.addEventListener('click', function() {
    if (isMobile()) setMobileOpen(false);
    else setDesktopCollapsed(true);
  });

  backdrop.addEventListener('click', function() {
    if (isMobile()) setMobileOpen(false);
  });

  // Update on resize
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      var mobile = isMobile();
      if (mobile) {
        showBtn.classList.remove('d-none');
        closeBtn.classList.add('d-none');
        editor.classList.remove('editor-open', 'editor-collapsed');
        backdrop.classList.remove('show');
      } else {
        editor.classList.remove('editor-open');
        backdrop.classList.remove('show');
        closeBtn.classList.remove('d-none');
        showBtn.classList.add('d-none');
      }
    }, 200);
  });

  // Initial state
  if (isMobile()) {
    showBtn.classList.remove('d-none');
    closeBtn.classList.add('d-none');
  } else {
    closeBtn.classList.remove('d-none');
    showBtn.classList.add('d-none');
  }
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
let authModal, authModalTitle, authEmail, authPassword, authActionBtn;
let authError, authToggleLink, authToggleText, authGoogleBtn;
const authCloseLink = null;
const authShowBtn = document.getElementById('authShowBtn');
const authLoginBtn = document.getElementById('authLoginBtn');
const authUserMenu = document.getElementById('authUserMenu');
const authAvatar = document.getElementById('authAvatar');
const authUserName = document.getElementById('authUserName');
const authUserEmail = document.getElementById('authUserEmail');
const authLogoutLink = document.getElementById('authLogoutLink');
const themeToggleDropdown = document.getElementById('themeToggleDropdown');
const resetProfileLink = document.getElementById('resetProfileLink');

function injectAuthModal() {
  if (authModal && document.body.contains(authModal)) return;
  authModal = null;
  // Watch for removal and re-inject immediately
  if (!window._authModalObserver) {
    window._authModalObserver = new MutationObserver(() => {
      const el = document.getElementById('authModal');
      if (!el && typeof openAuthModal === 'function') {
        // Re-inject and re-show if the user was mid-auth
        injectAuthModal();
        if (authModal && authModal.classList.contains('show')) {
          authModal.classList.add('show');
        }
      }
    });
    window._authModalObserver.observe(document.body, { childList: true });
  }
  const backdrop = document.createElement('div');
  backdrop.id = 'authModal';
  backdrop.className = 'auth-modal-backdrop';
  backdrop.innerHTML = `
    <div class="auth-modal">
      <h3 id="authModalTitle">Sign In</h3>
      <div id="authError" class="auth-error"></div>
      <button id="authGoogleBtn" class="btn btn-outline-secondary w-100" style="margin-bottom:0.75rem">
        <i class="bi bi-google"></i> Sign in with Google
      </button>
      <hr style="margin:0.5rem 0;color:var(--border-color)">
      <input id="authEmail" type="email" class="form-control" placeholder="Email">
      <input id="authPassword" type="password" class="form-control" placeholder="Password">
      <button id="authActionBtn" class="btn btn-primary w-100">Sign In</button>
      <div class="auth-toggle" style="margin-top:0.5rem">
        <span id="authToggleText">Don't have an account? </span>
        <a id="authToggleLink">Sign Up</a>
      </div>
    </div>`;
  document.body.appendChild(backdrop);
  authModal = document.getElementById('authModal');
  authModalTitle = document.getElementById('authModalTitle');
  authEmail = document.getElementById('authEmail');
  authPassword = document.getElementById('authPassword');
  authActionBtn = document.getElementById('authActionBtn');
  authError = document.getElementById('authError');
  authToggleLink = document.getElementById('authToggleLink');
  authToggleText = document.getElementById('authToggleText');
  authGoogleBtn = document.getElementById('authGoogleBtn');

  // Attach listeners
  if (authGoogleBtn) authGoogleBtn.addEventListener('click', () => {
    signInWithGoogle().then(() => { window.location.reload(); }).catch((err) => {
      showAuthError(err.message || 'Google sign-in failed.');
    });
  });
  if (authActionBtn) authActionBtn.addEventListener('click', handleAuthAction);
  if (authPassword) authPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAuthAction(); });
  if (authToggleLink) authToggleLink.addEventListener('click', toggleAuthMode);
  if (authModal) authModal.addEventListener('click', (e) => { if (e.target === authModal && authModal._backdropClose) closeAuthModal(); });
}
function toggleAuthMode() {
  injectAuthModal();
  openAuthModal(authMode === 'signin' ? 'signup' : 'signin');
}
/* ─── Resume (track last problem URL) ─── */
function maybeSaveProblemUrl(url) {
  if (url && url.includes('/courses/')) {
    localStorage.setItem('lastProblemUrl', url);
    if (activeQuestionId) localStorage.setItem('lastProblemTab', getSavedTab(activeQuestionId) || '');
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

function getCurrentQuestion() {
  return questions.find((q) => q.id === activeQuestionId);
}

function updateAuthGates() {
  const authed = isAuthenticated();
  document.querySelectorAll('.gated-overlay').forEach((overlay) => {
    const gatedDiv = overlay.closest('[style*="position: relative"]');
    const blurInner = gatedDiv ? gatedDiv.querySelector('.auth-gated') : null;
    if (!gatedDiv || !blurInner) return;
    blurInner.classList.toggle('content-blurred-force', !authed);
    overlay.classList.toggle('show', !authed);
  });
}

function updateAuthBlur() {
  const ready = typeof isAuthReady === 'undefined' ? true : isAuthReady();
  if (!ready) return;
  updateAuthGates();
}

function setupAuth() {
  if (typeof onAuthChange === 'undefined') return;

  // One-time button listeners
  if (authLoginBtn) authLoginBtn.addEventListener('click', () => openAuthModal('signin'));
  if (authLogoutLink) authLogoutLink.addEventListener('click', () => {
    localStorage.removeItem('pyjamacode-submissions');
    localStorage.removeItem('pyjamacode-notes');
    localStorage.removeItem('pyjamacode-bookmarks');
    localStorage.removeItem('pyjamacode-quiz-results');
    localStorage.removeItem('pyjamacode-free-used');
    localStorage.removeItem('pyjamacode-tabs');
    localStorage.removeItem('lastProblemUrl');
    localStorage.removeItem('lastProblemTab');
    localStorage.removeItem('pyjamacode-cloud-initialized');
    localStorage.removeItem('pyjamacode-local-version');
    localStorage.removeItem('pyjamacode-synced-version');
    clearDirtyIds();
    try { localStorage.removeItem('pyjamacode-session-id'); } catch (e) {}
    signOut().finally(function() { location.reload(); });
  });
  if (themeToggleDropdown) themeToggleDropdown.addEventListener('click', () => { toggleTheme(); });
  var resetDialog = document.getElementById('resetConfirmModal');
  var resetCodeEl = document.getElementById('resetConfirmCode');
  var resetInput = document.getElementById('resetConfirmInput');
  var resetConfirmYes = document.getElementById('resetConfirmYes');
  var resetConfirmNo = document.getElementById('resetConfirmNo');

  function generateResetCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function clearLocalProfile() {
    localStorage.removeItem('pyjamacode-submissions');
    localStorage.removeItem('pyjamacode-notes');
    localStorage.removeItem('pyjamacode-bookmarks');
    localStorage.removeItem('pyjamacode-quiz-results');
    localStorage.removeItem('pyjamacode-free-used');
    localStorage.removeItem('pyjamacode-tabs');
    localStorage.removeItem('lastProblemUrl');
    localStorage.removeItem('lastProblemTab');
    localStorage.removeItem('pyjamacode-cloud-initialized');
    localStorage.removeItem('pyjamacode-local-version');
    localStorage.removeItem('pyjamacode-synced-version');
    clearDirtyIds();
    try { localStorage.removeItem('pyjamacode-session-id'); } catch (e) {}
    // Reset theme to light
    localStorage.setItem('pyjamacode-theme', 'light');
    htmlEl.setAttribute('data-bs-theme', 'light');
    updateThemeIcon('light');
    updateCodeMirrorTheme();
    updateHighlightJsTheme('light');
  }

  if (resetProfileLink) {
    resetProfileLink.addEventListener('click', function() {
      if (!resetDialog || !resetCodeEl || !resetInput || !resetConfirmYes) return;
      var code = generateResetCode();
      resetCodeEl.textContent = code;
      resetInput.value = '';
      resetConfirmYes.disabled = true;
      resetDialog.showModal();
    });
  }
  if (resetConfirmNo) {
    resetConfirmNo.addEventListener('click', function() {
      if (resetDialog) resetDialog.close();
    });
  }
  if (resetDialog) {
    resetDialog.addEventListener('close', function() {
      if (resetInput) resetInput.value = '';
    });
  }
  if (resetInput) {
    resetInput.addEventListener('input', function() {
      if (!resetConfirmYes || !resetCodeEl) return;
      resetConfirmYes.disabled = resetInput.value !== resetCodeEl.textContent;
    });
  }
  if (resetConfirmYes) {
    resetConfirmYes.addEventListener('click', function() {
      if (resetConfirmYes.disabled) return;
      if (resetDialog) resetDialog.close();
      var uid = null;
      try {
        if (typeof firebase !== 'undefined' && firebase.apps.length && firebase.auth().currentUser) {
          uid = firebase.auth().currentUser.uid;
        }
      } catch (e) {}
      if (uid) {
        // Signal other sessions via Firestore, then delete everything
        window._wipingUid = uid;
        firebase.firestore().collection('users').doc(uid).collection('meta').doc('profile').set({
          _wipedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(function() {
          return deleteUserData(uid);
        }).then(function() {
          clearLocalProfile();
          window.location.href = '/dashboard/';
        }).catch(function(e) {
          console.error('Failed to delete cloud data:', e);
          clearLocalProfile();
          window.location.href = '/dashboard/';
        });
      } else {
        clearLocalProfile();
        window.location.href = '/dashboard/';
      }
    });
  }
  // Cross-session wipe detection — other tabs clear data when this tab wipes
  window.addEventListener('storage', function(e) {
    if (e.key === 'pyjamacode-wiped-at' && e.newValue) {
      clearLocalProfile();
      window.location.href = '/dashboard/';
    }
  });
  if (authGoogleBtn) authGoogleBtn.addEventListener('click', () => {
    signInWithGoogle().then(() => { window.location.reload(); }).catch((err) => {
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
      if (authNudgeEnabled()) localStorage.removeItem('authForced');
      localStorage.removeItem('pyjamacode-free-used');
      _freeUsed = false;
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
    if (themeToggle) themeToggle.classList.toggle('d-none', !isAuthed);
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
    updateSyncIndicator();

    // If free use was already consumed on a previous visit, force auth
    if (!isAuthed && _freeUsed) {
      setTimeout(() => openAuthModal('signin'), 300);
    }
  });

  // Auth overlay button → open modal
  if (authShowBtn) authShowBtn.addEventListener('click', () => openAuthModal('signin'));

  // Action button
  if (authActionBtn) authActionBtn.addEventListener('click', handleAuthAction);

  // Enter key in password field
  if (authPassword) authPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAuthAction(); });
}

function openAuthModal(mode) {
  injectAuthModal();
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
  // Lock the modal — prevent all dismissals
  if (authModal) {
    authModal._backdropClose = false;
    // Force modal to stay visible by re-showing if hidden
    if (!window._authModalGuard) {
      window._authModalGuard = setInterval(() => {
        if (authModal && !authModal.classList.contains('show') && _freeUsed && !isAuthenticated()) {
          authModal.classList.add('show');
        }
      }, 100);
    }
  }
}
window.openAuthModal = openAuthModal;

function clearAuthGuard() {
  if (window._authModalGuard) {
    clearInterval(window._authModalGuard);
    window._authModalGuard = null;
  }
}

function closeAuthModal() {
  if (authModal) authModal.classList.remove('show');
  if (authError) authError.style.display = 'none';
  clearAuthGuard();
  if (questionContentEl && questionContentEl.classList.contains('content-blurred-force')) {
    if (authNudgeEnabled() && typeof window._dismissForceAuth === 'function') window._dismissForceAuth();
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

// Recursively delete all docs in a collection (client-side batch pattern)
function deleteCollection(db, collectionRef, batchSize) {
  batchSize = batchSize || 20;
  return collectionRef.limit(batchSize).get().then(function(snapshot) {
    if (snapshot.size === 0) return Promise.resolve();
    var batch = db.batch();
    snapshot.forEach(function(doc) { batch.delete(doc.ref); });
    return batch.commit().then(function() {
      return deleteCollection(db, collectionRef, batchSize);
    });
  });
}

function deleteUserData(uid) {
  var db = firebase.firestore();
  var promises = [];
  promises.push(deleteCollection(db, db.collection('users').doc(uid).collection('codes')));
  promises.push(deleteCollection(db, db.collection('users').doc(uid).collection('notes')));
  promises.push(deleteCollection(db, db.collection('users').doc(uid).collection('quizzes')));
  promises.push(db.collection('users').doc(uid).collection('sessions').doc('_active').delete());
  promises.push(db.collection('users').doc(uid).collection('meta').doc('profile').delete());
  return Promise.all(promises).then(function() {});
}

function initSync() {
  if (typeof firebase === 'undefined' || !firebase.apps.length) return;
  const db = firebase.firestore();
  let syncUid = null;

  // Build a status map from the in-memory submissions object
  function buildStatusMap() {
    const map = {};
    for (const id of Object.keys(submissions)) {
      const s = submissions[id];
      if (s.status && s.status !== 'Unattempted') map[id] = s.status;
    }
    return map;
  }

  // Push changed items individually to granular Firestore docs
  function pushChangedItems(ids) {
    if (!syncUid) return Promise.resolve();
    const batch = db.batch();

    // Meta doc: theme + tab + status map + per-problem tabs
    const metaRef = db.collection('users').doc(syncUid).collection('meta').doc('profile');
    batch.set(metaRef, {
      theme: localStorage.getItem('pyjamacode-theme') || 'dark',
      tab: new URL(window.location).searchParams.get('tab') || '',
      status: buildStatusMap(),
      tabs: buildTabsMap(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Write each changed submission as an individual code doc
    if (ids) {
      ids.forEach(function(id) {
        const sub = submissions[id];
        if (!sub) return;
        const codeDoc = {
          code: sub.code || '',
          files: sub.files || null,
          status: sub.status || 'Unattempted',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        batch.set(
          db.collection('users').doc(syncUid).collection('codes').doc(id),
          codeDoc
        );
        // Write note for this ID if it exists
        if (notes[id] && notes[id].trim()) {
          batch.set(
            db.collection('users').doc(syncUid).collection('notes').doc(id),
            { content: notes[id], updatedAt: firebase.firestore.FieldValue.serverTimestamp() }
          );
        }
      });
    }

    // Write dirty quizzes
    for (var qid in _dirtyQuizzes) {
      if (quizResults[qid]) {
        batch.set(
          db.collection('users').doc(syncUid).collection('quizzes').doc(qid),
          { results: quizResults[qid], updatedAt: firebase.firestore.FieldValue.serverTimestamp() }
        );
      } else {
        batch.delete(
          db.collection('users').doc(syncUid).collection('quizzes').doc(qid)
        );
      }
    }

    return batch.commit();
  }

  function startCloudListener(uid) {
    if (window._cloudUnsub) { window._cloudUnsub(); window._cloudUnsub = null; }
    // Listen to meta doc for real-time status/theme/tab updates
    window._cloudUnsub = db.collection('users').doc(uid).collection('meta').doc('profile').onSnapshot(function(snap) {
      if (window._isPushingLocally) return;
      if (!snap.exists) return;
      const data = snap.data();
      // Cross-browser wipe signal — another session reset the profile
      if (data._wipedAt && window._wipingUid !== uid) {
        clearLocalProfile();
        window.location.href = '/dashboard/';
        return;
      }
      let changed = false;
      if (data.theme && data.theme !== localStorage.getItem('pyjamacode-theme')) {
        localStorage.setItem('pyjamacode-theme', data.theme);
        htmlEl.setAttribute('data-bs-theme', data.theme);
        updateThemeIcon(data.theme);
        updateCodeMirrorTheme();
        updateHighlightJsTheme(data.theme);
        changed = true;
      }
      if (data.status) {
        var statusChanged = false;
        for (const id of Object.keys(data.status)) {
          if (!submissions[id]) submissions[id] = {};
          if (submissions[id].status !== data.status[id]) {
            submissions[id].status = data.status[id];
            statusChanged = true;
          }
        }
        if (statusChanged) {
          persistSubmissions();
          changed = true;
        }
      }
      if (data.tabs) {
        var localTabs = {};
        try { localTabs = JSON.parse(localStorage.getItem('pyjamacode-tabs') || '{}'); } catch (e) { localTabs = {}; }
        var merged = false;
        for (var id in data.tabs) {
          if (data.tabs[id] && localTabs[id] !== data.tabs[id]) {
            localTabs[id] = data.tabs[id];
            merged = true;
          }
        }
        if (merged) {
          localStorage.setItem('pyjamacode-tabs', JSON.stringify(localTabs));
        }
      }
      if (changed) {
        refreshUI();
        setDirty(false);
      }
    });

    // Note: codes, notes, and quizzes listeners are intentionally removed.
    // Cloud sync only happens on explicit user action (sync button or Ctrl+S).
    // Cross-tab sync within the same browser uses the localStorage storage event.
  }

  function stopCloudListener() {
    if (window._cloudUnsub) { window._cloudUnsub(); window._cloudUnsub = null; }
  }

  function pullFromCloud(uid) {
    // After first sync, use localStorage only — don't pull from cloud on every load
    if (localStorage.getItem('pyjamacode-cloud-initialized')) return Promise.resolve();
    return db.collection('users').doc(uid).collection('meta').doc('profile').get().then(function(metaSnap) {
      if (metaSnap.exists) {
        const meta = metaSnap.data();
        if (meta.status) {
          for (const id of Object.keys(meta.status)) {
            if (!submissions[id]) submissions[id] = {};
            submissions[id].status = meta.status[id];
          }
          persistSubmissions();
        }
        if (meta.theme) {
          localStorage.setItem('pyjamacode-theme', meta.theme);
          htmlEl.setAttribute('data-bs-theme', meta.theme);
          updateThemeIcon(meta.theme);
          updateCodeMirrorTheme();
          updateHighlightJsTheme(meta.theme);
        }
        if (meta.tabs) {
          try { localStorage.setItem('pyjamacode-tabs', JSON.stringify(meta.tabs)); } catch (e) {}
        }
        // Pull all code docs into local submissions
        return db.collection('users').doc(uid).collection('codes').get().then(function(codeSnap) {
          codeSnap.forEach(function(doc) {
            var data = doc.data();
            var id = doc.id;
            if (!submissions[id]) submissions[id] = {};
            if (data.code) submissions[id].code = data.code;
            if (data.files) submissions[id].files = data.files;
            if (data.status) submissions[id].status = data.status;
            if (data.output) submissions[id].output = data.output;
          });
          persistSubmissions();
          // Pull all notes docs
          return db.collection('users').doc(uid).collection('notes').get().then(function(noteSnap) {
            noteSnap.forEach(function(doc) {
              var data = doc.data();
              if (data.content) notes[doc.id] = data.content;
            });
            persistNotes();
            // Pull all quiz results
            return db.collection('users').doc(uid).collection('quizzes').get().then(function(quizSnap) {
              quizSnap.forEach(function(doc) {
                var data = doc.data();
                quizResults[doc.id] = data.results || {};
              });
              try { localStorage.setItem('pyjamacode-quiz-results', JSON.stringify(quizResults)); } catch (e) {}
              localStorage.setItem('pyjamacode-cloud-initialized', '1');
              setSyncedVersion();
              return Promise.resolve();
            });
          });
        });
      }
      // No data at all — mark initialized so we don't pull again
      localStorage.setItem('pyjamacode-cloud-initialized', '1');
      setSyncedVersion();
      return Promise.resolve();
    });
  }

  function pushAllToCloud() {
    if (!syncUid) return Promise.resolve();
    for (var qid in quizResults) _dirtyQuizzes[qid] = true;
    window._isPushingLocally = true;
    updateSyncIndicator();
    return pushChangedItems(Object.keys(submissions)).then(function() {
      _dirtySubmissions = {};
      _dirtyNotes = {};
      _dirtyQuizzes = {};
      clearDirtyIds();
      localStorage.setItem('pyjamacode-cloud-initialized', '1');
      setSyncedVersion();
      window._isPushingLocally = false;
      updateSyncIndicator();
    }).catch(function() { window._isPushingLocally = false; updateSyncIndicator(); });
  }

  function refreshUI() {
    loadSubmissions();
    loadNotes();
    const _q = questions.find(function(q) { return q.id === activeQuestionId; });
    if (activeQuestionId && questionContentEl && (!_q || !_q.isIntro)) selectQuestion(activeQuestionId);
    else renderQuestionList(questionSearchEl ? questionSearchEl.value : '');
  }

  // ─── Configurable session enforcement ───
  var localSessionId = null;
  var sessionUnsub = null;

  function generateSessionId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  function registerSession(uid) {
    var maxSessions = (window.__APP_CONFIG__ && window.__APP_CONFIG__.maxSessions) || 1;
    if (maxSessions <= 0) return;

    localSessionId = localStorage.getItem('pyjamacode-session-id');
    if (!localSessionId) {
      localSessionId = generateSessionId();
      try { localStorage.setItem('pyjamacode-session-id', localSessionId); } catch (e) {}
    }

    var sessCol = db.collection('users').doc(uid).collection('sessions');
    var sessDoc = sessCol.doc('_active');

    // Migrate old per-doc sessions to the new map format
    sessDoc.get().then(function(docSnap) {
      var needsMigration = true;
      if (docSnap.exists) {
        var d = docSnap.data();
        // If _active has a 'sessions' map, it's already the new format
        if (d && d.sessions && typeof d.sessions === 'object' && !Array.isArray(d.sessions)) {
          needsMigration = false;
        }
      }
      if (needsMigration) {
        // Read all old-format session docs and merge into the map
        return sessCol.get().then(function(colSnap) {
          var map = {};
          colSnap.forEach(function(doc) {
            if (doc.id === '_active') return;
            var data = doc.data();
            if (data.updatedAt) {
              map[doc.id] = data.updatedAt;
            }
            doc.ref.delete();
          });
          // Write the merged map (including the old _active doc if it existed but had wrong format)
          return sessDoc.set({ sessions: map }, { merge: true });
        });
      }
    }).then(function() {
      // Now add our session to the map
      return sessDoc.set({ sessions: { [localSessionId]: firebase.firestore.FieldValue.serverTimestamp() } }, { merge: true });
    }).then(function() {
      // Register the listener AFTER migration and our session addition
      if (sessionUnsub) sessionUnsub();
      sessionUnsub = sessDoc.onSnapshot(function(snap) {
        if (!snap.exists || window._isPushingLocally) return;
        var data = snap.data() || {};
        var sessions = data.sessions || {};
        var active = Object.keys(sessions).map(function(id) {
          var ts = sessions[id];
          return { id: id, ts: ts && ts.toMillis ? ts.toMillis() : (ts || 0) };
        });
        active.sort(function(a, b) { return a.ts - b.ts; });
        // If our session is not in the map, we were evicted
        if (active.every(function(s) { return s.id !== localSessionId; })) {
          signOut().then(function() { window.location.href = '/?session=expired'; })
            .catch(function() { window.location.href = '/?session=expired'; });
          return;
        }
        // Evict oldest beyond the limit (won't be ours — we just checked)
        // This also handles dynamic limit changes (if maxSessions was reduced)
        while (active.length > maxSessions) {
          var oldest = active.shift();
          sessDoc.set({ sessions: { [oldest.id]: firebase.firestore.FieldValue.delete() } }, { merge: true });
        }
      });
    });

  }

  function unregisterSession() {
    if (sessionUnsub) { sessionUnsub(); sessionUnsub = null; }
    if (syncUid && localSessionId) {
      db.collection('users').doc(syncUid).collection('sessions').doc('_active').set(
        { sessions: { [localSessionId]: firebase.firestore.FieldValue.delete() } },
        { merge: true }
      );
    }
    try { localStorage.removeItem('pyjamacode-session-id'); } catch (e) {}
    localSessionId = null;
  }

  // Listen for auth changes
  onAuthChange(function(user) {
    if (user) {
      syncUid = user.uid;
      pullFromCloud(user.uid).then(function() {
        refreshUI();
        startCloudListener(user.uid);
        registerSession(user.uid);
        setDirty(false);
        updateSyncIndicator();
      }).catch(function() {
        pushAllToCloud().then(function() {
          startCloudListener(user.uid);
          registerSession(user.uid);
          setDirty(false);
        });
      });
    } else {
      syncUid = null;
      stopCloudListener();
      unregisterSession();
      setDirty(false);
      updateSyncIndicator();
    }
  });

  var dirty = false;

  function setDirty(v) {
    if (!syncUid) return;
    dirty = v;
    var base = document.title.replace(/^\* /, '');
    document.title = v ? '* ' + base : base;
  }

  function doSync() {
    if (!syncUid) return;
    saveCurrentCode();
    saveCurrentNotes();
    var changedIds = Object.keys(_dirtySubmissions);
    for (var nid in _dirtyNotes) {
      if (changedIds.indexOf(nid) === -1) changedIds.push(nid);
    }
    window._isPushingLocally = true;
    updateSyncIndicator();
    pushChangedItems(changedIds).then(function() {
      _dirtySubmissions = {};
      _dirtyNotes = {};
      _dirtyQuizzes = {};
      clearDirtyIds();
      localStorage.setItem('pyjamacode-cloud-initialized', '1');
      setSyncedVersion();
      window._isPushingLocally = false;
      updateSyncIndicator();
      setDirty(false);
    }).catch(function() { window._isPushingLocally = false; updateSyncIndicator(); });
  }

  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      doSync();
    }
  });

  document.addEventListener('cloud-sync-requested', doSync);

  var origToggleTheme = toggleTheme;
  toggleTheme = function() {
    origToggleTheme();
    if (syncUid) {
      db.collection('users').doc(syncUid).collection('meta').doc('profile').set({
        theme: localStorage.getItem('pyjamacode-theme') || 'dark',
        status: buildStatusMap(),
        tabs: buildTabsMap(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).catch(function() {});
    }
  };

  var origPersistSubmissions = persistSubmissions;
  persistSubmissions = function() {
    origPersistSubmissions();
  };

  var origPersistNotes = persistNotes;
  persistNotes = function() {
    origPersistNotes();
  };
}

// Inline responsive breakpoint — applied before any render
(function() {
  var bp = window.__APP_CONFIG__ && window.__APP_CONFIG__.mobileBreakpoint;
  if (bp && typeof bp === 'number') {
    var style = document.createElement('style');
    style.textContent = '@media (max-width:' + bp + 'px){.console-resizer{display:none!important}#resizerCasesCase{display:none!important}#questionPane{width:100%!important;flex:1}#sidebarPane{position:fixed;top:56px;left:0;bottom:0;z-index:1040;width:320px!important;max-width:85vw;background:var(--bs-body-bg);border-right:1px solid var(--border-color);transform:translateX(-100%);transition:transform 0.25s ease;overflow-y:auto;box-shadow:4px 0 12px rgba(0,0,0,0.15)}#sidebarPane.sidebar-open{transform:translateX(0)}#sidebarPane .sidebar-close{display:flex!important}.sidebar-backdrop{display:none;position:fixed;inset:0;z-index:1039;background:rgba(0,0,0,0.4)}.sidebar-backdrop.show{display:block}#editorPane{position:fixed;top:56px;left:0;bottom:0;z-index:1040;width:100vw;background:var(--bs-body-bg);border-left:1px solid var(--border-color);transform:translateX(100%);transition:transform 0.25s ease;box-shadow:-4px 0 12px rgba(0,0,0,0.15);display:flex!important;flex-direction:column}#statusText{text-align:center}#editorPane.editor-open{transform:translateX(0)}#editorPane .editor-close{display:flex!important}.editor-backdrop{display:none;position:fixed;inset:0;z-index:1039;background:rgba(0,0,0,0.4)}.editor-backdrop.show{display:block}}';
    document.head.appendChild(style);
  }
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
