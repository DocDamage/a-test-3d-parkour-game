/**
 * UIManager — centralizes all UI panel toggles, updates, and dynamic DOM creation.
 *
 * Extracted from main.js to keep the composition root under 2000 lines.
 */

export class UIManager {
    constructor(deps) {
        this.deps = deps;
        this.miniBossBars = [];
        this._panelDirty = {
            stash: false,
            bounty: false,
            safehouse: false,
            codex: false,
            mastery: false
        };
        this._lastStashHash = '';
        this._invCloseWired = false;
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

        if (activeInput.wasPressed('KeyI') && !activeInput.isPressed('ShiftLeft')) {
            const sp = document.getElementById('stash-panel');
            if (sp) {
                const showing = sp.style.display === 'block';
                sp.style.display = showing ? 'none' : 'block';
                if (!showing) this._panelDirty.stash = true;
            }
            return true;
        }
        if (activeInput.wasPressed('KeyI') && activeInput.isPressed('ShiftLeft')) {
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
            return true;
        }
        if (activeInput.wasPressed('KeyP') && !activeInput.isPressed('ShiftLeft')) {
            const pt = document.getElementById('passive-tree');
            if (pt) {
                const showing = pt.style.display === 'block';
                pt.style.display = showing ? 'none' : 'block';
                if (!showing && d.passiveTree) d.passiveTree._renderUI();
            }
            return true;
        }
        if (activeInput.wasPressed('KeyP') && activeInput.isPressed('ShiftLeft')) {
            const cp = document.getElementById('character-panel');
            if (cp) cp.style.display = (cp.style.display === 'block') ? 'none' : 'block';
            return true;
        }
        if (activeInput.wasPressed('KeyG')) {
            const gp = document.getElementById('gear-panel');
            if (gp) gp.style.display = (gp.style.display === 'block') ? 'none' : 'block';
            return true;
        }
        if (activeInput.wasPressed('KeyU')) {
            const comp = document.getElementById('companion-panel');
            if (comp) comp.style.display = (comp.style.display === 'block') ? 'none' : 'block';
            return true;
        }
        // F key faction panel toggle is now handled by main.js unified KeyF dispatcher
        if (activeInput.wasPressed('KeyH')) {
            const sp = document.getElementById('safehouse-panel');
            if (sp) {
                const showing = sp.style.display === 'block';
                sp.style.display = showing ? 'none' : 'block';
                if (!showing) this._panelDirty.safehouse = true;
            }
            return true;
        }
        if (activeInput.wasPressed('KeyJ')) {
            const bp = document.getElementById('bounty-panel');
            if (bp) {
                const showing = bp.style.display === 'block';
                bp.style.display = showing ? 'none' : 'block';
                if (!showing) this._panelDirty.bounty = true;
            }
            return true;
        }
        if (activeInput.wasPressed('KeyK')) {
            const cop = document.getElementById('codex-panel');
            if (cop) {
                const showing = cop.style.display === 'block';
                cop.style.display = showing ? 'none' : 'block';
                if (!showing) this._panelDirty.codex = true;
            }
            return true;
        }
        if (activeInput.wasPressed('KeyL')) {
            const mp = document.getElementById('mastery-panel');
            if (mp) {
                const showing = mp.style.display === 'block';
                mp.style.display = showing ? 'none' : 'block';
                if (!showing) this._panelDirty.mastery = true;
            }
            return true;
        }
        if (activeInput.wasPressed('KeyM')) {
            const ip = document.getElementById('implants-panel');
            if (ip) ip.style.display = (ip.style.display === 'block') ? 'none' : 'block';
            return true;
        }
        if (activeInput.wasPressed('BracketRight')) {
            const ip = document.getElementById('inventory-panel');
            if (ip) {
                const showing = ip.style.display === 'block';
                ip.style.display = showing ? 'none' : 'block';
                if (!showing) this._updateInventoryPanel();
            }
            return true;
        }
        if (activeInput.wasPressed('KeyO') && !activeInput.isPressed('ShiftLeft')) {
            const sp = document.getElementById('settings-panel');
            if (sp) sp.style.display = (sp.style.display === 'block') ? 'none' : 'block';
            return true;
        }
        if (activeInput.wasPressed('KeyO') && activeInput.isPressed('ShiftLeft')) {
            if (d.risingTide) {
                if (d.risingTide.active) d.risingTide.stop();
                else d.risingTide.start();
            }
        }
        return false;
    }

