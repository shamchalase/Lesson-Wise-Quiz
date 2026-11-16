const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Custom fetch wrapper with JSON body and error handling
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let errorMessage = 'An unexpected error occurred.';
    if (data) {
      if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMessage = data.detail.map(d => d.msg || JSON.stringify(d)).join(', ');
      } else if (data.errors && Array.isArray(data.errors)) {
        errorMessage = data.errors.join('; ');
      }
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Create quiz from lesson text
  createQuiz: (payload) =>
    request('/api/quizzes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Get paginated list of quizzes
  getQuizzes: (page = 1, size = 9) =>
    request(`/api/quizzes?page=${page}&size=${size}`),

  // Get single quiz with questions and options
  getQuizById: (id) =>
    request(`/api/quizzes/${id}`),

  // Delete a quiz
  deleteQuiz: (id) =>
    request(`/api/quizzes/${id}`, {
      method: 'DELETE',
    }),

  // Health check
  checkHealth: () =>
    request('/api/health'),
};

