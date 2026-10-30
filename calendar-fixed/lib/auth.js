// lib/auth.js
// 관리자 비밀번호는 Vercel 환경 변수 ADMIN_PASSWORD 에서만 읽어요.
// (코드에 비밀번호를 적어두지 않아요)
import { timingSafeEqual } from 'crypto';

export function checkPassword(input) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real || typeof input !== 'string') return false;
  const a = Buffer.from(input);
  const b = Buffer.from(real);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
