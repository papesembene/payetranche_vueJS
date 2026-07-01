import { spawnSync } from 'node:child_process';
import process from 'node:process';

const apiBaseUrl =
  process.env.VITE_MOBILE_API_BASE_URL ||
  'https://payetranche-backend.onrender.com/api';

const runNodeScript = (script, args = []) => {
  const result = spawnSync(process.execPath, [script, ...args], {
    env: {
      ...process.env,
      VITE_API_BASE_URL: apiBaseUrl
    },
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
};

runNodeScript('scripts/write-version.mjs');
runNodeScript('node_modules/vite/bin/vite.js', ['build']);
