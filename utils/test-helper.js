import { races, boons, drawbacks } from './data.js';
import { onItemClick } from './renderer.js';

// Helper: find data item for a rendered <li>
function getItemFromLi(li) {
    const name = li.dataset.name || li.textContent.split(' (')[0].trim();
    if (li.classList.contains('boon')) return boons.find(b => b.name === name);
    if (li.classList.contains('drawback')) return drawbacks.find(d => d.name === name);
    if (li.classList.contains('race')) return races.find(r => r.name === name);
    return null;
}

// Helper: toggle via onItemClick (respects your logic)
function toggleViaHandler(li) {
    const item = getItemFromLi(li);
    if (!item) return;
    const type =
        li.classList.contains('boon') ? 'boon' :
            li.classList.contains('drawback') ? 'drawback' :
                li.classList.contains('race') ? 'race' :
                    'boon';
    onItemClick(li, item, type);
}

/**
 * Randomly select a race + a subset of boons/drawbacks for testing.
 * Calls onItemClick() for every (de)selection.
 * @param {{boonChance?:number, drawbackChance?:number, clearFirst?:boolean}} opts
 */
export function randomizeSelections(opts = {}) {
    const {
        boonChance = 0.35,       // ~35% chance to pick each boon
        drawbackChance = 0.2,    // ~20% chance to pick each drawback
        clearFirst = true
    } = opts;

    // 1) Clear current selections (via handler) if requested
    if (clearFirst) {
        Array.from(document.querySelectorAll('.option.selected'))
            .forEach(li => toggleViaHandler(li)); // deselect
    }

    // 2) Random race
    const racesEls = Array.from(document.querySelectorAll('.option.race'));
    if (racesEls.length) {
        const pick = racesEls[Math.floor(Math.random() * racesEls.length)];
        if (!pick.classList.contains('selected')) toggleViaHandler(pick);
    }

    // 3) Random boons (skip disabled)
    Array.from(document.querySelectorAll('.option.boon'))
        .filter(li => !li.classList.contains('disabled'))
        .forEach(li => {
            if (Math.random() < boonChance) {
                if (!li.classList.contains('selected')) toggleViaHandler(li);
            }
        });

    // 4) Random drawbacks (skip disabled)
    Array.from(document.querySelectorAll('.option.drawback'))
        .filter(li => !li.classList.contains('disabled'))
        .forEach(li => {
            if (Math.random() < drawbackChance) {
                if (!li.classList.contains('selected')) toggleViaHandler(li);
            }
        });
}

/**
 * Select all boons and drawbacks, and set koboldCount to 1000.
 */
export function selectAllAndMax() {
    Array.from(document.querySelectorAll('.option.selected'))
        .forEach(li => toggleViaHandler(li));

    Array.from(document.querySelectorAll('.option.boon'))
        .filter(li => !li.classList.contains('disabled'))
        .forEach(li => {
            if (!li.classList.contains('selected')) toggleViaHandler(li);
        });

    Array.from(document.querySelectorAll('.option.drawback'))
        .filter(li => !li.classList.contains('disabled'))
        .forEach(li => {
            if (!li.classList.contains('selected')) toggleViaHandler(li);
        });

    const countInput = document.getElementById('koboldCount');
    if (countInput) countInput.value = 1000;
}
