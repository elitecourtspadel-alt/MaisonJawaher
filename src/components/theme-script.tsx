import Script from 'next/script';

/** Applies the saved colour mode before the first paint so there is no flash. Server component on purpose. */
const code = `try{var t=localStorage.getItem('mj-theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light'}catch(e){}`;

export function ThemeScript() {
  return <Script id="mj-theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: code }} />;
}
