import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Navbar from './components/Navbar';
import QuizForm from './components/QuizForm';
import QuizList from './components/QuizList';
import QuizPlayer from './components/QuizPlayer';
import { fetchQuizzes } from './store/quizSlice';
import { Heart, Sparkles } from 'lucide-react';

export default function App() {
  const dispatch = useDispatch();
  const { viewMode } = useSelector((state) => state.quiz);

  // Initial load of saved quizzes metadata
  useEffect(() => {
    dispatch(fetchQuizzes({ page: 1, size: 9 }));
  }, [dispatch]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Decorative Ambient Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-purple-200/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-pink-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main App Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 pb-16">
          {viewMode === 'create' && <QuizForm />}
          {viewMode === 'list' && <QuizList />}
          {viewMode === 'play' && <QuizPlayer />}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-md py-6 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>LessonQuiz AI</span>
              <span className="text-slate-400 font-normal">• Generates 5-Question MCQs for Kids 8–14</span>
            </div>

            <p className="text-slate-400 font-medium">
              Built with FastAPI, SQLite, React & Redux Toolkit
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
