
import React from 'react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  return (
    <div className="w-64 bg-indigo-900 text-white flex flex-col h-screen sticky top-0 border-r border-indigo-800">
      <div className="p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <i className="fas fa-chalkboard-teacher text-indigo-400"></i>
          <span>EduPlanner</span>
        </h1>
      </div>
      
      <nav className="flex-1 mt-4">
        <button
          onClick={() => setView('calendar')}
          className={`w-full flex items-center gap-4 px-6 py-4 transition-colors ${
            currentView === 'calendar' ? 'bg-indigo-800 border-r-4 border-indigo-400' : 'hover:bg-indigo-800/50'
          }`}
        >
          <i className="fas fa-calendar-alt w-5"></i>
          <span className="font-medium">Công việc trong tháng</span>
        </button>
        
        <button
          onClick={() => setView('lessons')}
          className={`w-full flex items-center gap-4 px-6 py-4 transition-colors ${
            currentView === 'lessons' ? 'bg-indigo-800 border-r-4 border-indigo-400' : 'hover:bg-indigo-800/50'
          }`}
        >
          <i className="fas fa-book-open w-5"></i>
          <span className="font-medium">Giáo án</span>
        </button>
      </nav>
      
      <div className="p-6 mt-auto border-t border-indigo-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-lg">
            GV
          </div>
          <div>
            <p className="text-sm font-semibold">Giảng viên</p>
            <p className="text-xs text-indigo-300">Hoạt động: Tốt</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
