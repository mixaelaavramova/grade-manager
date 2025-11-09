// Cloudflare Worker for GitHub OAuth Token Exchange
// This worker acts as a proxy to exchange OAuth code for access token
// since we cannot expose GitHub Client Secret in client-side code

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Only allow POST requests to /auth
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/auth') {
      return new Response('Not Found', { status: 404 });
    }

    try {
      // Parse request body
      const body = await request.json();
      const { code } = body;

      if (!code) {
        return jsonResponse({ error: 'Missing authorization code' }, 400);
      }

      // Exchange code for token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code: code
        })
      });

      const data = await tokenResponse.json();

      // Check for errors
      if (data.error) {
        return jsonResponse({
          error: data.error,
          error_description: data.error_description
        }, 400);
      }

      // Return the access token
      return jsonResponse({
        access_token: data.access_token,
        token_type: data.token_type,
        scope: data.scope
      });

    } catch (error) {
      console.error('Token exchange error:', error);
      return jsonResponse({
        error: 'Internal server error',
        message: error.message
      }, 500);
    }
  }
};

// Helper function for CORS
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// Helper function for JSON responses with CORS
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
