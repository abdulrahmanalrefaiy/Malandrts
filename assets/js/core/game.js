/**
 * ====================================
 * MALAND RTS - Game Core System
 * ====================================
 */

import { Logger, EventEmitter, Math2D } from '../utils/helpers.js';

export class GameCore extends EventEmitter {
  constructor() {
    super();
    this.gameState = {
      status: 'idle', // idle, playing, paused, ended
      elapsedTime: 0,
      currentEra: 1, // 1: Stone, 2: Iron, 3: Imperial
      winner: null,
      players: [],
      map: null
    };
    
    this.entities = new Map(); // { id: entity }
    this.buildings = new Map(); // { id: building }
    this.resources = new Map(); // { playerId: { resource: amount } }
    this.terrain = [];
    
    this.nextId = 1;
    this.aiTimer = 0;
    this.buildingTimer = 0;
    this.resourceTimer = 0;
  }
  
  // ====== Initialize Game ======
  initGame(gameSettings, players) {
    Logger.log('🎮 Initializing game...');
    
    this.gameState.status = 'playing';
    this.gameState.players = players;
    this.gameState.map = gameSettings.map;
    
    // Initialize resources for each player
    const baseResources = gameSettings.resources === 'high' ? 500 : 
                         gameSettings.resources === 'low' ? 100 : 250;
    
    for (const player of players) {
      this.resources.set(player.id, {
        wood: baseResources,
        stone: baseResources * 0.8,
        food: baseResources * 0.6,
        iron: baseResources * 0.4,
        gold: baseResources * 0.2,
        population: 0,
        maxPopulation: 10
      });
    }
    
    // Generate terrain
    this.generateTerrain();
    
    // Create initial buildings and units
    this.initializePlayerStartingPositions(players);
    
    this.emit('gameInitialized', { gameState: this.gameState });
    Logger.success('✅ Game initialized!');
  }
  
  // ====== Generate Terrain ======
  generateTerrain() {
    const mapSizes = { map1: 2000, map2: 3000, map3: 4000 };
    const mapSize = mapSizes[this.gameState.map] || 3000;
    const cellSize = 50;
    const cols = Math.ceil(mapSize / cellSize);
    const rows = Math.ceil(mapSize / cellSize);
    
    this.terrain = [];
    
    for (let y = 0; y < rows; y++) {
      this.terrain[y] = [];
      for (let x = 0; x < cols; x++) {
        const noise = Math.sin(x * 0.05) * Math.cos(y * 0.07) * 0.5 +
                     Math.sin(x * 0.12 + y * 0.08) * 0.3 +
                     Math.random() * 0.2;
        
        let type = 'grass';
        if (noise > 0.7) type = 'mountain';
        else if (noise > 0.4) type = 'hill';
        else if (noise < -0.3) type = 'water';
        else if (noise < -0.1) type = 'sand';
        else if (Math.random() < 0.08) type = 'forest';
        
        this.terrain[y][x] = { type, resources: this.generateTerrainResources(type) };
      }
    }
    
    Logger.log('🗺️ Terrain generated');
  }
  
  // ====== Generate Terrain Resources ======
  generateTerrainResources(type) {
    const resources = {};
    
    if (type === 'forest') {
      resources.wood = 100 + Math.random() * 50;
    } else if (type === 'mountain') {
      resources.stone = 150 + Math.random() * 50;
      resources.iron = 80 + Math.random() * 40;
      resources.gold = 20 + Math.random() * 10;
    } else if (type === 'hill') {
      resources.stone = 80 + Math.random() * 40;
      resources.iron = 40 + Math.random() * 20;
    } else if (type === 'grass') {
      resources.food = 50 + Math.random() * 30;
    }
    
    return resources;
  }
  
