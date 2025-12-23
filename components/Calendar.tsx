
import React, { useState, useMemo } from 'react';
import { DailyTasks, Task } from '../types';

interface CalendarProps {
  tasks: DailyTasks;
  searchQuery: string;
  onAddTask: (date: string, taskTitle: string) => void;
  onToggleTask: (date: string, taskId: string) => void;
  onDeleteTask: (date: string, taskId: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ tasks, searchQuery, onAddTask, onToggleTask, onDeleteTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newBacklogTitle, setNewBacklogTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const q = searchQuery.toLowerCase();

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    const firstDay = date.getDay();
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentDate]);

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  };

  const outstandingTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const overdue: { date: string; task: Task }[] = [];
    
    Object.keys(tasks).forEach(dateStr => {
      if (dateStr === 'backlog') return;
      const taskDate = new Date(dateStr);
      if (taskDate < today) {
        tasks[dateStr].forEach(task => {
          if (!task.completed) {
            if (!q || task.title.toLowerCase().includes(q)) {
              overdue.push({ date: dateStr, task });
            }
          }
        });
      }
    });

    const manualBacklog = (tasks['backlog'] || [])
      .filter(t => !q || t.title.toLowerCase().includes(q))
      .map(task => ({
        date: 'backlog',
        task
      }));
    
    return [...manualBacklog, ...overdue.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())];
  }, [tasks, q]);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    setSelectedDate(null);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDate && newTaskTitle.trim()) {
      onAddTask(selectedDate, newTaskTitle);
      setNewTaskTitle('');
    }
  };

  const handleAddBacklog = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBacklogTitle.trim()) {
      onAddTask('backlog', newBacklogTitle.trim());
      setNewBacklogTitle('');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, date: string, taskId: string) => {
    e.stopPropagation();
    if (confirmDeleteId === taskId) {
      onDeleteTask(date, taskId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(taskId);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  return (
    <div className="flex h-full gap-6">
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <i className="fas fa-chevron-left"></i>
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
              Hôm nay
            </button>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7">
          {daysInMonth.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="border-r border-b border-gray-100 bg-gray-50/20"></div>;
            
            const dateKey = formatDateKey(date);
            const isSelected = selectedDate === dateKey;
            const isToday = formatDateKey(new Date()) === dateKey;
            const dayTasks = tasks[dateKey] || [];
            
            // Tìm các task khớp với tìm kiếm
            const filteredDayTasks = q 
              ? dayTasks.filter(t => t.title.toLowerCase().includes(q))
              : dayTasks;
            
            return (
              <div 
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                className={`min-h-[100px] border-r border-b border-gray-100 p-2 cursor-pointer transition-all hover:bg-indigo-50/30 ${
                  isSelected ? 'bg-indigo-50 ring-2 ring-indigo-400 ring-inset z-10' : ''
                } ${q && filteredDayTasks.length > 0 ? 'bg-amber-50/30' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-semibold rounded-full w-7 h-7 flex items-center justify-center ${
                    isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'
                  }`}>
                    {date.getDate()}
                  </span>
                  {filteredDayTasks.some(t => !t.completed) && (
                    <span className={`w-2 h-2 rounded-full animate-pulse ${q ? 'bg-amber-500' : 'bg-red-400'}`}></span>
                  )}
                </div>
                <div className="space-y-1">
                  {filteredDayTasks.slice(0, 2).map(task => (
                    <div 
                      key={task.id} 
                      className={`text-[10px] px-1.5 py-0.5 rounded truncate ${
                        task.completed ? 'bg-green-100 text-green-700 line-through' : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {task.title}
                    </div>
                  ))}
                  {filteredDayTasks.length > 2 && (
                    <div className="text-[10px] text-gray-400 pl-1">
                      + {filteredDayTasks.length - 2} việc {q ? 'khớp' : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-96 flex flex-col gap-6 sticky top-6 max-h-[calc(100vh-6rem)]">
        {/* Lọc việc tồn đọng */}
        <div className="bg-orange-50 rounded-2xl shadow-sm border border-orange-200 p-5 flex flex-col overflow-hidden max-h-[45%]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-orange-800 font-bold flex items-center gap-2">
              <i className="fas fa-exclamation-circle"></i>
              {q ? 'Kết quả tìm kiếm' : 'Việc tồn đọng'} ({outstandingTasks.length})
            </h3>
          </div>

          {!q && (
            <form onSubmit={handleAddBacklog} className="mb-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Tự điền việc tồn đọng..."
                  value={newBacklogTitle}
                  onChange={(e) => setNewBacklogTitle(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-white border border-orange-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-300 transition-all shadow-inner"
                />
                <button type="submit" disabled={!newBacklogTitle.trim()} className="absolute right-1 top-1 w-7 h-7 bg-orange-500 text-white rounded-lg flex items-center justify-center hover:bg-orange-600 disabled:opacity-30 transition-all">
                  <i className="fas fa-plus text-[10px]"></i>
                </button>
              </div>
            </form>
          )}

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {outstandingTasks.length === 0 ? (
              <p className="text-[10px] text-orange-400 text-center py-4 italic">
                {q ? 'Không tìm thấy kết quả phù hợp' : 'Tuyệt vời! Không còn việc tồn đọng.'}
              </p>
            ) : (
              outstandingTasks.map(({ date, task }) => (
                <div key={task.id} className="group bg-white p-2.5 rounded-xl border border-orange-100 hover:border-orange-300 transition-all flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-right-1">
                  <button 
                    onClick={() => onToggleTask(date, task.id)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      task.completed ? 'bg-orange-500 border-orange-500 text-white' : 'border-orange-300 hover:bg-orange-100'
                    }`}
                  >
                    {task.completed && <i className="fas fa-check text-[8px]"></i>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${task.completed ? 'text-gray-300 line-through' : 'text-gray-700'}`}>
                      {task.title}
                    </p>
                    <p className="text-[10px] text-orange-400 font-medium">
                      {date === 'backlog' ? 'Việc tồn' : `Hạn: ${date.split('-').reverse().join('/')}`}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteClick(e, date, task.id)}
                    className={`transition-all duration-200 ${confirmDeleteId === task.id ? 'bg-red-500 text-white px-2 py-0.5 rounded text-[8px] font-bold animate-pulse' : 'text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100'}`}
                  >
                    {confirmDeleteId === task.id ? 'Xác nhận?' : <i className="fas fa-trash-alt text-[10px]"></i>}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col flex-1 overflow-hidden">
          {selectedDate ? (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-1">Ngày {selectedDate.split('-').reverse().join('/')}</h3>
                <p className="text-sm text-gray-500">
                  {(tasks[selectedDate] || []).filter(t => !q || t.title.toLowerCase().includes(q)).length} việc 
                  {q ? ' khớp tìm kiếm' : ' đã lên lịch'}
                </p>
              </div>

              {!q && (
                <form onSubmit={handleAddTask} className="mb-6">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Thêm việc mới cho ngày này..."
                      className="w-full pl-4 pr-12 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm"
                    />
                    <button type="submit" className="absolute right-2 top-1.5 w-9 h-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-colors">
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                </form>
              )}

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {(tasks[selectedDate] || [])
                  .filter(t => !q || t.title.toLowerCase().includes(q))
                  .length === 0 ? (
                  <div className="text-center py-10 opacity-40">
                    <i className="fas fa-tasks text-4xl mb-3"></i>
                    <p className="text-sm">Không có nội dung phù hợp</p>
                  </div>
                ) : (
                  (tasks[selectedDate] || [])
                    .filter(t => !q || t.title.toLowerCase().includes(q))
                    .map(task => (
                    <div key={task.id} className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all shadow-sm">
                      <button 
                        onClick={() => onToggleTask(selectedDate, task.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-indigo-500'
                        }`}
                      >
                        {task.completed && <i className="fas fa-check text-[10px]"></i>}
                      </button>
                      <span className={`flex-1 text-sm ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>
                        {task.title}
                      </span>
                      <button 
                        onClick={(e) => handleDeleteClick(e, selectedDate, task.id)}
                        className={`transition-all duration-200 ${confirmDeleteId === task.id ? 'bg-red-500 text-white px-2 py-1 rounded text-[10px] font-bold animate-pulse' : 'text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100'}`}
                      >
                        {confirmDeleteId === task.id ? 'Xóa?' : <i className="fas fa-trash-alt text-xs"></i>}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-40">
              <i className="far fa-calendar-check text-5xl mb-4 text-indigo-300"></i>
              <h3 className="text-lg font-bold">Chọn một ngày</h3>
              <p className="text-sm">Chọn ngày trên lịch để xem việc cụ thể.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
