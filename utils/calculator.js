export function computeItems(items, externalSucceeded = undefined) {
    const results = { common: [], rare: [] };
    const succeededSet = new Set();
    const decidedSet = new Set();

    const extSucceeded = externalSucceeded instanceof Set
        ? externalSucceeded
        : new Set(externalSucceeded || []);

    const poolNames = new Set(items.map(it => it.name));

    const maxPasses = items.length * 2;
    for (let pass = 0; decidedSet.size < items.length && pass < maxPasses; pass++) {
        const progressed = processPass(items, decidedSet, succeededSet, results, poolNames, extSucceeded);
        if (!progressed) {
            cycleFallback(items, decidedSet, succeededSet, results);
            break;
        }
    }

    const { results: syncedResults, linked } = applySynchronousElement(results, items);
    const filteredResults = filterResults(syncedResults);

    // { common:[], rare:[], evolutionNotes:Map<name, "Dragon"|"Dragonkin">, doubleEvent:boolean, linked:Set<string> }
    return { ...filteredResults, linked };
}

function filterResults(results) {
    const notDiversify = name => !name.startsWith("Diversify:");
    const notSynchronousElement = name => name !== "Synchronous Element";
    const notDoubleEvent = name => name !== "Double Event";

    return {
        ...results,
        common: results.common.filter(notSynchronousElement),
        rare: results.rare.filter(notDiversify).filter(notSynchronousElement).filter(notDoubleEvent),
    };
}

function cycleFallback(items, decidedSet, succeededSet, results) {
    for (const it of items) {
        if (decidedSet.has(it.name)) continue;
        rollTrait(it, results, succeededSet);
        decidedSet.add(it.name);
    }
}

// One pass trying to process all items whose deps are decided.
function processPass(items, decidedSet, succeededSet, results, poolNames, externalSucceeded) {
    let progressed = false;

    for (const it of items) {
        if (decidedSet.has(it.name)) continue;

        if (!canProcess(it, items, decidedSet, poolNames)) continue;

        if (anyDependencySucceeded(it, items, succeededSet, externalSucceeded)) {
            decidedSet.add(it.name);
            progressed = true;
            continue;
        }

        rollTrait(it, results, succeededSet);
        decidedSet.add(it.name);
        progressed = true;
    }

    return progressed;
}

function rollTrait(item, results, succeededSet) {
    if (item.customRoll) {
        item.customRoll(item, results, succeededSet);
        return;
    }

    const p = effectiveProb(item);
    if (p >= 1) {
        results.common.push(item.name);
        succeededSet.add(item.name);
    } else if (Math.random() < p) {
        results.rare.push(item.name);
        succeededSet.add(item.name);
    }
}

function anyDependencySucceeded(item, items, succeededSet, externalSucceeded) {
    const deps = expandDependencies(item, items);
    return deps.some(d => succeededSet.has(d) || externalSucceeded?.has?.(d));
}

function canProcess(item, items, decidedSet, poolNames) {
    const deps = expandDependencies(item, items);
    return deps.every(d => (poolNames.has(d) ? decidedSet.has(d) : true));
}

function expandDependencies(item, items) {
    const dep = item.rolledAfter;
    if (!dep) return [];
    if (!dep.includes('*')) return [dep];

    // Wildcard: e.g. "Elemental Resistance: *"
    const prefix = dep.replace('*', '').trim();
    return items.filter(x => x.name.startsWith(prefix)).map(x => x.name);
}

function effectiveProb(item) {
    return item._biasedProb ?? item.prob ?? 0;
}

/* Handle "Synchronous Element" Boon */
function applySynchronousElement(results, items) {
    const linked = new Set();

    if (!isSynchronousSelected(items)) {
        return { results, linked };
    }

    const pairs = buildSynchronousPairs(items);
    if (pairs.length === 0) return { results, linked };

    // Helper: membership checks & adders
    const has = (name) => results.common.includes(name) || results.rare.includes(name);
    const addAs = (name, asCommon) => {
        if (has(name)) return; // already present
        if (asCommon) results.common.push(name); else results.rare.push(name);
        linked.add(name);
    };

    // For each element: if one succeeded, auto-apply the counterpart
    for (const { bwName, erName } of pairs) {
        const bwIn = has(bwName);
        const erIn = has(erName);
        if (bwIn && !erIn) {
            // Decide bucket for the counterpart based on its effective probability (common if >= 1)
            const item = items.find(i => i.name === erName);
            const asCommon = effectiveProb(item) >= 1;
            addAs(erName, asCommon);
        } else if (erIn && !bwIn) {
            const item = items.find(i => i.name === bwName);
            const asCommon = effectiveProb(item) >= 1;
            addAs(bwName, asCommon);
        }
    }

    return { results, linked };
}

function buildSynchronousPairs(items) {
    // Find all Breath Weapon / Elemental Resistance items by element name
    const breathByEl = new Map();     // el -> name
    const resistByEl = new Map();     // el -> name

    for (const it of items) {
        const bw = it.name.match(/^Breath Weapon:\s*(.+)$/);
        const er = it.name.match(/^Elemental Resistance:\s*(.+)$/);
        if (bw) breathByEl.set(bw[1], it.name);
        if (er) resistByEl.set(er[1], it.name);
    }

    // Keep only elements where both boons exist in the current selection
    const pairs = [];
    for (const [el, bwName] of breathByEl) {
        const erName = resistByEl.get(el);
        if (erName) pairs.push({ element: el, bwName, erName });
    }
    return pairs;
}

function isSynchronousSelected(items) {
    return items.some(it => it.name === "Synchronous Element");
}

export function rollSuddenEvolution(item, results, succeededSet) {
    const evolutionNotes = new Map();

    // Dragon has its own prob2; Dragonkin uses the effective (biased) main prob
    const pDragon = item.prob2 ?? 0;
    const pKin = effectiveProb(item); // respects _biasedProb if you set one

    let form = null;
    if (Math.random() < pDragon) form = "Dragon";
    else if (Math.random() < pKin) form = "Dragonkin";

    if (form) {
        // Always treated as a rare boon visually (probabilities < 1)
        if (!results.rare.includes("Sudden Evolution") && !results.common.includes("Sudden Evolution")) {
            results.rare.push("Sudden Evolution");
        }
        evolutionNotes.set("Sudden Evolution", form);
    }

    results.evolutionNotes = evolutionNotes; // Map<name, "Dragon"|"Dragonkin">
    succeededSet.add(item.name);
}

export function rollDoubleEvent(item, results, succeededSet) {
    const p = effectiveProb(item);
    if (p >= 1 || Math.random() < p) {
        results.doubleEvent = true;
        succeededSet.add(item.name);
    }
}
