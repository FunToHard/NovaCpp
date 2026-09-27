const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const platform = process.platform;
const arch = process.arch;
const extension = platform === 'win32' ? '.dll' : platform === 'darwin' ? '.dylib' : '.so';
const crateName = `c_cpp_pro_native${extension}`;
const manifestPath = path.join(__dirname, '..', 'crates', 'c-cpp-pro-native', 'Cargo.toml');
const sourcePath = path.join(__dirname, '..', 'target', 'release', crateName);
const destinationDir = path.join(__dirname, '..', 'native', `${platform}-${arch}`);
const destinationPath = path.join(destinationDir, 'c_cpp_pro_native.node');

childProcess.execFileSync('cargo', ['build', '--release', '--manifest-path', manifestPath], {
  stdio: 'inherit'
});

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Native build completed but did not produce ${sourcePath}.`);
}

fs.mkdirSync(destinationDir, { recursive: true });
fs.copyFileSync(sourcePath, destinationPath);
console.log(`Native addon staged at ${destinationPath}`);
