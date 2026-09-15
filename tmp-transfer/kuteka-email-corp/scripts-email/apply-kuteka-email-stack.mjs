#!/usr/bin/env node
/**
 * Kuteka corporate email stack — idempotent apply.
 *
 * Requires env (never logged):
 *   CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
 *   GODADDY_API_KEY, GODADDY_API_SECRET  (or GODADDY_PAT as "key:secret")
 *   RESEND_API_KEY
 *
 * Optional:
 *   EMAIL_FORWARD_TO (default vicentemakiese81@gmail.com)
 *   SKIP_NS_CUTOVER=1  — prepare CF zone + routing DNS only
 *   DRY_RUN=1
 *
 * Exit codes:
 *   0 success
 *   2 missing credentials (non-fatal for CI)
 *   1 failure
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DOMAIN = 'kutekalink.com';
const RENDER_IP = '216.24.57.1';
const FORWARD_TO = process.env.EMAIL_FORWARD_TO || 'vicentemakiese81@gmail.com';
const HUMAN = [
  'info',
  'support',
  'partnerships',
  'contacto',
  'privacidade',
  'juridico',
];
const DRY = process.env.DRY_RUN === '1';
const SKIP_NS = process.env.SKIP_NS_CUTOVER === '1';

function log(...args) {
  console.log(...args);
}

function redact(s) {
  if (!s) return s;
  return String(s).replace(/Bearer\s+\S+/gi, 'Bearer [redacted]');
}

function godaddyAuth() {
  const pat = process.env.GODADDY_PAT?.trim();
  if (pat && pat.includes(':')) {
    const [key, secret] = pat.split(':', 2);
    return { key, secret };
  }
  const key = process.env.GODADDY_API_KEY?.trim();
  const secret = process.env.GODADDY_API_SECRET?.trim();
  if (key && secret) return { key, secret };
  return null;
}

function requireSecrets() {
  const cf = process.env.CLOUDFLARE_API_TOKEN?.trim();
  const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const gd = godaddyAuth();
  const resend = process.env.RESEND_API_KEY?.trim();
  const missing = [];
  if (!cf) missing.push('CLOUDFLARE_API_TOKEN');
  if (!account) missing.push('CLOUDFLARE_ACCOUNT_ID');
  if (!gd) missing.push('GODADDY_API_KEY+GODADDY_API_SECRET (or GODADDY_PAT key:secret)');
  if (!resend) missing.push('RESEND_API_KEY');
  return { cf, account, gd, resend, missing };
}

async function cf(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.success) {
    const err = JSON.stringify(json.errors || json);
    throw new Error(`Cloudflare ${method} ${path}: ${redact(err)}`);
  }
  return json.result;
}

async function gdFetch(path, { method = 'GET', body, auth } = {}) {
  const res = await fetch(`https://api.godaddy.com/v1${path}`, {
    method,
    headers: {
      Authorization: `sso-key ${auth.key}:${auth.secret}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  if (!res.ok) {
    throw new Error(`GoDaddy ${method} ${path}: HTTP ${res.status} ${JSON.stringify(json).slice(0, 300)}`);
  }
  return json;
}

async function resendApi(path, { method = 'GET', body, key } = {}) {
  const res = await fetch(`https://api.resend.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Resend ${method} ${path}: HTTP ${res.status} ${json.message || json.name || ''}`);
  }
  return json;
}

function backupDir() {
  const dir = join(process.cwd(), 'ops/email/backups');
  mkdirSync(dir, { recursive: true });
  return dir;
}

async function ensureZone(token, accountId) {
  const zones = await cf(`/zones?name=${DOMAIN}`, { token });
  if (Array.isArray(zones) && zones.length) return zones[0];
  if (DRY) {
    log('DRY: would create Cloudflare zone', DOMAIN);
    return { id: 'dry-zone', name: DOMAIN, status: 'pending' };
  }
  log('Creating Cloudflare zone', DOMAIN);
  return cf('/zones', {
    method: 'POST',
    token,
    body: { name: DOMAIN, account: { id: accountId }, jump_start: false, type: 'full' },
  });
}

async function upsertDns(zoneId, token, record) {
  const list = await cf(
    `/zones/${zoneId}/dns_records?type=${record.type}&name=${encodeURIComponent(record.name)}`,
    { token },
  );
  const exact = (list || []).find(
    (r) => r.type === record.type && r.name === record.name && (!record.content || r.content === record.content),
  );
  const payload = {
    type: record.type,
    name: record.name,
    content: record.content,
    ttl: record.ttl ?? 1,
    proxied: record.proxied ?? false,
    comment: record.comment,
  };
  if (record.priority != null) payload.priority = record.priority;

  if (DRY) {
    log('DRY DNS', payload);
    return;
  }
  if (exact) {
    await cf(`/zones/${zoneId}/dns_records/${exact.id}`, { method: 'PUT', token, body: payload });
    log('Updated DNS', record.type, record.name);
  } else {
    // For MX multiple records with different content — match by content too
    const sameTypeName = (list || []).find(
      (r) => r.type === record.type && r.name === record.name && r.content === record.content,
    );
    if (sameTypeName) {
      await cf(`/zones/${zoneId}/dns_records/${sameTypeName.id}`, {
        method: 'PUT',
        token,
        body: payload,
      });
      log('Updated DNS', record.type, record.name, record.content);
    } else {
      await cf(`/zones/${zoneId}/dns_records`, { method: 'POST', token, body: payload });
      log('Created DNS', record.type, record.name);
    }
  }
}

async function ensureSiteRecords(zoneId, token) {
  await upsertDns(zoneId, token, {
    type: 'A',
    name: DOMAIN,
    content: RENDER_IP,
    proxied: false,
    comment: 'Render origin — DNS only',
  });
  await upsertDns(zoneId, token, {
    type: 'CNAME',
    name: `www.${DOMAIN}`,
    content: DOMAIN,
    proxied: false,
    comment: 'www → apex',
  });
  await upsertDns(zoneId, token, {
    type: 'TXT',
    name: `_dmarc.${DOMAIN}`,
    content: `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:privacidade@${DOMAIN};`,
    proxied: false,
    comment: 'DMARC Beta — rua to Kuteka mailbox',
  });
}

async function enableEmailRouting(zoneId, token) {
  // Destination
  if (!DRY) {
    try {
      await cf(`/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/email/routing/addresses`, {
        method: 'POST',
        token,
        body: { email: FORWARD_TO },
      });
      log('Destination address created (check inbox to verify):', FORWARD_TO);
    } catch (e) {
      log('Destination create note:', e.message.includes('already') || e.message.includes('409') ? 'may already exist' : e.message);
    }
  }

  // Enable routing settings — creates MX/SPF/DKIM
  if (!DRY) {
    try {
      await cf(`/zones/${zoneId}/email/routing/dns`, { method: 'POST', token, body: { name: DOMAIN } });
    } catch (e) {
      log('email/routing/dns:', e.message.slice(0, 200));
    }
    try {
      await cf(`/zones/${zoneId}/email/routing/enable`, { method: 'POST', token });
    } catch (e) {
      // older API: settings patch
      try {
        await cf(`/zones/${zoneId}/email/routing/settings`, {
          method: 'PATCH',
          token,
          body: { enabled: true },
        });
      } catch (e2) {
        log('enable routing note:', e2.message.slice(0, 200));
      }
    }
  }

  for (const local of HUMAN) {
    if (DRY) {
      log('DRY rule', `${local}@${DOMAIN}`, '→', FORWARD_TO);
      continue;
    }
    try {
      await cf(`/zones/${zoneId}/email/routing/rules`, {
        method: 'POST',
        token,
        body: {
          name: `Kuteka ${local}`,
          enabled: true,
          matchers: [{ type: 'literal', field: 'to', value: `${local}@${DOMAIN}` }],
          actions: [{ type: 'forward', value: [FORWARD_TO] }],
        },
      });
      log('Rule OK', `${local}@${DOMAIN}`, '→', FORWARD_TO);
    } catch (e) {
      if (/already|conflict|81053|81057/i.test(e.message)) {
        log('Rule exists', local);
      } else {
        log('Rule error', local, e.message.slice(0, 180));
      }
    }
  }
}

async function setupResendDomain(apiKey) {
  const name = `mail.${DOMAIN}`;
  let domain;
  const listed = await resendApi('/domains', { key: apiKey });
  const existing = (listed.data || listed || []).find?.((d) => d.name === name) 
    || (Array.isArray(listed) ? listed.find((d) => d.name === name) : null)
    || (listed.data || []).find((d) => d.name === name);
  if (existing) {
    domain = existing;
    log('Resend domain exists', name, domain.id);
  } else if (!DRY) {
    domain = await resendApi('/domains', {
      method: 'POST',
      key: apiKey,
      body: { name },
    });
    log('Resend domain created', name, domain.id);
  } else {
    log('DRY Resend domain', name);
    return { name, records: [] };
  }
  const detail = await resendApi(`/domains/${domain.id}`, { key: apiKey });
  return detail;
}

async function applyResendDns(zoneId, token, resendDomain) {
  const records = resendDomain.records || [];
  for (const r of records) {
    const type = (r.record || r.type || '').toUpperCase();
    const name = r.name || r.host;
    const content = r.value || r.content;
    if (!type || !name || !content) continue;
    const rec = {
      type: type === 'MX' ? 'MX' : type,
      name: name.includes(DOMAIN) ? name : `${name}.${DOMAIN}`,
      content,
      proxied: false,
      comment: 'Resend transactional mail.kutekalink.com',
    };
    if (type === 'MX' && r.priority != null) rec.priority = Number(r.priority);
    // Never put Resend MX on apex
    if (rec.type === 'MX' && (rec.name === DOMAIN || rec.name === `@`)) {
      log('SKIP Resend MX on apex (Email Routing owns apex MX)');
      continue;
    }
    await upsertDns(zoneId, token, rec);
  }
}

async function cutoverNameservers(zone, auth) {
  const ns = zone.name_servers || zone.nameServers;
  if (!ns || ns.length < 2) throw new Error('Cloudflare zone missing name_servers');
  log('Cloudflare NS:', ns.join(', '));
  if (SKIP_NS) {
    log('SKIP_NS_CUTOVER=1 — not changing GoDaddy nameservers');
    return ns;
  }
  if (DRY) {
    log('DRY GoDaddy NS →', ns);
    return ns;
  }
  await gdFetch(`/domains/${DOMAIN}`, {
    method: 'PATCH',
    auth,
    body: { nameServers: ns },
  });
  log('GoDaddy nameservers updated to Cloudflare');
  return ns;
}

async function validateSite() {
  for (const url of [`https://${DOMAIN}/`, `https://www.${DOMAIN}/`, `https://${DOMAIN}/health.json`]) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      log('VALIDATE', url, res.status);
    } catch (e) {
      log('VALIDATE FAIL', url, e.message);
    }
  }
}

async function main() {
  const { cf: token, account, gd, resend, missing } = requireSecrets();
  if (missing.length) {
    log('SKIP: missing secrets:', missing.join(', '));
    log('See docs/operations/email/CORPORATE_EMAIL_BETA.md');
    process.exit(2);
  }

  const dir = backupDir();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(dir, `pre-apply-${stamp}.json`);

  // Inventory GoDaddy DNS if possible
  let gdRecords = null;
  try {
    gdRecords = await gdFetch(`/domains/${DOMAIN}/records`, { auth: gd });
    writeFileSync(backupPath, JSON.stringify({ at: stamp, godaddyRecords: gdRecords }, null, 2));
    log('Backup written', backupPath, 'records', Array.isArray(gdRecords) ? gdRecords.length : '?');
  } catch (e) {
    writeFileSync(
      backupPath,
      JSON.stringify({ at: stamp, godaddyError: e.message, publicFallback: true }, null, 2),
    );
    log('GoDaddy records inventory failed (will use public inventory):', e.message.slice(0, 160));
  }

  const zone = await ensureZone(token, account);
  log('Zone', zone.id, zone.status);
  writeFileSync(join(dir, 'zone-id.txt'), String(zone.id));

  await ensureSiteRecords(zone.id, token);
  await enableEmailRouting(zone.id, token);

  const resendDomain = await setupResendDomain(resend);
  writeFileSync(join(dir, `resend-domain-${stamp}.json`), JSON.stringify(resendDomain, null, 2));
  await applyResendDns(zone.id, token, resendDomain);

  try {
    if (!DRY && resendDomain.id) {
      await resendApi(`/domains/${resendDomain.id}/verify`, { method: 'POST', key: resend });
      log('Resend verify triggered');
    }
  } catch (e) {
    log('Resend verify note:', e.message.slice(0, 160));
  }

  const ns = await cutoverNameservers(zone, gd);
  writeFileSync(
    join(dir, `apply-result-${stamp}.json`),
    JSON.stringify(
      {
        domain: DOMAIN,
        zoneId: zone.id,
        nameservers: ns,
        forwardTo: FORWARD_TO,
        human: HUMAN.map((l) => `${l}@${DOMAIN}`),
        transactionalFrom: `Kuteka <noreply@mail.${DOMAIN}>`,
        skipNs: SKIP_NS,
        dry: DRY,
      },
      null,
      2,
    ),
  );

  await validateSite();
  log('Done. Verify destination email in Gmail; wait for NS propagation before inbound tests.');
  log('Supabase Auth SMTP (manual dashboard): smtp.resend.com / user resend / pass RESEND_API_KEY / from noreply@mail.kutekalink.com');
}

main().catch((err) => {
  console.error(redact(err.message || String(err)));
  process.exit(1);
});
