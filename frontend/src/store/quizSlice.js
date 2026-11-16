import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api';

export const fetchQuizzes = createAsyncThunk(
  'quiz/fetchQuizzes',
  async ({ page = 1, size = 9 } = {}, { rejectWithValue }) => {
    try {
      return await api.getQuizzes(page, size);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createQuiz = createAsyncThunk(
  'quiz/createQuiz',
  async ({ title, lesson_text, age }, { rejectWithValue }) => {
    try {
      return await api.createQuiz({ title, lesson_text, age });
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchQuizById = createAsyncThunk(
  'quiz/fetchQuizById',
  async (id, { rejectWithValue }) => {
    try {
      return await api.getQuizById(id);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteQuiz = createAsyncThunk(
  'quiz/deleteQuiz',
  async (id, { rejectWithValue, dispatch, getState }) => {
    try {
      await api.deleteQuiz(id);
      const currentPage = getState().quiz.pagination.page;
      dispatch(fetchQuizzes({ page: currentPage }));
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  quizzes: [],
  pagination: {
    total: 0,
    page: 1,
    size: 9,
    pages: 1,
  },
  activeQuiz: null,
  isGenerating: false,
  generationStep: '',
  isLoadingList: false,
  isLoadingQuiz: false,
  error: null,
  viewMode: 'create', // 'create' | 'list' | 'play'
  player: {
    currentQuestionIndex: 0,
    selectedAnswers: {}, // { [questionId]: optionId }
    isSubmitted: false,
    score: 0,
    totalQuestions: 5,
  },
};

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setGenerationStep: (state, action) => {
      state.generationStep = action.payload;
    },
    selectAnswer: (state, action) => {
      const { questionId, optionId } = action.payload;
      if (!state.player.isSubmitted) {
        state.player.selectedAnswers[questionId] = optionId;
      }
    },
    setCurrentQuestionIndex: (state, action) => {
      state.player.currentQuestionIndex = action.payload;
    },
    nextQuestion: (state) => {
      if (
        state.activeQuiz &&
        state.player.currentQuestionIndex < state.activeQuiz.questions.length - 1
      ) {
        state.player.currentQuestionIndex += 1;
      }
    },
    prevQuestion: (state) => {
      if (state.player.currentQuestionIndex > 0) {
        state.player.currentQuestionIndex -= 1;
      }
    },
    submitQuizAnswers: (state) => {
      if (!state.activeQuiz || !state.activeQuiz.questions) return;
      
      let correctCount = 0;
      state.activeQuiz.questions.forEach((q) => {
        const chosenOptionId = state.player.selectedAnswers[q.id];
        const correctOption = q.options.find((opt) => opt.is_correct);
        if (correctOption && chosenOptionId === correctOption.id) {
          correctCount += 1;
        }
      });

      state.player.isSubmitted = true;
      state.player.score = correctCount;
      state.player.totalQuestions = state.activeQuiz.questions.length;
    },
    resetPlayer: (state) => {
      state.player = {
        currentQuestionIndex: 0,
        selectedAnswers: {},
        isSubmitted: false,
        score: 0,
        totalQuestions: 5,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchQuizzes
      .addCase(fetchQuizzes.pending, (state) => {
        state.isLoadingList = true;
        state.error = null;
      })
      .addCase(fetchQuizzes.fulfilled, (state, action) => {
        state.isLoadingList = false;
        state.quizzes = action.payload.items;
        state.pagination = {
          total: action.payload.total,
          page: action.payload.page,
          size: action.payload.size,
          pages: action.payload.pages,
        };
      })
      .addCase(fetchQuizzes.rejected, (state, action) => {
        state.isLoadingList = false;
        state.error = action.payload || 'Failed to load quizzes.';
      })

      // createQuiz
      .addCase(createQuiz.pending, (state) => {
        state.isGenerating = true;
        state.generationStep = 'Analyzing lesson text and formulating questions...';
        state.error = null;
      })
      .addCase(createQuiz.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.generationStep = '';
        state.activeQuiz = action.payload;
        // Reset player for the newly created quiz and open player view!
        state.player = {
          currentQuestionIndex: 0,
          selectedAnswers: {},
          isSubmitted: false,
          score: 0,
          totalQuestions: action.payload.questions ? action.payload.questions.length : 5,
        };
        state.viewMode = 'play';
      })
      .addCase(createQuiz.rejected, (state, action) => {
        state.isGenerating = false;
        state.generationStep = '';
        state.error = action.payload || 'Failed to create quiz.';
      })

      // fetchQuizById
      .addCase(fetchQuizById.pending, (state) => {
        state.isLoadingQuiz = true;
        state.error = null;
      })
      .addCase(fetchQuizById.fulfilled, (state, action) => {
        state.isLoadingQuiz = false;
        state.activeQuiz = action.payload;
        state.player = {
          currentQuestionIndex: 0,
          selectedAnswers: {},
          isSubmitted: false,
          score: 0,
          totalQuestions: action.payload.questions ? action.payload.questions.length : 5,
        };
        state.viewMode = 'play';
      })
      .addCase(fetchQuizById.rejected, (state, action) => {
        state.isLoadingQuiz = false;
        state.error = action.payload || 'Failed to load quiz details.';
      })

      // deleteQuiz
      .addCase(deleteQuiz.fulfilled, (state, action) => {
        state.quizzes = state.quizzes.filter((q) => q.id !== action.payload);
        if (state.activeQuiz && state.activeQuiz.id === action.payload) {
          state.activeQuiz = null;
          state.viewMode = 'list';
        }
      });
  },
});

export const {
  setViewMode,
  clearError,
  setGenerationStep,
  selectAnswer,
  setCurrentQuestionIndex,
  nextQuestion,
  prevQuestion,
  submitQuizAnswers,
  resetPlayer,
} = quizSlice.actions;

export default quizSlice.reducer;
