(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.NoodleGmailAddonCore = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function normalizeEmailAddress(value) {
    if (!value || typeof value !== 'string') return '';
    return value.trim().toLowerCase();
  }

  function cleanText(value) {
    if (value == null) return '';
    return String(value).trim();
  }

  function splitName(fullName) {
    const safeName = cleanText(fullName || '');
    if (!safeName) {
      return { first_name: '', last_name: '' };
    }

    const parts = safeName.split(/\s+/);
    if (parts.length === 1) {
      return { first_name: parts[0], last_name: '' };
    }

    return {
      first_name: parts[0],
      last_name: parts.slice(1).join(' '),
    };
  }

  function firstNonEmpty() {
    for (let i = 0; i < arguments.length; i += 1) {
      const value = arguments[i];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return value;
      }
    }
    return '';
  }

  function buildContactPayload(input) {
    const email = normalizeEmailAddress(firstNonEmpty(input && input.email, ''));
    const name = firstNonEmpty(input && input.name, '');
    const { first_name, last_name } = splitName(name);

    return {
      email,
      first_name: cleanText(firstNonEmpty(input && input.first_name, first_name)),
      last_name: cleanText(firstNonEmpty(input && input.last_name, last_name)),
      company_name: cleanText(firstNonEmpty(input && input.company, '')),
      phone: cleanText(firstNonEmpty(input && input.phone, '')),
      source: cleanText(firstNonEmpty(input && input.source, 'gmail')),
    };
  }

  function buildLeadPayload(input) {
    const email = normalizeEmailAddress(firstNonEmpty(input && input.email, ''));
    const fullName = firstNonEmpty(input && input.name, '');
    const { first_name, last_name } = splitName(fullName);
    const subject = cleanText(firstNonEmpty(input && input.subject, ''));
    const message = cleanText(firstNonEmpty(input && input.message, ''));
    const company = cleanText(firstNonEmpty(input && input.company, ''));

    return {
      email,
      first_name: cleanText(firstNonEmpty(input && input.first_name, first_name)),
      last_name: cleanText(firstNonEmpty(input && input.last_name, last_name)),
      company_name: company,
      status: 'new',
      source: 'gmail',
      owner_email: cleanText(firstNonEmpty(input && input.ownerEmail, '')),
      notes: [
        subject ? `Subject: ${subject}` : '',
        message ? `Message: ${message}` : '',
      ].filter(Boolean).join('\n'),
    };
  }

  function buildDealPayload(input) {
    return {
      contact_id: cleanText(firstNonEmpty(input && input.contactId, '')),
      company_name: cleanText(firstNonEmpty(input && input.company, '')),
      amount: Number(firstNonEmpty(input && input.amount, 0)) || 0,
      stage: cleanText(firstNonEmpty(input && input.stage, 'qualified')),
      title: cleanText(firstNonEmpty(input && input.title, 'New Gmail deal')),
      source: 'gmail',
    };
  }

  function buildEmailActivityPayload(input) {
    const sender = normalizeEmailAddress(firstNonEmpty(input && input.from, ''));
    const receiver = normalizeEmailAddress(firstNonEmpty(input && input.to, ''));
    const body = cleanText(firstNonEmpty(input && input.body, ''));
    const snippet = body.length > 240 ? `${body.slice(0, 237)}...` : body;

    return {
      channel: 'gmail',
      type: 'email',
      message_id: cleanText(firstNonEmpty(input && input.messageId, '')),
      thread_id: cleanText(firstNonEmpty(input && input.threadId, '')),
      subject: cleanText(firstNonEmpty(input && input.subject, '')),
      sender_email: sender,
      recipient_email: receiver,
      snippet,
      received_at: cleanText(firstNonEmpty(input && input.receivedAt, new Date().toISOString())),
    };
  }

  return {
    normalizeEmailAddress,
    buildContactPayload,
    buildLeadPayload,
    buildDealPayload,
    buildEmailActivityPayload,
  };
});
