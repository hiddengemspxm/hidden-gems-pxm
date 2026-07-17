/* Toggle ES/EN — persiste la preferencia entre páginas con localStorage */
(function () {
  var KEY = 'hgp_lang';

  function getLang() {
    return localStorage.getItem(KEY) || 'es';
  }

  function setLang(lang) {
    localStorage.setItem(KEY, lang);
    applyLang(lang);
  }

  function applyLang(lang) {
    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('[data-es]').forEach(function (el) {
      el.style.display = lang === 'es' ? '' : 'none';
    });
    document.querySelectorAll('[data-en]').forEach(function (el) {
      el.style.display = lang === 'en' ? '' : 'none';
    });

    var esBtn = document.getElementById('btn-es');
    var enBtn = document.getElementById('btn-en');
    if (esBtn) esBtn.classList.toggle('active', lang === 'es');
    if (enBtn) enBtn.classList.toggle('active', lang === 'en');

    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  window.setLang = setLang;
  window.getLang = getLang;

  document.addEventListener('DOMContentLoaded', function () {
    applyLang(getLang());
  });
})();
