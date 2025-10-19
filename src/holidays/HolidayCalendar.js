import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import PageCard from '../components/PageCard';
import './HolidayCalendar.css';
import { APP_SERVER_URL_PREFIX } from '../constants.js';

function buildCalendar(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const weeks = [];
  let cur = new Date(start);
  for (let w = 0; w < 6; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(days);
  }
  return weeks;
}

function HolidayCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [weeks, setWeeks] = useState(() => buildCalendar(today.getFullYear(), today.getMonth()));
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setWeeks(buildCalendar(year, month));
  }, [year, month]);

  useEffect(() => {
    setLoading(true);
    fetch(`${APP_SERVER_URL_PREFIX}/holidays?year=${year}`)
      .then((res) => {
        if (!res.ok) throw new Error('no data');
        return res.json();
      })
      .then((json) => {
        // expect array of { date: 'YYYY-MM-DD', name }
        setHolidays(json || []);
      })
      .catch(() => {
        // fallback demo data
        setHolidays([
          { date: `${year}-01-01`, name: 'New Year\'s Day', description: 'Bank holiday, office closed' },
          { date: `${year}-12-25`, name: 'Christmas Day', description: 'Holiday to celebrate Christmas' }
        ]);
      })
      .finally(() => setLoading(false));
  }, [year]);

  const holidayMap = new Map(holidays.map(h => [h.date, h]));
  const [modalHoliday, setModalHoliday] = useState(null);

  const openHoliday = (holiday, date) => {
    setModalHoliday({ date, name: (holiday && holiday.name) || '', description: (holiday && holiday.description) || '', originalDate: date });
  };

  const closeModal = () => setModalHoliday(null);

  const saveHoliday = async () => {
    if (!modalHoliday) return;
    const { date, name, description, originalDate } = modalHoliday;
    const payload = { date, name, description };
    try {
      // Try PUT to a date-specific endpoint (assumption). If API expects different shape, this will fall back to POST.
      let res = await fetch(`${APP_SERVER_URL_PREFIX}/holidays/${date}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if (!res.ok) {
        // fallback to POST create or update
        res = await fetch(`${APP_SERVER_URL_PREFIX}/holidays`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      }

      if (!res.ok) throw new Error('save failed');

      // Update local holidays array (remove originalDate if changed)
      setHolidays(prev => {
        const filtered = prev.filter(h => h.date !== originalDate);
        // replace or add
        const idx = filtered.findIndex(h => h.date === date);
        if (idx >= 0) filtered[idx] = payload; else filtered.push(payload);
        return filtered;
      });
      closeModal();
    } catch (e) {
      // simple error feedback — could be improved
      alert('Failed to save holiday (server may not support PUT/POST at /holidays).');
    }
  };

  return (
    <div>
      <Sidebar isOpen={true} />
      <PageCard title={`Holiday Calendar — ${year} / ${month+1}`}>
        <div className="hc-controls">
          <button className="btn" onClick={() => { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); }}>Prev</button>
          <div className="hc-month">{new Date(year, month).toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
          <button className="btn" onClick={() => { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); }}>Next</button>
        </div>

        {loading ? <div className="small">Loading...</div> : (
          <table className="hc-calendar">
            <thead>
              <tr>
                <th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wi) => (
                <tr key={wi}>
                  {week.map((d, di) => {
                    const key = d.toISOString().slice(0,10);
                    const isCurrentMonth = d.getMonth() === month;
                    const holiday = holidayMap.get(key);
                    const todayKey = new Date().toISOString().slice(0,10);
                    const isToday = key === todayKey;
                    return (
                      <td
                        key={di}
                        onClick={() => openHoliday(holiday, key)}
                        onKeyDown={(e) => { if (e.key === 'Enter') openHoliday(holiday, key); }}
                        tabIndex={0}
                        role="button"
                        aria-label={holiday ? `Holiday: ${holiday.name} on ${key}` : `Create holiday on ${key}`}
                        aria-current={isToday ? 'date' : undefined}
                        className={`${isCurrentMonth ? '' : 'hc-outside'} ${holiday ? 'hc-holiday' : ''} ${isToday ? 'hc-today' : ''}`}
                      >
                        <div className="hc-day-number">{d.getDate()}</div>
                        {holiday && (
                          <>
                            <div className="hc-hol-name">{holiday.name}</div>
                            {holiday.description && <div className="hc-day-desc" title={holiday.description}>{holiday.description}</div>}
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PageCard>
      {modalHoliday && (
        <div className="hc-modal-overlay" onClick={closeModal}>
          <div className="hc-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{modalHoliday.name ? 'Edit Holiday' : 'Create Holiday'}</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              <label>
                Date
                <input type="date" value={modalHoliday.date} onChange={(e) => setModalHoliday(m => ({ ...m, date: e.target.value }))} />
              </label>
              <label>
                Name
                <input type="text" value={modalHoliday.name} onChange={(e) => setModalHoliday(m => ({ ...m, name: e.target.value }))} />
              </label>
              <label>
                Description
                <textarea value={modalHoliday.description} onChange={(e) => setModalHoliday(m => ({ ...m, description: e.target.value }))} rows={3} />
              </label>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button className="btn" onClick={saveHoliday}>Save</button>
              <button className="btn" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HolidayCalendar;

