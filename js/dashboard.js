// Dashboard Main Logic

let githubApi;
let currentUser;
let assignments = [];

// Initialize dashboard
async function init() {
  try {
    // Check if user is authenticated
    if (!auth.isAuthenticated()) {
      // Try to handle OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('code')) {
        await auth.handleCallback();
      } else {
        // Not authenticated and no callback - redirect to login
        window.location.href = '/index.html';
        return;
      }
    }

    // Get user data
    currentUser = auth.getUser();
    const token = auth.getToken();

    // Initialize GitHub API
    githubApi = new GitHubAPI(token);

    // Display user info
    displayUserInfo();

    // Load assignments
    await loadAssignments();

  } catch (error) {
    console.error('Initialization error:', error);
    showError('Грешка при зареждане на данните. Моля, влезте отново.');
    auth.clearAuth();
    setTimeout(() => {
      window.location.href = '/index.html';
    }, 2000);
  }
}

// Display user info in navbar
function displayUserInfo() {
  const userInfoEl = document.getElementById('user-info');
  if (userInfoEl && currentUser) {
    userInfoEl.innerHTML = `
      <img src="${currentUser.avatar_url}" alt="${currentUser.login}" width="32" height="32">
      <span>${currentUser.login}</span>
    `;
  }
}

// Load all assignments
async function loadAssignments() {
  const loadingEl = document.getElementById('loading');
  const mainContentEl = document.getElementById('main-content');

  try {
    // Show loading
    loadingEl.style.display = 'flex';
    mainContentEl.style.display = 'none';

    // Fetch assignments
    assignments = await githubApi.getAllAssignments();

    // Hide loading, show content
    loadingEl.style.display = 'none';
    mainContentEl.style.display = 'block';

    // Display statistics
    displayStatistics();

    // Display assignments
    displayAssignments();

  } catch (error) {
    console.error('Failed to load assignments:', error);
    showError('Грешка при зареждане на задачите.');
    loadingEl.style.display = 'none';
  }
}

// Display statistics cards
function displayStatistics() {
  const stats = githubApi.getStatistics(assignments);

  document.getElementById('total-assignments').textContent = stats.total;
  document.getElementById('completed-assignments').textContent = stats.success;
  document.getElementById('pending-assignments').textContent =
    stats.inProgress + stats.notStarted + stats.noTests;
  document.getElementById('failed-assignments').textContent = stats.failure;
}

// Display assignments list
function displayAssignments() {
  const listEl = document.getElementById('assignments-list');
  const noAssignmentsEl = document.getElementById('no-assignments');

  if (assignments.length === 0) {
    listEl.innerHTML = '';
    noAssignmentsEl.style.display = 'block';
    return;
  }

  noAssignmentsEl.style.display = 'none';

  // Sort by last updated
  const sortedAssignments = [...assignments].sort((a, b) => {
    const dateA = a.updated_at || a.created_at;
    const dateB = b.updated_at || b.created_at;
    return new Date(dateB) - new Date(dateA);
  });

  // Render assignment cards
  listEl.innerHTML = sortedAssignments.map(assignment =>
    createAssignmentCard(assignment)
  ).join('');
}

// Create HTML for assignment card
function createAssignmentCard(assignment) {
  const statusInfo = getStatusInfo(assignment.status);
  const lastCommitDate = assignment.latestCommit
    ? formatDate(assignment.latestCommit.commit.author.date)
    : 'Няма commits';

  const lastCommitMessage = assignment.latestCommit
    ? escapeHtml(assignment.latestCommit.commit.message.split('\n')[0])
    : '';

  const workflowInfo = assignment.latestRun
    ? `
      <div class="workflow-status ${assignment.latestRun.conclusion}">
        <strong>Тестове:</strong> ${getWorkflowStatusText(assignment.latestRun)}
      </div>
    `
    : '';

  return `
    <div class="card assignment-card ${assignment.status}">
      <div class="card-header">
        <h3>
          <span class="status-icon">${statusInfo.icon}</span>
          ${escapeHtml(assignment.name)}
        </h3>
        <span class="status-badge ${assignment.status}">${statusInfo.text}</span>
      </div>

      <div class="card-body">
        ${assignment.description ? `<p class="repo-description">${escapeHtml(assignment.description)}</p>` : ''}

        <div class="repo-info">
          <div class="info-item">
            <strong>Последен commit:</strong> ${lastCommitDate}
          </div>
          ${lastCommitMessage ? `
            <div class="info-item commit-message">
              "${lastCommitMessage}"
            </div>
          ` : ''}
          ${workflowInfo}
        </div>
      </div>

      <div class="card-footer">
        <a href="${assignment.html_url}" target="_blank" rel="noopener noreferrer" class="btn-link">
          Виж в GitHub →
        </a>
      </div>
    </div>
  `;
}

// Get status icon and text
function getStatusInfo(status) {
  const statusMap = {
    'success': { icon: '✅', text: 'Успешно' },
    'failure': { icon: '❌', text: 'Неуспешно' },
    'in_progress': { icon: '⏳', text: 'В процес' },
    'not_started': { icon: '📝', text: 'Не е започнато' },
    'no_tests': { icon: '📋', text: 'Без тестове' },
    'cancelled': { icon: '⚠️', text: 'Отказано' },
    'unknown': { icon: '❓', text: 'Неизвестно' }
  };

  return statusMap[status] || statusMap['unknown'];
}

// Get workflow status text
function getWorkflowStatusText(run) {
  if (run.status === 'in_progress' || run.status === 'queued') {
    return 'В процес...';
  }

  const conclusionMap = {
    'success': '✅ Успешно',
    'failure': '❌ Неуспешно',
    'cancelled': '⚠️ Отказано',
    'skipped': '⏭️ Прескочено'
  };

  return conclusionMap[run.conclusion] || run.conclusion;
}

// Format date to Bulgarian locale
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Днес';
  } else if (diffDays === 1) {
    return 'Вчера';
  } else if (diffDays < 7) {
    return `Преди ${diffDays} дни`;
  } else {
    return date.toLocaleDateString('bg-BG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Show error message
function showError(message) {
  const mainContentEl = document.getElementById('main-content');
  mainContentEl.innerHTML = `
    <div class="error-message">
      <h2>❌ Грешка</h2>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
  mainContentEl.style.display = 'block';
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
