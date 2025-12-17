# Quick Start: Build & Publish to Play Store

## Prerequisites
- ✅ EAS CLI installed globally
- ✅ Expo account (create at https://expo.dev)
- ✅ Google Play Console account ($25 one-time fee)

## Step 1: Login to Expo

```bash
eas login
```

## Step 2: Build Preview APK (for testing)

```bash
cd /home/ubuntu/manus_replica/mobile
eas build --platform android --profile preview
```

- Build takes ~10-20 minutes
- You'll get a download link when complete
- Install APK on your Android device to test

## Step 3: Build Production AAB (for Play Store)

```bash
eas build --platform android --profile production
```

- First time: EAS will ask to generate signing credentials → Choose **Yes**
- Creates an Android App Bundle (AAB) file
- Download the AAB when build completes

## Step 4: Upload to Play Store

1. Go to https://play.google.com/console
2. Create new app or select existing
3. Go to **Production** → **Create new release**
4. Upload the AAB file
5. Add release notes
6. Submit for review

## Important Notes

### Before Publishing:
- Update `API_URL` in `mobile/lib/trpc.ts` to your production backend
- Current URL points to sandbox (will not work after deployment)
- Test the APK thoroughly on real devices

### Required Play Store Assets:
- App icon (512x512 PNG)
- Feature graphic (1024x500 PNG)
- At least 2 screenshots (1080x1920)
- Privacy policy URL
- App description

### Version Updates:
Edit `mobile/app.json`:
```json
{
  "expo": {
    "version": "1.0.1",  // Increment for updates
    "android": {
      "versionCode": 2   // Must increment for each release
    }
  }
}
```

## Troubleshooting

**Build fails?**
```bash
eas build:list  # Check build status
```

**Need to regenerate credentials?**
```bash
eas credentials
```

**Check build logs:**
- Click the build URL in terminal
- View detailed logs in Expo dashboard

## Full Documentation

See `PUBLISHING.md` for complete step-by-step guide with screenshots, asset requirements, and troubleshooting.

## Cost Summary

- **EAS Build:** Free tier available (limited builds/month)
- **Play Store:** $25 one-time registration
- **Backend Hosting:** Required for production (sandbox won't work)

## Next Steps

1. Test preview APK on your device
2. Prepare Play Store assets (icon, screenshots, description)
3. Build production AAB
4. Create Play Store listing
5. Upload and submit for review

Review typically takes 1-3 days. Good luck! 🚀
