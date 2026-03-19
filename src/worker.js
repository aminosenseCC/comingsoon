const COOKIE_NAME = "as_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const PASSWORD = "Amin0Sense!2026";

function hashPassword(password) {
  let hash = 0;
  const str = "as_salt_2026_" + password;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return "v1_" + Math.abs(hash).toString(36);
}

function loginPage(error) {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AminoSense — Login</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#f8f9fb;min-height:100vh;display:flex;align-items:center;justify-content:center}
.card{background:#fff;border:1px solid #d8dbe3;border-radius:12px;padding:40px;width:100%;max-width:380px;box-shadow:0 4px 24px rgba(0,0,0,.06)}
.logo-fallback{font-size:22px;font-weight:700;color:#1a1d26;text-align:center;margin-bottom:28px}
.logo-fallback span{color:#c5382a}
h2{font-size:16px;font-weight:600;color:#1a1d26;margin-bottom:6px;text-align:center}
p{font-size:13px;color:#5a6070;margin-bottom:20px;text-align:center}
.err{background:#fef2f2;border:1px solid #fecaca;color:#dc2626;font-size:12px;font-weight:500;padding:8px 12px;border-radius:6px;margin-bottom:16px;text-align:center}
label{font-size:11px;color:#5a6070;font-weight:600;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:4px}
input[type=password]{width:100%;padding:10px 14px;border:1px solid #d8dbe3;border-radius:6px;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;transition:border .15s}
input[type=password]:focus{border-color:#c5382a}
button{width:100%;padding:11px;background:#c5382a;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;margin-top:16px;transition:background .15s;font-family:'DM Sans',sans-serif}
button:hover{background:#e04535}
</style>
</head>
<body>
<div class="card">
<div class="logo-fallback">amino<span>sense</span></div>
<h2>Revenue Dashboard</h2>
<p>Enter the password to continue</p>
${error ? '<div class="err">Incorrect password. Please try again.</div>' : ''}
<form method="POST">
<label>Password</label>
<input type="password" name="password" autofocus required placeholder="Enter password">
<button type="submit">Sign In</button>
</form>
</div>
</body>
</html>`,
    {
      status: error ? 401 : 200,
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    }
  );
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
  return match ? match[1] : null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const ext = url.pathname.split(".").pop().toLowerCase();
    const publicExts = ["png", "jpg", "jpeg", "svg", "ico", "woff", "woff2", "ttf", "css", "js"];
    if (publicExts.includes(ext) && !url.pathname.endsWith(".html")) {
      return env.ASSETS.fetch(request);
    }

    const password = (env && env.DASHBOARD_PASSWORD) ? env.DASHBOARD_PASSWORD : PASSWORD;
    const expectedToken = hashPassword(password);

    const token = getCookie(request, COOKIE_NAME);
    if (token === expectedToken) {
      return env.ASSETS.fetch(request);
    }

    if (request.method === "POST") {
      const formData = await request.formData();
      const submitted = formData.get("password");

      if (submitted === password) {
        const response = new Response(null, {
          status: 302,
          headers: { Location: url.pathname || "/" },
        });
        response.headers.append(
          "Set-Cookie",
          `${COOKIE_NAME}=${expectedToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`
        );
        return response;
      } else {
        return loginPage(true);
      }
    }

    return loginPage(false);
  },
};
