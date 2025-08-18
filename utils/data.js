import { enableOrDisableElement } from './renderer.js';

export const races = [
    { name: "Cutebold", startingKobolds: 5, incompatible: "Diversify: Cutebold", applyTraits: applyCuteboldTraits },
    { name: "Roughbold", startingKobolds: 4, incompatible: "Diversify: Roughbold", applyTraits: applyRoughboldTraits },
    { name: "Werebold", startingKobolds: 4, incompatible: "Diversify: Werebold", applyTraits: applyWereboldTraits },
    { name: "Fairybold", startingKobolds: 3, incompatible: "Diversify: Fairybold", applyTraits: applyFairyboldTraits },
    { name: "Robold", startingKobolds: 3, incompatible: "Diversify: Robold", applyTraits: applyRoboldTraits },
    { name: "Dogbold", startingKobolds: 3, incompatible: "Diversify: Dogbold", applyTraits: applyDogboldTraits },
];

const elements = ["Fire", "Water", "Lightning", "Acid", "Sound", "Darkness", "Light"];

const breathWeapons = elements.map(el => ({
    name: `Breath Weapon: ${el}`,
    prob: 0.01,
    element: el,
    afterToggle: checkSynchronousElement
}));

const elementalResistances = elements.map(el => ({
    name: `Elemental Resistance: ${el}`,
    prob: 0.05,
    element: el,
    afterToggle: checkSynchronousElement
}));

const elementalWeaknesses = elements.map(el => ({
    name: `Elemental Weakness: ${el}`,
    prob: 0.65,
    element: el,
    rolledAfter: `Elemental Resistance: ${el}`
}));

const diversifyRaces = races.map(race => ({
    name: `Diversify: ${race.name}`,
    prob: 0.15,
    requiredFor: "Tribal Schism",
    requirementTooltip: `${race.name} is your main race`,
    afterToggle: checkTribalSchism,
}));

export const boons = [
    { name: "Stretchy", prob: 1 },
    { name: "Milkers", prob: 1 },
    { name: "Survivalist", prob: 1 },
    { name: "No Waste", prob: 1 },
    { name: "Morning Glory", prob: 1 },
    { name: "Ready to Rumble", prob: 1 },
    { name: "Gender Fluid", prob: 1 },
    { name: "Fashionista", prob: 1 },
    { name: "Natural Weapons", prob: 1 },
    { name: "Early Bloomer", prob: 0.45 },
    { name: "Amphibian", prob: 0.25 },
    { name: "Linguist", prob: 0.4 },
    { name: "Planned Parenthood", prob: 1 },
    { name: "Endurance", prob: 1 },
    { name: "Flexible", prob: 1 },
    { name: "Scale Shed", prob: 1 },
    { name: "Wings", prob: 0.07 },
    { name: "Quick Learners", prob: 1 },
    { name: "Brave Little Kobolds", prob: 1, incompatible: "Cowardly Kobolds" },
    { name: "Regrow", prob: 1 },
    { name: "Slimy Perspiration", prob: 0.15 },
    { name: "Sudden Evolution", prob: 0.001, prob2: 0.0001 },
    { name: "Technobold", prob: 0.1 },
    { name: "Burrower", prob: 1 },
    { name: "Strength Up", prob: 0.2 },
    { name: "Dexterity Up", prob: 0.2 },
    { name: "Constitution Up", prob: 0.2 },
    { name: "Intelligence Up", prob: 0.2 },
    { name: "Wisdom Up", prob: 0.2 },
    { name: "Charisma Up", prob: 0.2 },
    { name: "Mercy Magnet", prob: 1, incompatible: "Trouble Magnet" },
    { name: "Magic Attunement", prob: 0.05 },
    { name: "Fellow Monster Friend", prob: 1 },
    { name: "Superior Dragon Genes", prob: 1, incompatible: "Inferior Kobold Genes" },
    { name: "Double Event", prob: 0.5 },
    { name: "Modular", prob: 1 },
    ...breathWeapons,
    ...elementalResistances,
    { name: "Synchronous Element", prob: 1, requirementTooltip: "Requirements: Breath Weapon and Elemental Resistance of the same element", disabled: true },
    { name: "Gem Horns", prob: 0.03 },
    { name: "Hidden Talent", prob: 0.2 },
    { name: "Chameleonic Scales", prob: 0.15, rolledAfter: "Elemental Resistance: *" },
    ...diversifyRaces,
    { name: "Metal Scales", prob: 0.25 },
    { name: "Shapeshifting", prob: 0.1 },
    { name: "Conveniently Sized", prob: 0.1 },
    { name: "Mutagenic Evolution", prob: 0.05 },
    { name: "Symbiotic Ally", prob: 1 },
    { name: "Pack Tactics", prob: 1 },
    { name: "Man's Best Friend", prob: 1 },
    { name: "Hybridize", prob: 1 },
    { name: "Champion", prob: 0.001 },
];

