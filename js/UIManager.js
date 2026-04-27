/**
 * UIManager — centralizes all UI panel toggles, updates, and dynamic DOM creation.
 *
 * Extracted from main.js to keep the composition root under 2000 lines.
 */

export class UIManager {
    constructor(deps) {
        this.deps = deps;
        this.miniBossBars = [];
    }

    /* ------------------------------------------------------------------ */
    /*  Dynamic DOM creation                                              */
    /* ------------------------------------------------------------------ */

    createMiniBossBars(minibosses) {
        const ui = document.getElementById('ui');
        if (!ui) return;
        minibosses.forEach((mb, i) => {
            const wrap = document.createElement('div');
            wrap.id = `miniboss-bar-${i}`;
            wrap.style.cssText = `position:absolute;top:${50 + i * 24}px;right:16px;width:160px;height:16px;background:rgba(0,0,0,0.5);border-radius:3px;overflow:hidden;z-index:10;`;
            const fill = document.createElement('div');
            fill.id = `miniboss-fill-${i}`;
            fill.style.cssText = 'width:100%;height:100%;background:#ffaa00;transition:width 0.2s;';
            const label = document.createElement('div');
            label.textContent = mb.type;
            label.style.cssText = 'position:absolute;top:0;left:4px;font-size:10px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.8);';
            wrap.appendChild(fill);
            wrap.appendChild(label);
            ui.appendChild(wrap);
            this.miniBossBars.push({ wrap, fill });
        });
    }

    createManaBar() {
        const ui = document.getElementById('ui');
        if (!ui) return;
        const wrap = document.createElement('div');
        wrap.id = 'mana-bar-wrap';
        wrap.style.cssText = 'position:absolute;bottom:60px;left:50%;transform:translateX(-50%);width:200px;height:8px;background:rgba(0,0,0,0.5);border-radius:4px;overflow:hidden;z-index:10;display:none;';
        const fill = document.createElement('div');
        fill.id = 'mana-bar-fill';
        fill.style.cssText = 'width:0%;height:100%;background:#8844ff;transition:width 0.1s;';
        wrap.appendChild(fill);
        ui.appendChild(wrap);
    }

    /* ------------------------------------------------------------------ */
    /*  Panel toggles (input handling)                                    */
    /* ------------------------------------------------------------------ */

