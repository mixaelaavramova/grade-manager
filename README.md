# 📚 GitHub Classroom Dashboard

**Client-side student dashboard за GitHub Classroom assignments**

![Status](https://img.shields.io/badge/status-ready-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🎯 Какво прави?

Статичен уеб dashboard, който позволява на студентите да видят своите GitHub Classroom задачи и прогрес:

- ✅ **GitHub OAuth влизане** - студентите влизат с техните GitHub акаунти
- 📝 **Преглед на задачи** - виж всички assignment repositories
- ✅ **Статус на тестове** - автоматични резултати от GitHub Actions
- 📅 **Commit history** - последни commits и дати
- 🌙 **Dark mode** - автоматична dark/light тема
- 🔒 **Privacy-first** - всеки вижда само своите данни

## 🚀 Quick Start

### За студенти:
1. Отиди на dashboard URL-а (предоставен от преподавател)
2. Кликни "Влез с GitHub"
3. Виж своите задачи!

### За преподаватели:
Виж [SETUP.md](SETUP.md) за пълни инструкции.

**Накратко:**
1. Създай GitHub OAuth App
2. Deploy Cloudflare Worker за OAuth
3. Конфигурирай `config.js`
4. Deploy на GitHub Pages

## 📁 Структура на проекта

```
grades-manager/
├── index.html              # Landing page
├── dashboard.html          # Main dashboard
├── config.js              # Configuration
├── css/
│   └── style.css          # Styles
├── js/
│   ├── auth.js            # GitHub OAuth
│   ├── github-api.js      # GitHub API client
│   └── dashboard.js       # Dashboard logic
├── cloudflare-worker/
│   ├── worker.js          # OAuth token exchange
│   └── wrangler.toml      # Cloudflare config
├── SETUP.md               # Detailed setup guide
└── README.md              # This file
```

## 🛠️ Технологии

- **Frontend:** Vanilla JavaScript, HTML, CSS
- **Auth:** GitHub OAuth 2.0
- **API:** GitHub REST API v3
- **Hosting:** GitHub Pages
- **Serverless:** Cloudflare Workers (OAuth proxy)

## 🎨 Features

### Dashboard показва:

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

### Филтриране:

Dashboard показва само repos които:
- Са owned или collaborator repos на студента
- Match-ват определен naming pattern
- (Опционално) Са от конкретна GitHub Organization

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

- **[SETUP.md](SETUP.md)** - Пълни инструкции за настройка
- **[github-classroom-dashboard-guide.md](github-classroom-dashboard-guide.md)** - Детайлен архитектурен guide

## 🤝 Contributing

Contributions are welcome! Отвори issue или PR.

## 📝 License

MIT License - използвай свободно!

## 🙏 Credits

Създадено за GitHub Classroom курсове.

---

**Въпроси?** Виж [SETUP.md](SETUP.md) или отвори issue.
