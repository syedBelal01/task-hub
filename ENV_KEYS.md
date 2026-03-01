# Required environment keys (.env)

Copy `.env.example` to `.env` and set these values.

---

## Required for the app to run

| Key | Description | Example |
|-----|-------------|---------|
| `MONGODB_URI` | MongoDB connection string (e.g. Atlas) | `mongodb+srv://user:pass@cluster.mongodb.net/taskhub?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret used to sign JWTs (use a long random string) | `a1b2c3d4e5f6...` (32+ chars) |
| `NEXT_PUBLIC_APP_URL` | Base URL of your app (for cookies/links) | `http://localhost:3000` |

Without these, the app will not work correctly.

---

## Optional: welcome email on signup (Gmail SMTP)

Only needed if you want to send a welcome email when users register.  
If you **don’t set these**, registration still works; no email is sent.

| Key | Description | Example |
|-----|-------------|---------|
| `SMTP_HOST` | SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | Gmail address | `yourname@gmail.com` |
| `SMTP_PASS` | Gmail **App Password** (not your normal password) | 16-char app password from Google |

**How to get a Gmail App Password**

1. Turn on 2-Step Verification for your Google account.
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords).
3. Create an app password for “Mail” and use that value for `SMTP_PASS`.

If you leave `SMTP_USER` / `SMTP_PASS` empty or use wrong values, registration will still succeed; the welcome email is skipped (and a warning is logged).

---

## Optional: Google Calendar

Only needed if you add Google Calendar OAuth and create events from tasks.

| Key | Description |
|-----|-------------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret |
| `GOOGLE_REDIRECT_URI` | Callback URL, e.g. `http://localhost:3000/api/auth/google/callback` |

---

## Summary

**Minimum to run the app:**

- `MONGODB_URI`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`

**Optional:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` for welcome emails.
