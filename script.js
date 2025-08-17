import { races, boons, drawbacks } from './data.js';
import { randomizeSelections } from './test-helper.js';
import { computeItems, mergeHalfboonsRespectRaceGuarantee, renderList } from './utils.js';

// ===== Generation logic =====
function getSelectedItems(selector, dataArray) {
  return Array.from(document.querySelectorAll(selector))
    .map(li => dataArray.find(d => d.name === li.dataset.name))
    .filter(Boolean);
}

function fillList(root, selector, arr) {
  const ul = root.querySelector(selector);
  ul.innerHTML = '';
  arr.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    ul.appendChild(li);
  });
}

function computeRace() {
  const selectedBonusRaces = Array.from(document.querySelectorAll('.option.boon.selected'))
    .filter(li => li.textContent.startsWith("Diversify:"));

  const successes = selectedBonusRaces.filter((li) => Math.random() < li.dataset.prob);

  let raceLi;
  if (successes.length > 0) {
    raceLi = successes[Math.floor(Math.random() * successes.length)];
  } else {
    raceLi = document.querySelector('.option.race.selected');
  }

  return raceLi ? races.find(race => raceLi.textContent.includes(race.name)) : { name: "No race selected" };
}

function generateKobolds() {
  const countInput = document.getElementById('koboldCount');
  const koboldNumber = Math.max(1, Math.min(100, parseInt(countInput?.value || '1', 10)));
  const results = document.getElementById('koboldsResults');
  const template = document.getElementById('koboldItemTemplate');

  const selectedBoons = getSelectedItems('.option.boon.selected', boons);
  const selectedDrawbacks = getSelectedItems('.option.drawback.selected', drawbacks);
  const selectedHalfboons = getSelectedItems('.option.halfboon.selected', boons)
    .map(item => ({ ...item, prob: 0.5 }));

  results.innerHTML = '';

  for (let i = 0; i < koboldNumber; i++) {
    const node = template.content.cloneNode(true);

    const race = computeRace();
    node.querySelector('.raceValue').textContent = race.name;

    // per-kobold copies so biases/injections don’t leak to other kobolds
    const boonsPool = selectedBoons.map(b => ({ ...b, _biasedProb: undefined }));
    const drawbacksPool = selectedDrawbacks.map(d => ({ ...d, _biasedProb: undefined }));

    // Let the race add items (e.g., Mercy Magnet) and bias probabilities
    race?.applyTraits?.({
      selectedBoons: boonsPool,
      selectedDrawbacks: drawbacksPool,
    });

    const boonResult = computeItems(mergeHalfboonsRespectRaceGuarantee(boonsPool, selectedHalfboons));
    const drawbackResult = computeItems(drawbacksPool);

    fillList(node, '.rareBoons', boonResult.rare);
    fillList(node, '.commonBoons', boonResult.common);
    fillList(node, '.rareDrawbacks', drawbackResult.rare);
    fillList(node, '.commonDrawbacks', drawbackResult.common);

    results.appendChild(node);
  }
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  renderList('.races', races, 'race');
  renderList('.boons', boons, 'boon');
  renderList('.drawbacks', drawbacks, 'drawback');

  document.querySelectorAll('.collapsible').forEach(title => {
    let list = title.nextElementSibling;
    if (list && list.tagName !== 'UL') list = list.querySelector('ul');
    if (!list) return;

    list.classList.remove('collapsed');
    list.style.maxHeight = list.scrollHeight + 'px';

    title.addEventListener('click', () => {
      const collapsed = list.classList.toggle('collapsed');
      title.classList.toggle('collapsed', collapsed);
      list.style.maxHeight = collapsed ? '0' : list.scrollHeight + 'px';
    });
  });

  // Generate button
  const genBtn = document.getElementById('generateKobolds');
  if (genBtn) genBtn.addEventListener('click', generateKobolds);
});

Object.assign(window, { randomizeSelections });
