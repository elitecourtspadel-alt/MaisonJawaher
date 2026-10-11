import { escapeHtml } from '../mail';

/**
 * The shared email frame: a wine header with the wordmark, an ivory card, a gold hairline and a quiet footer.
 * Built with tables and inline styles because that is what email apps (Gmail, Outlook, Apple Mail) understand.
 */
export const c = {
  wine: '#701734', wineDark: '#3c0b1e', gold: '#b88a3b', goldSoft: '#e9c887', ivory: '#fbf6ee', paper: '#ffffff',
  ink: '#2a1519', muted: '#7a6664', line: '#eadfcf', tint: '#f6efe4',
};
const serif = "Georgia,'Times New Roman',serif";
const sans = "'Helvetica Neue',Helvetica,Arial,sans-serif";
export const font = { serif, sans };

export const h = escapeHtml;

export function button(label: string, href: string, kind: 'wine' | 'outline' = 'wine') {
  const style = kind === 'wine'
    ? `background:${c.wine};color:#fff5e8;border:1px solid ${c.wine}`
    : `background:#ffffff;color:${c.wine};border:1px solid ${c.line}`;
  return `<a href="${h(href)}" style="display:inline-block;${style};font-family:${sans};font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;padding:13px 20px;border-radius:999px">${h(label)}</a>`;
}

export function sectionTitle(label: string) {
  return `<p style="margin:0 0 10px;font-family:${sans};font-size:11px;font-weight:600;letter-spacing:.26em;text-transform:uppercase;color:${c.gold}">${h(label)}</p>`;
}

export function panel(inner: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.tint};border:1px solid ${c.line};border-radius:14px"><tr><td style="padding:18px 20px;font-family:${sans};font-size:14px;line-height:1.65;color:${c.ink}">${inner}</td></tr></table>`;
}

export const spacer = (px = 28) => `<div style="height:${px}px;line-height:${px}px;font-size:1px">&nbsp;</div>`;

export function emailFrame(o: { lang: string; preheader: string; brand: string; title: string; intro?: string; body: string; footer: string; legal: string }) {
  return `<!doctype html>
<html lang="${h(o.lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${h(o.title)}</title></head>
<body style="margin:0;padding:0;background:${c.ivory}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${h(o.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.ivory}"><tr><td align="center" style="padding:28px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
    <tr><td align="center" style="background:${c.wine};background-image:linear-gradient(135deg,#8a1c2e,${c.wine} 55%,${c.wineDark});border-radius:20px 20px 0 0;padding:34px 24px 30px">
      <p style="margin:0;font-family:${serif};font-size:13px;letter-spacing:.5em;text-transform:uppercase;color:${c.goldSoft}">&#9670;</p>
      <p style="margin:10px 0 0;font-family:${serif};font-size:26px;letter-spacing:.34em;text-transform:uppercase;color:#fbf1e2">${h(o.brand)}</p>
      <p style="margin:12px auto 0;width:48px;height:1px;background:${c.goldSoft};line-height:1px;font-size:1px">&nbsp;</p>
    </td></tr>
    <tr><td style="background:${c.paper};border-left:1px solid ${c.line};border-right:1px solid ${c.line};padding:36px 32px 30px">
      <h1 style="margin:0 0 12px;font-family:${serif};font-size:30px;line-height:1.2;font-weight:normal;color:${c.wine}">${h(o.title)}</h1>
      ${o.intro ? `<p style="margin:0 0 26px;font-family:${sans};font-size:15px;line-height:1.7;color:${c.muted}">${o.intro}</p>` : ''}
      ${o.body}
    </td></tr>
    <tr><td style="background:${c.tint};border:1px solid ${c.line};border-top:0;border-radius:0 0 20px 20px;padding:22px 32px;font-family:${sans};font-size:12px;line-height:1.7;color:${c.muted};text-align:center">
      ${o.footer}
      <p style="margin:12px 0 0;color:#a39190">${o.legal}</p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}
