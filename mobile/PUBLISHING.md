# Publishing Manus AI Mobile App to Google Play Store

This guide walks you through building and publishing your React Native mobile app to the Google Play Store using Expo Application Services (EAS).

## Prerequisites

1. **Google Play Console Account**
   - Sign up at https://play.google.com/console
   - Pay the one-time $25 registration fee
   - Complete account verification

2. **Expo Account**
   - Create a free account at https://expo.dev
   - You'll need this for EAS builds

3. **EAS CLI Installed**
   ```bash
   npm install -g eas-cli
   ```

## Step 1: Login to Expo

```bash
eas login
```

Enter your Expo account credentials when prompted.

## Step 2: Configure Your Project

The project is already configured with:
- ✅ `eas.json` - Build profiles (development, preview, production)
- ✅ `app.json` - App metadata and Android package name
- ✅ Android package: `com.manusai.mobile`

## Step 3: Build for Testing (APK)

First, create a preview build to test on your device:

```bash
cd /home/ubuntu/manus_replica/mobile
eas build --platform android --profile preview
```

This will:
1. Upload your code to Expo servers
2. Build an APK file
3. Provide a download link when complete (~10-20 minutes)

Download the APK and install it on your Android device to test.

## Step 4: Build for Play Store (AAB)

Once testing is complete, build the production version:

```bash
eas build --platform android --profile production
```

This creates an **Android App Bundle (AAB)** file optimized for Play Store submission.

**Important:** The first time you run this, EAS will ask if you want it to generate signing credentials. Choose **Yes** - EAS will create and manage your keystore securely.

## Step 5: Prepare Play Store Listing

While the build is running, prepare your Play Store listing:

### Required Assets

1. **App Icon** (512x512 PNG)
   - High-resolution version of your app icon
   - No transparency, no rounded corners

2. **Feature Graphic** (1024x500 PNG or JPG)
   - Banner image for your store listing

3. **Screenshots** (At least 2, max 8)
   - Phone: 1080x1920 or 1080x2340
   - Tablet: 1200x1920 (optional)
   - Take screenshots of all 5 screens (Home, Dashboard, Agents, Training, Memory)

4. **App Description**
   - Short description (80 characters max)
   - Full description (4000 characters max)

### Example Description

**Short:**
```
AI-powered task assistant with autonomous agents, memory, and learning capabilities
```

**Full:**
```
Manus AI is a comprehensive AI task assistant platform that brings the power of autonomous agents to your mobile device.

KEY FEATURES:
• Task Submission - Describe any task and let AI agents handle it
• Quick Actions - Create slides, websites, apps, and designs with one tap
• Mirror Agents - Self-learning AI agents that debate and refine knowledge
• Training System - Provide feedback to improve agent performance
• Memory Management - Context-aware AI that remembers your preferences
• Real-time Updates - Stay informed about task progress and results

POWERED BY:
• GPT-4o for intelligent task processing
• Agent-S for GUI automation
• Advanced memory system for context retention
• Automated training pipeline for continuous improvement

Whether you need to create presentations, build websites, generate designs, or execute complex tasks, Manus AI provides an intelligent assistant that learns and improves over time.

Perfect for professionals, creators, and anyone who wants to leverage AI for productivity.
```

## Step 6: Create Play Store Listing

1. Go to https://play.google.com/console
2. Click **Create app**
3. Fill in:
   - App name: **Manus AI**
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free
4. Accept declarations and click **Create app**

## Step 7: Complete Store Listing

Navigate through the left sidebar and complete:

### 1. Main Store Listing
- Upload icon, feature graphic, screenshots
- Add descriptions
- Choose category: **Productivity**
- Add contact email

### 2. Privacy Policy
- Required for all apps
- Host your privacy policy online and provide the URL
- Example: https://yourdomain.com/privacy

### 3. App Content
- Target age: 18+
- Content rating questionnaire
- Ads declaration: Choose based on your app
- Data safety: Declare what data you collect

### 4. Countries/Regions
- Select where to distribute (e.g., All countries)

## Step 8: Upload Your App Bundle

1. In Play Console, go to **Production** → **Create new release**
2. Download your AAB file from EAS build (check email or dashboard)
3. Upload the AAB file
4. Add release notes:
   ```
   Initial release of Manus AI mobile app
   
   Features:
   - AI-powered task submission
   - Quick action buttons for common tasks
   - Task history and results dashboard
   - Mirror agents monitoring
   - Training feedback system
   - Memory management
   ```
5. Click **Save** and then **Review release**

## Step 9: Submit for Review

1. Complete all required sections (checklist in Play Console)
2. Click **Start rollout to Production**
3. Confirm submission

**Review time:** Usually 1-3 days, can take up to 7 days.

## Step 10: Automated Submissions (Optional)

For future updates, you can automate submission:

1. **Create a Google Cloud Service Account:**
   - Go to https://console.cloud.google.com
   - Create a new project or select existing
   - Enable Google Play Android Developer API
   - Create service account with Play Console access
   - Download JSON key file

2. **Save the key file:**
   ```bash
   # Save as google-service-account.json in mobile directory
   # DO NOT commit this file to git!
   ```

3. **Submit automatically:**
   ```bash
   eas submit --platform android --profile production
   ```

## Updating Your App

When you make changes:

1. **Update version in app.json:**
   ```json
   {
     "expo": {
       "version": "1.0.1",  // Increment this
       "android": {
         "versionCode": 2   // Increment this
       }
     }
   }
   ```

2. **Build new version:**
   ```bash
   eas build --platform android --profile production
   ```

3. **Upload to Play Console or use automated submission**

## Troubleshooting

### Build fails with "Invalid keystore"
- Delete credentials: `eas credentials`
- Regenerate: Run build again and choose "Generate new keystore"

### "Package name already exists"
- Change package name in app.json
- Update in Play Console if already created

### App rejected for policy violations
- Review Google Play policies: https://play.google.com/about/developer-content-policy/
- Common issues: Missing privacy policy, inappropriate content, misleading descriptions

### Build takes too long
- Builds typically take 10-20 minutes
- Check status: `eas build:list`
- View logs: Click build link in terminal

## Cost Information

- **EAS Build:** Free tier includes limited builds/month, paid plans available
- **Play Store:** $25 one-time registration fee
- **Hosting:** You need to host your backend (current sandbox URL won't work in production)

## Production Checklist

Before publishing:

- [ ] Test APK on multiple devices
- [ ] Verify backend API is accessible from mobile networks
- [ ] Update API URL to production backend (not sandbox)
- [ ] Test all features (task submission, agents, training, memory)
- [ ] Prepare all Play Store assets (icon, screenshots, descriptions)
- [ ] Create privacy policy
- [ ] Set up crash reporting (optional: Sentry, Bugsnag)
- [ ] Set up analytics (optional: Google Analytics, Mixpanel)
- [ ] Review Google Play policies
- [ ] Test on different Android versions

## Support

- **EAS Documentation:** https://docs.expo.dev/eas/
- **Play Console Help:** https://support.google.com/googleplay/android-developer
- **Expo Forums:** https://forums.expo.dev/

## Next Steps After Publishing

1. **Monitor reviews** - Respond to user feedback in Play Console
2. **Track metrics** - Monitor installs, crashes, ratings
3. **Iterate** - Release updates based on user feedback
4. **Marketing** - Promote your app through social media, website, etc.

Good luck with your launch! 🚀