export const drawbacks = [
    { name: "Clumsy", prob: 0.4 },
    { name: "Bioluminescence", prob: 0.4 },
    { name: "Lustful", prob: 1 },
    { name: "Scales Are Enough", prob: 1 },
    { name: "Carnivore", prob: 1, incompatible: "Herbivore" },
    { name: "Herbivore", prob: 1, incompatible: "Carnivore" },
    { name: "Lightweight", prob: 1 },
    { name: "Rumor Rationalization", prob: 1 },
    { name: "Cowardly Kobolds", prob: 1, incompatible: "Brave Little Kobolds" },
    { name: "High Metabolism", prob: 0.35 },
    { name: "Long Childhood", prob: 0.45 },
    { name: "Gullible", prob: 1 },
    { name: "Subservient", prob: 0.8 },
    { name: "Dominant", prob: 0.8, rolledAfter: "Subservient" },
    { name: "Mating Season", prob: 1 },
    { name: "Dry Spell", prob: 1 },
    { name: "Codependent", prob: 1 },
    { name: "Zero Potential", prob: 0.01 },
    { name: "Hibernate", prob: 1 },
    { name: "Coldblooded", prob: 1 },
    { name: "Foul", prob: 0.45 },
    { name: "Kleptomaniac", prob: 0.65 },
    { name: "Curious", prob: 1 },
    { name: "Off Switch", prob: 1 },
    { name: "Strength Down", prob: 0.2, rolledAfter: "Strength Up" },
    { name: "Dexterity Down", prob: 0.2, rolledAfter: "Dexterity Up" },
    { name: "Constitution Down", prob: 0.2, rolledAfter: "Constitution Up" },
    { name: "Intelligence Down", prob: 0.2, rolledAfter: "Intelligence Up" },
    { name: "Wisdom Down", prob: 0.2, rolledAfter: "Wisdom Up" },
    { name: "Charisma Down", prob: 0.2, rolledAfter: "Charisma Up" },
    { name: "Trouble Magnet", prob: 1, incompatible: "Mercy Magnet" },
    { name: "Sun Allergy", prob: 1 },
    { name: "Technophobe", prob: 0.45, rolledAfter: "Technobold" },
    { name: "Inferior Kobold Genes", prob: 1, incompatible: "Superior Dragon Genes" },
    { name: "Food Chain Newcomer", prob: 1, incompatible: "Fellow Monster Friend" },
    { name: "Sustenance", prob: 1 },
    ...elementalWeaknesses,
    { name: "Mute", prob: 0.35 },
    { name: "Tasty Meal", prob: 1 },
    { name: "Tribal Schism", prob: 1, requirementTooltip: "Requirements: Diversify", disabled: true },
    { name: "Not-So-Immune System", prob: 1 },
    { name: "Flawed Recessive Genes", prob: 1 },
    { name: "Hypnosis Prone", prob: 1 },
    { name: "Magic Word", prob: 1 },
    { name: "Rival Race", prob: 1 },
    { name: "Chaotic Soul", prob: 1 },
    { name: "Magic Weakness", prob: 1 },
    { name: "Lycanthropy", prob: 0.005 },
    { name: "Game of Scales", prob: 1 },
    { name: "Selective Infertility", prob: 1 },
    { name: "Low Life Expectancy", prob: 1 },
];

function checkSynchronousElement() {
    const isSynchronousElementDisabled = !elements.some(element => {
        const breathWeapon = Array.from(document.querySelectorAll(`.option.boon[data-element="${element}"]`))
            .find(li => li.textContent.startsWith(`Breath Weapon: ${element}`));

        const elementalResistance = Array.from(document.querySelectorAll(`.option.boon[data-element="${element}"]`))
            .find(li => li.textContent.startsWith(`Elemental Resistance: ${element}`));

        return breathWeapon.classList.contains('selected') && elementalResistance.classList.contains('selected');
    });

    const synchronousElement = Array.from(document.querySelectorAll(".option.boon"))
        .find(li => li.textContent.startsWith("Synchronous Element"));

    enableOrDisableElement(synchronousElement, isSynchronousElementDisabled);
}

