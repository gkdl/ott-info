#!/bin/bash
set -e

echo "[patch] Starting @react-native/gradle-plugin patches..."

# Fix 1: KOTLIN_1_7 is unsupported in KGP 2.0+
# Change apiVersion from 1.7 to 1.8 in the react-native-gradle-plugin
TARGET="node_modules/@react-native/gradle-plugin/react-native-gradle-plugin/build.gradle.kts"
if [ -f "$TARGET" ]; then
  echo "[patch] Patching KOTLIN_1_7 -> KOTLIN_1_8 in $TARGET"
  sed -i 's/KotlinVersion\.KOTLIN_1_7/KotlinVersion.KOTLIN_1_8/g' "$TARGET"
  echo "[patch] Result:"
  grep -n "KOTLIN_1" "$TARGET" || echo "[patch] (no KOTLIN_ lines found)"
else
  echo "[patch] WARNING: $TARGET not found"
  find node_modules/@react-native/gradle-plugin -name "*.gradle.kts" 2>/dev/null | while read -r f; do
    if grep -q "KOTLIN_1_7" "$f"; then
      echo "[patch] Patching: $f"
      sed -i 's/KotlinVersion\.KOTLIN_1_7/KotlinVersion.KOTLIN_1_8/g' "$f"
    fi
  done
fi

# Fix 2: Patch any remaining 2.0.x kotlin version references
find node_modules/@react-native/gradle-plugin \( -name "*.gradle.kts" -o -name "*.toml" -o -name "*.properties" \) 2>/dev/null | while read -r f; do
  if grep -q "2\.0\." "$f" 2>/dev/null; then
    echo "[patch] Patching kotlin 2.0.x -> 2.2.21 in: $f"
    sed -i 's/2\.0\.[0-9][0-9]*/2.2.21/g' "$f"
  fi
done

echo "[patch] Done"
