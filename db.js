/**
 * Atelier Runway & Wardrobe Management System
 * SQLite Database Persistence Layer
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

function getDbFilePath() {
  return process.env.SQLITE_DB_PATH || path.join(__dirname, 'fashion_show.db');
}

const DB_FILE_PATH = getDbFilePath();

// Default initial luxury fashion show dataset
const DEFAULT_INITIAL_DATA = {
  activeShowId: 'show_2026_ss',
  shows: [
    {
      id: 'show_2026_ss',
      name: 'LUMIÈRE // Haute Couture Spring/Summer 2026',
      season: 'Spring/Summer',
      year: 2026,
      date: '2026-05-18',
      venue: 'The Grand Pavilion Ballroom, Mayfair, London',
      currency: '£',
      catwalkAppearances: 4,
      appearanceThemes: {
        1: 'Denim',
        2: 'Leisureware',
        3: 'Draped Eveningwear',
        4: 'Grand Finale'
      },
      models: [
        { id: 'm1', firstName: 'Elena', walkOrder: 1, notes: 'Show Opener. Wears sleek updos for appearances 1-2.' },
        { id: 'm2', firstName: 'Sophia', walkOrder: 2, notes: 'Requires quick shoe swap between Appearance 2 and 3.' },
        { id: 'm3', firstName: 'Marcus', walkOrder: 3, notes: 'Tailored fit; check blazer sleeve length.' },
        { id: 'm4', firstName: 'Amara', walkOrder: 4, notes: 'Statement jewellery focus; delicate ear clasp.' },
        { id: 'm5', firstName: 'Chloe', walkOrder: 5, notes: 'Show Closer (Finale look). Dramatic train.' }
      ],
      items: [
        { id: 'c1', name: 'Silk Organza Trench Coat with Belt', category: 'clothing', price: 950.00 },
        { id: 'c2', name: 'Hand-Pleated Chiffon Halter Gown', category: 'clothing', price: 1850.00 },
        { id: 'c3', name: 'Tailored Double-Breasted Wool Blazer', category: 'clothing', price: 780.00 },
        { id: 'c4', name: 'High-Waisted Silk Crepe Palazzo Trousers', category: 'clothing', price: 420.00 },
        { id: 'c5', name: 'Draped Satin Corset Bodice Top', category: 'clothing', price: 340.00 },
        { id: 'c6', name: 'Midnight Velvet Asymmetric Cape', category: 'clothing', price: 890.00 },
        { id: 'c7', name: 'Metallic Jacquard Tiered Midi Skirt', category: 'clothing', price: 460.00 },
        { id: 'c8', name: 'Sculptural Cashmere Turtleneck Knit', category: 'clothing', price: 520.00 },
        { id: 'c9', name: 'Emerald Cut-Out Evening Slip Dress', category: 'clothing', price: 1250.00 },
        { id: 'c10', name: 'Structured Oversized Tuxedo Waistcoat', category: 'clothing', price: 610.00 },
        { id: 'j1', name: '18k Champagne Gold Pavé Choker', category: 'jewellery', price: 1100.00 },
        { id: 'j2', name: 'Cascading Freshwater Pearl Drop Earrings', category: 'jewellery', price: 340.00 },
        { id: 'j3', name: 'Hammered Brass Architectural Cuff Bangle', category: 'jewellery', price: 260.00 },
        { id: 'j4', name: 'Bespoke Smoky Quartz Cocktail Ring', category: 'jewellery', price: 480.00 },
        { id: 'j5', name: 'Layered Platinum Herringbone Chain', category: 'jewellery', price: 750.00 },
        { id: 'j6', name: 'Diamond Pavé Orbit Ear Cuffs (Pair)', category: 'jewellery', price: 580.00 },
        { id: 'j7', name: 'Carved Obsidian Brooch with Gold Setting', category: 'jewellery', price: 390.00 },
        { id: 'f1', name: 'Satin Ankle-Wrap Stiletto Sandals (Black)', category: 'footwear', price: 560.00 },
        { id: 'f2', name: 'Patent Leather Pointed Slingback Mules (Champagne)', category: 'footwear', price: 490.00 },
        { id: 'f3', name: 'Velvet Platform Block-Heel Pumps (Midnight Navy)', category: 'footwear', price: 530.00 },
        { id: 'f4', name: 'Embossed Leather Sculpted Heel Boots (Burgundy)', category: 'footwear', price: 820.00 },
        { id: 'f5', name: 'Minimalist Metallic Strappy Stiletto (Gold)', category: 'footwear', price: 480.00 }
      ],
      assignments: {
        'm1_1': { clothingIds: ['c1', 'c4'], jewelleryIds: ['j1', 'j3'], footwearId: 'f2' },
        'm2_1': { clothingIds: ['c3', 'c5', 'c4'], jewelleryIds: ['j2', 'j4'], footwearId: 'f1' },
        'm3_1': { clothingIds: ['c3', 'c8', 'c4'], jewelleryIds: ['j5'], footwearId: 'f4' },
        'm4_1': { clothingIds: ['c5', 'c7'], jewelleryIds: ['j1', 'j6', 'j3'], footwearId: 'f1' },
        'm5_1': { clothingIds: ['c10', 'c4'], jewelleryIds: ['j3', 'j7'], footwearId: 'f2' },
        'm1_2': { clothingIds: ['c3', 'c5', 'c7'], jewelleryIds: ['j2', 'j4'], footwearId: 'f1' },
        'm2_2': { clothingIds: ['c8', 'c7'], jewelleryIds: ['j6', 'j3'], footwearId: 'f3' },
        'm3_2': { clothingIds: ['c1', 'c4'], jewelleryIds: ['j7'], footwearId: 'f4' },
        'm4_2': { clothingIds: ['c10', 'c8', 'c4'], jewelleryIds: ['j1', 'j2'], footwearId: 'f5' },
        'm5_2': { clothingIds: ['c3', 'c4'], jewelleryIds: ['j5', 'j4'], footwearId: 'f1' },
        'm1_3': { clothingIds: ['c9'], jewelleryIds: ['j1', 'j2', 'j4'], footwearId: 'f5' },
        'm2_3': { clothingIds: ['c9', 'c6'], jewelleryIds: ['j5', 'j3'], footwearId: 'f3' },
        'm3_3': { clothingIds: ['c3', 'c10', 'c4'], jewelleryIds: ['j7', 'j4'], footwearId: 'f4' },
        'm4_3': { clothingIds: ['c2'], jewelleryIds: ['j1', 'j4', 'j6'], footwearId: 'f5' },
        'm5_3': { clothingIds: ['c6', 'c5', 'c4'], jewelleryIds: ['j2', 'j3'], footwearId: 'f1' },
        'm1_4': { clothingIds: ['c2', 'c6'], jewelleryIds: ['j1', 'j2', 'j3', 'j4'], footwearId: 'f5' },
        'm2_4': { clothingIds: ['c1', 'c2'], jewelleryIds: ['j5', 'j6'], footwearId: 'f1' },
        'm3_4': { clothingIds: ['c6', 'c3', 'c4'], jewelleryIds: ['j7', 'j1'], footwearId: 'f4' },
        'm4_4': { clothingIds: ['c9', 'c6'], jewelleryIds: ['j2', 'j4', 'j6'], footwearId: 'f3' },
        'm5_4': { clothingIds: ['c2', 'c6', 'c10'], jewelleryIds: ['j1', 'j2', 'j5'], footwearId: 'f5' }
      }
    },
    {
      id: 'show_2026_aw',
      name: 'NOIR // Autumn/Winter 2026 Gala Presentation',
      season: 'Autumn/Winter',
      year: 2026,
      date: '2026-10-24',
      venue: 'Royal Horticultural Halls, Westminster, London',
      currency: '£',
      catwalkAppearances: 3,
      appearanceThemes: {
        1: 'Heavy Wool Tailoring',
        2: 'Leather & Cashmere',
        3: 'Gala Evening Noir'
      },
      models: [
        { id: 'm1_aw', firstName: 'Freja', walkOrder: 1, notes: 'Heavy wool look opener' },
        { id: 'm2_aw', firstName: 'Aria', walkOrder: 2, notes: 'Leather boots change' },
        { id: 'm3_aw', firstName: 'Julian', walkOrder: 3, notes: 'Structured coats' }
      ],
      items: [
        { id: 'c_aw1', name: 'Cashmere Double-Face Greatcoat', category: 'clothing', price: 1650.00 },
        { id: 'c_aw2', name: 'Leather Paneled Pencil Skirt', category: 'clothing', price: 540.00 },
        { id: 'c_aw3', name: 'Merino Ribbed Polo Jumper', category: 'clothing', price: 310.00 },
        { id: 'j_aw1', name: 'Brutalist Silver Torque Choker', category: 'jewellery', price: 420.00 },
        { id: 'f_aw1', name: 'Over-The-Knee Nappa Boots', category: 'footwear', price: 890.00 }
      ],
      assignments: {
        'm1_aw_1': { clothingIds: ['c_aw1', 'c_aw3'], jewelleryIds: ['j_aw1'], footwearId: 'f_aw1' },
        'm2_aw_1': { clothingIds: ['c_aw2', 'c_aw3'], jewelleryIds: ['j_aw1'], footwearId: 'f_aw1' },
        'm3_aw_1': { clothingIds: ['c_aw1'], jewelleryIds: [], footwearId: 'f_aw1' }
      }
    }
  ]
};

function generateItemId(name, price, existingItemIds = []) {
  if (!name || typeof name !== 'string') name = 'item';
  const words = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().split(/\s+/).filter(Boolean);
  let prefix = '';
  if (words.length >= 2) {
    prefix = words[0].slice(0, 3) + words[1].slice(0, 3);
  } else if (words.length === 1) {
    prefix = words[0].slice(0, 6);
  } else {
    prefix = 'item';
  }
  if (!prefix) prefix = 'item';
  const priceNum = Math.floor(Math.abs(parseFloat(price) || 0));
  let baseId = `${prefix}${priceNum}`.toLowerCase();
  let finalId = baseId;
  let counter = 2;
  const existingSet = new Set((existingItemIds || []).map(id => (id || '').toLowerCase()));
  while (existingSet.has(finalId)) {
    finalId = `${baseId}-${counter}`;
    counter++;
  }
  return finalId;
}

class FashionShowDatabase {
  constructor(dbPath = getDbFilePath()) {
    this.dbPath = dbPath;
    this.db = new DatabaseSync(this.dbPath);
    this.initSchema();
  }

  initSchema() {
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec('PRAGMA journal_mode = WAL;');

    // 1. Shows table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS shows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        season TEXT,
        year INTEGER,
        date TEXT,
        venue TEXT,
        currency TEXT DEFAULT '£',
        catwalk_appearances INTEGER DEFAULT 3,
        appearance_themes TEXT,
        created_at TEXT
      );
    `);

    // Ensure backwards compatibility for existing databases without appearance_themes column
    try {
      this.db.exec('ALTER TABLE shows ADD COLUMN appearance_themes TEXT;');
    } catch (e) {
      // Column already exists
    }

    // Seed default appearance themes for initial shows if empty
    try {
      const ssShow = this.db.prepare('SELECT appearance_themes FROM shows WHERE id = ?').get('show_2026_ss');
      if (ssShow && (!ssShow.appearance_themes || ssShow.appearance_themes === '{}')) {
        this.db.prepare('UPDATE shows SET appearance_themes = ? WHERE id = ?').run(
          JSON.stringify({
            1: 'Denim',
            2: 'Leisureware',
            3: 'Draped Eveningwear',
            4: 'Grand Finale'
          }),
          'show_2026_ss'
        );
      }
      const awShow = this.db.prepare('SELECT appearance_themes FROM shows WHERE id = ?').get('show_2026_aw');
      if (awShow && (!awShow.appearance_themes || awShow.appearance_themes === '{}')) {
        this.db.prepare('UPDATE shows SET appearance_themes = ? WHERE id = ?').run(
          JSON.stringify({
            1: 'Heavy Wool Tailoring',
            2: 'Leather & Cashmere',
            3: 'Gala Evening Noir'
          }),
          'show_2026_aw'
        );
      }
    } catch (e) {
      // Ignore
    }

    // 2. Models table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS models (
        id TEXT PRIMARY KEY,
        show_id TEXT NOT NULL,
        first_name TEXT NOT NULL,
        walk_order INTEGER NOT NULL,
        notes TEXT,
        FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_models_show ON models(show_id);
    `);

    // 3. Wardrobe Items table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        show_id TEXT NOT NULL,
        item_id TEXT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_items_show ON items(show_id);
    `);

    try {
      this.db.exec('ALTER TABLE items ADD COLUMN item_id TEXT;');
    } catch (e) {
      // Column already exists
    }

    try {
      const nullItems = this.db.prepare('SELECT * FROM items WHERE item_id IS NULL OR item_id = ""').all();
      if (nullItems.length > 0) {
        const updateStmt = this.db.prepare('UPDATE items SET item_id = ? WHERE id = ?');
        const showItemsMap = {};
        for (const item of nullItems) {
          if (!showItemsMap[item.show_id]) {
            const existing = this.db.prepare('SELECT item_id FROM items WHERE show_id = ? AND item_id IS NOT NULL AND item_id != ""').all(item.show_id);
            showItemsMap[item.show_id] = existing.map(x => x.item_id);
          }
          const newCode = generateItemId(item.name, item.price, showItemsMap[item.show_id]);
          showItemsMap[item.show_id].push(newCode);
          updateStmt.run(newCode, item.id);
        }
      }
    } catch (e) {
      // Migration check completed
    }

    // 4. Catwalk Outfit Assignments table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS assignments (
        show_id TEXT NOT NULL,
        model_id TEXT NOT NULL,
        appearance_index INTEGER NOT NULL,
        clothing_ids TEXT NOT NULL,
        jewellery_ids TEXT NOT NULL,
        footwear_id TEXT,
        PRIMARY KEY (show_id, model_id, appearance_index),
        FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_assignments_show ON assignments(show_id);
    `);

    // 5. App State / Settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Check if initial seed data is needed
    const showCount = this.db.prepare('SELECT COUNT(*) AS count FROM shows').get().count;
    if (showCount === 0) {
      this.importData(DEFAULT_INITIAL_DATA);
    }
  }

  /**
   * Get complete application state matching store schema
   */
  getAllData() {
    const showsRows = this.db.prepare('SELECT * FROM shows ORDER BY created_at ASC').all();
    const activeShowRow = this.db.prepare("SELECT value FROM app_state WHERE key = 'activeShowId'").get();
    let activeShowId = activeShowRow ? activeShowRow.value : null;

    const shows = showsRows.map(s => {
      // Models
      const modelRows = this.db.prepare('SELECT * FROM models WHERE show_id = ? ORDER BY walk_order ASC').all(s.id);
      const models = modelRows.map(m => ({
        id: m.id,
        firstName: m.first_name,
        walkOrder: m.walk_order,
        notes: m.notes || ''
      }));

      // Items
      const itemRows = this.db.prepare('SELECT * FROM items WHERE show_id = ?').all(s.id);
      const items = itemRows.map(i => ({
        id: i.id,
        itemId: i.item_id || generateItemId(i.name, i.price, []),
        name: i.name,
        category: i.category,
        price: Number(i.price)
      }));

      // Assignments
      const assignmentRows = this.db.prepare('SELECT * FROM assignments WHERE show_id = ?').all(s.id);
      const assignments = {};
      for (const a of assignmentRows) {
        const key = `${a.model_id}_${a.appearance_index}`;
        assignments[key] = {
          clothingIds: JSON.parse(a.clothing_ids || '[]'),
          jewelleryIds: JSON.parse(a.jewellery_ids || '[]'),
          footwearId: a.footwear_id || null
        };
      }

      let appearanceThemes = {};
      try {
        appearanceThemes = s.appearance_themes ? JSON.parse(s.appearance_themes) : {};
      } catch (e) {
        appearanceThemes = {};
      }

      return {
        id: s.id,
        name: s.name,
        season: s.season,
        year: s.year,
        date: s.date,
        venue: s.venue,
        currency: s.currency,
        catwalkAppearances: s.catwalk_appearances,
        appearanceThemes,
        models,
        items,
        assignments
      };
    });

    if (!activeShowId && shows.length > 0) {
      activeShowId = shows[0].id;
    }

    return {
      activeShowId,
      shows
    };
  }

  /**
   * Import or full save data atomically
   */
  importData(data) {
    if (!data || !Array.isArray(data.shows)) {
      throw new Error('Invalid data format: shows array is required.');
    }

    this.db.exec('BEGIN;');
    try {
      // Clear existing records to ensure clean sync/migration
      this.db.exec('DELETE FROM assignments;');
      this.db.exec('DELETE FROM items;');
      this.db.exec('DELETE FROM models;');
      this.db.exec('DELETE FROM shows;');

      const insertShow = this.db.prepare(`
        INSERT INTO shows (id, name, season, year, date, venue, currency, catwalk_appearances, appearance_themes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertModel = this.db.prepare(`
        INSERT INTO models (id, show_id, first_name, walk_order, notes)
        VALUES (?, ?, ?, ?, ?)
      `);

      const insertItem = this.db.prepare(`
        INSERT INTO items (id, show_id, item_id, name, category, price)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const insertAssignment = this.db.prepare(`
        INSERT INTO assignments (show_id, model_id, appearance_index, clothing_ids, jewellery_ids, footwear_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const show of data.shows) {
        insertShow.run(
          show.id,
          show.name,
          show.season || 'Spring/Summer',
          parseInt(show.year, 10) || new Date().getFullYear(),
          show.date || new Date().toISOString().split('T')[0],
          show.venue || 'Catwalk Hall',
          show.currency || '£',
          parseInt(show.catwalkAppearances, 10) || 3,
          JSON.stringify(show.appearanceThemes || {}),
          show.createdAt || new Date().toISOString()
        );

        if (Array.isArray(show.models)) {
          show.models.forEach((m, idx) => {
            insertModel.run(
              m.id,
              show.id,
              m.firstName,
              m.walkOrder !== undefined ? m.walkOrder : (idx + 1),
              m.notes || ''
            );
          });
        }

        if (Array.isArray(show.items)) {
          const showItemIds = [];
          show.items.forEach(item => {
            const code = item.itemId || generateItemId(item.name, item.price, showItemIds);
            showItemIds.push(code);
            insertItem.run(
              item.id,
              show.id,
              code,
              item.name,
              item.category,
              parseFloat(item.price) || 0
            );
          });
        }

        if (show.assignments && typeof show.assignments === 'object') {
          for (const [key, assignment] of Object.entries(show.assignments)) {
            // key format: ${modelId}_${appearanceIndex}
            const parts = key.split('_');
            const appearanceIndex = parseInt(parts.pop(), 10);
            const modelId = parts.join('_');

            if (modelId && !isNaN(appearanceIndex)) {
              insertAssignment.run(
                show.id,
                modelId,
                appearanceIndex,
                JSON.stringify(assignment.clothingIds || []),
                JSON.stringify(assignment.jewelleryIds || []),
                assignment.footwearId || null
              );
            }
          }
        }
      }

      const activeId = data.activeShowId || (data.shows.length > 0 ? data.shows[0].id : null);
      if (activeId) {
        this.db.prepare("INSERT OR REPLACE INTO app_state (key, value) VALUES ('activeShowId', ?)").run(activeId);
      }

      this.db.exec('COMMIT;');
      return { success: true, showsCount: data.shows.length };
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Migrate data from legacy localStorage payload with overwrite safety checks
   */
  migrateFromLocalStorage(payload, options = {}) {
    if (!payload) throw new Error('No data payload provided for migration.');

    let parsed = payload;
    if (typeof payload === 'string') {
      try {
        parsed = JSON.parse(payload);
      } catch (e) {
        throw new Error('Failed to parse legacy JSON payload: ' + e.message);
      }
    }

    if (!parsed || !Array.isArray(parsed.shows) || parsed.shows.length === 0) {
      throw new Error('Legacy data payload contains no valid fashion shows.');
    }

    // Safety check: if DB already contains fashion show data and overwrite flag is not set, reject migration
    const showCount = this.db.prepare('SELECT COUNT(*) AS count FROM shows').get().count;
    const allowOverwrite = Boolean(options.overwrite || parsed.overwrite || parsed.force);

    if (showCount > 0 && !allowOverwrite) {
      throw new Error('Database already contains existing fashion show data. Migration aborted to prevent accidental data loss. Pass overwrite flag to force replacement.');
    }

    return this.importData(parsed);
  }

  // --- Show CRUD operations ---

  setActiveShowId(showId) {
    this.db.prepare("INSERT OR REPLACE INTO app_state (key, value) VALUES ('activeShowId', ?)").run(showId);
    return showId;
  }

  createShow({ id, name, season, year, date, venue, currency = '£', catwalkAppearances = 3, appearanceThemes = {} }) {
    const showId = id || ('show_' + Date.now());
    const appearances = Math.min(5, Math.max(1, parseInt(catwalkAppearances, 10) || 3));
    const showName = name || `${season || 'Fashion'} ${year || new Date().getFullYear()} Show`;

    this.db.prepare(`
      INSERT INTO shows (id, name, season, year, date, venue, currency, catwalk_appearances, appearance_themes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      showId,
      showName,
      season || 'Spring/Summer',
      parseInt(year, 10) || new Date().getFullYear(),
      date || new Date().toISOString().split('T')[0],
      venue || 'Catwalk Hall',
      currency,
      appearances,
      JSON.stringify(appearanceThemes || {}),
      new Date().toISOString()
    );

    this.setActiveShowId(showId);
    return this.getShowById(showId);
  }

  getShowById(showId) {
    const s = this.db.prepare('SELECT * FROM shows WHERE id = ?').get(showId);
    if (!s) return null;

    const models = this.db.prepare('SELECT * FROM models WHERE show_id = ? ORDER BY walk_order ASC').all(showId)
      .map(m => ({ id: m.id, firstName: m.first_name, walkOrder: m.walk_order, notes: m.notes || '' }));

    const items = this.db.prepare('SELECT * FROM items WHERE show_id = ?').all(showId)
      .map(i => ({
        id: i.id,
        itemId: i.item_id || generateItemId(i.name, i.price, []),
        name: i.name,
        category: i.category,
        price: Number(i.price)
      }));

    const assignmentRows = this.db.prepare('SELECT * FROM assignments WHERE show_id = ?').all(showId);
    const assignments = {};
    for (const a of assignmentRows) {
      assignments[`${a.model_id}_${a.appearance_index}`] = {
        clothingIds: JSON.parse(a.clothing_ids || '[]'),
        jewelleryIds: JSON.parse(a.jewellery_ids || '[]'),
        footwearId: a.footwear_id || null
      };
    }

    let appearanceThemes = {};
    try {
      appearanceThemes = s.appearance_themes ? JSON.parse(s.appearance_themes) : {};
    } catch (e) {
      appearanceThemes = {};
    }

    return {
      id: s.id,
      name: s.name,
      season: s.season,
      year: s.year,
      date: s.date,
      venue: s.venue,
      currency: s.currency,
      catwalkAppearances: s.catwalk_appearances,
      appearanceThemes,
      models,
      items,
      assignments
    };
  }

  updateShow(showId, updates) {
    const current = this.db.prepare('SELECT * FROM shows WHERE id = ?').get(showId);
    if (!current) return null;

    const name = updates.name !== undefined ? updates.name.trim() : current.name;
    const season = updates.season !== undefined ? updates.season : current.season;
    const year = updates.year !== undefined ? parseInt(updates.year, 10) : current.year;
    const date = updates.date !== undefined ? updates.date : current.date;
    const venue = updates.venue !== undefined ? updates.venue.trim() : current.venue;
    const currency = updates.currency !== undefined ? updates.currency.trim() || '£' : current.currency;
    const appearances = updates.catwalkAppearances !== undefined
      ? Math.min(5, Math.max(1, parseInt(updates.catwalkAppearances, 10)))
      : current.catwalk_appearances;

    let appearanceThemes = {};
    try {
      appearanceThemes = current.appearance_themes ? JSON.parse(current.appearance_themes) : {};
    } catch (e) {
      appearanceThemes = {};
    }
    if (updates.appearanceThemes !== undefined && typeof updates.appearanceThemes === 'object' && updates.appearanceThemes !== null) {
      appearanceThemes = { ...appearanceThemes, ...updates.appearanceThemes };
    }

    this.db.prepare(`
      UPDATE shows
      SET name = ?, season = ?, year = ?, date = ?, venue = ?, currency = ?, catwalk_appearances = ?, appearance_themes = ?
      WHERE id = ?
    `).run(name, season, year, date, venue, currency, appearances, JSON.stringify(appearanceThemes), showId);

    return this.getShowById(showId);
  }

  deleteShow(showId) {
    const totalShows = this.db.prepare('SELECT COUNT(*) AS count FROM shows').get().count;
    if (totalShows <= 1) {
      throw new Error('Cannot delete the only existing fashion show.');
    }

    this.db.exec('BEGIN;');
    try {
      this.db.prepare('DELETE FROM shows WHERE id = ?').run(showId);
      const remaining = this.db.prepare('SELECT id FROM shows LIMIT 1').get();
      if (remaining) {
        this.setActiveShowId(remaining.id);
      }
      this.db.exec('COMMIT;');
      return remaining ? remaining.id : null;
    } catch (e) {
      this.db.exec('ROLLBACK;');
      throw e;
    }
  }

  duplicateShow(sourceShowId, newName) {
    const source = this.getShowById(sourceShowId);
    if (!source) return null;

    const copy = JSON.parse(JSON.stringify(source));
    copy.id = 'show_' + Date.now();
    copy.name = newName || `${source.name} (Copy)`;

    this.db.exec('BEGIN;');
    try {
      this.db.prepare(`
        INSERT INTO shows (id, name, season, year, date, venue, currency, catwalk_appearances, appearance_themes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        copy.id,
        copy.name,
        copy.season,
        copy.year,
        copy.date,
        copy.venue,
        copy.currency,
        copy.catwalkAppearances,
        JSON.stringify(copy.appearanceThemes || {}),
        new Date().toISOString()
      );

      const insertModel = this.db.prepare(`
        INSERT INTO models (id, show_id, first_name, walk_order, notes)
        VALUES (?, ?, ?, ?, ?)
      `);
      copy.models.forEach(m => {
        insertModel.run(m.id, copy.id, m.firstName, m.walkOrder, m.notes || '');
      });

      const insertItem = this.db.prepare(`
        INSERT INTO items (id, show_id, item_id, name, category, price)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      copy.items.forEach(i => {
        insertItem.run(i.id, copy.id, i.itemId || generateItemId(i.name, i.price, []), i.name, i.category, i.price);
      });

      const insertAssignment = this.db.prepare(`
        INSERT INTO assignments (show_id, model_id, appearance_index, clothing_ids, jewellery_ids, footwear_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const [key, ass] of Object.entries(copy.assignments)) {
        const parts = key.split('_');
        const appearanceIndex = parseInt(parts.pop(), 10);
        const modelId = parts.join('_');
        insertAssignment.run(
          copy.id,
          modelId,
          appearanceIndex,
          JSON.stringify(ass.clothingIds || []),
          JSON.stringify(ass.jewelleryIds || []),
          ass.footwearId || null
        );
      }

      this.setActiveShowId(copy.id);
      this.db.exec('COMMIT;');
      return this.getShowById(copy.id);
    } catch (e) {
      this.db.exec('ROLLBACK;');
      throw e;
    }
  }

  // --- Model Operations ---

  addModel(showId, { firstName, notes = '' }) {
    const currentCount = this.db.prepare('SELECT COUNT(*) AS count FROM models WHERE show_id = ?').get(showId).count;
    if (currentCount >= 5) {
      throw new Error('Maximum of 5 models allowed per fashion show event.');
    }

    const trimmedName = (firstName || '').trim();
    if (!trimmedName) throw new Error('Model first name is required.');

    const nextOrder = currentCount + 1;
    const id = 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

    this.db.prepare(`
      INSERT INTO models (id, show_id, first_name, walk_order, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, showId, trimmedName, nextOrder, notes.trim());

    return { id, showId, firstName: trimmedName, walkOrder: nextOrder, notes: notes.trim() };
  }

  updateModel(showId, modelId, updates) {
    const current = this.db.prepare('SELECT * FROM models WHERE id = ? AND show_id = ?').get(modelId, showId);
    if (!current) return null;

    const firstName = updates.firstName !== undefined && updates.firstName.trim() ? updates.firstName.trim() : current.first_name;
    const notes = updates.notes !== undefined ? updates.notes.trim() : (current.notes || '');
    const walkOrder = updates.walkOrder !== undefined ? parseInt(updates.walkOrder, 10) : current.walk_order;

    this.db.prepare(`
      UPDATE models
      SET first_name = ?, notes = ?, walk_order = ?
      WHERE id = ? AND show_id = ?
    `).run(firstName, notes, walkOrder, modelId, showId);

    if (updates.walkOrder !== undefined) {
      this.normalizeWalkOrders(showId);
    }

    return this.db.prepare('SELECT * FROM models WHERE id = ?').get(modelId);
  }

  deleteModel(showId, modelId) {
    this.db.exec('BEGIN;');
    try {
      this.db.prepare('DELETE FROM models WHERE id = ? AND show_id = ?').run(modelId, showId);
      this.db.prepare('DELETE FROM assignments WHERE model_id = ? AND show_id = ?').run(modelId, showId);
      this.normalizeWalkOrders(showId);
      this.db.exec('COMMIT;');
      return true;
    } catch (e) {
      this.db.exec('ROLLBACK;');
      throw e;
    }
  }

  reorderModels(showId, modelIdList) {
    this.db.exec('BEGIN;');
    try {
      const updateStmt = this.db.prepare('UPDATE models SET walk_order = ? WHERE id = ? AND show_id = ?');
      modelIdList.forEach((id, idx) => {
        updateStmt.run(idx + 1, id, showId);
      });
      this.db.exec('COMMIT;');
    } catch (e) {
      this.db.exec('ROLLBACK;');
      throw e;
    }
  }

  normalizeWalkOrders(showId) {
    const models = this.db.prepare('SELECT id FROM models WHERE show_id = ? ORDER BY walk_order ASC').all(showId);
    const updateStmt = this.db.prepare('UPDATE models SET walk_order = ? WHERE id = ?');
    models.forEach((m, idx) => {
      updateStmt.run(idx + 1, m.id);
    });
  }

  // --- Wardrobe Item Operations ---

  addItem(showId, { name, category, price, itemId }) {
    const trimmedName = (name || '').trim();
    if (!trimmedName) throw new Error('Item name is required.');

    if (!['clothing', 'jewellery', 'footwear'].includes(category)) {
      throw new Error('Valid category required: clothing, jewellery, or footwear.');
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      throw new Error('Valid retail price is required.');
    }

    const id = 'itm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const roundedPrice = Math.round(parsedPrice * 100) / 100;

    const existingItems = this.db.prepare('SELECT item_id FROM items WHERE show_id = ?').all(showId);
    const existingCodes = existingItems.map(i => i.item_id);
    const code = (itemId && typeof itemId === 'string') ? itemId.toLowerCase() : generateItemId(trimmedName, roundedPrice, existingCodes);

    this.db.prepare(`
      INSERT INTO items (id, show_id, item_id, name, category, price)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, showId, code, trimmedName, category, roundedPrice);

    return { id, showId, itemId: code, name: trimmedName, category, price: roundedPrice };
  }

  updateItem(showId, itemId, updates) {
    const current = this.db.prepare('SELECT * FROM items WHERE id = ? AND show_id = ?').get(itemId, showId);
    if (!current) return null;

    const name = updates.name !== undefined && updates.name.trim() ? updates.name.trim() : current.name;
    const category = updates.category !== undefined && ['clothing', 'jewellery', 'footwear'].includes(updates.category)
      ? updates.category
      : current.category;
    let price = current.price;
    if (updates.price !== undefined) {
      const parsed = parseFloat(updates.price);
      if (!isNaN(parsed) && parsed >= 0) {
        price = Math.round(parsed * 100) / 100;
      }
    }

    let code = current.item_id;
    if (updates.itemId) {
      code = updates.itemId.toLowerCase();
    } else if (updates.name !== undefined || updates.price !== undefined) {
      const existingItems = this.db.prepare('SELECT item_id FROM items WHERE show_id = ? AND id != ?').all(showId, itemId);
      const existingCodes = existingItems.map(i => i.item_id);
      code = generateItemId(name, price, existingCodes);
    }

    this.db.prepare(`
      UPDATE items
      SET item_id = ?, name = ?, category = ?, price = ?
      WHERE id = ? AND show_id = ?
    `).run(code, name, category, price, itemId, showId);

    return { id: itemId, showId, itemId: code, name, category, price };
  }

  deleteItem(showId, itemId) {
    this.db.exec('BEGIN;');
    try {
      this.db.prepare('DELETE FROM items WHERE id = ? AND show_id = ?').run(itemId, showId);

      // Clean up item from assignments
      const assignments = this.db.prepare('SELECT * FROM assignments WHERE show_id = ?').all(showId);
      const updateStmt = this.db.prepare(`
        UPDATE assignments
        SET clothing_ids = ?, jewellery_ids = ?, footwear_id = ?
        WHERE show_id = ? AND model_id = ? AND appearance_index = ?
      `);

      for (const a of assignments) {
        let cloth = JSON.parse(a.clothing_ids || '[]');
        let jewel = JSON.parse(a.jewellery_ids || '[]');
        let foot = a.footwear_id;
        let changed = false;

        if (cloth.includes(itemId)) {
          cloth = cloth.filter(id => id !== itemId);
          changed = true;
        }
        if (jewel.includes(itemId)) {
          jewel = jewel.filter(id => id !== itemId);
          changed = true;
        }
        if (foot === itemId) {
          foot = null;
          changed = true;
        }

        if (changed) {
          updateStmt.run(JSON.stringify(cloth), JSON.stringify(jewel), foot, showId, a.model_id, a.appearance_index);
        }
      }

      this.db.exec('COMMIT;');
      return true;
    } catch (e) {
      this.db.exec('ROLLBACK;');
      throw e;
    }
  }

  // --- Outfit Assignments ---

  setAssignment(showId, modelId, appearanceIndex, { clothingIds = [], jewelleryIds = [], footwearId = null }) {
    const validClothing = (clothingIds || []).slice(0, 4);
    const validJewellery = (jewelleryIds || []).slice(0, 4);
    const validFootwear = footwearId || null;

    this.db.prepare(`
      INSERT INTO assignments (show_id, model_id, appearance_index, clothing_ids, jewellery_ids, footwear_id)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(show_id, model_id, appearance_index) DO UPDATE SET
        clothing_ids = excluded.clothing_ids,
        jewellery_ids = excluded.jewellery_ids,
        footwear_id = excluded.footwear_id
    `).run(
      showId,
      modelId,
      parseInt(appearanceIndex, 10),
      JSON.stringify(validClothing),
      JSON.stringify(validJewellery),
      validFootwear
    );

    return {
      clothingIds: validClothing,
      jewelleryIds: validJewellery,
      footwearId: validFootwear
    };
  }

  setAppearanceTheme(showId, appearanceIndex, themeName) {
    const current = this.db.prepare('SELECT appearance_themes FROM shows WHERE id = ?').get(showId);
    if (!current) return null;
    let themes = {};
    try {
      themes = current.appearance_themes ? JSON.parse(current.appearance_themes) : {};
    } catch (e) {
      themes = {};
    }
    const idx = parseInt(appearanceIndex, 10);
    themes[idx] = (themeName || '').trim();
    this.db.prepare('UPDATE shows SET appearance_themes = ? WHERE id = ?')
      .run(JSON.stringify(themes), showId);
    return themes;
  }

  clearAssignment(showId, modelId, appearanceIndex) {
    this.db.prepare('DELETE FROM assignments WHERE show_id = ? AND model_id = ? AND appearance_index = ?')
      .run(showId, modelId, parseInt(appearanceIndex, 10));
    return true;
  }

  resetToDefault() {
    return this.importData(DEFAULT_INITIAL_DATA);
  }

  close() {
    this.db.close();
  }
}

module.exports = {
  FashionShowDatabase,
  DEFAULT_INITIAL_DATA,
  getDbFilePath,
  DB_FILE_PATH,
  generateItemId
};
