# 📊 Grade Manager

**Интегрирано решение за управление на оценки в GitHub Classroom**

![Status](https://img.shields.io/badge/status-ready-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🎯 Какво прави?

Това е комбинирано приложение с **два интерфейса**:

### 👨‍🏫 За преподаватели (`/`)
- **Drag & drop CSV файлове** от GitHub Classroom
- **Автоматично изчисляване на оценки** и статистики
- **Визуализация на прогреса** на студентите
- **CS50-специфична логика** за choice groups

### 👨‍🎓 За студенти (`/student/`)
- **GitHub OAuth влизане** - студентите влизат с техните GitHub акаунти
- **Преглед на задачи** - виж всички assignment repositories
- **Статус на тестове** - автоматични резултати от GitHub Actions
- **Commit history** - последни commits и дати
- **Privacy-first** - всеки вижда само своите данни

## 🚀 Quick Start

### Deployment (GitHub Pages)

**Първоначална настройка:**
```bash
# Clone repository
git clone https://github.com/mixaelaavramova/grade-manager.git
cd grade-manager

# Install dependencies
cd grade-manager
npm install

# Build
npm run build
```

**За деплой на GitHub Pages:**
1. GitHub Pages вече е конфигуриран с GitHub Actions (`.github/workflows/deploy.yml`)
2. При всеки push на `main` branch, автоматично се build-ва и deploy-ва
3. Достъп на: `https://mixaelaavramova.github.io/grade-manager/`

### За преподаватели

1. Отиди на `https://mixaelaavramova.github.io/grade-manager/`
2. Drag & drop CSV файлове от GitHub Classroom
3. Виж статистики и оценки

### За студенти

**Първо:** Преподавателят трябва да настрои OAuth (виж [SETUP.md](SETUP.md))

1. Отиди на `https://mixaelaavramova.github.io/grade-manager/student/`
2. Кликни "Влез с GitHub"
3. Виж своите задачи!

## 📁 Структура на проекта

```
grade-manager/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions за auto-deploy
├── grade-manager/              # Next.js приложение (преподаватели)
│   ├── src/
│   │   └── app/
│   │       ├── page.tsx        # Main grade manager UI
│   │       ├── layout.tsx      # App layout
│   │       └── globals.css     # Styles
│   ├── public/
│   │   └── student/            # Student dashboard (статични файлове)
│   │       ├── index.html      # Student login page
│   │       ├── dashboard.html  # Student dashboard
│   │       ├── config.js       # OAuth конфигурация
│   │       ├── js/
│   │       │   ├── auth.js     # GitHub OAuth
│   │       │   ├── github-api.js
│   │       │   └── dashboard.js
│   │       └── css/
│   │           └── style.css
│   ├── package.json
│   ├── next.config.js
│   └── tsconfig.json
├── cloudflare-worker/
│   ├── worker.js               # OAuth token exchange
│   └── wrangler.toml           # Cloudflare config
├── SETUP.md                    # Детайлни инструкции за настройка
└── README.md                   # Този файл
```

## 🛠️ Технологии

### Преподавателски dashboard:
- **Frontend:** Next.js 14, React, TypeScript
- **Styling:** Tailwind CSS
- **Hosting:** GitHub Pages
- **Build:** Static export

### Студентски dashboard:
- **Frontend:** Vanilla JavaScript, HTML, CSS
- **Auth:** GitHub OAuth 2.0
- **API:** GitHub REST API v3
- **Serverless:** Cloudflare Workers (OAuth proxy)

## 🎨 Features

### Преподавателски dashboard:

- **CSV Import:**
  - Drag & drop множество CSV файлове
  - Автоматично извличане на assignment имена
  - Автоматично определяне на max points

- **Статистики:**
  - Обща статистика (passed/total students)
  - Per-assignment статистики
  - Visualизация с цветове (зелен=100%, жълт=50-99%, червен=<50%)

- **CS50 Choice Groups:**
  - Автоматично detection на choice groups
  - Студентът трябва да има perfect score на поне 1 от група
  - Динамична визуализация на requirements

### Студентски dashboard:

- **Общ преглед:**
  - Общо задачи
  - Завършени задачи
  - Задачи в процес
  - Неуспешни задачи

- **Детайли за всяка задача:**
  - Име на assignment
  - Последен commit и дата
  - Статус на автоматични тестове (от GitHub Actions)
  - Линк към repository

## 🔒 Security & Privacy

### Какво е публично?

- HTML/CSS/JavaScript код
- GitHub OAuth Client ID
- Cloudflare Worker URL

### Какво е тайно?

- GitHub Client Secret (само в Cloudflare Worker secrets)
- Student access tokens (само в browser localStorage)

### Privacy гаранции:

- GitHub API автоматично връща само данни на logged-in user
- Невъзможно е студент А да види данни на студент Б
- Без backend база данни
- Без логване на tokens

## 📖 Документация

- **[SETUP.md](SETUP.md)** - Пълни инструкции за настройка на OAuth и deployment
- **[github-classroom-dashboard-guide.md](github-classroom-dashboard-guide.md)** - Детайлен архитектурен guide

## 🔧 Development

```bash
# Install dependencies
cd grade-manager
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Test production build locally
npm start
```

## 🚢 Deployment Checklist

- [ ] Настрой GitHub OAuth App
- [ ] Deploy Cloudflare Worker за OAuth
- [ ] Конфигурирай `grade-manager/public/student/config.js`
- [ ] Enable GitHub Pages в repo settings
- [ ] Push промени към `main` branch
- [ ] Провери deployment на `https://mixaelaavramova.github.io/grade-manager/`

## 🤝 Contributing

Contributions are welcome! Отвори issue или PR.

## 📝 License

MIT License - използвай свободно!

## 🙏 Credits

Създадено за GitHub Classroom курсове.

---

**Въпроси?** Виж [SETUP.md](SETUP.md) или отвори issue.
