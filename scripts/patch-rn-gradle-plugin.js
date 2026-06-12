const fs = require('fs');
const path = require('path');

const pluginDir = path.join(__dirname, '../node_modules/@react-native/gradle-plugin');

if (!fs.existsSync(pluginDir)) {
  console.log('[patch-rn-gradle-plugin] directory not found, skipping');
  process.exit(0);
}

const TARGET_KOTLIN = '2.2.21';
const KOTLIN_VERSION_RE = /2\.0\.\d+/g;

function patchFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!KOTLIN_VERSION_RE.test(content)) {
    KOTLIN_VERSION_RE.lastIndex = 0;
    return;
  }
  KOTLIN_VERSION_RE.lastIndex = 0;
  const updated = content.replace(KOTLIN_VERSION_RE, TARGET_KOTLIN);
  fs.writeFileSync(filePath, updated);
  console.log('[patch-rn-gradle-plugin] patched', path.relative(process.cwd(), filePath));
}

const EXTENSIONS = new Set(['.kts', '.gradle', '.toml', '.properties']);

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (EXTENSIONS.has(path.extname(entry.name)) || entry.name === 'build.gradle') {
      console.log('[patch-rn-gradle-plugin] checking', path.relative(process.cwd(), full));
      patchFile(full);
    }
  }
}

walk(pluginDir);
console.log('[patch-rn-gradle-plugin] done');
