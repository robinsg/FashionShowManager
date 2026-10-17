#!/usr/bin/env node
/**
 * Atelier Runway & Wardrobe Management System
 * SQLite Migration Utility Script
 * 
 * Usage:
 *   node migrate.js               # Verifies SQLite database & reports current status
 *   node migrate.js <data.json>   # Migrates JSON export/backup file into SQLite
 *   node migrate.js --reset       # Resets SQLite to default initial showcase data
 */

const fs = require('fs');
const path = require('path');
const { FashionShowDatabase, DEFAULT_INITIAL_DATA, DB_FILE_PATH } = require('./db');

const args = process.argv.slice(2);
const db = new FashionShowDatabase(DB_FILE_PATH);

console.log('=================================================================');
console.log(' Heidi Boutique // Fashion Show Manager - SQLite Migration Tool');
console.log('=================================================================');
console.log(`Database File: ${db.dbPath}`);

if (args.includes('--reset')) {
  console.log('\n[Action] Resetting SQLite database to default initial luxury dataset...');
  db.resetToDefault();
  const data = db.getAllData();
  console.log(`✓ Success: Reset complete. Active show: "${data.activeShowId}", Shows: ${data.shows.length}`);
  process.exit(0);
}

const targetFile = args.find(a => !a.startsWith('--'));

if (targetFile) {
  const filePath = path.resolve(process.cwd(), targetFile);
  console.log(`\n[Action] Migrating file: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`✗ Error: File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(rawContent);

    const result = db.importData(parsed);
    console.log(`✓ Migration Successful! Imported ${result.showsCount} shows into SQLite.`);

    const currentData = db.getAllData();
    printDatabaseSummary(currentData);
    process.exit(0);
  } catch (err) {
    console.error(`✗ Migration Failed: ${err.message}`);
    process.exit(1);
  }
} else {
  // Report current database status
  console.log('\n[Status] Current SQLite Database Overview:');
  const currentData = db.getAllData();
  printDatabaseSummary(currentData);

  // Look for any export files in current directory
  const files = fs.readdirSync(process.cwd());
  const exportFiles = files.filter(f => f.endsWith('.json') && (f.includes('fashion') || f.includes('export') || f.includes('backup')));
  
  if (exportFiles.length > 0) {
    console.log('\nDetected local JSON export files:');
    exportFiles.forEach(f => console.log(` - ${f} (Run: node migrate.js "${f}" to import)`));
  }
  
  console.log('\nHint: To migrate a JSON backup into SQLite, run: node migrate.js <path-to-json-file>');
}

function printDatabaseSummary(data) {
  console.log(`Active Show ID: ${data.activeShowId}`);
  console.log(`Total Shows:    ${data.shows.length}`);
  
  data.shows.forEach((s, idx) => {
    const assignmentsCount = Object.keys(s.assignments || {}).length;
    console.log(`\n  Show #${idx + 1}: ${s.name}`);
    console.log(`    - ID:                  ${s.id}`);
    console.log(`    - Season & Year:       ${s.season} ${s.year}`);
    console.log(`    - Venue:               ${s.venue}`);
    console.log(`    - Catwalk Appearances: ${s.catwalkAppearances}`);
    console.log(`    - Models Count:        ${(s.models || []).length} / 5 max`);
    console.log(`    - Wardrobe Items:      ${(s.items || []).length}`);
    console.log(`    - Styled Assignments:  ${assignmentsCount}`);
  });
}
