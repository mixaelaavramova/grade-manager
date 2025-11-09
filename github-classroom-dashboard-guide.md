# GitHub Classroom Dashboard - Ръководство за изграждане
## 🔒 Privacy-First: Само client-side, без backend

## Обща концепция

Статичен уеб сайт хостван на GitHub Pages където:
- Студентът влиза с GitHub OAuth (SSO)
- Browser-ът прави API calls директно към GitHub/Google Sheets
- Всеки вижда САМО своите данни
- Без backend сървър - всичко client-side
- Преподавателят управлява данните чрез GitHub Actions или локален скрипт

## Архитектура

```
┌─────────────────┐
│   GitHub Pages  │  (статичен HTML/JS)
│   (Public)      │
└────────┬────────┘
         │
         ├─► GitHub OAuth (влизане)
         │
         ├─► GitHub API (student repos, assignments)
         │   └─► Студентът вижда САМО своите repos
         │
         └─► Google Sheets API (присъствия)
             └─► Client-side филтрира САМО за този студент
```

## Структура на проекта

```
github-classroom-dashboard/
├── index.html              # Landing page + login
├── dashboard.html          # Главен dashboard (след login)
├── css/
│   └── style.css          # Styling
├── js/
│   ├── auth.js            # GitHub OAuth логика
│   ├── github-api.js      # GitHub API calls
│   ├── sheets-api.js      # Google Sheets API calls
│   └── dashboard.js       # Dashboard логика
├── config.js              # Конфигурация (client IDs)
└── README.md

ВАЖНО: Никакви чувствителни данни НЕ се записват в кода!
```

## Компоненти и технологии

### 1. GitHub OAuth (SSO)
- Използваш GitHub OAuth App
- Redirect след успешен login
- Получаваш access token (само в browser-а, никъде не се записва)
- С token-а правиш authenticated API calls

### 2. GitHub API (Client-side)
Student вижда:
- Своите assignment repositories
- Commit history
- Дати на commits
- Pass/fail статус (ако има GitHub Actions)

**Как работи:**
```javascript
// Browser-ът прави заявка с USER's token
fetch('https://api.github.com/user/repos', {
  headers: {
    'Authorization': `token ${userToken}`
  }
})
// GitHub API автоматично връща САМО repos на този user
```

### 3. Google Sheets API (Client-side, read-only)
**Setup:**
- Създаваш публичен (или с link-sharing) Google Sheet
- Активираш Google Sheets API
- Получаваш API key (public, може да е в кода)

**Структура на Sheet-а:**
```
| GitHub Username | Date       | Status  | Notes           |
|----------------|------------|---------|-----------------|
| ivan_petrov    | 2024-11-01 | Present | -               |
| maria_g        | 2024-11-01 | Absent  | Извинена        |
| ivan_petrov    | 2024-11-08 | Present | -               |
```

**Client-side филтриране:**
```javascript
// Browser изтегля ЦЕЛИЯ sheet (но само преподавателят го попълва)
const allData = await fetchFromSheets();

// Филтрира САМО за logged in user
const myAttendance = allData.filter(row => 
  row.username === currentGitHubUser
);

// Показва само неговите данни
displayAttendance(myAttendance);
```

### 4. Управление на данни (Преподавател)

**Опция A: GitHub Actions (автоматично)**
```yaml
# .github/workflows/sync-data.yml
name: Sync Classroom Data

on:
  schedule:
    - cron: '0 6 * * *'  # Всяка сутрин
  workflow_dispatch:      # Или ръчно

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Fetch GitHub Classroom data
        run: |
          # Скрипт който изтегля assignment статуси
          # Генерира assignments.json
      
      - name: Commit and push
        run: |
          git add data/assignments.json
          git commit -m "Update assignments data"
          git push
```

**Опция B: Локален скрипт**
```bash
# update-data.sh
# Пускаш го локално когато искаш
python fetch_classroom_data.py
git add data/
git commit -m "Update data"
git push
```

## Какво вижда всеки потребител

### Студент:
1. Влиза с GitHub акаунт
2. Dashboard показва:
   - **Мои задачи:** списък от assignments
   - **Статус:** предадени/непредадени (от GitHub API)
   - **Последен commit:** дата (от GitHub API)
   - **Присъствия:** само негови редове (от Google Sheets)
   - **Оценки:** ако има (от GitHub/Sheet)

### Преподавател:
- Същият dashboard
- ИЛИ отделен admin panel
- ИЛИ просто управлява през Google Sheets и GitHub

## Стъпки за имплементация

### Фаза 1: Setup GitHub OAuth

1. **Създай GitHub OAuth App:**
   - Отиди на: https://github.com/settings/developers
   - New OAuth App
   - **Application name:** "Classroom Dashboard"
   - **Homepage URL:** `https://USERNAME.github.io/classroom-dashboard`
   - **Authorization callback URL:** `https://USERNAME.github.io/classroom-dashboard/callback`
   - Копирай Client ID

