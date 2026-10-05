#!/bin/sh
set -eu
cd "$(dirname "$0")/../apps/mobile"
: "${ANDROID_HOME:=$HOME/Library/Android/sdk}"
if [ -z "${JAVA_HOME:-}" ] && [ -d "/Applications/Android Studio.app/Contents/jbr/Contents/Home" ]; then
  JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  export JAVA_HOME
fi
export ANDROID_HOME
npx expo prebuild --platform android --no-install
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a --console=plain

mkdir -p ../../../artifacts/android
cp app/build/outputs/apk/release/app-release.apk ../../../artifacts/android/paper-craft-print-0.1.0-test-ads.apk
