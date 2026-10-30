// pages/api/verify.js
import { checkPassword } from '../../lib/auth';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD 환경 변수가 설정되지 않았어요.' });
  }
  const { password } = req.body || {};
  if (!checkPassword(password)) {
    return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
  }
  return res.status(200).json({ ok: true });
}