2. **Конфигурация:**
```javascript
// config.js (PUBLIC файл)
const CONFIG = {
  GITHUB_CLIENT_ID: 'твоя_client_id_тук',
  GITHUB_CLASSROOM_ORG: 'org_name',
  GOOGLE_SHEETS_API_KEY: 'твой_sheets_api_key',
  GOOGLE_SHEET_ID: 'sheet_id_тук'
};
```

### Фаза 2: Basic Auth Flow

**index.html:**
```html
<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="UTF-8">
  <title>Classroom Dashboard</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div class="login-container">
    <h1>📚 Classroom Dashboard</h1>
    <button id="github-login">
      Влез с GitHub
    </button>
  </div>
  
  <script src="config.js"></script>
  <script src="js/auth.js"></script>
</body>
</html>
```

**js/auth.js:**
```javascript
// GitHub OAuth flow (client-side)
document.getElementById('github-login').addEventListener('click', () => {
  const clientId = CONFIG.GITHUB_CLIENT_ID;
  const redirectUri = window.location.origin + '/dashboard.html';
  const scope = 'read:user,repo';
  
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  
  window.location.href = authUrl;
});

// След redirect от GitHub
function handleAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (code) {
    // ВАЖНО: За production трябва proxy за да размениш code за token
    // За MVP можеш да използваш GitHub's device flow или service
    exchangeCodeForToken(code);
  }
}

// Simplified version - в реалност трябва proxy
async function exchangeCodeForToken(code) {
  // Тук трябва serverless function (GitHub Actions/Vercel/Netlify)
  // ИЛИ използваш GitHub CLI device flow
  // За сега: localStorage simulation
  
  const token = await fetchTokenViaProxy(code);
  localStorage.setItem('gh_token', token);
  
  // Fetch user info
  const user = await fetchGitHubUser(token);
  localStorage.setItem('gh_user', JSON.stringify(user));
  
  window.location.href = '/dashboard.html';
}

async function fetchGitHubUser(token) {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  return await response.json();
}
```

### Фаза 3: Dashboard

**dashboard.html:**
```html
<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="UTF-8">
  <title>Моят Dashboard</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <nav>
    <h1>📚 Classroom Dashboard</h1>
    <div id="user-info"></div>
    <button id="logout">Изход</button>
  </nav>
  
  <main>
    <section id="assignments">
      <h2>📝 Мои задачи</h2>
      <div id="assignments-list"></div>
    </section>
    
    <section id="attendance">
      <h2>📅 Присъствия</h2>
      <div id="attendance-list"></div>
    </section>
  </main>
  
  <script src="config.js"></script>
  <script src="js/auth.js"></script>
  <script src="js/github-api.js"></script>
  <script src="js/sheets-api.js"></script>
  <script src="js/dashboard.js"></script>
</body>
</html>
```

**js/github-api.js:**
```javascript
class GitHubAPI {
  constructor(token) {
    this.token = token;
    this.baseUrl = 'https://api.github.com';
  }
  
  async getMyRepos() {
    // Автоматично връща САМО repos на този user
    const response = await fetch(`${this.baseUrl}/user/repos?affiliation=owner`, {
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    return await response.json();
  }
  
  async getClassroomRepos() {
    const allRepos = await this.getMyRepos();
    
    // Филтрира само classroom assignments
    // Обикновено имат naming pattern: assignment-name-username
    return allRepos.filter(repo => 
      repo.name.includes('assignment-') || 
      repo.owner.login === CONFIG.GITHUB_CLASSROOM_ORG
    );
  }
  
  async getRepoCommits(owner, repo) {
    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/commits`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    return await response.json();
  }
  
  async getRepoWorkflowRuns(owner, repo) {
    // За автоматични тестове/оценки
    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/actions/runs`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    return await response.json();
  }
}
```

**js/sheets-api.js:**
```javascript
class SheetsAPI {
  constructor(apiKey, sheetId) {
    this.apiKey = apiKey;
    this.sheetId = sheetId;
    this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  }
  
  async getAttendance() {
    // Чете ЦЕЛИЯ sheet (публичен)
    const range = 'Sheet1!A:D'; // Username, Date, Status, Notes
    const url = `${this.baseUrl}/${this.sheetId}/values/${range}?key=${this.apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return this.parseAttendanceData(data.values);
  }
  
  parseAttendanceData(rows) {
    const [headers, ...dataRows] = rows;
    
    return dataRows.map(row => ({
      username: row[0],
      date: row[1],
      status: row[2],
      notes: row[3] || ''
    }));
  }
  
  filterForUser(allAttendance, username) {
    // Client-side филтриране
    return allAttendance.filter(record => 
      record.username === username
    );
  }
}
```

**js/dashboard.js:**
```javascript
// Main dashboard логика
let githubApi;
let sheetsApi;
let currentUser;