function checkTribalSchism() {
    const isTribalSchismDisabled = !Array.from(document.querySelectorAll('.option.boon'))
        .some(li => li.textContent.startsWith("Diversify:") && li.classList.contains('selected'));

    const tribalSchism = Array.from(document.querySelectorAll(".option.drawback"))
        .find(li => li.textContent.startsWith("Tribal Schism"));

    enableOrDisableElement(tribalSchism, isTribalSchismDisabled);
}

/**
 * Ensures an item exists in the per-kobold pool; return the instance used.
 * @param {*} selectionList The list of selected boons or drawbacks used to calculate a kobold's traits.
 * @param {*} sourceArray The complete list of boons or drawbacks to use if the item isn't selected.
 * @param {*} name The item to be selected.
 * @returns The instance of the item to be biased if needed.
 */
function ensureInSelection(selectionList, sourceArray, name) {
    let item = selectionList.find(item => item?.name === name);
    if (!item) {
        const src = sourceArray.find(it => it?.name === name);
        if (src) {
            item = { ...src }; // copy so we can bias without touching global data
            selectionList.push(item);
        }
    }
    return item;
}

function removeFromSelection(selectionList, name) {
    const index = selectionList.findIndex(item => item?.name === name);
    if (index !== -1) selectionList.splice(index, 1);
}

function bias(item, factor) {
    if (item && typeof item.prob === 'number' && item.prob < 1) {
        item._biasedProb = Math.min(1, (item._biasedProb ?? item.prob) * factor);
    }
};

function guarantee(item) {
    item._biasedProb = 1;
    item._guaranteedByRace = true;
}

function applyCuteboldTraits({ selectedBoons, selectedDrawbacks }) {
    const charismaUp = ensureInSelection(selectedBoons, boons, "Charisma Up");
    const constitutionDown = ensureInSelection(selectedDrawbacks, drawbacks, "Constitution Down");
    const mercyMagnet = ensureInSelection(selectedBoons, boons, "Mercy Magnet");

    bias(charismaUp, 2);
    bias(constitutionDown, 2);
    guarantee(mercyMagnet);
}

function applyRoughboldTraits({ selectedBoons, selectedDrawbacks }) {
    const intelligenceUp = ensureInSelection(selectedBoons, boons, "Intelligence Up");
    const strengthDown = ensureInSelection(selectedDrawbacks, drawbacks, "Strength Down");
    const packTactics = ensureInSelection(selectedBoons, boons, "Pack Tactics");

    bias(intelligenceUp, 2);
    bias(strengthDown, 2);
    guarantee(packTactics);
}

function applyWereboldTraits({ selectedBoons, selectedDrawbacks }) {
    const hiddenTalent = ensureInSelection(selectedBoons, boons, "Hidden Talent");
    const milkers = ensureInSelection(selectedBoons, boons, "Milkers");
    const longChildhoods = ensureInSelection(selectedDrawbacks, drawbacks, "Long Childhood");
    removeFromSelection(selectedBoons, "Early Bloomers");
    ensureInSelection(selectedBoons, boons, "Sudden Evolution");

    bias(hiddenTalent, 2);
    guarantee(milkers);
    guarantee(longChildhoods);
}

function applyFairyboldTraits({ selectedBoons, selectedDrawbacks }) {
    const wings = ensureInSelection(selectedBoons, boons, "Wings");
    const dexterityUp = ensureInSelection(selectedBoons, boons, "Dexterity Up");
    const magicAttunement = ensureInSelection(selectedBoons, boons, "Magic Attunement");
    const bioluminescence = ensureInSelection(selectedDrawbacks, drawbacks, "Bioluminescence");

    guarantee(wings);
    guarantee(dexterityUp);
    guarantee(magicAttunement);
    guarantee(bioluminescence);
}

function applyRoboldTraits({ selectedBoons, selectedDrawbacks }) {
    removeFromSelection(selectedBoons, "Early Bloomers");
    removeFromSelection(selectedDrawbacks, "Long Childhood");
    const modular = ensureInSelection(selectedBoons, boons, "Modular");
    const offSwitch = ensureInSelection(selectedDrawbacks, drawbacks, "Off Switch");

    guarantee(modular);
    guarantee(offSwitch);
}

function applyDogboldTraits({ selectedBoons, selectedDrawbacks }) {
    const wisdomUp = ensureInSelection(selectedBoons, boons, "Wisdom Up");
    const mansBestFriend = ensureInSelection(selectedBoons, boons, "Man's Best Friend");

    bias(wisdomUp, 2);
    guarantee(mansBestFriend);
} 
