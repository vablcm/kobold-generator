import { boons, races } from './data.js';

export function enableOrDisableElement(element, disable) {
    element.classList.toggle('disabled', disable);

    let tooltipWrapper = element.parentElement;
    if (disable) {
        if (!tooltipWrapper || !tooltipWrapper.classList.contains('tooltip-wrapper')) {
            tooltipWrapper = document.createElement('div');
            tooltipWrapper.classList.add('tooltip-wrapper');
            element.parentNode.insertBefore(tooltipWrapper, element);
            tooltipWrapper.appendChild(element);
        }

        tooltipWrapper.title = element.dataset.requirementTooltip;
        element.classList.remove('selected');
        return "disabled";
    } else if (tooltipWrapper && tooltipWrapper.classList.contains('tooltip-wrapper')) {
        tooltipWrapper.parentNode.insertBefore(element, tooltipWrapper);
        tooltipWrapper.remove();
    }
}

export function formatProb(prob) {
    const percentage = prob * 100;
    if (percentage >= 1) {
        return ` (${percentage.toFixed(0)}%)`;
    } else if (percentage >= 0.1) {
        return ` (${percentage.toFixed(1)}%)`;
    } else {
        return ` (${percentage.toFixed(2)}%)`;
    }
}

function updateHalfboons() {
    const previouslySelectedHalfboons = new Set(
        Array.from(document.querySelectorAll('.halfboons .option.halfboon.selected'))
            .map(el => el.dataset.name || el.textContent.split(' (')[0].trim())
    );

    const selectedBoonsForHalf = Array.from(document.querySelectorAll('.option.boon.selected'))
        .filter(el => parseFloat(el.dataset.prob) >= 1)
        .map(el => boons.find(b => b.name === (el.dataset.name || el.textContent.split(' (')[0].trim())))
        .filter(Boolean);

    renderList('.halfboons', selectedBoonsForHalf, 'halfboon');

    document.querySelectorAll('.halfboons .option.halfboon').forEach(el => {
        const name = el.dataset.name || el.textContent.split(' (')[0].trim();
        if (previouslySelectedHalfboons.has(name)) el.classList.add('selected');
    });

    updateListHeight(document.querySelector('.halfboons'));
}

export function onItemClick(li, item, type) {
    li.classList.toggle('selected');

    if (item.afterToggle) item.afterToggle();

    switch (type) {
        case 'boon': {
            updateHalfboons();
            break;
        }
        case 'race':
            updateRace(li, item);
            break;
        case 'drawback':
        case 'halfboon':
        default:
            break;
    }

    enableOrDisableIncompatibleTraits(item, li.classList.contains('selected'));
}

function enableOrDisableIncompatibleTraits(item, disable) {
    if (!item || !item.incompatible) return;

    const incompatibleLi = document.querySelector(`.option[data-name="${item.incompatible}"]`);
    if (!incompatibleLi) return;

    enableOrDisableElement(incompatibleLi, disable);
}

function updateRace(li) {
    const isSelected = li.classList.contains('selected');

    document.querySelectorAll('.option.race.selected').forEach(other => {
        if (other !== li) {
            other.classList.remove('selected');
            races.forEach(race => enableOrDisableIncompatibleTraits(race, false));
        }
    });

    if (isSelected) li.classList.add('selected');
}

function updateListHeight(list) {
    if (!list || list.classList.contains('collapsed')) return;
    list.style.maxHeight = list.scrollHeight + 'px';
}

export function renderList(containerSelector, items, type) {
    const container = document.querySelector(containerSelector);
    container.innerHTML = "";
    items.forEach(item => {
        const li = document.createElement('li');
        li.classList.add('option', type);

        li.textContent = item.name;
        li.dataset.name = item.name;

        if (type === 'boon' || type === 'drawback') {
            li.dataset.prob = item.prob;
            const probability = item.prob < 1 ? `${formatProb(item.prob)}` : "";
            li.textContent += probability;
        } else if (type === 'halfboon') {
            li.dataset.prob = 0.5;
            li.textContent += ' (50%)';
        }

        if (item.element) li.dataset.element = item.element;

        const requirementTooltips = [];
        if (item.incompatible) requirementTooltips.push(`Incompatible with ${item.incompatible}`);
        if (item.requirementTooltip) requirementTooltips.push(item.requirementTooltip);
        if (requirementTooltips.length > 0) li.dataset.requirementTooltip = requirementTooltips.join("\n");

        li.addEventListener('click', () => onItemClick(li, item, type));

        container.appendChild(li);
        if (item.disabled) enableOrDisableElement(li, item.disabled);
    });
}

