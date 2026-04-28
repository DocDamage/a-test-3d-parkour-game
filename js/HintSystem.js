export function createHintSystem() {
    const _shownHints = new Set();

    function showHint(text) {
        if (_shownHints.has(text)) return;
        _shownHints.add(text);
        const el = document.getElementById('hint-toast');
        if (!el) return;
        el.textContent = text;
        el.style.opacity = '1';
        setTimeout(() => { el.style.opacity = '0'; }, 4000);
    }

    function showLootToast(item) {
        const el = document.getElementById('loot-toast');
        if (!el || !item) return;
        const nameEl = document.getElementById('loot-toast-name');
        const affixEl = document.getElementById('loot-toast-affix');
        if (nameEl) {
            nameEl.textContent = item.name || 'Unknown Item';
            const rarityColors = { 1: '#aaa', 2: '#4488ff', 3: '#ffaa00', 4: '#ff4444', 5: '#00ff44', 6: '#ff8800', 7: '#ff00ff', common: '#aaa', uncommon: '#4488ff', rare: '#ffaa00', epic: '#c66bff', legendary: '#ff8800' };
            nameEl.style.color = rarityColors[item.rarity] || rarityColors[item.compatRarity] || '#fff';
        }
        if (affixEl) {
            const firstAffix = item.affixes && item.affixes[0];
            affixEl.textContent = firstAffix ? `${firstAffix.name}: ${firstAffix.stat} ${firstAffix.value}` : '';
        }
        el.style.display = 'block';
        setTimeout(() => { el.style.display = 'none'; }, 4000);
    }

    return { showHint, showLootToast };
}
