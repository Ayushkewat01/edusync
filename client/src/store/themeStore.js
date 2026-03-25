import { create } from 'zustand';

const useThemeStore = create((set) => ({
  isDark: localStorage.getItem('edusync_theme') === 'dark' ||
    (!localStorage.getItem('edusync_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches),

  toggle: () => set((state) => {
    const newDark = !state.isDark;
    localStorage.setItem('edusync_theme', newDark ? 'dark' : 'light');
    if (newDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    return { isDark: newDark };
  }),

  init: () => set((state) => {
    if (state.isDark) {
      document.body.classList.add('dark');
    }
    return state;
  }),
}));

export default useThemeStore;
