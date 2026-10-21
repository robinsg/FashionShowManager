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
    const num = Number(amount);
    if (num === 0) return '';
    return `${currency}${num.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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

    const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
    const logoSrc = isDark ? 'assets/images/heidi-logo_360x-inverted.png' : 'assets/images/heidi-logo_360x-removebg.png';

    let html = `
      <div class="report-document staff-report-theme" id="printable-staff-report">
        <!-- Print Header -->
        <header class="report-header">
          <div class="report-header-top">
            <div class="report-brand">
                <h1 class="report-title">${this.escapeHtml(show.name)}</h1>
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

        // Combine items in order: Clothing -> Jewellery -> Footwear
        const combinedItems = [
          ...clothingItems,
          ...jewelleryItems,
          ...(footwearItem ? [footwearItem] : [])
        ];

        html += `
          <div class="appearance-wardrobe-block">
            <div class="appearance-block-header">
              <div class="appearance-number">
                CATWALK APPEARANCE #${appIdx}${theme ? ` — <span class="theme-name">${this.escapeHtml(theme.toUpperCase())}</span>` : ''}
              </div>
              <div class="appearance-count-pill">${combinedItems.length} Total Items Worn</div>
            </div>

            ${combinedItems.length > 0 ? `
              <table class="staff-items-table">
                <tbody>
                  ${combinedItems.map(item => `
                    <tr>
                      <td class="staff-item-name">${this.escapeHtml(item.name)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : `
              <div class="no-items-placeholder">No items assigned</div>
            `}
          </div>
        `;
      }


      html += `
          </div>
        </article>
      `;
    }); //

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

    const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
    const logoSrc = isDark ? 'assets/images/heidi-logo_360x-inverted.png' : 'assets/images/heidi-logo_360x-removebg.png';

    let html = `
      <div class="report-document customer-report-theme" id="printable-customer-report">
        <!-- Luxury Lookbook Cover / Header -->
        <header class="lookbook-cover-header">
          <div class="editorial-branding">
            <div class="report-logo-wrapper left-logo">
              <img src="${logoSrc}" alt="Heidi Boutique Logo" class="report-logo-img">
            </div>
            <h1 class="lookbook-title">${this.escapeHtml(show.name)}</h1>
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

    // Ensure logos switch to light-background logo for printing
    const reportLogos = document.querySelectorAll('.report-logo-img');
    const prevSrcs = [];
    reportLogos.forEach((img, i) => {
      prevSrcs[i] = img.src;
      img.src = 'assets/images/heidi-logo_360x-removebg.png';
    });

    window.print();

    // Clean up
    setTimeout(() => {
      reportLogos.forEach((img, i) => {
        if (prevSrcs[i]) img.src = prevSrcs[i];
      });
      document.body.classList.remove('printing-staff', 'printing-customer');
      document.title = oldTitle;
    }, 1000);
  }
}

window.fashionReportsEngine = new FashionReportsEngine(window.fashionStore);
