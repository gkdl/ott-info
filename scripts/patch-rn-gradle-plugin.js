const fs = require('fs');
const path = require('path');

const pluginDir = path.join(__dirname, '../node_modules/@react-native/gradle-plugin');

if (!fs.existsSync(pluginDir)) {
  console.log('patch-rn-gradle-plugin: @react-native/gradle-plugin not found, skipping');
  process.exit(0);
}

function patchFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const updated = content
    .replace(/kotlin\("jvm"\)\s+version\s+"2\.0\.[^"]+"/g, 'kotlin("jvm") version "2.2.21"')
    .replace(/id\("org\.jetbrains\.kotlin\.jvm"\)\s+version\s+"2\.0\.[^"]+"/g, 'id("org.jetbrains.kotlin.jvm") version "2.2.21"')
    .replace(/(kotlinVersion\s*=\s*)"2\.0\.[^"]+"/g, '$1"2.2.21"');
  if (updated !== content) {
    fs.writeFileSync(filePath, updated);
    console.log('patch-rn-gradle-plugin: patched', path.relative(process.cwd(), filePath));
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name.endsWith('.gradle.kts') || entry.name === 'build.gradle') {
      patchFile(full);
    }
  }
}

walk(pluginDir);
console.log('patch-rn-gradle-plugin: done');
