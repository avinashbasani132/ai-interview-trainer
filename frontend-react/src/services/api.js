const API_BASE = (import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '') : '') + '/api';


/**
 * Common API request helper.
 * Automatically injects the JWT token from localStorage.
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('access_token');
  const headers = { ...options.headers };

  if (token && token !== 'undefined' && token !== 'null') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set Content-Type default if body is JSON
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    if (typeof options.body === 'object') {
      options.body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Session expired or invalid
    localStorage.removeItem('access_token');
    window.dispatchEvent(new Event('auth_change'));
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorText = await response.text();
    let message = 'Server error';
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.error || parsed.message || message;
    } catch {
      message = errorText || message;
    }
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  // Authentication
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: { email, password }
  }),
  register: (email, password) => request('/auth/register', {
    method: 'POST',
    body: { email, password }
  }),

  // User & Dashboard
  getDashboard: () => request('/user/dashboard'),
  getHistory: () => request('/user/history'),
  getPerformanceAnalytics: () => request('/user/analytics/performance'),
  getLeaderboard: () => request('/user/analytics/leaderboard'),

  // Resume
  uploadResume: (formData) => request('/resume/upload-resume', {
    method: 'POST',
    body: formData // Must be FormData
  }),
  getResumeHistory: () => request('/resume/history'),
  getResumeDetail: (recordId) => request(`/resume/history/${recordId}`),
  getResumeDownloadUrl: (recordId) => `${API_BASE}/resume/report/${recordId}`,

  // Rounds & Placement track
  startInterview: () => request('/interview/start', { method: 'POST' }),
  evaluateRound: (sessionId, question, answer) => request('/interview/evaluate', {
    method: 'POST',
    body: { session_id: sessionId, question, answer }
  }),
  chatInterview: (sessionId, question, answer, context, questionCount) => request('/interview/chat', {
    method: 'POST',
    body: { session_id: sessionId, question, answer, context, question_count: questionCount }
  }),
  startAptitude: () => request('/interview/aptitude/start', { method: 'POST' }),
  submitAptitude: (sessionId, answers) => request('/interview/aptitude/submit', {
    method: 'POST',
    body: { session_id: sessionId, answers }
  }),

  // Resume-Based Interview
  startResumeInterview: (formData) => request('/resume-interview/upload', {
    method: 'POST',
    body: formData // Must be FormData
  }),
  startResumeInterviewWithExisting: (resumeId) => request('/resume-interview/select-existing', {
    method: 'POST',
    body: { resume_id: resumeId }
  }),
  getResumeInterviewState: (sessionId) => request(`/resume-interview/session/${sessionId}`),
  submitResumeInterviewAnswer: (sessionId, answer) => request(`/resume-interview/session/${sessionId}/submit-answer`, {
    method: 'POST',
    body: { answer }
  }),
  getResumeInterviewHint: (sessionId) => request(`/resume-interview/session/${sessionId}/hint`),
  completeResumeInterview: (sessionId, durationSeconds) => request(`/resume-interview/session/${sessionId}/complete`, {
    method: 'POST',
    body: { duration_seconds: durationSeconds }
  }),
  getResumeInterviewHistory: () => request('/resume-interview/history'),
  getResumeInterviewReport: (sessionId) => request(`/resume-interview/report/${sessionId}`),

  // Company Placement
  getCompanies: () => request('/company/list'),
  startCompanyInterview: (companyId, jobRole, difficulty) => request('/company/start', {
    method: 'POST',
    body: { company_id: companyId, job_role: jobRole, difficulty }
  }),
  getCompanySessionState: (sessionId) => request(`/company/session/${sessionId}/state`),
  getCompanyRoundQuestions: (sessionId, roundNum) => request(`/company/session/${sessionId}/round/${roundNum}/questions`),
  submitCompanyAnswers: (sessionId, answers) => request(`/company/session/${sessionId}/submit-answers`, {
    method: 'POST',
    body: { session_id: sessionId, answers }
  }),
  getCompanySummary: (sessionId) => request(`/company/session/${sessionId}/summary`),
  getCompanyStats: () => request('/company/stats'),

  // Media
  uploadHrVideo: (formData) => request('/media/upload-hr-video', {
    method: 'POST',
    body: formData // Must be FormData
  }),

  // DSA Arena
  getDailyDSA: () => request('/dsa/daily'),
  submitDSASolution: (problemId, code) => request('/code/run', {
    method: 'POST',
    body: { problem_id: problemId, code, language: 'python' }
  }),

  // Chatbot Assistant
  sendChatMessage: (message, extra = {}) => request('/chat/message', {
    method: 'POST',
    body: { message, ...extra }
  }),
  getChatHistory: () => request('/chat/history'),
  clearChatHistory: () => request('/chat/clear', { method: 'DELETE' }),
  getChatSuggestions: () => request('/chat/suggestions'),

  // Certificates
  getMyCertificates: () => request('/certificate/my-certificates'),
  generateCertificate: (interviewId, interviewType, mode) => request('/certificate/generate', {
    method: 'POST',
    body: { interview_id: interviewId, interview_type: interviewType, mode }
  }),
  getCertificateDownloadUrl: (certId) => `${API_BASE}/certificate/download/${certId}`,

  // Learning Roadmap
  getRoadmap: () => request('/roadmap/'),
  completeRoadmapStep: (stepId) => request(`/roadmap/complete/${stepId}`, { method: 'POST' }),

  // Community
  getCommunityPosts: () => request('/community/posts'),
  createCommunityPost: (title, content) => request('/community/post', {
    method: 'POST',
    body: { title, content }
  }),
  createCommunityReply: (postId, content) => request('/community/reply', {
    method: 'POST',
    body: { post_id: postId, content }
  }),
  getCommunityReplies: (postId) => request(`/community/posts/${postId}/replies`),

  // Admin
  getAdminStats: () => request('/admin/stats'),
  getAdminUsers: () => request('/admin/users'),
  bypassRound: (round) => request('/admin/bypass-round', {
    method: 'POST',
    body: { round }
  }),
  getAdminQuestions: (params = {}) => {
    const query = new URLSearchParams();
    if (params.company_id) query.append('company_id', params.company_id);
    if (params.round_type) query.append('round_type', params.round_type);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/admin/questions${qs}`);
  },
  createAdminQuestion: (questionData) => request('/admin/questions', {
    method: 'POST',
    body: questionData
  }),
  deleteAdminQuestion: (questionId) => request(`/admin/questions/${questionId}`, {
    method: 'DELETE'
  }),
  getAdminCompanies: () => request('/admin/companies'),
  createAdminCompany: (companyData) => request('/admin/companies', {
    method: 'POST',
    body: companyData
  }),
  getAdminCertificates: () => request('/admin/certificates'),
  getAdminAuditLogs: () => request('/admin/logs')
};
