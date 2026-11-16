import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createQuiz, clearError } from '../store/quizSlice';
import {
  Sparkles,
  AlertCircle,
  BookOpen,
  User,
  FileText,
  Loader2,
  CheckCircle2,
  Wand2,
  Zap,
  Check,
  ChevronRight,
  Flame,
} from 'lucide-react';

const AGE_CONFIGS = [
  { age: 8, grade: '3rd Grade', emoji: '🐣', tag: 'Beginner' },
  { age: 9, grade: '4th Grade', emoji: '🦁', tag: 'Curious' },
  { age: 10, grade: '5th Grade', emoji: '🚀', tag: 'Explorer' },
  { age: 11, grade: '6th Grade', emoji: '⚡', tag: 'Discoverer' },
  { age: 12, grade: '7th Grade', emoji: '🎯', tag: 'Challenger' },
  { age: 13, grade: '8th Grade', emoji: '🔬', tag: 'Investigator' },
  { age: 14, grade: '9th Grade', emoji: '🧠', tag: 'Advanced' },
];

const SAMPLE_LESSONS = [
  {
    title: 'The Wonders of Photosynthesis',
    age: 10,
    category: '🌿 Botany & Biology',
    text: `Photosynthesis is the amazing process by which green plants make their own food! Plants absorb sunlight using a special green pigment called chlorophyll, which is inside their leaves. They also take in water from the soil through their roots and carbon dioxide gas from the air through tiny openings in leaves called stomata. 

Using the sun's powerful energy, plants chemically transform the water and carbon dioxide into glucose, which is a type of natural sugar that plants use for energy and growth. As a wonderful byproduct, plants release fresh oxygen into the air, which humans and animals need to breathe. Without photosynthesis, life on Earth could not survive!`,
  },
  {
    title: 'Journey Through Our Solar System',
    age: 9,
    category: '🚀 Astronomy & Space',
    text: `Our solar system is an incredible cosmic neighborhood located inside the Milky Way galaxy! At the very center sits our Sun, a giant glowing ball of hot plasma that holds 99.8% of all the mass in the solar system. Eight unique planets orbit around the Sun. 

The four inner rocky planets are Mercury, Venus, Earth, and Mars. Earth is the only known planet with liquid water and living organisms. Beyond Mars lies the asteroid belt, followed by the four outer gas and ice giants: Jupiter, Saturn, Uranus, and Neptune. Jupiter is the largest planet, so huge that all other planets could fit inside it! Saturn is famous for its bright, glittering rings made of ice and rock fragments.`,
  },
  {
    title: 'Mysteries of Ancient Egyptian Pyramids',
    age: 12,
    category: '🏛️ World History',
    text: `Ancient Egypt was one of the world's most fascinating and enduring civilizations, flourishing along the fertile banks of the Nile River for thousands of years. Among their greatest architectural achievements were the monumental stone pyramids, built primarily during the Old and Middle Kingdom periods as royal tombs for pharaohs. 

The Great Pyramid of Giza, constructed for Pharaoh Khufu around 2560 BCE, remained the tallest human-made structure on Earth for more than 3,800 years! It required an estimated 2.3 million large limestone blocks, each weighing several tons. Skilled Egyptian architects, surveyors, and tens of thousands of dedicated seasonal laborers coordinated precisely using star alignments and copper tools to build these geometric wonders.`,
  },
];

