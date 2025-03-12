
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  users: { id: string; email: string; password: string }[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  register: (email: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      users: [],
      isAuthenticated: false,
      
      login: (email, password) => {
        const users = get().users;
        const user = users.find(
          (u) => u.email === email && u.password === password
        );
        
        if (user) {
          set({ 
            user: { id: user.id, email: user.email },
            isAuthenticated: true 
          });
          return true;
        }
        
        return false;
      },
      
      register: (email, password) => {
        const users = get().users;
        
        // Check if user already exists
        if (users.some((u) => u.email === email)) {
          return false;
        }
        
        const newUser = {
          id: crypto.randomUUID(),
          email,
          password
        };
        
        set({ users: [...users, newUser] });
        return true;
      },
      
      logout: () => {
        set({ user: null, isAuthenticated: false });
      }
    }),
    {
      name: 'auth-storage'
    }
  )
);
