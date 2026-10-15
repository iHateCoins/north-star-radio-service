const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const graph = read('engineering/PT44_Factory_Transcription_V3.json');
const readiness = read('engineering/PT44_Engineering_Readiness_V1.json');
const traceAudit = read('engineering/PT44_Schematic_Trace_Audit_V1.json');
const outputTrace = read('engineering/PT44_Output_Cathode_Bypass_Trace_V1.json');
const outputIfTrace = read('engineering/PT44_Output_IF_Supply_Trace_V1.json');
const detectorAvcTrace = read('engineering/PT44_Detector_AVC_Trace_V1.json');
const if1Trace = read('engineering/PT44_IF1_Secondary_Return_Trace_V1.json');
const rfTrace = read('engineering/PT44_RF_Input_Trace_V1.json');
const aerialTrace = read('engineering/PT44_Aerial_Transformer_Trace_V1.json');
const oscillatorTrace = read('engineering/PT44_Oscillator_Return_Trace_V1.json');
const powerLineTrace = read('engineering/PT44_Power_Line_Trace_V1.json');
const tubeReview = read('engineering/PT44_Tube_Terminals_Review_V1.json');
const audit = read('engineering/PT44_Scope_Audit_V1.json');

const members = graph.factory_nets.flatMap(net => net.factory_members);
const memberSet = new Set(members);
const componentTerminals = Object.entries(graph.factory_components).flatMap(([id, component]) =>
  component.terminals.map(terminal => `${id}:${terminal}`));
const componentTerminalSet = new Set(componentTerminals);
const tubeMembers = [...memberSet].filter(member => member.startsWith('V'));
const traceMembers = new Set([
  ...traceAudit.reviewed_net_memberships.flatMap(net => net.reviewed_members),
  ...traceAudit.reviewed_terminal_membership_updates.flatMap(update => update.reviewed_members)
]);
const graphNotInTraceAudit = [...memberSet].filter(member => !traceMembers.has(member)).sort();
const traceAuditNotInGraph = [...traceMembers].filter(member => !memberSet.has(member)).sort();

assert.equal(audit.schema, 'PT44_SCOPE_AUDIT_V1');
assert.equal(audit.snapshot_build_version, readiness.version);
assert.equal(audit.power_line_source_trace.artifact, 'engineering/PT44_Power_Line_Trace_V1.json');
assert.equal(audit.power_line_source_trace.source_level_topology_closed, true);
assert.equal(audit.power_line_source_trace.pin_level_netlist_closed, false);
assert.equal(audit.power_line_source_trace.conductor_groups, powerLineTrace.conductor_groups.length);
assert.deepEqual(audit.power_line_source_trace.component_endpoints_addressed, powerLineTrace.inventory_reconciliation.component_endpoints_traced_by_this_artifact);
assert.deepEqual(audit.power_line_source_trace.tube_symbol_terminals_addressed, powerLineTrace.inventory_reconciliation.tube_symbol_terminals_traced);
assert.equal(audit.subsystems.find(x => x.id === 'POWER').source_trace_artifact, 'engineering/PT44_Power_Line_Trace_V1.json');
assert.equal(audit.benchmark_ready, false);
assert.equal(audit.other_scope_evidence.model_equivalence.artifact, 'engineering/PT44_Model_Equivalence_Review_V1.json');
assert.equal(audit.baseline.factory_component_records, Object.keys(graph.factory_components).length);
assert.equal(audit.baseline.declared_factory_component_terminals, componentTerminals.length);
assert.equal(audit.baseline.current_partial_graph_net_groups, graph.factory_nets.length);
assert.equal(audit.baseline.current_partial_graph_membership_entries, members.length);
assert.equal(readiness.evidence_snapshot.partial_traced_networks, audit.baseline.current_partial_graph_net_groups);
assert.equal(readiness.evidence_snapshot.terminal_memberships_on_partial_graph, audit.baseline.current_partial_graph_membership_entries);
assert.equal(readiness.evidence_snapshot.source_reviewed_graph_groups, audit.source_review_reconciliation.schematic_audit_net_groups);
assert.equal(readiness.evidence_snapshot.source_reviewed_terminal_memberships, audit.source_review_reconciliation.schematic_audit_membership_entries);
assert.equal(audit.baseline.component_terminal_memberships_in_partial_graph, 69);
assert.equal(audit.baseline.component_terminal_reference_coverage_percent, 83.1);
assert.equal(audit.baseline.tube_pin_memberships_in_partial_graph, 21);
assert.equal(audit.baseline.unique_partial_graph_memberships, memberSet.size);
assert.equal(audit.baseline.component_terminal_memberships_in_partial_graph,
  [...memberSet].filter(member => componentTerminalSet.has(member)).length);
