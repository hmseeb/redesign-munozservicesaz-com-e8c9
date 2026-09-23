'use strict';

/* ==========================================================================
   Muñoz Services LLC — GoHighLevel lead intake
   --------------------------------------------------------------------------
   Serverless function (Vercel, Node runtime). The site's contact/quote form
   POSTs here; this upserts the visitor into the GoHighLevel sub-account.

   The GHL token is a secret and must never reach the browser, which is why
   this proxy exists instead of the form calling GHL directly.

   Required environment variable:
     GHL_API_KEY  — Private Integration token for the sub-account, with the
                    scopes: contacts.write, contacts.readonly,
                    locations/customFields.write, locations/customFields.readonly
   Optional:
     GHL_LOCATION_ID — overrides the default location id below.
   ========================================================================== */

var GHL_BASE    = 'https://services.leadconnectorhq.com';
var GHL_VERSION = '2021-07-28';

var LOCATION_ID = process.env.GHL_LOCATION_ID || 'TKJLNcpwEgvwUFshHw6b';
var TOKEN       = process.env.GHL_API_KEY ||
                  process.env.GHL_PRIVATE_INTEGRATION_TOKEN ||
                  '';

var LEAD_TAG           = 'website-lead';
var FIELD_LEAD_SOURCE  = 'Lead Source';
var FIELD_WEBSITE_FORM = 'Website Form';
var LEAD_SOURCE_VALUE  = 'Website';

/* Custom field ids are stable per location, so resolve them once per warm
   container rather than on every submission. */
var fieldIdCache = null;

function authHeaders() {
  return {
    Authorization: 'Bearer ' + TOKEN,
    Version: GHL_VERSION,
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };
}

async function ghl(path, options) {
  var opts = options || {};
  var res = await fetch(GHL_BASE + path, {
    method: opts.method || 'GET',
    headers: authHeaders(),
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });

  var text = await res.text();
  var data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = { raw: text }; }

  if (!res.ok) {
    var err = new Error('GHL ' + (opts.method || 'GET') + ' ' + path + ' failed: ' + res.status);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

/* Look up "Lead Source" and "Website Form" by display name, creating either
   one if the sub-account does not have it yet. A failure here must not lose
   the lead, so the caller treats a null id as "skip this field". */
async function resolveCustomFields() {
  if (fieldIdCache) return fieldIdCache;

  var wanted = [FIELD_LEAD_SOURCE, FIELD_WEBSITE_FORM];
  var resolved = {};
  var existing = [];

  try {
    var data = await ghl('/locations/' + LOCATION_ID + '/customFields?model=contact');
    existing = (data && data.customFields) || [];
  } catch (e) {
    console.error('GHL: could not list custom fields —', e.message, e.body || '');
    return { byName: {}, partial: true };
  }

  var byLowerName = {};
  existing.forEach(function (f) {
    if (f && f.name) byLowerName[String(f.name).trim().toLowerCase()] = f;
  });

  for (var i = 0; i < wanted.length; i++) {
    var name = wanted[i];
    var match = byLowerName[name.toLowerCase()];

    if (!match) {
      try {
        var created = await ghl('/locations/' + LOCATION_ID + '/customFields', {
          method: 'POST',
          body: { name: name, dataType: 'TEXT', model: 'contact' }
        });
        match = (created && (created.customField || created)) || null;
      } catch (e) {
        console.error('GHL: could not create custom field "' + name + '" —', e.message, e.body || '');
        match = null;
      }
    }

    if (match && match.id) resolved[name] = { id: match.id, key: match.fieldKey || undefined };
  }

  fieldIdCache = { byName: resolved, partial: false };
  return fieldIdCache;
}

function splitName(full) {
  var parts = String(full || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: '', lastName: '' };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
}

function clean(v, max) {
  return String(v == null ? '' : v).trim().slice(0, max || 1000);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!TOKEN) {
    console.error('GHL: GHL_API_KEY is not configured.');
    return res.status(500).json({ ok: false, error: 'Lead capture is not configured.' });
  }

  var body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'Invalid request body.' });
  }

  var name     = clean(body.name, 200);
  var email    = clean(body.email, 200);
  var phone    = clean(body.phone, 50);
  var message  = clean(body.message, 5000);
  var formName = clean(body.formName, 200) || 'Website Form';

  if (!name || !message || (!email && !phone)) {
    return res.status(400).json({ ok: false, error: 'Please provide your name, a message, and an email or phone.' });
  }

  var who = splitName(name);

  try {
    var fields = await resolveCustomFields();
    var customFields = [];

    function pushField(fieldName, value) {
      var meta = fields.byName && fields.byName[fieldName];
      if (!meta) return;
      /* GHL has accepted both spellings of the value property across API
         revisions; sending both keeps this working either way. */
      customFields.push({
        id: meta.id,
        key: meta.key,
        field_value: value,
        fieldValue: value
      });
    }

    pushField(FIELD_LEAD_SOURCE, LEAD_SOURCE_VALUE);
    pushField(FIELD_WEBSITE_FORM, formName);

    var payload = {
      locationId: LOCATION_ID,
      firstName: who.firstName,
      lastName: who.lastName,
      name: name,
      source: LEAD_SOURCE_VALUE,
      tags: [LEAD_TAG]
    };
    if (email) payload.email = email;
    if (phone) payload.phone = phone;
    if (customFields.length) payload.customFields = customFields;

    var result = await ghl('/contacts/upsert', { method: 'POST', body: payload });
    var contact = (result && (result.contact || result)) || {};
    var contactId = contact.id || contact._id;

    /* There is no native contact field for a free-text enquiry, so the
       message is attached as a note on the contact. */
    if (contactId && message) {
      try {
        await ghl('/contacts/' + contactId + '/notes', {
          method: 'POST',
          body: { body: formName + ' submission:\n\n' + message }
        });
      } catch (e) {
        console.error('GHL: contact saved but note failed —', e.message, e.body || '');
      }
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('GHL: lead submission failed —', e.message, e.body || '');
    return res.status(502).json({ ok: false, error: 'We could not send your message right now.' });
  }
};
