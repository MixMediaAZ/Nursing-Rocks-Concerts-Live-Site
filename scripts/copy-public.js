const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${srcPath} -> ${destPath}`);
    }
  }
}

const publicDir = path.resolve(process.cwd(), 'public');
const distPublicDir = path.resolve(process.cwd(), 'dist', 'public');

if (fs.existsSync(publicDir)) {
  console.log('Copying public folder to dist/public...');
  copyDir(publicDir, distPublicDir);
  console.log('Public folder copied successfully!');
} else {
  console.warn('Public folder not found, skipping copy.');
}
