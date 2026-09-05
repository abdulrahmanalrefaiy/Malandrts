/**
 * ====================================
 * MALAND RTS - Authentication System
 * ====================================
 */

import { Storage, Logger, EventEmitter } from '../utils/helpers.js';

export class AuthManager extends EventEmitter {
  constructor() {
    super();
    this.currentUser = Storage.get('currentUser', null);
    this.token = Storage.get('authToken', null);
  }
  
  // ====== Mock Login ======
  async mockLogin(username, password) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = {
          id: `user_${Date.now()}`,
          username,
          email: `${username}@example.com`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          level: 1,
          wins: Math.floor(Math.random() * 20),
          losses: Math.floor(Math.random() * 15),
          createdAt: new Date().toISOString()
        };
        
        this.setUser(user);
        Logger.success(`Login successful: ${username}`);
        resolve(user);
      }, 500);
    });
  }
  
  // ====== Facebook OAuth (Mock) ======
  async loginWithFacebook() {
    Logger.log('Facebook OAuth would open here');
    return this.mockLogin(`fb_user_${Math.random().toString(36).substr(2, 9)}`, 'fb_token');
  }
  
  // ====== Google OAuth (Mock) ======
  async loginWithGoogle() {
    Logger.log('Google OAuth would open here');
    return this.mockLogin(`google_user_${Math.random().toString(36).substr(2, 9)}`, 'google_token');
  }
  
  // ====== Set User ======
  setUser(user) {
    this.currentUser = user;
    const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.token = token;
    
    Storage.set('currentUser', user);
    Storage.set('authToken', token);
    
    this.emit('login', user);
  }
  
  // ====== Logout ======
  logout() {
    this.currentUser = null;
    this.token = null;
    
    Storage.remove('currentUser');
    Storage.remove('authToken');
    
    this.emit('logout');
    Logger.log('User logged out');
  }
  
  // ====== Get Current User ======
  getUser() {
    return this.currentUser;
  }
  
  // ====== Is Logged In ======
  isLoggedIn() {
    return this.currentUser !== null && this.token !== null;
  }
  
  // ====== Get Auth Token ======
  getToken() {
    return this.token;
  }
  
  // ====== Update User Stats ======
  updateStats(stats) {
    if (this.currentUser) {
      this.currentUser = { ...this.currentUser, ...stats };
      Storage.set('currentUser', this.currentUser);
      this.emit('statsUpdated', this.currentUser);
    }
  }
  
  // ====== Add Win ======
  addWin() {
    if (this.currentUser) {
      this.currentUser.wins = (this.currentUser.wins || 0) + 1;
      this.currentUser.level = Math.floor((this.currentUser.wins + this.currentUser.losses) / 5) + 1;
      Storage.set('currentUser', this.currentUser);
      this.emit('statsUpdated', this.currentUser);
    }
  }
  
  // ====== Add Loss ======
  addLoss() {
    if (this.currentUser) {
      this.currentUser.losses = (this.currentUser.losses || 0) + 1;
      Storage.set('currentUser', this.currentUser);
      this.emit('statsUpdated', this.currentUser);
    }
  }
  
  // ====== Get User Stats ======
  getStats() {
    if (!this.currentUser) return null;
    return {
      wins: this.currentUser.wins || 0,
      losses: this.currentUser.losses || 0,
      level: this.currentUser.level || 1,
      winRate: this.currentUser.wins && this.currentUser.losses 
        ? Math.round((this.currentUser.wins / (this.currentUser.wins + this.currentUser.losses)) * 100)
        : 0
    };
  }
}

// ====== Export Singleton ======
export const authManager = new AuthManager();