export function mergeHalfboonsRespectRaceGuarantee(boonsPool, selectedHalfboons) {
    // Build a map from the current pool (after race.applyTraits)
    const byName = new Map(boonsPool.map(b => [b.name, b]));

    selectedHalfboons.forEach(src => {
        const existing = byName.get(src.name);
        if (existing) {
            // If the race explicitly guaranteed it, leave it alone (stays common)
            if (existing._guaranteedByRace === true) return;

            // Otherwise, force it to be a rare roll at 0.5
            const copy = { ...existing, _biasedProb: 0.5, prob: existing.prob }; // keep original prob but bias to 0.5
            byName.set(src.name, copy);
        } else {
            // Not in pool yet → add as a 0.5 rare roll
            byName.set(src.name, { ...src, _biasedProb: 0.5, prob: src.prob ?? 0.5 });
        }
    });

    return Array.from(byName.values());
}

// ---- helpers ----
function effectiveProb(item) {
    return item._biasedProb ?? item.prob ?? 0;
}

function expandDependencies(item, items) {
    const dep = item.rolledAfter;
    if (!dep) return [];
    if (!dep.includes('*')) return [dep];

    // Wildcard: e.g. "Elemental Resistance: *"
    const prefix = dep.replace('*', '').trim();
    return items.filter(x => x.name.startsWith(prefix)).map(x => x.name);
}

function canProcess(item, items, decidedSet) {
    const deps = expandDependencies(item, items);
    return deps.every(d => decidedSet.has(d));
}

function anyDependencySucceeded(item, items, succeededSet) {
    const deps = expandDependencies(item, items);
    return deps.some(d => succeededSet.has(d));
}

function applyRoll(item, results, succeededSet) {
    const p = effectiveProb(item);
    if (p >= 1) {
        results.common.push(item.name);
        succeededSet.add(item.name);
    } else if (Math.random() < p) {
        results.rare.push(item.name);
        succeededSet.add(item.name);
    }
}

// One pass trying to process all items whose deps are decided.
function processPass(items, decidedSet, succeededSet, results) {
    let progressed = false;

    for (const it of items) {
        if (decidedSet.has(it.name)) continue;

        // wait for deps
        if (!canProcess(it, items, decidedSet)) continue;

        // skip if any dependency succeeded
        if (anyDependencySucceeded(it, items, succeededSet)) {
            decidedSet.add(it.name);
            progressed = true;
            continue;
        }

        // roll/apply
        applyRoll(it, results, succeededSet);
        decidedSet.add(it.name);
        progressed = true;
    }

    return progressed;
}

function cycleFallback(items, decidedSet, succeededSet, results) {
    for (const it of items) {
        if (decidedSet.has(it.name)) continue;
        applyRoll(it, results, succeededSet);
        decidedSet.add(it.name);
    }
}

// ---- main ----
export function computeItems(items) {
    const filteredItems = items.filter(item => !item.name.startsWith("Diversify:"));
    const results = { common: [], rare: [] };
    const succeededSet = new Set(); // names that succeeded
    const decidedSet = new Set();   // names processed (success or not)

    const maxPasses = filteredItems.length * 2;
    for (let pass = 0; decidedSet.size < filteredItems.length && pass < maxPasses; pass++) {
        const progressed = processPass(filteredItems, decidedSet, succeededSet, results);
        if (!progressed) {
            cycleFallback(filteredItems, decidedSet, succeededSet, results);
            break;
        }
    }

    return results;
}

