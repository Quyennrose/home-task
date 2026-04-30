type RuntimeMode = 'local' | 'api';

const env = import.meta.env;
const apiBaseUrl = String(env.VITE_API_BASE_URL ?? '').trim();
const paymentProvider = String(env.VITE_PAYMENT_PROVIDER ?? '').trim();
const uploadProvider = String(env.VITE_UPLOAD_PROVIDER ?? '').trim();
const realtimeProvider = String(env.VITE_REALTIME_PROVIDER ?? '').trim();

export const appConfig = {
  appName: String(env.VITE_APP_NAME ?? 'HomeTask'),
  apiBaseUrl,
  runtimeMode: (apiBaseUrl ? 'api' : 'local') as RuntimeMode,
  enableDemoTools: env.VITE_ENABLE_DEMO_TOOLS === 'true' || Boolean(env.DEV),
  enableLocalReset: env.VITE_ENABLE_LOCAL_RESET === 'true' || Boolean(env.DEV),
  paymentProvider,
  uploadProvider,
  realtimeProvider,
  capabilities: {
    backend: Boolean(apiBaseUrl),
    realPayments: Boolean(paymentProvider),
    persistentUploads: Boolean(uploadProvider),
    realtimeMessaging: Boolean(realtimeProvider),
  },
};

export const isBackendConfigured = appConfig.runtimeMode === 'api';
