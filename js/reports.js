/**
 * Atelier Runway & Wardrobe Management System
 * Reports Engine:
 * 1. Backstage Staff Wardrobe Checklist (By Model)
 * 2. Customer Runway Programme & Price Lookbook (By Catwalk Appearance)
 */

class FashionReportsEngine {
  constructor(store) {
    this.store = store;
  }

  formatPrice(amount, currency = '£') {
    if (amount === undefined || amount === null || isNaN(amount)) return `${currency}0.00`;
    return `${currency}${Number(amount).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatUKDate(dateInput) {
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
  // REPORT 1: Backstage Staff Wardrobe Report
  // (By Model, showing items per appearance)
  // ==========================================
  generateStaffReportHTML(showId = null, filterModelId = 'all') {
    const show = showId ? this.store.data.shows.find(s => s.id === showId) : this.store.getActiveShow();
    if (!show) return '<div class="empty-state">No fashion show selected.</div>';

    const models = this.store.getModels(show.id);
    if (models.length === 0) {
      return `
        <div class="empty-state">
          <p class="empty-title">No Models Configured</p>
          <p class="empty-desc">Add models to generate the Backstage Staff Wardrobe Report.</p>
        </div>
      `;
    }

    const filteredModels = filterModelId === 'all'
      ? models
      : models.filter(m => m.id === filterModelId);

    const totalAppearances = show.catwalkAppearances;

    let html = `
      <div class="report-document staff-report-theme" id="printable-staff-report">
        <!-- Print Header -->
        <header class="report-header">
          <div class="report-header-top">
            <div class="report-brand">
              <div class="report-logo-wrapper">
                <img src="https://heidiboutique.co.uk/cdn/shop/files/heidi_boutique_logo_1000px.png" alt="Heidi Boutique Logo" class="report-logo-img">
              </div>
              <span class="brand-eyebrow">BACKSTAGE DIRECTORY // OFFICIAL WARDROBE DOSSIER</span>
              <h1 class="report-title">${this.escapeHtml(show.name)}</h1>
              <p class="report-subtitle">Dresser & Wardrobe Team Checklist — Verify all items prior to runway call</p>
            </div>
            <div class="report-meta-box">
              <div class="meta-item"><span class="meta-label">VENUE:</span> <span class="meta-val">${this.escapeHtml(show.venue || 'Main Catwalk Stage')}</span></div>
              <div class="meta-item"><span class="meta-label">DATE:</span> <span class="meta-val">${this.escapeHtml(this.formatUKDate(show.date))}</span></div>
              <div class="meta-item"><span class="meta-label">RUNS:</span> <span class="meta-val">${totalAppearances} Catwalk Appearances</span></div>
              ${(() => {
                const themeList = [];
                for (let tIdx = 1; tIdx <= totalAppearances; tIdx++) {
                  const t = this.store.getAppearanceTheme(show.id, tIdx);
                  if (t) themeList.push(`#${tIdx} ${t}`);
                }
                return themeList.length > 0
                  ? `<div class="meta-item"><span class="meta-label">THEMES:</span> <span class="meta-val">${this.escapeHtml(themeList.join(' • '))}</span></div>`
                  : '';
              })()}
            </div>
          </div>
        </header>

        <!-- Model Dossiers -->
        <div class="model-dossiers-list">
    `;

    filteredModels.forEach((model) => {
      html += `
        <article class="model-dossier-card print-page-break" data-model-id="${model.id}">
          <div class="dossier-model-header">
            <div class="dossier-model-info">
              <span class="walk-badge">WALK ORDER #${model.walkOrder}</span>
              <h2 class="model-name">${this.escapeHtml(model.firstName)}</h2>
            </div>
            ${model.notes ? `<div class="dossier-notes"><span class="notes-tag">DRESSER NOTES:</span> ${this.escapeHtml(model.notes)}</div>` : ''}
          </div>

          <div class="appearances-strip">
      `;

      for (let appIdx = 1; appIdx <= totalAppearances; appIdx++) {
        const theme = this.store.getAppearanceTheme(show.id, appIdx);
        const assignment = this.store.getAssignment(show.id, model.id, appIdx);
        const clothingItems = (assignment.clothingIds || []).map(id => this.store.getItemById(show.id, id)).filter(Boolean);
        const jewelleryItems = (assignment.jewelleryIds || []).map(id => this.store.getItemById(show.id, id)).filter(Boolean);
        const footwearItem = assignment.footwearId ? this.store.getItemById(show.id, assignment.footwearId) : null;

        const totalItemsCount = clothingItems.length + jewelleryItems.length + (footwearItem ? 1 : 0);

        html += `
          <div class="appearance-wardrobe-block">
            <div class="appearance-block-header">
              <div class="appearance-number">
                <span class="app-icon">✦</span>
                CATWALK APPEARANCE #${appIdx}${theme ? ` — <span class="theme-name">${this.escapeHtml(theme.toUpperCase())}</span>` : ''}
              </div>
              <div class="appearance-count-pill">${totalItemsCount} Total Items Worn</div>
            </div>

            <div class="wardrobe-categories-grid">
              <!-- Clothing Section (Up to 4) -->
              <div class="category-column clothing-col">
                <div class="cat-col-header">
                  <span class="cat-dot dot-clothing"></span>
                  <span class="cat-col-title">Clothing (${clothingItems.length}/4)</span>
                </div>
                ${clothingItems.length > 0 ? `
                  <ul class="checklist-items">
                    ${clothingItems.map((item, idx) => `
                      <li class="checklist-item">
                        <label class="check-container">
                          <input type="checkbox" class="staff-check-input" id="check_${model.id}_${appIdx}_c_${idx}">
                          <span class="custom-checkmark"></span>
                          <span class="item-name-text">${this.escapeHtml(item.name)}</span>
                        </label>
                      </li>
                    `).join('')}
                  </ul>
                ` : `<div class="no-items-placeholder">No clothing assigned</div>`}
              </div>

              <!-- Jewellery Section (Up to 4) -->
              <div class="category-column jewellery-col">
                <div class="cat-col-header">
                  <span class="cat-dot dot-jewellery"></span>
                  <span class="cat-col-title">Jewellery (${jewelleryItems.length}/4)</span>
                </div>
                ${jewelleryItems.length > 0 ? `
                  <ul class="checklist-items">
                    ${jewelleryItems.map((item, idx) => `
                      <li class="checklist-item">
                        <label class="check-container">
                          <input type="checkbox" class="staff-check-input" id="check_${model.id}_${appIdx}_j_${idx}">
                          <span class="custom-checkmark"></span>
                          <span class="item-name-text">${this.escapeHtml(item.name)}</span>
                        </label>
                      </li>
                    `).join('')}
                  </ul>
                ` : `<div class="no-items-placeholder">No jewellery assigned</div>`}
              </div>

              <!-- Footwear Section (1 item) -->
              <div class="category-column footwear-col">
                <div class="cat-col-header">
                  <span class="cat-dot dot-footwear"></span>
                  <span class="cat-col-title">Footwear (${footwearItem ? '1/1' : '0/1'})</span>
                </div>
                ${footwearItem ? `
                  <ul class="checklist-items">
                    <li class="checklist-item">
                      <label class="check-container">
                        <input type="checkbox" class="staff-check-input" id="check_${model.id}_${appIdx}_f">
                        <span class="custom-checkmark"></span>
                        <span class="item-name-text bold-text">${this.escapeHtml(footwearItem.name)}</span>
                      </label>
                    </li>
                  </ul>
                ` : `<div class="no-items-placeholder">No footwear assigned</div>`}
              </div>
            </div>
          </div>
        `;
      }

      html += `
          </div>
        </article>
      `;
    });

    html += `
        </div>
        <footer class="report-footer">
          <p>Confidential Backstage Document // ${this.escapeHtml(show.name)} // Generated on ${this.formatUKDate(new Date())}</p>
        </footer>
      </div>
    `;

    return html;
  }

  // ==========================================
  // REPORT 2: Customer Runway Programme & Price Lookbook
  // (By Catwalk Appearance, showing model, items & retail price)
  // ==========================================
  generateCustomerReportHTML(showId = null, filterAppearance = 'all') {
    const show = showId ? this.store.data.shows.find(s => s.id === showId) : this.store.getActiveShow();
    if (!show) return '<div class="empty-state">No fashion show selected.</div>';

    const models = this.store.getModels(show.id);
    const currency = show.currency || '£';
    const totalAppearances = show.catwalkAppearances;

    if (models.length === 0) {
      return `
        <div class="empty-state">
          <p class="empty-title">No Models Configured</p>
          <p class="empty-desc">Add models to generate the Customer Runway Programme.</p>
        </div>
      `;
    }

    const appIndices = [];
    if (filterAppearance === 'all') {
      for (let i = 1; i <= totalAppearances; i++) appIndices.push(i);
    } else {
      const parsed = parseInt(filterAppearance, 10);
      if (parsed >= 1 && parsed <= totalAppearances) {
        appIndices.push(parsed);
      } else {
        for (let i = 1; i <= totalAppearances; i++) appIndices.push(i);
      }
    }

    let html = `
      <div class="report-document customer-report-theme" id="printable-customer-report">
        <!-- Luxury Lookbook Cover / Header -->
        <header class="lookbook-cover-header">
          <div class="editorial-branding">
            <div class="report-logo-wrapper center-logo">
              <img src="https://heidiboutique.co.uk/cdn/shop/files/heidi_boutique_logo_1000px.png" alt="Heidi Boutique Logo" class="report-logo-img">
            </div>
            <span class="collection-season">${this.escapeHtml(show.season.toUpperCase())} ${show.year} COLLECTION</span>
            <h1 class="lookbook-title">${this.escapeHtml(show.name)}</h1>
            <p class="lookbook-subtitle">Official Runway Programme & Retail Client Catalogue</p>
          </div>
          <div class="lookbook-details-bar">
            <span><strong>Date:</strong> ${this.escapeHtml(this.formatUKDate(show.date))}</span>
            <span>•</span>
            <span><strong>Location:</strong> ${this.escapeHtml(show.venue || 'Runway Hall')}</span>
          </div>
        </header>

        <div class="appearances-container">
    `;

    appIndices.forEach(appIdx => {
      const theme = this.store.getAppearanceTheme(show.id, appIdx);

      let modelsRowsHtml = '';

      models.forEach(model => {
        const assignment = this.store.getAssignment(show.id, model.id, appIdx);
        const clothingItems = (assignment.clothingIds || []).map(id => this.store.getItemById(show.id, id)).filter(Boolean);
        const jewelleryItems = (assignment.jewelleryIds || []).map(id => this.store.getItemById(show.id, id)).filter(Boolean);
        const footwearItem = assignment.footwearId ? this.store.getItemById(show.id, assignment.footwearId) : null;

        let modelLookTotal = 0;
        let modelPiecesCount = 0;

        const allItemsList = [];

        clothingItems.forEach(item => {
          allItemsList.push({ category: 'Clothing', ...item });
          modelLookTotal += item.price;
          modelPiecesCount++;
        });

        jewelleryItems.forEach(item => {
          allItemsList.push({ category: 'Jewellery', ...item });
          modelLookTotal += item.price;
          modelPiecesCount++;
        });

        if (footwearItem) {
          allItemsList.push({ category: 'Footwear', ...footwearItem });
          modelLookTotal += footwearItem.price;
          modelPiecesCount++;
        }

        modelsRowsHtml += `
          <div class="customer-model-entry">
            <div class="model-entry-header">
              <div class="model-lead">
                <h3 class="model-heading">${this.escapeHtml(model.firstName)}</h3>
              </div>
              <div class="model-look-total">
                <span class="total-label">Look Total:</span>
                <span class="total-val">${this.formatPrice(modelLookTotal, currency)}</span>
              </div>
            </div>

            ${allItemsList.length > 0 ? `
              <table class="lookbook-items-table">
                <thead>
                  <tr>
                    <th class="col-item">Item & Description</th>
                    <th class="col-price">Retail Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${allItemsList.map(item => `
                    <tr>
                      <td class="col-item">${this.escapeHtml(item.name)}</td>
                      <td class="col-price">${this.formatPrice(item.price, currency)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : `
              <div class="lookbook-empty-row">No items designated for this appearance.</div>
            `}
          </div>
        `;
      });

      html += `
        <section class="catwalk-appearance-section print-page-break">
          <div class="appearance-section-banner">
            <div class="banner-title-area">
              <h2 class="appearance-title">${this.escapeHtml(theme || '')}</h2>
            </div>
          </div>

          <div class="models-sequence-list">
            ${modelsRowsHtml}
          </div>
        </section>
      `;
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  printReport(reportType) {
    const reportTitle = reportType === 'staff'
      ? 'Staff_Wardrobe_Checklist'
      : 'Customer_Runway_Lookbook';

    const oldTitle = document.title;
    document.title = `${reportTitle}_${Date.now()}`;

    // Mark body class for targeted print stylesheet
    document.body.classList.remove('printing-staff', 'printing-customer');
    if (reportType === 'staff') {
      document.body.classList.add('printing-staff');
    } else {
      document.body.classList.add('printing-customer');
    }

    window.print();

    // Clean up
    setTimeout(() => {
      document.body.classList.remove('printing-staff', 'printing-customer');
      document.title = oldTitle;
    }, 1000);
  }
}

window.fashionReportsEngine = new FashionReportsEngine(window.fashionStore);
