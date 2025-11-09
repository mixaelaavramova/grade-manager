# GitHub Classroom Dashboard - Инструкции за настройка

## 🎯 Какво е това?

Статичен уеб dashboard хостван на GitHub Pages, който позволява на студентите да видят своите GitHub Classroom задачи, статус на commits и резултати от автоматични тестове.

**Особености:**
- ✅ 100% client-side (без backend сървър)
- ✅ Privacy-first (всеки вижда само своите данни)
- ✅ GitHub OAuth за автентикация
- ✅ Безплатен (GitHub Pages + Cloudflare Workers free tier)
- ✅ Dark mode support

## 📋 Предварителни изисквания

- GitHub акаунт
- Cloudflare акаунт (безплатен)
- Node.js и npm (за Cloudflare Wrangler CLI)

## 🚀 Стъпка 1: Създаване на GitHub OAuth App

1. **Отиди на GitHub Settings:**
   - https://github.com/settings/developers
   - Или: Settings → Developer settings → OAuth Apps

2. **Създай нов OAuth App:**
   - Кликни "New OAuth App"
   - Попълни:
     - **Application name:** GitHub Classroom Dashboard
     - **Homepage URL:** `https://YOUR-USERNAME.github.io/grades-manager`
       (замени `YOUR-USERNAME` с твоето GitHub username)
     - **Authorization callback URL:** `https://YOUR-USERNAME.github.io/grades-manager/dashboard.html`
   - Кликни "Register application"

3. **Копирай credentials:**
   - **Client ID** - копирай го (ще ти трябва по-късно)
   - **Client Secret** - генерирай нов и копирай го (ВАЖНО: запази го на сигурно място!)

⚠️ **ВАЖНО:** Client Secret е чувствителна информация. Никога не го слагай в кода!

## 🚀 Стъпка 2: Deploy на Cloudflare Worker

Cloudflare Worker е необходим за размяна на OAuth code за access token (не може да се прави client-side заради Client Secret).

### 2.1 Инсталирай Wrangler CLI

```bash
npm install -g wrangler
```

### 2.2 Login в Cloudflare

```bash
wrangler login
```

Това ще отвори браузър и ще те помоли да се логнеш в Cloudflare.

### 2.3 Настрой secrets

От директорията `cloudflare-worker/`:

```bash
cd cloudflare-worker

# Постави Client ID
wrangler secret put GITHUB_CLIENT_ID
# Когато prompt-не, въведи Client ID от стъпка 1

# Постави Client Secret
wrangler secret put GITHUB_CLIENT_SECRET
# Когато prompt-не, въведи Client Secret от стъпка 1
```

### 2.4 Deploy worker-а

```bash
wrangler deploy
```

След deploy, ще получиш URL на worker-а, например:
```
https://github-classroom-oauth.YOUR-SUBDOMAIN.workers.dev
```

**Копирай този URL** - ще ти трябва за следващата стъпка!

## 🚀 Стъпка 3: Конфигурация на Dashboard

1. **Отвори `config.js`** в root директорията

2. **Попълни настройките:**

```javascript
const CONFIG = {
  // GitHub OAuth App Client ID от Стъпка 1
  GITHUB_CLIENT_ID: 'твоя_client_id_тук',

  // URL на Cloudflare Worker от Стъпка 2
  OAUTH_PROXY_URL: 'https://github-classroom-oauth.YOUR-SUBDOMAIN.workers.dev/auth',

  // (Опционално) GitHub Organization
  GITHUB_CLASSROOM_ORG: '', // Остави празно или попълни organization name

  // Repo pattern - по подразбиране показва всички repos
  ASSIGNMENT_REPO_PATTERN: /^(?!.*-simple$).*$/,

  // ... останалото остава както е
};
```

3. **Запази файла**

## 🚀 Стъпка 4: Deploy на GitHub Pages

### 4.1 Създай Git repository (ако още не си го направил)

```bash
git init
git add .
git commit -m "Initial commit: GitHub Classroom Dashboard"
```

### 4.2 Създай GitHub repository

1. Отиди на https://github.com/new
2. Име на repo: `grades-manager` (или каквото искаш)
3. Остави го **Public**
4. **НЕ** инициализирай с README (вече имаш файлове)
5. Кликни "Create repository"

### 4.3 Push кода

```bash
git remote add origin https://github.com/YOUR-USERNAME/grades-manager.git
git branch -M main
git push -u origin main
```

### 4.4 Активирай GitHub Pages

