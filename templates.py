"""
Atelier Runway & Wardrobe Management System
HTML Template Rendering Engine & Views
"""

import html
from typing import Any, Dict, List, Optional


def escape(val: Any) -> str:
    if val is None:
        return ""
    return html.escape(str(val))


def render_page(
    active_show: Dict[str, Any],
    shows: List[Dict[str, Any]],
    current_tab: str,
    query_params: Dict[str, List[str]],
    toast_msg: str = "",
) -> str:
    show_options = ""
    for s in shows:
        sel = 'selected="selected"' if s["id"] == active_show["id"] else ""
        show_options += f'<option value="{escape(s["id"])}" {sel}>{escape(s["name"])} ({escape(s["season"])} {escape(s["year"])})</option>'

    toast_html = ""
    if toast_msg:
        toast_html = f"""
        <div id="toast-container">
            <div class="toast toast-info show">
                <span class="toast-icon">ℹ</span>
                <span>{escape(toast_msg)}</span>
            </div>
        </div>
        """

    tab_content = ""
    if current_tab == "overview":
        tab_content = render_overview_tab(active_show, shows, query_params)
    elif current_tab == "models":
        tab_content = render_models_tab(active_show, query_params)
    elif current_tab == "items":
        tab_content = render_items_tab(active_show, query_params)
    elif current_tab == "matrix":
        tab_content = render_matrix_tab(active_show, query_params)
    elif current_tab == "staff_report":
        tab_content = render_staff_report_tab(active_show, query_params)
    elif current_tab == "lookbook":
        tab_content = render_lookbook_tab(active_show, query_params)
    else:
        tab_content = render_overview_tab(active_show, shows, query_params)

    modal_html = render_modals(active_show, shows, query_params)

    return f"""<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{escape(active_show['name'])} — Atelier Fashion Show Manager</title>
<link rel="stylesheet" href="/css/main.css">
<link rel="stylesheet" href="/css/print.css" media="print">
<style>
    .inline-form {{ display: inline-block; margin: 0; padding: 0; }}
</style>
</head>
<body>
<div class="app-container">
    {toast_html}

    <header class="app-header">
        <div class="header-inner">
            <div class="brand-section">
                <div class="brand-title">
                    HEIDI BOUTIQUE
                    <span class="brand-badge">ATELIER</span>
                </div>
                <div class="brand-tagline">Runway & Wardrobe Manager</div>
            </div>

            <div class="header-actions">
                <div class="db-status-pill connected" title="SQLite database persistence active">
                    <span class="db-status-dot"></span> SQLite Active
                </div>

                <div class="show-picker-box">
                    <span class="show-picker-label">SHOW:</span>
                    <form action="/switch-show" method="POST" class="inline-form">
                        <select name="show_id" class="show-dropdown" onchange="this.form.submit()">
                            {show_options}
                        </select>
                    </form>
                </div>

                <div class="top-utility-buttons">
                    <a href="/?tab={current_tab}&modal=new_show" class="btn btn-primary btn-sm">+ New Show</a>
                    <a href="/?tab={current_tab}&modal=manage_shows" class="btn btn-secondary btn-sm">Manage Shows</a>
                    <a href="/export" class="btn btn-secondary btn-sm">⬇ Export</a>
                    <form action="/reset-db" method="POST" class="inline-form" onsubmit="return confirm('Reset SQLite database to default initial demonstration data?')">
                        <button type="submit" class="btn btn-danger btn-sm">🔄 Reset DB</button>
                    </form>
                </div>
            </div>
        </div>

        <div class="secondary-bar">
            <nav class="nav-tabs">
                <a href="/?tab=overview" class="nav-tab-btn {'active' if current_tab == 'overview' else ''}">📊 Overview</a>
                <a href="/?tab=models" class="nav-tab-btn {'active' if current_tab == 'models' else ''}">
                    👥 Models Roster <span class="tab-badge-highlight">{(len(active_show.get('models', []))) if active_show else 0}/5</span>
                </a>
                <a href="/?tab=items" class="nav-tab-btn {'active' if current_tab == 'items' else ''}">
                    👗 Wardrobe Catalogue <span class="tab-badge-highlight">{(len(active_show.get('items', []))) if active_show else 0}</span>
                </a>
                <a href="/?tab=matrix" class="nav-tab-btn {'active' if current_tab == 'matrix' else ''}">👠 Catwalk Outfits Grid</a>
                <a href="/?tab=staff_report" class="nav-tab-btn {'active' if current_tab == 'staff_report' else ''}">📋 Staff Wardrobe Report</a>
                <a href="/?tab=lookbook" class="nav-tab-btn {'active' if current_tab == 'lookbook' else ''}">🏷️ Customer Lookbook</a>
            </nav>
        </div>
    </header>

    <main class="main-content">
        {tab_content}
    </main>
</div>

{modal_html}
</body>
</html>
"""

