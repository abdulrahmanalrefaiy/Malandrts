/**
 * ====================================
 * MALAND RTS - Building System
 * ====================================
 */

import { Logger } from '../utils/helpers.js';

const BUILDING_TYPES = {
  towncenter: {
    name: 'مركز المدينة',
    icon: '🏛️',
    hp: 500,
    armor: 2,
    cost: { wood: 100, stone: 80 },
    constructionTime: 30,
    radius: 50,
    description: 'مركز إنتاج العمال والتكنولوجيا'
  },
  house: {
    name: 'منزل',
    icon: '🏠',
    hp: 150,
    armor: 1,
    cost: { wood: 30, stone: 20 },
    constructionTime: 20,
    radius: 35,
    populationBonus: 5,
    description: 'يزيد الحد الأقصى للسكان'
  },
  barracks: {
    name: 'ثكنة',
    icon: '🏛️',
    hp: 200,
    armor: 2,
    cost: { wood: 50, stone: 30, iron: 15 },
    constructionTime: 25,
    radius: 40,
    description: 'تدريب الجنود والرماة'
  },
  stable: {
    name: 'إسطبل',
    icon: '🐴',
    hp: 200,
    armor: 2,
    cost: { wood: 60, stone: 40, iron: 20 },
    constructionTime: 30,
    radius: 40,
    description: 'تدريب الفرسان والوحدات الثقيلة'
  },
  siege: {
    name: 'ورشة حصار',
    icon: '🔨',
    hp: 250,
    armor: 2,
    cost: { wood: 80, stone: 60, iron: 40 },
    constructionTime: 40,
    radius: 45,
    description: 'بناء آلات الحصار'
  },
  tower: {
    name: 'برج دفاعي',
    icon: '🗼',
    hp: 180,
    armor: 3,
    cost: { wood: 40, stone: 40, iron: 10 },
    constructionTime: 20,
    radius: 35,
    range: 150,
    attack: 12,
    description: 'دفاع ثابت للمدينة'
  },
  farm: {
    name: 'مزرعة',
    icon: '🌾',
    hp: 100,
    armor: 0,
    cost: { wood: 20, stone: 15 },
    constructionTime: 15,
    radius: 30,
    resourceType: 'food',
    gatherRate: 0.8,
    description: 'إنتاج الطعام'
  },
  mine: {
    name: 'منجم',
    icon: '⛏️',
    hp: 150,
    armor: 1,
    cost: { wood: 30, stone: 25, iron: 5 },
    constructionTime: 20,
    radius: 35,
    resourceType: 'iron',
    gatherRate: 0.6,
    description: 'استخراج الحديد والذهب'
  },
  sawmill: {
    name: 'منشرة',
    icon: '🌲',
    hp: 120,
    armor: 1,
    cost: { wood: 25, stone: 20 },
    constructionTime: 18,
    radius: 32,
    resourceType: 'wood',
    gatherRate: 1.0,
    description: 'قطع الأخشاب'
  }
};

export class Building {
  constructor(type, player, x, y) {
    const config = BUILDING_TYPES[type];
    if (!config) throw new Error(`Unknown building type: ${type}`);
    
    this.type = type;
    this.player = player;
    this.x = x;
    this.y = y;
    
    this.name = config.name;
    this.icon = config.icon;
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.armor = config.armor;
    this.cost = config.cost;
    this.constructionTime = config.constructionTime;
    this.radius = config.radius;
    
    this.isConstructed = false;
    this.constructionProgress = 0;
    this.isDestroyed = false;
    
    // Optional properties
    this.populationBonus = config.populationBonus || 0;
    this.range = config.range || 0;
    this.attack = config.attack || 0;
    this.resourceType = config.resourceType || null;
    this.gatherRate = config.gatherRate || 0;
    
    this.lastAttackTime = 0;
    this.attackCooldown = 1.0;
    
    Logger.log(`🏗️ Building created: ${this.name} at (${x}, ${y})`);
  }
  
  // ====== Update Construction ======
  updateConstruction(dt) {
    if (this.isConstructed || this.isDestroyed) return;
    
    this.constructionProgress += dt / this.constructionTime;
    
    if (this.constructionProgress >= 1.0) {
      this.constructionProgress = 1.0;
      this.isConstructed = true;
      Logger.success(`✅ Building completed: ${this.name}`);
    }
  }
  
  // ====== Gather Resources ======
  gatherResources() {
    if (!this.isConstructed || !this.resourceType) return 0;
    return this.gatherRate;
  }
  
  // ====== Take Damage ======
  takeDamage(damage) {
    const actualDamage = Math.max(1, damage - this.armor);
    this.hp -= actualDamage;
    
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDestroyed = true;
      Logger.log(`💥 Building destroyed: ${this.name}`);
    }
    
    return actualDamage;
  }
  
  // ====== Attack ======
  attack(target, dt) {
    if (!this.isConstructed || this.attack <= 0) return false;
    
    this.lastAttackTime += dt;
    
    if (this.lastAttackTime >= this.attackCooldown) {
      this.lastAttackTime = 0;
      target.takeDamage(this.attack);
      return true;
    }
    
    return false;
  }
  
  // ====== Get Health Percentage ======
  getHealthPercentage() {
    return this.hp / this.maxHp;
  }
  
  // ====== Get Info ======
  getInfo() {
    return {
      type: this.type,
      name: this.name,
      hp: this.hp,
      maxHp: this.maxHp,
      isConstructed: this.isConstructed,
      constructionProgress: this.constructionProgress,
      player: this.player.name,
      position: { x: this.x, y: this.y }
    };
  }
}

export class BuildingSystem {
  constructor(player) {
    this.player = player;
    this.buildings = [];
  }
  
  // ====== Create Building ======
  createBuilding(type, x, y) {
    const config = BUILDING_TYPES[type];
    if (!config) return null;
    
    // Check resources
    if (!this.player.economy.canAfford(config.cost)) {
      Logger.warn(`❌ Cannot afford building: ${type}`);
      return null;
    }
    
    // Deduct resources
    this.player.economy.removeResources(config.cost);
    
    const building = new Building(type, this.player, x, y);
    this.buildings.push(building);
    
    return building;
  }
  
  // ====== Remove Building ======
  removeBuilding(building) {
    const idx = this.buildings.indexOf(building);
    if (idx !== -1) {
      this.buildings.splice(idx, 1);
    }
  }
  
  // ====== Update All Buildings ======
  update(dt) {
    for (let i = this.buildings.length - 1; i >= 0; i--) {
      const building = this.buildings[i];
      
      building.updateConstruction(dt);
      
      if (building.isDestroyed) {
        this.removeBuilding(building);
      }
    }
  }
  
  // ====== Get Buildings by Type ======
  getBuildingsByType(type) {
    return this.buildings.filter(b => b.type === type);
  }
  
  // ====== Count Buildings ======
  countBuildings(type) {
    if (type) {
      return this.getBuildingsByType(type).length;
    }
    return this.buildings.length;
  }
}

export { BUILDING_TYPES };
export default BuildingSystem;
