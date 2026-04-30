import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

const requiredFiles = [
  'src/app/App.tsx',
  'src/app/routes.tsx',
  'src/app/utils/localApi.ts',
  'src/app/services/apiClient.ts',
  'src/app/pages/LoginPage.tsx',
  'src/app/pages/HomePage.tsx',
  'docs/app-preview.png',
];

for (const file of requiredFiles) {
  assert(existsSync(join(root, file)), `Missing required file: ${file}`);
}

const app = read('src/app/App.tsx');
assert(app.includes('<AuthProvider>'), 'App must wrap routes with AuthProvider.');
assert(app.includes('<RouterProvider'), 'App must render RouterProvider.');

const routes = read('src/app/routes.tsx');
for (const route of ['helper/jobs', 'helper/profile', 'admin/applications', 'admin/bookings', 'admin/audit-logs']) {
  assert(routes.includes(route), `Missing route: ${route}`);
}

const localApi = read('src/app/utils/localApi.ts');
assert(localApi.includes('isBackendConfigured') && localApi.includes('apiRequest'), 'localApi must support API mode.');
assert(localApi.includes('createBooking') && localApi.includes('getAllStoredBookings'), 'localApi must keep the browser local-mode fallback.');

const apiClient = read('src/app/services/apiClient.ts');
assert(apiClient.includes('Authorization'), 'API client must attach authorization headers.');
assert(apiClient.includes('getApiErrorMessage'), 'API client must expose user-facing error mapping.');

const preview = statSync(join(root, 'docs/app-preview.png'));
assert(preview.size > 50_000, 'README preview image looks too small or missing content.');

console.log(JSON.stringify({
  frontendSmoke: true,
  checkedFiles: requiredFiles.length,
  previewBytes: preview.size,
}, null, 2));
