export const authService = {
  login: (user, token) => {
    localStorage.setItem('dfg_token', token || 'dfg-session-token');
    localStorage.setItem('dfg_user', JSON.stringify(user || {
      email: 'admin@deepfusionguard.com',
      name: 'SOC Chief Commander',
      role: 'Administrator',
      auth_provider: 'PASSWORD'
    }));
  },

  logout: () => {
    localStorage.removeItem('dfg_token');
    localStorage.removeItem('dfg_user');
  },

  getUser: () => {
    try {
      const data = localStorage.getItem('dfg_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('dfg_token');
  }
};
