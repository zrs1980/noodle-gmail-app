const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildContactPayload,
  buildLeadPayload,
  buildDealPayload,
  buildEmailActivityPayload,
  normalizeEmailAddress,
} = require('../lib/crm-core.js');

test('normalizeEmailAddress trims and lowercases email values', () => {
  assert.equal(normalizeEmailAddress(' Alice@Example.com '), 'alice@example.com');
  assert.equal(normalizeEmailAddress(''), '');
});

test('buildContactPayload creates a CRM-ready contact object', () => {
  const payload = buildContactPayload({
    email: ' Alice@Example.com ',
    name: ' Alice Johnson ',
    company: 'Noodle Labs',
    phone: '+1 (555) 123-4567',
    source: 'gmail',
  });

  assert.deepEqual(payload, {
    email: 'alice@example.com',
    first_name: 'Alice',
    last_name: 'Johnson',
    company_name: 'Noodle Labs',
    phone: '+1 (555) 123-4567',
    source: 'gmail',
  });
});

test('buildLeadPayload builds a lead for a hot email thread', () => {
  const payload = buildLeadPayload({
    email: 'bob@example.com',
    name: 'Bob Smith',
    company: 'Northwind',
    subject: 'Need pricing for 50 seats',
    message: 'We are interested in a product demo',
    ownerEmail: 'sales@company.com',
  });

  assert.equal(payload.email, 'bob@example.com');
  assert.equal(payload.company_name, 'Northwind');
  assert.equal(payload.status, 'new');
  assert.equal(payload.source, 'gmail');
  assert.match(payload.notes, /pricing/i);
});

test('buildDealPayload creates a deal tied to a contact', () => {
  const payload = buildDealPayload({
    contactId: 'abc-123',
    company: 'Northwind',
    amount: 12500,
    stage: 'qualified',
    title: 'Q4 rollout',
  });

  assert.equal(payload.contact_id, 'abc-123');
  assert.equal(payload.amount, 12500);
  assert.equal(payload.stage, 'qualified');
  assert.equal(payload.title, 'Q4 rollout');
});

test('buildEmailActivityPayload includes message metadata for CRM syncing', () => {
  const payload = buildEmailActivityPayload({
    threadId: 'thread_123',
    messageId: 'msg_456',
    from: 'alice@example.com',
    to: 'sales@company.com',
    subject: 'Follow-up',
    body: 'Hi team, thanks for the demo.',
    receivedAt: '2026-11-14T12:00:00.000Z',
  });

  assert.equal(payload.channel, 'gmail');
  assert.equal(payload.thread_id, 'thread_123');
  assert.equal(payload.message_id, 'msg_456');
  assert.equal(payload.type, 'email');
  assert.equal(payload.sender_email, 'alice@example.com');
  assert.match(payload.snippet, /thanks/i);
});
