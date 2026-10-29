/**
 * vitorx86-garage — Interactive Terminal Theme Controller (dev.to architecture)
 * Handles:
 * 1. Light/Dark terminal scheme toggle (`--dark` / `--light`)
 * 2. Mobile `$ ls` navigation drawer toggle
 * 3. Keyboard shortcut (`/`) for Ghost Search (`data-ghost-search`)
 * 4. Reading List bookmarks (`vitorx86-reading-list` in localStorage) & feed tabs (`./latest`, `./featured`, `./reading_list`)
 * 5. Automatic Table of Contents (`~$ cat ./toc.txt`) & reading progress bar
 * 6. Copy URL button (`cp url`)
 */
(function () {
  'use strict';

  var STORAGE_BOOKMARKS_KEY = 'vitorx86-reading-list';

  function getSavedSlugs() {
    try {
      var raw = localStorage.getItem(STORAGE_BOOKMARKS_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function setSavedSlugs(slugs) {
    try {
      localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(slugs));
    } catch (e) {}
  }

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

    // 3. Inline Search Bar ("/" shortcut focuses input directly + live feed filtering)
    var searchInput = document.getElementById('nav-search-input');
    var searchForm = document.getElementById('header-search-form');
    var currentSearchQuery = '';

    document.addEventListener('keydown', function (e) {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (document.activeElement && document.activeElement.tagName) || ''
        ) &&
        !(document.activeElement && document.activeElement.isContentEditable)
      ) {
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
        }
      }
    });

    // 4. Reading List Bookmarks & dev.to Feed Filter Tabs
    var savedBadge = document.getElementById('saved-count-badge');
    var saveButtons = document.querySelectorAll('.feed-save-btn');
    var feedCards = document.querySelectorAll('.devto-feed-card');
    var filterButtons = document.querySelectorAll('[data-feed-filter]');
    var filterEmpty = document.getElementById('feed-filter-empty');
    var filterEmptyText = document.getElementById('feed-filter-empty-text');
    var activeFilter = 'all';

    function syncBookmarkUI() {
      var saved = getSavedSlugs();
      if (savedBadge) {
        savedBadge.textContent = String(saved.length);
      }
      saveButtons.forEach(function (btn) {
        var slug = btn.getAttribute('data-save-slug');
        var isSaved = slug && saved.indexOf(slug) !== -1;
        btn.classList.toggle('is-saved', Boolean(isSaved));
        var label = btn.querySelector('.save-btn-label');
        if (label) {
          label.textContent = isSaved ? 'saved ✓' : 'save';
        }
      });
    }

    function applyFeedFilter(mode) {
      if (typeof mode === 'string') {
        activeFilter = mode;
      }
      var saved = getSavedSlugs();
      var query = (currentSearchQuery || '').trim().toLowerCase();
      var visibleCount = 0;

      filterButtons.forEach(function (btn) {
        var isMatch = btn.getAttribute('data-feed-filter') === activeFilter;
        btn.classList.toggle('is-active', isMatch);
        if (btn.getAttribute('role') === 'tab') {
          btn.setAttribute('aria-selected', String(isMatch));
        }
      });

      feedCards.forEach(function (card) {
        var slug = card.getAttribute('data-post-slug') || '';
        var isFeatured = card.getAttribute('data-post-featured') === 'true';
        var show = true;
        if (activeFilter === 'featured') {
          show = isFeatured;
        } else if (activeFilter === 'saved') {
          show = saved.indexOf(slug) !== -1;
        }
        if (show && query) {
          var haystack = (card.textContent || '').toLowerCase();
          show = haystack.indexOf(query) !== -1;
        }
        card.classList.toggle('hidden', !show);
        if (show) visibleCount++;
      });

      if (filterEmpty) {
        if (feedCards.length > 0 && visibleCount === 0) {
          filterEmpty.classList.remove('hidden');
          if (filterEmptyText) {
            if (query) {
              filterEmptyText.textContent =
                'No dispatches matching "' + currentSearchQuery.trim() + '".';
            } else if (activeFilter === 'saved') {
              filterEmptyText.textContent =
                'Your local ./reading_list is empty. Click "$ save" on any dispatch card to bookmark it here.';
            } else {
              filterEmptyText.textContent =
                'No featured dispatches in this stream yet.';
            }
          }
        } else {
          filterEmpty.classList.add('hidden');
        }
      }
    }

    if (searchInput) {
      try {
        var params = new URLSearchParams(window.location.search);
        var initialQ = params.get('q');
        if (initialQ) {
          searchInput.value = initialQ;
          currentSearchQuery = initialQ;
        }
      } catch (e) {}

      searchInput.addEventListener('input', function () {
        currentSearchQuery = searchInput.value || '';
        applyFeedFilter();
      });
    }

    if (searchForm && feedCards.length > 0) {
      searchForm.addEventListener('submit', function (e) {
        e.preventDefault();
        currentSearchQuery = (searchInput && searchInput.value) || '';
        applyFeedFilter();
      });
    }

    saveButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var slug = btn.getAttribute('data-save-slug');
        if (!slug) return;
        var saved = getSavedSlugs();
        var idx = saved.indexOf(slug);
        if (idx === -1) {
          saved.push(slug);
        } else {
          saved.splice(idx, 1);
        }
        setSavedSlugs(saved);
        syncBookmarkUI();
        if (activeFilter === 'saved') {
          applyFeedFilter('saved');
        }
      });
    });

    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mode = btn.getAttribute('data-feed-filter') || 'all';
        applyFeedFilter(mode);
      });
    });

    syncBookmarkUI();

    // 5. Auto-generate Table of Contents & Reading Progress on Post Pages
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

    // 6. Copy Article URL Button
    var copyBtn = document.getElementById('copy-article-url-btn');
    var copyText = document.getElementById('copy-article-url-text');
    if (copyBtn && copyText) {
      copyBtn.addEventListener('click', function () {
        var url = copyBtn.getAttribute('data-url') || window.location.href;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () {
            copyText.textContent = 'copied';
            setTimeout(function () {
              copyText.textContent = 'url';
            }, 2200);
          });
        }
      });
    }
  });
})();