def render_overview_tab(active_show: Dict[str, Any], shows: List[Dict[str, Any]], query_params: Dict[str, List[str]]) -> str:
    models = active_show.get("models", [])
    items = active_show.get("items", [])
    assignments = active_show.get("assignments", {})

    clothing_count = sum(1 for i in items if i["category"] == "clothing")
    jewellery_count = sum(1 for i in items if i["category"] == "jewellery")
    footwear_count = sum(1 for i in items if i["category"] == "footwear")
    total_value = sum(i["price"] for i in items)

    currency = escape(active_show.get("currency", "£"))

    walk_flow_cards = ""
    for idx, m in enumerate(sorted(models, key=lambda x: x["walkOrder"])):
        walk_flow_cards += f"""
        <div class="walk-order-card">
            <div class="walk-pos-circle">#{m['walkOrder']}</div>
            <div class="walk-name">{escape(m['firstName'])}</div>
            <div class="walk-badge-sm">{escape(m['notes']) if m['notes'] else 'No notes'}</div>
        </div>
        """
        if idx < len(models) - 1:
            walk_flow_cards += '<div class="walk-arrow">→</div>'

    if not walk_flow_cards:
        walk_flow_cards = '<p class="text-muted">No models added yet. Visit the Models Roster tab to add models.</p>'

    return f"""
    <div class="tab-panel active">
        <div class="view-header">
            <div class="view-title-group">
                <h2>{escape(active_show['name'])}</h2>
                <p>📍 Venue: <strong>{escape(active_show['venue'])}</strong> | 📅 Date: <strong>{escape(active_show['date'])}</strong> | 👠 Catwalk Appearances: <strong>{active_show['catwalkAppearances']} Runs</strong></p>
            </div>
        </div>

        <div class="stats-cards-grid">
            <div class="stat-card">
                <span class="stat-label">Models Registered</span>
                <div class="stat-value">{len(models)} / 5</div>
                <span class="stat-sub">Strict 5-model max cap</span>
            </div>

            <div class="stat-card">
                <span class="stat-label">Wardrobe Items</span>
                <div class="stat-value">{len(items)}</div>
                <span class="stat-sub">{clothing_count} Cloth, {jewellery_count} Jewel, {footwear_count} Shoe</span>
            </div>

            <div class="stat-card">
                <span class="stat-label">Styled Looks Configured</span>
                <div class="stat-value">{len(assignments)}</div>
                <span class="stat-sub">Across all catwalk runs</span>
            </div>

            <div class="stat-card">
                <span class="stat-label">Total Collection Retail Valuation</span>
                <div class="stat-value gold-text">{currency}{total_value:,.2f}</div>
                <span class="stat-sub">Catalogue retail value</span>
            </div>
        </div>

        <div class="overview-box mt-2">
            <div class="box-title">
                📌 Catwalk Walk Order Sequence
            </div>
            <div class="walk-order-strip">
                {walk_flow_cards}
            </div>
            <div class="walk-order-rule-notice">
                Strict walk sequence enforced identically across every catwalk appearance (Model #1 → Model #2 → Model #3 ...).
            </div>
        </div>
    </div>
    """

def render_models_tab(active_show: Dict[str, Any], query_params: Dict[str, List[str]]) -> str:
    models = sorted(active_show.get("models", []), key=lambda x: x["walkOrder"])
    show_id = active_show["id"]

    cards_html = ""
    for idx, m in enumerate(models):
        up_btn = ""
        down_btn = ""

        if idx > 0:
            up_btn = f"""
            <form action="/reorder-model" method="POST" class="inline-form">
                <input type="hidden" name="show_id" value="{escape(show_id)}">
                <input type="hidden" name="model_id" value="{escape(m['id'])}">
                <input type="hidden" name="direction" value="up">
                <button type="submit" class="btn-icon" title="Move Up">↑</button>
            </form>
            """
        if idx < len(models) - 1:
            down_btn = f"""
            <form action="/reorder-model" method="POST" class="inline-form">
                <input type="hidden" name="show_id" value="{escape(show_id)}">
                <input type="hidden" name="model_id" value="{escape(m['id'])}">
                <input type="hidden" name="direction" value="down">
                <button type="submit" class="btn-icon" title="Move Down">↓</button>
            </form>
            """

        cards_html += f"""
        <div class="model-card">
            <div class="model-card-header">
                <div class="walk-order-badge">
                    <span class="badge-label">WALK ORDER</span>
                    <span class="badge-num">#{m['walkOrder']}</span>
                </div>
                <div class="btn-group-sm">
                    {up_btn}
                    {down_btn}
                </div>
            </div>
            <div class="model-card-body">
                <div class="model-display-name">{escape(m['firstName'])}</div>
                <div class="model-notes-area">
                    <span class="notes-heading">Backstage Dresser Notes</span>
                    <p class="notes-text">{escape(m['notes']) if m['notes'] else 'No specific notes recorded.'}</p>
                </div>
            </div>
            <div class="model-card-footer">
                <div class="header-actions">
                    <a href="/?tab=models&modal=edit_model&model_id={escape(m['id'])}" class="btn btn-secondary btn-sm">Edit</a>
                    <form action="/delete-model" method="POST" class="inline-form" onsubmit="return confirm('Remove model {escape(m['firstName'])} from show?')">
                        <input type="hidden" name="show_id" value="{escape(show_id)}">
                        <input type="hidden" name="model_id" value="{escape(m['id'])}">
                        <button type="submit" class="btn btn-danger btn-sm">Delete</button>
                    </form>
                </div>
            </div>
        </div>
        """

    if not cards_html:
        cards_html = '<div class="empty-state-box"><div class="empty-icon">👥</div><h3>No Models Registered</h3><p>Click + Add Model to register models for this fashion show.</p></div>'

    return f"""
    <div class="tab-panel active">
        <div class="view-header">
            <div class="view-title-group">
                <h2>👥 Models Roster ({len(models)}/5 Models)</h2>
                <p>Registered models walk the runway in this exact fixed sequence for every catwalk appearance.</p>
            </div>
            <div class="view-actions">
                <a href="/?tab=models&modal=add_model" class="btn btn-primary {('disabled' if len(models) >= 5 else '')}">+ Add Model</a>
            </div>
        </div>

        <div class="models-grid">
            {cards_html}
        </div>
    </div>
    """

