// GitHub Classroom Dashboard Configuration
// ВАЖНО: Попълни тези стойности след като създадеш OAuth App

const CONFIG = {
  // GitHub OAuth App Client ID (публичен, може да е в кода)
  // Как да получиш: виж SETUP.md
  GITHUB_CLIENT_ID: 'YOUR_CLIENT_ID_HERE',

  // URL на Cloudflare Worker за token exchange
  // След като deploy-неш worker-а, сложи URL-а тук
  OAUTH_PROXY_URL: 'https://your-worker.your-subdomain.workers.dev/auth',

  // GitHub Organization (optional)
  // Ако искаш да филтрираш само repos от определена organization
  GITHUB_CLASSROOM_ORG: '', // Остави празно за всички repos

  // Repo naming pattern за GitHub Classroom assignments
  // Обикновено GitHub Classroom създава repos с pattern: assignment-name-username
  ASSIGNMENT_REPO_PATTERN: /^(?!.*-simple$).*$/, // Exclude repos ending with -simple

  // App URLs (автоматично се определят от window.location)
  get REDIRECT_URI() {
    return `${window.location.origin}/dashboard.html`;
  },

  get BASE_URL() {
    return window.location.origin;
  }
};

// Export за използване в други scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
