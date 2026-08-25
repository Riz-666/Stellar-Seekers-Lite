// ===== PAGE LOADER + SMOOTH TRANSITIONS =====
document.addEventListener('DOMContentLoaded', () => {
  const loader = document.getElementById('page-loader');
  const navbar = document.getElementById('mainNavbar');
  const navbarCollapseEl = document.getElementById('navbarNav');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sembunyikan loader setelah halaman selesai dimuat
  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
    }, reduceMotion ? 0 : 300);
  });

  // Kalau user balik pake tombol back/forward browser (bfcache), pastikan loader ke-hide lagi
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      document.body.classList.remove('page-leaving');
      loader.classList.add('hidden');
    }
  });

  // ===== NAVBAR: berubah solid pas di-scroll =====
  const handleNavbarScroll = () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  handleNavbarScroll();
  window.addEventListener('scroll', handleNavbarScroll, { passive: true });

  // ===== LINK HANDLING =====
  // Catatan: "Member" & "About" sengaja pakai anchor (#members / #about) karena
  // mereka adalah section di index.html yang sama, bukan halaman terpisah.
  // Jadi itu bukan bug — itu scroll ke section yang benar di 1 halaman (single-page site).
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    const isHashLink = href.startsWith('#');
    const isSamePageFile = href === window.location.pathname.split('/').pop();
    const isRealPageLink = !isHashLink && !href.startsWith('http') && !href.startsWith('mailto:');

    link.addEventListener('click', (e) => {
      // Tutup menu mobile begitu link diklik (baik anchor maupun halaman baru)
      if (navbarCollapseEl && navbarCollapseEl.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getOrCreateInstance(navbarCollapseEl);
        bsCollapse.hide();
      }

      // Untuk anchor link (#members, #about) biarkan browser smooth-scroll seperti biasa,
      // tanpa loader — karena masih di halaman yang sama.
      if (isHashLink) return;

      // Untuk link ke halaman lain: fade-out dulu baru pindah, biar transisinya smooth
      if (isRealPageLink && !isSamePageFile) {
        e.preventDefault();
        loader.classList.remove('hidden');
        document.body.classList.add('page-leaving');
        setTimeout(() => {
          window.location.href = link.href;
        }, reduceMotion ? 0 : 280);
      }
    });
  });
});