def render_items_tab(active_show: Dict[str, Any], query_params: Dict[str, List[str]]) -> str:
    items = active_show.get("items", [])
    show_id = active_show["id"]
    currency = escape(active_show.get("currency", "£"))

    cat_filter = query_params.get("category", ["all"])[0]
    sort_by = query_params.get("sort", ["name_asc"])[0]
    search_query = query_params.get("search", [""])[0].lower()

    filtered_items = []
    for i in items:
        if cat_filter != "all" and i["category"] != cat_filter:
            continue
        if search_query and (search_query not in i["name"].lower() and search_query not in i["itemId"].lower()):
            continue
        filtered_items.append(i)

    if sort_by == "name_asc":
        filtered_items.sort(key=lambda x: x["name"].lower())
    elif sort_by == "name_desc":
        filtered_items.sort(key=lambda x: x["name"].lower(), reverse=True)
    elif sort_by == "category_asc":
        filtered_items.sort(key=lambda x: (x["category"], x["name"].lower()))
    elif sort_by == "price_asc":
        filtered_items.sort(key=lambda x: x["price"])
    elif sort_by == "price_desc":
        filtered_items.sort(key=lambda x: x["price"], reverse=True)

    item_rows = ""
    for i in filtered_items:
        cat_badge = f'<span class="badge-cat badge-{i["category"]}">{i["category"].capitalize()}</span>'
        item_rows += f"""
        <tr class="item-row">
            <td><code>{escape(i['itemId'])}</code></td>
            <td>{cat_badge}</td>
            <td><span class="item-title">{escape(i['name'])}</span></td>
            <td>
                <form action="/edit-item" method="POST" class="inline-form price-cell-box">
                    <input type="hidden" name="show_id" value="{escape(show_id)}">
                    <input type="hidden" name="item_id" value="{escape(i['id'])}">
                    <span class="currency-tag">{currency}</span>
                    <input type="number" step="0.01" name="price" value="{i['price']:.2f}" class="inline-price-input" onchange="this.form.submit()">
                </form>
            </td>
            <td style="text-align: right;">
                <a href="/?tab=items&modal=edit_item&item_id={escape(i['id'])}" class="btn btn-secondary btn-xs">Edit</a>
                <form action="/delete-item" method="POST" class="inline-form" onsubmit="return confirm('Delete wardrobe item {escape(i['name'])}?')">
                    <input type="hidden" name="show_id" value="{escape(show_id)}">
                    <input type="hidden" name="item_id" value="{escape(i['id'])}">
                    <button type="submit" class="btn btn-danger btn-xs">Delete</button>
                </form>
            </td>
        </tr>
        """

    if not item_rows:
        item_rows = '<tr><td colspan="5" style="text-align: center; padding: 24px;" class="text-muted">No items found matching criteria.</td></tr>'

    return f"""
    <div class="tab-panel active">
        <div class="view-header">
            <div class="view-title-group">
                <h2>👗 Wardrobe & Retail Price Catalogue ({len(items)} Items)</h2>
                <p>Manage garments, jewellery, footwear, and live retail prices.</p>
            </div>
            <div class="view-actions">
                <a href="/?tab=items&modal=add_item" class="btn btn-primary">+ Add New Item</a>
            </div>
        </div>

        <div class="catalog-toolbar">
            <div class="category-filter-group">
                <a href="/?tab=items&category=all&sort={sort_by}&search={escape(search_query)}" class="filter-btn {('active' if cat_filter == 'all' else '')}">All Items</a>
                <a href="/?tab=items&category=clothing&sort={sort_by}&search={escape(search_query)}" class="filter-btn {('active' if cat_filter == 'clothing' else '')}">Clothing</a>
                <a href="/?tab=items&category=jewellery&sort={sort_by}&search={escape(search_query)}" class="filter-btn {('active' if cat_filter == 'jewellery' else '')}">Jewellery</a>
                <a href="/?tab=items&category=footwear&sort={sort_by}&search={escape(search_query)}" class="filter-btn {('active' if cat_filter == 'footwear' else '')}">Footwear</a>
            </div>

            <form action="/" method="GET" class="catalog-sort-group">
                <input type="hidden" name="tab" value="items">
                <input type="hidden" name="category" value="{escape(cat_filter)}">
                <span class="sort-label">Sort:</span>
                <select name="sort" class="sort-dropdown" onchange="this.form.submit()">
                    <option value="name_asc" {('selected' if sort_by == 'name_asc' else '')}>Name (A → Z)</option>
                    <option value="name_desc" {('selected' if sort_by == 'name_desc' else '')}>Name (Z → A)</option>
                    <option value="category_asc" {('selected' if sort_by == 'category_asc' else '')}>Category (A → Z)</option>
                    <option value="price_asc" {('selected' if sort_by == 'price_asc' else '')}>Price (Low → High)</option>
                    <option value="price_desc" {('selected' if sort_by == 'price_desc' else '')}>Price (High → Low)</option>
                </select>
                <input type="text" name="search" value="{escape(search_query)}" placeholder="Search description or code..." class="form-input form-input-sm search-box">
                <button type="submit" class="btn btn-secondary btn-sm">Search</button>
            </form>
        </div>

        <table class="luxury-table">
            <thead>
                <tr>
                    <th style="width: 120px;">Code</th>
                    <th style="width: 140px;">Category</th>
                    <th>Item Description</th>
                    <th style="width: 180px;">Retail Price</th>
                    <th style="width: 140px; text-align: right;">Actions</th>
                </tr>
            </thead>
            <tbody>
                {item_rows}
            </tbody>
        </table>
    </div>
    """

