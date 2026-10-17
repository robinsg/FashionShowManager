/**
 * Atelier Runway & Wardrobe Management System
 * Main Application Controller & UI Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.fashionStore;
  const reportsEngine = window.fashionReportsEngine;

  // Active state
  let currentTab = 'overview';
  let activeShow = store.getActiveShow();
  let editingOutfitTarget = null; // { modelId, appearanceIndex }
  let catalogFilter = 'all'; // all, clothing, jewellery, footwear
  let catalogSortField = 'default'; // default, category, name, price
  let catalogSortOrder = 'asc'; // asc, desc

  // DOM Elements cache
  const elements = {
    // Show Selector
    showSelect: document.getElementById('current-show-select'),
    btnNewShow: document.getElementById('btn-new-show'),
    btnManageShows: document.getElementById('btn-manage-shows'),
    btnExportData: document.getElementById('btn-export-data'),
    btnImportData: document.getElementById('btn-import-data'),
    fileInputImport: document.getElementById('file-input-import'),

    // Navigation Tabs
    tabButtons: document.querySelectorAll('.nav-tab-btn'),
    tabPanels: document.querySelectorAll('.tab-panel'),

    // Toast Container
    toastContainer: document.getElementById('toast-container'),

    // Modals
    modalNewShow: document.getElementById('modal-new-show'),
    modalManageShows: document.getElementById('modal-manage-shows'),
    modalOutfitBuilder: document.getElementById('modal-outfit-builder'),
    modalItemEdit: document.getElementById('modal-item-edit'),
    modalModelEdit: document.getElementById('modal-model-edit'),

    // Overview Tab Elements
    showNameDisplay: document.getElementById('stat-show-name'),
    showAppearancesDisplay: document.getElementById('stat-appearances-count'),
    showModelsDisplay: document.getElementById('stat-models-count'),
    showItemsDisplay: document.getElementById('stat-items-count'),
    showValuationDisplay: document.getElementById('stat-valuation'),
    formShowDetails: document.getElementById('form-show-details'),
    walkOrderListPreview: document.getElementById('walk-order-list-preview'),

    // Models Tab
    modelsListContainer: document.getElementById('models-roster-list'),
    btnAddModel: document.getElementById('btn-add-model'),

    // Items Catalog Tab
    itemsListContainer: document.getElementById('items-catalog-grid'),
    btnAddItem: document.getElementById('btn-add-item'),
    catalogSearchInput: document.getElementById('catalog-search-input'),
    catalogFilterButtons: document.querySelectorAll('.filter-btn'),
    catalogSortSelect: document.getElementById('catalog-sort-select'),

    // Catwalk Outfits Tab
    outfitsGridContainer: document.getElementById('outfits-matrix-view'),
    outfitViewModeSelect: document.getElementById('outfit-view-mode'),

    // Staff Report Tab
    staffReportContainer: document.getElementById('staff-report-content'),
    staffModelFilterSelect: document.getElementById('staff-model-filter'),
    btnPrintStaffReport: document.getElementById('btn-print-staff-report'),

    // Customer Report Tab
    customerReportContainer: document.getElementById('customer-report-content'),
    customerAppearanceFilterSelect: document.getElementById('customer-appearance-filter'),
    btnPrintCustomerReport: document.getElementById('btn-print-customer-report')
  };

  // ==========================================
  // Initialization
  // ==========================================
  function init() {
    setupEventListeners();
    refreshShowDropdown();
    loadActiveShowData();
  }

  function setupEventListeners() {
    // Tab switching
    elements.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        switchTab(targetTab);
      });
    });

    // Show selection
    elements.showSelect.addEventListener('change', (e) => {
      const showId = e.target.value;
      store.setActiveShow(showId);
      activeShow = store.getActiveShow();
      showToast(`Switched to "${activeShow.name}"`, 'info');
      refreshAllViews();
    });

    // New show button
    elements.btnNewShow.addEventListener('click', () => {
      openModal(elements.modalNewShow);
    });

    // Manage shows modal
    elements.btnManageShows.addEventListener('click', () => {
      renderShowsManagerList();
      openModal(elements.modalManageShows);
    });

    // Export / Import
    elements.btnExportData.addEventListener('click', handleExport);
    elements.btnImportData.addEventListener('click', () => elements.fileInputImport.click());
    elements.fileInputImport.addEventListener('change', handleImport);

    // Show Details Form submit
    elements.formShowDetails.addEventListener('submit', (e) => {
      e.preventDefault();
      saveShowDetails();
    });

    // Model management
    elements.btnAddModel.addEventListener('click', () => {
      openModelModal();
    });

    // Item management
    elements.btnAddItem.addEventListener('click', () => {
      openItemModal();
    });

    elements.catalogSearchInput.addEventListener('input', () => {
      renderCatalog();
    });

    elements.catalogFilterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.catalogFilterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        catalogFilter = btn.getAttribute('data-filter');
        renderCatalog();
      });
    });

    // Catalog Sort dropdown
    if (elements.catalogSortSelect) {
      elements.catalogSortSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'default') {
          catalogSortField = 'default';
          catalogSortOrder = 'asc';
        } else {
          const [field, order] = val.split('-');
          catalogSortField = field;
          catalogSortOrder = order || 'asc';
        }
        renderCatalog();
      });
    }

    // Outfits View Mode
    if (elements.outfitViewModeSelect) {
      elements.outfitViewModeSelect.addEventListener('change', () => {
        renderOutfitsMatrix();
      });
    }

    // Reports filters and prints
    elements.staffModelFilterSelect.addEventListener('change', () => {
      renderStaffReport();
    });

    elements.btnPrintStaffReport.addEventListener('click', () => {
      reportsEngine.printReport('staff');
    });

    elements.customerAppearanceFilterSelect.addEventListener('change', () => {
      renderCustomerReport();
    });

    elements.btnPrintCustomerReport.addEventListener('click', () => {
      reportsEngine.printReport('customer');
    });

    // Modal Close handlers
    document.querySelectorAll('.modal-close-btn, .modal-backdrop').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el) {
          closeAllModals();
        }
      });
    });

    // Form: New Show
    const formNewShow = document.getElementById('form-new-show');
    if (formNewShow) {
      formNewShow.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('new-show-name').value;
        const season = document.getElementById('new-show-season').value;
        const year = document.getElementById('new-show-year').value;
        const date = document.getElementById('new-show-date').value;
        const venue = document.getElementById('new-show-venue').value;
        const currency = document.getElementById('new-show-currency').value;
        const appearances = document.getElementById('new-show-appearances').value;

        const newShow = store.createShow({ name, season, year, date, venue, currency, catwalkAppearances: appearances });
        activeShow = newShow;
        closeAllModals();
        refreshShowDropdown();
        refreshAllViews();
        showToast(`Created fashion show "${newShow.name}"`, 'success');
      });
    }

    // Form: Item Edit/Add
    const formItem = document.getElementById('form-item-edit');
    if (formItem) {
      formItem.addEventListener('submit', (e) => {
        e.preventDefault();
        saveItemForm();
      });
    }

    // Form: Model Edit/Add
    const formModel = document.getElementById('form-model-edit');
    if (formModel) {
      formModel.addEventListener('submit', (e) => {
        e.preventDefault();
        saveModelForm();
      });
    }
  }

  // ==========================================
  // Tab Management
  // ==========================================
  function switchTab(tabId) {
    currentTab = tabId;
    elements.tabButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    elements.tabPanels.forEach(panel => {
      if (panel.id === `tab-${tabId}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Refresh specific tab contents
    if (tabId === 'overview') renderOverview();
    else if (tabId === 'models') renderModels();
    else if (tabId === 'catalog') renderCatalog();
    else if (tabId === 'outfits') renderOutfitsMatrix();
    else if (tabId === 'report-staff') renderStaffReport();
    else if (tabId === 'report-customer') renderCustomerReport();
  }

  function refreshAllViews() {
    activeShow = store.getActiveShow();
    renderOverview();
    renderModels();
    renderCatalog();
    renderOutfitsMatrix();
    updateReportFilterDropdowns();
    renderStaffReport();
    renderCustomerReport();
  }

  function refreshShowDropdown() {
    const shows = store.getShowsList();
    elements.showSelect.innerHTML = shows.map(s => `
      <option value="${s.id}" ${s.id === store.data.activeShowId ? 'selected' : ''}>
        ${escapeHtml(s.name)} (${s.season} ${s.year})
      </option>
    `).join('');
  }

  function loadActiveShowData() {
    activeShow = store.getActiveShow();
    refreshAllViews();
  }

  // ==========================================
  // 1. Overview Tab
  // ==========================================
  function renderOverview() {
    activeShow = store.getActiveShow();
    if (!activeShow) return;

    // Update Stats Cards
    elements.showNameDisplay.textContent = activeShow.name;
    elements.showAppearancesDisplay.textContent = `${activeShow.catwalkAppearances} Runs`;
    elements.showModelsDisplay.textContent = `${activeShow.models.length} / 5 Models`;
    elements.showItemsDisplay.textContent = `${activeShow.items.length} Items`;

    // Calculate total valuation
    const currency = activeShow.currency || '£';
    let totalVal = 0;
    Object.values(activeShow.assignments).forEach(ass => {
      (ass.clothingIds || []).forEach(id => {
        const it = store.getItemById(activeShow.id, id);
        if (it) totalVal += it.price;
      });
      (ass.jewelleryIds || []).forEach(id => {
        const it = store.getItemById(activeShow.id, id);
        if (it) totalVal += it.price;
      });
      if (ass.footwearId) {
        const it = store.getItemById(activeShow.id, ass.footwearId);
        if (it) totalVal += it.price;
      }
    });
    elements.showValuationDisplay.textContent = reportsEngine.formatPrice(totalVal, currency);

    // Populate Settings Form
    document.getElementById('edit-show-name').value = activeShow.name || '';
    document.getElementById('edit-show-season').value = activeShow.season || 'Spring/Summer';
    document.getElementById('edit-show-year').value = activeShow.year || new Date().getFullYear();
    document.getElementById('edit-show-date').value = activeShow.date || '';
    document.getElementById('edit-show-venue').value = activeShow.venue || '';
    document.getElementById('edit-show-currency').value = activeShow.currency || '£';
    document.getElementById('edit-show-appearances').value = activeShow.catwalkAppearances || 3;

    // Render Walk Order Preview
    const models = store.getModels(activeShow.id);
    if (models.length === 0) {
      elements.walkOrderListPreview.innerHTML = `
        <div class="empty-banner">
          <span>No models added yet. Add up to 5 models to establish the catwalk sequence.</span>
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('[data-tab=models]').click()">Add Models</button>
        </div>
      `;
    } else {
      elements.walkOrderListPreview.innerHTML = `
        <div class="walk-order-strip">
          ${models.map(m => `
            <div class="walk-order-card">
              <div class="walk-pos-circle">#${m.walkOrder}</div>
              <div class="walk-name">${escapeHtml(m.firstName)}</div>
              <div class="walk-badge-sm">Walks in position ${m.walkOrder}</div>
            </div>
          `).join('<div class="walk-arrow">→</div>')}
        </div>
        <p class="walk-order-rule-notice">
          ℹ️ <strong>Catwalk Sequence Rule:</strong> Models walk in this exact order (#1 to #${models.length}) for each of the ${activeShow.catwalkAppearances} catwalk appearances.
        </p>
      `;
    }
  }

  function saveShowDetails() {
    const updates = {
      name: document.getElementById('edit-show-name').value,
      season: document.getElementById('edit-show-season').value,
      year: document.getElementById('edit-show-year').value,
      date: document.getElementById('edit-show-date').value,
      venue: document.getElementById('edit-show-venue').value,
      currency: document.getElementById('edit-show-currency').value,
      catwalkAppearances: document.getElementById('edit-show-appearances').value
    };

    try {
      store.updateShowDetails(activeShow.id, updates);
      activeShow = store.getActiveShow();
      refreshShowDropdown();
      refreshAllViews();
      showToast('Show settings updated successfully', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  // ==========================================
  // 2. Models Tab
  // ==========================================
  function renderModels() {
    activeShow = store.getActiveShow();
    const models = store.getModels(activeShow.id);

    // Update count indicator
    const countEl = document.getElementById('models-count-indicator');
    if (countEl) {
      countEl.textContent = `${models.length} / 5 Models Configured`;
      if (models.length >= 5) {
        elements.btnAddModel.disabled = true;
        elements.btnAddModel.title = 'Maximum 5 models reached';
      } else {
        elements.btnAddModel.disabled = false;
        elements.btnAddModel.title = '';
      }
    }

    if (models.length === 0) {
      elements.modelsListContainer.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-icon">👥</div>
          <h3>No Models in Roster</h3>
          <p>Add up to 5 models for this fashion show. Each model will be on the catwalk in strict walk order.</p>
          <button class="btn btn-primary" id="btn-empty-add-model">+ Add First Model</button>
        </div>
      `;
      document.getElementById('btn-empty-add-model')?.addEventListener('click', () => openModelModal());
      return;
    }

    elements.modelsListContainer.innerHTML = `
      <div class="models-grid">
        ${models.map((model, idx) => {
          // Calculate appearances summary for this model
          let looksAssigned = 0;
          for (let i = 1; i <= activeShow.catwalkAppearances; i++) {
            const ass = store.getAssignment(activeShow.id, model.id, i);
            if ((ass.clothingIds && ass.clothingIds.length) || (ass.jewelleryIds && ass.jewelleryIds.length) || ass.footwearId) {
              looksAssigned++;
            }
          }

          return `
            <div class="model-card" data-model-id="${model.id}">
              <div class="model-card-header">
                <div class="walk-order-badge">
                  <span class="badge-label">WALK ORDER</span>
                  <span class="badge-num">#${model.walkOrder}</span>
                </div>
                <div class="model-actions-quick">
                  ${idx > 0 ? `<button class="btn-icon" title="Move Up in Order" onclick="window.app.moveModel('${model.id}', -1)">↑</button>` : ''}
                  ${idx < models.length - 1 ? `<button class="btn-icon" title="Move Down in Order" onclick="window.app.moveModel('${model.id}', 1)">↓</button>` : ''}
                  <button class="btn-icon" title="Edit Model" onclick="window.app.editModel('${model.id}')">✎</button>
                  <button class="btn-icon btn-danger" title="Remove Model" onclick="window.app.removeModel('${model.id}')">✕</button>
                </div>
              </div>

              <div class="model-card-body">
                <h3 class="model-display-name">${escapeHtml(model.firstName)}</h3>
                <div class="model-status-pills">
                  <span class="pill pill-gold">${activeShow.catwalkAppearances} Catwalk Runs</span>
                  <span class="pill ${looksAssigned === activeShow.catwalkAppearances ? 'pill-green' : 'pill-amber'}">
                    ${looksAssigned}/${activeShow.catwalkAppearances} Outfits Styled
                  </span>
                </div>
                <div class="model-notes-area">
                  <span class="notes-heading">Backstage / Dressing Notes:</span>
                  <p class="notes-text">${escapeHtml(model.notes || 'No special instructions recorded.')}</p>
                </div>
              </div>

              <div class="model-card-footer">
                <button class="btn btn-secondary btn-sm w-100" onclick="window.app.jumpToModelOutfits('${model.id}')">
                  Style Outfits for ${escapeHtml(model.firstName)} →
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function openModelModal(modelId = null) {
    const modal = elements.modalModelEdit;
    const titleEl = document.getElementById('modal-model-title');
    const idInput = document.getElementById('model-edit-id');
    const nameInput = document.getElementById('model-edit-name');
    const notesInput = document.getElementById('model-edit-notes');

    if (modelId) {
      const model = store.getModels(activeShow.id).find(m => m.id === modelId);
      if (!model) return;
      titleEl.textContent = 'Edit Model';
      idInput.value = model.id;
      nameInput.value = model.firstName;
      notesInput.value = model.notes || '';
    } else {
      if (store.getModels(activeShow.id).length >= 5) {
        showToast('Maximum of 5 models reached for this fashion show.', 'warning');
        return;
      }
      titleEl.textContent = 'Add Model to Fashion Show';
      idInput.value = '';
      nameInput.value = '';
      notesInput.value = '';
    }

    openModal(modal);
    nameInput.focus();
  }

  function saveModelForm() {
    const id = document.getElementById('model-edit-id').value;
    const name = document.getElementById('model-edit-name').value.trim();
    const notes = document.getElementById('model-edit-notes').value.trim();

    if (!name) {
      showToast('Please enter the model\'s first name', 'warning');
      return;
    }

    try {
      if (id) {
        store.updateModel(activeShow.id, id, { firstName: name, notes });
        showToast(`Updated model "${name}"`, 'success');
      } else {
        store.addModel(activeShow.id, name, notes);
        showToast(`Added model "${name}"`, 'success');
      }
      closeAllModals();
      refreshAllViews();
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  // ==========================================
  // 3. Wardrobe & Retail Price Catalog Tab
  // ==========================================
  function renderCatalog() {
    activeShow = store.getActiveShow();
    const currency = activeShow.currency || '£';
    const searchQuery = (elements.catalogSearchInput.value || '').toLowerCase().trim();

    let items = store.getItems(activeShow.id);

    // Apply category filter
    if (catalogFilter !== 'all') {
      items = items.filter(it => it.category === catalogFilter);
    }

    // Apply search
    if (searchQuery) {
      items = items.filter(it => it.name.toLowerCase().includes(searchQuery));
    }

    // Apply sorting
    if (catalogSortField === 'category') {
      items.sort((a, b) => {
        const cmp = a.category.localeCompare(b.category, 'en-GB');
        if (cmp !== 0) return catalogSortOrder === 'asc' ? cmp : -cmp;
        return a.name.localeCompare(b.name, 'en-GB');
      });
    } else if (catalogSortField === 'name') {
      items.sort((a, b) => {
        const cmp = a.name.localeCompare(b.name, 'en-GB');
        return catalogSortOrder === 'asc' ? cmp : -cmp;
      });
    } else if (catalogSortField === 'price') {
      items.sort((a, b) => {
        const diff = a.price - b.price;
        return catalogSortOrder === 'asc' ? diff : -diff;
      });
    }

    // Keep sort dropdown in sync
    if (elements.catalogSortSelect) {
      if (catalogSortField === 'default') {
        elements.catalogSortSelect.value = 'default';
      } else {
        elements.catalogSortSelect.value = `${catalogSortField}-${catalogSortOrder}`;
      }
    }

    // Update count labels
    const countBadge = document.getElementById('catalog-count-badge');
    if (countBadge) {
      countBadge.textContent = `${items.length} Items Listed`;
    }

    if (items.length === 0) {
      elements.itemsListContainer.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-icon">👗</div>
          <h3>No Items Found</h3>
          <p>${searchQuery ? 'No items match your search filter.' : 'Your wardrobe catalogue is empty. Add clothing, jewellery, or footwear items with their retail prices.'}</p>
          <button class="btn btn-primary" onclick="window.app.openItemModal()">+ Add New Item</button>
        </div>
      `;
      return;
    }

    elements.itemsListContainer.innerHTML = `
      <div class="items-table-wrapper">
        <table class="luxury-table items-catalog-table">
          <thead>
            <tr>
              <th class="sortable-th ${catalogSortField === 'category' ? 'sorted-' + catalogSortOrder : ''}" 
                  style="width: 140px;" 
                  onclick="window.app.toggleSort('category')"
                  title="Click to sort by Category (${catalogSortField === 'category' && catalogSortOrder === 'asc' ? 'Descending' : 'Ascending'})">
                Category
                <span class="sort-indicator">${catalogSortField === 'category' ? (catalogSortOrder === 'asc' ? '▲' : '▼') : '↕'}</span>
              </th>
              <th class="sortable-th ${catalogSortField === 'name' ? 'sorted-' + catalogSortOrder : ''}" 
                  onclick="window.app.toggleSort('name')"
                  title="Click to sort by Item Name (${catalogSortField === 'name' && catalogSortOrder === 'asc' ? 'Z to A' : 'A to Z'})">
                Item Name
                <span class="sort-indicator">${catalogSortField === 'name' ? (catalogSortOrder === 'asc' ? '▲' : '▼') : '↕'}</span>
              </th>
              <th class="sortable-th ${catalogSortField === 'price' ? 'sorted-' + catalogSortOrder : ''}" 
                  style="width: 180px;" 
                  onclick="window.app.toggleSort('price')"
                  title="Click to sort by Retail Price (${catalogSortField === 'price' && catalogSortOrder === 'asc' ? 'High to Low' : 'Low to High'})">
                Retail Price
                <span class="sort-indicator">${catalogSortField === 'price' ? (catalogSortOrder === 'asc' ? '▲' : '▼') : '↕'}</span>
              </th>
              <th style="width: 130px; text-align: center;">Runway Usage</th>
              <th style="width: 120px; text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => {
              const usage = store.getItemUsageCount(activeShow.id, item.id);
              return `
                <tr class="item-row" data-item-id="${item.id}">
                  <td>
                    <span class="badge-cat badge-${item.category}">
                      ${item.category === 'clothing' ? '👗' : item.category === 'jewellery' ? '💎' : '👠'}
                      ${item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div class="item-name-cell">
                      <span class="item-title">${escapeHtml(item.name)}</span>
                      <button class="inline-edit-btn" title="Quick Edit Name" onclick="window.app.quickEditItemName('${item.id}')">✎</button>
                    </div>
                  </td>
                  <td>
                    <div class="price-cell-box">
                      <span class="currency-tag">${currency}</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        class="inline-price-input" 
                        value="${item.price.toFixed(2)}"
                        data-item-id="${item.id}"
                        title="Click to quickly modify price"
                        onchange="window.app.quickUpdateItemPrice('${item.id}', this.value)"
                      />
                    </div>
                  </td>
                  <td style="text-align: center;">
                    <span class="usage-pill ${usage > 0 ? 'in-use' : 'unused'}">
                      ${usage > 0 ? `${usage} appearance${usage > 1 ? 's' : ''}` : 'Unused'}
                    </span>
                  </td>
                  <td style="text-align: right;">
                    <div class="btn-group-sm">
                      <button class="btn-icon" title="Full Edit" onclick="window.app.editItem('${item.id}')">✎</button>
                      <button class="btn-icon btn-danger" title="Delete Item" onclick="window.app.deleteItem('${item.id}')">✕</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function openItemModal(itemId = null) {
    const modal = elements.modalItemEdit;
    const titleEl = document.getElementById('modal-item-title');
    const idInput = document.getElementById('item-edit-id');
    const nameInput = document.getElementById('item-edit-name');
    const catSelect = document.getElementById('item-edit-category');
    const priceInput = document.getElementById('item-edit-price');

    if (itemId) {
      const item = store.getItemById(activeShow.id, itemId);
      if (!item) return;
      titleEl.textContent = 'Edit Wardrobe Item & Price';
      idInput.value = item.id;
      nameInput.value = item.name;
      catSelect.value = item.category;
      priceInput.value = item.price.toFixed(2);
    } else {
      titleEl.textContent = 'Add Item to Wardrobe Catalogue';
      idInput.value = '';
      nameInput.value = '';
      catSelect.value = catalogFilter !== 'all' ? catalogFilter : 'clothing';
      priceInput.value = '';
    }

    openModal(modal);
    nameInput.focus();
  }

  function saveItemForm() {
    const id = document.getElementById('item-edit-id').value;
    const name = document.getElementById('item-edit-name').value.trim();
    const category = document.getElementById('item-edit-category').value;
    const price = document.getElementById('item-edit-price').value;

    if (!name) {
      showToast('Please enter an item name', 'warning');
      return;
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      showToast('Please enter a valid retail price', 'warning');
      return;
    }

    try {
      if (id) {
        store.updateItem(activeShow.id, id, { name, category, price });
        showToast(`Updated "${name}"`, 'success');
      } else {
        store.addItem(activeShow.id, { name, category, price });
        showToast(`Added "${name}" to catalogue`, 'success');
      }
      closeAllModals();
      refreshAllViews();
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  // ==========================================
  // 4. Catwalk Outfits (Assignment Matrix)
  // ==========================================
  function renderOutfitsMatrix() {
    activeShow = store.getActiveShow();
    const models = store.getModels(activeShow.id);
    const totalAppearances = activeShow.catwalkAppearances;
    const currency = activeShow.currency || '£';

    if (models.length === 0) {
      elements.outfitsGridContainer.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-icon">👠</div>
          <h3>No Models in Fashion Show</h3>
          <p>You must add models before assigning catwalk outfits.</p>
          <button class="btn btn-primary" onclick="window.app.switchTab('models')">Go to Models Roster</button>
        </div>
      `;
      return;
    }

    const viewMode = elements.outfitViewModeSelect ? elements.outfitViewModeSelect.value : 'by-model';

    if (viewMode === 'by-model') {
      renderOutfitsByModel(models, totalAppearances, currency);
    } else {
      renderOutfitsByAppearance(models, totalAppearances, currency);
    }
  }

  function renderOutfitsByModel(models, totalAppearances, currency) {
    let html = `
      <div class="outfits-models-accordion">
    `;

    models.forEach(model => {
      html += `
        <div class="model-outfits-card">
          <div class="model-outfits-header">
            <div class="model-walk-title">
              <span class="walk-badge-gold">#${model.walkOrder}</span>
              <h3 class="model-outfit-heading">${escapeHtml(model.firstName)}</h3>
            </div>
            <div class="model-summary-badges">
              <span class="badge-dim">${totalAppearances} Scheduled Appearances</span>
            </div>
          </div>

          <div class="appearances-cards-grid">
      `;

      for (let appIdx = 1; appIdx <= totalAppearances; appIdx++) {
        const assignment = store.getAssignment(activeShow.id, model.id, appIdx);
        const clothingItems = (assignment.clothingIds || []).map(id => store.getItemById(activeShow.id, id)).filter(Boolean);
        const jewelleryItems = (assignment.jewelleryIds || []).map(id => store.getItemById(activeShow.id, id)).filter(Boolean);
        const footwearItem = assignment.footwearId ? store.getItemById(activeShow.id, assignment.footwearId) : null;

        let lookPrice = 0;
        clothingItems.forEach(i => lookPrice += i.price);
        jewelleryItems.forEach(i => lookPrice += i.price);
        if (footwearItem) lookPrice += footwearItem.price;

        const totalPieces = clothingItems.length + jewelleryItems.length + (footwearItem ? 1 : 0);

        html += `
          <div class="catwalk-slot-card ${totalPieces === 0 ? 'slot-empty' : ''}">
            <div class="slot-header">
              <div class="slot-title">Appearance #${appIdx}</div>
              <div class="slot-look-cost">${reportsEngine.formatPrice(lookPrice, currency)}</div>
            </div>

            <div class="slot-body">
              <!-- Clothing section (up to 4) -->
              <div class="slot-section">
                <div class="slot-section-label">
                  <span>👗 Clothing</span>
                  <span class="slot-limit-badge ${clothingItems.length === 4 ? 'limit-max' : ''}">${clothingItems.length}/4</span>
                </div>
                <div class="slot-items-list">
                  ${clothingItems.length > 0 ? clothingItems.map(item => `
                    <div class="slot-item-chip chip-clothing">
                      <span class="chip-name">${escapeHtml(item.name)}</span>
                      <span class="chip-price">${reportsEngine.formatPrice(item.price, currency)}</span>
                      <button class="chip-remove" title="Remove" onclick="window.app.removeItemFromSlot('${model.id}', ${appIdx}, '${item.id}')">✕</button>
                    </div>
                  `).join('') : '<div class="chip-empty-placeholder">No clothing assigned</div>'}
                </div>
              </div>

              <!-- Jewellery section (up to 4) -->
              <div class="slot-section">
                <div class="slot-section-label">
                  <span>💎 Jewellery</span>
                  <span class="slot-limit-badge ${jewelleryItems.length === 4 ? 'limit-max' : ''}">${jewelleryItems.length}/4</span>
                </div>
                <div class="slot-items-list">
                  ${jewelleryItems.length > 0 ? jewelleryItems.map(item => `
                    <div class="slot-item-chip chip-jewellery">
                      <span class="chip-name">${escapeHtml(item.name)}</span>
                      <span class="chip-price">${reportsEngine.formatPrice(item.price, currency)}</span>
                      <button class="chip-remove" title="Remove" onclick="window.app.removeItemFromSlot('${model.id}', ${appIdx}, '${item.id}')">✕</button>
                    </div>
                  `).join('') : '<div class="chip-empty-placeholder">No jewellery assigned</div>'}
                </div>
              </div>

              <!-- Footwear section (1 item) -->
              <div class="slot-section">
                <div class="slot-section-label">
                  <span>👠 Footwear</span>
                  <span class="slot-limit-badge ${footwearItem ? 'limit-max' : ''}">${footwearItem ? '1/1' : '0/1'}</span>
                </div>
                <div class="slot-items-list">
                  ${footwearItem ? `
                    <div class="slot-item-chip chip-footwear">
                      <span class="chip-name">${escapeHtml(footwearItem.name)}</span>
                      <span class="chip-price">${reportsEngine.formatPrice(footwearItem.price, currency)}</span>
                      <button class="chip-remove" title="Remove" onclick="window.app.removeItemFromSlot('${model.id}', ${appIdx}, '${footwearItem.id}')">✕</button>
                    </div>
                  ` : '<div class="chip-empty-placeholder">No footwear assigned</div>'}
                </div>
              </div>
            </div>

            <div class="slot-footer">
              <button class="btn btn-secondary btn-sm" onclick="window.app.openOutfitBuilder('${model.id}', ${appIdx})">
                ✎ Edit Outfit (${totalPieces} items)
              </button>
              ${totalPieces > 0 ? `
                <button class="btn-icon" title="Clear All Items in this slot" onclick="window.app.clearSlot('${model.id}', ${appIdx})">🗑</button>
              ` : ''}
            </div>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    });

    html += `</div>`;
    elements.outfitsGridContainer.innerHTML = html;
  }

  function renderOutfitsByAppearance(models, totalAppearances, currency) {
    let html = `<div class="outfits-appearances-wrapper">`;

    for (let appIdx = 1; appIdx <= totalAppearances; appIdx++) {
      html += `
        <div class="appearance-round-card">
          <div class="appearance-round-header">
            <div>
              <span class="round-kicker">Catwalk Sequence</span>
              <h3 class="round-title">Appearance Run #${appIdx}</h3>
            </div>
            <div class="round-badge-pill">Models walk in order #1 to #${models.length}</div>
          </div>

          <div class="round-models-grid">
      `;

      models.forEach(model => {
        const assignment = store.getAssignment(activeShow.id, model.id, appIdx);
        const clothingItems = (assignment.clothingIds || []).map(id => store.getItemById(activeShow.id, id)).filter(Boolean);
        const jewelleryItems = (assignment.jewelleryIds || []).map(id => store.getItemById(activeShow.id, id)).filter(Boolean);
        const footwearItem = assignment.footwearId ? store.getItemById(activeShow.id, assignment.footwearId) : null;

        let lookPrice = 0;
        clothingItems.forEach(i => lookPrice += i.price);
        jewelleryItems.forEach(i => lookPrice += i.price);
        if (footwearItem) lookPrice += footwearItem.price;

        const totalPieces = clothingItems.length + jewelleryItems.length + (footwearItem ? 1 : 0);

        html += `
          <div class="round-model-slot">
            <div class="slot-head-sm">
              <span class="walk-tag-sm">#${model.walkOrder} ${escapeHtml(model.firstName)}</span>
              <span class="price-tag-sm">${reportsEngine.formatPrice(lookPrice, currency)}</span>
            </div>

            <div class="slot-summary-compact">
              <div class="compact-cat"><span class="dot dot-clothing"></span> Clothing (${clothingItems.length}/4)</div>
              <div class="compact-cat"><span class="dot dot-jewellery"></span> Jewellery (${jewelleryItems.length}/4)</div>
              <div class="compact-cat"><span class="dot dot-footwear"></span> Footwear (${footwearItem ? '1/1' : '0/1'})</div>
            </div>

            <button class="btn btn-secondary btn-sm w-100 mt-2" onclick="window.app.openOutfitBuilder('${model.id}', ${appIdx})">
              Style Look (${totalPieces} items)
            </button>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    }

    html += `</div>`;
    elements.outfitsGridContainer.innerHTML = html;
  }

  // ==========================================
  // Outfit Builder Modal (Interactive Picker)
  // ==========================================
  function openOutfitBuilder(modelId, appearanceIndex) {
    editingOutfitTarget = { modelId, appearanceIndex };
    const model = store.getModels(activeShow.id).find(m => m.id === modelId);
    if (!model) return;

    const modal = elements.modalOutfitBuilder;
    const titleEl = document.getElementById('builder-modal-title');
    const subtitleEl = document.getElementById('builder-modal-subtitle');

    titleEl.textContent = `Style Outfit: ${model.firstName}`;
    subtitleEl.textContent = `Catwalk Appearance #${appearanceIndex} (Walk Order #${model.walkOrder})`;

    renderOutfitBuilderContent();
    openModal(modal);
  }

  function renderOutfitBuilderContent() {
    if (!editingOutfitTarget) return;
    const { modelId, appearanceIndex } = editingOutfitTarget;
    const model = store.getModels(activeShow.id).find(m => m.id === modelId);
    const currency = activeShow.currency || '£';
    const assignment = store.getAssignment(activeShow.id, modelId, appearanceIndex);

    const clothingItems = (assignment.clothingIds || []).map(id => store.getItemById(activeShow.id, id)).filter(Boolean);
    const jewelleryItems = (assignment.jewelleryIds || []).map(id => store.getItemById(activeShow.id, id)).filter(Boolean);
    const footwearItem = assignment.footwearId ? store.getItemById(activeShow.id, assignment.footwearId) : null;

    let lookPrice = 0;
    clothingItems.forEach(i => lookPrice += i.price);
    jewelleryItems.forEach(i => lookPrice += i.price);
    if (footwearItem) lookPrice += footwearItem.price;

    const container = document.getElementById('builder-content-area');
    const allItems = store.getItems(activeShow.id);

    // Group items by category
    const clothingAll = allItems.filter(i => i.category === 'clothing');
    const jewelleryAll = allItems.filter(i => i.category === 'jewellery');
    const footwearAll = allItems.filter(i => i.category === 'footwear');

    container.innerHTML = `
      <!-- Top Look Summary Banner -->
      <div class="builder-summary-banner">
        <div class="summary-counts">
          <span class="count-pill ${clothingItems.length >= 4 ? 'full' : ''}">👗 Clothing: ${clothingItems.length}/4</span>
          <span class="count-pill ${jewelleryItems.length >= 4 ? 'full' : ''}">💎 Jewellery: ${jewelleryItems.length}/4</span>
          <span class="count-pill ${footwearItem ? 'full' : ''}">👠 Footwear: ${footwearItem ? '1/1' : '0/1'}</span>
        </div>
        <div class="look-total-badge">
          <span class="total-caption">Total Look Value:</span>
          <span class="total-amount">${reportsEngine.formatPrice(lookPrice, currency)}</span>
        </div>
      </div>

      <!-- Quick Clone Bar (Optionally copy outfit from another appearance) -->
      <div class="clone-bar">
        <span>Copy outfit from another appearance:</span>
        <select id="select-clone-source" class="form-input form-input-sm" style="width: auto;">
          <option value="">-- Choose source --</option>
          ${Array.from({ length: activeShow.catwalkAppearances }, (_, i) => i + 1)
            .filter(app => app !== appearanceIndex)
            .map(app => `<option value="${app}">Appearance #${app}</option>`).join('')}
        </select>
        <button class="btn btn-secondary btn-sm" onclick="window.app.cloneOutfitFromSelected()">Apply Copy</button>
      </div>

      <!-- 3 Columns for Selection -->
      <div class="builder-columns-grid">
        <!-- 1. CLOTHING (MAX 4) -->
        <div class="builder-column">
          <div class="builder-col-header">
            <div class="col-title-wrap">
              <span class="cat-dot dot-clothing"></span>
              <h4>Clothing</h4>
            </div>
            <span class="badge-limit ${clothingItems.length >= 4 ? 'limit-max' : ''}">${clothingItems.length} / 4 Max</span>
          </div>

          <div class="items-picker-scroll">
            ${clothingAll.length > 0 ? clothingAll.map(item => {
              const isSelected = assignment.clothingIds && assignment.clothingIds.includes(item.id);
              const isFull = !isSelected && clothingItems.length >= 4;
              return `
                <div class="picker-item-card ${isSelected ? 'selected' : ''} ${isFull ? 'disabled-item' : ''}" 
                     onclick="window.app.toggleItemInBuilder('${item.id}')">
                  <div class="picker-check">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} ${isFull ? 'disabled' : ''} onclick="event.stopPropagation(); window.app.toggleItemInBuilder('${item.id}')">
                  </div>
                  <div class="picker-info">
                    <div class="picker-name">${escapeHtml(item.name)}</div>
                    <div class="picker-price">${reportsEngine.formatPrice(item.price, currency)}</div>
                  </div>
                </div>
              `;
            }).join('') : '<p class="empty-col">No clothing items in catalogue. Add some in Wardrobe tab.</p>'}
          </div>
        </div>

        <!-- 2. JEWELLERY (MAX 4) -->
        <div class="builder-column">
          <div class="builder-col-header">
            <div class="col-title-wrap">
              <span class="cat-dot dot-jewellery"></span>
              <h4>Jewellery</h4>
            </div>
            <span class="badge-limit ${jewelleryItems.length >= 4 ? 'limit-max' : ''}">${jewelleryItems.length} / 4 Max</span>
          </div>

          <div class="items-picker-scroll">
            ${jewelleryAll.length > 0 ? jewelleryAll.map(item => {
              const isSelected = assignment.jewelleryIds && assignment.jewelleryIds.includes(item.id);
              const isFull = !isSelected && jewelleryItems.length >= 4;
              return `
                <div class="picker-item-card ${isSelected ? 'selected' : ''} ${isFull ? 'disabled-item' : ''}" 
                     onclick="window.app.toggleItemInBuilder('${item.id}')">
                  <div class="picker-check">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} ${isFull ? 'disabled' : ''} onclick="event.stopPropagation(); window.app.toggleItemInBuilder('${item.id}')">
                  </div>
                  <div class="picker-info">
                    <div class="picker-name">${escapeHtml(item.name)}</div>
                    <div class="picker-price">${reportsEngine.formatPrice(item.price, currency)}</div>
                  </div>
                </div>
              `;
            }).join('') : '<p class="empty-col">No jewellery items in catalogue.</p>'}
          </div>
        </div>

        <!-- 3. FOOTWEAR (MAX 1) -->
        <div class="builder-column">
          <div class="builder-col-header">
            <div class="col-title-wrap">
              <span class="cat-dot dot-footwear"></span>
              <h4>Footwear</h4>
            </div>
            <span class="badge-limit ${footwearItem ? 'limit-max' : ''}">${footwearItem ? '1 / 1' : '0 / 1'} Max</span>
          </div>

          <div class="items-picker-scroll">
            ${footwearAll.length > 0 ? footwearAll.map(item => {
              const isSelected = assignment.footwearId === item.id;
              return `
                <div class="picker-item-card ${isSelected ? 'selected' : ''}" 
                     onclick="window.app.toggleItemInBuilder('${item.id}')">
                  <div class="picker-check">
                    <input type="radio" name="footwear_radio" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation(); window.app.toggleItemInBuilder('${item.id}')">
                  </div>
                  <div class="picker-info">
                    <div class="picker-name">${escapeHtml(item.name)}</div>
                    <div class="picker-price">${reportsEngine.formatPrice(item.price, currency)}</div>
                  </div>
                </div>
              `;
            }).join('') : '<p class="empty-col">No footwear items in catalogue.</p>'}
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // 5. Reports View & Refreshers
  // ==========================================
  function updateReportFilterDropdowns() {
    activeShow = store.getActiveShow();
    const models = store.getModels(activeShow.id);
    const totalAppearances = activeShow.catwalkAppearances;

    // Staff filter dropdown
    elements.staffModelFilterSelect.innerHTML = `
      <option value="all">All Models (${models.length})</option>
      ${models.map(m => `<option value="${m.id}">Order #${m.walkOrder}: ${escapeHtml(m.firstName)}</option>`).join('')}
    `;

    // Customer filter dropdown
    elements.customerAppearanceFilterSelect.innerHTML = `
      <option value="all">All Appearances (1 - ${totalAppearances})</option>
      ${Array.from({ length: totalAppearances }, (_, i) => i + 1).map(n => `
        <option value="${n}">Appearance #${n}</option>
      `).join('')}
    `;
  }

  function renderStaffReport() {
    const selectedModel = elements.staffModelFilterSelect.value || 'all';
    elements.staffReportContainer.innerHTML = reportsEngine.generateStaffReportHTML(activeShow.id, selectedModel);
  }

  function renderCustomerReport() {
    const selectedApp = elements.customerAppearanceFilterSelect.value || 'all';
    elements.customerReportContainer.innerHTML = reportsEngine.generateCustomerReportHTML(activeShow.id, selectedApp);
  }

  // ==========================================
  // Shows Manager Modal
  // ==========================================
  function renderShowsManagerList() {
    const shows = store.getShowsList();
    const container = document.getElementById('manage-shows-list');
    container.innerHTML = `
      <div class="manage-shows-grid">
        ${shows.map(s => `
          <div class="manage-show-row ${s.id === store.data.activeShowId ? 'active-show-row' : ''}">
            <div class="manage-show-info">
              <div class="manage-show-title">${escapeHtml(s.name)} ${s.id === store.data.activeShowId ? '<span class="pill pill-green pill-xs">ACTIVE</span>' : ''}</div>
              <div class="manage-show-meta">
                <span>${s.season} ${s.year}</span> • <span>${formatUKDate(s.date)}</span> • <span>${s.appearances} Runs</span> • <span>${s.modelsCount} Models</span>
              </div>
            </div>
            <div class="manage-show-actions">
              ${s.id !== store.data.activeShowId ? `
                <button class="btn btn-secondary btn-sm" onclick="window.app.switchShow('${s.id}')">Select</button>
              ` : ''}
              <button class="btn btn-secondary btn-sm" title="Duplicate Show" onclick="window.app.duplicateShow('${s.id}')">Duplicate</button>
              ${shows.length > 1 ? `
                <button class="btn btn-danger btn-sm" title="Delete Show" onclick="window.app.deleteShow('${s.id}')">Delete</button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ==========================================
  // Export / Import / Backup
  // ==========================================
  function handleExport() {
    const dataStr = store.exportJSON();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fashion_show_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('All fashion show data exported to JSON file', 'success');
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        store.importJSON(event.target.result);
        refreshShowDropdown();
        refreshAllViews();
        showToast('Fashion show data imported successfully!', 'success');
      } catch (err) {
        showToast('Error importing file: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ==========================================
  // Modal Utilities
  // ==========================================
  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add('active');
  }

  function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    editingOutfitTarget = null;
  }

  // ==========================================
  // Toast Notifications
  // ==========================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ';
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-msg">${escapeHtml(message)}</span>
    `;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatUKDate(dateInput) {
    if (!dateInput) return 'TBD';
    if (dateInput instanceof Date) {
      return dateInput.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    const str = String(dateInput).trim();
    const parts = str.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      }
    }
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return str;
  }

  // ==========================================
  // Public App API for Inline Click Handlers
  // ==========================================
  window.app = {
    switchTab,
    openModelModal,
    openItemModal,
    openOutfitBuilder,

    // Catalogue Sorting Action
    toggleSort: (field) => {
      if (catalogSortField === field) {
        catalogSortOrder = catalogSortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        catalogSortField = field;
        catalogSortOrder = 'asc';
      }
      renderCatalog();
    },

    // Model Actions
    editModel: (id) => openModelModal(id),
    removeModel: (id) => {
      const model = store.getModels(activeShow.id).find(m => m.id === id);
      if (confirm(`Remove model "${model?.firstName}" from this show? Outfits for this model will also be removed.`)) {
        store.deleteModel(activeShow.id, id);
        refreshAllViews();
        showToast('Model removed', 'info');
      }
    },
    moveModel: (id, direction) => {
      const models = store.getModels(activeShow.id);
      const idx = models.findIndex(m => m.id === id);
      if (idx === -1) return;
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= models.length) return;

      const ids = models.map(m => m.id);
      const temp = ids[idx];
      ids[idx] = ids[targetIdx];
      ids[targetIdx] = temp;

      store.reorderModels(activeShow.id, ids);
      refreshAllViews();
      showToast('Walk order updated', 'info');
    },
    jumpToModelOutfits: (modelId) => {
      switchTab('outfits');
    },

    // Item Actions
    editItem: (id) => openItemModal(id),
    quickEditItemName: (id) => {
      const item = store.getItemById(activeShow.id, id);
      if (!item) return;
      const newName = prompt('Edit item name:', item.name);
      if (newName && newName.trim() && newName.trim() !== item.name) {
        store.updateItem(activeShow.id, id, { name: newName.trim() });
        refreshAllViews();
        showToast(`Item renamed to "${newName.trim()}"`, 'success');
      }
    },
    quickUpdateItemPrice: (id, newPrice) => {
      const parsed = parseFloat(newPrice);
      if (isNaN(parsed) || parsed < 0) {
        showToast('Invalid price entered', 'error');
        renderCatalog();
        return;
      }
      store.updateItem(activeShow.id, id, { price: parsed });
      // Real-time update in background and reports
      refreshAllViews();
      showToast(`Updated retail price to ${reportsEngine.formatPrice(parsed, activeShow.currency || '£')}`, 'success');
    },
    deleteItem: (id) => {
      const item = store.getItemById(activeShow.id, id);
      if (!item) return;
      const usage = store.getItemUsageCount(activeShow.id, id);
      let msg = `Delete item "${item.name}" from wardrobe catalogue?`;
      if (usage > 0) {
        msg += ` Note: It is currently used in ${usage} catwalk appearance(s). Deleting it will remove it from those looks.`;
      }
      if (confirm(msg)) {
        store.deleteItem(activeShow.id, id);
        refreshAllViews();
        showToast('Item deleted', 'info');
      }
    },

    // Outfit Slot Actions
    removeItemFromSlot: (modelId, appearanceIndex, itemId) => {
      try {
        store.toggleItemAssignment(activeShow.id, modelId, appearanceIndex, itemId);
        renderOutfitsMatrix();
        renderStaffReport();
        renderCustomerReport();
        renderOverview();
        showToast('Item removed from outfit', 'info');
      } catch (e) {
        showToast(e.message, 'error');
      }
    },
    clearSlot: (modelId, appearanceIndex) => {
      if (confirm('Clear all clothing, jewellery and footwear for this appearance?')) {
        store.clearAssignment(activeShow.id, modelId, appearanceIndex);
        renderOutfitsMatrix();
        renderStaffReport();
        renderCustomerReport();
        renderOverview();
        showToast('Outfit cleared', 'info');
      }
    },

    // Outfit Builder Actions
    toggleItemInBuilder: (itemId) => {
      if (!editingOutfitTarget) return;
      const { modelId, appearanceIndex } = editingOutfitTarget;
      try {
        store.toggleItemAssignment(activeShow.id, modelId, appearanceIndex, itemId);
        renderOutfitBuilderContent();
        renderOutfitsMatrix();
        renderStaffReport();
        renderCustomerReport();
        renderOverview();
      } catch (e) {
        showToast(e.message, 'warning');
      }
    },
    cloneOutfitFromSelected: () => {
      if (!editingOutfitTarget) return;
      const { modelId, appearanceIndex } = editingOutfitTarget;
      const select = document.getElementById('select-clone-source');
      const sourceApp = parseInt(select.value, 10);
      if (!sourceApp) {
        showToast('Please select a source appearance to copy from', 'warning');
        return;
      }
      store.copyOutfitAssignment(activeShow.id, modelId, sourceApp, modelId, appearanceIndex);
      renderOutfitBuilderContent();
      renderOutfitsMatrix();
      renderStaffReport();
      renderCustomerReport();
      renderOverview();
      showToast(`Copied outfit from Appearance #${sourceApp}`, 'success');
    },

    // Shows Management Actions
    switchShow: (showId) => {
      store.setActiveShow(showId);
      activeShow = store.getActiveShow();
      refreshShowDropdown();
      closeAllModals();
      refreshAllViews();
      showToast(`Switched to "${activeShow.name}"`, 'info');
    },
    duplicateShow: (showId) => {
      const show = store.data.shows.find(s => s.id === showId);
      const newName = prompt('Enter name for duplicate fashion show:', `${show?.name || 'Fashion Show'} (Copy)`);
      if (newName && newName.trim()) {
        const copy = store.duplicateShow(showId, newName.trim());
        activeShow = copy;
        refreshShowDropdown();
        closeAllModals();
        refreshAllViews();
        showToast(`Created duplicate show "${copy.name}"`, 'success');
      }
    },
    deleteShow: (showId) => {
      const show = store.data.shows.find(s => s.id === showId);
      if (confirm(`Are you sure you want to permanently delete fashion show "${show?.name}"?`)) {
        try {
          store.deleteShow(showId);
          activeShow = store.getActiveShow();
          refreshShowDropdown();
          renderShowsManagerList();
          refreshAllViews();
          showToast('Show deleted', 'info');
        } catch (e) {
          showToast(e.message, 'error');
        }
      }
    }
  };

  // Run start
  init();
});
