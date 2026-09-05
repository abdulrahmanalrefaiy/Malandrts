/**
 * ====================================
 * MALAND RTS - Lobby UI Logic
 * ====================================
 */

import { DOM, Storage, Logger, EventEmitter } from '../utils/helpers.js';
import { authManager } from '../auth/auth.js';

export class LobbyUI extends EventEmitter {
  constructor() {
    super();
    this.selectedMap = 'map1';
    this.selectedTeam = 1;
    this.players = [
      { seat: 0, status: 'self', type: 'human', player: authManager.getUser() },
      { seat: 1, status: 'empty', type: 'empty', player: null },
      { seat: 2, status: 'empty', type: 'empty', player: null },
      { seat: 3, status: 'empty', type: 'empty', player: null },
      { seat: 4, status: 'empty', type: 'empty', player: null },
      { seat: 5, status: 'empty', type: 'empty', player: null },
      { seat: 6, status: 'empty', type: 'empty', player: null },
      { seat: 7, status: 'empty', type: 'empty', player: null }
    ];
    this.maps = [
      { id: 'map1', name: 'الوادي الأخضر', size: '1v1', difficulty: 'سهل' },
      { id: 'map2', name: 'الجبال العالية', size: '2v2', difficulty: 'متوسط' },
      { id: 'map3', name: 'الصحراء القاحلة', size: '4v4', difficulty: 'صعب' }
    ];
  }
  
  // ====== Render Lobby ======
  render() {
    const user = authManager.getUser();
    const stats = authManager.getStats();
    
    const html = `
      <div id="lobbyScreen" class="lobby-container">
        <!-- Header -->
        <div class="lobby-header">
          <div class="lobby-title">
            <h1>⚔️ اللوبي</h1>
          </div>
          <div class="lobby-user-info">
            <img src="${user.avatar}" alt="${user.username}" class="user-avatar">
            <div class="user-details">
              <span class="username">${user.username}</span>
              <span class="level">المستوى ${stats.level}</span>
            </div>
            <button id="btnLogout" class="btn btn-logout">تسجيل خروج</button>
          </div>
        </div>
        
        <!-- Main Content -->
        <div class="lobby-content">
          <!-- Left Panel - Map Selection -->
          <div class="lobby-panel">
            <h2>اختر الخريطة</h2>
            <div id="mapsList" class="maps-list">
              ${this.maps.map(map => `
                <div class="map-card ${map.id === this.selectedMap ? 'selected' : ''}" data-map="${map.id}">
                  <div class="map-icon">🗺️</div>
                  <div class="map-info">
                    <h3>${map.name}</h3>
                    <p>${map.size} • ${map.difficulty}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Center Panel - Players Seats -->
          <div class="lobby-panel lobby-seats">
            <h2>المقاعد (${this.getFilledSeats()}/${this.players.length})</h2>
            <div id="seatsList" class="seats-grid">
              ${this.players.map((seat, idx) => this.renderSeat(seat, idx)).join('')}
            </div>
            <button id="btnAddAI" class="btn btn-secondary" style="width: 100%; margin-top: 12px;">
              ➕ إضافة ذكاء اصطناعي
            </button>
          </div>
          
          <!-- Right Panel - Game Settings -->
          <div class="lobby-panel">
            <h2>إعدادات اللعبة</h2>
            
            <div class="setting-group">
              <label>اختر فريقك</label>
              <div class="team-selector">
                <div class="team-color team-1" data-team="1" title="الفريق 1"></div>
                <div class="team-color team-2" data-team="2" title="الفريق 2"></div>
                <div class="team-color team-3" data-team="3" title="الفريق 3"></div>
                <div class="team-color team-4" data-team="4" title="الفريق 4"></div>
              </div>
            </div>
            
            <div class="setting-group">
              <label>سرعة اللعبة</label>
              <select id="gameSpeed">
                <option value="slow">بطيء</option>
                <option value="normal" selected>عادي</option>
                <option value="fast">سريع</option>
              </select>
            </div>
            
            <div class="setting-group">
              <label>الموارد الأولية</label>
              <select id="startingResources">
                <option value="low">قليلة</option>
                <option value="normal" selected>عادية</option>
                <option value="high">كثيرة</option>
              </select>
            </div>
            
            <div class="setting-group">
              <label>سياسة الفوز</label>
              <select id="victoryCondition">
                <option value="elimination" selected>إبادة جميع العدو</option>
                <option value="conquest">ال��يطرة على الخريطة</option>
                <option value="time">أعلى نقاط قبل انتهاء الوقت</option>
              </select>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="lobby-footer">
          <div class="player-stats">
            <span class="stat">🏆 انتصارات: ${stats.wins}</span>
            <span class="stat">💀 خسائر: ${stats.losses}</span>
            <span class="stat">📊 معدل الفوز: ${stats.winRate}%</span>
          </div>
          <div class="action-buttons">
            <button id="btnCancel" class="btn btn-danger">إلغاء</button>
            <button id="btnStartGame" class="btn btn-success" ${this.getFilledSeats() < 2 ? 'disabled' : ''}>
              🎮 بدء اللعبة
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.innerHTML = html;
    this.attachEventListeners();
    Logger.log('Lobby screen rendered');
  }
  
