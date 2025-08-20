import { computeItems } from './calculator.js';
import { nextTwinColor, resetTwinColors } from './colors.js';
import { races, boons, drawbacks } from './data.js';

/* LIST RENDERING */
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

function formatProb(prob) {
    const percentage = prob * 100;
    if (percentage >= 1) {
        return ` (${percentage.toFixed(0)}%)`;
    } else if (percentage >= 0.1) {
        return ` (${percentage.toFixed(1)}%)`;
    } else {
        return ` (${percentage.toFixed(2)}%)`;
    }
}

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

function updateListHeight(list) {
    if (!list || list.classList.contains('collapsed')) return;
    list.style.maxHeight = list.scrollHeight + 'px';
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

function enableOrDisableIncompatibleTraits(item, disable) {
    if (!item || !item.incompatible) return;

    const incompatibleLi = document.querySelector(`.option[data-name="${item.incompatible}"]`);
    if (!incompatibleLi) return;

    enableOrDisableElement(incompatibleLi, disable);
}

function mergeHalfboonsRespectRaceGuarantee(boonsPool, selectedHalfboons) {
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

/* GENERATION RENDERING */
const tick = () => new Promise(res => setTimeout(res, 0));

export async function onGenerateClick() {
    const btn = document.getElementById('generateKobolds');
    if (btn.disabled) return;

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Generating...";

    await tick();

    try {
        await generateKoboldsAsync();
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function generateKoboldsAsync() {
    resetTwinColors();

    const countInput = document.getElementById('koboldCount');
    const koboldNumber = Math.max(1, Math.min(1000, parseInt(countInput?.value || '1', 10)));
    const results = document.getElementById('koboldsResults');
    const template = document.getElementById('koboldItemTemplate');

    const selectedBoons = getSelectedItems('.option.boon.selected', boons);
    const selectedDrawbacks = getSelectedItems('.option.drawback.selected', drawbacks);
    const selectedHalfboons = getSelectedItems('.option.halfboon.selected', boons)
        .map(item => ({ ...item, prob: 0.5 }));

    const doubleEventEnabled = selectedBoons.some(b => b.name === "Double Event");

    const twinQuotaByRace = new Map();
    if (doubleEventEnabled) {
        races.forEach(r => twinQuotaByRace.set(r.name, r.startingKobolds || 0));
    }

    results.innerHTML = '';

    const BATCH = 50;
    let frag = document.createDocumentFragment();

    for (let i = 0; i < koboldNumber; i++) {
        const selectedTraits = {
            selectedBoons,
            selectedDrawbacks,
            selectedHalfboons
        }

        const { node, race, boonResult } = buildKoboldCardForRace(template, null, selectedTraits);

        const needTwin = hasTwin(doubleEventEnabled, race, twinQuotaByRace, boonResult);
        if (needTwin) {
            const { node: twinNode } = createTwin(node, template, race, selectedTraits);

            frag.appendChild(node);
            frag.appendChild(twinNode);
        } else {
            frag.appendChild(node);
        }

        // flush in batches and yield so UI can update
        if ((i + 1) % BATCH === 0) {
            results.appendChild(frag);
            frag = document.createDocumentFragment();
            await tick();
        }
    }

    if (frag.childNodes.length) results.appendChild(frag);
}

function getSelectedItems(selector, dataArray) {
    return Array.from(document.querySelectorAll(selector))
        .map(li => dataArray.find(d => d.name === li.dataset.name))
        .filter(Boolean);
}

function buildKoboldCardForRace(
    template,
    fixedRaceObj,
    { selectedBoons, selectedDrawbacks, selectedHalfboons, excludeDoubleEvent = false }
) {
    const node = template.content.cloneNode(true);

    const race = fixedRaceObj ?? computeRace();
    node.querySelector('.raceValue').textContent = race ? race.name : "No race selected";

    // per-kobold pools
    let boonsPool = selectedBoons.map(b => ({ ...b, _biasedProb: undefined }));
    const drawbacksPool = selectedDrawbacks.map(d => ({ ...d, _biasedProb: undefined }));

    // exclude Double Event for twins
    if (excludeDoubleEvent) {
        boonsPool = boonsPool.filter(b => b.name !== "Double Event");
    }

    // race hooks
    race?.applyTraits?.({ selectedBoons: boonsPool, selectedDrawbacks: drawbacksPool });

    // merge halfboons (also exclude DE if needed)
    const half = excludeDoubleEvent
        ? selectedHalfboons.filter(h => h.name !== "Double Event")
        : selectedHalfboons;

    const mergedBoons = (typeof mergeHalfboonsRespectRaceGuarantee === 'function')
        ? mergeHalfboonsRespectRaceGuarantee(boonsPool, half)
        : [...boonsPool, ...half];

    // roll
    const boonResult = computeItems(mergedBoons);
    const boonSuccesses = new Set([...boonResult.common, ...boonResult.rare]);
    const drawbackResult = computeItems(drawbacksPool, boonSuccesses);

    // render
    fillList(node, '.rareBoons', boonResult.rare, 'boon', 'rare', boonResult.linked);
    fillList(node, '.commonBoons', boonResult.common, 'boon', 'common', boonResult.linked);
    fillList(node, '.rareDrawbacks', drawbackResult.rare, 'drawback', 'rare', drawbackResult.linked);
    fillList(node, '.commonDrawbacks', drawbackResult.common, 'drawback', 'common', drawbackResult.linked);

    decorateEvolvedKobolds(node, boonResult.evolutionNotes);

    return { node, race, boonResult };
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

function hasTwin(doubleEventEnabled, race, twinQuotaByRace, boonResult) {
    let forcedTwin = false;
    if (doubleEventEnabled && race?.name) {
        const left = twinQuotaByRace.get(race.name) || 0;
        if (left > 0) {
            forcedTwin = true;
            twinQuotaByRace.set(race.name, left - 1);
        }
    }

    const rolledTwin = doubleEventEnabled && boonResult.doubleEvent === true;
    return forcedTwin || rolledTwin;
}

function createTwin(node, template, race, {
    selectedBoons, selectedDrawbacks, selectedHalfboons
}) {
    const twinColor = nextTwinColor();

    addTwinBadge(node, twinColor);

    const raceObj = races.find(r => r.name === race?.name) || null;
    const { node: twinNode } = buildKoboldCardForRace(template, raceObj, {
        selectedBoons,
        selectedDrawbacks,
        selectedHalfboons,
        excludeDoubleEvent: true,
    });

    addTwinBadge(twinNode, twinColor);

    return { node: twinNode };
}


function fillList(root, selector, names, kind, rarity, linkedSet) {
    const ul = root.querySelector(selector);
    ul.innerHTML = '';
    names.forEach(name => {
        const li = document.createElement('li');
        const pill = document.createElement('span');
        pill.className = `tag ${kind} ${rarity}`;
        pill.textContent = name;
        li.appendChild(pill);

        if (linkedSet?.has(name)) {
            const note = document.createElement('span');
            note.className = 'tag note';
            note.textContent = 'synced';
            li.appendChild(note);
        }

        ul.appendChild(li);
    });
}

function decorateEvolvedKobolds(node, evolutionNotes) {
    const racePill = node.querySelector(".pill");
    const raceValue = racePill.querySelector(".raceValue");

    if (evolutionNotes?.has("Sudden Evolution")) {
        const form = evolutionNotes.get("Sudden Evolution"); // "Dragon" | "Dragonkin"
        const baseRace = raceValue.textContent.split(" ")[0]; // e.g. "Cutebold"

        racePill.classList.toggle("evolved-dragon", form === "Dragon");
        racePill.classList.toggle("evolved-dragonkin", form === "Dragonkin");

        raceValue.textContent = fusedRaceName(baseRace, form);
    } else {
        racePill.classList.remove("evolved-dragon", "evolved-dragonkin");
    }
}

function fusedRaceName(raceName, form) {
    const map = {
        "Cutebold": { prefix: "Cute", joiner: " " },
        "Roughbold": { prefix: "Rough", joiner: " " },
        "Werebold": { prefix: "Were", joiner: "" },
        "Fairybold": { prefix: "Fairy", joiner: " " },
        "Robold": { prefix: "Robo", joiner: " " },
        "Dogbold": { prefix: "Dog", joiner: " " },
    };

    const m = map[raceName] || { prefix: raceName.replace(/bold$/i, "").trim(), joiner: " " };
    const formOut = m.joiner === "" ? form.toLowerCase() : form;
    return `${m.prefix}${m.joiner}${formOut}`;
}

function addTwinBadge(node, color) {
    const nameLabel =
        node.querySelector('label[for="koboldName"]') ||
        Array.from(node.querySelectorAll('label')).find(l => l.textContent.trim().startsWith('Name'));

    if (!nameLabel) return;

    const container = nameLabel.parentElement;

    const old = container.querySelector('.tag.note.twin');
    if (old) old.remove();

    const badge = document.createElement('span');
    badge.className = 'tag note twin';
    badge.textContent = 'Twin';
    badge.style.background = color;

    container.insertBefore(badge, nameLabel);
}
