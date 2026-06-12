#!/bin/bash
set -e

echo "[patch] Looking for gradle-wrapper.properties in react-native template..."

# expo prebuild copies this template file to android/gradle/wrapper/gradle-wrapper.properties
# Patching it here (before prebuild runs) ensures the correct Gradle version is used
TEMPLATE_WRAPPER="node_modules/react-native/template/android/gradle/wrapper/gradle-wrapper.properties"

if [ -f "$TEMPLATE_WRAPPER" ]; then
  echo "[patch] Found: $TEMPLATE_WRAPPER"
  echo "[patch] Before:"
  cat "$TEMPLATE_WRAPPER"
  sed -i 's|gradle-[0-9][0-9.]*-bin\.zip|gradle-8.13-bin.zip|g' "$TEMPLATE_WRAPPER"
  sed -i 's|gradle-[0-9][0-9.]*-all\.zip|gradle-8.13-bin.zip|g' "$TEMPLATE_WRAPPER"
  echo "[patch] After:"
  cat "$TEMPLATE_WRAPPER"
else
  echo "[patch] Template not found at expected path, searching..."
  find node_modules/react-native -name "gradle-wrapper.properties" 2>/dev/null | while read -r f; do
    echo "[patch] Found: $f"
    sed -i 's|gradle-[0-9][0-9.]*-bin\.zip|gradle-8.13-bin.zip|g' "$f"
    sed -i 's|gradle-[0-9][0-9.]*-all\.zip|gradle-8.13-bin.zip|g' "$f"
    echo "[patch] Patched: $f"
    cat "$f"
  done
fi

echo "[patch] Done"
