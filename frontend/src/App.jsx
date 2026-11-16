import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Navbar from './components/Navbar';
import QuizForm from './components/QuizForm';
import QuizList from './components/QuizList';
import QuizPlayer from './components/QuizPlayer';
import { fetchQuizzes } from './store/quizSlice';

export default function App() {
  const dispatch = useDispatch();
  const { viewMode } = useSelector((state) => state.quiz);

  // Initial load of saved quizzes metadata
  useEffect(() => {
    dispatch(fetchQuizzes({ page: 1, size: 9 }));
  }, [dispatch]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-indigo-50/20 to-slate-100">
      <Navbar />

      <main className="flex-1 pb-16">
        {viewMode === 'create' && <QuizForm />}
        {viewMode === 'list' && <QuizList />}
        {viewMode === 'play' && <QuizPlayer />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4">
          <p className="font-medium text-slate-600">
            Lesson Quiz Generator • Built with FastAPI, SQLite, React & Redux
          </p>
          <p className="mt-1 text-slate-400">
            Tailored 5-question multiple choice quizzes for kids aged 8–14.
          </p>
        </div>
      </footer>
    </div>
  );
}
