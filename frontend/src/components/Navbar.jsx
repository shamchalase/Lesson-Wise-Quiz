import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setViewMode, fetchQuizzes } from '../store/quizSlice';
import {
  Sparkles,
  BookOpen,
  Brain,
  PlusCircle,
  Github,
  Zap,
} from 'lucide-react';

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
    <header className="sticky top-0 z-40 w-full transition-all duration-300 pt-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto glass-panel rounded-2xl shadow-sm border border-slate-200/80 px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between">
          {/* Brand & Logo */}
          <div
            onClick={() => handleNav('create')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 group-hover:rotate-3 transition-transform">
                <Brain className="w-5 h-5" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 bg-clip-text text-transparent">
                  LessonQuiz AI
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  Kids 8–14
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 hidden sm:block">
                Interactive Multiple-Choice Generator
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => handleNav('create')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  viewMode === 'create'
                    ? 'bg-white text-indigo-600 shadow-sm shadow-slate-200'
                    : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Quiz</span>
              </button>

              <button
                onClick={() => handleNav('list')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all relative ${
                  viewMode === 'list'
                    ? 'bg-white text-indigo-600 shadow-sm shadow-slate-200'
                    : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Saved</span>
                {pagination.total > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold bg-indigo-100 text-indigo-700">
                    {pagination.total}
                  </span>
                )}
              </button>
            </nav>

            {/* GitHub Link */}
            <a
              href="https://github.com/shamchalase/Lesson-Wise-Quiz"
              target="_blank"
              rel="noreferrer"
              title="View on GitHub"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition border border-transparent hover:border-slate-200 hidden sm:flex items-center"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
