# fake_mining_app_1


PowerShell Command (one-line) to Generate APK:

cd android ; ./gradlew clean ; cd.. ; npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res ; cd android ; ./gradlew assembleDebug

Linux/Mac: 

cd android && ./gradlew clean && cd .. && \
npx react-native bundle --platform android --dev false --entry-file index.js \
--bundle-output android/app/src/main/assets/index.android.bundle \
--assets-dest android/app/src/main/res && \
cd android && ./gradlew assembleDebug


Install Everything: npm install --legacy-peer-deps

Run Android:

windows - cd android ; ./gradlew clean ; cd ..

npx react-native run-android
