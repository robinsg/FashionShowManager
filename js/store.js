/**
 * Atelier Runway & Wardrobe Management System
 * Data Store & Persistence Manager with SQLite Engine Integration
 */

const STORAGE_KEY = 'fashion_show_manager_data_v2';
const OLD_STORAGE_KEY = 'fashion_show_manager_data_v1';

// Default initial data featuring a realistic luxury fashion show
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
      catwalkAppearances: 4, // 1 to 5 appearances
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
        // Clothing (max 4 per appearance)
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

        // Jewellery (max 4 per appearance)
        { id: 'j1', name: '18k Champagne Gold Pavé Choker', category: 'jewellery', price: 1100.00 },
        { id: 'j2', name: 'Cascading Freshwater Pearl Drop Earrings', category: 'jewellery', price: 340.00 },
        { id: 'j3', name: 'Hammered Brass Architectural Cuff Bangle', category: 'jewellery', price: 260.00 },
        { id: 'j4', name: 'Bespoke Smoky Quartz Cocktail Ring', category: 'jewellery', price: 480.00 },
        { id: 'j5', name: 'Layered Platinum Herringbone Chain', category: 'jewellery', price: 750.00 },
        { id: 'j6', name: 'Diamond Pavé Orbit Ear Cuffs (Pair)', category: 'jewellery', price: 580.00 },
        { id: 'j7', name: 'Carved Obsidian Brooch with Gold Setting', category: 'jewellery', price: 390.00 },

        // Footwear (max 1 per appearance)
        { id: 'f1', name: 'Satin Ankle-Wrap Stiletto Sandals (Black)', category: 'footwear', price: 560.00 },
        { id: 'f2', name: 'Patent Leather Pointed Slingback Mules (Champagne)', category: 'footwear', price: 490.00 },
        { id: 'f3', name: 'Velvet Platform Block-Heel Pumps (Midnight Navy)', category: 'footwear', price: 530.00 },
        { id: 'f4', name: 'Embossed Leather Sculpted Heel Boots (Burgundy)', category: 'footwear', price: 820.00 },
        { id: 'f5', name: 'Minimalist Metallic Strappy Stiletto (Gold)', category: 'footwear', price: 480.00 }
      ],
      // Outfits assigned per model and catwalk appearance: `${modelId}_${appearanceIndex}`
      assignments: {
        // --- Appearance 1 (Day-to-Dusk Opener) ---
        'm1_1': { clothingIds: ['c1', 'c4'], jewelleryIds: ['j1', 'j3'], footwearId: 'f2' },
        'm2_1': { clothingIds: ['c3', 'c5', 'c4'], jewelleryIds: ['j2', 'j4'], footwearId: 'f1' },
        'm3_1': { clothingIds: ['c3', 'c8', 'c4'], jewelleryIds: ['j5'], footwearId: 'f4' },
        'm4_1': { clothingIds: ['c5', 'c7'], jewelleryIds: ['j1', 'j6', 'j3'], footwearId: 'f1' },
        'm5_1': { clothingIds: ['c10', 'c4'], jewelleryIds: ['j3', 'j7'], footwearId: 'f2' },

        // --- Appearance 2 (Contemporary Tailoring) ---
        'm1_2': { clothingIds: ['c3', 'c5', 'c7'], jewelleryIds: ['j2', 'j4'], footwearId: 'f1' },
        'm2_2': { clothingIds: ['c8', 'c7'], jewelleryIds: ['j6', 'j3'], footwearId: 'f3' },
        'm3_2': { clothingIds: ['c1', 'c4'], jewelleryIds: ['j7'], footwearId: 'f4' },
        'm4_2': { clothingIds: ['c10', 'c8', 'c4'], jewelleryIds: ['j1', 'j2'], footwearId: 'f5' },
        'm5_2': { clothingIds: ['c3', 'c4'], jewelleryIds: ['j5', 'j4'], footwearId: 'f1' },

        // --- Appearance 3 (Draped Eveningwear) ---
        'm1_3': { clothingIds: ['c9'], jewelleryIds: ['j1', 'j2', 'j4'], footwearId: 'f5' },
        'm2_3': { clothingIds: ['c9', 'c6'], jewelleryIds: ['j5', 'j3'], footwearId: 'f3' },
        'm3_3': { clothingIds: ['c3', 'c10', 'c4'], jewelleryIds: ['j7', 'j4'], footwearId: 'f4' },
        'm4_3': { clothingIds: ['c2'], jewelleryIds: ['j1', 'j4', 'j6'], footwearId: 'f5' },
        'm5_3': { clothingIds: ['c6', 'c5', 'c4'], jewelleryIds: ['j2', 'j3'], footwearId: 'f1' },

        // --- Appearance 4 (Grand Finale) ---
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

function getApiUrl(endpoint) {
  if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null' && window.location.origin !== 'file://') {
    return endpoint;
  }
  const port = (typeof process !== 'undefined' && process.env && process.env.PORT) || 3000;
  return `http://127.0.0.1:${port}${endpoint}`;
}

