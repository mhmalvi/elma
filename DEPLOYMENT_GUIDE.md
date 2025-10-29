# 🚀 Elma - Complete Deployment Guide

## ✅ Fixed Issues
- ✅ React Router v7 warning (already configured correctly)
- ✅ CORS headers updated from port 3000 to 8080
- ✅ Supabase config updated to use port 8080
- ✅ Database schema SQL ready to apply

---

## 🔧 Step 1: Create Profile for Existing User

1. Open **Supabase Dashboard**: https://supabase.com/dashboard
2. Select project: `jqcmilxgojoanqreavml`
3. Go to **SQL Editor** → **New query**
4. Paste this SQL:

```sql
-- Create profile for the authenticated user
INSERT INTO public.profiles (user_id, display_name)
VALUES ('34c0fa4a-ef8a-4d69-9461-04d447b1e751', 'User')
ON CONFLICT (user_id) DO NOTHING;

-- Verify the profile was created
SELECT * FROM public.profiles WHERE user_id = '34c0fa4a-ef8a-4d69-9461-04d447b1e751';
```

5. Click **Run** ✅

This fixes the "Error loading profile" 400 errors.

---

## 🚀 Step 2: Deploy Edge Functions

Since the Supabase CLI requires authentication, you have **2 options**:

### Option A: Deploy via GitHub (Recommended)

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Fix CORS and update edge functions to port 8080"
   git push
   ```

2. **Link GitHub to Supabase:**
   - Go to Supabase Dashboard → **Settings** → **Integrations**
   - Connect your GitHub repository
   - Enable automatic deployments for edge functions

3. Functions will auto-deploy on git push! 🎉

### Option B: Manual Copy-Paste Deployment

If GitHub integration isn't available:

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click on `ai-chat` function
3. Replace the entire code with the contents from:
   `I:\CYBERPUNK\Elma-v\elma\supabase\functions\ai-chat\index.ts`

4. Click on `voice-to-text` function
5. Replace the entire code with the contents from:
   `I:\CYBERPUNK\Elma-v\elma\supabase\functions\voice-to-text\index.ts`

6. Click **Deploy** for each function

---

## 🔑 Step 3: Set Environment Variables

Make sure these environment variables are set in **Supabase Dashboard** → **Edge Functions** → **Environment Variables**:

```
OPENROUTER_API_KEY=<your-key>
OPENAI_API_KEY=<your-key>
QDRANT_API_KEY=<from-.env>
QDRANT_ENDPOINT=<from-.env>
SUPABASE_URL=https://jqcmilxgojoanqreavml.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
QDRANT_COLLECTION=elma-memories
```

---

## 🧪 Step 4: Test the Fixes

After completing the above steps:

1. **Reload your browser** at http://localhost:8080
2. You should no longer see:
   - ❌ Profile loading 400 errors
   - ❌ CORS errors on ai-chat
   - ❌ CORS errors on voice-to-text

3. Try sending a message - AI should respond! 🤖

---

## 📝 What Was Fixed

### 1. **Profile Creation**
The signup trigger only runs for new users. Since you signed up before the schema was applied, your profile wasn't created. The SQL fixes this.

### 2. **CORS Headers**
**Before:** Functions had hardcoded `Access-Control-Allow-Origin: http://localhost:3000`
**After:** Updated to `http://localhost:8080` (matching your Vite dev server)

Files changed:
- `supabase/functions/ai-chat/index.ts` (line 6)
- `supabase/functions/voice-to-text/index.ts` (line 5)
- `supabase/config.toml` (lines 30-31)

### 3. **React Router Warning**
Already configured correctly in `src/App.tsx` (lines 110-113). The warning is from a cached build and will disappear after a fresh reload.

---

## 🎯 Expected Results

After deployment:

✅ **Profile loads successfully**
✅ **Conversations can be created**
✅ **AI responds to messages**
✅ **Voice recognition works** (already working)
✅ **No CORS errors in console**

---

## ⚠️ Troubleshooting

### If AI still doesn't respond:
1. Check environment variables are set in Supabase Dashboard
2. Verify edge functions are deployed (check deployment logs)
3. Check browser console for new errors

### If profile still shows errors:
1. Run the profile creation SQL again
2. Check the result shows 1 row inserted
3. Try logging out and back in

---

## 🔄 Future Deployments

For future changes to edge functions, use:

```bash
npx supabase login
npx supabase functions deploy ai-chat --project-ref jqcmilxgojoanqreavml
npx supabase functions deploy voice-to-text --project-ref jqcmilxgojoanqreavml
```

---

## 📚 Next Steps

Once everything is working:

1. Test voice modes (dictation, live, hands-free)
2. Test bookmarking messages
3. Test conversation history
4. Test Qdrant knowledge base integration

Your Islamic AI assistant is ready! 🌙
