@echo off
echo Creating new Firebase project in the Firebase console...
echo.
echo 1. Open https://console.firebase.google.com/
echo 2. Click "Add project"
echo 3. Enter a name for your project (e.g., exam-platform)
echo 4. Follow the setup wizard to create your project
echo.
echo After creating your project:
echo.
echo 1. Click the web icon (^</^>) on the project overview page
echo 2. Register your app
echo 3. Copy the firebaseConfig object values
echo.
pause

echo.
echo Creating .env.local file for your Firebase configuration...
echo.

set /p API_KEY="Enter your Firebase API key: "
set /p AUTH_DOMAIN="Enter your Firebase Auth Domain: "
set /p PROJECT_ID="Enter your Firebase Project ID: "
set /p STORAGE_BUCKET="Enter your Firebase Storage Bucket: "
set /p MESSAGING_SENDER_ID="Enter your Firebase Messaging Sender ID: "
set /p APP_ID="Enter your Firebase App ID: "

echo # Firebase Config > %~dp0\apps\web\.env.local
echo VITE_FIREBASE_API_KEY=%API_KEY% >> %~dp0\apps\web\.env.local
echo VITE_FIREBASE_AUTH_DOMAIN=%AUTH_DOMAIN% >> %~dp0\apps\web\.env.local
echo VITE_FIREBASE_PROJECT_ID=%PROJECT_ID% >> %~dp0\apps\web\.env.local
echo VITE_FIREBASE_STORAGE_BUCKET=%STORAGE_BUCKET% >> %~dp0\apps\web\.env.local
echo VITE_FIREBASE_MESSAGING_SENDER_ID=%MESSAGING_SENDER_ID% >> %~dp0\apps\web\.env.local
echo VITE_FIREBASE_APP_ID=%APP_ID% >> %~dp0\apps\web\.env.local
echo. >> %~dp0\apps\web\.env.local
echo # Enable Firebase emulators (set to true if using emulators) >> %~dp0\apps\web\.env.local
echo VITE_USE_FIREBASE_EMULATORS=false >> %~dp0\apps\web\.env.local

echo.
echo Configuration complete! Your .env.local file has been created.
echo You can now run your application with the new Firebase configuration.
echo.
pause