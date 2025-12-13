# Cloudflare Worker Setup - Quiz Results

## 📋 Стъпка 1: Създайте Worker

1. Отидете на: **https://dash.cloudflare.com/**
2. Влезте с акаунт (или създайте безплатен)
3. **Workers & Pages** → **Create Worker**
4. Име: `quiz-results-saver` (или друго име)
5. **Deploy** (за да се създаде)

---

## 📝 Стъпка 2: Deploy кода

1. След deploy → **Edit Code**
2. Изтрийте всичко в editor-а
3. Copy/paste **ЦЯЛ КОД** от `cloudflare-worker-quiz-results.js`
4. **Save and Deploy**

---

## 🔐 Стъпка 3: Configure Secrets

1. **Settings** tab на Worker-а
2. **Variables and Secrets** → **Add**

Добавете **2 environment variables**:

### Variable 1:
- **Name:** `QUIZ_RESULTS_GIST_ID`
- **Value:** `decf38f65f3a2dcd46771afec0069d06`
- **Type:** Environment Variable

### Variable 2:
- **Name:** `GITHUB_TOKEN`
- **Value:** `[вашия GitHub token с gist scope]`
- **Type:** **Secret** ⚠️ (ВАЖНО!)

3. **Save**

---

## 🌐 Стъпка 4: Копирайте Worker URL

След deploy ще получите URL:
```
https://quiz-results-saver.your-subdomain.workers.dev
```

**Копирайте този URL** - ще го сложим в config.js

---

## ✅ Test Worker-а

Може да тествате с curl:

```bash
curl -X POST https://quiz-results-saver.your-subdomain.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test-user",
    "score": 20,
    "total": 25,
    "percentage": "80.00",
    "timestamp": "2025-12-13T15:00:00.000Z",
    "timeTaken": 1200,
    "answers": []
  }'
```

Трябва да върне:
```json
{"success": true, "message": "Резултатът е запазен успешно!"}
```

---

## 🔄 Следващи стъпки

След като deploy-нете Worker-а:
1. **Копирайте Worker URL-а**
2. Дайте ми го
3. Ще обновя quiz-storage.js да го използва

---

## 💰 Цена

**Безплатно до 100,000 requests/ден** (повече от достатъчно за класна стая)

---

## 🛟 Помощ

Ако имате проблеми:
- Cloudflare Docs: https://developers.cloudflare.com/workers/
- Или ми кажете къде сте се затруднили
