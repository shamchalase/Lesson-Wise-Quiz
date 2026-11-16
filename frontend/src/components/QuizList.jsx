import React, { useEffect } from 'react';
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
} from 'lucide-react';

export default function QuizList() {
  const dispatch = useDispatch();
  const { quizzes, pagination, isLoadingList, error } = useSelector((state) => state.quiz);

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

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            Saved Lesson Quizzes
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse all saved quizzes, review previous materials, or launch a live quiz session.
          </p>
        </div>
        <button
          onClick={() => dispatch(setViewMode('create'))}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Quiz</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoadingList ? (
        <div className="py-20 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-sm">Loading quizzes...</p>
        </div>
      ) : quizzes.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Quizzes Created Yet</h3>
          <p className="text-slate-500 text-sm mb-6">
            Get started by creating your very first 5-question quiz from any lesson text!
          </p>
          <button
            onClick={() => dispatch(setViewMode('create'))}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Your First Quiz</span>
          </button>
        </div>
      ) : (
        /* Quizzes Grid */
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                onClick={() => handlePlayQuiz(quiz.id)}
                className="group bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-indigo-500/60 shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                      <User className="w-3 h-3" />
                      Age {quiz.age}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                      <HelpCircle className="w-3 h-3" />
                      {quiz.question_count || 5} Questions
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-2 mb-2">
                    {quiz.title}
                  </h3>

                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(quiz.created_at)}</span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold text-indigo-600 group-hover:underline flex items-center gap-1">
                    <Play className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
                    Take Quiz
                  </span>

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
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className={`p-2.5 rounded-xl border text-sm font-semibold flex items-center gap-1 transition ${
                  pagination.page <= 1
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs font-bold text-slate-500 px-3">
                Page {pagination.page} of {pagination.pages} ({pagination.total} quizzes)
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className={`p-2.5 rounded-xl border text-sm font-semibold flex items-center gap-1 transition ${
                  pagination.page >= pagination.pages
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
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
