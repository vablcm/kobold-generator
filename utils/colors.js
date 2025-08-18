let _twinHueSeed = Math.random();
const _recentHues = [];
const MIN_DEG = 35; // minimum hue separation from recent ones

export function resetTwinColors(seed = Math.random()) {
    _twinHueSeed = seed;
}

export function nextTwinColor() {
    for (let attempts = 0; attempts < 10; attempts++) {
        _twinHueSeed = (_twinHueSeed + 0.61803398875) % 1;
        const hue = Math.round(_twinHueSeed * 360);
        if (_recentHues.every(h => Math.min(Math.abs(h - hue), 360 - Math.abs(h - hue)) >= MIN_DEG)) {
            _recentHues.push(hue);
            if (_recentHues.length > 6) _recentHues.shift(); // remember last N
            return `hsl(${hue} 70% 70%)`;
        }
    }
    // fallback
    const hue = Math.round(_twinHueSeed * 360);
    return `hsl(${hue} 70% 70%)`;
}
