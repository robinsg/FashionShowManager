# Heidi Boutique // Fashion Show Runway & Wardrobe Manager

A comprehensive, lightweight web application designed for fashion show organisers to manage models, wardrobe collections, jewellery, footwear, retail pricing, and catwalk appearances for bi-annual runway events.

Built with clean HTML5, vanilla JavaScript, and modern CSS — requiring zero external installations, build steps, or frameworks.

---

## Table of Contents

1. [Overview & Key Features](#overview--key-features)
2. [Fashion Show Rules & Specifications](#fashion-show-rules--specifications)
3. [Quick Start & Launching the Application](#quick-start--launching-the-application)
4. [Step-by-Step Usage Guide](#step-by-step-usage-guide)
   - [1. Fashion Show Setup & Overview](#1-fashion-show-setup--overview)
   - [2. Managing the Models Roster](#2-managing-the-models-roster)
   - [3. Wardrobe & Retail Price Catalogue](#3-wardrobe--retail-price-catalogue)
   - [4. Catwalk Outfits Styling Matrix](#4-catwalk-outfits-styling-matrix)
   - [5. Backstage Staff Wardrobe Report](#5-backstage-staff-wardrobe-report)
   - [6. Customer Runway Programme & Lookbook](#6-customer-runway-programme--lookbook)
5. [Printing Reports (A4 Page-Break Optimised)](#printing-reports-a4-page-break-optimised)
6. [Data Storage, Export & Backup](#data-storage-export--backup)
7. [Project Directory Structure](#project-directory-structure)
8. [Technical Architecture & LXC Deployment Guide](#technical-architecture--lxc-deployment-guide)

---

## Overview & Key Features

Heidi Boutique hosts runway fashion shows twice per year (such as Spring/Summer and Autumn/Winter collections). This system provides end-to-end event organisation:

- **Multi-Show Event Management**: Create, store, switch between, and duplicate current and future fashion show events.
- **Strict Walk Sequence Enforcement**: Models follow a fixed walk order (#1 to #5) that repeats identically across every catwalk appearance.
- **Strict Wardrobe Limit Rules**: Enforces category caps of up to 4 items of clothing, 4 items of jewellery, and exactly 1 footwear item per appearance.
- **Non-Unique Reusable Wardrobe Items**: Garments, jewellery pieces, and shoes can be worn across multiple appearances and by different models.
- **Live Inline Retail Price Updates**: Modify prices directly in the catalogue table with instant re-calculation across look totals and reports.
- **Dedicated Printable Reports**:
  1. **Backstage Staff Wardrobe Report**: Organised by model, featuring item checklists and dresser notes for backstage helpers.
- **SQLite Persistence & Automatic Migration**: Robust SQLite database persistence (`fashion_show.db`) with automatic one-time migration from legacy browser `localStorage`, ensuring browser storage is completely retired for fashion show data.

---

## Fashion Show Rules & Specifications

| Rule / Parameter | System Enforcement |
| :--- | :--- |
| **Event Frequency** | Bi-annual shows supported with dedicated seasonal profiles (**Autumn / Winter**, **Pre-Autumn**, **Autumn**, **Spring / Summer**, **Resort / Cruise**). |
| **Model Capacity** | Up to **5 models** per fashion show event. Models are identified by their first name and have dedicated backstage dressing notes. |
| **Walk Order Sequence** | Models appear on the catwalk in the exact same designated sequence for each appearance (e.g. Model 1 $\rightarrow$ Model 2 $\rightarrow$ Model 3 $\rightarrow$ Model 4 $\rightarrow$ Model 5). Order can be adjusted via 1-click controls. |
| **Catwalk Appearances** | Each model can walk the catwalk **up to 5 times** per show (configurable between 1 and 5 appearances). |
| **Wardrobe per Appearance** | Enforced limits per catwalk appearance:<br>• Up to **4 items of clothing**<br>• Up to **4 items of jewellery**<br>• Up to **1 item of footwear** |
| **Wardrobe Reusability** | Items of clothing, jewellery, and footwear are not restricted to one model or one appearance; any piece can be styled across multiple looks. |
| **Retail Pricing & Currency** | Each wardrobe item carries a retail price (defaulting to GBP `£`), with support for custom currency symbols. |

---

## Quick Start & Launching the Application

### Option A: Using the Local Node.js Server (Recommended)

1. Open PowerShell or Terminal in the project directory:
   ```powershell
   cd c:\Users\robin\.gemini\antigravity-ide\scratch\fashion-show-manager
   ```
2. Start the built-in HTTP server:
   ```powershell
   node server.js
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Option B: Direct Browser Opening

Double-click `index.html` or open it directly in Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari:
```
file:///c:/Users/robin/.gemini/antigravity-ide/scratch/fashion-show-manager/index.html
```

### Option C: Containerised Production Deployment (Debian 12 LXC)

For production deployment inside a Linux Container (LXC) on Debian 12 (Bookworm) with Nginx or systemd, refer to the dedicated [Technical Architecture & LXC Deployment Guide (TECHNICAL.md)](TECHNICAL.md).

---

## Step-by-Step Usage Guide

### 1. Fashion Show Setup & Overview
- **Active Show Selector**: Use the top-bar dropdown (`SHOW:`) to switch between shows (e.g. *Lumière SS26* or *Noir AW26*).
- **Create a New Show**: Click **+ New Show** in the top header. Specify the show title, season (**Autumn / Winter**, **Pre-Autumn**, **Autumn**, **Spring / Summer**, **Resort**), event date, venue, currency symbol, and number of catwalk appearances (1–5).
- **Manage Shows Directory**: Click **Manage Shows** to duplicate an existing show baseline or delete completed archives.
- **Walk Order Strip**: View the sequential catwalk walk order flowchart on the Overview tab.

### 2. Managing the Models Roster
- Click the **👥 Models Roster** tab.
- Click **+ Add Model** to register a new model (first name required, optional backstage notes like shoe sizing or quick hair adjustments).
- **Reordering Walk Sequence**: Click the `↑` and `↓` arrow buttons on any model card to alter their walk position. The new order instantly updates the catwalk running order across all grids and reports.
- **5-Model Limit**: Once 5 models are configured, the **+ Add Model** button is disabled to guarantee compliance with the show limit.

### 3. Wardrobe & Retail Price Catalogue
- Click the **👗 Wardrobe Catalogue** tab.
- **Add Items**: Click **+ Add New Item**, enter the name, choose the category (**Clothing**, **Jewellery**, or **Footwear**), and set the retail price.
- **Live Price Updates**: Click directly on any price input field in the table and type the revised price. The new price updates immediately across all reports and valuation metrics.
- **Sorting (Category, Name, Price)**:
  - **Sort by Dropdown**: Select options like *Category (A → Z / Z → A)*, *Item Name (A → Z / Z → A)*, or *Retail Price (Low → High / High → Low)* from the **Sort by** dropdown.
  - **Click-to-Sort Table Headers**: Click directly on the **Category**, **Item Name**, or **Retail Price** table column headers to toggle ascending (`▲`) and descending (`▼`) order on the fly.
- **Filter & Search**: Use the category buttons (**All Categories**, **Clothing**, **Jewellery**, **Footwear**) and the search bar to locate specific pieces.

### 4. Catwalk Outfits Styling Matrix
- Click the **👠 Catwalk Outfits Grid** tab.
- **Switch Views**: Choose between:
  - **Group by Model**: View each model's outfit progression across Appearance 1 through 5.
  - **Group by Catwalk Run Order**: Inspect the runway sequence for Appearance #1, Appearance #2, etc.
- **Styling an Outfit**:
  1. Click **✎ Edit Outfit** on any appearance slot.
  2. The interactive **Outfit Builder** modal opens.
  3. Select up to 4 clothing items (checkboxes automatically disable when 4 are selected).
  4. Select up to 4 jewellery items (checkboxes automatically disable when 4 are selected).
  5. Select 1 footwear item (radio selection guarantees only 1 pair is worn).
  6. *Optional*: Use the **Clone Outfit** bar to copy a look from a previous catwalk appearance.
  7. Click **Done Styling** when complete.

### 5. Backstage Staff Wardrobe Report
- Click the **📋 Staff Wardrobe Report** tab.
- Designed specifically for dressing assistants and backstage coordinators.
- Displays each model in walk sequence order with their dresser notes and appearance-by-appearance breakdown.
- Each look contains an interactive checklist for clothing, jewellery, and footwear so dressers can verify items before the model walks the catwalk.
- Use the **Filter by Model** dropdown to display all models or isolate a single model.
- Click **🖨 Print Staff Report** to print physical dressing sheets.

### 6. Customer Runway Programme & Lookbook
- Click the **🏷️ Customer Lookbook** tab.
- Designed for attendees, VIP clients, and retail buyers.
- Organised by **Catwalk Appearance**, presenting models in strict walk order (`#1` to `#5`).
- Displays category badges, item descriptions, and individual retail prices.
- Automatically calculates:
  - Individual **Look Totals**
  - Catwalk **Sequence Valuations**
  - **Grand Catalogue Valuation** and total pieces modelled.
- Click **🖨 Print Customer Lookbook** to generate a clean client programme.

---

## Printing Reports (A4 Page-Break Optimised)

The application includes dedicated print styling ([css/print.css](css/print.css)):

1. Open either the **Staff Wardrobe Report** tab or the **Customer Lookbook** tab.
2. Click the corresponding **🖨 Print** button.
3. Your browser's print dialogue will open with pre-configured settings:
   - All navigation tabs, top bars, buttons, and edit chrome are hidden.
   - Clean black-and-white high-contrast text and crisp borders.
   - **Staff Report**: Includes automatic page breaks between each model's dossier (`page-break-after: always`), giving each model their own individual physical A4 sheet.
   - **Customer Lookbook**: Clean editorial table layout with sequence banners and grand valuation summary cards.

> **Tip**: In the browser print dialog, set *Destination* to "Save as PDF" to generate electronic PDF programmes or checklists to email to the organisers.

---

## Data Storage, SQLite Persistence & Migration

- **SQLite Database Persistence**: All fashion shows, models, wardrobe catalogues, and outfit assignments are stored in a local SQLite relational database (`fashion_show.db`) using native `node:sqlite` (Node.js 22+).
- **Automatic LocalStorage Migration**: On startup, the application automatically checks for legacy browser `localStorage` data (`fashion_show_manager_data_v2` and `v1`). If detected, it migrates all records into SQLite via `/api/migrate`, permanently purges the keys from `localStorage`, and displays a confirmation toast.
- **LocalStorage Retired**: Browser `localStorage` is **strictly no longer used** for storing fashion show data, ensuring that all data persists reliably across browsers and devices.
- **CLI Migration Utility**: Inspect or restore datasets via terminal:
  ```powershell
  node migrate.js                 # Display current SQLite database summary
  node migrate.js backup.json     # Migrate a JSON backup directly into SQLite
  node migrate.js --reset         # Reset SQLite to default initial luxury dataset
  ```
- **Exporting & Importing Backups**: Click **⬇ Export** in the top bar to save all shows and outfits to a `.json` backup file, or click **⬆ Import** to restore files directly into SQLite.

---

## Project Directory Structure

```text
fashion-show-manager/
├── .gitignore          # Git exclusion rules for OS, editors, logs, and SQLite .db files
├── package.json        # NPM project scripts (start, migrate, test)
├── index.html          # Main application interface and modal structures
├── server.js           # Node.js HTTP server with SQLite REST API & static file delivery
├── db.js               # SQLite persistence layer, relational schema, and migration logic
├── migrate.js          # CLI migration & database inspection utility
├── test.js             # Automated integration and CRUD test suite
├── README.md           # Application documentation and user manual
├── TECHNICAL.md        # Technical architecture & Debian 12 LXC deployment guide
├── css/
│   ├── main.css        # Rich luxury styling, dark glassmorphism, responsive grid, DB status pill
│   └── print.css       # Dedicated A4 print media stylesheet with clean page-breaks
└── js/
    ├── store.js        # Multi-show state manager with SQLite API sync & localStorage migration
    ├── reports.js      # HTML report generation engines (Staff Checklist & Customer Lookbook)
    └── app.js          # Interactive controllers, modal builders, inline price editing
```

---

## Technical Architecture & LXC Deployment Guide

For enterprise hosting, production infrastructure setup, and containerised deployment, see the comprehensive [TECHNICAL.md](TECHNICAL.md) guide.

Key topics covered:
- **Debian 12 LXC Container Provisioning**: Proxmox VE (`pct create`), Incus, and LXD setup with unprivileged container profiles.
- **Nginx Web Server Deployment**: High-concurrency static caching, Gzip compression, and security headers.
- **Node.js systemd Service Daemon**: Running `server.js` as an auto-restarting background systemd service.
- **TLS/SSL Encryption**: Automated Let's Encrypt / Certbot certificates.
- **Hardening & Maintenance**: UFW firewall rules, unattended upgrades, and backup strategies.

---

## Technical Specifications & Compatibility

- **Language / Standards**: HTML5, ECMAScript 2020 (Vanilla JavaScript), CSS3.
- **UK English**: Strictly standard UK English spelling (`jewellery`, `programme`, `catalogue`, `enquiries`, `modelled`, `trousers`), UK date formats (`18 May 2026` / `DD/MM/YYYY`), and British fashion seasons (`Autumn / Winter`, `Pre-Autumn`, `Autumn`).
- **Browser Compatibility**: Google Chrome, Microsoft Edge, Mozilla Firefox, Apple Safari (desktop and mobile/tablet).
- **Dependencies**: 100% self-contained with zero third-party npm packages, CDNs, or external script requirements.