def render_matrix_tab(active_show: Dict[str, Any], query_params: Dict[str, List[str]]) -> str:
    models = sorted(active_show.get("models", []), key=lambda x: x["walkOrder"])
    items = {i["id"]: i for i in active_show.get("items", [])}
    assignments = active_show.get("assignments", {})
    themes = active_show.get("appearanceThemes", {})
    catwalk_apps = active_show.get("catwalkAppearances", 3)
    currency = escape(active_show.get("currency", "£"))

    group_by = query_params.get("group", ["model"])[0]

    grid_html = ""

    if group_by == "model":
        for m in models:
            cards_html = ""
            for app_idx in range(1, catwalk_apps + 1):
                key = f"{m['id']}_{app_idx}"
                ass = assignments.get(key, {"clothingIds": [], "jewelleryIds": [], "footwearId": None})
                theme = themes.get(str(app_idx)) or themes.get(app_idx) or f"Appearance #{app_idx}"

                c_items = [items[cid] for cid in ass.get("clothingIds", []) if cid in items]
                j_items = [items[jid] for jid in ass.get("jewelleryIds", []) if jid in items]
                f_item = items.get(ass.get("footwearId")) if ass.get("footwearId") in items else None

                look_total = sum(i["price"] for i in c_items + j_items) + (f_item["price"] if f_item else 0.0)

                item_chips = ""
                for ci in c_items:
                    item_chips += f'<div class="slot-item-chip chip-clothing"><span class="chip-name">{escape(ci["name"])}</span><span class="chip-price">{currency}{ci["price"]:.2f}</span></div>'
                for ji in j_items:
                    item_chips += f'<div class="slot-item-chip chip-jewellery"><span class="chip-name">{escape(ji["name"])}</span><span class="chip-price">{currency}{ji["price"]:.2f}</span></div>'
                if f_item:
                    item_chips += f'<div class="slot-item-chip chip-footwear"><span class="chip-name">{escape(f_item["name"])}</span><span class="chip-price">{currency}{f_item["price"]:.2f}</span></div>'

                if not item_chips:
                    item_chips = '<div class="chip-empty-placeholder">No items styled yet</div>'

                cards_html += f"""
                <div class="catwalk-slot-card {('slot-empty' if not (c_items or j_items or f_item) else '')}">
                    <div class="slot-header">
                        <div class="slot-title-group">
                            <span class="slot-title">RUN #{app_idx}</span>
                            <span class="slot-theme-pill">{escape(theme)}</span>
                        </div>
                        <span class="slot-look-cost">{currency}{look_total:,.2f}</span>
                    </div>
                    <div class="slot-body">
                        <div class="slot-items-list">
                            {item_chips}
                        </div>
                    </div>
                    <div class="slot-footer">
                        <a href="/?tab=matrix&modal=edit_outfit&model_id={escape(m['id'])}&app_idx={app_idx}" class="btn btn-gold-outline btn-xs w-100">✎ Edit Outfit</a>
                    </div>
                </div>
                """

            grid_html += f"""
            <div class="model-outfits-card">
                <div class="model-outfits-header">
                    <div class="model-walk-title">
                        <span class="walk-badge-gold">#{m['walkOrder']}</span>
                        <h3 class="model-outfit-heading">{escape(m['firstName'])}</h3>
                    </div>
                </div>
                <div class="appearances-cards-grid">
                    {cards_html}
                </div>
            </div>
            """

    else:
        for app_idx in range(1, catwalk_apps + 1):
            theme = themes.get(str(app_idx)) or themes.get(app_idx) or f"Catwalk Appearance #{app_idx}"
            cards_html = ""

            for m in models:
                key = f"{m['id']}_{app_idx}"
                ass = assignments.get(key, {"clothingIds": [], "jewelleryIds": [], "footwearId": None})

                c_items = [items[cid] for cid in ass.get("clothingIds", []) if cid in items]
                j_items = [items[jid] for jid in ass.get("jewelleryIds", []) if jid in items]
                f_item = items.get(ass.get("footwearId")) if ass.get("footwearId") in items else None

                look_total = sum(i["price"] for i in c_items + j_items) + (f_item["price"] if f_item else 0.0)

                item_chips = ""
                for ci in c_items:
                    item_chips += f'<div class="slot-item-chip chip-clothing"><span class="chip-name">{escape(ci["name"])}</span></div>'
                for ji in j_items:
                    item_chips += f'<div class="slot-item-chip chip-jewellery"><span class="chip-name">{escape(ji["name"])}</span></div>'
                if f_item:
                    item_chips += f'<div class="slot-item-chip chip-footwear"><span class="chip-name">{escape(f_item["name"])}</span></div>'

                if not item_chips:
                    item_chips = '<div class="chip-empty-placeholder">Empty look</div>'

                cards_html += f"""
                <div class="round-model-slot">
                    <div class="slot-head-sm">
                        <span class="walk-tag-sm">#{m['walkOrder']} {escape(m['firstName'])}</span>
                        <span class="price-tag-sm">{currency}{look_total:,.2f}</span>
                    </div>
                    <div class="slot-summary-compact">
                        {item_chips}
                    </div>
                    <div style="margin-top: 10px;">
                        <a href="/?tab=matrix&modal=edit_outfit&model_id={escape(m['id'])}&app_idx={app_idx}" class="btn btn-gold-outline btn-xs w-100">✎ Style</a>
                    </div>
                </div>
                """

            theme_form = f"""
            <form action="/set-theme" method="POST" class="inline-form">
                <input type="hidden" name="show_id" value="{escape(active_show['id'])}">
                <input type="hidden" name="appearance_index" value="{app_idx}">
                <input type="hidden" name="redirect_tab" value="matrix">
                <input type="text" name="theme_name" value="{escape(theme)}" placeholder="Theme title..." class="form-input form-input-sm" style="width: 180px;">
                <button type="submit" class="btn btn-secondary btn-xs">Save Theme</button>
            </form>
            """

            grid_html += f"""
            <div class="appearance-round-card">
                <div class="appearance-round-header">
                    <div>
                        <span class="round-kicker">CATWALK RUN #{app_idx}</span>
                        <h3 class="round-title">{escape(theme)}</h3>
                    </div>
                    {theme_form}
                </div>
                <div class="round-models-grid">
                    {cards_html}
                </div>
            </div>
            """

    return f"""
    <div class="tab-panel active">
        <div class="view-header">
            <div class="view-title-group">
                <h2>👠 Catwalk Outfits Grid</h2>
                <p>Style each model's outfit per catwalk appearance (Max 4 Clothing, Max 4 Jewellery, Max 1 Footwear).</p>
            </div>
            <div class="category-filter-group">
                <a href="/?tab=matrix&group=model" class="filter-btn {('active' if group_by == 'model' else '')}">Group by Model</a>
                <a href="/?tab=matrix&group=run" class="filter-btn {('active' if group_by == 'run' else '')}">Group by Run Order</a>
            </div>
        </div>

        <div class="outfits-models-accordion">
            {grid_html}
        </div>
    </div>
    """

