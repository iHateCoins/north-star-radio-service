const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const review = JSON.parse(fs.readFileSync(path.join(root, 'engineering/PT44_Model_Equivalence_Review_V1.json'), 'utf8'));
const factory = JSON.parse(fs.readFileSync(path.join(root, 'engineering/PT44_Factory_Transcription_V3.json'), 'utf8'));

assert.equal(review.status, 'SHARED_CHASSIS_SOURCE_CONFIRMED_MODEL_VARIANTS_RETAINED');
assert.equal(review.model, 'Philco PT-44');
assert.equal(review.comparison_model, 'Philco PT-42');
assert.equal(review.engineering_consequence.netlist_change, false);
assert.equal(review.engineering_consequence.completion_gate_change, false);
assert.ok(review.sources.some(s => s.id === 'philco_1941_rms_yearbook' && s.printed_pages.includes(38)));
assert.ok(review.sources.some(s => s.id === 'philco_bulletin_index_437' && s.availability.includes('no image or PDF link')));
assert.ok(review.sources.some(s => s.id === 'rider_volume_12_index' && s.finding.includes('12-45')));
assert.ok(review.model_specific_limits.some(s => s.includes('exact replacement part numbers')));
assert.ok(review.model_specific_limits.some(s => s.includes('No RF net memberships')));
assert.ok(factory.factory_components['1'] && factory.factory_components['2'] && factory.factory_components['3']);
assert.equal(factory.subcircuits.find(s => s.id === 'RF').status, 'partial_input_branch_traced');

console.log('PT-42/PT-44 source equivalence scope checks passed');
