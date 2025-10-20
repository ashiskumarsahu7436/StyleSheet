# 🚀 StyleSheet App - Complete Setup Guide

## Google OAuth + Google Drive + Render Deployment

Yeh complete guide hai StyleSheet app ko setup karne ke liye Google Authentication aur Google Drive integration ke saath.

---

## 📋 **Step 1: Google Cloud Console Setup**

### **1.1 Create Google Cloud Project**

1. **Google Cloud Console** pe jao: https://console.cloud.google.com/
2. **New Project** click karo
3. Project name daalo: `StyleSheet App` (ya koi bhi naam)
4. **Create** click karo

### **1.2 Enable Google Drive API**

1. Left menu mein **APIs & Services** → **Library** pe jao
2. Search karo: `Google Drive API`
3. **Google Drive API** select karo
4. **Enable** button click karo

### **1.3 Configure OAuth Consent Screen**

1. **APIs & Services** → **OAuth consent screen** pe jao
2. **External** select karo (public app ke liye)
3. **Create** click karo
4. **App information** fill karo:
   - **App name**: `StyleSheet`
   - **User support email**: Apna email
   - **Developer contact information**: Apna email
5. **Save and Continue** click karo
6. **Scopes** step skip karo (optional hai)
7. **Test users** add karo (development mein test karne ke liye)
8. **Save and Continue** click karo

### **1.4 Create OAuth Credentials**

1. **APIs & Services** → **Credentials** pe jao
2. **Create Credentials** → **OAuth Client ID** click karo
3. Application type: **Web application** select karo
4. **Name**: `StyleSheet Web Client`
5. **Authorized JavaScript origins** add karo:
   ```
   https://YOUR-REPLIT-DOMAIN.replit.dev
   https://YOUR-RENDER-APP.onrender.com
   ```
   
6. **Authorized redirect URIs** add karo:
   ```
   https://YOUR-REPLIT-DOMAIN.replit.dev/api/auth/google/callback
   https://YOUR-RENDER-APP.onrender.com/api/auth/google/callback
   ```

7. **Create** button click karo
8. **Client ID** aur **Client Secret** mil jayenge - COPY KARO! ✅

---

## 📂 **Step 2: Google Drive Folder**

Jab user pehli baar app mein sign in karega aur cloud button click karega, **automatically** ek folder banega user ke Google Drive mein:

```
📁 My Drive
  └── 📁 StyleSheet Files  ← Yahan saari files save hongi
       ├── 📄 My Spreadsheet.stylesheet.json
       ├── 📄 Budget 2024.stylesheet.json
       └── 📄 Inventory.stylesheet.json
```

**Note:** Sirf yeh folder accessible hoga app ko. Baaki files safe hain!

---

## 🖥️ **Step 3: Render Deployment**

### **3.1 Create Render Account**

1. **Render.com** pe jao: https://render.com/
2. Sign up karo (GitHub se login kar sakte ho)

### **3.2 Connect GitHub Repository**

1. Apne code ko GitHub repository mein push karo
2. Render dashboard mein **New** → **Web Service** click karo
3. GitHub repository connect karo

### **3.3 Configure Web Service**

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm run start
```

**Environment Variables:**

Environment section mein yeh variables add karo:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `NODE_ENV` | `production` | Production mode |
| `GOOGLE_CLIENT_ID` | `YOUR_CLIENT_ID_HERE` | Google OAuth Client ID (Step 1.4 se) |
| `GOOGLE_CLIENT_SECRET` | `YOUR_CLIENT_SECRET_HERE` | Google OAuth Client Secret (Step 1.4 se) |
| `GOOGLE_CALLBACK_URL` | `https://your-app.onrender.com/api/auth/google/callback` | OAuth callback URL |
| `SESSION_SECRET` | `RANDOM_32_CHAR_STRING` | Session encryption key |
| `DATABASE_URL` | `(Auto-filled by Render PostgreSQL)` | Database connection string |

**Session Secret Generate Karne Ke Liye:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### **3.4 Add PostgreSQL Database**

1. Render dashboard mein **New** → **PostgreSQL** click karo
2. Database name daalo: `stylesheet-db`
3. **Create Database** click karo
4. Database create hone ke baad, **Internal Database URL** copy karo
5. Wapas Web Service mein jao → Environment → `DATABASE_URL` variable add karo

### **3.5 Deploy!**

1. **Create Web Service** click karo
2. Render automatically deploy kar dega
3. Deploy hone ke baad URL mil jayega: `https://your-app.onrender.com`

---

## ✅ **Step 4: Final Verification**

### **4.1 Update Google OAuth Redirect URIs**

1. Render se jo URL mila (e.g., `https://stylesheet-app.onrender.com`), woh copy karo
2. Google Cloud Console mein wapas jao
3. **APIs & Services** → **Credentials** → Apna OAuth Client ID edit karo
4. **Authorized redirect URIs** mein add karo:
   ```
   https://stylesheet-app.onrender.com/api/auth/google/callback
   ```
5. **Save** karo

### **4.2 Test the Application**

1. Apne deployed app ko browser mein kholo
2. **Sign in with Google** button click karo
3. Google sign-in page aayega
4. Login karne ke baad app mein aayoge
5. Kuch data bhar ke **Cloud button (☁️)** click karo
6. File name daalo aur save karo
7. Google Drive kholo → **StyleSheet Files** folder dekho
8. Aapki file wahan saved hogi! 🎉

---

## 🔍 **Troubleshooting**

### **Problem: "Google OAuth not configured"**

**Solution:** 
- Check karo `GOOGLE_CLIENT_ID` aur `GOOGLE_CLIENT_SECRET` properly set hain
- Render environment variables ko restart karne ke liye **Manual Deploy** karo

### **Problem: "Unauthorized" error on cloud save**

**Solution:**
- Logout karke wapas sign in karo
- Ensure Google Drive API enabled hai
- Check karo redirect URIs sahi hain

### **Problem: "Failed to save" error**

**Solution:**
- Check browser console for errors
- Verify user properly signed in hai
- Google Drive quota check karo (free account 15GB limit)

---

## 📊 **Architecture Overview**

```
User Browser
     ↓
   (HTTPS)
     ↓
Render Web Service (Node.js + Express)
     ├── Google OAuth 2.0 (Sign In)
     ├── Google Drive API (File Storage)
     └── PostgreSQL (User Data + Sessions)
         ↓
   Google Drive
     └── "StyleSheet Files" folder
```

---

## 🎯 **Features Summary**

✅ **Google Authentication** - Secure sign-in with Google account  
✅ **Dedicated Drive Folder** - Automatic "StyleSheet Files" folder creation  
✅ **Cloud Save/Load** - Save and load spreadsheets to/from Google Drive  
✅ **File Management** - List, open, download, delete files  
✅ **Isolated Storage** - Only app files accessible, baaki Drive safe  
✅ **Production Ready** - Deployed on Render with PostgreSQL  

---

## 📞 **Support**

Agar koi problem aaye toh:

1. **Console Logs** check karo (browser developer tools)
2. **Render Logs** check karo (Render dashboard → Logs tab)
3. **Google Cloud Logs** check karo (Console → Logging)

---

## 🔐 **Security Notes**

- ✅ Refresh tokens encrypted in database
- ✅ HTTPS-only cookies in production
- ✅ Session-based authentication
- ✅ OAuth 2.0 standard compliance
- ✅ Limited scope (only app files, not full Drive access)

---

**Made with ❤️ for StyleSheet users**
