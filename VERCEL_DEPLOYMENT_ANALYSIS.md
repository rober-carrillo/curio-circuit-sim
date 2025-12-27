# Vercel Deployment Analysis

## ✅ Can We Avoid `wokwi-elements-source`?

**YES!** We can and **should** avoid deploying `wokwi-elements-source`.

### What We Use From It
- **Pinout data** (pin coordinates) → Already extracted to `demo/src/diagram/pinout-data-corrected.ts`
- **Reference documentation** → Not needed in production

### What We Actually Need
- `@wokwi/elements` npm package (424 KB) → Visual components (Arduino, LEDs, buttons, etc.)
- Our extracted pinout data (10 KB) → Pin coordinates for wire rendering

**`wokwi-elements-source` is 6.5 MB and NOT needed for deployment!**

---

## 📦 Expected Deployment Size

### Current Project Structure

```
Total Project:        185 MB  (includes dev dependencies + source repo)
├─ node_modules:      158 MB  (dev + prod dependencies)
├─ wokwi-elements:    6.5 MB  ❌ NOT NEEDED
├─ demo:             232 KB  ✅ Your app
└─ src (avr8js):     368 KB  ✅ Simulator library
```

### What Gets Deployed to Vercel

Vercel **only deploys**:
1. **Build output** (`demo/dist/` after `npm run build`)
2. **Production dependencies** (from `package.json`)

**After Build (Production):**

```
Build Output (dist/):     ~2-3 MB
├─ JavaScript bundles:    ~1.8 MB (minified + gzipped: ~500 KB)
│  ├─ avr8js:             ~200 KB
│  ├─ @wokwi/elements:    ~400 KB
│  ├─ monaco-editor:      ~800 KB (code editor)
│  └─ Your app code:      ~400 KB
├─ HTML/CSS:              ~50 KB
└─ Assets (if any):       ~150 KB

Node modules (prod):      ~15 MB (server-side dependencies)
```

### Vercel Build Output (Gzipped)
- **Uncompressed**: ~2-3 MB
- **Gzipped (served to users)**: **~600-800 KB** ✅

### Vercel Limits (Free Tier)
- ✅ **Build Output**: 100 MB limit → We use ~3 MB (3%)
- ✅ **Function Size**: 50 MB limit → Not using serverless functions yet
- ✅ **Bandwidth**: 100 GB/month → ~1 MB per page load = 100,000 users/month

---

## ⚡ Expected Compute Requirements

### Vercel Compute (Per Request)

#### Static Files (HTML, JS, CSS)
- **Compute**: **0 CPU seconds** (served from CDN)
- **Cost**: Free (included in all plans)
- **Latency**: ~20-50ms (CDN edge network)

#### Your App (Client-Side Only)
Your current implementation is **100% client-side**:
- Vite builds static files
- Browser runs the simulator (AVR8js)
- No server-side compute needed!

**Vercel Compute Used: 0 seconds** ✅

### Client-Side Compute (User's Browser)

#### AVR8js Simulator
- **CPU**: Moderate (runs in main thread or Web Worker)
- **RAM**: ~50-100 MB for simulation state
- **Performance**: 
  - ATmega328P @ 16 MHz simulation
  - ~1-5% of modern CPU (efficient!)
  - Runs at near real-time speed

#### Monaco Editor (VS Code editor)
- **CPU**: Low (idle), Moderate (typing)
- **RAM**: ~30-50 MB
- **Load Time**: ~200-300ms (lazy loaded)

#### Wokwi Visual Components
- **CPU**: Low (SVG rendering)
- **RAM**: ~10-20 MB
- **Performance**: Smooth 60fps updates

#### Audio (Buzzer)
- **CPU**: Low (~1% for Web Audio API)
- **RAM**: ~5 MB for audio context

**Total Browser Requirements:**
- **CPU**: 5-10% of modern CPU
- **RAM**: ~100-200 MB
- **Compatible with**: Any device from ~2017+

---

## 🚀 Vercel Deployment Plan

### Phase 1: Static Site (Current - MVP)
**What It Is:**
- Vite builds your app to static files
- Vercel serves from global CDN
- No backend, no databases

**Vercel Plan:** Free tier ✅
- **Build time**: ~30-60 seconds
- **Deploy time**: ~10-20 seconds
- **Bandwidth**: 100 GB/month (enough for ~100k users)
- **Builds**: Unlimited
- **Custom domain**: Included
- **SSL**: Included