def render_staff_report_tab(active_show: Dict[str, Any], query_params: Dict[str, List[str]]) -> str:
    models = sorted(active_show.get("models", []), key=lambda x: x["walkOrder"])
    items = {i["id"]: i for i in active_show.get("items", [])}
    assignments = active_show.get("assignments", {})
    themes = active_show.get("appearanceThemes", {})
    catwalk_apps = active_show.get("catwalkAppearances", 3)

    filter_model_id = query_params.get("model_id", ["all"])[0]

    report_dossiers = ""
    for m in models:
        if filter_model_id != "all" and m["id"] != filter_model_id:
            continue

        app_blocks = ""
        for app_idx in range(1, catwalk_apps + 1):
            key = f"{m['id']}_{app_idx}"
            ass = assignments.get(key, {"clothingIds": [], "jewelleryIds": [], "footwearId": None})
            theme = themes.get(str(app_idx)) or themes.get(app_idx) or f"Appearance #{app_idx}"

            c_items = [items[cid] for cid in ass.get("clothingIds", []) if cid in items]
            j_items = [items[jid] for jid in ass.get("jewelleryIds", []) if jid in items]
            f_item = items.get(ass.get("footwearId")) if ass.get("footwearId") in items else None

            c_checks = ""
            for ci in c_items:
                c_checks += f'<li><label class="check-container"><input type="checkbox" class="staff-check-input"> <span class="item-name-text">{escape(ci["name"])}</span></label></li>'
            j_checks = ""
            for ji in j_items:
                j_checks += f'<li><label class="check-container"><input type="checkbox" class="staff-check-input"> <span class="item-name-text">{escape(ji["name"])}</span></label></li>'
            f_checks = ""
            if f_item:
                f_checks = f'<li><label class="check-container"><input type="checkbox" class="staff-check-input"> <span class="item-name-text">{escape(f_item["name"])}</span></label></li>'

            app_blocks += f"""
            <div class="appearance-wardrobe-block">
                <div class="appearance-block-header">
                    <span class="appearance-number"><span class="app-icon">👠</span> RUN #{app_idx} — {escape(theme).upper()}</span>
                </div>
                <div class="wardrobe-categories-grid">
                    <div class="category-column clothing-col">
                        <div class="cat-col-header"><span class="cat-dot dot-clothing"></span> Clothing</div>
                        <ul class="checklist-items">{c_checks or '<li class="no-items-placeholder">None</li>'}</ul>
                    </div>
                    <div class="category-column jewellery-col">
                        <div class="cat-col-header"><span class="cat-dot dot-jewellery"></span> Jewellery</div>
                        <ul class="checklist-items">{j_checks or '<li class="no-items-placeholder">None</li>'}</ul>
                    </div>
                    <div class="category-column footwear-col">
                        <div class="cat-col-header"><span class="cat-dot dot-footwear"></span> Footwear</div>
                        <ul class="checklist-items">{f_checks or '<li class="no-items-placeholder">None</li>'}</ul>
                    </div>
                </div>
            </div>
            """

        report_dossiers += f"""
        <div class="model-dossier-card">
            <div class="dossier-model-header">
                <div class="dossier-model-info">
                    <span class="walk-badge">MODEL #{m['walkOrder']}</span>
                    <h3 class="model-name">{escape(m['firstName'])}</h3>
                </div>
                <div class="dossier-notes">
                    <span class="notes-tag">DRESSER NOTES:</span> {escape(m['notes']) if m['notes'] else 'Standard dressing procedure.'}
                </div>
            </div>
            <div class="appearances-strip">
                {app_blocks}
            </div>
        </div>
        """

    model_options = '<option value="all">All Models</option>'
    for m in models:
        sel = 'selected="selected"' if m["id"] == filter_model_id else ""
        model_options += f'<option value="{escape(m["id"])}" {sel}>Model #{m["walkOrder"]}: {escape(m["firstName"])}</option>'

    return f"""
    <div class="tab-panel active">
        <div class="report-view-controls">
            <div class="report-filter-wrap">
                <span class="form-label" style="margin-bottom:0;">Filter Model:</span>
                <form action="/" method="GET" class="inline-form">
                    <input type="hidden" name="tab" value="staff_report">
                    <select name="model_id" class="form-select form-input-sm" onchange="this.form.submit()">
                        {model_options}
                    </select>
                </form>
            </div>
            <button onclick="window.print()" class="btn btn-primary">🖨 Print Staff Report</button>
        </div>

        <div class="report-preview-sheet report-document">
            <div class="report-header">
                <div class="report-header-top">
                    <div>
                        <span class="brand-eyebrow">HEIDI BOUTIQUE // BACKSTAGE REPORT</span>
                        <h1 class="report-title">{escape(active_show['name'])}</h1>
                        <p class="report-subtitle">Dresser checklists and item verification sheets for backstage assistants.</p>
                    </div>
                    <div class="report-meta-box">
                        <div class="meta-item"><span class="meta-label">VENUE:</span> <span class="meta-val">{escape(active_show['venue'])}</span></div>
                        <div class="meta-item"><span class="meta-label">DATE:</span> <span class="meta-val">{escape(active_show['date'])}</span></div>
                        <div class="meta-item"><span class="meta-label">RUNS:</span> <span class="meta-val">{catwalk_apps} Appearances</span></div>
                    </div>
                </div>
            </div>

            <div class="model-dossiers-list">
                {report_dossiers}
            </div>
        </div>
    </div>
    """

