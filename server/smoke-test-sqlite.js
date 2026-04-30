process.env.HOMETASK_DB_DRIVER = process.env.HOMETASK_DB_DRIVER || 'sqlite';
await import('./smoke-test.js');
