const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const platform = process.platform;
const arch = process.arch;
const extension = platform === 'win32' ? '.dll' : platform === 'darwin' ? '.dylib' : '.so';
const manifestPath = path.join(__dirname, '..', 'crates', 'c-cpp-pro-native', 'Cargo.toml');
const destinationDir = path.join(__dirname, '..', 'native', `${platform}-${arch}`);
const destinationPath = path.join(destinationDir, 'c_cpp_pro_native.node');
const fallbackDir = path.join(__dirname, '..', 'native');
const fallbackPath = path.join(fallbackDir, 'c_cpp_pro_native.node');

if (process.env.SKIP_NATIVE_BUILD !== '1' && process.env.SKIP_NATIVE_BUILD !== 'true') {
  childProcess.execFileSync('cargo', ['build', '--release', '--manifest-path', manifestPath], {
    stdio: 'inherit'
  });
}

const possibleFilenames = [
  platform === 'win32' ? `c_cpp_pro_native${extension}` : `libc_cpp_pro_native${extension}`,
  `libc_cpp_pro_native${extension}`,
  `c_cpp_pro_native${extension}`
];

function findSourceBinary() {
  const searchDirs = [
    path.join(__dirname, '..', 'target', 'release'),
    path.join(__dirname, '..', 'crates', 'c-cpp-pro-native', 'target', 'release')
  ];

  const targetDir = path.join(__dirname, '..', 'target');
  if (fs.existsSync(targetDir)) {
    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'release' && entry.name !== 'debug') {
        searchDirs.push(path.join(targetDir, entry.name, 'release'));
      }
    }
  }

  const cratesTargetDir = path.join(__dirname, '..', 'crates', 'c-cpp-pro-native', 'target');
  if (fs.existsSync(cratesTargetDir)) {
    const entries = fs.readdirSync(cratesTargetDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'release' && entry.name !== 'debug') {
        searchDirs.push(path.join(cratesTargetDir, entry.name, 'release'));
      }
    }
  }

  for (const dir of searchDirs) {
    for (const name of possibleFilenames) {
      const fullPath = path.join(dir, name);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
  }

  if (fs.existsSync(destinationPath)) {
    return destinationPath;
  }
  if (fs.existsSync(fallbackPath)) {
    return fallbackPath;
  }

  return null;
}

const sourcePath = findSourceBinary();

if (!sourcePath) {
  throw new Error(`Native build completed but did not produce any valid binary for platform '${platform}' (${possibleFilenames.join(', ')}).`);
}

fs.mkdirSync(destinationDir, { recursive: true });
if (sourcePath !== destinationPath) {
  fs.copyFileSync(sourcePath, destinationPath);
}
if (sourcePath !== fallbackPath) {
  fs.copyFileSync(sourcePath, fallbackPath);
}
console.log(`Native addon staged at ${destinationPath} and ${fallbackPath}`);

