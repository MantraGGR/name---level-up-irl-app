// API configuration for frontend
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Helper to build API endpoints
export const api = {
  auth: {
    me: (token: string) => `${API_URL}/auth/me?token=${token}`,
    googleLogin: () => `${API_URL}/auth/google/login`,
  },
  tasks: {
    list: (userId: string) => `${API_URL}/tasks/user/${userId}`,
    create: () => `${API_URL}/tasks/`,
    complete: (taskId: string) => `${API_URL}/tasks/${taskId}/complete`,
    delete: (taskId: string) => `${API_URL}/tasks/${taskId}`,
  },
  quests: {
    list: (userId: string, completed: boolean, pillar?: string) => {
      let url = `${API_URL}/quests/user/${userId}?completed=${completed}`
      if (pillar) url += `&pillar=${pillar}`
      return url
    },
    generate: (userId: string, pillar?: string) => {
      let url = `${API_URL}/quests/generate/${userId}`
      if (pillar) url += `?pillar=${pillar}`
      return url
    },
    progress: (questId: string) => `${API_URL}/quests/progress/${questId}`,
    complete: (questId: string) => `${API_URL}/quests/complete/${questId}`,
    delete: (questId: string) => `${API_URL}/quests/${questId}`,
  },
  calendar: {
    events: (userId: string, daysAhead: number = 90) => `${API_URL}/calendar/events/${userId}?days_ahead=${daysAhead}`,
    create: (userId: string) => `${API_URL}/calendar/create/${userId}`,
    delete: (eventId: string) => `${API_URL}/calendar/event/${eventId}`,
    sync: (userId: string, daysAhead: number = 30) => `${API_URL}/calendar/sync/${userId}?days_ahead=${daysAhead}`,
    debug: (userId: string) => `${API_URL}/calendar/debug/${userId}`,
  },
  goals: {
    list: (userId: string) => `${API_URL}/goals/user/${userId}`,
    create: (userId: string) => `${API_URL}/goals/create/${userId}`,
    completeMilestone: (goalId: string, milestoneId: string) => `${API_URL}/goals/complete-milestone/${goalId}/${milestoneId}`,
    delete: (goalId: string) => `${API_URL}/goals/${goalId}`,
  },
  ultimateGoals: {
    list: (userId: string) => `${API_URL}/ultimate-goals/user/${userId}`,
    createCustom: (userId: string) => `${API_URL}/ultimate-goals/create-custom/${userId}`,
    completeMilestone: (goalId: string, milestoneId: string) => `${API_URL}/ultimate-goals/complete/${goalId}/${milestoneId}`,
    delete: (goalId: string) => `${API_URL}/ultimate-goals/${goalId}`,
  },
  assessments: {
    create: () => `${API_URL}/assessments/`,
    completeOnboarding: (userId: string) => `${API_URL}/assessments/complete-onboarding/${userId}`,
  },
  chat: {
    send: () => `${API_URL}/chat/`,
  },
}
