import { ADMIN_PATH } from '../admin-path';
import { formatPrice, getDict, type Locale } from '../i18n';
import type { OrderItem } from '../types';
import { button, c, emailFrame, font, h, panel, sectionTitle, spacer } from './layout';

export type OrderMail = {
  number: number; name: string; phone: string; email: string; city: string; address: string; notes: string;
  items: OrderItem[]; total: number | null; locale: Locale;
};
export type MailBrand = { siteUrl: string; currency: string; phone: string; email: string; whatsapp: string };
export type Mail = { subject: string; html: string; text: string };

/** Everything the emails say, once per language. Add a language here to send emails in it. */
const copy = {
  en: {
    brand: 'Maison Jawaher',
    customer: {
      subject: (n: number) => `We have your order #${n} · Maison Jawaher`,
      preheader: (n: number) => `Order #${n} received. We will contact you shortly to confirm it.`,
      title: (name: string) => `Thank you, ${name}`,
      intro: 'We have received your order and we are getting it ready. One of us will call or message you shortly to confirm the details.',
      number: 'Order number',
      summary: 'Your order',
      delivery: 'Delivery to',
      notes: 'Your note',
      next: 'What happens next',
      steps: ['We contact you by phone or WhatsApp to confirm your order.', 'We prepare your pieces and send them to your address.', 'You pay in cash when the parcel arrives.'],
      stepsNoPrice: ['We contact you by phone or WhatsApp to confirm your order and tell you the prices.', 'We prepare your pieces and send them to your address.', 'You pay in cash when the parcel arrives.'],
      help: 'A question about your order? Just reply to this email or write to us on WhatsApp.',
      whatsapp: 'Chat on WhatsApp',
      visit: 'Visit the shop',
      legal: 'You are receiving this email because an order was placed with this address on our website.',
    },
    admin: {
      subject: (n: number, name: string) => `New order #${n} from ${name}`,
      preheader: (n: number, name: string) => `${name} just placed order #${n}.`,
      title: (n: number) => `New order #${n}`,
      intro: (name: string) => `${name} placed an order on the website. It is waiting for you in the portal.`,
      customer: 'Customer', phone: 'Phone', email: 'Email', address: 'Delivery address', notes: 'Customer note', language: 'Order language',
      summary: 'Items', open: 'Open the order', call: 'Call the customer', whatsapp: 'Message on WhatsApp',
      noEmail: 'Not given',
      legal: 'Automatic notification from your website. You can turn these emails off in Admin › Settings › Email.',
    },
    contact: {
      mailSubject: (subject: string, name: string) => `New message: ${subject || 'no subject'} · ${name}`,
      preheader: (name: string) => `${name} sent you a message through the contact form.`,
      title: 'New message', intro: (name: string) => `${name} wrote to you through the contact form. Reply to this email to answer directly.`,
      from: 'From', subject: 'Subject', message: 'Message', reply: 'Reply', open: 'Open the inbox',
      legal: 'Automatic notification from your website. You can turn these emails off in Admin › Settings › Email.',
    },
    test: {
      subject: 'Test email · Maison Jawaher', preheader: 'Your email settings are working.',
      title: 'Email is working', intro: 'This is a test message from your Maison Jawaher admin. If you can read it, the mail server settings in your environment are correct and nothing else needs doing.',
      legal: 'Test message sent from Admin › Settings › Email.',
    },
    qty: 'Qty', total: 'Total', price: 'Price on request', pending: 'To be confirmed', thanks: 'Maison Jawaher · Jewelry made in Morocco', cod: 'Cash on delivery',
  },
  fr: {
    brand: 'Maison Jawaher',
    customer: {
      subject: (n: number) => `Nous avons bien reçu votre commande n°${n} · Maison Jawaher`,
      preheader: (n: number) => `Commande n°${n} reçue. Nous vous contactons très vite pour la confirmer.`,
      title: (name: string) => `Merci, ${name}`,
      intro: 'Nous avons bien reçu votre commande et nous la préparons. L’un de nous vous appellera ou vous écrira très prochainement pour confirmer les détails.',
      number: 'Numéro de commande',
      summary: 'Votre commande',
      delivery: 'Livraison à',
      notes: 'Votre message',
      next: 'La suite',
      steps: ['Nous vous contactons par téléphone ou WhatsApp pour confirmer votre commande.', 'Nous préparons vos bijoux et nous les expédions à votre adresse.', 'Vous payez en espèces à la réception du colis.'],
      stepsNoPrice: ['Nous vous contactons par téléphone ou WhatsApp pour confirmer votre commande et vous indiquer les prix.', 'Nous préparons vos bijoux et nous les expédions à votre adresse.', 'Vous payez en espèces à la réception du colis.'],
      help: 'Une question sur votre commande ? Répondez simplement à cet e-mail ou écrivez-nous sur WhatsApp.',
      whatsapp: 'Écrire sur WhatsApp',
      visit: 'Visiter la boutique',
      legal: 'Vous recevez cet e-mail parce qu’une commande a été passée avec cette adresse sur notre site.',
    },
    admin: {
      subject: (n: number, name: string) => `Nouvelle commande n°${n} de ${name}`,
      preheader: (n: number, name: string) => `${name} vient de passer la commande n°${n}.`,
      title: (n: number) => `Nouvelle commande n°${n}`,
      intro: (name: string) => `${name} a passé une commande sur le site. Elle vous attend dans le portail.`,
      customer: 'Client', phone: 'Téléphone', email: 'E-mail', address: 'Adresse de livraison', notes: 'Message du client', language: 'Langue de la commande',
      summary: 'Articles', open: 'Ouvrir la commande', call: 'Appeler le client', whatsapp: 'Écrire sur WhatsApp',
      noEmail: 'Non renseigné',
      legal: 'Notification automatique de votre site. Vous pouvez désactiver ces e-mails dans Admin › Réglages › E-mail.',
    },
    contact: {
      mailSubject: (subject: string, name: string) => `Nouveau message : ${subject || 'sans objet'} · ${name}`,
      preheader: (name: string) => `${name} vous a écrit via le formulaire de contact.`,
      title: 'Nouveau message', intro: (name: string) => `${name} vous a écrit via le formulaire de contact. Répondez à cet e-mail pour lui répondre directement.`,
      from: 'De', subject: 'Objet', message: 'Message', reply: 'Répondre', open: 'Ouvrir la boîte de réception',
      legal: 'Notification automatique de votre site. Vous pouvez désactiver ces e-mails dans Admin › Réglages › E-mail.',
    },
    test: {
      subject: 'E-mail de test · Maison Jawaher', preheader: 'Vos réglages e-mail fonctionnent.',
      title: 'L’e-mail fonctionne', intro: 'Ceci est un message de test envoyé depuis votre administration Maison Jawaher. Si vous le lisez, les réglages du serveur de messagerie sont corrects et il n’y a rien d’autre à faire.',
      legal: 'Message de test envoyé depuis Admin › Réglages › E-mail.',
    },
    qty: 'Qté', total: 'Total', price: 'Prix sur demande', pending: 'À confirmer', thanks: 'Maison Jawaher · Bijoux faits au Maroc', cod: 'Paiement à la livraison',
  },
};
type Copy = typeof copy.en;