    closeAllPanels() {
        const ids = ['settings-panel','stash-panel','shop-panel','inventory-panel','passive-tree-panel','codex-panel','mastery-panel','faction-panel','character-sheet-panel','safehouse-upgrades','bounty-contracts','rift-result-overlay','difficulty-popup'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        this._panelState = {};
    }

    /**
     * Close the topmost visible panel. Returns true if any panel was closed.
     * Used by Escape key handler to dismiss panels before showing pause menu.
     */
    closeOpenPanel() {
        const ids = [
            'settings-panel','stash-panel','shop-panel','inventory-panel',
            'passive-tree-panel','codex-panel','mastery-panel','faction-panel',
            'character-sheet-panel','safehouse-panel','bounty-panel',
            'implants-panel','gear-panel','companion-panel','keyitem-panel',
            'passive-tree','character-panel','weapon-loadout-panel',
            'rift-result-overlay','difficulty-popup',
        ];
        for (const id of ids) {
            const el = document.getElementById(id);
            if (el && el.style.display !== 'none' && el.style.display !== '') {
                el.style.display = 'none';
                return true;
            }
        }
        return false;
    }

    /* ------------------------------------------------------------------ */
    /*  Per-frame updates                                                 */
    /* ------------------------------------------------------------------ */

    update(dt) {
        const d = this.deps;
        this._updateBasicHUD(d);
        this._updateGearPanel(d);
        this._updateStashPanel(d);
        this._updateCompanionPanel(d);
        this._updateFactionPanel(d);
        this._updateSafehousePanel(d);
        this._updateBountyPanel(d);
        this._updateCodexPanel(d);
        this._updateMasteryPanel(d);
        this._updateImplantsPanel(d);
        this._updateCharacterPanel(d);
        this._updateInventoryPanel();
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

    _updateStashPanel(d) {
        const sp = document.getElementById('stash-panel');
        if (!sp || sp.style.display !== 'block' || !d.inventoryStash) return;
        const list = document.getElementById('stash-list');
        const countEl = document.getElementById('stash-count');
        if (countEl) countEl.textContent = `${d.inventoryStash.stash.length} / ${d.inventoryStash.maxSize}`;
        if (!list) return;
        const stash = d.inventoryStash.getStash();
        const hash = stash.length + '|' + stash.map(i => `${i.name}:${i.rarity}:${i.slot}`).join(',');
        if (!this._panelDirty.stash && hash === this._lastStashHash) return;
        this._panelDirty.stash = false;
        this._lastStashHash = hash;
        if (stash.length === 0) {
            list.innerHTML = '<div style="color:#666;font-size:12px;text-align:center;padding:12px 0;">Stash is empty</div>';
            return;
        }
        const rarityColors = { 1: '#aaa', 2: '#4488ff', 3: '#ffaa00', 4: '#ff8800', 5: '#00ff44', 6: '#ff4444', 7: '#ff00ff' };
        list.innerHTML = stash.map((item, i) => {
            const color = rarityColors[item.rarity] || '#fff';
            const slot = item.slot || 'gear';
            return `<div class="stash-item">
                <span class="stash-name" style="color:${color};">${item.name || 'Unknown Item'}</span>
                <span class="stash-slot">${slot}</span>
                <button class="stash-equip" data-index="${i}">Equip</button>
                <button class="stash-scrap" data-index="${i}">Scrap</button>
            </div>`;
        }).join('');
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
        if (!this._panelDirty.safehouse) return;
        this._panelDirty.safehouse = false;
        const upgContainer = document.getElementById('safehouse-upgrades');
        if (upgContainer && d.safehouse.getAllUpgrades) {
            const upgrades = d.safehouse.getAllUpgrades();
            if (!upgrades.length) {
                upgContainer.innerHTML = '<p class="empty-state">No upgrades available.</p>';
            } else {
                upgContainer.innerHTML = upgrades.map(u =>
                    `<div class="sh-upgrade"><span class="name">${u.name}</span><span class="level">Lv${u.currentLevel}/${u.maxLevel}</span><br/><span style="color:#888;">${u.description}</span></div>`
                ).join('');
            }
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

    refreshBountyPanel() {
        const bp = document.getElementById('bounty-panel');
        if (bp && bp.style.display === 'block') {
            this._updateBountyPanel(this.deps);
        }
    }

    _updateCodexPanel(d) {
        const cop = document.getElementById('codex-panel');
        if (!cop || cop.style.display !== 'block' || !d.codex) return;
        if (!this._panelDirty.codex) return;
        this._panelDirty.codex = false;
        const entriesEl = document.getElementById('codex-entries');
        if (entriesEl && d.codex.getAllEntries) {
            const entries = d.codex.getAllEntries();
            if (!entries.length) {
                entriesEl.innerHTML = '<p class="empty-state">No entries discovered yet.</p>';
            } else {
                entriesEl.innerHTML = entries.map(e => {
                    const cls = e.unlocked ? 'codex-entry unlocked' : 'codex-entry locked';
                    return `<div class="${cls}">${e.unlocked ? e.title : '???'}</div>`;
                }).join('');
            }
        }
    }

    _updateMasteryPanel(d) {
        const mp = document.getElementById('mastery-panel');
        if (!mp || mp.style.display !== 'block' || !d.mastery) return;
        if (!this._panelDirty.mastery) return;
        this._panelDirty.mastery = false;
        const movesEl = document.getElementById('mastery-moves');
        if (movesEl && d.mastery.getMasteryOverview) {
            const moves = d.mastery.getMasteryOverview();
            if (!moves.length) {
                movesEl.innerHTML = '<p class="empty-state">No mastery moves learned yet.</p>';
            } else {
                movesEl.innerHTML = moves.map(m =>
                    `<div class="mastery-row"><span>${m.name}</span><span>Lv${m.level}</span></div>`
                ).join('');
            }
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

    _updateInventoryPanel() {
        const panel = document.getElementById('inventory-panel');
        if (!panel || panel.style.display === 'none') return;
        const container = document.getElementById('inventory-list');
        if (!container) return;

        // Wire close button once
        if (!this._invCloseWired) {
            this._invCloseWired = true;
            const closeBtn = document.getElementById('inventory-close');
            if (closeBtn) closeBtn.addEventListener('click', () => {
                panel.style.display = 'none';
            });
        }

        const items = this.inventorySystem ? this.inventorySystem.getAllItems() : [];
        if (!items || !items.length) {
            container.innerHTML = '<p style="color:#666;font-size:12px;padding:8px 0;">Inventory is empty.</p>';
            return;
        }
        container.innerHTML = '';
        items.forEach((item) => {
            if (!item || !item.quantity) return;
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.04);border:1px solid #2a3a2a;border-radius:4px;padding:7px 10px;gap:8px;';

            const info = document.createElement('span');
            info.style.cssText = 'font-size:13px;flex:1;';
            info.innerHTML = `<b style="color:#cfc">${item.name || item.id}</b> <span style="color:#666;">x${item.quantity}</span>`;
            if (item.desc) {
                const desc = document.createElement('div');
                desc.style.cssText = 'font-size:10px;color:#777;margin-top:2px;';
                desc.textContent = item.desc;
                info.appendChild(desc);
            }

            const useBtn = document.createElement('button');
            useBtn.textContent = 'Use';
            useBtn.style.cssText = 'font-family:monospace;font-size:11px;padding:3px 10px;background:#1a3a1a;color:#88ff88;border:1px solid #4a7a4a;border-radius:3px;cursor:pointer;';
            useBtn.addEventListener('click', () => {
                if (this.inventorySystem && typeof this.inventorySystem.useItem === 'function') {
                    this.inventorySystem.useItem(item.id);
                    this._updateInventoryPanel();
                }
            });

            row.appendChild(info);
            row.appendChild(useBtn);
            container.appendChild(row);
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
        const nameEl = document.getElementById('char-runner-name');
        const resLblEl = document.getElementById('char-resource-label');
        if (nameEl) nameEl.textContent = localStorage.getItem('runner_name') || '—';
        if (archEl && d.archetype) {
            const primaryKey = d.archetype.getPrimaryArchetype ? d.archetype.getPrimaryArchetype() : null;
            const primaryData = primaryKey && d.archetype.getArchetypeData ? d.archetype.getArchetypeData(primaryKey) : null;
            archEl.textContent = primaryData ? primaryData.name : '-';
            if (resLblEl && primaryData) resLblEl.textContent = (primaryData.resource || 'Resource') + ':';
        }
        if (origEl && d.origin) origEl.textContent = (d.origin.getName ? d.origin.getName() : null) ?? d.origin.currentOrigin ?? '-';
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

    showLevelUp(level, points) {
        const toast = document.getElementById('levelup-toast');
        const msg = document.getElementById('levelup-msg');
        if (toast && msg) {
            msg.textContent = `Level ${level}! Attribute points: ${points}`;
            toast.style.display = 'block';
            setTimeout(() => { toast.style.display = 'none'; }, 3000);
        }
    }
}