1. Отиди на Settings на твоя repo
2. Pages (от лявото меню)
3. Source: **Deploy from a branch**
4. Branch: **main**, папка: **/ (root)**
5. Кликни "Save"

След няколко минути, сайтът ще е достъпен на:
```
https://YOUR-USERNAME.github.io/grades-manager/
```

## 🚀 Стъпка 5: Финални корекции

### 5.1 Актуализирай OAuth App callback URL

Ако GitHub Pages URL-ът е различен от очаквания:

1. Върни се на https://github.com/settings/developers
2. Редактирай OAuth App
3. Провери че **Authorization callback URL** е:
   ```
   https://YOUR-USERNAME.github.io/grades-manager/dashboard.html
   ```

### 5.2 Провери Cloudflare Worker CORS

По подразбиране worker-ът позволява всички origins (`*`). За production може да го ограничиш само до твоя GitHub Pages домейн:

В `cloudflare-worker/worker.js`, промени:
```javascript
'Access-Control-Allow-Origin': 'https://YOUR-USERNAME.github.io'
```

После redeploy:
```bash
cd cloudflare-worker
wrangler deploy
```

## ✅ Тестване

1. Отиди на `https://YOUR-USERNAME.github.io/grades-manager/`
2. Кликни "Влез с GitHub"
3. GitHub ще те попита дали разрешаваш на приложението да достъпва данните ти
4. След разрешение, ще бъдеш пренасочен към dashboard-а
5. Ще видиш своите GitHub Classroom repositories с:
   - Статус на последен commit
   - Резултати от автоматични тестове (ако има)
   - Линкове към repos

## 🔧 Troubleshooting

### "Missing authorization code" грешка

- Провери че `OAUTH_PROXY_URL` в `config.js` е правилен
- Провери че Cloudflare Worker е deploy-нат успешно

### "Invalid state parameter" грешка

- Това е CSRF защита. Изчисти browser cache и опитай отново

### Не виждам никакви assignments

Възможни причини:
1. **Нямаш GitHub Classroom repos** - нормално ако още не си получил задачи
2. **Repo pattern не match-ва** - промени `ASSIGNMENT_REPO_PATTERN` в `config.js`
3. **Organization filter** - ако си задал `GITHUB_CLASSROOM_ORG`, премахни го или провери името

За debug, отвори Browser Console (F12) и виж logs.

### GitHub API rate limit

GitHub API има лимити:
- **Authenticated requests:** 5,000/hour (достатъчно!)
- Ако превишиш лимита, изчакай или използвай друг token

## 📝 Персонализация

### Промяна на цветове

Редактирай `css/style.css` - CSS variables в `:root`:
```css
:root {
  --bg-primary: #ffffff;
  --info: #0969da;
  /* и т.н. */
}
```

### Промяна на filtering логика

Редактирай `config.js`:
```javascript
// Покажи само repos от конкретна organization
GITHUB_CLASSROOM_ORG: 'my-classroom-org',

// Покажи само repos с определен naming pattern
ASSIGNMENT_REPO_PATTERN: /^assignment-.*$/,
```

### Добавяне на още информация

Редактирай:
- `js/github-api.js` - добави нови API calls
- `js/dashboard.js` - промени как се показват данните
- `dashboard.html` - добави нови секции

## 🔒 Security & Privacy

### Какво е безопасно?

✅ **Client ID** - публичен, може да е в кода
✅ **Access Token** - съхранява се САМО в localStorage на студента
✅ **GitHub API** - автоматично връща само данни на logged-in user

### Какво е чувствително?

❌ **Client Secret** - НИКОГА в кода! Само в Cloudflare Worker secrets
❌ **Access Tokens на други хора** - невъзможно да достъпиш

### Privacy

- Всеки студент вижда САМО своите repos
- GitHub API автоматично филтрира по authenticated user
- Cloudflare Worker не логва tokens
- Без centralized база данни

## 🎓 Как да използват студентите?

1. Отиди на `https://YOUR-USERNAME.github.io/grades-manager/`
2. Кликни "Влез с GitHub"
3. Разреши достъп
4. Виж своите задачи!

**Студентите НЕ трябва да правят нищо специално** - само GitHub акаунт.

## 📚 Допълнителни ресурси

- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [GitHub Pages Guide](https://docs.github.com/en/pages)

## 🐛 Bug Reports

Ако намериш проблем, отвори issue в този repo или се свържи с мен.

---

**Готово!** 🎉 Dashboard-ът е готов за използване!
