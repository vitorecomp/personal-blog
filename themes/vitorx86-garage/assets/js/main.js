/**
 * vitorx86-garage — Interactive Terminal Theme Controller
 * Handles:
 * 1. Light/Dark terminal scheme toggle (`--dark` / `--light`)
 * 2. Mobile `$ ls` navigation drawer toggle
 * 3. Keyboard shortcut (`/`) for Ghost Search (`data-ghost-search`)
 * 4. Automatic Table of Contents (`~$ cat ./toc.txt`) & reading progress bar
 * 5. Copy URL button (`$ ./copy_url.sh`)
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.documentElement;

    // 1. Theme Toggle ($ --dark / $ --light)
    var themeBtn = document.getElementById('theme-toggle-btn');
    var themeText = document.getElementById('theme-toggle-text');

    function syncThemeLabel() {
      if (!themeText) return;
      var isDark = root.classList.contains('dark');
      themeText.textContent = isDark ? '--light' : '--dark';
    }

    syncThemeLabel();

    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        var isDark = root.classList.toggle('dark');
        try {
          localStorage.setItem('vitorx86-blog-theme', isDark ? 'dark' : 'light');
        } catch (e) {}
        syncThemeLabel();
      });
    }

    // 2. Mobile "$ ls" Menu Drawer
    var mobileBtn = document.getElementById('mobile-menu-button');
    var mobileMenu = document.getElementById('mobile-menu');

    if (mobileBtn && mobileMenu) {
      mobileBtn.addEventListener('click', function () {
        var isHidden = mobileMenu.classList.toggle('hidden');
        mobileBtn.setAttribute('aria-expanded', String(!isHidden));
      });

      var mobileLinks = mobileMenu.querySelectorAll('a');
      mobileLinks.forEach(function (link) {
        link.addEventListener('click', function () {
          mobileMenu.classList.add('hidden');
          mobileBtn.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // 3. Keyboard shortcut "/" to trigger Ghost native search
    document.addEventListener('keydown', function (e) {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (document.activeElement && document.activeElement.tagName) || ''
        ) &&
        !(document.activeElement && document.activeElement.isContentEditable)
      ) {
        var searchTrigger = document.getElementById('nav-search-btn');
        if (searchTrigger) {
          e.preventDefault();
          searchTrigger.click();
        }
      }
    });

    // 4. Auto-generate Table of Contents & Reading Progress on Post Pages
    var prose = document.getElementById('article-prose-content');
    var tocAside = document.getElementById('article-toc-aside');
    var tocNav = document.getElementById('article-toc-nav');
    var progressBar = document.getElementById('reading-progress-bar');

    if (prose && tocAside && tocNav) {
      var headings = prose.querySelectorAll('h2, h3');
      if (headings.length >= 2) {
        headings.forEach(function (heading, index) {
          if (!heading.id) {
            heading.id =
              'section-' +
              (heading.textContent || String(index))
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
          }
          var link = document.createElement('a');
          link.href = '#' + heading.id;
          link.className =
            'toc-link' + (heading.tagName === 'H3' ? ' toc-link-h3' : '');
          link.textContent =
            (heading.tagName === 'H3' ? '  └─ ' : './') +
            (heading.textContent || '');
          tocNav.appendChild(link);
        });
        tocAside.hidden = false;
      }
    }

    if (prose && progressBar) {
      window.addEventListener(
        'scroll',
        function () {
          var rect = prose.getBoundingClientRect();
          var total = prose.offsetHeight - window.innerHeight * 0.5;
          if (total <= 0) return;
          var scrolled = Math.min(Math.max(-rect.top, 0), total);
          var pct = Math.round((scrolled / total) * 100);
          progressBar.style.width = pct + '%';
        },
        { passive: true }
      );
    }

    // 5. Copy Article URL Button
    var copyBtn = document.getElementById('copy-article-url-btn');
    var copyText = document.getElementById('copy-article-url-text');
    if (copyBtn && copyText) {
      copyBtn.addEventListener('click', function () {
        var url = copyBtn.getAttribute('data-url') || window.location.href;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () {
            copyText.textContent = './copied_to_clipboard.sh ✓';
            setTimeout(function () {
              copyText.textContent = './copy_url.sh';
            }, 2200);
          });
        }
      });
    }
  });
})();
