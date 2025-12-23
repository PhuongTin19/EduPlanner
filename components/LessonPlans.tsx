
import React, { useState, useMemo, useEffect } from 'react';
import { Subject, LearningModule, Lesson } from '../types';
import { generateLessonOutline, parseSheetData } from '../services/geminiService';

interface LessonPlansProps {
  subjects: Subject[];
  searchQuery: string;
  onAddSubject: (name: string) => void;
  onUpdateSubject: (id: string, name: string) => void;
  onDeleteSubject: (id: string) => void;
  onAddModule: (subjectId: string, name: string) => void;
  onUpdateModule: (subjectId: string, moduleId: string, name: string) => void;
  onDeleteModule: (subjectId: string, moduleId: string) => void;
  onAddLesson: (subjectId: string, moduleId: string, name: string, url?: string) => void;
  onUpdateLesson: (subjectId: string, moduleId: string, lessonId: string, updates: { name: string, url: string }) => void;
  onDeleteLesson: (subjectId: string, moduleId: string, lessonId: string) => void;
  onBulkImport: (data: any[]) => void;
}

const LessonPlans: React.FC<LessonPlansProps> = ({ 
  subjects, searchQuery, onAddSubject, onUpdateSubject, onDeleteSubject, onAddModule, onUpdateModule, onDeleteModule, onAddLesson, onUpdateLesson, onDeleteLesson, onBulkImport 
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  
  // State tìm kiếm
  const q = searchQuery.toLowerCase();

  // States cho Môn học
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [confirmDeleteSubjectId, setConfirmDeleteSubjectId] = useState<string | null>(null);

  // States cho Học phần
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModuleName, setEditModuleName] = useState('');
  const [confirmDeleteModuleId, setConfirmDeleteModuleId] = useState<string | null>(null);

  // States cho Bài học
  const [activeAddingModuleId, setActiveAddingModuleId] = useState<string | null>(null);
  const [newLessonName, setNewLessonName] = useState('');
  const [newLessonUrl, setNewLessonUrl] = useState('');
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonName, setEditLessonName] = useState('');
  const [editLessonUrl, setEditLessonUrl] = useState('');
  const [confirmDeleteLessonId, setConfirmDeleteLessonId] = useState<string | null>(null);

  // States cho Import/AI
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [loading, setLoading] = useState(false);

  // --- LỌC MÔN HỌC SIDEBAR ---
  const filteredSubjects = useMemo(() => {
    if (!q) return subjects;
    return subjects.filter(s => {
      const subjectMatch = s.name.toLowerCase().includes(q);
      const moduleMatch = s.modules.some(m => 
        m.name.toLowerCase().includes(q) || 
        m.lessons.some(l => l.name.toLowerCase().includes(q))
      );
      return subjectMatch || moduleMatch;
    });
  }, [subjects, q]);

  const currentSubject = useMemo(() => {
    // Nếu đang tìm kiếm, ưu tiên chọn môn học đầu tiên trong danh sách kết quả
    const list = q ? filteredSubjects : subjects;
    return list.find(s => s.id === (selectedSubjectId || list[0]?.id)) || list[0];
  }, [subjects, filteredSubjects, selectedSubjectId, q]);

  useEffect(() => {
    if (currentSubject && selectedSubjectId !== currentSubject.id) {
      setSelectedSubjectId(currentSubject.id);
    }
  }, [currentSubject]);

  const handleImport = async () => {
    if (!importText.trim()) return;
    setLoading(true);
    try {
      const data = await parseSheetData(importText);
      onBulkImport(data);
      setShowImport(false);
      setImportText('');
    } catch (e) { alert("Lỗi phân tích dữ liệu"); }
    finally { setLoading(false); }
  };

  // --- Handlers ---
  const startEditSubject = (e: React.MouseEvent, s: Subject) => {
    e.stopPropagation();
    setEditingSubjectId(s.id);
    setEditSubName(s.name);
  };

  const saveEditSubject = () => {
    if (editingSubjectId && editSubName.trim()) {
      onUpdateSubject(editingSubjectId, editSubName.trim());
      setEditingSubjectId(null);
    }
  };

  const handleDeleteSubjectClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmDeleteSubjectId === id) {
      onDeleteSubject(id);
      setConfirmDeleteSubjectId(null);
    } else {
      setConfirmDeleteSubjectId(id);
      setTimeout(() => setConfirmDeleteSubjectId(null), 3000);
    }
  };

  const handleSaveNewModule = () => {
    if (currentSubject && newModuleName.trim()) {
      onAddModule(currentSubject.id, newModuleName.trim());
      setNewModuleName('');
      setIsAddingModule(false);
    }
  };

  const startEditModule = (m: LearningModule) => {
    setEditingModuleId(m.id);
    setEditModuleName(m.name);
  };

  const saveEditModule = () => {
    if (currentSubject && editingModuleId && editModuleName.trim()) {
      onUpdateModule(currentSubject.id, editingModuleId, editModuleName.trim());
      setEditingModuleId(null);
    }
  };

  const handleDeleteModuleClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmDeleteModuleId === id) {
      if (currentSubject) onDeleteModule(currentSubject.id, id);
      setConfirmDeleteModuleId(null);
    } else {
      setConfirmDeleteModuleId(id);
      setTimeout(() => setConfirmDeleteModuleId(null), 3000);
    }
  };

  const startEditLesson = (l: Lesson) => {
    setEditingLessonId(l.id);
    setEditLessonName(l.name);
    setEditLessonUrl(l.url || '');
  };

  const saveEditLesson = (moduleId: string) => {
    if (currentSubject && editingLessonId && editLessonName.trim()) {
      onUpdateLesson(currentSubject.id, moduleId, editingLessonId, {
        name: editLessonName.trim(),
        url: editLessonUrl.trim()
      });
      setEditingLessonId(null);
    }
  };

  const handleDeleteLessonClick = (e: React.MouseEvent, moduleId: string, lessonId: string) => {
    e.stopPropagation();
    if (confirmDeleteLessonId === lessonId) {
      if (currentSubject) onDeleteLesson(currentSubject.id, moduleId, lessonId);
      setConfirmDeleteLessonId(null);
    } else {
      setConfirmDeleteLessonId(lessonId);
      setTimeout(() => setConfirmDeleteLessonId(null), 3000);
    }
  };

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar Subjects */}
      <div className="w-72 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col shrink-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {q ? `Kết quả (${filteredSubjects.length})` : 'Danh mục môn'}
          </span>
          <div className="flex gap-1">
            <button onClick={() => setShowImport(true)} className="w-7 h-7 bg-green-50 text-green-600 rounded-lg flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-sm">
              <i className="fas fa-file-import text-[10px]"></i>
            </button>
            <button onClick={() => setShowAddSubject(!showAddSubject)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${showAddSubject ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'}`}>
              <i className={`fas ${showAddSubject ? 'fa-times' : 'fa-plus'} text-[10px]`}></i>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {showAddSubject && (
            <input 
              autoFocus placeholder="Nhập tên môn mới..."
              onKeyDown={(e) => { if(e.key === 'Enter' && newSubName.trim()) { onAddSubject(newSubName); setNewSubName(''); setShowAddSubject(false); } }}
              value={newSubName} onChange={e => setNewSubName(e.target.value)}
              className="w-full px-3 py-2 text-sm border-2 border-indigo-200 rounded-xl mb-2 outline-none focus:ring-2 focus:ring-indigo-500 animate-in slide-in-from-top-1"
            />
          )}
          {filteredSubjects.length === 0 ? (
            <div className="text-center py-10 opacity-40 italic text-xs">Không thấy môn phù hợp</div>
          ) : (
            filteredSubjects.map(s => {
              const isEditing = editingSubjectId === s.id;
              const isSelected = currentSubject?.id === s.id;
              const isConfirming = confirmDeleteSubjectId === s.id;
              
              return (
                <div key={s.id} className="group relative">
                  {isEditing ? (
                    <input 
                      autoFocus
                      value={editSubName}
                      onChange={e => setEditSubName(e.target.value)}
                      onBlur={saveEditSubject}
                      onKeyDown={e => e.key === 'Enter' && saveEditSubject()}
                      className="w-full px-4 py-3 text-sm border-2 border-indigo-400 rounded-xl outline-none"
                    />
                  ) : (
                    <div 
                      onClick={() => setSelectedSubjectId(s.id)}
                      className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-all text-sm font-bold cursor-pointer ${
                        isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-indigo-50 text-gray-600'
                      }`}
                    >
                      <i className={`fas ${s.icon || 'fa-folder'} opacity-70`}></i>
                      <span className="truncate flex-1 text-left">{s.name}</span>
                      <div className={`flex items-center gap-1 transition-opacity ${isSelected || isConfirming ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <span onClick={(e) => startEditSubject(e, s)} className="p-1 hover:bg-white/20 rounded-md transition-colors"><i className="fas fa-pencil-alt text-[10px]"></i></span>
                        <span 
                          onClick={(e) => handleDeleteSubjectClick(e, s.id)} 
                          className={`p-1 rounded-md transition-all duration-200 ${isConfirming ? 'bg-red-500 text-white text-[8px] px-2 animate-pulse font-black' : 'hover:bg-red-500'}`}
                        >
                          {isConfirming ? 'Xác nhận?' : <i className="fas fa-trash-alt text-[10px]"></i>}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar pb-10">
        {currentSubject ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-3xl flex items-center justify-center text-3xl shadow-xl shadow-indigo-100">
                  <i className={`fas ${currentSubject.icon || 'fa-folder'}`}></i>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 leading-tight">{currentSubject.name}</h2>
                  <p className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-lg">{currentSubject.modules.length} Học phần</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>Hệ thống quản lý giáo án</span>
                  </p>
                </div>
              </div>

              {!q && (
                <div className="flex items-center gap-2">
                  {isAddingModule ? (
                    <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                      <input 
                        autoFocus
                        placeholder="Tên học phần mới..."
                        className="px-4 py-2.5 border-2 border-indigo-400 rounded-2xl outline-none text-sm w-48 shadow-inner"
                        value={newModuleName}
                        onChange={e => setNewModuleName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveNewModule();
                          if (e.key === 'Escape') setIsAddingModule(false);
                        }}
                      />
                      <button 
                        onClick={handleSaveNewModule}
                        className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 shadow-md"
                      >
                        <i className="fas fa-check"></i>
                      </button>
                      <button 
                        onClick={() => setIsAddingModule(false)}
                        className="w-10 h-10 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center hover:bg-gray-200"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsAddingModule(true)}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200 group"
                    >
                      <i className="fas fa-folder-plus transition-transform group-hover:scale-110"></i> 
                      Thêm học phần
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-8">
              {currentSubject.modules
                .filter(m => {
                  if (!q) return true;
                  return m.name.toLowerCase().includes(q) || m.lessons.some(l => l.name.toLowerCase().includes(q));
                })
                .map(module => {
                  const isConfirmingModule = confirmDeleteModuleId === module.id;
                  const filteredLessons = q 
                    ? module.lessons.filter(l => l.name.toLowerCase().includes(q))
                    : module.lessons;

                  return (
                    <section key={module.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md animate-in fade-in">
                      <div className="px-8 py-5 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-500 shadow-sm">
                            <i className="fas fa-layer-group text-sm"></i>
                          </div>
                          {editingModuleId === module.id ? (
                            <input 
                              autoFocus
                              value={editModuleName}
                              onChange={e => setEditModuleName(e.target.value)}
                              onBlur={saveEditModule}
                              onKeyDown={e => e.key === 'Enter' && saveEditModule()}
                              className="px-3 py-1 bg-white border border-indigo-300 rounded-lg outline-none font-bold text-gray-700 shadow-inner"
                            />
                          ) : (
                            <h3 className="font-extrabold text-gray-800 flex items-center gap-2 cursor-pointer group/title" onClick={() => startEditModule(module)}>
                              {module.name}
                              <i className="fas fa-pencil-alt text-[10px] text-gray-300 opacity-0 group-hover/title:opacity-100 transition-opacity"></i>
                              {q && module.name.toLowerCase().includes(q) && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-black ml-2 animate-pulse">MATCH</span>}
                            </h3>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {!q && (
                            <button 
                              onClick={() => setActiveAddingModuleId(activeAddingModuleId === module.id ? null : module.id)}
                              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                activeAddingModuleId === module.id ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                              }`}
                            >
                              <i className={`fas ${activeAddingModuleId === module.id ? 'fa-times' : 'fa-plus'}`}></i>
                              {activeAddingModuleId === module.id ? 'Đóng' : 'Thêm bài học'}
                            </button>
                          )}
                          {!q && (
                            <button 
                              onClick={(e) => handleDeleteModuleClick(e, module.id)} 
                              className={`min-w-[32px] h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                isConfirmingModule ? 'bg-red-500 text-white px-4 text-[10px] font-black animate-pulse' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'
                              }`}
                            >
                              {isConfirmingModule ? 'Xác nhận xóa học phần?' : <i className="fas fa-trash-alt text-sm"></i>}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="p-8">
                        {activeAddingModuleId === module.id && (
                          <div className="mb-6 p-6 bg-indigo-50/50 rounded-2xl border-2 border-dashed border-indigo-200 flex flex-col md:flex-row gap-3 animate-in fade-in slide-in-from-top-2">
                            <input 
                              placeholder="Tên bài học (Vd: Bài 1...)" className="flex-1 px-4 py-3 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                              value={newLessonName} onChange={e => setNewLessonName(e.target.value)}
                            />
                            <input 
                              placeholder="Link bài giảng (URL)..." className="flex-[1.5] px-4 py-3 text-sm rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                              value={newLessonUrl} onChange={e => setNewLessonUrl(e.target.value)}
                            />
                            <button 
                              onClick={() => {
                                if(newLessonName.trim()) {
                                  onAddLesson(currentSubject.id, module.id, newLessonName.trim(), newLessonUrl.trim());
                                  setNewLessonName(''); setNewLessonUrl(''); setActiveAddingModuleId(null);
                                }
                              }}
                              className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                            >
                              Lưu bài học
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                          {filteredLessons.length > 0 ? filteredLessons.map((lesson, idx) => {
                            const isEditingLesson = editingLessonId === lesson.id;
                            const isConfirmingLesson = confirmDeleteLessonId === lesson.id;
                            
                            return (
                              <div key={lesson.id} className={`group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border transition-all ${isEditingLesson ? 'border-indigo-400 ring-2 ring-indigo-50 bg-indigo-50/20' : 'border-gray-50 hover:border-indigo-100 hover:bg-indigo-50/30 shadow-sm'} ${q && lesson.name.toLowerCase().includes(q) ? 'border-amber-200 bg-amber-50/20' : ''}`}>
                                {isEditingLesson ? (
                                  <div className="flex-1 flex flex-col md:flex-row gap-3">
                                    <input 
                                      className="flex-1 px-3 py-2 text-sm rounded-lg border-2 border-indigo-200 outline-none focus:border-indigo-500"
                                      value={editLessonName} onChange={e => setEditLessonName(e.target.value)}
                                    />
                                    <input 
                                      className="flex-[1.5] px-3 py-2 text-sm rounded-lg border-2 border-indigo-200 outline-none focus:border-indigo-500"
                                      value={editLessonUrl} onChange={e => setEditLessonUrl(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                      <button onClick={() => saveEditLesson(module.id)} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md">Lưu</button>
                                      <button onClick={() => setEditingLessonId(null)} className="px-5 py-2 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold">Hủy</button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-5">
                                      <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-xs font-black text-gray-400 shrink-0 border border-gray-100">
                                        {String(idx + 1).padStart(2, '0')}
                                      </div>
                                      <div className="min-w-0">
                                        <h4 className="font-bold text-gray-800 text-base mb-0.5 truncate">
                                          {lesson.name}
                                          {q && lesson.name.toLowerCase().includes(q) && <span className="text-[9px] bg-amber-400 text-white px-1.5 py-0.5 rounded ml-2">KHỚP</span>}
                                        </h4>
                                        <div className="flex items-center gap-3">
                                          {lesson.url ? (
                                            <a href={lesson.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1 font-medium truncate group-hover:text-indigo-700">
                                              <i className="fas fa-link text-[10px]"></i> {lesson.url}
                                            </a>
                                          ) : (
                                            <span className="text-[10px] text-gray-300 italic">Chưa gắn link giáo án</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className={`flex items-center gap-2 mt-4 md:mt-0 transition-all ${isConfirmingLesson ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0'}`}>
                                      {lesson.url && !isConfirmingLesson && (
                                        <a href={lesson.url} target="_blank" rel="noreferrer" className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-600 hover:text-white shadow-sm transition-all">
                                          <i className="fas fa-external-link-alt text-xs"></i>
                                        </a>
                                      )}
                                      {!isConfirmingLesson && !q && (
                                        <button 
                                          onClick={() => startEditLesson(lesson)}
                                          className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white shadow-sm transition-all"
                                        >
                                          <i className="fas fa-edit text-xs"></i>
                                        </button>
                                      )}
                                      {!q && (
                                        <button 
                                          onClick={(e) => handleDeleteLessonClick(e, module.id, lesson.id)}
                                          className={`h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                            isConfirmingLesson ? 'bg-red-500 text-white px-5 text-xs font-black animate-pulse' : 'w-10 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white shadow-sm'
                                          }`}
                                        >
                                          {isConfirmingLesson ? 'Xác nhận xóa bài?' : <i className="fas fa-trash-alt text-xs"></i>}
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          }) : (
                            <div className="text-center py-10 bg-gray-50/30 rounded-3xl border-2 border-dashed border-gray-100">
                              <i className="fas fa-book-open text-gray-200 text-3xl mb-3"></i>
                              <p className="text-xs text-gray-400 font-medium">Không tìm thấy bài giảng phù hợp.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  );
                })}
              {currentSubject.modules.length > 0 && currentSubject.modules.filter(m => {
                  if (!q) return true;
                  return m.name.toLowerCase().includes(q) || m.lessons.some(l => l.name.toLowerCase().includes(q));
              }).length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 opacity-50 italic">
                  Không tìm thấy nội dung khớp trong môn học này.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-300 italic gap-4">
            <i className="fas fa-graduation-cap text-6xl opacity-20"></i>
            <p className="font-bold text-xl">
              {q ? 'Không tìm thấy môn học nào khớp' : 'Vui lòng chọn hoặc tạo môn học mới'}
            </p>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-indigo-950/40 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <i className="fas fa-magic text-xl"></i>
                </div>
                <div>
                  <h3 className="font-black text-xl text-gray-800">Nhập dữ liệu AI</h3>
                  <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Tự động phân tích Sheet</p>
                </div>
              </div>
              <button onClick={() => setShowImport(false)} className="w-10 h-10 rounded-full hover:bg-gray-200 text-gray-400 flex items-center justify-center transition-colors">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-8">
              <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-4">
                <i className="fas fa-lightbulb text-amber-500 mt-1"></i>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  Copy dữ liệu từ Google Sheet (Tên môn, Tên học phần, Tên bài, Link) và dán vào đây. 
                  AI sẽ tự động sắp xếp vào đúng mục cho bạn.
                </p>
              </div>
              <textarea 
                className="w-full h-64 p-6 bg-gray-50 border-2 border-gray-100 rounded-[32px] outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-mono placeholder:text-gray-300 shadow-inner"
                placeholder="Dán nội dung từ Sheet tại đây..."
                value={importText} onChange={e => setImportText(e.target.value)}
              />
              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setShowImport(false)}
                  className="flex-1 py-4 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleImport} disabled={loading || !importText.trim()}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-[24px] font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                >
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-rocket"></i>}
                  {loading ? 'Đang phân tích dữ liệu...' : 'Xác nhận nhập dữ liệu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonPlans;
