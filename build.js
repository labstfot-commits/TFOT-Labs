const fs = require('fs');
const path = require('path');

const excludeDirs = ['node_modules', '.git', 'dist'];
const excludeFiles = ['package.json', 'package-lock.json', 'build.js'];

function copyDir(src, dest) {
  if (excludeDirs.includes(path.basename(src)) || excludeFiles.includes(path.basename(src))) {
    return;
  }

  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyDir(path.join(src, file), path.join(dest, file));
    });
  } else {
    // Ensure parent dir exists for file
    const parentDir = path.dirname(dest);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

try {
  // Remove dist if exists
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // Create dist
  fs.mkdirSync('dist');

  // Copy root files and dirs
  const rootItems = fs.readdirSync('.');
  rootItems.forEach(item => {
    const src = path.join('.', item);
    if (!excludeDirs.includes(item) && !excludeFiles.includes(item)) {
      copyDir(src, path.join('dist', item));
    }
  });

  console.log('Build completed: dist/ created successfully.');
} catch (err) {
  console.error('Build failed:', err);
  process.exit(1);
}