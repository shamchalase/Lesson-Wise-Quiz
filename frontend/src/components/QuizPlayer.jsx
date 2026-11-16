import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import confetti from 'canvas-confetti';
import {
  selectAnswer,
  setCurrentQuestionIndex,
  nextQuestion,
  prevQuestion,
  submitQuizAnswers,
  resetPlayer,
  setViewMode,
} from '../store/quizSlice';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Award,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  BookOpen,
  User,
  Sparkles,
  Check,
} from 'lucide-react';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizPlayer() {
  const dispatch = useDispatch();
  const { activeQuiz, player, isLoadingQuiz } = useSelector((state) => state.quiz);

  const questions = activeQuiz?.questions || [];
  const currentQIndex = player.currentQuestionIndex;
  const currentQuestion = questions[currentQIndex];
  const selectedOptionId = currentQuestion ? player.selectedAnswers[currentQuestion.id] : null;

  const totalAnswered = Object.keys(player.selectedAnswers).length;
  const allAnswered = questions.length > 0 && totalAnswered === questions.length;

  useEffect(() => {
    if (player.isSubmitted) {
      // Trigger festive confetti for celebration!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [player.isSubmitted]);

  if (isLoadingQuiz || !activeQuiz) {
    return (
      <div className="py-24 text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Loading quiz session...</p>
      </div>
    );
  }

  const handleOptionSelect = (optionId) => {
    if (player.isSubmitted) return;
    dispatch(selectAnswer({ questionId: currentQuestion.id, optionId }));
  };

  const handleRetake = () => {
    dispatch(resetPlayer());
  };

  const getScoreBadge = (score, total) => {
    const pct = Math.round((score / total) * 100);
    if (pct === 100) return { title: 'Perfect Score! 🏆', desc: 'Outstanding mastery of the lesson material!', color: 'from-amber-500 to-yellow-400' };
    if (pct >= 80) return { title: 'Quiz Star! 🌟', desc: 'Fantastic job! You really understood the key concepts.', color: 'from-emerald-500 to-teal-400' };
    if (pct >= 60) return { title: 'Great Effort! 👍', desc: 'Good progress! A quick review will get you to 100%.', color: 'from-indigo-500 to-blue-400' };
    return { title: 'Keep Practicing! 💪', desc: 'Learning is a journey! Check the explanations below.', color: 'from-purple-500 to-pink-400' };
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => dispatch(setViewMode('list'))}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quizzes</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
            <User className="w-3.5 h-3.5" />
            Age {activeQuiz.age}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            5 Questions
          </span>
        </div>
      </div>

      {/* Quiz Card Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl shadow-slate-100">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          {activeQuiz.title}
        </h1>

        {/* ============================================================== */}
        {/* RESULT / SCORE VIEW (AFTER SUBMISSION)                        */}
        {/* ============================================================== */}
        {player.isSubmitted ? (
          <div>
            {/* Score Hero Banner */}
            {(() => {
              const badge = getScoreBadge(player.score, player.totalQuestions);
              const pct = Math.round((player.score / player.totalQuestions) * 100);
              return (
                <div className={`mt-6 p-8 rounded-3xl bg-gradient-to-tr ${badge.color} text-white shadow-lg text-center relative overflow-hidden`}>
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Quiz Complete
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold mb-1">{badge.title}</h2>
                    <p className="text-white/90 text-sm max-w-md mx-auto mb-4">{badge.desc}</p>
                    <div className="text-5xl sm:text-6xl font-black tracking-tight">
                      {player.score} <span className="text-2xl sm:text-3xl font-normal opacity-80">/ {player.totalQuestions}</span>
                    </div>
                    <div className="text-sm font-bold opacity-90 mt-1">({pct}% Correct)</div>
                  </div>
                </div>
              );
            })()}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <button
                onClick={handleRetake}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake Quiz</span>
              </button>
              <button
                onClick={() => dispatch(setViewMode('create'))}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create New Quiz</span>
              </button>
            </div>

            {/* Detailed Question Review */}
            <div className="mt-12">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Question Breakdown & Explanations
              </h3>

              <div className="space-y-6">
                {questions.map((q, qIndex) => {
                  const chosenOptId = player.selectedAnswers[q.id];
                  const correctOpt = q.options.find((opt) => opt.is_correct);
                  const isUserCorrect = chosenOptId === correctOpt?.id;

                  return (
                    <div
                      key={q.id}
                      className={`p-6 rounded-2xl border transition-all ${
                        isUserCorrect
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-rose-50/30 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                            isUserCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {isUserCorrect ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Question {qIndex + 1}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 leading-snug">
                            {q.question_text}
                          </h4>
                        </div>
                      </div>

                      {/* Options List */}
                      <div className="space-y-2 mb-4 pl-10">
                        {q.options.map((opt, oIndex) => {
                          const isChosen = opt.id === chosenOptId;
                          const isRight = opt.is_correct;

                          let optionStyle = 'border-slate-200 bg-white text-slate-700';
                          if (isRight) {
                            optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                          } else if (isChosen && !isRight) {
                            optionStyle = 'border-rose-400 bg-rose-50 text-rose-900 font-bold';
                          }

                          return (
                            <div
                              key={opt.id}
                              className={`p-3 rounded-xl border text-sm flex items-center justify-between ${optionStyle}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                  {OPTION_LETTERS[oIndex]}
                                </span>
                                <span>{opt.option_text}</span>
                              </div>
                              <div className="text-xs font-bold">
                                {isRight && <span className="text-emerald-700">✓ Correct Answer</span>}
                                {isChosen && !isRight && <span className="text-rose-600">✗ Your Choice</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Kid-Friendly Explanation */}
                      {q.explanation && (
                        <div className="pl-10">
                          <div className="p-3.5 rounded-xl bg-white/80 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2.5">
                            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-slate-900 font-bold">Why: </strong>
                              {q.explanation}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* ACTIVE QUIZ QUESTION PLAYER                                   */
          /* ============================================================== */
          <div>
            {/* Progress Header */}
            <div className="mt-4 mb-8">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                <span>Question {currentQIndex + 1} of {questions.length}</span>
                <span>{totalAnswered} of {questions.length} Answered</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question Navigation Dots */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {questions.map((q, idx) => {
                  const isAnswered = player.selectedAnswers[q.id] !== undefined;
                  const isCurrent = idx === currentQIndex;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => dispatch(setCurrentQuestionIndex(idx))}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-110 ring-2 ring-indigo-400/40'
                          : isAnswered
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Question Body */}
            {currentQuestion && (
              <div>
                <div className="p-4 sm:p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 mb-6">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                    Question {currentQIndex + 1}
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                    {currentQuestion.question_text}
                  </h2>
                </div>

                {/* 4 Options Grid */}
                <div className="space-y-3 mb-8">
                  {currentQuestion.options.map((opt, oIndex) => {
                    const isSelected = selectedOptionId === opt.id;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleOptionSelect(opt.id)}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 shadow-md shadow-indigo-100'
                            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <span
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                            }`}
                          >
                            {OPTION_LETTERS[oIndex]}
                          </span>
                          <span className={`text-sm sm:text-base font-semibold ${
                            isSelected ? 'text-indigo-950' : 'text-slate-800'
                          }`}>
                            {opt.option_text}
                          </span>
                        </div>

                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 group-hover:border-indigo-400'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Question Footer Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => dispatch(prevQuestion())}
                    disabled={currentQIndex === 0}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                      currentQIndex === 0
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {currentQIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => dispatch(nextQuestion())}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => dispatch(submitQuizAnswers())}
                      disabled={!allAnswered}
                      className={`flex items-center gap-2 px-7 py-3 rounded-2xl font-extrabold text-sm shadow-lg transition-all ${
                        allAnswered
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-200 hover:scale-105'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <Award className="w-4 h-4" />
                      <span>{allAnswered ? 'Submit & See Score!' : `Answer all questions (${totalAnswered}/${questions.length})`}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