async function init() {
  // Проверка за auth
  const token = localStorage.getItem('gh_token');
  const userStr = localStorage.getItem('gh_user');
  
  if (!token || !userStr) {
    window.location.href = '/index.html';
    return;
  }
  
  currentUser = JSON.parse(userStr);
  githubApi = new GitHubAPI(token);
  sheetsApi = new SheetsAPI(
    CONFIG.GOOGLE_SHEETS_API_KEY,
    CONFIG.GOOGLE_SHEET_ID
  );
  
  // Display user info
  displayUserInfo();
  
  // Load data
  await loadAssignments();
  await loadAttendance();
}

function displayUserInfo() {
  document.getElementById('user-info').innerHTML = `
    <img src="${currentUser.avatar_url}" width="32" height="32">
    <span>${currentUser.login}</span>
  `;
}

async function loadAssignments() {
  const repos = await githubApi.getClassroomRepos();
  
  const assignmentsList = document.getElementById('assignments-list');
  assignmentsList.innerHTML = '';
  
  for (const repo of repos) {
    const commits = await githubApi.getRepoCommits(repo.owner.login, repo.name);
    const lastCommit = commits[0];
    
    // Опционално: провери workflow runs
    const runs = await githubApi.getRepoWorkflowRuns(repo.owner.login, repo.name);
    const lastRun = runs.workflow_runs?.[0];
    
    const assignmentCard = createAssignmentCard(repo, lastCommit, lastRun);
    assignmentsList.appendChild(assignmentCard);
  }
}

function createAssignmentCard(repo, lastCommit, lastRun) {
  const card = document.createElement('div');
  card.className = 'assignment-card';
  
  const status = lastRun ? 
    (lastRun.conclusion === 'success' ? '✅' : '❌') : 
    '⏳';
  
  card.innerHTML = `
    <h3>${status} ${repo.name}</h3>
    <p>Последен commit: ${new Date(lastCommit.commit.author.date).toLocaleDateString('bg-BG')}</p>
    <p>Статус: ${lastRun?.conclusion || 'Не е проверено'}</p>
    <a href="${repo.html_url}" target="_blank">Виж в GitHub</a>
  `;
  
  return card;
}

