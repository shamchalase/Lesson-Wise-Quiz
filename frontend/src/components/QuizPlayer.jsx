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
  Trophy,
  Flame,
  Lightbulb,
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
      // Multiple celebratory confetti bursts!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 300);
    }
  }, [player.isSubmitted]);

  if (isLoadingQuiz || !activeQuiz) {
    return (
      <div className="py-24 text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-extrabold text-sm">Loading quiz session...</p>
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
    if (pct === 100) return { title: 'Perfect Score! 🏆', desc: 'Outstanding! You answered every question correctly!', color: 'from-amber-500 via-orange-500 to-yellow-400', emoji: '🏆' };
    if (pct >= 80) return { title: 'Quiz Champion! 🌟', desc: 'Fantastic performance! You clearly understood the core concepts.', color: 'from-emerald-500 via-teal-500 to-cyan-400', emoji: '🌟' };
    if (pct >= 60) return { title: 'Great Effort! 👍', desc: 'Good work! Review the explanations below to reach 100%.', color: 'from-indigo-600 via-purple-600 to-blue-500', emoji: '🎉' };
    return { title: 'Keep Learning! 💪', desc: 'Great practice! Check the explanations below to master these concepts.', color: 'from-purple-600 via-pink-600 to-rose-500', emoji: '💡' };
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Breadcrumb Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => dispatch(setViewMode('list'))}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-slate-500 hover:text-indigo-600 transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Quizzes</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black border border-indigo-100">
            <User className="w-3.5 h-3.5" />
            Age {activeQuiz.age}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            5 Questions
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xl shadow-slate-100/80 relative overflow-hidden">
        {/* Accent Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
          {activeQuiz.title}
        </h1>

        {/* ============================================================== */}
        {/* POST-SUBMISSION RESULTS VIEW                                   */}
        {/* ============================================================== */}
        {player.isSubmitted ? (
          <div>
            {/* Score Hero Banner */}
            {(() => {
              const badge = getScoreBadge(player.score, player.totalQuestions);
              const pct = Math.round((player.score / player.totalQuestions) * 100);
              return (
                <div
                  className={`mt-6 p-8 rounded-3xl bg-gradient-to-tr ${badge.color} text-white shadow-xl shadow-indigo-100 text-center relative overflow-hidden`}
                >
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider mb-2.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Quiz Results</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-black mb-1">{badge.title}</h2>
                    <p className="text-white/90 text-sm max-w-md mx-auto mb-5 font-medium">{badge.desc}</p>

                    <div className="inline-flex items-baseline gap-2 bg-white/15 px-6 py-3 rounded-2xl backdrop-blur-md">
                      <span className="text-5xl sm:text-6xl font-black tracking-tight">{player.score}</span>
                      <span className="text-2xl sm:text-3xl font-bold opacity-80">/ {player.totalQuestions}</span>
                      <span className="text-base sm:text-lg font-black ml-2 text-yellow-200">({pct}% Correct)</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <button
                onClick={handleRetake}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md shadow-indigo-200 transition hover:scale-105"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retake Quiz</span>
              </button>
              <button
                onClick={() => dispatch(setViewMode('create'))}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-sm transition hover:scale-105"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create New Quiz</span>
              </button>
            </div>

            {/* Question Breakdown */}
            <div className="mt-12">
              <div className="flex items-center gap-2.5 mb-6">
                <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  Detailed Answers & Explanations
                </h3>
              </div>

              <div className="space-y-6">
                {questions.map((q, qIndex) => {
                  const chosenOptId = player.selectedAnswers[q.id];
                  const correctOpt = q.options.find((opt) => opt.is_correct);
                  const isUserCorrect = chosenOptId === correctOpt?.id;

                  return (
                    <div
                      key={q.id}
                      className={`p-6 rounded-3xl border-2 transition-all ${
                        isUserCorrect
                          ? 'bg-emerald-50/30 border-emerald-200/90'
                          : 'bg-rose-50/20 border-rose-200/90'
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-start gap-3 mb-4">
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 mt-0.5 shadow-sm ${
                            isUserCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {isUserCorrect ? <Check className="w-4 h-4 stroke-[3]" /> : <XCircle className="w-4 h-4 stroke-[2.5]" />}
                        </span>
                        <div>
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
                            Question {qIndex + 1}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 leading-snug">
                            {q.question_text}
                          </h4>
                        </div>
                      </div>

                      {/* 4 Choices */}
                      <div className="space-y-2 mb-4 pl-11">
                        {q.options.map((opt, oIndex) => {
                          const isChosen = opt.id === chosenOptId;
                          const isRight = opt.is_correct;

                          let optionStyle = 'border-slate-200 bg-white text-slate-700';
                          if (isRight) {
                            optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                          } else if (isChosen && !isRight) {
                            optionStyle = 'border-rose-400 bg-rose-50 text-rose-950 font-bold';
                          }

                          return (
                            <div
                              key={opt.id}
                              className={`p-3.5 rounded-2xl border text-sm flex items-center justify-between ${optionStyle}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                                  isRight ? 'bg-emerald-600 text-white' : isChosen ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {OPTION_LETTERS[oIndex]}
                                </span>
                                <span>{opt.option_text}</span>
                              </div>
                              <div className="text-xs font-bold">
                                {isRight && <span className="text-emerald-700 font-extrabold flex items-center gap-1">✓ Correct Answer</span>}
                                {isChosen && !isRight && <span className="text-rose-600 font-extrabold flex items-center gap-1">✗ Your Selection</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="pl-11">
                          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 text-xs text-slate-700 flex items-start gap-2.5 shadow-sm">
                            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-slate-900 font-extrabold">Educational Explanation: </strong>
                              <span className="font-medium text-slate-600 leading-relaxed">{q.explanation}</span>
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
            {/* Progress Bar & Jump Dots */}
            <div className="mt-4 mb-8">
              <div className="flex items-center justify-between text-xs font-black text-slate-500 mb-2">
                <span>Question {currentQIndex + 1} of {questions.length}</span>
                <span className="text-indigo-600 font-extrabold">{totalAnswered} of {questions.length} Answered</span>
              </div>

              {/* Bar */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Jump Dots */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {questions.map((q, idx) => {
                  const isAnswered = player.selectedAnswers[q.id] !== undefined;
                  const isCurrent = idx === currentQIndex;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => dispatch(setCurrentQuestionIndex(idx))}
                      className={`w-9 h-9 rounded-2xl text-xs font-black transition-all ${
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

            {/* Question Text Box */}
            {currentQuestion && (
              <div>
                <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-slate-50 border border-indigo-100/80 mb-6">
                  <span className="text-[11px] font-black text-indigo-700 uppercase tracking-wider block mb-1">
                    Question {currentQIndex + 1}
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                    {currentQuestion.question_text}
                  </h2>
                </div>

                {/* 4 Choices */}
                <div className="space-y-3 mb-8">
                  {currentQuestion.options.map((opt, oIndex) => {
                    const isSelected = selectedOptionId === opt.id;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleOptionSelect(opt.id)}
                        className={`w-full text-left p-4 sm:p-4.5 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 shadow-md shadow-indigo-100'
                            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <span
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                            }`}
                          >
                            {OPTION_LETTERS[oIndex]}
                          </span>
                          <span className={`text-sm sm:text-base font-bold ${
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

                {/* Navigation Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => dispatch(prevQuestion())}
                    disabled={currentQIndex === 0}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition ${
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
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-200 transition"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => dispatch(submitQuizAnswers())}
                      disabled={!allAnswered}
                      className={`flex items-center gap-2 px-7 py-3 rounded-2xl font-black text-sm shadow-lg transition-all ${
                        allAnswered
                          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white shadow-emerald-200 hover:scale-105'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <Trophy className="w-4 h-4" />
                      <span>{allAnswered ? 'Submit & See Score! 🏆' : `Answer all questions (${totalAnswered}/${questions.length})`}</span>
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
