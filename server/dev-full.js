import { spawn } from 'node:child_process';
import process from 'node:process';

const env = {
  ...process.env,
  VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:8787',
  VITE_ENABLE_DEMO_TOOLS: process.env.VITE_ENABLE_DEMO_TOOLS || 'true',
  VITE_ENABLE_LOCAL_RESET: process.env.VITE_ENABLE_LOCAL_RESET || 'true',
};

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const children = [
  spawn(process.execPath, ['server/index.js'], { stdio: 'inherit', env }),
  spawn(npmCommand, ['run', 'dev:web'], { stdio: 'inherit', env, shell: process.platform === 'win32' }),
];

function shutdown(signal) {
  for (const child of children) {
    child.kill(signal);
  }
  process.exit(signal === 'SIGINT' ? 0 : 1);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

for (const child of children) {
  child.on('exit', (code) => {
    if (code && code !== 0) {
      shutdown('SIGTERM');
    }
  });
}
