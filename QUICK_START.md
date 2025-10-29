# ⚡ Quick Start - 3 Steps to Deploy

All code fixes are complete and pushed to GitHub! Just complete these 3 manual steps:

---

## Step 1️⃣: Create Profile (2 minutes)

**URL:** https://supabase.com/dashboard/project/jqcmilxgojoanqreavml/editor/sql

**Copy & Run this SQL:**
```sql
INSERT INTO public.profiles (user_id, display_name)
VALUES ('34c0fa4a-ef8a-4d69-9461-04d447b1e751', 'User')
ON CONFLICT (user_id) DO NOTHING;
```

**Expected Result:** `1 row inserted` or `0 rows affected` (if already exists)

**Fixes:** Profile loading 400 errors

---

## Step 2️⃣: Deploy Edge Functions (5 minutes)

### Option A: GitHub Auto-Deploy (Recommended)

**URL:** https://supabase.com/dashboard/project/jqcmilxgojoanqreavml/settings/integrations

1. Click **"Connect GitHub Repository"**
2. Select repository: `mhmalvi/elma`
3. Enable **"Automatic Edge Function Deployments"**
4. Select branch: `deployment-20250909-044850`
5. Done! Functions auto-deploy on every push 🎉

### Option B: Manual Deploy (Faster, but manual next time)

**URL:** https://supabase.com/dashboard/project/jqcmilxgojoanqreavml/functions

**For `ai-chat` function:**
1. Click `ai-chat` → Edit
2. Copy all content from: `I:\CYBERPUNK\Elma-v\elma\supabase\functions\ai-chat\index.ts`
3. Paste → Deploy

**For `voice-to-text` function:**
1. Click `voice-to-text` → Edit
2. Copy all content from: `I:\CYBERPUNK\Elma-v\elma\supabase\functions\voice-to-text\index.ts`
3. Paste → Deploy

**Fixes:** CORS errors blocking AI chat

---

## Step 3️⃣: Verify Environment Variables (1 minute)

**URL:** https://supabase.com/dashboard/project/jqcmilxgojoanqreavml/functions

Click **"Environment Variables"** and verify these exist:

```
✅ OPENROUTER_API_KEY=<your-key>
✅ OPENAI_API_KEY=<your-key>
✅ QDRANT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.N72wLky7_bzMR1w3t1PU26WGttyXah2MJFjO7_8Wagw
✅ QDRANT_ENDPOINT=https://b25ed547-2a16-440a-b596-687c268b1995.eu-central-1-0.aws.cloud.qdrant.io
✅ SUPABASE_URL=https://jqcmilxgojoanqreavml.supabase.co
✅ SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
✅ QDRANT_COLLECTION=elma-memories
```

**Note:** If `OPENROUTER_API_KEY` or `OPENAI_API_KEY` are missing, add them.

---

## 🧪 Test Your Deployment

After completing all 3 steps:

1. **Reload:** http://localhost:8080
2. **Check console:** Should have NO errors
3. **Send a message:** AI should respond! 🤖

---

## 🎯 Expected Results

✅ No profile 400 errors
✅ No CORS errors
✅ AI responds to messages
✅ Voice input works

---

## 🚨 Troubleshooting

**If AI still doesn't respond:**
- Check environment variables are set correctly
- Check edge function deployment logs
- Verify functions show "Active" status

**If profile still shows errors:**
- Re-run the SQL query
- Log out and back in
- Check the SQL result showed "1 row inserted"

---

## 🚀 Quick Launch

Run this to verify your setup and open all dashboard pages:
```bash
verify-deployment.bat
```

---

**Need detailed info?** See `DEPLOYMENT_GUIDE.md`
