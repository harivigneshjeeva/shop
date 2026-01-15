# Quick Auth Setup

## Problem: Login page stuck on "Signing in..."

This means you haven't created a user in Supabase yet.

## Solution: Create User in Supabase

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com
2. Sign in to your account
3. Select your project

### Step 2: Enable Email Authentication
1. Click **Authentication** in left sidebar
2. Click **Providers**
3. Find **Email** provider
4. Make sure it's **Enabled** (toggle should be green)
5. Click **Save** if you made changes

### Step 3: Create a User
1. Click **Authentication** in left sidebar
2. Click **Users**
3. Click **Add User** button (top right)
4. Choose **Create new user**
5. Enter:
   - **Email:** `owner@mrservices.com` (or any email)
   - **Password:** `Password123!` (or any strong password)
   - **Auto Confirm User:** ✅ Check this box
6. Click **Create User**

### Step 4: Test Login
1. Go back to http://localhost:3000/auth/login
2. Enter the email and password you just created
3. Click **Sign In**
4. You should be redirected to the dashboard

---

## Alternative: Bypass Auth for Development

If you want to skip authentication temporarily:

### Option 1: Rename middleware.ts
```bash
# In project root
ren middleware.ts middleware.ts.bak
```

Then restart the dev server. You can access `/dashboard` directly.

### Option 2: Comment out middleware
Open `middleware.ts` and comment out the redirect:

```typescript
export async function middleware(req: NextRequest) {
  // Temporarily disabled for development
  return NextResponse.next();
}
```

---

## Troubleshooting

**Error: "Invalid login credentials"**
- User doesn't exist in Supabase
- Email/password is incorrect
- Email provider not enabled

**Error: "Email not confirmed"**
- Check "Auto Confirm User" when creating user
- Or click the confirmation link in email

**Still stuck on "Signing in..."**
- Check browser console (F12) for errors
- Verify NEXT_PUBLIC_SUPABASE_URL in .env.local
- Verify NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
- Restart dev server after changing .env

**Check Console Errors:**
1. Press F12 in browser
2. Go to Console tab
3. Look for red error messages
4. Share the error for help

---

## Verify Environment Variables

Check your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Get these from:
Supabase Dashboard → Settings → API

---

## Quick Test

After creating user, test with:
- Email: `owner@mrservices.com`
- Password: `Password123!`

If it works, you'll see the dashboard!
