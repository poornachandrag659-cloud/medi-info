'use strict';
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const file = process.env.DB_FILE || path.join(__dirname, 'data', 'mediinfo.db');
if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
const db = new DatabaseSync(file);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA synchronous=NORMAL;`);

db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY, phone TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'patient' CHECK(role IN('patient','hospital','admin')),
  hospital_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS otps(
  phone TEXT PRIMARY KEY, code_hash TEXT NOT NULL, expires INTEGER NOT NULL, attempts INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS hospitals(
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, area TEXT, city TEXT DEFAULT 'Bengaluru', type TEXT,
  rating REAL DEFAULT 0, rating_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK(status IN('pending','approved','rejected','suspended')),
  depts TEXT DEFAULT '[]', phone TEXT, addr TEXT, hours TEXT, emergency INTEGER DEFAULT 0,
  pay TEXT DEFAULT 'Pay at hospital' CHECK(pay IN('Free appointment','Pay at hospital','Online payment')),
  featured INTEGER DEFAULT 0, lat REAL, lng REAL, reg_no TEXT, owner_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS doctors(
  id INTEGER PRIMARY KEY, hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL, dept TEXT NOT NULL, qual TEXT, exp INTEGER DEFAULT 0, fee INTEGER DEFAULT 0,
  rating REAL DEFAULT 0, lang TEXT DEFAULT 'English, Kannada', days TEXT DEFAULT '1,2,3,4,5,6',
  start_min INTEGER DEFAULT 540, end_min INTEGER DEFAULT 780, dur INTEGER DEFAULT 15,
  status TEXT DEFAULT 'pending' CHECK(status IN('pending','approved','suspended')));
CREATE TABLE IF NOT EXISTS appointments(
  id INTEGER PRIMARY KEY, code TEXT UNIQUE, patient_id INTEGER NOT NULL REFERENCES users(id),
  hospital_id INTEGER NOT NULL, doctor_id INTEGER NOT NULL, date TEXT NOT NULL, time TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN('PendingPayment','Confirmed','Completed','Cancelled','Rejected','Expired')),
  fee INTEGER DEFAULT 0, pay_status TEXT DEFAULT 'None' CHECK(pay_status IN('None','Unpaid','Paid','Refunded','RefundPending','Failed')),
  p_name TEXT, p_phone TEXT, p_age INTEGER, p_gender TEXT, reason TEXT, reviewed INTEGER DEFAULT 0,
  hold_until INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
-- Database-level guarantee: one active booking per doctor/date/time (no double booking, even under concurrency)
CREATE UNIQUE INDEX IF NOT EXISTS uq_slot ON appointments(doctor_id,date,time) WHERE status IN('PendingPayment','Confirmed','Completed');
CREATE INDEX IF NOT EXISTS ix_appt_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS ix_appt_hosp ON appointments(hospital_id,date);
CREATE TABLE IF NOT EXISTS payments(
  order_id TEXT PRIMARY KEY, appointment_id INTEGER NOT NULL REFERENCES appointments(id),
  amount INTEGER NOT NULL, status TEXT DEFAULT 'CREATED' CHECK(status IN('CREATED','PAID','FAILED','REFUNDED','REFUND_PENDING')),
  cf_payment_id TEXT, session_id TEXT, refund_id TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, paid_at TEXT);
CREATE TABLE IF NOT EXISTS webhook_events(id TEXT PRIMARY KEY, received_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS reviews(id INTEGER PRIMARY KEY, hospital_id INTEGER, doctor_id INTEGER, user_id INTEGER, rating INTEGER, text TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS favorites(user_id INTEGER, hospital_id INTEGER, PRIMARY KEY(user_id,hospital_id));
CREATE TABLE IF NOT EXISTS notifications(id INTEGER PRIMARY KEY, user_id INTEGER, text TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit_log(id INTEGER PRIMARY KEY, actor_id INTEGER, action TEXT, detail TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
`);

// Run fn atomically. BEGIN IMMEDIATE takes the write lock up-front.
function tx(fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { try { db.exec('ROLLBACK'); } catch {} throw e; }
}
const q = {
  get: (sql, ...a) => db.prepare(sql).get(...a),
  all: (sql, ...a) => db.prepare(sql).all(...a),
  run: (sql, ...a) => db.prepare(sql).run(...a),
};
const notify = (userId, text) => userId && q.run('INSERT INTO notifications(user_id,text) VALUES(?,?)', userId, text);
const audit = (actor, action, detail) => q.run('INSERT INTO audit_log(actor_id,action,detail) VALUES(?,?,?)', actor || null, action, String(detail || ''));

module.exports = { db, tx, q, notify, audit };