def render_lookbook_tab(active_show: Dict[str, Any], query_params: Dict[str, List[str]]) -> str:
    models = sorted(active_show.get("models", []), key=lambda x: x["walkOrder"])
    items = {i["id"]: i for i in active_show.get("items", [])}
    assignments = active_show.get("assignments", {})
    themes = active_show.get("appearanceThemes", {})
    catwalk_apps = active_show.get("catwalkAppearances", 3)
    currency = escape(active_show.get("currency", "£"))

    run_sections = ""
    grand_total = 0.0

    for app_idx in range(1, catwalk_apps + 1):
        theme = themes.get(str(app_idx)) or themes.get(app_idx) or f"Catwalk Appearance #{app_idx}"
        model_entries = ""

        for m in models:
            key = f"{m['id']}_{app_idx}"
            ass = assignments.get(key, {"clothingIds": [], "jewelleryIds": [], "footwearId": None})

            all_item_ids = ass.get("clothingIds", []) + ass.get("jewelleryIds", [])
            if ass.get("footwearId"):
                all_item_ids.append(ass["footwearId"])

            look_items = [items[iid] for iid in all_item_ids if iid in items]
            look_total = sum(i["price"] for i in look_items)
            grand_total += look_total

            item_rows_html = ""
            for i in look_items:
                item_rows_html += f"""
                <tr>
                    <td class="col-cat"><span class="badge-cat badge-{i['category']}">{i['category'].capitalize()}</span></td>
                    <td class="col-item">{escape(i['name'])}</td>
                    <td class="col-price">{currency}{i['price']:,.2f}</td>
                </tr>
                """

            if not item_rows_html:
                item_rows_html = '<tr><td colspan="3" class="lookbook-empty-row">No wardrobe items styled for this look.</td></tr>'

            model_entries += f"""
            <div class="customer-model-entry">
                <div class="model-entry-header">
                    <div class="model-lead">
                        <span class="walk-order-tag">LOOK #{m['walkOrder']}</span>
                        <h4 class="model-heading">{escape(m['firstName'])}</h4>
                    </div>
                    <div class="model-look-total">
                        <span class="total-label">Look Total:</span>
                        <span class="total-val">{currency}{look_total:,.2f}</span>
                    </div>
                </div>
                <table class="lookbook-items-table">
                    <tbody>
                        {item_rows_html}
                    </tbody>
                </table>
            </div>
            """

        run_sections += f"""
        <div class="catwalk-appearance-section">
            <div class="appearance-section-banner">
                <div>
                    <span class="run-kicker">CATWALK RUN #{app_idx}</span>
                    <h3 class="appearance-title">{escape(theme)}</h3>
                </div>
            </div>
            <div class="models-sequence-list">
                {model_entries}
            </div>
        </div>
        """

    return f"""
    <div class="tab-panel active">
        <div class="report-view-controls">
            <div>
                <h2>🏷️ Customer Runway Programme & Lookbook</h2>
                <p class="text-muted">Client runway catalogue featuring outfit price breakdowns per catwalk appearance.</p>
            </div>
            <button onclick="window.print()" class="btn btn-primary">🖨 Print Customer Lookbook</button>
        </div>

        <div class="report-preview-sheet report-document">
            <div class="lookbook-cover-header">
                <span class="collection-season">{escape(active_show['season']).upper()} {active_show['year']} COLLECTION</span>
                <h1 class="lookbook-title">{escape(active_show['name'])}</h1>
                <p class="lookbook-subtitle">Official Runway Lookbook & Retail Catalogue</p>
                <div class="lookbook-details-bar">
                    <span>Venue: {escape(active_show['venue'])}</span>
                    <span>•</span>
                    <span>Date: {escape(active_show['date'])}</span>
                </div>
            </div>

            <div class="appearances-container">
                {run_sections}
            </div>

            <div class="customer-grand-summary">
                <div class="summary-card">
                    <div class="summary-col">
                        <span class="summary-label">Total Collection Valuation</span>
                        <div class="summary-number big-number">{currency}{grand_total:,.2f}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    """

