/* Runs before the page paints: applies a theme the visitor chose earlier, so there's
   no flash of the wrong colours. With no saved choice the device setting decides. */
(function () {
  try {
    var t = localStorage.getItem('oecc-theme');
    if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
  } catch (e) { /* storage blocked: follow the device setting */ }
})();
