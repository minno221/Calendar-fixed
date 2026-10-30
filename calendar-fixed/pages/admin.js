// pages/admin.js 위치에 넣어주세요.
import { useState, useEffect } from 'react';

const CATEGORIES = [
  { value: 'event', label: '행사' },
  { value: 'exam', label: '시험' },
  { value: 'break', label: '방학' },
];

export default function Admin() {
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [list, setList] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('event');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  async function loadList() {
    const res = await fetch('/api/events');
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('일정을 불러오지 못했습니다.');
    setList(data.sort((a, b) => a.date.localeCompare(b.date)));
  }

  async function handleUnlock(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError('비밀번호가 올바르지 않습니다.');
        return;
      }
      await loadList();
      setUnlocked(true);
    } catch {
      setError('확인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!date || !name.trim()) {
      setAddError('날짜와 일정명을 입력해 주세요.');
      return;
    }
    setAdding(true);
    setAddError('');
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, date, name, type }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '추가에 실패했습니다.');
      setName('');
      await loadList();
    } catch (e) {
      setAddError(e.message || '추가에 실패했습니다.');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id) {
    const ok = confirm('이 일정을 삭제할까요?');
    if (!ok) return;
    const res = await fetch('/api/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, id }),
    });
    if (res.ok) {
      setList((prev) => prev.filter((item) => item.id !== id));
    }
  }

  async function handleSync() {
    const ok = confirm(
      '나이스에서 학사일정을 가져올까요?\n이전에 가져온 나이스 일정은 새 내용으로 바뀌고, 직접 추가한 일정은 그대로예요.'
    );
    if (!ok) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch('/api/sync-neis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '가져오기에 실패했습니다.');
      setSyncMsg({ ok: true, text: `${data.school} 일정 ${data.count}건을 가져왔어요.` });
      await loadList();
    } catch (e) {
      setSyncMsg({ ok: false, text: e.message });
    } finally {
      setSyncing(false);
    }
  }

  if (!unlocked) {
    return (
      <div className="page">
        <h1>관리자</h1>
        <p className="subtitle">학사일정을 추가/삭제하려면 비밀번호를 입력하세요.</p>
        <form onSubmit={handleUnlock}>
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? '확인 중...' : '확인'}
          </button>
          {error && <div className="toast error">{error}</div>}
        </form>
      </div>
    );
  }

  return (
    <div className="page page-wide">
      <h1>학사일정 관리</h1>
      <p className="subtitle">일정을 추가하거나 삭제할 수 있습니다.</p>

      <div className="sync-box">
        <div>
          <strong>나이스 학사일정 가져오기</strong>
          <p>학교 학사일정을 나이스에서 한 번에 불러와요.</p>
        </div>
        <button className="btn" type="button" onClick={handleSync} disabled={syncing}>
          {syncing ? '가져오는 중...' : '가져오기'}
        </button>
      </div>
      {syncMsg && <div className={`toast ${syncMsg.ok ? 'success' : 'error'}`}>{syncMsg.text}</div>}

      <form onSubmit={handleAdd} className="add-form">
        <div className="add-row">
          <div>
            <label htmlFor="date">날짜</label>
            <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="type">분류</label>
            <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label htmlFor="name">일정명</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 1학기 중간고사 시작"
        />
        <button className="btn" type="submit" disabled={adding}>
          {adding ? '추가 중...' : '일정 추가'}
        </button>
        {addError && <div className="toast error">{addError}</div>}
      </form>

      <h2 className="section-title">전체 일정 ({list.length}건)</h2>
      {list.length === 0 && <div className="empty">등록된 일정이 없습니다.</div>}
      {list.map((item) => (
        <div className="card" key={item.id}>
          <div className="card-top">
            <span className={`tag tag-${item.type}`}>
              {CATEGORIES.find((c) => c.value === item.type)?.label || item.type}
            </span>
            <span className="date">{item.date}</span>
          </div>
          <div className="content">{item.name}</div>
          <button className="btn-ghost" style={{ marginTop: 12 }} onClick={() => handleDelete(item.id)}>
            삭제
          </button>
        </div>
      ))}
    </div>
  );
}
