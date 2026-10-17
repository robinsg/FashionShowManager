/**
 * Automated Test Suite for Fashion Show Manager SQLite Integration
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { FashionShowDatabase, DEFAULT_INITIAL_DATA } = require('./db');
const { server } = require('./server');

const TEST_DB_PATH = path.join(__dirname, 'test_suite.db');

async function runTests() {
  console.log('--- Starting SQLite & API Verification Tests ---');

  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);

  // 1. Test Database Initialization & Seeding
  console.log('1. Testing Database Initialization & Initial Seed...');
  const db = new FashionShowDatabase(TEST_DB_PATH);
  const data = db.getAllData();
  assert.strictEqual(data.shows.length, 2, 'Should seed 2 default fashion shows');
  assert.strictEqual(data.activeShowId, 'show_2026_ss', 'Should set default active show');
  assert.strictEqual(data.shows[0].models.length, 5, 'Should have 5 models in first show');
  assert.strictEqual(data.shows[0].items.length, 22, 'Should have 22 wardrobe items in first show');
  assert.strictEqual(Object.keys(data.shows[0].assignments).length, 20, 'Should have 20 assignments');
  console.log('   ✓ Database initialized & seeded successfully.');

  // 2. Test Show Operations
  console.log('2. Testing Show CRUD...');
  const newShow = db.createShow({
    name: 'Test Runway 2027',
    season: 'Spring/Summer',
    year: 2027,
    date: '2027-04-10',
    venue: 'Milan Fashion Week Hall',
    currency: '€',
    catwalkAppearances: 3
  });
  assert.strictEqual(newShow.name, 'Test Runway 2027');
  assert.strictEqual(db.getAllData().activeShowId, newShow.id);

  // Update show
  const updatedShow = db.updateShow(newShow.id, { venue: 'Paris Palais' });
  assert.strictEqual(updatedShow.venue, 'Paris Palais');

  // Duplicate show
  const copyShow = db.duplicateShow(newShow.id, 'Test Runway 2027 Duplicate');
  assert.strictEqual(copyShow.name, 'Test Runway 2027 Duplicate');
  assert.strictEqual(db.getAllData().shows.length, 4);

  // Delete show
  db.deleteShow(copyShow.id);
  assert.strictEqual(db.getAllData().shows.length, 3);
  console.log('   ✓ Show CRUD operations passed.');

  // 3. Test Model Operations
  console.log('3. Testing Model Operations...');
  const model = db.addModel(newShow.id, { firstName: 'Naomi', notes: 'Lead walk' });
  assert.strictEqual(model.firstName, 'Naomi');
  assert.strictEqual(model.walkOrder, 1);

  const updatedModel = db.updateModel(newShow.id, model.id, { notes: 'Updated notes' });
  assert.strictEqual(updatedModel.notes, 'Updated notes');

  // Verify maximum 5 models constraint
  db.addModel(newShow.id, { firstName: 'Model 2' });
  db.addModel(newShow.id, { firstName: 'Model 3' });
  db.addModel(newShow.id, { firstName: 'Model 4' });
  db.addModel(newShow.id, { firstName: 'Model 5' });
  assert.throws(() => {
    db.addModel(newShow.id, { firstName: 'Model 6 - Should Fail' });
  }, /Maximum of 5 models allowed/);
  console.log('   ✓ Model operations and constraints passed.');

  // 4. Test Wardrobe Items & Assignments
  console.log('4. Testing Wardrobe Items & Styling Assignments...');
  const dress = db.addItem(newShow.id, { name: 'Silk Slip Dress', category: 'clothing', price: 650.00 });
  const shoes = db.addItem(newShow.id, { name: 'Gold Heels', category: 'footwear', price: 420.00 });
  const earrings = db.addItem(newShow.id, { name: 'Pearl Drops', category: 'jewellery', price: 180.00 });

  assert.strictEqual(dress.price, 650.00);
  assert.strictEqual(shoes.category, 'footwear');

  const assignment = db.setAssignment(newShow.id, model.id, 1, {
    clothingIds: [dress.id],
    jewelleryIds: [earrings.id],
    footwearId: shoes.id
  });
  assert.deepStrictEqual(assignment.clothingIds, [dress.id]);
  assert.strictEqual(assignment.footwearId, shoes.id);

  // Item deletion cascades from assignments
  db.deleteItem(newShow.id, dress.id);
  const showAfterItemDelete = db.getShowById(newShow.id);
  const key = `${model.id}_1`;
  assert.strictEqual(showAfterItemDelete.assignments[key].clothingIds.includes(dress.id), false, 'Deleted item should be removed from assignments');
  console.log('   ✓ Wardrobe and assignment operations passed.');

  // 5. Test Legacy localStorage Migration
  console.log('5. Testing Legacy localStorage Migration...');
  const mockLocalStorageData = {
    activeShowId: 'legacy_show_1',
    shows: [
      {
        id: 'legacy_show_1',
        name: 'Legacy Haute Couture Fall 2025',
        season: 'Autumn/Winter',
        year: 2025,
        date: '2025-11-12',
        venue: 'Grand Palais, Paris',
        currency: '€',
        catwalkAppearances: 2,
        models: [
          { id: 'm_legacy_1', firstName: 'Christy', walkOrder: 1, notes: 'Opener' }
        ],
        items: [
          { id: 'c_legacy_1', name: 'Velvet Blazer', category: 'clothing', price: 800 }
        ],
        assignments: {
          'm_legacy_1_1': { clothingIds: ['c_legacy_1'], jewelleryIds: [], footwearId: null }
        }
      }
    ]
  };

  const migrationResult = db.migrateFromLocalStorage(mockLocalStorageData);
  assert.strictEqual(migrationResult.success, true);
  assert.strictEqual(migrationResult.showsCount, 1);

  const migratedData = db.getAllData();
  assert.strictEqual(migratedData.shows.length, 1);
  assert.strictEqual(migratedData.shows[0].name, 'Legacy Haute Couture Fall 2025');
  assert.strictEqual(migratedData.shows[0].models[0].firstName, 'Christy');
  console.log('   ✓ Legacy localStorage migration verified.');

  db.close();
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);

  // 6. Test HTTP Server SQLite REST API
  console.log('6. Testing HTTP Server SQLite API...');
  await new Promise((resolve, reject) => {
    const TEST_PORT = 3899;
    server.listen(TEST_PORT, '127.0.0.1', async () => {
      try {
        // Status endpoint
        const resStatus = await fetch(`http://127.0.0.1:${TEST_PORT}/api/status`);
        const status = await resStatus.json();
        assert.strictEqual(status.status, 'ok');
        assert.strictEqual(status.engine, 'SQLite');

        // Data endpoint
        const resData = await fetch(`http://127.0.0.1:${TEST_PORT}/api/data`);
        const apiData = await resData.json();
        assert.ok(Array.isArray(apiData.shows));
        assert.ok(apiData.shows.length > 0);

        // Migrate endpoint
        const resMigrate = await fetch(`http://127.0.0.1:${TEST_PORT}/api/migrate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(DEFAULT_INITIAL_DATA)
        });
        const migrateJson = await resMigrate.json();
        assert.strictEqual(migrateJson.success, true);
        assert.strictEqual(migrateJson.migrated, true);

        server.close(() => {
          console.log('   ✓ Server REST API endpoints verified.');
          resolve();
        });
      } catch (err) {
        server.close();
        reject(err);
      }
    });
  });

  console.log('\n=============================================');
  console.log(' ✓ ALL SQLITE TESTS COMPLETED SUCCESSFULLY!  ');
  console.log('=============================================');
}

runTests().catch(err => {
  console.error('\n✗ Test failed with error:', err);
  process.exit(1);
});
