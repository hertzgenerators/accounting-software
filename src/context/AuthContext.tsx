import React, { createContext, useContext, useEffect, useState } from 'react';
import { Permissions, User, UserRole, VoucherType } from '../types';
import { ALL_PERMISSIONS, INITIAL_USERS } from '../utils/seedData';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, password?: string) => boolean;
  logout: () => void;
  switchUser: (userId: string) => void;
  hasPermission: (key: keyof Permissions) => boolean;
  canAccessVoucher: (type: VoucherType, action: 'view' | 'create' | 'edit' | 'delete') => boolean;
  createUser: (userData: Omit<User, 'id' | 'createdAt'>) => User;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => boolean;
  resetUsersToDefault: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'fin_accounting_users_v1';
const CURRENT_USER_KEY = 'fin_accounting_current_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved users', e);
      }
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(CURRENT_USER_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure user still exists in users list
        const exists = INITIAL_USERS.find((u) => u.id === parsed.id);
        if (exists) return parsed;
      } catch (e) {
        console.error('Failed to parse current user', e);
      }
    }
    return INITIAL_USERS[0]; // Default to Super Admin
  });

  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }, [currentUser]);

  const login = (username: string, password?: string): boolean => {
    const found = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.isActive
    );
    if (found) {
      // In this system, verify password if provided, or allow simple matching
      if (found.password && password && found.password !== password) {
        return false;
      }
      const updatedUser = { ...found, lastLogin: new Date().toISOString() };
      setCurrentUser(updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === found.id ? updatedUser : u)));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const found = users.find((u) => u.id === userId && u.isActive);
    if (found) {
      setCurrentUser(found);
    }
  };

  const hasPermission = (key: keyof Permissions): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;
    return Boolean(currentUser.permissions[key]);
  };

  const canAccessVoucher = (type: VoucherType, action: 'view' | 'create' | 'edit' | 'delete'): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN') return true;

    const p = currentUser.permissions;
    switch (type) {
      case 'CREDIT':
        if (action === 'view') return p.viewCreditVoucher;
        if (action === 'create') return p.createCreditVoucher;
        if (action === 'edit') return p.editCreditVoucher;
        if (action === 'delete') return p.deleteCreditVoucher;
        break;
      case 'DEBIT':
        if (action === 'view') return p.viewDebitVoucher;
        if (action === 'create') return p.createDebitVoucher;
        if (action === 'edit') return p.editDebitVoucher;
        if (action === 'delete') return p.deleteDebitVoucher;
        break;
      case 'CONTRA':
        if (action === 'view') return p.viewContraVoucher;
        if (action === 'create') return p.createContraVoucher;
        if (action === 'edit') return p.editContraVoucher;
        if (action === 'delete') return p.deleteContraVoucher;
        break;
      case 'JOURNAL':
        if (action === 'view') return p.viewJournalVoucher;
        if (action === 'create') return p.createJournalVoucher;
        if (action === 'edit') return p.editJournalVoucher;
        if (action === 'delete') return p.deleteJournalVoucher;
        break;
    }
    return false;
  };

  const createUser = (userData: Omit<User, 'id' | 'createdAt'>): User => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [newUser, ...prev]);
    return newUser;
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, ...updates };
          if (currentUser?.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const deleteUser = (userId: string): boolean => {
    if (currentUser?.id === userId) return false;
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    return true;
  };

  const resetUsersToDefault = () => {
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        switchUser,
        hasPermission,
        canAccessVoucher,
        createUser,
        updateUser,
        deleteUser,
        resetUsersToDefault,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
