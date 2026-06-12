#!/bin/bash
set -e

PLUGIN_DIR="node_modules/@react-native/gradle-plugin"

if [ ! -d "$PLUGIN_DIR" ]; then
  echo "[patch] @react-native/gradle-plugin not found, skipping"
  exit 0
fi

echo "[patch] Patching @react-native/gradle-plugin Kotlin version to 2.2.21..."

find "$PLUGIN_DIR" \( -name "*.gradle.kts" -o -name "*.gradle" -o -name "*.toml" -o -name "*.properties" \) | while read -r f; do
  if grep -q "2\.0\." "$f" 2>/dev/null; then
    echo "[patch] Patching: $f"
    sed -i 's/2\.0\.[0-9][0-9]*/2.2.21/g' "$f"
  fi
done

echo "[patch] Done"
