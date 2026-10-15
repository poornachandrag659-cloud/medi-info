'use strict';
// Cashfree Payment Gateway client (API version 2023-08-01). No SDK needed: plain HTTPS + HMAC.
const crypto = require('node:crypto');
const { HttpError, safeEq, log, PROD } = require('./util');

const ID = process.env.CASHFREE_APP_ID, SECRET = process.env.CASHFREE_SECRET_KEY;
const LIVE = (process.env.CASHFREE_ENV || 'SANDBOX').toUpperCase() === 'PRODUCTION';
const BASE = LIVE ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
const configured = !!(ID && SECRET);
// Without credentials we run a clearly-labelled MOCK gateway in development only.
const mock = !configured && !PROD;
if (!configured && PROD) throw new Error('CASHFREE_APP_ID and CASHFREE_SECRET_KEY are required in production');

async function call(path, method = 'GET', body) {
  const r = await fetch(BASE + path, {
    method, signal: AbortSignal.timeout(15000),
    headers: { 'x-client-id': ID, 'x-client-secret': SECRET, 'x-api-version': '2023-08-01', 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { log('error', 'cashfree_error', { path, status: r.status, code: j.code }); throw new HttpError(502, 'Payment provider error. Please try again.'); }
  return j;
}

async function createOrder({ orderId, amount, customer, returnUrl, notifyUrl }) {
  if (mock) return { payment_session_id: 'mock_session_' + orderId };
  return call('/orders', 'POST', {
    order_id: orderId, order_amount: Number(amount.toFixed(2)), order_currency: 'INR',
    customer_details: { customer_id: String(customer.id), customer_phone: customer.phone, customer_name: customer.name, customer_email: customer.email || undefined },
    order_meta: { return_url: returnUrl, notify_url: notifyUrl },
    order_expiry_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  });
}
// Source of truth: ask Cashfree, never trust the browser.
async function orderStatus(orderId, mockPaid) {
  if (mock) return { order_status: mockPaid ? 'PAID' : 'ACTIVE', cf_payment_id: mockPaid ? 'mock_pay_' + orderId : null };
  const o = await call('/orders/' + encodeURIComponent(orderId));
  let cf = null;
  if (o.order_status === 'PAID') {
    const pays = await call(`/orders/${encodeURIComponent(orderId)}/payments`);
    cf = (Array.isArray(pays) ? pays.find(p => p.payment_status === 'SUCCESS') : null)?.cf_payment_id || null;
  }
  return { order_status: o.order_status, amount: o.order_amount, cf_payment_id: cf && String(cf) };
}
async function refund({ orderId, refundId, amount }) {
  if (mock) return { refund_status: 'SUCCESS' };
  return call(`/orders/${encodeURIComponent(orderId)}/refunds`, 'POST', { refund_id: refundId, refund_amount: Number(amount.toFixed(2)), refund_speed: 'STANDARD' });
}
// Cashfree signs: base64(HMAC-SHA256(secret, timestamp + rawBody))
function verifyWebhook(rawBody, signature, timestamp) {
  if (!SECRET || !signature || !timestamp) return false;
  const expected = crypto.createHmac('sha256', SECRET).update(timestamp + rawBody).digest('base64');
  return safeEq(expected, signature);
}
module.exports = { createOrder, orderStatus, refund, verifyWebhook, mock, configured, LIVE };
