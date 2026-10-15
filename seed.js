'use strict';
// DEVELOPMENT SEED ONLY. These are fictional providers so the app has something to show.
// NEVER ship fictional hospitals to production: replace with real, verified providers (see docs/LAUNCH_CHECKLIST.md).
const { q } = require('./db');
if (process.env.NODE_ENV === 'production') { console.log('Refusing to seed in production'); return; }
if (q.get('SELECT COUNT(*) c FROM hospitals').c) return;
const H = [
  ['Lakeview Multispeciality Hospital (demo)', 'Indiranagar', 'Multispeciality', 4.6, ['Cardiology', 'Orthopaedics', 'Neurology', 'General Medicine'], '080 4000 1111', '100 Feet Road, Indiranagar, Bengaluru 560038', 'Open 24 hours', 1, 'Online payment', 1, 12.9719, 77.6412],
  ['Sunrise Clinic & Diagnostics (demo)', 'Koramangala', 'Clinic', 4.3, ['Dermatology', 'General Medicine', 'ENT'], '080 4000 2222', '5th Block, Koramangala, Bengaluru 560095', 'Mon–Sat 8 AM – 8 PM', 0, 'Pay at hospital', 0, 12.9352, 77.6245],
  ['Carewell Children & Women\'s Hospital (demo)', 'Whitefield', 'Specialty', 4.8, ['Paediatrics', 'Gynaecology', 'General Medicine'], '080 4000 3333', 'ITPL Main Road, Whitefield, Bengaluru 560066', 'Open 24 hours', 1, 'Free appointment', 1, 12.9698, 77.7500],
  ['Greenfield Heart Centre (demo)', 'Jayanagar', 'Specialty', 0, ['Cardiology'], '080 4000 4444', '4th Block, Jayanagar, Bengaluru 560011', 'Mon–Sat 9 AM – 6 PM', 0, 'Pay at hospital', 0, 12.9308, 77.5838],
];
H.forEach((h, i) => q.run("INSERT INTO hospitals(name,area,type,rating,status,depts,phone,addr,hours,emergency,pay,featured,lat,lng) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)", h[0], h[1], h[2], h[3], i === 3 ? 'pending' : 'approved', JSON.stringify(h[4]), h[5], h[6], h[7], h[8], h[9], h[10], h[11], h[12]));
const D = [[1, 'Dr. Ananya Rao', 'Cardiology', 'MD, DM Cardiology', 14, 700, 4.8], [1, 'Dr. Vikram Shetty', 'Orthopaedics', 'MS Orthopaedics', 11, 600, 4.5], [1, 'Dr. Meera Nair', 'Neurology', 'MD, DM Neurology', 9, 800, 4.6], [2, 'Dr. Sameer Khan', 'Dermatology', 'MD Dermatology', 8, 500, 4.4], [2, 'Dr. Latha Iyer', 'General Medicine', 'MBBS, MD', 20, 400, 4.3], [3, 'Dr. Rohit Menon', 'Paediatrics', 'MD Paediatrics', 12, 500, 4.9], [3, 'Dr. Kavya Reddy', 'Gynaecology', 'MS Obstetrics & Gynaecology', 15, 700, 4.7]];
D.forEach(d => q.run("INSERT INTO doctors(hospital_id,name,dept,qual,exp,fee,rating,status) VALUES(?,?,?,?,?,?,?,'approved')", ...d));
console.log('Seeded demo data');
