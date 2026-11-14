function buildHomepage() {
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('Noodle CRM')
        .setSubtitle('Gmail sales sync')
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph().setText(
            'Sync the current email to Noodle CRM, create or match a contact, and quickly create a lead or deal from the thread.'
          )
        )
        .addWidget(
          CardService.newButtonSet()
            .addButton(
              CardService.newTextButton()
                .setText('Sync email')
                .setOnClickAction(
                  CardService.newAction().setFunctionName('syncCurrentEmailAction')
                )
            )
            .addButton(
              CardService.newTextButton()
                .setText('Create contact')
                .setOnClickAction(
                  CardService.newAction().setFunctionName('createContactAction')
                )
            )
        )
    )
    .build();

  return card;
}

function onMessageOpen(e) {
  const message = getCurrentMessageFromEvent(e);
  return buildMessageCard(message);
}

function syncCurrentEmailAction(e) {
  const message = getCurrentMessageFromEvent(e);
  const payload = extractEmailContext(message);
  return handleSyncResponse(payload, 'Email synced');
}

function createContactAction(e) {
  const message = getCurrentMessageFromEvent(e);
  const payload = extractEmailContext(message);
  const contactPayload = buildContactPayloadFromEmail(message);
  return handleSyncResponse({
    contact: contactPayload,
    email: payload,
  }, 'Contact created');
}

function buildMessageCard(message) {
  const sender = message && message.getFrom ? message.getFrom() : '';
  const subject = message && message.getSubject ? message.getSubject() : '';

  const section = CardService.newCardSection()
    .setHeader('CRM action')
    .addWidget(CardService.newDecoratedText().setText(sender || 'Unknown sender'))
    .addWidget(CardService.newDecoratedText().setText(subject || 'No subject'))
    .addWidget(
      CardService.newButtonSet()
        .addButton(
          CardService.newTextButton()
            .setText('Create contact')
            .setOnClickAction(
              CardService.newAction().setFunctionName('createContactAction')
            )
        )
        .addButton(
          CardService.newTextButton()
            .setText('Create lead')
            .setOnClickAction(
              CardService.newAction().setFunctionName('createLeadAction')
            )
        )
        .addButton(
          CardService.newTextButton()
            .setText('Create deal')
            .setOnClickAction(
              CardService.newAction().setFunctionName('createDealAction')
            )
        )
    );

  return CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader().setTitle('Noodle CRM').setSubtitle('Email to CRM')
    )
    .addSection(section)
    .build();
}

function createLeadAction(e) {
  const message = getCurrentMessageFromEvent(e);
  const payload = buildLeadPayloadFromEmail(message);
  return handleSyncResponse(payload, 'Lead created');
}

function createDealAction(e) {
  const message = getCurrentMessageFromEvent(e);
  const payload = buildDealPayloadFromEmail(message);
  return handleSyncResponse(payload, 'Deal created');
}

function getCurrentMessageFromEvent(e) {
  const accessToken = e && e.messageMetadata && e.messageMetadata.accessToken;
  if (accessToken) {
    GmailApp.setCurrentMessageAccessToken(accessToken);
  }

  const messageId = e && e.messageMetadata && e.messageMetadata.messageId;
  if (!messageId) {
    return GmailApp.getInboxThreads(0, 1)[0] && GmailApp.getInboxThreads(0, 1)[0].getMessages()[0];
  }

  return GmailApp.getMessageById(messageId);
}

function extractEmailContext(message) {
  const from = message && message.getFrom ? message.getFrom() : '';
  const to = message && message.getTo ? message.getTo() : '';
  const subject = message && message.getSubject ? message.getSubject() : '';
  const body = message && message.getPlainBody ? message.getPlainBody() : '';
  const id = message && message.getId ? message.getId() : '';
  const threadId = message && message.getThread ? message.getThread().getId() : '';

  return {
    from,
    to,
    subject,
    body,
    messageId: id,
    threadId,
  };
}

function buildContactPayloadFromEmail(message) {
  const emailContext = extractEmailContext(message);
  const sender = parseSenderEmail(emailContext.from);

  return {
    email: sender,
    first_name: sender ? sender.split('@')[0].replace(/[._-]/g, ' ') : '',
    last_name: '',
    company_name: inferCompanyFromSubject(emailContext.subject),
    source: 'gmail',
    phone: '',
  };
}

function buildLeadPayloadFromEmail(message) {
  const emailContext = extractEmailContext(message);
  const sender = parseSenderEmail(emailContext.from);

  return {
    email: sender,
    name: sender ? sender.split('@')[0].replace(/[._-]/g, ' ') : '',
    company: inferCompanyFromSubject(emailContext.subject),
    subject: emailContext.subject,
    message: emailContext.body,
    ownerEmail: PropertiesService.getScriptProperties().getProperty('CRM_OWNER_EMAIL') || '',
    source: 'gmail',
  };
}

function buildDealPayloadFromEmail(message) {
  const emailContext = extractEmailContext(message);
  const sender = parseSenderEmail(emailContext.from);

  return {
    contactId: '',
    company: inferCompanyFromSubject(emailContext.subject),
    amount: 0,
    stage: 'qualified',
    title: emailContext.subject || 'New Gmail opportunity',
    source: 'gmail',
    contactEmail: sender,
  };
}

function parseSenderEmail(fromText) {
  if (!fromText) return '';
  const match = fromText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].toLowerCase() : '';
}

function inferCompanyFromSubject(subject) {
  return subject ? subject.split(/[-:]/)[0].trim() : 'New lead';
}

function handleSyncResponse(payload, successText) {
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader().setTitle('Success').setSubtitle(successText)
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph().setText(
            JSON.stringify(payload, null, 2).slice(0, 800)
          )
        )
    )
    .build();

  return CardService.newActionResponseBuilder().setNavigation(
    CardService.newNavigation().pushCard(card)
  ).build();
}

function createGmailSyncCard(payload) {
  const header = CardService.newCardHeader().setTitle('Noodle CRM');
  const section = CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText(JSON.stringify(payload, null, 2).slice(0, 1200)));

  return CardService.newCardBuilder().setHeader(header).addSection(section).build();
}

function pushPayloadToCRM(payload) {
  const properties = PropertiesService.getScriptProperties();
  const baseUrl = properties.getProperty('CRM_BASE_URL');
  const apiKey = properties.getProperty('CRM_API_KEY');

  if (!baseUrl) {
    throw new Error('Missing CRM_BASE_URL in Script Properties');
  }

  const response = UrlFetchApp.fetch(`${baseUrl.replace(/\/$/, '')}/api/gmail/sync`, {
    method: 'POST',
    contentType: 'application/json',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey ? `Bearer ${apiKey}` : '',
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: false,
  });

  return JSON.parse(response.getContentText());
}
