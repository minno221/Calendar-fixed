// pages/api/events.js
import { kv } from '@vercel/kv';
import { checkPassword } from '../../lib/auth';

const KEY = 'events';
const TYPES = ['event', 'exam', 'break'];

function isValidDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // 학사일정 조회 - 누구나 가능 (비밀번호 불필요)
    const list = (await kv.get(KEY)) || [];
    return res.status(200).json(list);
  }

  if (req.method === 'POST') {
    // 일정 추가 - 관리자만
    const { password, date, name, type } = req.body || {};
    if (!checkPassword(password)) {
      return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
    }
    if (!date || !name || !type) {
      return res.status(400).json({ error: '날짜, 일정명, 분류를 모두 입력해 주세요.' });
    }
    if (!isValidDate(date)) {
      return res.status(400).json({ error: '날짜 형식이 올바르지 않습니다.' });
    }
    if (!TYPES.includes(type)) {
      return res.status(400).json({ error: '분류가 올바르지 않습니다.' });
    }
    const trimmed = String(name).trim().slice(0, 100);
    if (!trimmed) {
      return res.status(400).json({ error: '일정명을 입력해 주세요.' });
    }
    const list = (await kv.get(KEY)) || [];
    const entry = {
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date,
      name: trimmed,
      type, // 'event' | 'exam' | 'break'
      source: 'manual',
    };
    list.push(entry);
    await kv.set(KEY, list);
    return res.status(201).json({ ok: true, entry });
  }

  if (req.method === 'DELETE') {
    // 일정 삭제 - 관리자만
    const { password, id } = req.body || {};
    if (!checkPassword(password)) {
      return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
    }
    const list = (await kv.get(KEY)) || [];
    const next = list.filter((item) => item.id !== id);
    await kv.set(KEY, next);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).end('Method Not Allowed');
}
