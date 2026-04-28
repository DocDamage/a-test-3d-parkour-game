/**
 * I18n — lightweight internationalization with interpolation, pluralization, and locale detection.
 * No build step; loads JSON locale files dynamically.
 */

const FALLBACK_LOCALE = 'en';
const STORAGE_KEY = 'apex_locale';

export class I18n {
    constructor() {
        this.locale = FALLBACK_LOCALE;
        this._catalog = {};
        this._listeners = [];
        this._ready = false;
    }

    async init(availableLocales = ['en']) {
        const stored = this._getStoredLocale();
        const detected = stored || this._detectLocale(availableLocales);
        await this.setLocale(detected, availableLocales);
    }

    async setLocale(locale, availableLocales = ['en']) {
        const target = availableLocales.includes(locale) ? locale : FALLBACK_LOCALE;
        if (target !== this.locale || !this._ready) {
            this.locale = target;
            try {
                const res = await fetch(`locales/${target}.json`);
                this._catalog = res.ok ? await res.json() : {};
            } catch (e) {
                this._catalog = {};
            }
            this._ready = true;
            try { localStorage.setItem(STORAGE_KEY, target); } catch (e) { /* ignore */ }
            this._notify();
        }
        return this;
    }

    t(key, vars = {}) {
        let str = this._catalog[key];
        if (typeof str !== 'string') str = key;
        return str.replace(/\{\{(\w+)\}\}/g, (_, name) => {
            return vars[name] !== undefined ? String(vars[name]) : `{{${name}}}`;
        });
    }

    n(key, count, vars = {}) {
        const pluralKey = `${key}_plural`;
        const str = count === 1 ? this.t(key, { ...vars, count }) : this.t(pluralKey, { ...vars, count });
        return str.includes('{{count}}') ? str.replace('{{count}}', String(count)) : str;
    }

    fmtNumber(value, options = {}) {
        try {
            return new Intl.NumberFormat(this.locale, options).format(value);
        } catch (e) {
            return String(value);
        }
    }

    fmtDate(value, options = {}) {
        try {
            return new Intl.DateTimeFormat(this.locale, options).format(value);
        } catch (e) {
            return String(value);
        }
    }

    fmtRelativeTime(value, unit = 'second', options = {}) {
        try {
            return new Intl.RelativeTimeFormat(this.locale, options).format(value, unit);
        } catch (e) {
            return String(value);
        }
    }

    onChange(fn) {
        this._listeners.push(fn);
        return () => {
            const idx = this._listeners.indexOf(fn);
            if (idx >= 0) this._listeners.splice(idx, 1);
        };
    }

    applyDOM(root = document.body) {
        root.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) el.textContent = this.t(key);
        });
        root.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (key) el.title = this.t(key);
        });
        root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key) el.placeholder = this.t(key);
        });
    }

    _detectLocale(available) {
        const nav = navigator.language || navigator.userLanguage || FALLBACK_LOCALE;
        const primary = nav.split('-')[0].toLowerCase();
        if (available.includes(nav)) return nav;
        if (available.includes(primary)) return primary;
        return FALLBACK_LOCALE;
    }

    _getStoredLocale() {
        try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    }

    _notify() {
        for (const fn of this._listeners) {
            try { fn(this.locale); } catch (e) { /* ignore */ }
        }
    }
}

export const i18n = new I18n();