assert.equal(audit.baseline.declared_component_terminals_not_in_partial_graph,
  componentTerminals.filter(terminal => !memberSet.has(terminal)).length);
assert.deepEqual(audit.baseline.unique_tube_pin_terminals_referenced, tubeMembers.sort());
assert.equal(audit.baseline.tube_count_with_pinout, Object.keys(tubeReview.tube_pinouts).length);
assert.equal(audit.baseline.tube_socket_pin_roles_inventoried,
  Object.values(tubeReview.tube_pinouts).reduce((sum, tube) => sum + Object.keys(tube.pin_roles).length, 0));
assert.equal(audit.baseline.tube_pin_inventory_complete, true);
assert.equal(audit.baseline.tube_receiver_connection_review_tasks, tubeReview.review_tasks.length);
assert.equal(audit.baseline.tube_receiver_connection_review_tasks_open,
  tubeReview.review_tasks.filter(task => task.status === 'source_trace_required').length);
assert.deepEqual(audit.baseline.unmatched_graph_membership_refs, []);
assert.deepEqual(audit.baseline.duplicate_graph_memberships, []);
assert.deepEqual(audit.baseline.malformed_component_member_refs, []);

assert.equal(audit.source_review_reconciliation.schematic_audit_net_groups,
  traceAudit.reviewed_net_memberships.length);
assert.equal(audit.source_review_reconciliation.schematic_audit_membership_entries,
  [...traceMembers].length);
assert.deepEqual(audit.source_review_reconciliation.current_graph_memberships_missing_from_schematic_audit,
  []);
assert.deepEqual(audit.source_review_reconciliation.schematic_audit_memberships_absent_from_current_graph,
  traceAuditNotInGraph);
assert.deepEqual(graphNotInTraceAudit, []);
assert.deepEqual(audit.source_review_reconciliation.reconciliation_record.added_and_source_verified_memberships,
  [...outputTrace.verified_endpoints, ...outputIfTrace.verified_endpoints, ...detectorAvcTrace.traced_component_endpoints, ...if1Trace.verified_endpoints, ...rfTrace.verified_endpoints, ...aerialTrace.verified_endpoints, ...oscillatorTrace.verified_endpoints, ...read('engineering/PT44_7A8_Screen_Trace_V1.json').verified_endpoints].map(endpoint => endpoint.terminal).sort());
assert.equal(audit.source_review_reconciliation.reconciliation_record.status, 'RESOLVED_IN_V0.48');
assert.equal(powerLineTrace.inventory_reconciliation.source_level_closure, true);
assert.equal(powerLineTrace.inventory_reconciliation.factory_pin_level_closure, false);
assert.equal(powerLineTrace.benchmark_ready, false);

assert.equal(audit.subsystems.length, graph.subcircuits.length);
for (const [i, subcircuit] of graph.subcircuits.entries()) {
  const entry = audit.subsystems[i];
  const terminals = subcircuit.parts.flatMap(id =>
    graph.factory_components[String(id)].terminals.map(terminal => `${id}:${terminal}`));
  const represented = [...new Set(terminals.filter(terminal => memberSet.has(terminal)))].sort();
  const unrepresented = [...new Set(terminals.filter(terminal => !memberSet.has(terminal)))].sort();
  assert.equal(entry.id, subcircuit.id);
  assert.equal(entry.declared_component_terminals, terminals.length);
  assert.equal(entry.terminals_referenced_in_partial_graph, represented.length);
  assert.equal(entry.terminals_not_yet_referenced_in_partial_graph, unrepresented.length);
  assert.deepEqual(entry.represented_terminals, represented);
  assert.deepEqual(entry.unrepresented_terminals, unrepresented);
}

assert.equal(audit.component_inventory.length, Object.keys(graph.factory_components).length);
assert.equal(audit.completion_gates.length, readiness.completion_gates.length);
assert(audit.completion_gates.every(gate => gate.status === 'NOT MET'));
console.log('PASS PT-44 scope audit: denominator-based endpoint coverage and source-review reconciliation');
