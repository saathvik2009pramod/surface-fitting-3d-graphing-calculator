/* theme.js — Dark / light mode toggle */

function initTheme() {
  const btn  = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  let current = prefersDark ? 'dark' : 'light';
  root.setAttribute('data-theme', current);
  updateIcon(btn, current);

  btn && btn.addEventListener('click', () => {
    current = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', current);
    updateIcon(btn, current);
  });
}

function updateIcon(btn, theme) {
  if (!btn) return;
  btn.innerHTML = theme === 'dark'
    ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
       </svg>`
    : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <circle cx="12" cy="12" r="5"/>
         <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
       </svg>`;
}