    handleInput(activeInput) {
        const d = this.deps;

        if (activeInput.wasPressed('KeyP') && !activeInput.isPressed('ShiftLeft')) {
            const pt = document.getElementById('passive-tree');
            if (pt) {
                const showing = pt.style.display === 'block';
                pt.style.display = showing ? 'none' : 'block';
                if (!showing && d.passiveTree) d.passiveTree._renderUI();
            }
        }
        if (activeInput.wasPressed('KeyP') && activeInput.isPressed('ShiftLeft')) {
            const cp = document.getElementById('character-panel');
            if (cp) cp.style.display = (cp.style.display === 'block') ? 'none' : 'block';
        }
        if (activeInput.wasPressed('KeyG')) {
            const gp = document.getElementById('gear-panel');
            if (gp) gp.style.display = (gp.style.display === 'block') ? 'none' : 'block';
        }
        if (activeInput.wasPressed('KeyU')) {
            const comp = document.getElementById('companion-panel');
            if (comp) comp.style.display = (comp.style.display === 'block') ? 'none' : 'block';
        }
        if (activeInput.wasPressed('KeyF') && !activeInput.isPressed('ShiftLeft')
            && d.dialogueSystem && !d.dialogueSystem.isOpen
            && d.shop && !d.shop.isOpen
            && d.dungeonSystem && !d.dungeonSystem.nearbyDungeonId) {
            const fp = document.getElementById('faction-panel');
            if (fp) fp.style.display = (fp.style.display === 'block') ? 'none' : 'block';
        }
        if (activeInput.wasPressed('KeyH')) {
            const sp = document.getElementById('safehouse-panel');
            if (sp) sp.style.display = (sp.style.display === 'block') ? 'none' : 'block';
        }
        if (activeInput.wasPressed('KeyJ')) {
            const bp = document.getElementById('bounty-panel');
            if (bp) bp.style.display = (bp.style.display === 'block') ? 'none' : 'block';
        }
        if (activeInput.wasPressed('KeyK')) {
            const cop = document.getElementById('codex-panel');
            if (cop) cop.style.display = (cop.style.display === 'block') ? 'none' : 'block';
        }
        if (activeInput.wasPressed('KeyL')) {
            const mp = document.getElementById('mastery-panel');
            if (mp) mp.style.display = (mp.style.display === 'block') ? 'none' : 'block';
        }
        if (activeInput.wasPressed('KeyN')) {
            const ip = document.getElementById('implants-panel');
            if (ip) ip.style.display = (ip.style.display === 'block') ? 'none' : 'block';
        }
        if (activeInput.wasPressed('KeyI')) {
            const ki = document.getElementById('keyitem-panel');
            if (ki) {
                const showing = ki.style.display === 'block';
                ki.style.display = showing ? 'none' : 'block';
                if (!showing && d.keyItems) {
                    d.keyItems.getAllItems().forEach(item => {
                        const row = document.getElementById('ki-' + item.id);
                        if (row) {
                            if (item.collected) row.classList.add('found');
                            else row.classList.remove('found');
                        }
                    });
                }
            }
        }
        if (activeInput.wasPressed('KeyO') && !activeInput.isPressed('ShiftLeft')) {
            const sp = document.getElementById('settings-panel');
            if (sp) sp.style.display = (sp.style.display === 'block') ? 'none' : 'block';
        }
        if (activeInput.wasPressed('KeyO') && activeInput.isPressed('ShiftLeft')) {
            if (d.risingTide) {
                if (d.risingTide.active) d.risingTide.stop();
                else d.risingTide.start();
            }
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Per-frame updates                                                 */
    /* ------------------------------------------------------------------ */

    update(dt) {
        const d = this.deps;
        this._updateBasicHUD(d);
        this._updateGearPanel(d);
        this._updateCompanionPanel(d);
        this._updateFactionPanel(d);
        this._updateSafehousePanel(d);
        this._updateBountyPanel(d);
        this._updateCodexPanel(d);
        this._updateMasteryPanel(d);
        this._updateImplantsPanel(d);
        this._updateCharacterPanel(d);
        this._updateManaBar(d);
    }

    updateBossHUD(bossFight, challenges) {
        if (!bossFight.isActive()) return;
        const health = bossFight.getBossHealth();
        const maxHealth = bossFight.getBossMaxHealth();
        const pct = maxHealth > 0 ? (health / maxHealth) * 100 : 0;
        const bossHealthFill = document.getElementById('boss-health-fill');
        const bossPhaseLabel = document.getElementById('boss-phase');
        const bossVictory = document.getElementById('boss-victory');
        const bossHUD = document.getElementById('boss-hud');
        if (bossHealthFill) bossHealthFill.style.width = pct + '%';
        if (bossPhaseLabel) {
            if (bossFight.currentPhase === 1) bossPhaseLabel.textContent = 'Phase 1: Ground Supremacy';
            else if (bossFight.currentPhase === 2) bossPhaseLabel.textContent = 'Phase 2: Aerial Dominance';
            else if (bossFight.currentPhase === 3) bossPhaseLabel.textContent = 'Phase 3: Overclocked Fury';
        }
        if (bossFight.bossState === 'defeated' && bossVictory && bossVictory.style.display !== 'block') {
            bossVictory.style.display = 'block';
            if (bossHUD) bossHUD.style.display = 'none';
            const timeEl = document.getElementById('boss-time');
            const hitsEl = document.getElementById('boss-hits');
            const gradeEl = document.getElementById('boss-grade');
            if (timeEl) timeEl.textContent = 'Time: ' + bossFight.getFightTime();
            if (hitsEl) hitsEl.textContent = 'Hits Taken: ' + bossFight.hitsTaken;
            if (gradeEl) gradeEl.textContent = bossFight.getGrade();
            if (challenges) challenges.unlock('firstBossKill');
        }
    }

    updateMiniBossBars(minibosses) {
        minibosses.forEach((mb, i) => {
            const bar = this.miniBossBars[i];
            if (!bar || !bar.fill) return;
            if (mb.isDead) { bar.wrap.style.display = 'none'; return; }
            bar.wrap.style.display = 'block';
            const pct = mb.getHealthPercent() * 100;
            bar.fill.style.width = pct + '%';
            bar.fill.style.background = mb.currentPhase === 2 ? '#ff3333' : '#ffaa00';
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Internal panel renderers                                          */
    /* ------------------------------------------------------------------ */

    _updateBasicHUD(d) {
        const stateDisplay = document.getElementById('state-display');
        const speedDisplay = document.getElementById('speed-display');
        const levelDisplay = document.getElementById('level-display');
        const xpDisplay = document.getElementById('xp-display');
        const apDisplay = document.getElementById('ap-display');
        if (stateDisplay) stateDisplay.textContent = d.player.getStateDisplay();
        if (speedDisplay) speedDisplay.textContent = d.player.getSpeed();
        if (d.heartSystem) d.heartSystem.renderHearts('heart-container-row');
        const sectorKeyEl = document.getElementById('sector-key-count');
        if (sectorKeyEl && d.dungeonSystem) sectorKeyEl.textContent = d.dungeonSystem.getSectorKeyCount() + ' / 7';
        if (levelDisplay && d.progression) levelDisplay.textContent = d.progression.getLevel();
        if (xpDisplay && d.progression) {
            const pct = d.progression.getXPToNext() > 0 ? Math.floor((d.progression.getXP() / d.progression.getXPToNext()) * 100) : 100;
            xpDisplay.textContent = pct + '%';
        }
        if (apDisplay && d.characterSheet) apDisplay.textContent = d.characterSheet.getAttributePoints();
    }

    _updateGearPanel(d) {
        const gp = document.getElementById('gear-panel');
        if (!gp || gp.style.display !== 'block' || !d.exoSuit) return;
        const equipped = d.exoSuit.getAllEquipped ? d.exoSuit.getAllEquipped() : {};
        const slots = ['frame', 'helmet', 'chestplate', 'gloves', 'boots', 'optics', 'shoulders', 'greaves'];
        slots.forEach(slot => {
            const el = document.getElementById('gear-' + slot);
            if (!el) return;
            const item = equipped[slot];
            if (item) { el.textContent = item.name || item.id || 'Equipped'; el.classList.remove('empty'); }
            else { el.textContent = 'Empty'; el.classList.add('empty'); }
        });
        const gsEl = document.getElementById('gear-score');
        if (gsEl) gsEl.textContent = d.exoSuit.getGearScore ? d.exoSuit.getGearScore() : 0;
    }

    _updateCompanionPanel(d) {
        const compPanel = document.getElementById('companion-panel');
        if (!compPanel || compPanel.style.display !== 'block' || !d.companion || !d.loyalty) return;
        const modeEl = document.getElementById('companion-mode');
        const trustEl = document.getElementById('companion-trust');
        const tierEl = document.getElementById('companion-tier');
        if (modeEl) modeEl.textContent = d.companion.getMode ? d.companion.getMode() : '-';
        if (trustEl) trustEl.textContent = d.loyalty.getTrust ? d.loyalty.getTrust() : '-';
        if (tierEl) tierEl.textContent = d.loyalty.getTier ? d.loyalty.getTier() : '-';
    }

    _updateFactionPanel(d) {
        const fp = document.getElementById('faction-panel');
        if (!fp || fp.style.display !== 'block' || !d.factions) return;
        ['vanguard', 'synapse', 'hollow'].forEach(f => {
            const rep = d.factions.getReputation ? d.factions.getReputation(f) : 0;
            const tier = d.factions.getTier ? d.factions.getTier(f) : 'neutral';
            const fillEl = document.getElementById('faction-' + f + '-fill');
            const tierEl = document.getElementById('faction-' + f + '-tier');
            if (fillEl) fillEl.style.width = Math.max(0, Math.min(100, ((rep + 100) / 200) * 100)) + '%';
            if (tierEl) tierEl.textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
        });
    }

    _updateSafehousePanel(d) {
        const sp = document.getElementById('safehouse-panel');
        if (!sp || sp.style.display !== 'block' || !d.safehouse) return;
        const upgContainer = document.getElementById('safehouse-upgrades');
        if (upgContainer && d.safehouse.getAllUpgrades) {
            upgContainer.innerHTML = d.safehouse.getAllUpgrades().map(u =>
                `<div class="sh-upgrade"><span class="name">${u.name}</span><span class="level">Lv${u.currentLevel}/${u.maxLevel}</span><br/><span style="color:#888;">${u.description}</span></div>`
            ).join('');
        }
    }

    _updateBountyPanel(d) {
        const bp = document.getElementById('bounty-panel');
        if (!bp || bp.style.display !== 'block' || !d.bounty) return;
        const rankEl = document.getElementById('bounty-rank');
        const contractsEl = document.getElementById('bounty-contracts');
        if (rankEl && d.bounty.getRunnerRank) rankEl.textContent = 'Rank: ' + d.bounty.getRunnerRank();
        if (contractsEl && d.bounty.getActiveContracts) {
            contractsEl.innerHTML = d.bounty.getActiveContracts().slice(0, 3).map(c =>
                `<div class="bounty-contract"><strong>${c.targetType}</strong> in ${c.sectorId}<br/>Reward: ${c.reward}</div>`
            ).join('') || '<div class="bounty-contract">No active contracts</div>';
        }
    }

    _updateCodexPanel(d) {
        const cop = document.getElementById('codex-panel');
        if (!cop || cop.style.display !== 'block' || !d.codex) return;
        const entriesEl = document.getElementById('codex-entries');
        if (entriesEl && d.codex.getAllEntries) {
            entriesEl.innerHTML = d.codex.getAllEntries().map(e => {
                const cls = e.unlocked ? 'codex-entry unlocked' : 'codex-entry locked';
                return `<div class="${cls}">${e.unlocked ? e.title : '???'}</div>`;
            }).join('');
        }
    }

    _updateMasteryPanel(d) {
        const mp = document.getElementById('mastery-panel');
        if (!mp || mp.style.display !== 'block' || !d.mastery) return;
        const movesEl = document.getElementById('mastery-moves');
        if (movesEl && d.mastery.getMasteryOverview) {
            movesEl.innerHTML = d.mastery.getMasteryOverview().map(m =>
                `<div class="mastery-row"><span>${m.name}</span><span>Lv${m.level}</span></div>`
            ).join('');
        }
    }

    _updateImplantsPanel(d) {
        const ip = document.getElementById('implants-panel');
        if (!ip || ip.style.display !== 'block' || !d.implants) return;
        ['neural', 'muscular', 'ocular', 'skeletal'].forEach(s => {
            const el = document.getElementById('implant-' + s);
            if (el && d.implants.getImplant) el.textContent = d.implants.getImplant(s)?.name || d.implants.getImplant(s)?.id || 'Empty';
        });
    }

    _updateCharacterPanel(d) {
        const cp = document.getElementById('character-panel');
        if (!cp || cp.style.display !== 'block') return;
        const lvlEl = document.getElementById('char-level');
        const xpFill = document.getElementById('char-xp-fill');
        if (lvlEl && d.progression) {
            lvlEl.textContent = d.progression.getLevel ? d.progression.getLevel() : (d.progression.level ?? 1);
            const xpVal = d.progression.getXP ? d.progression.getXP() : (d.progression.xp ?? 0);
            const xpNext = d.progression.getXPToNext ? d.progression.getXPToNext() : (d.progression.maxXp ?? 1);
            xpFill.style.width = Math.max(0, Math.min(100, xpNext > 0 ? (xpVal / xpNext * 100) : 100)) + '%';
        }
        const stats = d.player.getRPGStats();
        const statMap = { mob: 'char-mob', ref: 'char-ref', syn: 'char-syn', for: 'char-for', tec: 'char-tec', gut: 'char-gut' };
        for (const [key, id] of Object.entries(statMap)) {
            const el = document.getElementById(id);
            if (el) el.textContent = stats[key] ?? 10;
        }
        const archEl = document.getElementById('char-archetype');
        const origEl = document.getElementById('char-origin');
        if (archEl && d.archetype) archEl.textContent = d.archetype.currentArchetype ?? d.archetype.name ?? '-';
        if (origEl && d.origin) origEl.textContent = d.origin.currentOrigin ?? d.origin.name ?? '-';
        const resFill = document.getElementById('char-resource-fill');
        if (resFill && d.characterSheet) {
            const res = d.archetype ? d.archetype.getResourceValue() : 0;
            const maxRes = d.archetype ? d.archetype.getResourceMax() : 100;
            resFill.style.width = (maxRes > 0 ? (res / maxRes * 100) : 0) + '%';
        }
    }

    _updateManaBar(d) {
        const manaWrap = document.getElementById('mana-bar-wrap');
        if (!manaWrap) return;
        if (d.resourceSystem && d.resourceSystem.type === 'mana') {
            manaWrap.style.display = 'block';
            const manaFill = document.getElementById('mana-bar-fill');
            if (manaFill) manaFill.style.width = d.resourceSystem.getPercent() + '%';
        } else {
            manaWrap.style.display = 'none';
        }
    }
}