**Cost:** **$0/month** 🎉

### Phase 2: Add Backend (Authentication + Storage)
**What Changes:**
- Add Vercel Serverless Functions (API routes)
- Add Vercel Postgres (database)
- Add Vercel Blob Storage (file storage)

**Compute Increases:**
- **Function executions**: ~100ms per request
- **Database queries**: ~10-50ms per query
- **File uploads/downloads**: Varies by size

**Vercel Plan:** Pro tier ($20/month)
- **Function execution**: 1,000 GB-hours/month (~2.7M invocations @ 100ms)
- **Postgres**: 256 MB storage + queries
- **Blob Storage**: 100 GB/month
- **Everything from Free tier** + more

**Cost:** **$20-50/month** (for small-medium userbase)

### Phase 3: Scale (Many Users)
**When:** 10,000+ active users

**Vercel Plan:** Enterprise (custom pricing)
- **Unlimited** function execution
- **Unlimited** bandwidth
- **Priority** support
- **Custom** SLA

**Estimated Cost:** **$100-500/month** (depends on usage)

---

## 📊 Bandwidth Calculation

### Per User Session
```
Initial Page Load:
- HTML:                    ~10 KB
- CSS:                     ~20 KB
- JavaScript (gzipped):    ~600 KB
- Monaco Editor:           ~300 KB (lazy loaded)
- Total:                   ~930 KB

Per Project Load:
- diagram.json:            ~5 KB
- .ino files:              ~10 KB
- Compilation request:     ~15 KB upload + 20 KB download (hex file)
- Total:                   ~50 KB

Average Session:
- 1 page load:             930 KB
- 5 project loads:         250 KB
- Total per session:       ~1.2 MB
```

### Monthly Usage (Free Tier: 100 GB)
```
100 GB ÷ 1.2 MB = ~83,000 sessions/month
```

**That's ~2,750 users/day assuming 1 session/user!** ✅

---

## 🎯 Recommendations

### ✅ Now (MVP - Free)
1. **Deploy current static site** to Vercel Free tier
2. **Use `hexi.wokwi.com`** for compilation (external service)
3. **No database** - users can download/upload projects as JSON
4. **No authentication** - anonymous usage

**Cost: $0/month**
**Supports: ~80,000 sessions/month**

### 🚀 Next (Authentication + Cloud Storage - $20/month)
1. **Add NextAuth.js** for authentication (Google, GitHub, Email)
2. **Add Vercel Postgres** for user data + projects
3. **Add Vercel Blob Storage** for code files + diagrams
4. **Add Vercel Functions** for API endpoints

**Cost: ~$20/month**
**Supports: ~2.7M function calls/month**

### 🏢 Later (Production Scale - $100+/month)
1. **Arduino CLI** on Vercel Functions for faster compilation
2. **Redis cache** for compilation results
3. **WebSocket** for real-time collaboration
4. **Enterprise tier** for unlimited scaling

---

## 📝 Files NOT Needed for Deployment

### Definitely Remove:
```
wokwi-elements-source/     6.5 MB  ❌
benchmark/                 50 KB   ❌
*.md (docs)                100 KB  ❌
test-*.html/js             20 KB   ❌
.git/                      varies  ❌ (Vercel clones, but doesn't deploy)
```

### Keep:
```
demo/                      232 KB  ✅
src/ (avr8js)             368 KB  ✅
node_modules/@wokwi/       424 KB  ✅
package.json               10 KB   ✅
vite.config.js            2 KB    ✅
```

### Add `.vercelignore`:
```
wokwi-elements-source/
benchmark/
*.md
!README.md
test-*.html
test-*.js
INVESTIGATION_ANALYSIS.md
CONCEPTS_EXPLAINED.md
DEPLOYMENT_STRUCTURE.md
VERCEL_DEPLOYMENT_ANALYSIS.md
```

---

## 🎉 Summary

| Aspect | Value |
|--------|-------|
| **Deployment Size** | ~3 MB (uncompressed) |
| **Served to Users** | ~800 KB (gzipped) |
| **Compute (Static)** | 0 seconds (CDN) |
| **Compute (Client)** | 5-10% CPU (user's browser) |
| **Vercel Plan (MVP)** | Free ($0/month) |
| **Vercel Plan (Production)** | Pro ($20/month) |
| **Bandwidth (Free)** | 100 GB = ~80k users/month |
| **Need wokwi-elements-source?** | **NO** ❌ |

**Ready to deploy!** 🚀