async function loadAttendance() {
  const allAttendance = await sheetsApi.getAttendance();
  
  // ВАЖНО: Филтрираме САМО за текущия user
  const myAttendance = sheetsApi.filterForUser(
    allAttendance, 
    currentUser.login
  );
  
  const attendanceList = document.getElementById('attendance-list');
  attendanceList.innerHTML = '';
  
  if (myAttendance.length === 0) {
    attendanceList.innerHTML = '<p>Няма записани присъствия.</p>';
    return;
  }
  
  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Дата</th>
        <th>Статус</th>
        <th>Бележки</th>
      </tr>
    </thead>
    <tbody>
      ${myAttendance.map(record => `
        <tr>
          <td>${record.date}</td>
          <td>${record.status === 'Present' ? '✅ Присъствал' : '❌ Отсъствал'}</td>
          <td>${record.notes}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
  
  attendanceList.appendChild(table);
}

// Logout
document.getElementById('logout').addEventListener('click', () => {
  localStorage.removeItem('gh_token');
  localStorage.removeItem('gh_user');
  window.location.href = '/index.html';
});

// Initialize on load
init();
```

### Фаза 4: Styling

**css/style.css:**
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f5f5;
}

nav {
  background: #24292e;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

#user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

#user-info img {
  border-radius: 50%;
}

button {
  background: #0366d6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background: #0256c7;
}

main {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
}

section {
  background: white;
  padding: 2rem;
  margin-bottom: 2rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

h2 {
  margin-bottom: 1rem;
  color: #24292e;
}

.assignment-card {
  border: 1px solid #e1e4e8;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 6px;
}

.assignment-card:hover {
  border-color: #0366d6;
}

.assignment-card h3 {
  margin-bottom: 0.5rem;
}

.assignment-card a {
  color: #0366d6;
  text-decoration: none;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e1e4e8;
}

th {
  font-weight: 600;
  background: #f6f8fa;
}

.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 2rem;
}

.login-container h1 {
  font-size: 2.5rem;
}

.login-container button {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}
```

## Google Sheets Setup

### Структура на таблицата:

**Sheet: "Attendance"**
```
| GitHub Username | Date       | Status  | Notes           |
|----------------|------------|---------|-----------------|
| ivan_petrov    | 2024-11-01 | Present | -               |
| maria_g        | 2024-11-01 | Absent  | Извинена        |
| ivan_petrov    | 2024-11-08 | Present | -               |
| maria_g        | 2024-11-08 | Present | -               |
```

### Да направиш Sheet публичен:
1. Share → "Anyone with the link can view"
2. Копирай Sheet ID от URL-а:
   `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

### Активирай API:
1. https://console.cloud.google.com/
2. Enable Google Sheets API
3. Create API Key (restrict to Sheets API only)
4. Copy API key в config.js

## OAuth Token Exchange (ВАЖЕН проблем!)

**Проблем:** GitHub OAuth изисква Client Secret за размяна на code за token, но не можеш да го сложиш в client-side кода.

**Решения:**

### Опция 1: GitHub Pages + Cloudflare Workers (Препоръчително)
```javascript
// Cloudflare Worker (безплатен tier)
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code
      })
    });
    
    return new Response(await response.text(), {
      headers: {
        'Access-Control-Allow-Origin': 'https://yoursite.github.io',
        'Content-Type': 'application/json'
      }
    });
  }
}
```

### Опция 2: GitHub Actions като Serverless Function
Прекалено сложно за този use case.

### Опция 3: Използвай готов service (най-лесно)
- **Netlify/Vercel Serverless Functions** (безплатни)
- **Auth0** или **Firebase Auth** с GitHub provider

### Опция 4: Personal Access Token (за development)
```javascript
// САМО ЗА DEVELOPMENT/TESTING!
// Студентите генерират личен token и го въвеждат
// Не е истински SSO, но работи за прототип
```

## Deployment

### 1. Създай GitHub repo:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/classroom-dashboard.git
git push -u origin main
```

### 2. Enable GitHub Pages:
- Settings → Pages
- Source: main branch, / (root)
- Запази URL-а: `https://USERNAME.github.io/classroom-dashboard`

### 3. Update OAuth App callback:
- GitHub Settings → Developer Settings → OAuth Apps
- Update callback URL с production URL

### 4. Тествай!

## Security & Privacy съображения

✅ **Добри практики:**
- Token се съхранява САМО в localStorage (не се изпраща никъде)
- Всеки student вижда само своите repos (GitHub API гарантира)
- Attendance се филтрира client-side
- API keys са read-only
- Никакви чувствителни данни в кода

⚠️ **Внимавай:**
- Google Sheets API key е public → САМО read-only
- Sheets трябва да съдържа САМО public info (usernames, dates)
- НЕ слагай студентски имейли/лични данни в Sheet-а
- Token expiration - добави refresh логика

## Допълнителни features

### Графики и статистики
```javascript
// Chart.js за визуализации
async function showProgress() {
  const repos = await githubApi.getClassroomRepos();
  const completed = repos.filter(r => r.hasWorkflow && r.lastRun.conclusion === 'success');
  
  // Pie chart: Завършени vs Незавършени
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Завършени', 'В процес'],
      datasets: [{
        data: [completed.length, repos.length - completed.length]
      }]
    }
  });
}
```

### Notifications
```javascript
// Browser notifications за дедлайн
if ('Notification' in window) {
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      new Notification('Reminder: Assignment 3 due tomorrow!');
    }
  });
}
```

### Dark mode
```css
@media (prefers-color-scheme: dark) {
  body {
    background: #0d1117;
    color: #c9d1d9;
  }
  
  nav {
    background: #161b22;
  }
  
  section {
    background: #161b22;
  }
}
```

## Troubleshooting

### CORS грешки при API calls
- GitHub API: не трябва да има CORS проблеми
- Google Sheets: използвай API key (не OAuth) за public sheets

### Token не работи
- Провери scopes: `read:user` и `repo`
- Провери expiration
- Regenerate token

### Sheet данните не се показват
- Провери Sheet permissions (Anyone with link)
- Провери API key restrictions
- Console.log response за debug

## Next Steps

След като направиш MVP:
1. Добави caching (localStorage) за по-бързо зареждане
2. Добави error handling и loading states
3. Добави deadline tracking
4. Направи mobile-responsive
5. Добави export to PDF за студенти

## Заключение

Този подход е:
- ✅ 100% client-side (без backend)
- ✅ Privacy-first (всеки вижда само своите данни)
- ✅ Безплатен (GitHub Pages + free tier APIs)
- ✅ Лесен за maintain
- ✅ Разширяем

Единственият "трик" е OAuth token exchange-а, но с Cloudflare Worker/Netlify Function това е тривиално и също безплатно.

---

## TL;DR за Claude Code:

```bash
# Командата която да дадеш на Claude Code:
claude-code "Create a GitHub Pages dashboard that:
1. Uses GitHub OAuth for student login (client-side only)
2. Fetches student's assignment repos via GitHub API
3. Reads attendance from public Google Sheet
4. Shows each student ONLY their own data
5. No backend - pure static site
6. Include Cloudflare Worker for OAuth token exchange"
```

Готов си! 🚀