class FashionShowStore {
  constructor() {
    // Initial in-memory state while asynchronous SQLite connection initializes
    this.data = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
    this.isSQLite = false;
    this.isReady = false;
    this.migratedFromLocalStorage = false;
    this.listeners = [];
  }

  /**
   * Initialize store:
   * 1. Check for legacy localStorage data.
   * 2. If legacy data exists, migrate it to the SQLite database via POST /api/migrate.
   * 3. Clear legacy fashion show keys from localStorage (localStorage is NO LONGER USED for fashion show data).
   * 4. Load full dataset from SQLite via GET /api/data.
   */
  async init() {
    await this.checkForLocalStorageMigration();
    await this.loadFromSQLite();
    this.isReady = true;
    this.notifyListeners();
    return this.data;
  }

  /**
   * Migrate existing localStorage data to SQLite and purge from localStorage
   */
  async checkForLocalStorageMigration() {
    try {
      let legacyPayload = null;

      // Check for v2 localStorage
      const storedV2 = localStorage.getItem(STORAGE_KEY);
      if (storedV2) {
        try {
          const parsed = JSON.parse(storedV2);
          if (parsed && Array.isArray(parsed.shows) && parsed.shows.length > 0) {
            legacyPayload = parsed;
          }
        } catch (e) {
          console.warn('[Store] Failed to parse localStorage v2 data:', e);
        }
      }

      // Check for v1 localStorage if v2 was not found
      if (!legacyPayload) {
        const storedV1 = localStorage.getItem(OLD_STORAGE_KEY);
        if (storedV1) {
          try {
            let migratedStr = storedV1
              .replace(/Pre-Fall/g, 'Pre-Autumn')
              .replace(/Tuxedo Vest/g, 'Tuxedo Waistcoat');
            const parsed = JSON.parse(migratedStr);
            if (parsed && Array.isArray(parsed.shows) && parsed.shows.length > 0) {
              legacyPayload = parsed;
            }
          } catch (e) {
            console.warn('[Store] Failed to parse localStorage v1 data:', e);
          }
        }
      }

      // If legacy localStorage data exists, migrate to SQLite API
      if (legacyPayload) {
        console.log('[Store] Found legacy fashion show data in localStorage. Migrating to SQLite...');
        const res = await fetch(getApiUrl('/api/migrate'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(legacyPayload)
        });

        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            this.migratedFromLocalStorage = true;
            console.log(`[Store] Successfully migrated ${result.showsCount} shows to SQLite.`);
          }
        } else {
          console.error('[Store] Server returned error during localStorage migration:', res.status);
        }
      }