  // ====== Initialize Player Starting Positions ======
  initializePlayerStartingPositions(players) {
    const positions = [
      { x: 500, y: 500 },
      { x: 1500, y: 500 },
      { x: 500, y: 1500 },
      { x: 1500, y: 1500 }
    ];
    
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const pos = positions[i % positions.length];
      
      // Create town center
      const townCenter = this.createBuilding('towncenter', pos.x, pos.y, player.id, player.team);
      this.buildings.set(townCenter.id, townCenter);
      
      // Create starting workers
      for (let j = 0; j < 5; j++) {
        const worker = this.createUnit('worker', 
          pos.x + (Math.random() - 0.5) * 100,
          pos.y + (Math.random() - 0.5) * 100,
          player.id, player.team);
        this.entities.set(worker.id, worker);
      }
      
      Logger.log(`👥 Player ${player.username} initialized at ${pos.x}, ${pos.y}`);
    }
  }
  
  // ====== Create Unit ======
  createUnit(type, x, y, playerId, team) {
    const unitDefs = {
      worker: {
        hp: 30, attack: 0, defense: 1, range: 0, speed: 60,
        cost: { wood: 20, food: 10 }, era: 1, icon: '👷'
      },
      infantry: {
        hp: 60, attack: 15, defense: 3, range: 30, speed: 45,
        cost: { wood: 30, food: 25, iron: 15 }, era: 1, icon: '⚔️'
      },
      archer: {
        hp: 40, attack: 18, defense: 2, range: 80, speed: 40,
        cost: { wood: 35, food: 20, iron: 10 }, era: 1, icon: '🏹'
      },
      cavalry: {
        hp: 80, attack: 25, defense: 4, range: 25, speed: 85,
        cost: { wood: 40, food: 30, iron: 25 }, era: 2, icon: '🐴'
      },
      elephant: {
        hp: 150, attack: 35, defense: 8, range: 20, speed: 50,
        cost: { wood: 100, food: 60, iron: 50, gold: 30 }, era: 3, icon: '🐘'
      },
      mage: {
        hp: 50, attack: 40, defense: 2, range: 100, speed: 35,
        cost: { wood: 50, food: 30, gold: 40 }, era: 3, icon: '🧙'
      }
    };
    
    const def = unitDefs[type];
    if (!def) return null;
    
    return {
      id: this.nextId++,
      kind: 'unit',
      type,
      x, y,
      playerId,
      team,
      hp: def.hp,
      maxHp: def.hp,
      attack: def.attack,
      defense: def.defense,
      range: def.range,
      speed: def.speed,
      era: def.era,
      icon: def.icon,
      state: 'idle', // idle, moving, attacking, gathering, building
      target: null,
      targetX: null,
      targetY: null,
      task: null,
      actionTimer: 0,
      angle: 0
    };
  }
  
  // ====== Create Building ======
  createBuilding(type, x, y, playerId, team) {
    const buildingDefs = {
      towncenter: {
        hp: 500, cost: null, era: 1, radius: 40, icon: '🏛️',
        production: [], buildTime: 0
      },
      house: {
        hp: 200, cost: { wood: 50, stone: 30 }, era: 1, radius: 25, icon: '🏠',
        effect: { maxPopulation: 10 }, buildTime: 10
      },
      barracks: {
        hp: 250, cost: { wood: 60, stone: 40, iron: 20 }, era: 1, radius: 30, icon: '🏛️',
        production: ['infantry', 'archer'], buildTime: 15
      },
      stable: {
        hp: 250, cost: { wood: 70, stone: 40, iron: 25 }, era: 2, radius: 30, icon: '🐴',
        production: ['cavalry'], buildTime: 15
      },
      tower: {
        hp: 300, cost: { wood: 80, stone: 60, iron: 30 }, era: 1, radius: 20, icon: '🗼',
        effect: { defense: 20, range: 150 }, buildTime: 20
      },
      mine: {
        hp: 200, cost: { wood: 40, stone: 50, iron: 10 }, era: 1, radius: 30, icon: '⛏️',
        production: ['iron', 'gold'], buildTime: 12
      },
      farm: {
        hp: 150, cost: { wood: 30, stone: 20 }, era: 1, radius: 25, icon: '🌾',
        production: ['food'], buildTime: 10
      },
      lumbermill: {
        hp: 150, cost: { wood: 40, stone: 25 }, era: 1, radius: 25, icon: '🪵',
        production: ['wood'], buildTime: 10
      },
      temple: {
        hp: 400, cost: { wood: 100, stone: 80, gold: 50 }, era: 3, radius: 35, icon: '⛪',
        effect: { morale: 20 }, buildTime: 25
      }
    };
    
    const def = buildingDefs[type];
    if (!def) return null;
    
    return {
      id: this.nextId++,
      kind: 'building',
      type,
      x, y,
      playerId,
      team,
      hp: def.hp,
      maxHp: def.hp,
      era: def.era,
      radius: def.radius,
      icon: def.icon,
      isConstructed: type === 'towncenter',
      constructionProgress: type === 'towncenter' ? 1 : 0,
      buildTime: def.buildTime,
      production: def.production || [],
      productionQueue: [],
      productionTimer: 0,
      effect: def.effect || {}
    };
  }
  
  // ====== Update Game ======
  update(deltaTime) {
    if (this.gameState.status !== 'playing') return;
    
    this.gameState.elapsedTime += deltaTime;
    
    // Update entities
    for (const entity of this.entities.values()) {
      this.updateEntity(entity, deltaTime);
    }
    
    // Update buildings
    for (const building of this.buildings.values()) {
      this.updateBuilding(building, deltaTime);
    }
    
    // Resource generation
    this.resourceTimer += deltaTime;
    if (this.resourceTimer >= 1) {
      this.resourceTimer = 0;
      this.generateResources();
    }
    
    // AI update
    this.aiTimer += deltaTime;
    if (this.aiTimer >= 2) {
      this.aiTimer = 0;
      this.updateAI();
    }
    
    this.emit('gameUpdated', { gameState: this.gameState, entities: Array.from(this.entities.values()), buildings: Array.from(this.buildings.values()) });
  }
  
  // ====== Update Entity ======
  updateEntity(entity, deltaTime) {
    if (entity.state === 'moving' && entity.targetX !== null) {
      const dx = entity.targetX - entity.x;
      const dy = entity.targetY - entity.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist > 5) {
        const move = entity.speed * deltaTime;
        entity.x += (dx / dist) * move;
        entity.y += (dy / dist) * move;
        entity.angle = Math.atan2(dy, dx);
      } else {
        entity.state = 'idle';
      }
    }
    
    if (entity.state === 'attacking' && entity.target) {
      if (entity.target.hp <= 0) {
        entity.state = 'idle';
        entity.target = null;
        return;
      }
      
      const dx = entity.target.x - entity.x;
      const dy = entity.target.y - entity.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist > entity.range) {
        const move = entity.speed * deltaTime;
        entity.x += (dx / dist) * move;
        entity.y += (dy / dist) * move;
        entity.angle = Math.atan2(dy, dx);
      } else {
        entity.actionTimer += deltaTime;
        if (entity.actionTimer >= 1.5) {
          entity.actionTimer = 0;
          const damage = Math.max(5, entity.attack - (entity.target.defense || 0) + Math.random() * 10);
          entity.target.hp = Math.max(0, entity.target.hp - damage);
          this.emit('damageDealt', { attacker: entity, target: entity.target, damage });
        }
      }
    }
  }
  
  // ====== Update Building ======
  updateBuilding(building, deltaTime) {
    if (!building.isConstructed) {
      building.constructionProgress += deltaTime / building.buildTime;
      if (building.constructionProgress >= 1) {
        building.isConstructed = true;
        building.constructionProgress = 1;
        this.emit('buildingConstructed', building);
      }
      return;
    }
    
    // Production queue
    if (building.productionQueue.length > 0 && building.production.length > 0) {
      building.productionTimer += deltaTime;
      const currentProduction = building.productionQueue[0];
      const productionTime = this.getProductionTime(currentProduction);
      
      if (building.productionTimer >= productionTime) {
        building.productionTimer = 0;
        building.productionQueue.shift();
        this.emit('productionCompleted', { building, unit: currentProduction });
      }
    }
  }
  
  // ====== Generate Resources ======
  generateResources() {
    for (const [playerId, res] of this.resources) {
      // Base resource generation from buildings
      let woodGen = 0, foodGen = 0, stoneGen = 0, ironGen = 0, goldGen = 0;
      
      for (const building of this.buildings.values()) {
        if (building.playerId !== playerId || !building.isConstructed) continue;
        
        if (building.type === 'farm') foodGen += 5;
        if (building.type === 'lumbermill') woodGen += 4;
        if (building.type === 'mine') {
          ironGen += 3;
          goldGen += 1;
        }
      }
      
      res.wood += woodGen;
      res.food += foodGen;
      res.stone += stoneGen;
      res.iron += ironGen;
      res.gold += goldGen;
      
      // Cap resources
      const maxStorage = 2000;
      res.wood = Math.min(res.wood, maxStorage);
      res.food = Math.min(res.food, maxStorage);
      res.stone = Math.min(res.stone, maxStorage);
      res.iron = Math.min(res.iron, maxStorage);
      res.gold = Math.min(res.gold, maxStorage);
    }
  }
  
  // ====== Get Production Time ======
  getProductionTime(type) {
    const times = {
      worker: 8, infantry: 10, archer: 10, cavalry: 15,
      elephant: 20, mage: 15
    };
    return times[type] || 10;
  }
  
  // ====== Update AI ======
  updateAI() {
    // AI logic for computer players
    for (const player of this.gameState.players) {
      if (player.type !== 'ai') continue;
      
      const resources = this.resources.get(player.id);
      const playerBuildings = Array.from(this.buildings.values()).filter(b => b.playerId === player.id);
      
      // Build logic
      if (playerBuildings.length < 5 && resources.wood > 100 && resources.stone > 80) {
        // Build a new building
      }
      
      // Production logic
      const barracks = playerBuildings.find(b => b.type === 'barracks');
      if (barracks && barracks.productionQueue.length < 3 && resources.wood > 30 && resources.food > 25) {
        barracks.productionQueue.push('infantry');
      }
    }
  }
  
  // ====== Get Resources ======
  getResources(playerId) {
    return this.resources.get(playerId);
  }
  
  // ====== Spend Resources ======
  spendResources(playerId, cost) {
    const resources = this.resources.get(playerId);
    if (!resources) return false;
    
    for (const [type, amount] of Object.entries(cost)) {
      if (resources[type] < amount) return false;
    }
    
    for (const [type, amount] of Object.entries(cost)) {
      resources[type] -= amount;
    }
    
    return true;
  }
  
  // ====== End Game ======
  endGame(winner) {
    this.gameState.status = 'ended';
    this.gameState.winner = winner;
    this.emit('gameEnded', { winner });
    Logger.success(`🏆 Game ended! Winner: ${winner.username}`);
  }
}

export const gameCore = new GameCore();
