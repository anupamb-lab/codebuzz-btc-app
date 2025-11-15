# BP- BTC App

Welcome to **CodeBuzz BTC App** – a feature-rich React Native application designed for secure and gamified cryptocurrency mining, with seamless user authentication and a robust backend.
<p align="center">
  <img src="https://codebuzzweb.net/wp-content/uploads/2025/10/Borcelle-Studio-1.gif" alt="Banner" />
</p>

---

## 🌟 Features

- **User Authentication**: Register, login, forgot/reset password, JWT-secured sessions, bcrypt password hashing.
- **Mining Dashboard**: Simulated BTC mining experience with daily rewards and portfolio performance.
- **User Wallet**: Track and manage mining earnings.
- **Profile and Security**: Manage profile, two-factor authentication, delete account support.
- **Gamification**: Premium miners, referral systems, activity tracking.
- **Notifications**: Manage notification preferences (if implemented).
- **Cross-Platform**: Compatible with iOS and Android devices.

---

## 🚀 Architecture Overview

### 1. Frontend (React Native)

- **Navigation**: `MainTabNavigator.tsx` drives tab-based navigation for Home, Wallet, Store, Profile screens.
- **Screens**: Modular structure for all features:
  - `HomeScrrenNew.tsx`
  - `Wallet.tsx`
  - `Store.tsx`
  - `MyProfileScreen.tsx`
  - `DeleteAccount.tsx`
  - `TwoFactorScreen.tsx`
  - `AllActivity.tsx`
- **Styling**: Custom themes, gradients, image backgrounds for modern look.

### 2. Backend (Node.js, Express, MongoDB)

- User registration, login, password reset, and email integration (Gmail recommended).
- JWT authentication, bcrypt password hashing, validation, error handling.
- Security: CORS, rate limiting, security headers.
- Health check endpoints and comprehensive test suite (`test-comprehensive.js`).

**API Endpoints Overview:**
```http
POST   /api/auth/register         Register user
POST   /api/auth/login            User login
GET    /api/auth/me               Get current user (protected)
POST   /api/auth/forgotpassword   Request password reset
GET    /api/auth/logout           Logout user (protected)
GET    /api/health                Health check
```
For full endpoints, see [`src/config/api.ts`](src/config/api.ts).

### 3. Firebase (Optional: Serverless Deployment)

See [`firebase-setup-guide.md`](firebase-setup-guide.md) for deploying backend as Firebase Functions.

---

## 🏗️ Installation & Development

#### Prerequisites

- **Node.js v14+**
- **MongoDB** (local/cloud)
- **Gmail** (for email integration)

#### Steps

```bash
# Install dependencies
npm install --legacy-peer-deps

# Android build
cd android && ./gradlew clean && cd .. && \
npx react-native bundle --platform android --dev false --entry-file index.js \
--bundle-output android/app/src/main/assets/index.android.bundle \
--assets-dest android/app/src/main/res && \
cd android && ./gradlew assembleDebug

# iOS build (before Xcode archive)
npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output ios/main.jsbundle --assets-dest ios

# Run app
npx react-native run-android
```

#### Backend

```bash
# Configure .env file
MONGODB_URI=...
JWT_SECRET=...
EMAIL_USER=...
EMAIL_PASS=...

# Development
npm run dev

# Production
npm start
```

---

## 📚 Screenshots & UI Highlights

*(Add screenshots of your home/login/mining dashboard screens here)*

---

## 🧑‍💻 Contributing

1. Fork the repo & clone locally.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes.
4. Create a Pull Request.

---

## 📄 License

*No license specified.* Please request clarification if you wish to contribute or reuse.

---

## 🙋 Support

For issues or feature requests, [create a new issue](https://github.com/anupamb-lab/codebuzz-btc-app/issues).

---

## 🤝 Credits

Developed by [anupamb-lab](https://github.com/anupamb-lab).

---

## ⚙️ Project Structure

```
codebuzz-btc-app/
├── src/
│   ├── screens/
│   ├── navigation/
│   ├── config/
├── backend/
│   ├── test-comprehensive.js
│   ├── README.md
├── firebase-setup-guide.md
├── .eslintrc.js
├── README.md
...
```

---

## 💡 Future Roadmap

- Add real-time mining charts and analytics.
- Integrate push notifications.
- Enhance store and wallet features.
- Expand social/referral gamification.
- Add user support portal.

---

**Get started today and experience secure, gamified BTC mining!**
