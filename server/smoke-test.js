import { spawn } from 'node:child_process';
import { unlink } from 'node:fs/promises';
import process from 'node:process';

const TEST_PORT = Number(process.env.PORT || 18787 + (process.pid % 1000));
const API_URL = process.env.HOMETASK_API_URL || `http://localhost:${TEST_PORT}`;
let serverOutput = '';
const testDataFile = `server/data/smoke-${process.pid}.json`;
const testSqliteFile = `server/data/smoke-${process.pid}.sqlite`;

async function postJson(path, body, accessToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

async function patchJson(path, body, accessToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
}

async function getJson(path, accessToken) {
  const headers = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return fetch(`${API_URL}${path}`, { headers });
}

async function waitForHealth() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) {
        return;
      }
    } catch {
      // Retry while the server boots.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`API did not become healthy at ${API_URL}`);
}

async function stopServer(server) {
  if (server.exitCode !== null) {
    return;
  }

  await new Promise((resolve) => {
    const timeout = setTimeout(resolve, 1000);
    server.once('close', () => {
      clearTimeout(timeout);
      resolve();
    });
    server.kill('SIGTERM');
  });
}

async function main() {
  const server = spawn(process.execPath, ['server/index.js'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
      HOMETASK_DATA_FILE: testDataFile,
      HOMETASK_SQLITE_FILE: testSqliteFile,
    },
  });
  server.stdout.on('data', (chunk) => {
    serverOutput += chunk.toString();
  });
  server.stderr.on('data', (chunk) => {
    serverOutput += chunk.toString();
  });

  try {
    await waitForHealth();

    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@hometask.vn', password: 'admin123' }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed with ${loginResponse.status}`);
    }

    const login = await loginResponse.json();
    const bookingsResponse = await fetch(`${API_URL}/admin/bookings`, {
      headers: { Authorization: `Bearer ${login.accessToken}` },
    });

    if (!bookingsResponse.ok) {
      throw new Error(`Admin bookings failed with ${bookingsResponse.status}`);
    }

    const bookings = await bookingsResponse.json();
    const helpersResponse = await fetch(`${API_URL}/helpers`);

    if (!helpersResponse.ok) {
      throw new Error(`Helpers failed with ${helpersResponse.status}`);
    }

    const helpers = await helpersResponse.json();
    if (helpers.some((helper) => helper.passwordHash)) {
      throw new Error('Helpers endpoint leaked passwordHash');
    }

    const helperLoginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'helper.demo@hometask.vn', password: 'helper123' }),
    });

    if (!helperLoginResponse.ok) {
      throw new Error(`Helper login failed with ${helperLoginResponse.status}`);
    }

    const helperLogin = await helperLoginResponse.json();
    const meResponse = await fetch(`${API_URL}/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${helperLogin.accessToken}`,
      },
      body: JSON.stringify({ bio: helperLogin.user.bio }),
    });

    if (!meResponse.ok) {
      throw new Error(`Profile update failed with ${meResponse.status}`);
    }

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const customerAResponse = await postJson('/auth/register', {
      name: 'Customer A',
      email: `customer-a-${suffix}@example.com`,
      password: 'secret123',
      userType: 'customer',
    });

    if (!customerAResponse.ok) {
      throw new Error(`Customer A register failed with ${customerAResponse.status}`);
    }

    const customerA = await customerAResponse.json();
    const customerBResponse = await postJson('/auth/register', {
      name: 'Customer B',
      email: `customer-b-${suffix}@example.com`,
      password: 'secret123',
      userType: 'customer',
    });

    if (!customerBResponse.ok) {
      throw new Error(`Customer B register failed with ${customerBResponse.status}`);
    }

    const customerB = await customerBResponse.json();
    const invalidBookingResponse = await postJson('/bookings', { service: 'Cleaning' }, customerA.accessToken);
    if (invalidBookingResponse.status !== 400) {
      throw new Error(`Invalid booking should fail with 400, got ${invalidBookingResponse.status}`);
    }

    const bookingResponse = await postJson('/bookings', {
      helperId: '3',
      helperName: 'Chị Thu Hà',
      service: 'Dọn dẹp nhà',
      date: '2026-04-09',
      time: '09:00',
      hours: 3,
      address: 'Quận Hải Châu, Đà Nẵng',
      totalPrice: 240000,
    }, customerA.accessToken);

    if (!bookingResponse.ok) {
      throw new Error(`Booking create failed with ${bookingResponse.status}`);
    }

    const booking = await bookingResponse.json();
    const otherCustomerBookings = await fetch(`${API_URL}/bookings?customerId=${customerA.user.id}`, {
      headers: { Authorization: `Bearer ${customerB.accessToken}` },
    });
    const otherCustomerBookingsBody = await otherCustomerBookings.json();
    if (!otherCustomerBookings.ok || otherCustomerBookingsBody.some((item) => item.id === booking.id)) {
      throw new Error('Customer B could access Customer A booking list');
    }

    const forbiddenProgressResponse = await fetch(`${API_URL}/bookings/${booking.id}/progress`, {
      headers: { Authorization: `Bearer ${customerB.accessToken}` },
    });
    if (forbiddenProgressResponse.status !== 403) {
      throw new Error(`Other customer progress should fail with 403, got ${forbiddenProgressResponse.status}`);
    }

    const customerProgressPatch = await patchJson(`/bookings/${booking.id}/progress`, {
      checklist: [{ id: 'task_1', label: 'Task', completed: true }],
    }, customerA.accessToken);
    if (customerProgressPatch.status !== 403) {
      throw new Error(`Customer progress patch should fail with 403, got ${customerProgressPatch.status}`);
    }

    const helperStatusResponse = await patchJson(`/bookings/${booking.id}/status`, { status: 'confirmed' }, helperLogin.accessToken);
    if (!helperStatusResponse.ok) {
      throw new Error(`Helper status update failed with ${helperStatusResponse.status}`);
    }

    const earlyReviewResponse = await postJson('/reviews', {
      bookingId: booking.id,
      helperId: booking.helperId,
      rating: 5,
      comment: 'Good service',
      service: booking.service,
    }, customerA.accessToken);
    if (earlyReviewResponse.status !== 409) {
      throw new Error(`Early review should fail with 409, got ${earlyReviewResponse.status}`);
    }

    const completeResponse = await patchJson(`/bookings/${booking.id}/status`, { status: 'completed' }, helperLogin.accessToken);
    if (!completeResponse.ok) {
      throw new Error(`Helper complete failed with ${completeResponse.status}`);
    }

    const reviewResponse = await postJson('/reviews', {
      bookingId: booking.id,
      helperId: booking.helperId,
      rating: 5,
      comment: 'Good service',
      service: booking.service,
    }, customerA.accessToken);
    if (!reviewResponse.ok) {
      throw new Error(`Review failed with ${reviewResponse.status}`);
    }

    const duplicateReviewResponse = await postJson('/reviews', {
      bookingId: booking.id,
      helperId: booking.helperId,
      rating: 5,
      comment: 'Good service again',
      service: booking.service,
    }, customerA.accessToken);
    if (duplicateReviewResponse.status !== 409) {
      throw new Error(`Duplicate review should fail with 409, got ${duplicateReviewResponse.status}`);
    }

    const auditResponse = await getJson('/admin/audit-logs', login.accessToken);
    if (!auditResponse.ok) {
      throw new Error(`Audit log failed with ${auditResponse.status}`);
    }

    const auditLogs = await auditResponse.json();
    const auditActions = new Set(auditLogs.map((log) => log.action));
    for (const action of ['booking.created', 'booking.status_updated', 'review.created']) {
      if (!auditActions.has(action)) {
        throw new Error(`Audit logs missing ${action}`);
      }
    }

    const forbiddenAuditResponse = await getJson('/admin/audit-logs', customerA.accessToken);
    if (forbiddenAuditResponse.status !== 403) {
      throw new Error(`Non-admin audit log should fail with 403, got ${forbiddenAuditResponse.status}`);
    }

    let sawRateLimit = false;
    for (let attempt = 0; attempt < 35; attempt += 1) {
      const response = await postJson('/auth/login', {
        email: `missing-${suffix}-${attempt}@example.com`,
        password: 'wrong-password',
      });
      if (response.status === 429) {
        sawRateLimit = true;
        break;
      }
    }
    if (!sawRateLimit) {
      throw new Error('Auth login rate limit did not trigger');
    }

    console.log(JSON.stringify({
      health: true,
      user: login.user.email,
      bookings: bookings.length,
      helpers: helpers.length,
      helperProfileUpdate: true,
      validationAndOwnerGuards: true,
      auditLogs: true,
      rateLimit: true,
    }, null, 2));
  } finally {
    await stopServer(server);
    await Promise.allSettled([
      unlink(testDataFile),
      unlink(testSqliteFile),
      unlink(`${testSqliteFile}-shm`),
      unlink(`${testSqliteFile}-wal`),
    ]);
  }
}

main().catch((error) => {
  console.error(error);
  if (typeof serverOutput !== 'undefined' && serverOutput) {
    console.error(serverOutput);
  }
  process.exit(1);
});