def render_modals(active_show: Dict[str, Any], shows: List[Dict[str, Any]], query_params: Dict[str, List[str]]) -> str:
    modal_name = query_params.get("modal", [""])[0]
    current_tab = query_params.get("tab", ["overview"])[0]

    if not modal_name:
        return ""

    close_url = f"/?tab={current_tab}"

    if modal_name == "new_show":
        return f"""
        <div class="modal active">
            <div class="modal-backdrop"></div>
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title">+ Create New Fashion Show</h3>
                    <a href="{close_url}" class="modal-close-btn">&times;</a>
                </div>
                <form action="/create-show" method="POST">
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Show Name / Title</label>
                            <input type="text" name="name" required placeholder="e.g. LUMIÈRE // Haute Couture" class="form-input">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Season</label>
                            <select name="season" class="form-select">
                                <option value="Spring/Summer">Spring/Summer</option>
                                <option value="Autumn/Winter">Autumn/Winter</option>
                                <option value="Pre-Autumn">Pre-Autumn</option>
                                <option value="Resort">Resort / Cruise</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Year</label>
                                <input type="number" name="year" value="2026" class="form-input">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Currency Symbol</label>
                                <input type="text" name="currency" value="£" class="form-input">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Event Date</label>
                            <input type="date" name="date" value="2026-05-18" class="form-input">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Venue Location</label>
                            <input type="text" name="venue" placeholder="e.g. The Grand Ballroom, Mayfair" class="form-input">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Catwalk Appearances (1 - 5 Runs)</label>
                            <input type="number" min="1" max="5" name="catwalkAppearances" value="3" class="form-input">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <a href="{close_url}" class="btn btn-secondary">Cancel</a>
                        <button type="submit" class="btn btn-primary">Create Show</button>
                    </div>
                </form>
            </div>
        </div>
        """

    if modal_name == "manage_shows":
        show_rows = ""
        for s in shows:
            show_rows += f"""
            <div class="manage-show-row {('active-show-row' if s['id'] == active_show['id'] else '')}">
                <div>
                    <div class="manage-show-title">
                        {escape(s['name'])}
                        {('<span class="pill pill-gold">ACTIVE</span>' if s['id'] == active_show['id'] else '')}
                    </div>
                    <div class="manage-show-meta">{escape(s['season'])} {escape(s['year'])} • {len(s.get('models', []))} Models</div>
                </div>
                <div class="manage-show-actions">
                    <form action="/duplicate-show" method="POST" class="inline-form">
                        <input type="hidden" name="show_id" value="{escape(s['id'])}">
                        <button type="submit" class="btn btn-secondary btn-xs">Duplicate</button>
                    </form>
                    {'<form action="/delete-show" method="POST" class="inline-form" onsubmit="return confirm(\'Delete this show archive?\')"><input type="hidden" name="show_id" value="' + escape(s['id']) + '"><button type="submit" class="btn btn-danger btn-xs">Delete</button></form>' if len(shows) > 1 else ''}
                </div>
            </div>
            """
        return f"""
        <div class="modal active">
            <div class="modal-backdrop"></div>
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title">📁 Manage Fashion Shows</h3>
                    <a href="{close_url}" class="modal-close-btn">&times;</a>
                </div>
                <div class="modal-body">
                    <div class="manage-shows-grid">
                        {show_rows}
                    </div>
                </div>
            </div>
        </div>
        """

    if modal_name == "add_model":
        return f"""
        <div class="modal active">
            <div class="modal-backdrop"></div>
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title">+ Add Model to Roster</h3>
                    <a href="{close_url}" class="modal-close-btn">&times;</a>
                </div>
                <form action="/add-model" method="POST">
                    <input type="hidden" name="show_id" value="{escape(active_show['id'])}">
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Model First Name</label>
                            <input type="text" name="first_name" required placeholder="e.g. Elena" class="form-input">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Backstage Dresser Notes</label>
                            <textarea name="notes" placeholder="Shoe sizing, quick hair changes, jewelry notes..." class="form-textarea" rows="3"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <a href="{close_url}" class="btn btn-secondary">Cancel</a>
                        <button type="submit" class="btn btn-primary">Save Model</button>
                    </div>
                </form>
            </div>
        </div>
        """

    if modal_name == "edit_model":
        model_id = query_params.get("model_id", [""])[0]
        model = next((m for m in active_show.get("models", []) if m["id"] == model_id), None)
        if not model:
            return ""
        return f"""
        <div class="modal active">
            <div class="modal-backdrop"></div>
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title">Edit Model: {escape(model['firstName'])}</h3>
                    <a href="{close_url}" class="modal-close-btn">&times;</a>
                </div>
                <form action="/edit-model" method="POST">
                    <input type="hidden" name="show_id" value="{escape(active_show['id'])}">
                    <input type="hidden" name="model_id" value="{escape(model['id'])}">
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">First Name</label>
                            <input type="text" name="first_name" value="{escape(model['firstName'])}" required class="form-input">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Backstage Notes</label>
                            <textarea name="notes" class="form-textarea" rows="3">{escape(model['notes'])}</textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <a href="{close_url}" class="btn btn-secondary">Cancel</a>
                        <button type="submit" class="btn btn-primary">Update Model</button>
                    </div>
                </form>
            </div>
        </div>
        """

    if modal_name == "add_item":
        return f"""
        <div class="modal active">
            <div class="modal-backdrop"></div>
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title">+ Add Wardrobe Item</h3>
                    <a href="{close_url}" class="modal-close-btn">&times;</a>
                </div>
                <form action="/add-item" method="POST">
                    <input type="hidden" name="show_id" value="{escape(active_show['id'])}">
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Item Description</label>
                            <input type="text" name="name" required placeholder="e.g. Silk Organza Trench Coat" class="form-input">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Category</label>
                            <select name="category" class="form-select">
                                <option value="clothing">Clothing</option>
                                <option value="jewellery">Jewellery</option>
                                <option value="footwear">Footwear</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Retail Price ({escape(active_show.get('currency', '£'))})</label>
                            <input type="number" step="0.01" name="price" required placeholder="0.00" class="form-input">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <a href="{close_url}" class="btn btn-secondary">Cancel</a>
                        <button type="submit" class="btn btn-primary">Add Item</button>
                    </div>
                </form>
            </div>
        </div>
        """

    if modal_name == "edit_item":
        item_id = query_params.get("item_id", [""])[0]
        item = next((i for i in active_show.get("items", []) if i["id"] == item_id), None)
        if not item:
            return ""
        return f"""
        <div class="modal active">
            <div class="modal-backdrop"></div>
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3 class="modal-title">Edit Wardrobe Item</h3>
                    <a href="{close_url}" class="modal-close-btn">&times;</a>
                </div>
                <form action="/edit-item" method="POST">
                    <input type="hidden" name="show_id" value="{escape(active_show['id'])}">
                    <input type="hidden" name="item_id" value="{escape(item['id'])}">
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Item Code Prefix</label>
                            <input type="text" name="itemId" value="{escape(item['itemId'])}" class="form-input">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Item Description</label>
                            <input type="text" name="name" value="{escape(item['name'])}" required class="form-input">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Category</label>
                            <select name="category" class="form-select">
                                <option value="clothing" {('selected' if item['category'] == 'clothing' else '')}>Clothing</option>
                                <option value="jewellery" {('selected' if item['category'] == 'jewellery' else '')}>Jewellery</option>
                                <option value="footwear" {('selected' if item['category'] == 'footwear' else '')}>Footwear</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Retail Price</label>
                            <input type="number" step="0.01" name="price" value="{item['price']:.2f}" required class="form-input">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <a href="{close_url}" class="btn btn-secondary">Cancel</a>
                        <button type="submit" class="btn btn-primary">Update Item</button>
                    </div>
                </form>
            </div>
        </div>
        """

    if modal_name == "edit_outfit":
        model_id = query_params.get("model_id", [""])[0]
        app_idx = int(query_params.get("app_idx", [1])[0])

        model = next((m for m in active_show.get("models", []) if m["id"] == model_id), None)
        if not model:
            return ""

        key = f"{model_id}_{app_idx}"
        ass = active_show.get("assignments", {}).get(key, {"clothingIds": [], "jewelleryIds": [], "footwearId": None})
        theme = active_show.get("appearanceThemes", {}).get(str(app_idx)) or f"Appearance #{app_idx}"

        clothing_items = [i for i in active_show.get("items", []) if i["category"] == "clothing"]
        jewel_items = [i for i in active_show.get("items", []) if i["category"] == "jewellery"]
        footwear_items = [i for i in active_show.get("items", []) if i["category"] == "footwear"]

        clothing_cards = ""
        for ci in clothing_items:
            checked = 'checked="checked"' if ci["id"] in ass.get("clothingIds", []) else ""
            clothing_cards += f"""
            <label class="picker-item-card {('selected' if checked else '')}">
                <div class="picker-check"><input type="checkbox" name="clothing_ids" value="{escape(ci['id'])}" {checked}></div>
                <div class="picker-info">
                    <div class="picker-name">{escape(ci['name'])}</div>
                    <div class="picker-price">{escape(active_show.get('currency', '£'))}{ci['price']:.2f}</div>
                </div>
            </label>
            """

        jewel_cards = ""
        for ji in jewel_items:
            checked = 'checked="checked"' if ji["id"] in ass.get("jewelleryIds", []) else ""
            jewel_cards += f"""
            <label class="picker-item-card {('selected' if checked else '')}">
                <div class="picker-check"><input type="checkbox" name="jewellery_ids" value="{escape(ji['id'])}" {checked}></div>
                <div class="picker-info">
                    <div class="picker-name">{escape(ji['name'])}</div>
                    <div class="picker-price">{escape(active_show.get('currency', '£'))}{ji['price']:.2f}</div>
                </div>
            </label>
            """

        footwear_cards = f"""
        <label class="picker-item-card {('selected' if not ass.get('footwearId') else '')}">
            <div class="picker-check"><input type="radio" name="footwear_id" value="" {('checked="checked"' if not ass.get('footwearId') else '')}></div>
            <div class="picker-info"><div class="picker-name">None</div></div>
        </label>
        """
        for fi in footwear_items:
            checked = 'checked="checked"' if fi["id"] == ass.get("footwearId") else ""
            footwear_cards += f"""
            <label class="picker-item-card {('selected' if checked else '')}">
                <div class="picker-check"><input type="radio" name="footwear_id" value="{escape(fi['id'])}" {checked}></div>
                <div class="picker-info">
                    <div class="picker-name">{escape(fi['name'])}</div>
                    <div class="picker-price">{escape(active_show.get('currency', '£'))}{fi['price']:.2f}</div>
                </div>
            </label>
            """

        return f"""
        <div class="modal active">
            <div class="modal-backdrop"></div>
            <div class="modal-dialog modal-lg">
                <div class="modal-header">
                    <h3 class="modal-title">Style Outfit — {escape(model['firstName'])} (Run #{app_idx}: {escape(theme)})</h3>
                    <a href="{close_url}" class="modal-close-btn">&times;</a>
                </div>
                <form action="/save-assignment" method="POST">
                    <input type="hidden" name="show_id" value="{escape(active_show['id'])}">
                    <input type="hidden" name="model_id" value="{escape(model['id'])}">
                    <input type="hidden" name="appearance_index" value="{app_idx}">

                    <div class="modal-body">
                        <div class="builder-columns-grid">
                            <div class="builder-column">
                                <div class="builder-col-header">
                                    <div class="col-title-wrap">
                                        <h4>👗 Clothing</h4>
                                    </div>
                                    <span class="badge-limit">Max 4</span>
                                </div>
                                <div class="items-picker-scroll">
                                    {clothing_cards or '<div class="empty-col">No clothing in catalogue</div>'}
                                </div>
                            </div>

                            <div class="builder-column">
                                <div class="builder-col-header">
                                    <div class="col-title-wrap">
                                        <h4>💎 Jewellery</h4>
                                    </div>
                                    <span class="badge-limit">Max 4</span>
                                </div>
                                <div class="items-picker-scroll">
                                    {jewel_cards or '<div class="empty-col">No jewellery in catalogue</div>'}
                                </div>
                            </div>

                            <div class="builder-column">
                                <div class="builder-col-header">
                                    <div class="col-title-wrap">
                                        <h4>👠 Footwear</h4>
                                    </div>
                                    <span class="badge-limit">Max 1</span>
                                </div>
                                <div class="items-picker-scroll">
                                    {footwear_cards}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <a href="{close_url}" class="btn btn-secondary">Cancel</a>
                        <button type="submit" class="btn btn-primary">Done Styling</button>
                    </div>
                </form>
            </div>
        </div>
        """

    return ""
