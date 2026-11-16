import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchQuizzes, fetchQuizById, deleteQuiz, setViewMode } from '../store/quizSlice';
import {
  BookOpen,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Play,
  Trash2,
  PlusCircle,
  HelpCircle,
  Loader2,
  Search,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function QuizList() {
  const dispatch = useDispatch();
  const { quizzes, pagination, isLoadingList, error } = useSelector((state) => state.quiz);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchQuizzes({ page: 1 }));
  }, [dispatch]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      dispatch(fetchQuizzes({ page: newPage }));
    }
  };

  const handlePlayQuiz = (id) => {
    dispatch(fetchQuizById(id));
  };

  const handleDeleteQuiz = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      dispatch(deleteQuiz(id));
    }
  };

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const filteredQuizzes = quizzes.filter((q) =>
    q.title.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </span>
            <span>Saved Lesson Quizzes</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Browse all saved quizzes, review previous materials, or launch a live quiz session.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search quizzes..."
              className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-medium w-40 sm:w-56 bg-white shadow-sm"
            />
          </div>

          <button
            onClick={() => dispatch(setViewMode('create'))}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-200 hover:shadow-indigo-300 transition shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Quiz</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingList ? (
        <div className="py-24 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-slate-600 font-bold text-sm">Loading quiz collection...</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-xl shadow-slate-100/60 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-1.5">
            {searchTerm ? 'No Matching Quizzes Found' : 'No Quizzes Saved Yet'}
          </h3>
          <p className="text-slate-500 text-sm mb-6 font-medium">
            {searchTerm
              ? `No quizzes matched "${searchTerm}". Try a different keyword.`
              : 'Paste your first educational passage to generate a fun 5-question multiple choice quiz!'}
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              dispatch(setViewMode('create'));
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-sm shadow-md shadow-indigo-200 hover:scale-105 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{searchTerm ? 'Clear Search & Create' : 'Create Your First Quiz'}</span>
          </button>
        </div>
      ) : (
        /* Quizzes Grid */
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                onClick={() => handlePlayQuiz(quiz.id)}
                className="group relative bg-white rounded-3xl p-6 border border-slate-200/90 hover:border-indigo-400 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                {/* Accent Top Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80 group-hover:opacity-100 transition-opacity" />

                <div>
                  {/* Top Metadata Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black border border-indigo-100">
                      <User className="w-3 h-3" />
                      Age {quiz.age}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                      <HelpCircle className="w-3 h-3 text-slate-400" />
                      {quiz.question_count || 5} Questions
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug mb-2.5">
                    {quiz.title}
                  </h3>

                  {/* Date Created */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Created: {formatDate(quiz.created_at)}</span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3.5 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-black text-indigo-600 group-hover:text-indigo-700">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </span>
                    <span>Start Quiz</span>
                  </div>

                  <button
                    type="button"
                    title="Delete Quiz"
                    onClick={(e) => handleDeleteQuiz(e, quiz.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="mt-9 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className={`p-2.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-1 transition ${
                  pagination.page <= 1
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100 bg-white shadow-sm'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs font-black text-slate-600 px-3 py-1 rounded-lg bg-slate-100">
                Page {pagination.page} of {pagination.pages} ({pagination.total} Total)
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className={`p-2.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-1 transition ${
                  pagination.page >= pagination.pages
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100 bg-white shadow-sm'
                }`}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
