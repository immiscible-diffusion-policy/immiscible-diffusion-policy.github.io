'use strict';
const tabs = [...document.querySelectorAll('.task-tab')];
const panel = document.getElementById('result-panel');
let tasks = [];
let selectedTask = 'pusht';
const format = value => Number(value).toFixed(2).replace(/\.00$/, '');
const rolloutImage = document.getElementById('task-rollout-image');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let rolloutPaused = reducedMotion.matches;
let rolloutVisible = !('IntersectionObserver' in window);
let activeRollout = null;
function syncRollout() {
  if (!activeRollout) return;
  const playing = !rolloutPaused && rolloutVisible && !document.hidden;
  const src = playing ? activeRollout.gif : activeRollout.still;
  if (rolloutImage.getAttribute('src') !== src) rolloutImage.src = src;
}
function renderRollout(task) {
  const illustration = document.getElementById('task-illustration');
  const illustrationImage = document.getElementById('task-illustration-image');
  illustration.hidden = !task.illustration;
  document.querySelector('.task-introduction').classList.toggle('has-task-illustration', Boolean(task.illustration));
  if (task.illustration) {
    illustrationImage.src = task.illustration.src;
    illustrationImage.alt = task.illustration.alt;
    illustrationImage.width = task.illustration.width;
    illustrationImage.height = task.illustration.height;
  }
  const media = document.querySelector('.task-media');
  const rolloutRatio = task.rollout.width / task.rollout.height;
  const illustrationRatio = task.illustration ? task.illustration.width / task.illustration.height : 0;
  // Equal visual height, native proportions, and one consistent gap between images.
  media.style.setProperty('--illustration-column', `${illustrationRatio || 1}fr`);
  media.style.setProperty('--rollout-column', `${rolloutRatio}fr`);
  media.style.setProperty('--media-width', `${160 * (illustrationRatio + rolloutRatio) + (task.illustration ? 12 : 0)}px`);
  activeRollout = task.rollout;
  rolloutImage.alt = activeRollout.count
    ? `${activeRollout.count} example Immiscible Diffusion Policy rollouts for ${task.name}`
    : `Example Immiscible Diffusion Policy rollout for ${task.name}`;
  rolloutImage.width = activeRollout.width;
  rolloutImage.height = activeRollout.height;
  syncRollout();
}
reducedMotion.addEventListener('change', event => {
  rolloutPaused = event.matches;
  syncRollout();
});
document.addEventListener('visibilitychange', syncRollout);
if ('IntersectionObserver' in window) {
  const rolloutObserver = new IntersectionObserver(entries => {
    rolloutVisible = entries[0].isIntersecting;
    syncRollout();
  });
  rolloutObserver.observe(rolloutImage);
}
const labelCanvas = document.createElement('canvas');
const labelContext = labelCanvas.getContext('2d');
const svgNamespace = 'http://www.w3.org/2000/svg';
function svgElement(name, attributes = {}) {
  const element = document.createElementNS(svgNamespace, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}
function layoutDistributionLabels() {
  document.querySelectorAll('.distribution-row').forEach((row, rowIndex) => {
    row.querySelector('.bar-callouts')?.remove();
    const rail = row.querySelector('.bar-rail');
    const width = rail.clientWidth;
    if (!width) return;
    const segments = [...rail.children];
    const total = segments.reduce((sum, segment) => sum + Number(segment.dataset.value), 0);
    labelContext.font = '13px Arial';
    let cumulative = 0;
    const labels = [];
    segments.forEach((segment, segmentIndex) => {
      const value = Number(segment.dataset.value);
      const text = `${format(value)}%`;
      const fraction = value / total;
      const fits = value >= 10 && width * fraction >= labelContext.measureText(text).width + 12;
      segment.textContent = fits ? text : '';
      if (!fits) {
        labels.push({text, segmentIndex, color: getComputedStyle(segment).backgroundColor,
          anchor: width * (cumulative + fraction / 2),
          width: labelContext.measureText(text).width + 8});
      }
      cumulative += fraction;
    });
    if (!labels.length) return;
    // Spread adjacent labels within the chart, retaining their left to right order.
    const lanes = [[]];
    let used = 0;
    labels.forEach(label => {
      if (used && used + 10 + label.width > width - 4) {
        lanes.push([]);
        used = 0;
      }
      lanes[lanes.length - 1].push(label);
      used += label.width + (used ? 10 : 0);
    });
    const height = 40 + (lanes.length - 1) * 24;
    const svg = svgElement('svg', {class: 'bar-callouts', viewBox: `0 0 ${width} ${height}`,
      width, height, 'aria-hidden': 'true', focusable: 'false'});
    const defs = svgElement('defs');
    labels.forEach(label => {
      label.markerId = `bar-arrow-${rowIndex}-${label.segmentIndex}`;
      const marker = svgElement('marker', {id: label.markerId, viewBox: '0 0 6 6', refX: 5, refY: 3,
        markerWidth: 5, markerHeight: 5, orient: 'auto'});
      marker.append(svgElement('path', {d: 'M 0 0 L 6 3 L 0 6 Z', fill: label.color}));
      defs.append(marker);
    });
    svg.append(defs);
    const arrows = svgElement('g');
    const texts = svgElement('g');
    lanes.forEach((lane, laneIndex) => {
      lane.forEach((label, index) => {
        label.center = Math.max(label.width / 2 + 2, Math.min(width - label.width / 2 - 2, label.anchor));
        if (index) label.center = Math.max(label.center,
          lane[index - 1].center + lane[index - 1].width / 2 + label.width / 2 + 10);
      });
      for (let i = lane.length - 1; i >= 0; i--) {
        const limit = i === lane.length - 1 ? width - lane[i].width / 2 - 2
          : lane[i + 1].center - lane[i + 1].width / 2 - lane[i].width / 2 - 10;
        lane[i].center = Math.min(lane[i].center, limit);
      }
      lane.forEach(label => {
        const baseline = 33 + laneIndex * 24;
        const anchor = Math.max(2, Math.min(width - 2, label.anchor));
        arrows.append(svgElement('path', {d: `M ${label.center} ${baseline - 13} L ${anchor} 2`,
          fill: 'none', stroke: label.color, 'stroke-width': 1, 'marker-end': `url(#${label.markerId})`}));
        texts.append(svgElement('rect', {x: label.center - label.width / 2, y: baseline - 11,
          width: label.width, height: 15, fill: '#fff'}));
        const text = svgElement('text', {x: label.center, y: baseline, 'text-anchor': 'middle', fill: label.color});
        text.textContent = label.text;
        texts.append(text);
      });
    });
    svg.append(arrows, texts);
    row.append(svg);
  });
}
let chartWidth = 0;
if ('ResizeObserver' in window) {
  new ResizeObserver(entries => {
    const width = entries[0].contentRect.width;
    if (Math.abs(width - chartWidth) > 0.5) {
      chartWidth = width;
      layoutDistributionLabels();
    }
  }).observe(document.getElementById('distribution-bars'));
} else {
  window.addEventListener('resize', layoutDistributionLabels);
}
function renderTask(id, focus = false) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  selectedTask = id;
  renderRollout(task);
  tabs.forEach(tab => {
    const selected = tab.dataset.task === id;
    tab.setAttribute('aria-selected', selected);
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  });
  panel.setAttribute('aria-labelledby', `tab-${id}`);
  document.getElementById('task-title').textContent = task.name;
  document.getElementById('result-meta').textContent = task.environment;
  const modalityList = document.getElementById('task-modalities');
  modalityList.replaceChildren(...task.modalities.map(label => {
    const item = document.createElement('li');
    item.textContent = label;
    return item;
  }));
  document.getElementById('takeaway').textContent = task.takeaway;
  document.getElementById('result-description').textContent = task.description;
  document.getElementById('performance-title').textContent = `Task ${task.metric.toLowerCase()}`;
  document.getElementById('vanilla-performance').textContent = `${format(task.performance[0])}%`;
  document.getElementById('ours-performance').textContent = `${format(task.performance[1])}%`;
  const bars = document.getElementById('distribution-bars');
  bars.replaceChildren();
  for (const [key, label] of [['vanilla', 'Vanilla'], ['ours', 'Immiscible']]) {
    const row = document.createElement('div');
    row.className = 'distribution-row';
    const name = document.createElement('p');
    name.className = `distribution-label ${key === 'ours' ? 'ours-label' : ''}`;
    name.textContent = label;
    const rail = document.createElement('div');
    rail.className = 'bar-rail';
    rail.setAttribute('role', 'img');
    rail.setAttribute('aria-label', `${label}: ${task[key].map((v,i) => `${task.frequencyLabels[i]} ${format(v)} percent`).join(', ')}`);
    task[key].forEach((value, index) => {
      const segment = document.createElement('span');
      segment.className = `bar-segment mode-${index + 1}`;
      segment.style.flexGrow = value;
      segment.setAttribute('aria-hidden', 'true');
      segment.dataset.value = value;
      rail.append(segment);
    });
    row.append(name,rail);
    bars.append(row);
  }
  layoutDistributionLabels();
  const legend = document.getElementById('mode-legend');
  legend.replaceChildren();
  task.ours.forEach((_,index) => {
    const item = document.createElement('span');
    const swatch = document.createElement('i');
    swatch.className = `mode-${index+1}`;
    swatch.setAttribute('aria-hidden','true');
    item.append(swatch, task.frequencyLabels[index]);
    legend.append(item);
  });
}
tabs.forEach((tab,index) => {
  tab.addEventListener('click', () => renderTask(tab.dataset.task));
  tab.addEventListener('keydown', event => {
    const targets = {ArrowRight:(index+1)%tabs.length, ArrowLeft:(index-1+tabs.length)%tabs.length, Home:0, End:tabs.length-1};
    if (event.key in targets) {
      event.preventDefault();
      renderTask(tabs[targets[event.key]].dataset.task, true);
    }
  });
});
fetch('data/results.json?v=task-panels-2', {cache: 'no-cache'}).then(response => {
  if (!response.ok) throw new Error('Unable to load results');
  return response.json();
}).then(data => { tasks = data.tasks; renderTask(selectedTask); }).catch(() => {
  document.getElementById('distribution-bars').textContent = 'The interactive chart could not load. View the complete results in the table below.';
});
document.querySelectorAll('[data-select-task]').forEach(link => link.addEventListener('click', () => {
  selectedTask = link.dataset.selectTask;
  renderTask(selectedTask);
}));
const collapseVideo = document.getElementById('collapse-video');
let collapseVisible = !('IntersectionObserver' in window);
function syncCollapseVideo() {
  if (collapseVisible && !reducedMotion.matches && !document.hidden) {
    collapseVideo.play().catch(() => {});
  } else {
    collapseVideo.pause();
  }
}
reducedMotion.addEventListener('change', syncCollapseVideo);
document.addEventListener('visibilitychange', syncCollapseVideo);
if ('IntersectionObserver' in window) {
  const collapseObserver = new IntersectionObserver(entries => {
    collapseVisible = entries[0].isIntersecting;
    syncCollapseVideo();
  }, {threshold: 0.15});
  collapseObserver.observe(collapseVideo);
} else {
  syncCollapseVideo();
}
const demo = document.getElementById('demo-video');
// A visitor controls playback; pause media that has left the screen.
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) entry.target.pause();
  }), {threshold:0});
  observer.observe(demo);
}
document.getElementById('copy-citation').addEventListener('click', async () => {
  const content = document.getElementById('bibtex').textContent;
  const status = document.getElementById('copy-status');
  try {
    if (!navigator.clipboard) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(content);
    status.textContent = 'Citation copied.';
    document.getElementById('copy-citation').textContent = 'Copied';
  } catch (_) {
    const range = document.createRange();
    range.selectNodeContents(document.getElementById('bibtex'));
    const selection = window.getSelection();
    selection.removeAllRanges(); selection.addRange(range);
    status.textContent = 'Citation selected. Copy it, or download the .bib file below.';
  }
});

