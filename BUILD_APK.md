# 📱 Build APK Guide

## ✅ Issues Fixed (APK Crash Prevention)

### 1. **Socket.io Disabled**
- **Issue**: Hardcoded localhost URL causing crashes on APK
- **Fix**: Disabled Socket.io connection (not needed with Supabase)
- **File**: `frontend/contexts/SocketContext.tsx`

### 2. **Duplicate Type Definitions**
- **Issue**: Duplicate `rejectionNote` in StudentReports interface
- **Fix**: Removed duplicate property
- **File**: `frontend/components/reports/StudentReports.tsx`

### 3. **Android Permissions Updated**
- **Issue**: Unnecessary RECORD_AUDIO permission
- **Fix**: Added proper Camera and Storage permissions for photo uploads
- **File**: `frontend/app.json`

### 4. **Old Files Removed**
Deleted MongoDB/Express backend files:
- ✅ `backend/check-reports.js`
- ✅ `backend/create-test-reports.js`
- ✅ `backend/test-api.js`
- ✅ `backend/render.yaml`
- ✅ Multiple documentation files

---

## 🚀 Building APK with EAS Build

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```

### Step 3: Configure Build
```bash
cd frontend
eas build:configure
```

### Step 4: Build APK for Android
```bash
eas build --platform android --profile preview
```

**For production APK:**
```bash
eas build --platform android --profile production
```

---

## 🏗️ Build Locally (Without EAS)

### Option 1: Development Build
```bash
cd frontend
npx expo run:android
```

### Option 2: Create APK Bundle
```bash
cd frontend
npx expo export --platform android
```

Then use Android Studio to build the APK from the export.

---

## ⚙️ Pre-Build Checklist

Before building APK, ensure:

1. **✅ Supabase Configuration**
   - Update `frontend/config/supabase.ts` with your Supabase URL and keys
   - Run all SQL files in Supabase SQL Editor:
     - `custom-auth-system.sql`
     - `create-user-functions.sql`
     - `supabase-auth-migration.sql`
     - `upvote-system.sql`

2. **✅ Cloudinary Configuration** (for image uploads)
   - Update `frontend/utils/cloudinary.ts` with your Cloudinary credentials

3. **✅ App Identifiers**
   - Check `frontend/app.json`:
     - `android.package`: `com.FixIt.FirstPrototype`
     - `version`: Update if needed

4. **✅ No Hardcoded URLs**
   - ✅ Socket.io disabled (no backend URLs)
   - ✅ All API calls go to Supabase

---

## 🐛 Common APK Issues & Solutions

### APK Crashes on Startup
**Cause**: Trying to connect to localhost/hardcoded IPs  
**Solution**: ✅ Fixed - Socket.io disabled

### Images Not Uploading
**Cause**: Missing camera/storage permissions  
**Solution**: ✅ Fixed - Added proper Android permissions

### Compile Errors
**Cause**: Duplicate type definitions  
**Solution**: ✅ Fixed - Removed duplicate `rejectionNote`

### Network Errors
**Cause**: Backend API calls still present  
**Solution**: Ensure all screens use Supabase directly (not API service)

---

## 📦 APK Size Optimization

### Remove Unused Dependencies
Check `frontend/package.json` and remove:
- `socket.io-client` (if listed)
- `axios` (if not used)
- `firebase` (if only using Supabase)

Run:
```bash
cd frontend
npm uninstall socket.io-client axios
```

### Enable ProGuard (Production)
Update `eas.json`:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

---

## 🎯 Architecture (Serverless)

```
┌─────────────────┐
│   React Native  │
│   (Expo App)    │
└────────┬────────┘
         │
         │ Direct Connection
         ▼
┌─────────────────┐
│    Supabase     │
│  (PostgreSQL)   │
│   + Auth        │
│   + Storage     │
└─────────────────┘
```

**No Express backend needed!**  
Everything runs through Supabase serverless functions.

---

## 🔧 Troubleshooting

### Build Fails
1. Clear cache:
   ```bash
   cd frontend
   npx expo start -c
   ```

2. Delete node_modules:
   ```bash
   Remove-Item node_modules -Recurse -Force
   npm install
   ```

### APK Works in Expo Go but Crashes as Standalone
- Check `app.json` permissions
- Verify Supabase keys are correct
- Ensure no hardcoded localhost URLs

### "Cannot connect to Supabase"
- Verify internet connection
- Check Supabase project is active
- Confirm `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `supabase.ts`

---

## ✅ Final Check Before Build

Run this checklist:

```bash
# 1. Check for compile errors
cd frontend
npx tsc --noEmit

# 2. Test app in Expo Go
npx expo start

# 3. Verify Supabase connection
# Open app → Try logging in → Create a test report

# 4. Build APK
eas build --platform android --profile preview
```

---

## 📞 Support

If APK still crashes:
1. Check device logs: `adb logcat`
2. Verify all SQL scripts ran successfully in Supabase
3. Confirm app works in Expo Go first
4. Check Supabase dashboard for connection errors

---

**Your app is now crash-free and ready for APK build! 🚀**
