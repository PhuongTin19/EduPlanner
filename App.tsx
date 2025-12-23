
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Calendar from './components/Calendar';
import LessonPlans from './components/LessonPlans';
import { ViewState, DailyTasks, Subject, Task, LearningModule, Lesson } from './types';

const INITIAL_SUBJECTS: Subject[] = [
  { id: 's1', name: 'SNLT', icon: 'fa-code', modules: [{ id: 'm1', name: 'Học phần cơ bản', lessons: [] }] },
  { id: 's2', name: 'TGVVTM', icon: 'fa-palette', modules: [{ id: 'm2', name: 'Học phần cơ bản', lessons: [] }] }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('calendar');
  const [tasks, setTasks] = useState<DailyTasks>({});
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const savedTasks = localStorage.getItem('eduplanner_tasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    const savedSubjects = localStorage.getItem('eduplanner_subjects');
    if (savedSubjects) setSubjects(JSON.parse(savedSubjects));
  }, []);

  useEffect(() => localStorage.setItem('eduplanner_tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('eduplanner_subjects', JSON.stringify(subjects)), [subjects]);

  const handleAddTask = (date: string, title: string) => {
    const newTask = { id: Math.random().toString(36).substr(2, 9), title, completed: false };
    setTasks(prev => ({ ...prev, [date]: [...(prev[date] || []), newTask] }));
  };

  const handleToggleTask = (date: string, taskId: string) => {
    setTasks(prev => {
      if (!prev[date]) return prev;
      return {
        ...prev,
        [date]: prev[date].map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
      };
    });
  };

  const handleDeleteTask = (date: string, taskId: string) => {
    setTasks(prev => {
      if (!prev[date]) return prev;
      const updatedDayTasks = prev[date].filter(t => t.id !== taskId);
      if (updatedDayTasks.length === 0) {
        const { [date]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [date]: updatedDayTasks };
    });
  };

  const handleAddSubject = (name: string) => {
    const newSub: Subject = { 
      id: 's' + Date.now(), 
      name, 
      icon: 'fa-folder', 
      modules: [{ id: 'm' + Date.now(), name: 'Học phần 1', lessons: [] }] 
    };
    setSubjects(prev => [...prev, newSub]);
  };

  const handleUpdateSubject = (id: string, name: string) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  };

  const handleDeleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  const handleAddModule = (subjectId: string, name: string) => {
    setSubjects(prev => prev.map(s => s.id === subjectId ? {
      ...s, modules: [...s.modules, { id: 'm' + Date.now(), name, lessons: [] }]
    } : s));
  };

  const handleUpdateModule = (subjectId: string, moduleId: string, name: string) => {
    setSubjects(prev => prev.map(s => s.id === subjectId ? {
      ...s, modules: s.modules.map(m => m.id === moduleId ? { ...m, name } : m)
    } : s));
  };

  const handleDeleteModule = (subjectId: string, moduleId: string) => {
    setSubjects(prev => prev.map(s => s.id === subjectId ? {
      ...s, modules: s.modules.filter(m => m.id !== moduleId)
    } : s));
  };

  const handleAddLesson = (subjectId: string, moduleId: string, name: string, url?: string) => {
    setSubjects(prev => prev.map(s => s.id === subjectId ? {
      ...s, modules: s.modules.map(m => m.id === moduleId ? {
        ...m, lessons: [...m.lessons, { id: 'l' + Date.now(), name, url: url || '' }]
      } : m)
    } : s));
  };

  const handleUpdateLesson = (subjectId: string, moduleId: string, lessonId: string, updates: { name: string, url: string }) => {
    setSubjects(prev => prev.map(s => s.id === subjectId ? {
      ...s, modules: s.modules.map(m => m.id === moduleId ? {
        ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, ...updates } : l)
      } : m)
    } : s));
  };

  const handleDeleteLesson = (subjectId: string, moduleId: string, lessonId: string) => {
    setSubjects(prev => prev.map(s => s.id === subjectId ? {
      ...s, modules: s.modules.map(m => m.id === moduleId ? {
        ...m, lessons: m.lessons.filter(l => l.id !== lessonId)
      } : m)
    } : s));
  };

  const handleBulkImport = (data: any[]) => {
    const processed = data.map(s => ({
      id: 's' + Math.random().toString(36).substr(2, 9),
      name: s.name,
      icon: s.icon || 'fa-book',
      modules: (s.modules || []).map((m: any) => ({
        id: 'm' + Math.random().toString(36).substr(2, 9),
        name: m.name || 'Học phần chung',
        lessons: (m.lessons || []).map((l: any) => ({
          id: 'l' + Math.random().toString(36).substr(2, 9),
          name: l.name,
          url: l.url || ''
        }))
      }))
    }));
    setSubjects(prev => [...prev, ...processed]);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {currentView === 'calendar' ? 'Công việc hàng tháng' : 'Quản lý giáo án'}
            </h2>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                <i className="fas fa-search text-gray-400"></i>
                <input 
                  type="text" 
                  placeholder="Tìm nội dung..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="bg-transparent outline-none text-sm w-64 font-medium" 
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-gray-300 hover:text-gray-500">
                    <i className="fas fa-times-circle"></i>
                  </button>
                )}
             </div>
          </div>
        </header>

        {currentView === 'calendar' ? (
          <Calendar 
            tasks={tasks} 
            searchQuery={searchQuery}
            onAddTask={handleAddTask} 
            onToggleTask={handleToggleTask} 
            onDeleteTask={handleDeleteTask} 
          />
        ) : (
          <LessonPlans 
            subjects={subjects} 
            searchQuery={searchQuery}
            onAddSubject={handleAddSubject}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
            onAddModule={handleAddModule}
            onUpdateModule={handleUpdateModule}
            onDeleteModule={handleDeleteModule}
            onAddLesson={handleAddLesson}
            onUpdateLesson={handleUpdateLesson}
            onDeleteLesson={handleDeleteLesson}
            onBulkImport={handleBulkImport}
          />
        )}
      </main>
    </div>
  );
};

export default App;
