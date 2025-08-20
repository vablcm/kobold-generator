import { races, boons, drawbacks } from './utils/data.js';
import { randomizeSelections, selectAllAndMax } from './utils/test-helper.js';
import { onGenerateClick, renderList } from './utils/renderer.js';

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

    const genBtn = document.getElementById('generateKobolds');
    if (genBtn) genBtn.addEventListener('click', onGenerateClick);
});

Object.assign(window, { randomizeSelections, selectAllAndMax });
