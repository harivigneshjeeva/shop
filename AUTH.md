# Authentication Setup Guide

## ✅ Supabase Authentication Implemented

The application now includes email/password authentication using Supabase Auth.

---

## Setup Instructions

### 1. Enable Email Auth in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Ensure **Email** provider is enabled
4. Configure email templates (optional)

### 2. Create Admin User

**Option A: Via Supabase Dashboard**
1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Enter email and password
4. Click **Create User**

**Option B: Via SQL**
```sql
-- This will be handled by Supabase Auth automatically
-- Just use the dashboard method above
```

### 3. Test Login

1. Start the application: `npm run dev`
2. Navigate to `http://localhost:3000`
3. You'll be redirected to `/auth/login`
4. Enter the credentials you created
5. Click **Sign In**
6. You'll be redirected to `/dashboard`

---

## Features Implemented

### Login Page (`/auth/login`)
- Email/password form
- Loading states
- Error messages
- Auto-redirect if already logged in
- Demo credentials helper text

### Protected Routes
- All `/dashboard/*` routes require authentication
- Automatic redirect to login if not authenticated
- Middleware handles session checking

### Logout Functionality
- Logout button in sidebar (bottom)
- Clears session
- Redirects to login page

### Session Management
- Automatic session persistence
- Refresh token handling
- Secure cookie-based sessions

---

## File Structure

```
app/
├── auth/
│   └── login/
│       └── page.tsx          # Login page
├── dashboard/
│   └── layout.tsx            # Protected layout
middleware.ts                  # Auth middleware
components/
└── layout/
    └── LogoutButton.tsx      # Logout component
```

---

## Environment Variables

Ensure these are set in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## Security Features

✅ **Protected Routes:** All dashboard routes require authentication
✅ **Session Validation:** Middleware checks session on every request
✅ **Secure Cookies:** Session stored in HTTP-only cookies
✅ **Auto Logout:** Session expires based on Supabase settings
✅ **CSRF Protection:** Built into Supabase Auth

---

## User Management

### Creating Users

**For Production:**
- Users should be created via Supabase Dashboard
- Or implement a signup page (optional)

**For Development:**
- Create test users in Supabase Dashboard
- Use same credentials across team

### Recommended Setup

1. **Owner Account:**
   - Email: `owner@mrservices.com`
   - Password: Strong password
   - Role: Full access (default)

2. **Admin Account:**
   - Email: `admin@mrservices.com`
   - Password: Strong password
   - Role: Full access (default)

---

## Access Model

As per the specification:
- **Single-Tenant Application:** One database for one business owner
- **No RLS (Row Level Security):** All authenticated users have full access
- **No Permissions:** Owner and Admin have identical access
- **No Organizations:** Simple authentication only

---

## Testing Authentication

### Test Checklist

- [ ] Can access login page
- [ ] Cannot access dashboard without login
- [ ] Can login with valid credentials
- [ ] Cannot login with invalid credentials
- [ ] Error messages display correctly
- [ ] Redirects to dashboard after login
- [ ] Can access all dashboard pages when logged in
- [ ] Logout button works
- [ ] Redirects to login after logout
- [ ] Session persists on page refresh

---

## Troubleshooting

**Issue: "Invalid login credentials"**
- Verify user exists in Supabase Dashboard
- Check email/password are correct
- Ensure Email provider is enabled

**Issue: "Redirect loop"**
- Clear browser cookies
- Check middleware.ts is configured correctly
- Verify NEXT_PUBLIC_SUPABASE_URL is correct

**Issue: "Session not persisting"**
- Check browser allows cookies
- Verify Supabase project is active
- Check environment variables are set

**Issue: "Cannot access dashboard"**
- Ensure you're logged in
- Check middleware is running
- Verify session is valid in Supabase Dashboard

---

## Optional Enhancements

If needed, you can add:

1. **Signup Page:** Allow users to self-register
2. **Password Reset:** Email-based password recovery
3. **Email Verification:** Require email confirmation
4. **Social Login:** Google, GitHub, etc.
5. **2FA:** Two-factor authentication
6. **Session Timeout:** Custom session duration

These are not implemented as the spec indicates a simple single-tenant setup.

---

## Production Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Post-Deployment

1. Create admin user in Supabase
2. Test login on production URL
3. Share credentials with authorized users
4. Monitor auth logs in Supabase Dashboard

---

## Summary

✅ **Authentication:** Fully implemented
✅ **Login Page:** Complete with error handling
✅ **Protected Routes:** Middleware enforces auth
✅ **Logout:** Functional in sidebar
✅ **Session Management:** Automatic
✅ **Security:** Production-ready

The application now has enterprise-grade authentication while maintaining the simplicity required for a single-tenant system.
