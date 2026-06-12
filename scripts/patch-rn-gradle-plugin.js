const fs = require('fs');
const path = require('path');

// --- Patch 1: @react-native/gradle-plugin KGP version + apiVersion fix ---
const pluginDir = path.join(__dirname, '../node_modules/@react-native/gradle-plugin');

if (!fs.existsSync(pluginDir)) {
  console.log('[patch-rn-gradle-plugin] directory not found, skipping');
} else {
  const TARGET_KOTLIN = '2.2.21';
  const KOTLIN_VERSION_RE = /2\.0\.\d+/g;
  const API_VERSION_RE = /^.*apiVersion\.set\(KotlinVersion.*$/gm;

  function patchFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    if (KOTLIN_VERSION_RE.test(content)) {
      KOTLIN_VERSION_RE.lastIndex = 0;
      content = content.replace(KOTLIN_VERSION_RE, TARGET_KOTLIN);
      changed = true;
    }
    KOTLIN_VERSION_RE.lastIndex = 0;

    if (filePath.endsWith('.kts') && API_VERSION_RE.test(content)) {
      API_VERSION_RE.lastIndex = 0;
      content = content.replace(API_VERSION_RE, '');
      changed = true;
    }
    API_VERSION_RE.lastIndex = 0;

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log('[patch-rn-gradle-plugin] patched', path.relative(process.cwd(), filePath));
    }
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
        patchFile(full);
      }
    }
  }

  walk(pluginDir);
  console.log('[patch-rn-gradle-plugin] done');
}

// --- Patch 2: react-native-google-mobile-ads CodegenTypes.UnsafeObject ---
// RN 0.79 codegen doesn't recognize CodegenTypes.UnsafeObject; replace with Object
const adsDir = path.join(__dirname, '../node_modules/react-native-google-mobile-ads');

if (!fs.existsSync(adsDir)) {
  console.log('[patch-ads] react-native-google-mobile-ads not found, skipping');
} else {
  const UNSAFE_OBJECT_RE = /CodegenTypes\.UnsafeObject/g;

  function patchAdsFile(filePath) {
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      return;
    }
    if (!UNSAFE_OBJECT_RE.test(content)) {
      UNSAFE_OBJECT_RE.lastIndex = 0;
      return;
    }
    UNSAFE_OBJECT_RE.lastIndex = 0;
    const updated = content.replace(UNSAFE_OBJECT_RE, 'Object');
    fs.writeFileSync(filePath, updated);
    console.log('[patch-ads] patched', path.relative(process.cwd(), filePath));
  }

  const ADS_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

  function walkAds(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        walkAds(full);
      } else if (ADS_EXTENSIONS.has(path.extname(entry.name))) {
        patchAdsFile(full);
      }
    }
  }

  walkAds(adsDir);
  console.log('[patch-ads] done');
}

// --- Patch 3: react-native-screens accessibilityContainerViewIsModal undefined type ---
// RN 0.79 codegen fails on props with unresolved/undefined types; remove the offending prop
// Only patch codegen spec files (Native*.ts in src/specs/ directories), not component files
const screensDir = path.join(__dirname, '../node_modules/react-native-screens');

if (!fs.existsSync(screensDir)) {
  console.log('[patch-screens] react-native-screens not found, skipping');
} else {
  function patchScreensFile(filePath) {
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      return;
    }
    if (!content.includes('accessibilityContainerViewIsModal')) return;
    const updated = content
      .split('\n')
      .filter(line => !line.includes('accessibilityContainerViewIsModal'))
      .join('\n');
    fs.writeFileSync(filePath, updated);
    console.log('[patch-screens] removed accessibilityContainerViewIsModal from', path.relative(process.cwd(), filePath));
  }

  function walkScreens(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        walkScreens(full);
      } else if (
        // Only patch codegen spec files: Native*.ts or files inside src/specs/
        (entry.name.startsWith('Native') && entry.name.endsWith('.ts')) ||
        (dir.includes('specs') && entry.name.endsWith('.ts'))
      ) {
        patchScreensFile(full);
      }
    }
  }

  walkScreens(screensDir);
  console.log('[patch-screens] done');
}