export default function QuizForm() {
  const dispatch = useDispatch();
  const { isGenerating, error } = useSelector((state) => state.quiz);

  const [title, setTitle] = useState('');
  const [age, setAge] = useState(10);
  const [lessonText, setLessonText] = useState('');
  const [localError, setLocalError] = useState('');
  const [generationStep, setGenerationStep] = useState(0);

  const textLength = lessonText.trim().length;
  const isTooShort = textLength < 50;
  const isTooLong = textLength > 5000;
  const isValidLength = !isTooShort && !isTooLong;

  // Dynamic progress steps animation during generation
  useEffect(() => {
    let interval;
    if (isGenerating) {
      setGenerationStep(1);
      interval = setInterval(() => {
        setGenerationStep((prev) => (prev < 4 ? prev + 1 : prev));
      }, 900);
    } else {
      setGenerationStep(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleLoadSample = (sample) => {
    setTitle(sample.title);
    setAge(sample.age);
    setLessonText(sample.text);
    setLocalError('');
    dispatch(clearError());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isGenerating) return; // Prevent double submission

    setLocalError('');
    dispatch(clearError());

    const cleanTitle = title.trim();
    const cleanText = lessonText.trim();

    if (!cleanTitle) {
      setLocalError('Please provide an engaging title for your quiz.');
      return;
    }
    if (cleanText.length < 50) {
      setLocalError(`Lesson text is too short (${cleanText.length} characters). It must be at least 50 characters.`);
      return;
    }
    if (cleanText.length > 5000) {
      setLocalError(`Lesson text is too long (${cleanText.length} characters). Maximum allowed is 5,000 characters.`);
      return;
    }
    if (age < 8 || age > 14) {
      setLocalError('Target age must be between 8 and 14.');
      return;
    }

    dispatch(createQuiz({ title: cleanTitle, lesson_text: cleanText, age }));
  };

  // Character progress percentage for meter (0 to 100%)
  const meterPercentage = Math.min(100, Math.round((textLength / 5000) * 100));

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Hero Header */}
      <div className="text-center mb-8 relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/80 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3.5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} />
          <span>LLM-Powered Educational Tool</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          <span>Kids 8–14</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Turn Any Lesson Into a{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Fun 5-Question Quiz
          </span>
        </h1>
        <p className="mt-3 text-slate-600 text-sm sm:text-base max-w-2xl mx-auto font-medium">
          Simply paste reading material below. The AI educator automatically creates 5 balanced multiple-choice questions with 4 options and child-friendly explanations!
        </p>
      </div>

      {/* Preset Lesson Cards */}
      <div className="mb-7 bg-white/70 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Try 1-Click Sample Lessons</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Click any to auto-fill</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {SAMPLE_LESSONS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isGenerating}
              onClick={() => handleLoadSample(sample)}
              className="group text-left p-3.5 rounded-xl bg-slate-50 hover:bg-white hover:border-indigo-500 border border-slate-200/80 text-slate-700 transition-all shadow-sm hover:shadow-md hover:scale-[1.01]"
            >
              <div className="text-[11px] font-bold text-indigo-600 mb-1 flex items-center justify-between">
                <span>{sample.category}</span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-[10px]">Age {sample.age}</span>
              </div>
              <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 line-clamp-1 transition-colors">
                {sample.title}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {(localError || error) && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-sm animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-semibold">{localError || error}</div>
          <button
            type="button"
            onClick={() => {
              setLocalError('');
              dispatch(clearError());
            }}
            className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Form Container */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-6 sm:p-9 shadow-xl shadow-slate-100/80 border border-slate-200/90 relative overflow-hidden"
      >
        {/* Subtle decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* 1. Quiz Title */}
        <div className="mb-6">
          <label className="block text-sm font-extrabold text-slate-800 mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Quiz Title</span>
            <span className="text-rose-500 font-bold">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isGenerating}
            placeholder="e.g. Exploring the Great Barrier Reef"
            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-600 text-sm text-slate-800 placeholder-slate-400 font-medium transition shadow-sm"
            maxLength={200}
            required
          />
        </div>

        {/* 2. Target Age Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <label className="block text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span>Target Age Group</span>
              <span className="text-rose-500 font-bold">*</span>
            </label>
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Selected: Age {age} ({AGE_CONFIGS.find((c) => c.age === age)?.grade})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {AGE_CONFIGS.map((item) => {
              const isSelected = age === item.age;
              return (
                <button
                  key={item.age}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setAge(item.age)}
                  className={`p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/80 shadow-md shadow-indigo-100 scale-105'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xl">{item.emoji}</span>
                  <span className={`text-sm font-black ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                    Age {item.age}
                  </span>
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {item.grade}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Lesson Text Field with Live Meter */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Lesson Reading Text</span>
              <span className="text-rose-500 font-bold">*</span>
            </label>

            {/* Live Character Badge */}
            <span
              className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full transition-colors ${
                isTooShort
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : isTooLong
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {textLength.toLocaleString()} / 5,000 chars
              {isTooShort && textLength > 0 && ` (need ${50 - textLength} more)`}
            </span>
          </div>

          <textarea
            value={lessonText}
            onChange={(e) => setLessonText(e.target.value)}
            disabled={isGenerating}
            rows={7}
            placeholder="Paste your lesson paragraphs, story, science article, or history passage here (between 50 and 5,000 characters)..."
            className={`w-full p-4 rounded-2xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition resize-y font-normal leading-relaxed ${
              isTooLong
                ? 'border-rose-400 focus:ring-2 focus:ring-rose-300 bg-rose-50/20'
                : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-600'
            }`}
            required
          />

          {/* Character Progress Bar */}
          <div className="mt-2.5">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isTooShort
                    ? 'bg-amber-400'
                    : isTooLong
                    ? 'bg-rose-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.max(2, meterPercentage)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 font-medium">
              <span>Min: 50 chars</span>
              <span>Max: 5,000 chars</span>
            </div>
          </div>
        </div>

        {/* 4. Generation Progress Card (Shows during loading) */}
        {isGenerating && (
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200/80 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>AI Educator is crafting your quiz...</span>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full">
                Step {generationStep || 1} of 4
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
              <div className={`p-2 rounded-xl flex items-center gap-2 ${generationStep >= 1 ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-400'}`}>
                {generationStep >= 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <div className="w-4 h-4 rounded-full border border-slate-300" />}
                <span>1. Analyzing text vocabulary</span>
              </div>
              <div className={`p-2 rounded-xl flex items-center gap-2 ${generationStep >= 2 ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-400'}`}>
                {generationStep >= 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <div className="w-4 h-4 rounded-full border border-slate-300" />}
                <span>2. Formulating 5 questions</span>
              </div>
              <div className={`p-2 rounded-xl flex items-center gap-2 ${generationStep >= 3 ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-400'}`}>
                {generationStep >= 3 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <div className="w-4 h-4 rounded-full border border-slate-300" />}
                <span>3. Setting 4 choices & 1 answer</span>
              </div>
              <div className={`p-2 rounded-xl flex items-center gap-2 ${generationStep >= 4 ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-400'}`}>
                {generationStep >= 4 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <div className="w-4 h-4 rounded-full border border-slate-300" />}
                <span>4. Writing kid-friendly explanations</span>
              </div>
            </div>
          </div>
        )}

        {/* 5. Submit Button */}
        <button
          type="submit"
          disabled={isGenerating || !isValidLength || !title.trim()}
          className={`w-full py-4 px-6 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-3 relative overflow-hidden group ${
            isGenerating || !isValidLength || !title.trim()
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:scale-[1.01]'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating Quiz...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>Generate 5-Question Quiz</span>
              <ChevronRight className="w-5 h-5 opacity-80 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
