# Epos Now REST API Integration & Wardrobe Catalogue Architectural Report
## Heidi Boutique // Fashion Show Runway & Wardrobe Manager

This document provides a comprehensive technical investigation, architectural analysis, and implementation roadmap for linking the Heidi Boutique Fashion Show Manager with the **Epos Now REST API**.

The goal of this integration is to enable fashion show organisers to seamlessly search, select, and import stock items directly from Epos Now into a specific fashion show's wardrobe catalogue, whilst preserving manual item entry and ensuring reliability during live runway events.

---

## Executive Summary

Heidi Boutique currently utilizes Epos Now as its electronic point-of-sale (EPOS) platform for retail management and inventory tracking. The Fashion Show Manager requires a flexible mechanism to pull stock items from Epos Now to build the wardrobe catalogue for bi-annual runway events.

### Key Architectural Recommendations:
1. **Authentication Method**: Utilize Epos Now REST API v4 using standard Basic Authentication (Base64-encoded `API Key:API Secret`) over HTTPS or OAuth 2.0 Bearer tokens for multi-tenant AppStore installations.
2. **Data Storage & Sync Strategy**: Implement a **Local Relational Snapshot with Manual & Background Sync** strategy inside the existing SQLite database (`fashion_show.db`).
   - *Why Snapshot?* Runway events require 100% offline resilience and zero dependency on venue internet stability or external API latency during fast-paced catwalk changes.
   - *Synchronization*: Store the Epos Now Product ID (`eposNowProductId`) on imported items to allow on-demand retail price refreshes and stock availability checks.
3. **Category Mapping Workflow**: Allow users to search and select Epos Now stock items via an interactive modal ("Import from Epos Now"), with **manual category assignment** (Clothing, Jewellery, Footwear) during selection, as POS categories often differ from runway styling categories.
4. **Backend Security Proxy**: Route all Epos Now API calls through a server-side proxy endpoint in `server.js` (`/api/epos/...`) to prevent exposure of sensitive Epos Now API credentials to the client browser.

---

## Table of Contents

