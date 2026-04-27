/**
 * SkillBarUI.js
 * DOM-based skill bar with cooldown overlays, resource orb, and keybind labels.
 * Updates every frame from SkillSystem state.
 */

export class SkillBarUI {
  constructor(skillSystem, resourceSystem) {
    this.skillSystem = skillSystem;
    this.resource = resourceSystem;
    this.elements = {};
    this.container = null;
    this.resourceOrb = null;
    this._initDOM();
  }

  _initDOM() {
    // Main container
    const container = document.createElement('div');
    container.id = 'skill-bar';
    container.style.cssText = `
      position: fixed;
      bottom: 52px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 8px;
      align-items: flex-end;
      z-index: 20;
      pointer-events: none;
      user-select: none;
    `;

    const slots = ['LMB', 'RMB', 'Q', 'E', 'R'];
    const labels = { LMB: 'LMB', RMB: 'RMB', Q: 'Q', E: 'E', R: 'R' };
    const colors = { LMB: '#ffaa00', RMB: '#ff6600', Q: '#00ccff', E: '#00ff66', R: '#ff0066' };

    slots.forEach(slot => {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        position: relative;
        width: 56px;
        height: 56px;
        background: rgba(0,0,0,0.7);
        border: 2px solid ${colors[slot]};
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      // Icon / name text
      const text = document.createElement('div');
      text.className = `skill-text-${slot}`;
      text.style.cssText = `
        color: ${colors[slot]};
        font-size: 10px;
        font-weight: bold;
        text-align: center;
        text-shadow: 0 1px 3px rgba(0,0,0,0.9);
        pointer-events: none;
        padding: 2px;
      `;
      text.textContent = '-';

      // Cooldown overlay
      const overlay = document.createElement('div');
      overlay.className = `skill-overlay-${slot}`;
      overlay.style.cssText = `
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.65);
        display: none;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px;
        font-weight: bold;
        text-shadow: 0 1px 4px rgba(0,0,0,0.9);
      `;

      // Keybind label
      const keybind = document.createElement('div');
      keybind.style.cssText = `
        position: absolute;
        top: 2px; right: 4px;
        color: rgba(255,255,255,0.6);
        font-size: 9px;
        font-weight: bold;
      `;
      keybind.textContent = labels[slot];

      wrapper.appendChild(text);
      wrapper.appendChild(overlay);
      wrapper.appendChild(keybind);
      container.appendChild(wrapper);

      this.elements[slot] = { wrapper, text, overlay };
    });

    // Resource orb (between LMB and RMB, or to the left)
    const orb = document.createElement('div');
    orb.id = 'resource-orb';
    orb.style.cssText = `
      position: fixed;
      bottom: 52px;
      left: calc(50% - 160px);
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(0,0,0,0.7);
      border: 2px solid #888;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      z-index: 20;
      pointer-events: none;
    `;

    const orbFill = document.createElement('div');
    orbFill.id = 'resource-orb-fill';
    orbFill.style.cssText = `
      position: absolute;
      bottom: 0; left: 0; right: 0;
      background: #ffaa00;
      opacity: 0.5;
      border-radius: 0 0 50% 50%;
      height: 0%;
      transition: height 0.1s;
    `;

    const orbText = document.createElement('div');
    orbText.id = 'resource-orb-text';
    orbText.style.cssText = `
      color: white;
      font-size: 11px;
      font-weight: bold;
      text-shadow: 0 1px 3px rgba(0,0,0,0.9);
      z-index: 1;
    `;
    orbText.textContent = '0';

    const orbLabel = document.createElement('div');
    orbLabel.id = 'resource-orb-label';
    orbLabel.style.cssText = `
      color: rgba(255,255,255,0.6);
      font-size: 8px;
      z-index: 1;
    `;
    orbLabel.textContent = 'Resource';

    orb.appendChild(orbFill);
    orb.appendChild(orbText);
    orb.appendChild(orbLabel);

    this.resourceOrb = { element: orb, fill: orbFill, text: orbText, label: orbLabel };
    this.container = container;

    document.body.appendChild(orb);
    document.body.appendChild(container);
    this.hide();
  }

  update() {
    if (!this.skillSystem) return;

    const slots = ['LMB', 'RMB', 'Q', 'E', 'R'];

    slots.forEach(slot => {
      const el = this.elements[slot];
      const assigned = this.skillSystem.slots[slot];

      if (!assigned) {
        el.text.textContent = '-';
        el.overlay.style.display = 'none';
        el.wrapper.style.opacity = '0.4';
        return;
      }

      const resolved = this.skillSystem.getResolvedSkill(slot);
      el.text.textContent = resolved ? resolved.name : assigned.skillId;
      el.wrapper.style.opacity = '1.0';

      // Cooldown overlay
      const cdRemaining = this.skillSystem.getCooldownRemaining(slot);
      const cdTotal = this.skillSystem.getCooldownTotal(slot);

      if (cdRemaining > 0 && cdTotal > 0) {
        el.overlay.style.display = 'flex';
        el.overlay.textContent = cdRemaining < 1.0
          ? cdRemaining.toFixed(1)
          : Math.ceil(cdRemaining).toString();
        // Darken based on cooldown progress
        const pct = cdRemaining / cdTotal;
        el.overlay.style.background = `rgba(0,0,0,${0.4 + pct * 0.4})`;
      } else {
        el.overlay.style.display = 'none';
      }

      // Resource affordability dimming
      if (resolved && resolved.finalResourceCost > 0) {
        const canAfford = this.resource && this.resource.current >= resolved.finalResourceCost;
        el.wrapper.style.filter = canAfford ? 'none' : 'grayscale(0.7)';
      } else {
        el.wrapper.style.filter = 'none';
      }
    });

    // Resource orb
    if (this.resource) {
      const pct = this.resource.getPercent();
      const color = this.resource.getColor();
      this.resourceOrb.fill.style.height = pct + '%';
      this.resourceOrb.fill.style.background = color;
      this.resourceOrb.text.textContent = Math.floor(this.resource.current);
      this.resourceOrb.label.textContent = this.resource.getDisplayName();
      this.resourceOrb.element.style.borderColor = color;
    }
  }

  show() {
    if (this.container) this.container.style.display = 'flex';
    if (this.resourceOrb) this.resourceOrb.element.style.display = 'flex';
  }

  hide() {
    if (this.container) this.container.style.display = 'none';
    if (this.resourceOrb) this.resourceOrb.element.style.display = 'none';
  }

  dispose() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    if (this.resourceOrb && this.resourceOrb.element.parentNode) {
      this.resourceOrb.element.parentNode.removeChild(this.resourceOrb.element);
    }
  }
}
