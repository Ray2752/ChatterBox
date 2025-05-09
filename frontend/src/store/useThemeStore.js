import { create } from 'zustand'

 export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("rayito-theme") || "coffe",
setTheme: (theme) => {
  localStorage.setItem("rayito-theme", theme);
  set({ theme })
}
}))