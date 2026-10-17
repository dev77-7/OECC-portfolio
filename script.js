/* =========================================================
   OECC site script — no dependencies.
   1. Navigation   2. Charts (sustainability)   3. Legacy dimension
   4. Project map  5. Google Form dialog        6. Media + housekeeping
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     DATA — every figure is cited in the page under its chart.
     --------------------------------------------------------- */
  var DATA = {
    compare: {
      carbon: {
        title: 'Lifecycle greenhouse-gas emissions by source',
        sub: 'Grams of CO₂-equivalent per kilowatt-hour, median over the full life of the plant',
        unit: 'g CO₂-eq/kWh',
        decimals: 0,
        source: 'Source: IPCC (2014), <cite>Climate Change 2014: Mitigation of Climate Change</cite>, Working Group III, Annex III, Table A.III.2 (Schlömer et al.). <a href="https://www.ipcc.ch/site/assets/uploads/2018/02/ipcc_wg3_ar5_annex-iii.pdf" rel="noopener">IPCC AR5 Annex III (PDF)</a>',
        rows: [
          ['Coal', 820],
          ['Gas (combined cycle)', 490],
          ['Biomass', 230],
          ['Solar PV (utility)', 48],
          ['Geothermal', 38],
          ['Hydropower', 24],
          ['Wind (offshore)', 12],
          ['Nuclear', 12],
          ['Wind (onshore)', 11]
        ]
      },
      deaths: {
        title: 'Deaths per unit of electricity by source',
        sub: 'Deaths from accidents and air pollution per terawatt-hour generated. The nuclear figure includes Chernobyl and Fukushima.',
        unit: 'deaths/TWh',
        decimals: 2,
        source: 'Source: Ritchie, H. (2020, updated 2022), <cite>What are the safest and cleanest sources of energy?</cite>, Our World in Data, based on Markandya &amp; Wilkinson (2007), <cite>The Lancet</cite> 370, 979–990, and Sovacool et al. (2016), <cite>Journal of Cleaner Production</cite> 112, 3952–3965. <a href="https://ourworldindata.org/safest-sources-of-energy" rel="noopener">ourworldindata.org</a>',
        rows: [
          ['Brown coal', 32.72],
          ['Coal', 24.62],
          ['Oil', 18.43],
          ['Biomass', 4.63],
          ['Gas', 2.82],
          ['Hydropower', 1.3],
          ['Wind', 0.04],
          ['Nuclear', 0.03],
          ['Solar', 0.02]
        ]
      }
    },

    /* Indian reactors by year of commercial operation, installed MWe as listed on NPCIL's "All Plants"
       page (24 units, 8,780 MWe in Oct 2026). RAPS-1 (100 MWe) was shut down in 2004 and is no longer
       counted. RAPP-8 (700 MWe) began fuel loading in Sept 2026: add it when it enters commercial operation. */
    reactors: [
      [1969, 'TAPS-1', 160], [1969, 'TAPS-2', 160],
      [1973, 'RAPS-1', 100],
      [1981, 'RAPS-2', 200],
      [2004, 'RAPS-1', -100],
      [1984, 'MAPS-1', 220],
      [1986, 'MAPS-2', 220],
      [1991, 'NAPS-1', 220],
      [1992, 'NAPS-2', 220],
      [1993, 'KAPS-1', 220],
      [1995, 'KAPS-2', 220],
      [2000, 'KGS-2', 220], [2000, 'RAPS-3', 220], [2000, 'KGS-1', 220], [2000, 'RAPS-4', 220],
      [2005, 'TAPS-4', 540],
      [2006, 'TAPS-3', 540],
      [2007, 'KGS-3', 220],
      [2010, 'RAPS-5', 220], [2010, 'RAPS-6', 220],
      [2011, 'KGS-4', 220],
      [2014, 'KKNPP-1', 1000],
      [2017, 'KKNPP-2', 1000],
      [2023, 'KAPP-3', 700],
      [2024, 'KAPP-4', 700],
      [2025, 'RAPP-7', 700]
    ],
    historyEnd: 2026,

    targets: [
      { label: 'Installed today', value: 8.78, kind: 'actual' },
      { label: 'Target 2031–32', value: 22.38, kind: 'target' },
      { label: 'Target 2047', value: 100, kind: 'target' }
    ],

    /* Both capacity and the 2031–32 target exclude RAPS-1, as in PIB's December 2025 figures. */
    indiaSource: 'Sources: NPCIL, list of operating plants (24 units, 8,780 MW); Press Information Bureau, Department of Atomic Energy year-end review, 10 December 2025 (generation, CO₂ avoided, share of generation, and 22.38 GW by 2031–32 excluding RAPS-1); Union Budget 2025–26 speech, paragraph 61 (at least 100 GW of nuclear energy by 2047).'
  };

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SVGNS = 'http://www.w3.org/2000/svg';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function s(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }
  function h(tag, attrs, parent) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]);
    });
    if (parent) parent.appendChild(n);
    return n;
  }
  function fmt(v, d) {
    return v.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function onResize(el, fn) {
    var last = 0;
    if ('ResizeObserver' in window) {
      new ResizeObserver(function (entries) {
        var w = Math.round(entries[0].contentRect.width);
        if (w && w !== last) { last = w; fn(w); }
      }).observe(el);
    } else {
      fn(el.clientWidth);
      window.addEventListener('resize', function () { fn(el.clientWidth); });
    }
  }

  /* ---------- tooltip (one per chart; text only via textContent) ----------
     Lives in the chart's <figure> so re-rendering the plot never removes it;
     x/y arrive in plot coordinates and are offset into the figure. */
  function makeTooltip(host, plot) {
    var tip = h('div', { class: 'tooltip', role: 'presentation' }, host);
    var strong = h('strong', null, tip);
    var span = h('span', null, tip);
    return {
      show: function (x, y, value, label) {
        strong.textContent = value;
        span.textContent = label;
        var max = host.clientWidth;
        var half = tip.offsetWidth / 2;
        x += plot.offsetLeft;
        y += plot.offsetTop;
        tip.style.left = Math.max(half, Math.min(max - half, x)) + 'px';
        tip.style.top = y + 'px';
        tip.classList.add('is-on');
      },
      hide: function () { tip.classList.remove('is-on'); }
    };
  }

  function makeTable(container, headers, rows) {
    container.textContent = '';
    var wrap = h('div', { class: 'viz-table-wrap' }, container);
    var t = h('table', null, wrap);
    var tr = h('tr', null, h('thead', null, t));
    headers.forEach(function (c, i) { h('th', { scope: 'col', class: i ? 'num' : '', text: c }, tr); });
    var tb = h('tbody', null, t);
    rows.forEach(function (r) {
      var row = h('tr', null, tb);
      r.forEach(function (c, i) { h(i ? 'td' : 'th', i ? { class: 'num', text: c } : { scope: 'row', text: c }, row); });
    });
  }

  /* ---------------------------------------------------------
     1. NAVIGATION
     --------------------------------------------------------- */
  function initNav() {
    var nav = $('[data-nav]');
    var hero = $('.hero');
    var toggle = $('[data-nav-toggle]');
    var menu = $('#nav-menu');
    if (!nav) return;

    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        nav.classList.toggle('is-solid', !entries[0].isIntersecting);
      }, { rootMargin: '-' + (nav.offsetHeight + 10) + 'px 0px 0px 0px' }).observe(hero);
    } else {
      nav.classList.add('is-solid');
    }

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
      menu.classList.toggle('is-open', open);
      if (open) nav.classList.add('is-solid');
    }
    if (toggle && menu) {
      toggle.addEventListener('click', function () {
        setOpen(toggle.getAttribute('aria-expanded') !== 'true');
      });
      $all('a', menu).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
      });
    }
  }

  /* ---------------------------------------------------------
     2a. CHART — horizontal bars, nuclear highlighted
     --------------------------------------------------------- */
  function barPath(x, y, w, hgt, r) {
    if (w <= r) return 'M' + x + ',' + y + 'h' + w + 'v' + hgt + 'h' + (-w) + 'Z';
    return 'M' + x + ',' + y +
      'h' + (w - r) + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r +
      'v' + (hgt - 2 * r) + 'a' + r + ',' + r + ' 0 0 1 ' + (-r) + ',' + r +
      'h' + (-(w - r)) + 'Z';
  }

  /* widest rendered label, so long names like "Gas (combined cycle)" never clip on phones */
  function measureLabels(host, labels, cls) {
    var probe = s('svg', { width: 0, height: 0, 'aria-hidden': 'true' });
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    host.appendChild(probe);
    var max = 0;
    labels.forEach(function (l) {
      var tx = s('text', { class: cls }, probe);
      tx.textContent = l;
      max = Math.max(max, tx.getComputedTextLength());
    });
    host.removeChild(probe);
    return max;
  }

  function renderBars(plot, set, tip, animate) {
    var width = plot.clientWidth;
    var narrow = width < 520;
    var labelW = Math.ceil(measureLabels(plot, set.rows.map(function (r) { return r[0]; }), 'c-cat-text is-focus')) + 14;
    var valueW = narrow ? 52 : 64;
    var rowH = 34, barH = 20;
    var top = 4;
    var height = top + set.rows.length * rowH + 4;
    var plotW = Math.max(60, width - labelW - valueW);
    var max = Math.max.apply(null, set.rows.map(function (r) { return r[1]; }));

    plot.textContent = '';
    var svg = s('svg', { viewBox: '0 0 ' + width + ' ' + height, width: width, height: height, role: 'list', 'aria-label': set.title }, plot);
    s('line', { class: 'c-grid', x1: labelW, x2: labelW, y1: 0, y2: height }, svg);

    set.rows.forEach(function (r, i) {
      var name = r[0], v = r[1];
      var isFocus = name === 'Nuclear';
      var y = top + i * rowH;
      var w = Math.max(2, (v / max) * plotW);
      var g = s('g', { class: 'c-row', role: 'listitem' }, svg);
      var cat = s('text', { class: 'c-cat-text' + (isFocus ? ' is-focus' : ''), x: labelW - 12, y: y + rowH / 2 + 5, 'text-anchor': 'end' }, g);
      cat.textContent = name;
      var hit = s('rect', {
        class: 'c-hit', x: 0, y: y, width: width, height: rowH, tabindex: 0,
        'aria-label': name + ': ' + fmt(v, set.decimals) + ' ' + set.unit
      }, g);
      var bar = s('path', {
        class: 'c-bar' + (isFocus ? ' is-focus' : '') + (animate ? ' is-entering' : ''),
        d: barPath(labelW + 1, y + (rowH - barH) / 2, w, barH, 4)
      }, g);
      if (animate) bar.style.animationDelay = (i * 40) + 'ms';
      var val = s('text', { class: 'c-val-text' + (isFocus ? ' is-focus' : ''), x: labelW + 1 + w + 7, y: y + rowH / 2 + 5 }, g);
      val.textContent = fmt(v, set.decimals);

      function show() {
        tip.show(Math.min(width - 60, labelW + w + 90), y + 2, fmt(v, set.decimals) + ' ' + set.unit, name);
      }
      hit.addEventListener('pointerenter', show);
      hit.addEventListener('pointerleave', tip.hide);
      hit.addEventListener('focus', show);
      hit.addEventListener('blur', tip.hide);
    });
  }

  function initCompare() {
    var root = $('[data-compare]');
    if (!root) return;
    var plot = $('[data-compare-plot]', root);
    var tabs = $all('[role="tab"]', root);
    var tip = makeTooltip(root, plot);
    var current = 'carbon';
    var first = true;

    function update(metric, animate) {
      current = metric;
      var set = DATA.compare[metric];
      $('[data-compare-title]', root).textContent = set.title;
      $('[data-compare-sub]', root).textContent = set.sub;
      $('[data-compare-source]', root).innerHTML = set.source; // trusted, authored above
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-metric') === metric;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (on) plot.setAttribute('aria-labelledby', t.id);
      });
      renderBars(plot, set, tip, animate && !reduceMotion);
      makeTable($('[data-compare-table]', root), ['Source', set.unit], set.rows.map(function (r) { return [r[0], fmt(r[1], set.decimals)]; }));
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { update(t.getAttribute('data-metric'), true); });
      t.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        next.focus();
        update(next.getAttribute('data-metric'), true);
      });
    });

    onResize(plot, function () { update(current, first && !reduceMotion); first = false; });
  }

  /* ---------------------------------------------------------
     2b. CHART — India installed capacity history (step area)
     --------------------------------------------------------- */
  function capacitySeries() {
    var start = DATA.reactors[0][0], end = DATA.historyEnd;
    var byYear = {};
    DATA.reactors.forEach(function (r) { (byYear[r[0]] = byYear[r[0]] || []).push(r); });
    var total = 0, out = [];
    for (var y = start; y <= end; y++) {
      var added = byYear[y] || [];
      added.forEach(function (r) { total += r[2]; });
      out.push({ year: y, gw: total / 1000, added: added.map(function (r) { return r[2] < 0 ? r[1] + ' retired' : r[1] + ' (' + r[2] + ' MW)'; }) });
    }
    return out;
  }

  function renderHistory(plot, series, tip) {
    var width = plot.clientWidth;
    var narrow = width < 480;
    var m = { t: 12, r: 14, b: 30, l: 34 };
    var height = narrow ? 240 : 290;
    var iw = width - m.l - m.r, ih = height - m.t - m.b;
    var x0 = series[0].year, x1 = series[series.length - 1].year + 1;
    var yMax = Math.ceil(series[series.length - 1].gw / 2) * 2;
    function X(year) { return m.l + ((year - x0) / (x1 - x0)) * iw; }
    function Y(v) { return m.t + ih - (v / yMax) * ih; }

    plot.textContent = '';
    var svg = s('svg', { viewBox: '0 0 ' + width + ' ' + height, width: width, height: height, tabindex: 0,
      'aria-label': 'Installed nuclear capacity in India grew from 0.32 GW in 1969 to ' + fmt(series[series.length - 1].gw, 2) + ' GW in ' + series[series.length - 1].year + '. Use arrow keys to read each year.' }, plot);

    for (var g = 0; g <= yMax; g += 2) {
      s('line', { class: 'c-grid', x1: m.l, x2: width - m.r, y1: Y(g), y2: Y(g) }, svg);
      var t = s('text', { class: 'c-axis-text', x: m.l - 8, y: Y(g) + 4, 'text-anchor': 'end' }, svg);
      t.textContent = g;
    }
    var step = narrow ? 20 : 10;
    for (var yr = 1970; yr <= x1; yr += step) {
      var tx = s('text', { class: 'c-axis-text', x: X(yr), y: height - 8, 'text-anchor': 'middle' }, svg);
      tx.textContent = yr;
    }

    var d = 'M' + X(x0) + ',' + Y(0);
    series.forEach(function (p) { d += 'L' + X(p.year) + ',' + Y(p.gw) + 'L' + X(p.year + 1) + ',' + Y(p.gw); });
    s('path', { class: 'c-area', d: d + 'L' + X(x1) + ',' + Y(0) + 'Z' }, svg);
    s('path', { class: 'c-line', d: d.replace('M' + X(x0) + ',' + Y(0) + 'L', 'M') }, svg);

    var last = series[series.length - 1];
    s('circle', { class: 'c-dot', cx: X(x1), cy: Y(last.gw), r: 5 }, svg);
    var endLabel = s('text', { class: 'c-val-text', x: X(x1) - 8, y: Y(last.gw) - 12, 'text-anchor': 'end' }, svg);
    endLabel.textContent = fmt(last.gw, 2) + ' GW';

    var cross = s('line', { class: 'c-cross', x1: 0, x2: 0, y1: m.t, y2: m.t + ih, visibility: 'hidden' }, svg);
    var dot = s('circle', { class: 'c-dot', r: 5, visibility: 'hidden' }, svg);
    var idx = series.length - 1;

    function showAt(i) {
      idx = Math.max(0, Math.min(series.length - 1, i));
      var p = series[idx];
      var cx = X(p.year + 0.5);
      cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.setAttribute('visibility', 'visible');
      dot.setAttribute('cx', cx); dot.setAttribute('cy', Y(p.gw)); dot.setAttribute('visibility', 'visible');
      var scale = plot.clientWidth / width;
      tip.show(cx * scale, Y(p.gw) * scale, fmt(p.gw, 2) + ' GW in ' + p.year, p.added.length ? p.added.join(', ') : 'No change');
    }
    function hide() { cross.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); tip.hide(); }

    svg.addEventListener('pointermove', function (e) {
      var r = svg.getBoundingClientRect();
      var px = ((e.clientX - r.left) / r.width) * width;
      showAt(Math.floor(x0 + ((px - m.l) / iw) * (x1 - x0)) - x0);
    });
    svg.addEventListener('pointerleave', hide);
    svg.addEventListener('focus', function () { showAt(idx); });
    svg.addEventListener('blur', hide);
    svg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); showAt(idx - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); showAt(idx + 1); }
    });
  }

  /* ---------------------------------------------------------
     2c. CHART — today vs targets (columns; targets outlined)
     --------------------------------------------------------- */
  function renderTargets(plot, data, tip) {
    var width = plot.clientWidth;
    var height = width < 480 ? 240 : 290;
    var m = { t: 26, r: 8, b: 44, l: 36 };
    var iw = width - m.l - m.r, ih = height - m.t - m.b;
    var yMax = 100;
    function Y(v) { return m.t + ih - (v / yMax) * ih; }
    var band = iw / data.length;
    var colW = Math.min(64, band * 0.55);

    plot.textContent = '';
    var svg = s('svg', { viewBox: '0 0 ' + width + ' ' + height, width: width, height: height, role: 'list',
      'aria-label': 'Installed nuclear capacity compared with national targets' }, plot);
    for (var g = 0; g <= yMax; g += 25) {
      s('line', { class: 'c-grid', x1: m.l, x2: width - m.r, y1: Y(g), y2: Y(g) }, svg);
      var t = s('text', { class: 'c-axis-text', x: m.l - 8, y: Y(g) + 4, 'text-anchor': 'end' }, svg);
      t.textContent = g;
    }
    data.forEach(function (d, i) {
      var cx = m.l + band * i + band / 2;
      var x = cx - colW / 2, y = Y(d.value), hgt = Y(0) - y;
      var grp = s('g', { role: 'listitem' }, svg);
      var r = Math.min(4, hgt / 2);
      var path = 'M' + x + ',' + Y(0) + 'v' + (-(hgt - r)) + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + (-r) +
        'h' + (colW - 2 * r) + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r + 'v' + (hgt - r) + 'Z';
      s('path', { class: d.kind === 'actual' ? 'c-col' : 'c-col-target', d: path }, grp);
      var v = s('text', { class: 'c-val-text', x: cx, y: y - 8, 'text-anchor': 'middle' }, grp);
      v.textContent = fmt(d.value, d.value < 50 ? 2 : 0) + ' GW';
      var words = d.label.split(' ');
      var l1 = s('text', { class: 'c-axis-text', x: cx, y: height - 24, 'text-anchor': 'middle' }, grp);
      l1.textContent = words[0];
      var l2 = s('text', { class: 'c-axis-text', x: cx, y: height - 8, 'text-anchor': 'middle' }, grp);
      l2.textContent = words.slice(1).join(' ');
      var hit = s('rect', { class: 'c-hit', x: cx - band / 2, y: m.t, width: band, height: ih, tabindex: 0,
        'aria-label': d.label + ': ' + fmt(d.value, 2) + ' gigawatts' }, grp);
      function show() { tip.show(cx, y, fmt(d.value, d.value < 50 ? 2 : 0) + ' GW', d.kind === 'actual' ? d.label : d.label + ' (planned)'); }
      hit.addEventListener('pointerenter', show);
      hit.addEventListener('pointerleave', tip.hide);
      hit.addEventListener('focus', show);
      hit.addEventListener('blur', tip.hide);
    });
  }

  function initIndia() {
    var series = capacitySeries();
    var hRoot = $('[data-history]');
    var tRoot = $('[data-targets]');
    if (hRoot) {
      var hPlot = $('[data-history-plot]', hRoot);
      var hTip = makeTooltip(hRoot, hPlot);
      onResize(hPlot, function () { renderHistory(hPlot, series, hTip); });
      makeTable($('[data-history-table]', hRoot), ['Year', 'Change', 'Installed GW'],
        series.filter(function (p) { return p.added.length; }).map(function (p) { return [String(p.year), p.added.join(', '), fmt(p.gw, 2)]; }));
    }
    if (tRoot) {
      var tPlot = $('[data-targets-plot]', tRoot);
      var tTip = makeTooltip(tRoot, tPlot);
      onResize(tPlot, function () { renderTargets(tPlot, DATA.targets, tTip); });
      makeTable($('[data-targets-table]', tRoot), ['', 'GW'], DATA.targets.map(function (d) { return [d.label, fmt(d.value, 2)]; }));
    }
    var src = $('[data-india-source]');
    if (src) src.textContent = DATA.indiaSource;
  }

  /* ---------------------------------------------------------
     3. LEGACY — dimension string widths follow the real years
     --------------------------------------------------------- */
  function initDimension() {
    var dim = $('[data-dimension]');
    if (!dim) return;
    var founded = parseInt(dim.getAttribute('data-founded'), 10);
    var now = parseInt(dim.getAttribute('data-now'), 10) || new Date().getFullYear();
    var handover = parseInt(dim.getAttribute('data-handover'), 10);
    var known = !isNaN(handover) && handover > founded && handover < now;
    var share = known ? (handover - founded) / (now - founded) : 0.6;
    $('.dim-seg-1', dim).style.flexBasis = (share * 100) + '%';
    $('.dim-seg-2', dim).style.flexBasis = ((1 - share) * 100) + '%';
    var years = now - founded;
    $('.dim-label strong', dim).textContent = years + ' years';
    $('[data-year-founded]', dim).textContent = founded;
    var hy = $('[data-year-handover]', dim);
    if (known) { hy.textContent = handover; hy.classList.remove('fill-in'); }
    else { hy.textContent = '[year]'; hy.classList.add('fill-in'); }
    dim.setAttribute('aria-label', years + ' years, ' + founded + ' to today: first generation from ' + founded +
      (known ? ', second generation from ' + handover : ', then the second generation') + ' to today');
  }

  /* ---------------------------------------------------------
     4. PROJECTS — link the site cards and map markers
     --------------------------------------------------------- */
  function initProjects() {
    var cards = $all('[data-site]');
    var markers = $all('.map-site');
    if (!cards.length) return;
    function activate(id, scroll) {
      cards.forEach(function (c) { c.classList.toggle('is-active', c.getAttribute('data-site') === id); });
      markers.forEach(function (mk) { mk.classList.toggle('is-active', mk.getAttribute('data-marker') === id); });
      if (scroll) {
        var card = $('[data-site="' + id + '"]');
        if (card && window.matchMedia('(max-width: 860px)').matches) card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      }
    }
    cards.forEach(function (c) {
      var id = c.getAttribute('data-site');
      c.addEventListener('pointerenter', function () { activate(id); });
      c.addEventListener('focusin', function () { activate(id); });
      var btn = $('button', c);
      if (btn) btn.addEventListener('click', function () { activate(id); });
    });
    markers.forEach(function (mk) {
      var id = mk.getAttribute('data-marker');
      function go() { activate(id, true); }
      mk.addEventListener('click', go);
      mk.addEventListener('focus', function () { activate(id); });
      mk.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    activate(cards[0].getAttribute('data-site'));
  }

  /* ---------------------------------------------------------
     5. CONTACT — Google Form in a dialog (falls back to new tab / email)
     --------------------------------------------------------- */
  function initForm() {
    var opener = $('[data-form-open]');
    var dialog = $('[data-form-dialog]');
    if (!opener) return;
    var url = opener.getAttribute('href') || '';
    var configured = /docs\.google\.com\/forms\//.test(url) && url.indexOf('YOUR_FORM_ID') === -1;
    if (!configured) {
      // No form linked yet: send people to email instead of a broken link.
      opener.setAttribute('href', 'mailto:info@oecc.co.in?subject=Enquiry%20from%20website');
      opener.removeAttribute('target');
      console.warn('[OECC] Google Form link not set. Paste it into the "Open the enquiry form" button in index.html.');
      return;
    }
    if (!dialog || typeof dialog.showModal !== 'function') return; // browser opens the form in a new tab
    var frame = $('[data-form-frame]', dialog);
    var embed = url.replace(/\/viewform.*$/, '/viewform') + '?embedded=true';
    $('[data-form-newtab]', dialog).setAttribute('href', url);

    opener.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return; // let people open a tab on purpose
      e.preventDefault();
      if (!frame.getAttribute('src')) frame.setAttribute('src', embed);
      dialog.showModal();
    });
    $('[data-form-close]', dialog).addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
  }

  /* ---------------------------------------------------------
     6. MEDIA + HOUSEKEEPING
     --------------------------------------------------------- */
  function initLazyVideo() {
    var vids = $all('video[data-lazy-video]');
    if (!vids.length) return;
    function load(v) {
      $all('source[data-src]', v).forEach(function (src) { src.src = src.getAttribute('data-src'); src.removeAttribute('data-src'); });
      v.load();
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }
    if (reduceMotion) return; // keep the still poster
    if (!('IntersectionObserver' in window)) { vids.forEach(load); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) {
          if ($('source[data-src]', v)) load(v); else { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        } else if (!v.paused) { v.pause(); }
      });
    }, { rootMargin: '200px 0px' });
    vids.forEach(function (v) { io.observe(v); });
  }

  function housekeeping() {
    $all('[data-year]').forEach(function (n) { n.textContent = new Date().getFullYear(); });
    var dim = $('[data-dimension]');
    var founded = dim && dim.getAttribute('data-founded');
    if (founded) $all('[data-founded]').forEach(function (n) { if (n !== dim) n.textContent = founded; });
    var todo = $all('.fill-in');
    if (todo.length) console.warn('[OECC] ' + todo.length + ' placeholder(s) still need real content:', todo.map(function (n) { return n.textContent.trim(); }));
  }

  function init() {
    housekeeping();
    initNav();
    initCompare();
    initIndia();
    initDimension();
    initProjects();
    initForm();
    initLazyVideo();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
