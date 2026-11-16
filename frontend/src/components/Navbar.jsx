import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setViewMode, fetchQuizzes } from '../store/quizSlice';
import { Sparkles, BookOpen, Brain, PlusCircle } from 'lucide-react';

export default function Navbar() {
  const dispatch = useDispatch();
  const { viewMode, pagination } = useSelector((state) => state.quiz);

  const handleNav = (mode) => {
    dispatch(setViewMode(mode));
    if (mode === 'list') {
      dispatch(fetchQuizzes({ page: 1 }));
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div 
            onClick={() => handleNav('create')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 bg-clip-text text-transparent">
                LessonQuiz AI
              </span>
              <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                For Kids Aged 8–14
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center gap-2">
            <button
              onClick={() => handleNav('create')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                viewMode === 'create'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-600/20'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Quiz</span>
            </button>

            <button
              onClick={() => handleNav('list')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-600/20'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Saved Quizzes</span>
              {pagination.total > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${
                  viewMode === 'list'
                    ? 'bg-white text-indigo-700'
                    : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {pagination.total}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