const pick = (l: string): Copy => (l === 'fr' ? copy.fr : copy.en);
const asLocale = (l: string): Locale => (l === 'fr' ? 'fr' : 'en');
const digits = (v: string) => v.replace(/\D/g, '');
const dial = (v: string) => v.replace(/[^+\d]/g, '');

function itemsTable(o: OrderMail, brand: MailBrand, L: Copy) {
  const money = (n: number) => h(formatPrice(n, o.locale, brand.currency));
  const rows = o.items.map((i, k) => {
    const top = k ? `border-top:1px solid ${c.line};` : '';
    return `
    <tr>
      <td style="padding:14px 0;${top}font-family:${font.sans};font-size:14px;color:${c.ink}">
        <span style="font-family:${font.serif};font-size:17px">${h(i.name)}</span><br>
        <span style="font-size:12px;color:${c.muted}">${L.qty} ${i.qty}${i.price != null ? ` × ${money(i.price)}` : ''}</span>
      </td>
      <td align="right" valign="top" style="padding:14px 0;${top}font-family:${font.sans};font-size:14px;color:${c.ink};white-space:nowrap">${i.price != null ? money(i.price * i.qty) : `<span style="color:${c.muted};font-size:12px">${L.price}</span>`}</td>
    </tr>`;
  }).join('');
  const total = `<tr><td style="padding:16px 0 0;border-top:2px solid ${c.wine};font-family:${font.sans};font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:${c.muted}">${L.total}</td>
    <td align="right" style="padding:16px 0 0;border-top:2px solid ${c.wine};font-family:${font.serif};font-size:22px;color:${c.wine};white-space:nowrap">${o.total != null ? money(o.total) : `<span style="font-family:${font.sans};font-size:12px;color:${c.muted}">${L.pending}</span>`}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}${total}</table>`;
}

