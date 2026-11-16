import React, { useState } from 'react';
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
} from 'lucide-react';

const SAMPLE_LESSONS = [
  {
    title: 'The Wonders of Photosynthesis',
    age: 10,
    text: `Photosynthesis is the amazing process by which green plants make their own food! Plants absorb sunlight using a special green pigment called chlorophyll, which is inside their leaves. They also take in water from the soil through their roots and carbon dioxide gas from the air through tiny openings in leaves called stomata. 

Using the sun's powerful energy, plants chemically transform the water and carbon dioxide into glucose, which is a type of natural sugar that plants use for energy and growth. As a wonderful byproduct, plants release fresh oxygen into the air, which humans and animals need to breathe. Without photosynthesis, life on Earth could not survive!`,
  },
  {
    title: 'Journey Through Our Solar System',
    age: 9,
    text: `Our solar system is an incredible cosmic neighborhood located inside the Milky Way galaxy! At the very center sits our Sun, a giant glowing ball of hot plasma that holds 99.8% of all the mass in the solar system. Eight unique planets orbit around the Sun. 

The four inner rocky planets are Mercury, Venus, Earth, and Mars. Earth is the only known planet with liquid water and living organisms. Beyond Mars lies the asteroid belt, followed by the four outer gas and ice giants: Jupiter, Saturn, Uranus, and Neptune. Jupiter is the largest planet, so huge that all other planets could fit inside it! Saturn is famous for its bright, glittering rings made of ice and rock fragments.`,
  },
  {
    title: 'Mysteries of Ancient Egyptian Pyramids',
    age: 12,
    text: `Ancient Egypt was one of the world's most fascinating and enduring civilizations, flourishing along the fertile banks of the Nile River for thousands of years. Among their greatest architectural achievements were the monumental stone pyramids, built primarily during the Old and Middle Kingdom periods as royal tombs for pharaohs. 

The Great Pyramid of Giza, constructed for Pharaoh Khufu around 2560 BCE, remained the tallest human-made structure on Earth for more than 3,800 years! It required an estimated 2.3 million large limestone blocks, each weighing several tons. Skilled Egyptian architects, surveyors, and tens of thousands of dedicated seasonal laborers coordinated precisely using star alignments and copper tools to build these geometric wonders.`,
  },
];

export default function QuizForm() {
  const dispatch = useDispatch();
  const { isGenerating, generationStep, error } = useSelector((state) => state.quiz);

  const [title, setTitle] = useState('');
  const [age, setAge] = useState(10);
  const [lessonText, setLessonText] = useState('');
  const [localError, setLocalError] = useState('');

  const textLength = lessonText.trim().length;
  const isTooShort = textLength < 50;
  const isTooLong = textLength > 5000;
  const isValidLength = !isTooShort && !isTooLong;

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
      setLocalError('Please enter a quiz title.');
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
      setLocalError('Age must be between 8 and 14.');
      return;
    }

    dispatch(createQuiz({ title: cleanTitle, lesson_text: cleanText, age }));
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      {/* Intro Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3">
          <Wand2 className="w-3.5 h-3.5" />
          AI-Powered Quiz Generator
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Create an Engaging Lesson Quiz
        </h1>
        <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
          Paste any educational passage below. The AI will craft exactly 5 multiple-choice questions tailored for kids aged 8–14.
        </p>
      </div>

      {/* Preset Samples */}
      <div className="mb-6 bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100/80">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Quick Presets (Click to Test):
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SAMPLE_LESSONS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isGenerating}
              onClick={() => handleLoadSample(sample)}
              className="text-left p-2.5 rounded-xl bg-white hover:bg-indigo-600 hover:text-white border border-slate-200 hover:border-indigo-600 text-xs font-medium text-slate-700 transition-all shadow-sm group"
            >
              <div className="font-semibold line-clamp-1">{sample.title}</div>
              <div className="text-[11px] text-slate-500 group-hover:text-indigo-100 mt-0.5">
                Age {sample.age} • Science / History
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Error Banners */}
      {(localError || error) && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{localError || error}</div>
          <button
            type="button"
            onClick={() => {
              setLocalError('');
              dispatch(clearError());
            }}
            className="text-rose-500 hover:text-rose-700 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100 border border-slate-200">
        {/* Title Field */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            Lesson or Quiz Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isGenerating}
            placeholder="e.g. Life Cycle of a Butterfly or Solar System"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-800 placeholder-slate-400 transition"
            maxLength={200}
            required
          />
        </div>

        {/* Age Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              Target Age Group ({age} Years Old)
            </label>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              Ages 8–14
            </span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {[8, 9, 10, 11, 12, 13, 14].map((num) => (
              <button
                key={num}
                type="button"
                disabled={isGenerating}
                onClick={() => setAge(num)}
                className={`py-2 text-center rounded-xl font-bold text-sm transition-all ${
                  age === num
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Lesson Text Area */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Lesson Content (50 – 5,000 characters)
            </label>
            <span
              className={`text-xs font-semibold ${
                isTooShort
                  ? 'text-amber-600 font-bold'
                  : isTooLong
                  ? 'text-rose-600 font-bold'
                  : 'text-emerald-600'
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
            placeholder="Paste your lesson, article, or educational reading text here..."
            className={`w-full p-4 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition resize-y leading-relaxed ${
              isTooLong
                ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/20'
                : 'border-slate-200 focus:ring-indigo-500 focus:border-transparent'
            }`}
            required
          />
          <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
            <span>Minimum 50 characters required</span>
            <span>Maximum 5,000 characters</span>
          </div>
        </div>

        {/* Loading Progress State */}
        {isGenerating && (
          <div className="mb-6 p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 text-center animate-pulse-slow">
            <div className="flex items-center justify-center gap-2 text-indigo-700 font-bold text-sm mb-1">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              AI Educator is Generating Your Quiz...
            </div>
            <p className="text-xs text-indigo-600">
              {generationStep || 'Extracting key concepts, validating 4 options per question, and writing kid-friendly explanations.'}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isGenerating || !isValidLength || !title.trim()}
          className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base transition-all flex items-center justify-center gap-3 shadow-lg ${
            isGenerating || !isValidLength || !title.trim()
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.01]'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating Quiz...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Generate 5-Question Quiz</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
