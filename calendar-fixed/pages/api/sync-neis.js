// pages/api/sync-neis.js 위치에 넣어주세요.
// 나이스(NEIS) 교육정보 개방 포털에서 학교 학사일정을 가져와 저장해요.
import { kv } from '@vercel/kv';
import { checkPassword } from '../../lib/auth';

const KEY = 'events';
const BASE = 'https://open.neis.go.kr/hub';

// 학교 정보는 Vercel 환경 변수로 바꿀 수 있어요. (없으면 아래 기본값)
const OFFICE_CODE = process.env.NEIS_OFFICE_CODE || 'H10'; // 울산광역시교육청
const SCHOOL_NAME = process.env.NEIS_SCHOOL_NAME || '호계고등학교';

async function neis(path, params) {
  const url = new URL(`${BASE}/${path}`);
  const all = { KEY: process.env.NEIS_KEY, Type: 'json', pIndex: 1, pSize: 1000, ...params };
  Object.entries(all).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url);
  if (!res.ok) throw new Error('나이스 서버가 응답하지 않아요. 잠시 후 다시 시도해 주세요.');
  return res.json();
}

// 나이스 응답에서 결과 코드와 데이터 줄을 꺼내요.
function parse(data, name) {
  const block = data && data[name];
  let code = data && data.RESULT && data.RESULT.CODE;
  let rows = [];
  if (Array.isArray(block)) {
    const head = block.find((b) => b.head);
    const body = block.find((b) => b.row);
    const r = head && head.head.find((h) => h.RESULT);
    if (r) code = r.RESULT.CODE;
    rows = body ? body.row : [];
  }
  return { code, rows };
}

function classify(name) {
  if (/방학/.test(name)) return 'break';
  if (/고사|시험|평가/.test(name)) return 'exam';
  return 'event';
}

// 3월 ~ 다음해 2월을 한 학년도로 봐요.
function schoolYearRange() {
  const now = new Date();
  const startYear = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
  return { from: `${startYear}0301`, to: `${startYear + 1}0228` };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  const { password } = req.body || {};
  if (!checkPassword(password)) {
    return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
  }
  if (!process.env.NEIS_KEY) {
    return res.status(500).json({ error: 'NEIS_KEY 환경 변수가 아직 설정되지 않았어요.' });
  }

  try {
    // 1) 학교 코드 찾기 (환경 변수에 직접 넣었으면 그 값을 써요)
    let schoolCode = process.env.NEIS_SCHOOL_CODE;
    let schoolName = SCHOOL_NAME;
    if (!schoolCode) {
      const info = parse(
        await neis('schoolInfo', { ATPT_OFCDC_SC_CODE: OFFICE_CODE, SCHUL_NM: SCHOOL_NAME }),
        'schoolInfo'
      );
      if (info.code && info.code.startsWith('ERROR')) {
        return res.status(502).json({ error: `나이스 인증키를 확인해 주세요. (${info.code})` });
      }
      const found = info.rows.find((r) => r.SCHUL_NM === SCHOOL_NAME) || info.rows[0];
      if (!found) {
        return res.status(404).json({ error: `'${SCHOOL_NAME}'을(를) 나이스에서 찾지 못했어요.` });
      }
      schoolCode = found.SD_SCHUL_CODE;
      schoolName = found.SCHUL_NM;
    }

    // 2) 학사일정 가져오기
    const { from, to } = schoolYearRange();
    const sched = parse(
      await neis('SchoolSchedule', {
        ATPT_OFCDC_SC_CODE: OFFICE_CODE,
        SD_SCHUL_CODE: schoolCode,
        AA_FROM_YMD: from,
        AA_TO_YMD: to,
      }),
      'SchoolSchedule'
    );
    if (sched.code && sched.code.startsWith('ERROR')) {
      return res.status(502).json({ error: `나이스에서 일정을 가져오지 못했어요. (${sched.code})` });
    }

    // 3) 정리 (토요휴업일 제외, 같은 날짜·이름 중복 제거)
    const seen = new Set();
    const imported = [];
    sched.rows.forEach((r) => {
      const name = (r.EVENT_NM || '').trim();
      if (!name || name === '토요휴업일') return;
      const ymd = r.AA_YMD;
      const date = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
      const dupKey = `${date}|${name}`;
      if (seen.has(dupKey)) return;
      seen.add(dupKey);
      imported.push({
        id: `neis-${ymd}-${imported.length}`,
        date,
        name,
        type: classify(name),
        source: 'neis',
      });
    });

    // 4) 직접 추가한 일정은 두고, 이전 나이스 일정만 교체
    const existing = (await kv.get(KEY)) || [];
    const kept = existing.filter((e) => e.source !== 'neis');
    await kv.set(KEY, [...kept, ...imported]);

    return res.status(200).json({ ok: true, count: imported.length, school: schoolName });
  } catch (e) {
    return res.status(500).json({ error: e.message || '가져오기 중 오류가 발생했어요.' });
  }
}