      // ENSURE localStorage is NO LONGER used: permanently purge fashion show keys
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(OLD_STORAGE_KEY);
    } catch (e) {
      console.warn('[Store] Error during localStorage migration check:', e);
      // Clean up keys even in failure to prevent recurring issues
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(OLD_STORAGE_KEY);
      } catch (err) {}
    }
  }

  /**
   * Fetch current application state from SQLite database
   */
  async loadFromSQLite() {
    try {
      const res = await fetch(getApiUrl('/api/data'));
      if (res.ok) {
        const dbData = await res.json();
        if (dbData && Array.isArray(dbData.shows) && dbData.shows.length > 0) {
          this.data = dbData;
          this.isSQLite = true;
          console.log(`[Store] SQLite connected. Active show: "${dbData.activeShowId}", Shows: ${dbData.shows.length}`);
          return this.data;
        }
      }
    } catch (e) {
      console.warn('[Store] Could not load data from SQLite backend API. Working in memory.', e);
      this.isSQLite = false;
    }
    return this.data;
  }

  /**
   * Persist data to SQLite database.
   * NOTE: localStorage is strictly NOT used for fashion show data.
   */
  async saveData(dataToSave = null) {
    if (dataToSave) {
      this.data = dataToSave;
    }

    if (this.isSQLite) {
      try {
        const res = await fetch(getApiUrl('/api/data'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.data)
        });
        if (!res.ok) {
          console.error('[Store] SQLite save returned status:', res.status);
        }
      } catch (e) {
        console.error('[Store] Failed to write to SQLite database:', e);
      }
    }

    this.notifyListeners();
  }

  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
    }
  }

  notifyListeners() {
    this.listeners.forEach(fn => {
      try { fn(this.data); } catch (e) { console.error(e); }
    });
  }

  // --- Show Management ---

  getShowsList() {
    return (this.data.shows || []).map(s => ({
      id: s.id,
      name: s.name,
      season: s.season,
      year: s.year,
      date: s.date,
      appearances: s.catwalkAppearances,
      modelsCount: (s.models || []).length
    }));
  }

  getActiveShow() {
    if (!this.data.shows || this.data.shows.length === 0) {
      return null;
    }
    let show = this.data.shows.find(s => s.id === this.data.activeShowId);
    if (!show && this.data.shows.length > 0) {
      this.data.activeShowId = this.data.shows[0].id;
      show = this.data.shows[0];
    }
    return show;
  }

  setActiveShow(showId) {
    const exists = this.data.shows.find(s => s.id === showId);
    if (exists) {
      this.data.activeShowId = showId;
      this.saveData();
      if (this.isSQLite) {
        fetch(getApiUrl('/api/active-show'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ showId })
        }).catch(err => console.error(err));
      }
      return exists;
    }
    return null;
  }

  createShow({ name, season, year, date, venue, currency = '£', catwalkAppearances = 3, appearanceThemes = {} }) {
    const id = 'show_' + Date.now();
    const appearances = Math.min(5, Math.max(1, parseInt(catwalkAppearances, 10) || 3));
    const newShow = {
      id,
      name: name || `${season || 'Fashion'} ${year || new Date().getFullYear()} Show`,
      season: season || 'Spring/Summer',
      year: parseInt(year, 10) || new Date().getFullYear(),
      date: date || new Date().toISOString().split('T')[0],
      venue: venue || 'Catwalk Hall',
      currency: currency || '£',
      catwalkAppearances: appearances,
      appearanceThemes: appearanceThemes || {},
      models: [],
      items: [],
      assignments: {}
    };
    this.data.shows.push(newShow);
    this.data.activeShowId = id;
    this.saveData();
    return newShow;
  }

  updateShowDetails(showId, updates) {
    const show = this.data.shows.find(s => s.id === showId);
    if (!show) return null;

    if (updates.name !== undefined) show.name = updates.name.trim();
    if (updates.season !== undefined) show.season = updates.season;
    if (updates.year !== undefined) show.year = parseInt(updates.year, 10);
    if (updates.date !== undefined) show.date = updates.date;
    if (updates.venue !== undefined) show.venue = updates.venue.trim();
    if (updates.currency !== undefined) show.currency = updates.currency.trim() || '£';
    
    if (updates.catwalkAppearances !== undefined) {
      const appCount = Math.min(5, Math.max(1, parseInt(updates.catwalkAppearances, 10)));
      show.catwalkAppearances = appCount;
    }

    if (updates.appearanceThemes !== undefined && typeof updates.appearanceThemes === 'object' && updates.appearanceThemes !== null) {
      show.appearanceThemes = { ...(show.appearanceThemes || {}), ...updates.appearanceThemes };
    }

    this.saveData();
    return show;
  }

  deleteShow(showId) {
    if (this.data.shows.length <= 1) {
      throw new Error('Cannot delete the only existing fashion show.');
    }
    this.data.shows = this.data.shows.filter(s => s.id !== showId);
    if (this.data.activeShowId === showId) {
      this.data.activeShowId = this.data.shows[0].id;
    }
    this.saveData();
    return this.data.activeShowId;
  }

  duplicateShow(sourceShowId, newName) {
    const source = this.data.shows.find(s => s.id === sourceShowId);
    if (!source) return null;

    const copy = JSON.parse(JSON.stringify(source));
    copy.id = 'show_' + Date.now();
    copy.name = newName || `${source.name} (Copy)`;
    this.data.shows.push(copy);
    this.data.activeShowId = copy.id;
    this.saveData();
    return copy;
  }

  getAppearanceTheme(showId, appearanceIndex) {
    const show = showId ? this.data.shows.find(s => s.id === showId) : this.getActiveShow();
    if (!show || !show.appearanceThemes) return '';
    return show.appearanceThemes[appearanceIndex] || show.appearanceThemes[String(appearanceIndex)] || '';
  }

  setAppearanceTheme(showId, appearanceIndex, themeName) {
    const show = showId ? this.data.shows.find(s => s.id === showId) : this.getActiveShow();
    if (!show) return null;
    if (!show.appearanceThemes) show.appearanceThemes = {};
    const trimmed = (themeName || '').trim();
    show.appearanceThemes[appearanceIndex] = trimmed;
    this.saveData();

    if (this.isSQLite) {
      fetch(getApiUrl(`/api/shows/${encodeURIComponent(show.id)}/themes/${appearanceIndex}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: trimmed })
      }).catch(err => console.error(err));
    }

    return trimmed;
  }

  // --- Model Management (Up to 5 models per show) ---

  getModels(showId = null) {
    const show = showId ? this.data.shows.find(s => s.id === showId) : this.getActiveShow();
    if (!show || !show.models) return [];
    // Ensure sorted by walkOrder
    return [...show.models].sort((a, b) => a.walkOrder - b.walkOrder);
  }

  addModel(showId, firstName, notes = '') {
    const show = showId ? this.data.shows.find(s => s.id === showId) : this.getActiveShow();
    if (!show) throw new Error('Show not found');

    if (show.models.length >= 5) {
      throw new Error('Maximum of 5 models allowed per fashion show event.');
    }

    const trimmedName = firstName ? firstName.trim() : '';
    if (!trimmedName) {
      throw new Error('Model first name is required.');
    }

    const nextOrder = show.models.length + 1;
    const newModel = {
      id: 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      firstName: trimmedName,
      walkOrder: nextOrder,
      notes: notes.trim()
    };

    show.models.push(newModel);
    this.saveData();
    return newModel;
  }

  updateModel(showId, modelId, updates) {
    const show = showId ? this.data.shows.find(s => s.id === showId) : this.getActiveShow();
    if (!show) return null;

    const model = show.models.find(m => m.id === modelId);
    if (!model) return null;

    if (updates.firstName !== undefined && updates.firstName.trim()) {
      model.firstName = updates.firstName.trim();
    }
    if (updates.notes !== undefined) {
      model.notes = updates.notes.trim();
    }
    if (updates.walkOrder !== undefined) {
      model.walkOrder = parseInt(updates.walkOrder, 10);
      this.normalizeWalkOrders(show);
    }

    this.saveData();
    return model;
  }

  deleteModel(showId, modelId) {
    const show = showId ? this.data.shows.find(s => s.id === showId) : this.getActiveShow();
    if (!show) return false;

    show.models = show.models.filter(m => m.id !== modelId);
    this.normalizeWalkOrders(show);

    // Clean up assignments for this model
    if (show.assignments) {
      Object.keys(show.assignments).forEach(key => {
        if (key.startsWith(`${modelId}_`)) {
          delete show.assignments[key];
        }
      });
    }

    this.saveData();
    return true;
  }

  reorderModels(showId, modelIdList) {
    const show = showId ? this.data.shows.find(s => s.id === showId) : this.getActiveShow();
    if (!show) return;

    modelIdList.forEach((id, index) => {
      const model = show.models.find(m => m.id === id);
      if (model) {
        model.walkOrder = index + 1;
      }
    });

    this.normalizeWalkOrders(show);
    this.saveData();
  }

  normalizeWalkOrders(show) {
    show.models.sort((a, b) => a.walkOrder - b.walkOrder);
    show.models.forEach((model, idx) => {
      model.walkOrder = idx + 1;
    });
  }

  // --- Items & Retail Price Catalogue ---

  getItems(showId = null, categoryFilter = null) {
    const show = showId ? this.data.shows.find(s => s.id === showId) : this.getActiveShow();
    if (!show) return [];

    let items = show.items || [];
    if (categoryFilter) {
      items = items.filter(it => it.category === categoryFilter);
    }
    return items;
  }

  getItemById(showId, itemId) {
    const show = showId ? this.data.shows.find(s => s.id === showId) : this.getActiveShow();
    if (!show) return null;
    return (show.items || []).find(i => i.id === itemId) || null;
  }

  addItem(showId, { name, category, price, itemId }) {
    const show = showId ? this.data.shows.find(s => s.id === showId) : this.getActiveShow();
    if (!show) throw new Error('Show not found');

    const trimmedName = (name || '').trim();
    if (!trimmedName) throw new Error('Item name is required.');

    if (!['clothing', 'jewellery', 'footwear'].includes(category)) {
      throw new Error('Valid category required: clothing, jewellery, or footwear.');
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      throw new Error('Valid retail price is required.');
    }

    if (!show.items) show.items = [];
    const existingCodes = show.items.map(i => i.itemId).filter(Boolean);
    const roundedPrice = Math.round(parsedPrice * 100) / 100;
    const code = (itemId && typeof itemId === 'string') ? itemId.toLowerCase() : generateItemId(trimmedName, roundedPrice, existingCodes);

    const newItem = {
      id: 'itm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      itemId: code,
      name: trimmedName,
      category,
      price: roundedPrice
    };

    show.items.push(newItem);
    this.saveData();
    return newItem;
  }

  updateItem(showId, itemId, updates) {
    const show = showId ? this.data.shows.find(s => s.id === showId) : this.getActiveShow();
    if (!show || !show.items) return null;

    const item = show.items.find(i => i.id === itemId);
    if (!item) return null;

    if (updates.name !== undefined && updates.name.trim()) {
      item.name = updates.name.trim();
    }
    if (updates.category !== undefined && ['clothing', 'jewellery', 'footwear'].includes(updates.category)) {
      item.category = updates.category;
    }
    if (updates.price !== undefined) {
      const parsed = parseFloat(updates.price);
      if (!isNaN(parsed) && parsed >= 0) {
        item.price = Math.round(parsed * 100) / 100;
      }
    }

    if (updates.itemId) {
      item.itemId = updates.itemId.toLowerCase();
    } else if (updates.name !== undefined || updates.price !== undefined) {
      const existingCodes = show.items.filter(i => i.id !== itemId).map(i => i.itemId).filter(Boolean);
      item.itemId = generateItemId(item.name, item.price, existingCodes);
    } else if (!item.itemId) {
      const existingCodes = show.items.filter(i => i.id !== itemId).map(i => i.itemId).filter(Boolean);
      item.itemId = generateItemId(item.name, item.price, existingCodes);
    }

    this.saveData();
    return item;
  }

  deleteItem(showId, itemId) {
    const show = showId ? this.data.shows.find(s => s.id === showId) : this.getActiveShow();
    if (!show || !show.items) return false;

    show.items = show.items.filter(i => i.id !== itemId);

    // Remove from assignments if assigned anywhere
    if (show.assignments) {
      Object.values(show.assignments).forEach(assignment => {
        if (assignment.clothingIds) {
          assignment.clothingIds = assignment.clothingIds.filter(id => id !== itemId);
        }
        if (assignment.jewelleryIds) {
          assignment.jewelleryIds = assignment.jewelleryIds.filter(id => id !== itemId);
        }
        if (assignment.footwearId === itemId) {
          assignment.footwearId = null;
        }
      });
    }

    this.saveData();
    return true;
  }

  getItemUsageCount(showId, itemId) {
    const show = showId ? this.data.shows.find(s => s.id === showId) : this.getActiveShow();
    if (!show || !show.assignments) return 0;

    let count = 0;
    Object.values(show.assignments).forEach(ass => {
      if (ass.clothingIds && ass.clothingIds.includes(itemId)) count++;
      if (ass.jewelleryIds && ass.jewelleryIds.includes(itemId)) count++;
      if (ass.footwearId === itemId) count++;
    });
    return count;
  }

  // --- Outfit Assignments (Per Model & Catwalk Appearance) ---

  getAssignmentKey(modelId, appearanceIndex) {
    return `${modelId}_${appearanceIndex}`;
  }

  getAssignment(showId, modelId, appearanceIndex) {
    const show = showId ? this.data.shows.find(s => s.id === showId) : this.getActiveShow();
    if (!show || !show.assignments) return { clothingIds: [], jewelleryIds: [], footwearId: null };

    const key = this.getAssignmentKey(modelId, appearanceIndex);
    const existing = show.assignments[key];
    if (existing) {
      return {
        clothingIds: Array.isArray(existing.clothingIds) ? [...existing.clothingIds] : [],
        jewelleryIds: Array.isArray(existing.jewelleryIds) ? [...existing.jewelleryIds] : [],
        footwearId: existing.footwearId || null
      };
    }
    return { clothingIds: [], jewelleryIds: [], footwearId: null };
  }

  setAssignment(showId, modelId, appearanceIndex, { clothingIds = [], jewelleryIds = [], footwearId = null }) {
    const show = showId ? this.data.shows.find(s => s.id === showId) : this.getActiveShow();
    if (!show) throw new Error('Show not found');

    if (appearanceIndex < 1 || appearanceIndex > show.catwalkAppearances) {
      throw new Error(`Appearance index must be between 1 and ${show.catwalkAppearances}`);
    }

    const validClothing = (clothingIds || []).slice(0, 4);
    const validJewellery = (jewelleryIds || []).slice(0, 4);
    const validFootwear = footwearId || null;

    if (!show.assignments) show.assignments = {};
    const key = this.getAssignmentKey(modelId, appearanceIndex);
    show.assignments[key] = {
      clothingIds: validClothing,
      jewelleryIds: validJewellery,
      footwearId: validFootwear
    };

    this.saveData();
    return show.assignments[key];
  }

  toggleItemAssignment(showId, modelId, appearanceIndex, itemId) {
    const show = showId ? this.data.shows.find(s => s.id === showId) : this.getActiveShow();
    if (!show) return null;

    const item = (show.items || []).find(i => i.id === itemId);
    if (!item) return null;

    const current = this.getAssignment(showId, modelId, appearanceIndex);

    if (item.category === 'clothing') {
      const idx = current.clothingIds.indexOf(itemId);
      if (idx >= 0) {
        current.clothingIds.splice(idx, 1);
      } else {
        if (current.clothingIds.length >= 4) {
          throw new Error('A model can wear a maximum of 4 items of clothing per catwalk appearance.');
        }
        current.clothingIds.push(itemId);
      }
    } else if (item.category === 'jewellery') {
      const idx = current.jewelleryIds.indexOf(itemId);
      if (idx >= 0) {
        current.jewelleryIds.splice(idx, 1);
      } else {
        if (current.jewelleryIds.length >= 4) {
          throw new Error('A model can wear a maximum of 4 items of jewellery per catwalk appearance.');
        }
        current.jewelleryIds.push(itemId);
      }
    } else if (item.category === 'footwear') {
      if (current.footwearId === itemId) {
        current.footwearId = null;
      } else {
        current.footwearId = itemId;
      }
    }

    return this.setAssignment(showId, modelId, appearanceIndex, current);
  }

  copyOutfitAssignment(showId, fromModelId, fromApp, toModelId, toApp) {
    const show = showId ? this.data.shows.find(s => s.id === showId) : this.getActiveShow();
    if (!show) return;

    const source = this.getAssignment(showId, fromModelId, fromApp);
    this.setAssignment(showId, toModelId, toApp, {
      clothingIds: [...source.clothingIds],
      jewelleryIds: [...source.jewelleryIds],
      footwearId: source.footwearId
    });
  }

  clearAssignment(showId, modelId, appearanceIndex) {
    const show = showId ? this.data.shows.find(s => s.id === showId) : this.getActiveShow();
    if (!show || !show.assignments) return;

    const key = this.getAssignmentKey(modelId, appearanceIndex);
    delete show.assignments[key];
    this.saveData();
  }

  // --- Export / Import ---

  exportJSON() {
    return JSON.stringify(this.data, null, 2);
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !Array.isArray(parsed.shows)) {
        throw new Error('Invalid format: Missing shows array.');
      }
      this.data = parsed;
      this.saveData();
      return true;
    } catch (e) {
      throw new Error('Failed to import data: ' + e.message);
    }
  }
}

// Global instance
window.fashionStore = new FashionShowStore();