1. [Epos Now REST API Overview & Specifications](#1-epos-now-rest-api-overview--specifications)
2. [Authentication Mechanisms](#2-authentication-mechanisms)
3. [Proposed UI/UX Workflow: Import from Epos Now](#3-proposed-uiux-workflow-import-from-epos-now)
4. [Data Architecture & Sync Strategy Analysis](#4-data-architecture--sync-strategy-analysis)
5. [Data Schema & Field Mapping](#5-data-schema--field-mapping)
6. [API Endpoint Reference & Data Payload Examples](#6-api-endpoint-reference--data-payload-examples)
7. [Error Handling, Rate Limiting & Resilience](#7-error-handling-rate-limiting--resilience)
8. [Step-by-Step Technical Implementation Roadmap](#8-step-by-step-technical-implementation-roadmap)

---

## 1. Epos Now REST API Overview & Specifications

Epos Now provides a RESTful web API (v4) that exposes endpoints for managing products, stock levels, categories, barcodes, orders, and customer data.

- **Base URL**: `https://api.eposnowhq.com/api/v4/`
- **Data Format**: JSON (`application/json`)
- **Protocol**: HTTPS (TLS 1.2+ mandatory)
- **Primary Product Endpoints**:
  - `GET /api/v4/Product`: Retrieve paginated product lists with filtering.
  - `GET /api/v4/Product/{id}`: Retrieve detailed specifications for a specific product item.
  - `GET /api/v4/Category`: Retrieve POS category taxonomy.
  - `GET /api/v4/Stock`: Retrieve real-time location stock levels.

---

## 2. Authentication Mechanisms

Epos Now supports two primary modes of authentication depending on how the application connects to the user's account.

### 2.1 Direct API Key & Secret Authentication (Recommended for Heidi Boutique Private Integration)

For single-business private integrations, Epos Now provides an API Key and API Secret through the Epos Now Back Office portal (under *AppStore -> API Access*).

#### Authentication Details:
- **Header Name**: `Authorization`
- **Header Format**: `Basic <Base64_Encoded_Credentials>`
- **Value Calculation**: `Base64(API_KEY:API_SECRET)`

#### Request Example (cURL / HTTP):
```http
GET /api/v4/Product?page=1&limit=25 HTTP/1.1
Host: api.eposnowhq.com
Authorization: Basic dXNlcl9hcGlfa2V5OmFwaV9zZWNyZXRfdmFsdWU=
Content-Type: application/json
Accept: application/json
```

### 2.2 OAuth 2.0 Bearer Token Authentication (For Epos Now AppStore Deployment)

If the Fashion Show Manager is deployed as a public app or multi-location app in the Epos Now AppStore, OAuth 2.0 Authorization Code grant is required.

1. **Authorization Code Request**: Direct user to `https://api.eposnowhq.com/oauth/authorize?client_id={CLIENT_ID}&response_type=code&redirect_uri={REDIRECT_URI}`.
2. **Token Exchange**: Exchange the code for an Access Token via `POST https://api.eposnowhq.com/oauth/token`.
3. **Bearer Authorization Header**:
   ```http
   Authorization: Bearer <ACCESS_TOKEN>
   ```

### 2.3 Credential Storage & Security Practices

- **Never expose credentials to client browsers**: Storing Epos Now API keys in frontend JavaScript (`app.js` or `store.js`) poses a major security risk.
- **Server-side Storage**: Store credentials in environment variables or an encrypted configuration setting in SQLite / system environment:
  ```env
  EPOS_NOW_API_KEY=your_api_key_here
  EPOS_NOW_API_SECRET=your_api_secret_here
  EPOS_NOW_BASE_URL=https://api.eposnowhq.com/api/v4
  ```
- **Backend API Proxy**: All requests from the browser frontend to Epos Now should be proxied via Node.js backend routes (e.g. `GET /api/epos/products?search=dress`).

---

## 3. Proposed UI/UX Workflow: Import from Epos Now

To ensure a smooth user experience that respects both existing manual entry and new automated imports, the interface will integrate seamlessly into the **👗 Wardrobe Catalogue** tab.

```
+-----------------------------------------------------------------------------------+
|  👗 WARDROBE CATALOGUE // LUMIÈRE SS26                                            |
|                                                                                   |
|  [ + Add Manual Item ]   [ 🔄 Import from Epos Now ]   [ 🔄 Sync Retail Prices ]  |
|                                                                                   |
|  Filter by Category: [ All ] [ Clothing ] [ Jewellery ] [ Footwear ]              |
|  Search Catalogue:  [ Search items...                         ]                   |
+-----------------------------------------------------------------------------------+
```

### 3.1 Step-by-Step User Journey

1. **Initiate Import**: On the **Wardrobe Catalogue** tab, the user clicks the new button **🔄 Import from Epos Now**.
2. **Search & Browse Modal Opens**:
   - The interactive modal connects via server proxy to `GET /api/epos/products`.
   - Displays a live search bar (with debounced input) allowing search by Product Name, SKU, or Barcode.
   - Shows POS Category filters fetched from `GET /api/epos/categories`.
3. **Select & Assign Categories**:
   - Each Epos Now product result card displays:
     - **Product Name** & **SKU / Barcode**
     - **Current Epos Now Retail Price** (inc. VAT)
     - **Current POS Stock Level**
   - Beside each product row, a mandatory category selector dropdown is presented:
     - Options: `Clothing` | `Jewellery` | `Footwear`
   - Checkboxes allow multi-item selection.
4. **Confirm Import**:
   - The user selects one or more stock items, chooses their runway category, and clicks **Import Selected Items to Show**.
   - The backend creates wardrobe item records in the show dataset inside SQLite, storing `eposNowProductId`, `name`, `category`, `price`, and generating a clean `itemId`.
   - Toast notification appears: *"Successfully imported 4 items from Epos Now."*
5. **Manual Adjustments & Coexistence**:
   - Imported items immediately populate the Wardrobe Catalogue table alongside manually added items.
   - An "Epos Now Linked" badge (`[EPOS]`) appears next to imported items.
   - Prices can still be modified inline or refreshed on-demand from Epos Now.

---

## 4. Data Architecture & Sync Strategy Analysis

A key requirement is determining how data from Epos Now should be stored or synchronized with the Fashion Show Manager. We evaluated three architectural patterns:

| Strategy | Architecture | Offline Resilience | Price & Stock Accuracy | Pros | Cons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Option A: Live REST Proxying** | No local storage; query Epos Now API on every page view. | ❌ Zero (Fails if internet drops at runway) | 🟢 100% Real-time | Always current POS prices. | High latency, rate limit risks, complete failure if offline. |
| **Option B: Local Snapshot with Manual & Background Sync (Recommended)** | Copy imported items into SQLite with `eposNowProductId`. | 🟢 100% Standalone & Reliable | 🟡 Real-time on import; updated via Sync button | Instant page loads, fully functional offline backstage, zero API delays. | Retail prices only update when manually or scheduled synced. |
| **Option C: Real-Time Webhook Push Sync** | Local SQLite storage updated via Epos Now Webhooks. | 🟢 High | 🟢 Real-time | Event-driven instant updates. | Requires public HTTP endpoint / webhook receiver setup. |

### Architectural Recommendation: Option B (Local Relational Snapshot with Sync)

For fashion show runway operations, **Option B** is strongly recommended for the following reasons:
1. **Catwalk Reliability**: Fashion shows take place in venues (ballrooms, marquees, halls) where internet connectivity can be unreliable. Having all items stored locally in SQLite guarantees the Backstage Staff Report, Outfit Builder, and Customer Lookbook function flawlessly offline.
2. **Performance**: Rendering outfit grids and price summaries from local SQLite takes < 5 ms, whereas querying an external REST API takes hundreds of milliseconds.
3. **Control**: Event organisers can lock prices for a specific show lookbook, ensuring retail prices don't unexpectedly fluctuate mid-event, whilst having a 1-click **"🔄 Sync Prices from Epos Now"** button to update when desired.

---

## 5. Data Schema & Field Mapping

To support Epos Now linking, the SQLite schema (`items` table in `db.js`) and store state require minor additive enhancements.

### 5.1 Field Mapping Table

| Epos Now Field (`Product`) | Heidi Boutique Wardrobe Field (`items`) | Type / Transformation | Notes |
| :--- | :--- | :--- | :--- |
| `Id` | `epos_now_product_id` | `INTEGER` / `TEXT` | Links item to Epos Now stock record. `NULL` for manual items. |
| `Name` | `name` | `TEXT` | Primary item display title. |
| `SalePriceIncTax` (or `SalePrice`) | `price` | `REAL` | Converted to float, rounded to 2 decimal places. |
| N/A (User Selection) | `category` | `TEXT` (`clothing` \| `jewellery` \| `footwear`) | Manually selected in import modal. |
| Derived from Name/Price | `item_id` | `TEXT` | Unique human-readable code (e.g. `silkor950`). |
| `Sku` / `Barcode` | `sku` | `TEXT` | Optional barcode/SKU reference for inventory checks. |

### 5.2 Updated SQLite `items` Table Schema

```sql
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  show_id TEXT NOT NULL,
  item_id TEXT,
  epos_now_product_id INTEGER,  -- Links to Epos Now Product.Id
  sku TEXT,                     -- Epos Now SKU / Barcode
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  last_synced_at TEXT,          -- ISO Timestamp of last Epos Now price sync
  FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE
);
```

---

## 6. API Endpoint Reference & Data Payload Examples

### 6.1 Server Proxy Endpoints (Node.js Backend `server.js`)

To keep API keys secure, the Node.js server proxies requests to Epos Now:

#### 1. Search Epos Now Products
- **Endpoint**: `GET /api/epos/products?search={query}&page={page}&limit={limit}`
- **Proxy Target**: `https://api.eposnowhq.com/api/v4/Product`
- **Response Payload**:
```json
{
  "products": [
    {
      "eposNowProductId": 10482,
      "name": "Silk Organza Trench Coat",
      "sku": "SKU-SS26-001",
      "barcode": "5060123456789",
      "price": 950.00,
      "costPrice": 420.00,
      "posCategoryName": "Coats & Jackets",
      "currentStock": 8
    },
    {
      "eposNowProductId": 10483,
      "name": "18k Gold Pavé Choker",
      "sku": "SKU-JW-088",
      "barcode": "5060123456790",
      "price": 1100.00,
      "costPrice": 510.00,
      "posCategoryName": "Fine Jewellery",
      "currentStock": 3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "totalCount": 142
  }
}
```

#### 2. Import Items to Active Show
- **Endpoint**: `POST /api/shows/:showId/import-epos`
- **Request Body**:
```json
{
  "items": [
    {
      "eposNowProductId": 10482,
      "name": "Silk Organza Trench Coat",
      "category": "clothing",
      "price": 950.00,
      "sku": "SKU-SS26-001"
    },
    {
      "eposNowProductId": 10483,
      "name": "18k Gold Pavé Choker",
      "category": "jewellery",
      "price": 1100.00,
      "sku": "SKU-JW-088"
    }
  ]
}
```

#### 3. Sync Prices for Show Items
- **Endpoint**: `POST /api/shows/:showId/sync-epos-prices`
- **Function**: Queries `GET /api/v4/Product/{id}` for all items in the show with a non-null `epos_now_product_id` and updates their `price` in SQLite if changed.

---

## 7. Error Handling, Rate Limiting & Resilience

### 7.1 Epos Now Rate Limits
- Epos Now imposes standard API rate limits (typically **10 requests per second** per API key).
- **Mitigation**:
  - Implement request debouncing (300ms) on frontend search inputs.
  - For batch price syncing (`/sync-epos-prices`), bundle product IDs or fetch via paginated `/Product` endpoints rather than making individual requests per item.

### 7.2 Connection Failures & Graceful Degradation
- If Epos Now API is unreachable (e.g., venue offline or API service maintenance):
  - Frontend displays an informational message: *"Epos Now connection currently unavailable. You can continue adding items manually or retry sync when online."*
  - All existing show data remains 100% accessible and editable locally.

---

## 8. Step-by-Step Technical Implementation Roadmap

Should implementation be authorized in future phases, the work can be executed in 4 logical stages:

### Phase 1: Environment & Server Proxy (`server.js` & `db.js`)
- Add Epos Now configuration parameters (`EPOS_NOW_API_KEY`, `EPOS_NOW_API_SECRET`).
- Extend SQLite schema in `db.js` to support `epos_now_product_id`, `sku`, and `last_synced_at`.
- Implement backend proxy handler in `server.js` (`/api/epos/products`, `/api/shows/:id/import-epos`, `/api/shows/:id/sync-epos-prices`).

### Phase 2: Import Modal UI Component (`index.html` & `app.js`)
- Create HTML modal structure `#eposImportModal` with search controls, category mapping dropdowns, and batch select checkboxes.
- Add JS controller logic to handle API fetching, pagination, and category selection.

### Phase 3: Wardrobe Catalogue Enhancement
- Add **"🔄 Import from Epos Now"** and **"🔄 Sync Prices"** buttons to the Wardrobe Catalogue header.
- Add Epos Now link indicators (`[EPOS]`) to item rows in the wardrobe table.
- Implement price synchronization logic in `store.js`.

### Phase 4: Integration Testing & Verification
- Test manual vs Epos Now item co-existence.
- Test offline resilience and price sync routines.
- Run `npm test` suite to confirm zero regressions across walk order, outfit limits, and report engines.

---

*Report compiled for Heidi Boutique Management.*
