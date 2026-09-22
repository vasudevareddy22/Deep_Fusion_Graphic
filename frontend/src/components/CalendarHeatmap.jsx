import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ShieldAlert, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export const CalendarHeatmap = ({ selectedDate, onSelectDate }) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [calendarData, setCalendarData] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch month calendar stats from database
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const fetchFn = api.getCalendarData || api.getCalendar;
        const res = await fetchFn(currentYear, currentMonth);
        if (isMounted && res?.days) {
          setCalendarData(res.days);
        }
      } catch (err) {
        console.error('Failed to load database calendar data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleJumpToday = () => {
    const d = new Date();
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth() + 1);
    const todayStr = d.toISOString().split('T')[0];
    onSelectDate?.(todayStr);
  };

  // Generate calendar grid
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 = Sunday

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-xl select-none text-slate-800">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-blue-600" />
          <span className="font-sans text-xs font-bold text-slate-900 uppercase tracking-wider">
            {monthNames[currentMonth - 1]} {currentYear}
          </span>
          {loading && (
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" title="Loading database records..." />
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleJumpToday}
            className="px-2 py-1 rounded-lg text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer mr-1"
          >
            Today
          </button>
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-lg bg-blue-50/60 hover:bg-blue-100 border border-blue-200/80 text-slate-600 transition-colors cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-lg bg-blue-50/60 hover:bg-blue-100 border border-blue-200/80 text-slate-600 transition-colors cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400 mb-1">
        {weekDays.map(day => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Leading empty cells */}
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8 rounded-lg bg-slate-50 border border-transparent" />
        ))}

        {/* Month Day Cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const isSelected = selectedDate === dateStr;
          const isToday = today.toISOString().split('T')[0] === dateStr;
          
          const dayStats = calendarData[dateStr];
          const hasAttacks = dayStats && dayStats.attacks > 0;
          const totalEvents = dayStats?.total || 0;
          const attackCount = dayStats?.attacks || 0;
          const isCritical = dayStats && dayStats.critical > 0;

          // Heat styling
          let heatClass = 'bg-slate-50 border-slate-200/80 text-slate-700 hover:border-blue-400 hover:bg-blue-50/50';
          if (isSelected) {
            heatClass = 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/30 scale-105 z-10';
          } else if (isCritical) {
            heatClass = 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs hover:scale-105';
          } else if (hasAttacks) {
            heatClass = 'bg-amber-50 border-amber-300 text-amber-800 hover:scale-105';
          } else if (totalEvents > 0) {
            heatClass = 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:scale-105';
          }

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate?.(dateStr)}
              className={`h-9 rounded-lg border p-1 flex flex-col items-center justify-between text-[11px] transition-all cursor-pointer relative group ${heatClass}`}
            >
              <div className="flex items-center justify-between w-full px-0.5">
                <span className={`text-[10px] font-bold ${isToday && !isSelected ? 'text-blue-600 underline' : ''}`}>
                  {dayNum}
                </span>
                {hasAttacks && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-rose-500 shadow-xs'}`} />
                )}
              </div>

              {totalEvents > 0 ? (
                <span className="text-[9px] font-semibold opacity-90 truncate max-w-full">
                  {attackCount > 0 ? `${attackCount} atk` : `${totalEvents} ok`}
                </span>
              ) : (
                <span className="text-[8px] text-slate-400">-</span>
              )}

              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                <div className="bg-slate-900 border border-slate-700 text-[10px] text-white px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                  <p className="font-bold text-blue-400">{dateStr}</p>
                  <p className="text-slate-300">Total: {totalEvents}</p>
                  {attackCount > 0 && <p className="text-rose-400 font-bold">Attacks: {attackCount}</p>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-blue-100 text-[10px] text-slate-500 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-emerald-500" /> Normal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-amber-500" /> Threat
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-rose-500" /> Critical
        </span>
        <span className="text-slate-400">Click to filter</span>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
