// pages/index.js 위치에 넣어주세요.
import { useState, useEffect } from 'react';

const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const TYPE_LABEL = { event: '행사', exam: '시험', break: '방학' };

function pad(n) {
  return String(n).padStart(2, '0');
}

function ymd(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [view, setView] = useState('cal'); // 'cal' | 'list'
  const [current, setCurrent] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => ymd(new Date()));

  useEffect(() => {
    fetch('/api/events')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => {
        setEvents([]);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  function eventsOn(dateStr) {
    return events.filter((e) => e.date === dateStr);
  }

  function goMonth(date) {
    const today = new Date();
    const sameMonth =
      date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
    setCurrent(date);
    setSelected(sameMonth ? ymd(today) : null);
  }

  function changeMonth(delta) {
    goMonth(new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function renderCalendar() {
    const y = current.getFullYear();
    const m = current.getMonth();
    const firstDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const todayStr = ymd(new Date());

    const cells = [];
    for (let i = 0; i < firstDow; i++) {
      cells.push(<div className="cal-cell empty" key={`e${i}`} />);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${pad(m + 1)}-${pad(d)}`;
      const dayEvents = eventsOn(dateStr);
      const cls = ['cal-cell'];
      if (dateStr === todayStr) cls.push('today');
      if (dateStr === selected) cls.push('selected');
      cells.push(
        <button
          type="button"
          className={cls.join(' ')}
          key={dateStr}
          onClick={() => setSelected(dateStr)}
          aria-label={`${m + 1}월 ${d}일${dayEvents.length ? `, 일정 ${dayEvents.length}개` : ''}`}
          aria-pressed={dateStr === selected}
        >
          <span className="cal-date">{d}</span>
          {dayEvents.length > 0 && (
            <span className="cal-dots">
              {dayEvents.slice(0, 3).map((ev) => (
                <i className={`dot dot-${ev.type}`} key={ev.id} />
              ))}
            </span>
          )}
          {dayEvents.slice(0, 3).map((ev) => (
            <span className={`cal-event type-${ev.type}`} key={ev.id}>
              {ev.name}
            </span>
          ))}
          {dayEvents.length > 3 && <span className="cal-more">+{dayEvents.length - 3}개 더</span>}
        </button>
      );
    }

    return (
      <div className="cal-wrap">
        <div className="cal-grid">
          {DOW.map((d) => (
            <div className="cal-dow" key={d}>
              {d}
            </div>
          ))}
          {cells}
        </div>
      </div>
    );
  }

  function renderDayPanel() {
    if (!selected) {
      return <div className="day-panel muted">날짜를 누르면 그날의 일정이 보여요.</div>;
    }
    const [, m, d] = selected.split('-');
    const dow = DOW[new Date(selected + 'T00:00:00').getDay()];
    const list = eventsOn(selected);
    return (
      <div className="day-panel">
        <div className="day-title">
          {parseInt(m, 10)}월 {parseInt(d, 10)}일 ({dow})
        </div>
        {list.length === 0 ? (
          <div className="day-empty">이 날은 등록된 일정이 없어요.</div>
        ) : (
          list.map((ev) => (
            <div className={`day-event type-${ev.type}`} key={ev.id}>
              <span className="day-name">{ev.name}</span>
              <span className="event-tag">{TYPE_LABEL[ev.type] || '일정'}</span>
            </div>
          ))
        )}
      </div>
    );
  }

  function renderList() {
    const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length === 0) {
      return <div className="empty">등록된 일정이 없습니다.</div>;
    }
    const todayStr = ymd(new Date());
    const groups = {};
    sorted.forEach((ev) => {
      const [y, m] = ev.date.split('-');
      const key = `${y}년 ${parseInt(m, 10)}월`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    });

    return (
      <div className="list-wrap">
        {Object.entries(groups).map(([month, evs]) => (
          <div className="month-group" key={month}>
            <div className="month-title">{month}</div>
            {evs.map((ev) => {
              const [, m, d] = ev.date.split('-');
              return (
                <div
                  className={`event-row type-${ev.type}${ev.date < todayStr ? ' past' : ''}`}
                  key={ev.id}
                >
                  <div className="event-date">
                    {parseInt(m, 10)}.{parseInt(d, 10)}
                  </div>
                  <div className="event-body">
                    <div className="event-name">{ev.name}</div>
                    <span className="event-tag">{TYPE_LABEL[ev.type] || '일정'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="page page-wide">
      <h1>학사일정</h1>
      <p className="subtitle">학기 중 주요 행사와 시험, 방학 일정을 한눈에 확인하세요.</p>

      <div className="legend">
        <span>
          <i className="dot dot-event" />행사
        </span>
        <span>
          <i className="dot dot-exam" />시험
        </span>
        <span>
          <i className="dot dot-break" />방학
        </span>
      </div>

      <div className="toolbar">
        <div className="view-switch">
          <button className={view === 'cal' ? 'active' : ''} onClick={() => setView('cal')}>
            달력
          </button>
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
            리스트
          </button>
        </div>
        {view === 'cal' && (
          <div className="month-nav">
            <button onClick={() => changeMonth(-1)} aria-label="이전 달">
              ‹
            </button>
            <span className="label">
              {current.getFullYear()}년 {current.getMonth() + 1}월
            </span>
            <button onClick={() => changeMonth(1)} aria-label="다음 달">
              ›
            </button>
            <button className="today-btn" onClick={() => goMonth(startOfMonth(new Date()))}>
              오늘
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="empty">불러오는 중...</div>
      ) : loadError ? (
        <div className="empty">일정을 불러오지 못했어요. 잠시 후 새로고침해 주세요.</div>
      ) : view === 'cal' ? (
        <>
          {renderCalendar()}
          {renderDayPanel()}
        </>
      ) : (
        renderList()
      )}

      <a className="admin-link" href="/admin">
        관리자
      </a>
    </div>
  );
}
