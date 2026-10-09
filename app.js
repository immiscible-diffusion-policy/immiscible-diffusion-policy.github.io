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
      segment.textContent = value >= 10 ? `${format(value)}%` : '';
      rail.append(segment);
    });
    row.append(name,rail);
    bars.append(row);
  }
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
fetch('data/results.json').then(response => {
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

// Progressive enhancement: content stays visible without JavaScript or motion support.
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const revealBlocks = [...document.querySelectorAll(
    '#overview, #collapse, #method, #experiments, #results > .container > .section-heading, ' +
    '.results-explorer, #training-results, #all-results, #conclusion, .implementation-section, #citation'
  )];
  const reveal = block => {
    block.classList.remove('reveal-pending');
    revealObserver.unobserve(block);
  };
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) reveal(entry.target);
    });
  }, {rootMargin: '0px 0px -40px 0px', threshold: 0});
  revealBlocks.forEach(block => {
    if (block.getBoundingClientRect().top >= window.innerHeight - 40) {
      block.classList.add('scroll-reveal', 'reveal-pending');
      revealObserver.observe(block);
    }
  });
  const revealTarget = target => {
    if (!target) return;
    revealBlocks.forEach(block => {
      if (block.contains(target) || target.contains(block)) reveal(block);
    });
  };
  const revealHash = () => {
    try {
      revealTarget(document.getElementById(decodeURIComponent(location.hash.slice(1))));
    } catch (_) { /* Ignore malformed fragment identifiers. */ }
  };
  revealHash();
  window.addEventListener('hashchange', revealHash);
  document.addEventListener('focusin', event => revealTarget(event.target));
  reducedMotion.addEventListener('change', event => {
    if (event.matches) {
      revealBlocks.forEach(reveal);
      revealObserver.disconnect();
    }
  });
}