  // ====== Render Seat ======
  renderSeat(seat, idx) {
    const teamColors = ['#3a8aff', '#ff6a3a', '#3aff6a', '#ffdd3a'];
    
    if (seat.status === 'empty') {
      return `
        <div class="seat empty-seat" data-seat="${idx}">
          <div class="seat-icon">❓</div>
          <p>مقعد فارغ</p>
        </div>
      `;
    }
    
    if (seat.status === 'self') {
      return `
        <div class="seat self-seat" data-seat="${idx}">
          <img src="${seat.player.avatar}" alt="${seat.player.username}" class="seat-avatar">
          <p>${seat.player.username}</p>
          <span class="badge">أنت</span>
        </div>
      `;
    }
    
    if (seat.type === 'ai') {
      return `
        <div class="seat ai-seat" data-seat="${idx}">
          <div class="seat-icon">🤖</div>
          <p>ذكاء اصطناعي</p>
          <span class="difficulty">مستوى: صعب</span>
          <button class="btn-remove" data-seat="${idx}">✕</button>
        </div>
      `;
    }
  }
  
  // ====== Get Filled Seats ======
  getFilledSeats() {
    return this.players.filter(p => p.status !== 'empty').length;
  }
  
  // ====== Attach Event Listeners ======
  attachEventListeners() {
    // Map Selection
    const mapsList = DOM.get('#mapsList');
    if (mapsList) {
      mapsList.addEventListener('click', (e) => {
        const card = e.target.closest('.map-card');
        if (card) {
          document.querySelectorAll('.map-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          this.selectedMap = card.dataset.map;
        }
      });
    }
    
    // Team Selection
    document.querySelectorAll('.team-color').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.team-color').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedTeam = parseInt(btn.dataset.team);
      });
    });
    
    // Add AI Button
    const btnAddAI = DOM.get('#btnAddAI');
    if (btnAddAI) {
      btnAddAI.addEventListener('click', () => this.addAI());
    }
    
    // Start Game Button
    const btnStartGame = DOM.get('#btnStartGame');
    if (btnStartGame && !btnStartGame.disabled) {
      btnStartGame.addEventListener('click', () => this.startGame());
    }
    
    // Cancel Button
    const btnCancel = DOM.get('#btnCancel');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => this.emit('cancel'));
    }
    
    // Logout Button
    const btnLogout = DOM.get('#btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        authManager.logout();
        this.emit('logout');
      });
    }
    
    // Remove AI
    document.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const seat = parseInt(e.target.dataset.seat);
        this.removeAI(seat);
      });
    });
  }
  
  // ====== Add AI ======
  addAI() {
    const emptySeat = this.players.findIndex(p => p.status === 'empty');
    if (emptySeat !== -1) {
      this.players[emptySeat] = {
        seat: emptySeat,
        status: 'ai',
        type: 'ai',
        difficulty: 'hard',
        player: null
      };
      this.render();
      Logger.log('AI added to seat', emptySeat);
    } else {
      Logger.warn('No empty seats available');
    }
  }
  
  // ====== Remove AI ======
  removeAI(seat) {
    if (seat > 0) { // Don't remove player seat
      this.players[seat] = { seat, status: 'empty', type: 'empty', player: null };
      this.render();
      Logger.log('AI removed from seat', seat);
    }
  }
  
  // ====== Start Game ======
  startGame() {
    const gameSettings = {
      map: this.selectedMap,
      team: this.selectedTeam,
      speed: DOM.get('#gameSpeed')?.value || 'normal',
      resources: DOM.get('#startingResources')?.value || 'normal',
      victory: DOM.get('#victoryCondition')?.value || 'elimination',
      players: this.players.filter(p => p.status !== 'empty')
    };
    
    if (gameSettings.players.length < 2) {
      Logger.warn('Need at least 2 players');
      return;
    }
    
    Logger.success('Game started with settings:', gameSettings);
    this.emit('gameStart', gameSettings);
  }
}

export const lobbyUI = new LobbyUI();