const textItems = (o: OrderMail, brand: MailBrand, L: Copy) =>
  o.items.map((i) => `- ${i.name} × ${i.qty}${i.price != null ? `  ${formatPrice(i.price * i.qty, o.locale, brand.currency)}` : ''}`).join('\n') +
  `\n${L.total}: ${o.total != null ? formatPrice(o.total, o.locale, brand.currency) : L.pending}`;

/** The customer's order confirmation, in the language they used on the site. */
export function customerOrderEmail(o: OrderMail, brand: MailBrand): Mail {
  const L = pick(o.locale), t = L.customer;
  const stepList = o.total != null ? t.steps : t.stepsNoPrice;
  const steps = stepList.map((s, i) => `
    <tr><td valign="top" style="padding:0 14px 12px 0"><span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;border-radius:12px;background:${c.wine};color:#fbf1e2;font-family:${font.sans};font-size:12px;font-weight:600">${i + 1}</span></td>
    <td valign="top" style="padding:2px 0 12px;font-family:${font.sans};font-size:14px;line-height:1.6;color:${c.ink}">${h(s)}</td></tr>`).join('');
  const wa = brand.whatsapp ? `https://wa.me/${digits(brand.whatsapp)}?text=${encodeURIComponent(`#${o.number}`)}` : '';

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px"><tr><td align="center" style="background:${c.tint};border:1px solid ${c.line};border-radius:14px;padding:18px">
      <p style="margin:0;font-family:${font.sans};font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:${c.gold}">${t.number}</p>
      <p style="margin:6px 0 0;font-family:${font.serif};font-size:34px;color:${c.wine}">#${o.number}</p>
    </td></tr></table>
    ${sectionTitle(t.summary)}
    ${itemsTable(o, brand, L)}
    <p style="margin:6px 0 0;font-family:${font.sans};font-size:12px;color:${c.muted}">${L.cod}</p>
    ${spacer()}
    ${sectionTitle(t.delivery)}
    ${panel(`<b>${h(o.name)}</b><br>${h(o.address)}<br>${h(o.city)}<br><span style="color:${c.muted}">${h(o.phone)}</span>${o.notes ? `<br><br><span style="color:${c.muted}">${h(t.notes)}:</span> <i>${h(o.notes)}</i>` : ''}`)}
    ${spacer()}
    ${sectionTitle(t.next)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${steps}</table>
    <p style="margin:12px 0 26px;font-family:${font.sans};font-size:14px;line-height:1.7;color:${c.muted}">${h(t.help)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      ${wa ? `<td style="padding:0 10px 10px 0">${button(t.whatsapp, wa)}</td>` : ''}
      <td style="padding:0 0 10px">${button(t.visit, `${brand.siteUrl}/${o.locale}`, 'outline')}</td>
    </tr></table>`;

  const footer = `<p style="margin:0;font-family:${font.serif};font-size:14px;color:${c.wine};letter-spacing:.06em">${h(L.thanks)}</p>
    <p style="margin:6px 0 0">${h(brand.phone)} · <a href="mailto:${h(brand.email)}" style="color:${c.muted}">${h(brand.email)}</a></p>`;
  const html = emailFrame({ lang: o.locale, preheader: t.preheader(o.number), brand: L.brand, title: t.title(o.name), intro: h(t.intro), body, footer, legal: h(t.legal) });
  const text = [t.title(o.name), '', t.intro, '', `${t.number}: #${o.number}`, '', textItems(o, brand, L), '', `${t.delivery}: ${o.name}, ${o.address}, ${o.city} (${o.phone})`, '', t.next, ...stepList.map((s, i) => `${i + 1}. ${s}`), '', t.help, '', `${brand.phone} · ${brand.email}`].join('\n');
  return { subject: t.subject(o.number), html, text };
}

/** The alert for the shop owner. `lang` is the admin's language, not the customer's. */
export function adminOrderEmail(order: OrderMail, brand: MailBrand, lang: string): Mail {
  const L = pick(lang), t = L.admin;
  const o: OrderMail = { ...order, locale: asLocale(lang) }; // prices read in the admin's language
  const row = (k: string, v: string) => `<tr><td valign="top" style="padding:7px 16px 7px 0;width:38%;font-family:${font.sans};font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${c.muted}">${h(k)}</td><td style="padding:7px 0;font-family:${font.sans};font-size:14px;color:${c.ink}">${v}</td></tr>`;
  const body = `
    ${sectionTitle(t.customer)}
    ${panel(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${row(t.customer, `<b>${h(o.name)}</b>`)}
      ${row(t.phone, `<a href="tel:${h(dial(o.phone))}" style="color:${c.wine}">${h(o.phone)}</a>`)}
      ${row(t.email, o.email ? `<a href="mailto:${h(o.email)}" style="color:${c.wine}">${h(o.email)}</a>` : `<span style="color:${c.muted}">${h(t.noEmail)}</span>`)}
      ${row(t.address, `${h(o.address)}<br>${h(o.city)}`)}
      ${o.notes ? row(t.notes, `<i>${h(o.notes)}</i>`) : ''}
      ${row(t.language, h(getDict(asLocale(order.locale)).lang[asLocale(order.locale)]))}
    </table>`)}
    ${spacer()}
    ${sectionTitle(t.summary)}
    ${itemsTable(o, brand, L)}
    ${spacer(30)}
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="padding:0 10px 10px 0">${button(t.open, `${brand.siteUrl}${ADMIN_PATH}/orders`)}</td>
      <td style="padding:0 10px 10px 0">${button(t.call, `tel:${dial(o.phone)}`, 'outline')}</td>
      <td style="padding:0 0 10px">${button(t.whatsapp, `https://wa.me/${digits(o.phone)}`, 'outline')}</td>
    </tr></table>`;
  const html = emailFrame({ lang, preheader: t.preheader(o.number, o.name), brand: L.brand, title: t.title(o.number), intro: h(t.intro(o.name)), body, footer: `<p style="margin:0">${h(L.thanks)}</p>`, legal: h(t.legal) });
  const text = [t.title(o.number), t.intro(o.name), '', `${t.phone}: ${o.phone}`, `${t.email}: ${o.email || t.noEmail}`, `${t.address}: ${o.address}, ${o.city}`, ...(o.notes ? [`${t.notes}: ${o.notes}`] : []), '', textItems(o, brand, L), '', `${brand.siteUrl}${ADMIN_PATH}/orders`].join('\n');
  return { subject: t.subject(o.number, o.name), html, text };
}

export function adminContactEmail(m: { name: string; email: string; phone: string; subject: string; body: string }, brand: MailBrand, lang: string): Mail {
  const L = pick(lang), t = L.contact;
  const row = (k: string, v: string) => `<tr><td valign="top" style="padding:6px 16px 6px 0;width:30%;font-family:${font.sans};font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${c.muted}">${h(k)}</td><td style="padding:6px 0;font-family:${font.sans};font-size:14px;color:${c.ink}">${v}</td></tr>`;
  const body = `
    ${panel(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${row(t.from, `<b>${h(m.name)}</b> &lt;<a href="mailto:${h(m.email)}" style="color:${c.wine}">${h(m.email)}</a>&gt;`)}
      ${m.phone ? row(L.admin.phone, h(m.phone)) : ''}
      ${m.subject ? row(t.subject, h(m.subject)) : ''}
    </table>`)}
    ${spacer(22)}
    ${sectionTitle(t.message)}
    <p style="margin:0 0 28px;padding:18px 20px;border-left:3px solid ${c.gold};background:${c.ivory};font-family:${font.sans};font-size:15px;line-height:1.7;color:${c.ink};white-space:pre-wrap">${h(m.body)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="padding:0 10px 10px 0">${button(t.reply, `mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`.trim())}`)}</td>
      <td style="padding:0 0 10px">${button(t.open, `${brand.siteUrl}${ADMIN_PATH}/messages`, 'outline')}</td>
    </tr></table>`;
  const html = emailFrame({ lang, preheader: t.preheader(m.name), brand: L.brand, title: t.title, intro: h(t.intro(m.name)), body, footer: `<p style="margin:0">${h(L.thanks)}</p>`, legal: h(t.legal) });
  const text = [t.title, t.intro(m.name), '', `${t.from}: ${m.name} <${m.email}>${m.phone ? ` · ${m.phone}` : ''}`, ...(m.subject ? [`${t.subject}: ${m.subject}`] : []), '', m.body].join('\n');
  return { subject: t.mailSubject(m.subject, m.name), html, text };
}

export function testEmail(lang: string, brand: MailBrand): Mail {
  const L = pick(lang), t = L.test;
  const html = emailFrame({
    lang, preheader: t.preheader, brand: L.brand, title: t.title, intro: h(t.intro),
    body: `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td>${button('Maison Jawaher', `${brand.siteUrl}/${asLocale(lang)}`)}</td></tr></table>`,
    footer: `<p style="margin:0">${h(L.thanks)}</p>`, legal: h(t.legal),
  });
  return { subject: t.subject, html, text: `${t.title}\n\n${t.intro}` };
}

export function recoveryEmail(o: { name: string; password: string; minutes: number; siteUrl: string }): Mail {
  const title = 'Your temporary admin password';
  const intro = 'Use this temporary password on the admin sign-in screen. You will be asked to choose a permanent password before you can enter the portal.';
  const text = `${title}\n\nHello ${o.name || 'there'},\n${intro}\n\nTemporary password: ${o.password}\nValid for ${o.minutes} minutes from this request. It can be used only once.\n\n${o.siteUrl}${ADMIN_PATH}/login\n\nYour existing password still works until you replace it. Two-factor authentication remains enabled if you use it. If you did not request this, ignore this email and do not share the temporary password.`;
  return { subject: 'Temporary admin password · Maison Jawaher', text, html: emailFrame({ lang: 'en', brand: 'Maison Jawaher', title, preheader: `Your temporary password expires in ${o.minutes} minutes.`, intro: h(intro),
    body: `${panel(`<p style="margin:0;color:${c.muted}">Hello ${h(o.name || 'there')},</p><p style="margin:16px 0;font-family:monospace;font-size:20px;word-break:break-all;color:${c.wine}">${h(o.password)}</p><b>Valid for ${o.minutes} minutes · One use only</b>`)}${spacer(22)}${button('Open admin sign-in', `${o.siteUrl}${ADMIN_PATH}/login`)}<p style="font-family:${font.sans};font-size:14px;line-height:1.7;color:${c.muted}">Your existing password still works until you replace it. Two-factor authentication remains enabled if you use it.</p>`,
    footer: '<p>Maison Jawaher · Account security</p>', legal: 'If you did not request this, ignore this email. Never share this password with anyone.' }) };
}

export function passwordChangedEmail(o: { name: string; siteUrl: string }): Mail {
  const title = 'Your admin password was changed';
  const intro = 'Your permanent admin password has been updated. Sign in using your new password. Your two-factor authentication settings remain unchanged.';
  return { subject: 'Admin password changed · Maison Jawaher', text: `Hello ${o.name || 'there'},\n\n${intro}\n\n${o.siteUrl}${ADMIN_PATH}/login\n\nIf you did not make this change, contact the site owner immediately.`, html: emailFrame({ lang: 'en', brand: 'Maison Jawaher', title, preheader: 'Confirmation of your admin password change.', intro: h(intro), body: `${panel(`Hello ${h(o.name || 'there')},<br><br>If you did not make this change, contact the site owner immediately.`)}${spacer(22)}${button('Sign in securely', `${o.siteUrl}${ADMIN_PATH}/login`)}`, footer: '<p>Maison Jawaher · Account security</p>', legal: 'This security notification is sent whenever an admin password is reset.' }) };
}
