import Script from 'next/script';

/**
 * Google Analytics 4. Switched on only when GA_MEASUREMENT_ID is set in the environment (for example G-ABC123XYZ),
 * so development and staging stay out of the numbers. Only used on the public site, never in the admin portal.
 */
export function Analytics() {
  const id = (process.env.GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_ID || '').trim();
  if (!/^G-[A-Z0-9]{4,}$/i.test(id)) return null;
  return (
    <>
      <Script id="ga-src" src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true,allow_google_signals:false,allow_ad_personalization_signals:false});`}</Script>
    </>
  );
}