// Progressive enhancement: every section reveals on entry, without hiding content
// from visitors who disable JavaScript or request reduced motion.
if ('IntersectionObserver' in window) {
  const revealBlocks = [...document.querySelectorAll(
    '#overview, #collapse, #method, #results > .container > .section-heading, ' +
    '.results-explorer, #training-results, #all-results, #conclusion, .implementation-section, #citation'
  )];
  let revealObserver;
  const show = block => block.classList.remove('reveal-pending');
  const configureReveals = () => {
    if (revealObserver) revealObserver.disconnect();
    if (reducedMotion.matches) {
      revealBlocks.forEach(show);
      return;
    }
    const inset = Math.min(100, Math.round(window.innerHeight * 0.12));
    revealBlocks.forEach(block => {
      const rect = block.getBoundingClientRect();
      block.classList.add('scroll-reveal');
      block.classList.toggle('reveal-pending',
        (rect.top >= window.innerHeight - inset || rect.bottom <= 0) &&
        !block.contains(document.activeElement));
    });
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const focused = entry.target.contains(document.activeElement);
        entry.target.classList.toggle('reveal-pending', !entry.isIntersecting && !focused);
      });
    }, {rootMargin: `0px 0px -${inset}px 0px`, threshold: 0});
    revealBlocks.forEach(block => revealObserver.observe(block));
  };
  const showTarget = target => {
    if (!target) return;
    revealBlocks.filter(block => block.contains(target)).forEach(show);
    // A parent anchor such as #results reveals its first block, not every later figure.
    const firstChildBlock = revealBlocks.find(block => target.contains(block));
    if (firstChildBlock) show(firstChildBlock);
  };
  const showHash = () => {
    try {
      showTarget(document.getElementById(decodeURIComponent(location.hash.slice(1))));
    } catch (_) { /* Ignore malformed fragment identifiers. */ }
  };
  configureReveals();
  showHash();
  window.addEventListener('hashchange', showHash);
  document.addEventListener('focusin', event => showTarget(event.target));
  reducedMotion.addEventListener('change', configureReveals);
  let resizeFrame;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(configureReveals);
  });
}
