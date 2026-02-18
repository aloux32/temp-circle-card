/**
 * temp-circle-card.js
 * Custom Card Home Assistant — Thermomètre Circulaire v2.0
 * Améliorations : Gradient interpolé, Indicateur de tendance, Glassmorphism,
 *                 Seuils personnalisables, Alerte visuelle, Tap action,
 *                 LitElement, HACS-ready
 */

// ─────────────────────────────────────────────────────────────────
//  UTILITAIRES COULEUR
// ─────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}

/**
 * Interpolation linéaire entre deux couleurs hex selon un ratio 0→1
 */
function interpolateColor(hexA, hexB, t) {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

/**
 * Retourne la couleur interpolée entre les deux seuils encadrant val
 */
function getInterpolatedColor(val, thresholds) {
  if (!thresholds || thresholds.length === 0) return '#888888';
  if (val <= thresholds[0].v) return thresholds[0].c;
  if (val >= thresholds[thresholds.length - 1].v) return thresholds[thresholds.length - 1].c;
  for (let i = 0; i < thresholds.length - 1; i++) {
    const lo = thresholds[i];
    const hi = thresholds[i + 1];
    if (val >= lo.v && val <= hi.v) {
      const t = (val - lo.v) / (hi.v - lo.v);
      return interpolateColor(lo.c, hi.c, t);
    }
  }
  return thresholds[thresholds.length - 1].c;
}

// ─────────────────────────────────────────────────────────────────
//  PRESETS DE COULEUR
// ─────────────────────────────────────────────────────────────────
const COLOR_PRESETS = {
  interior: [
    { v: 15,   c: "#03fcf0" }, { v: 15.5, c: "#03bafc" }, { v: 16,   c: "#036ffc" },
    { v: 16.5, c: "#035afc" }, { v: 17,   c: "#00803c" }, { v: 17.5, c: "#00d965" },
    { v: 18,   c: "#00ba1f" }, { v: 18.5, c: "#00FF99" }, { v: 19,   c: "#00FF66" },
    { v: 19.5, c: "#00FF33" }, { v: 20,   c: "#00FF00" }, { v: 20.5, c: "#33FF00" },
    { v: 21,   c: "#66FF00" }, { v: 21.5, c: "#99FF00" }, { v: 22,   c: "#CCFF00" },
    { v: 22.5, c: "#FFFF00" }, { v: 23,   c: "#FFCC00" }, { v: 23.5, c: "#FF9900" },
    { v: 24,   c: "#FF6600" }, { v: 24.5, c: "#FF3300" }, { v: 25,   c: "#FF0000" },
    { v: 25.5, c: "#FF0033" }, { v: 26,   c: "#FF0066" }, { v: 26.5, c: "#FF0099" },
    { v: 27,   c: "#FF00CC" }, { v: 27.5, c: "#FF00FF" }, { v: 28,   c: "#CC00FF" },
    { v: 28.5, c: "#9900FF" }, { v: 29,   c: "#6600FF" }, { v: 29.5, c: "#3300FF" },
  ],
  exterior: [
    { v: -4,   c: "#03fcf0" }, { v: 5,    c: "#03bafc" }, { v: 10,   c: "#036ffc" },
    { v: 12,   c: "#035afc" }, { v: 14,   c: "#00803c" }, { v: 16,   c: "#00d965" },
    { v: 18,   c: "#00ba1f" }, { v: 18.5, c: "#00FF99" }, { v: 19,   c: "#00FF66" },
    { v: 19.5, c: "#00FF33" }, { v: 20,   c: "#00FF00" }, { v: 20.5, c: "#33FF00" },
    { v: 21,   c: "#66FF00" }, { v: 21.5, c: "#99FF00" }, { v: 22,   c: "#CCFF00" },
    { v: 22.5, c: "#FFFF00" }, { v: 23,   c: "#FFCC00" }, { v: 24,   c: "#FF9900" },
    { v: 25,   c: "#FF6600" }, { v: 26,   c: "#FF3300" }, { v: 27,   c: "#FF0000" },
    { v: 28,   c: "#FF0033" }, { v: 30,   c: "#FF0066" }, { v: 31,   c: "#FF0099" },
    { v: 32,   c: "#FF00CC" }, { v: 33,   c: "#FF00FF" }, { v: 34,   c: "#CC00FF" },
    { v: 35,   c: "#9900FF" }, { v: 36,   c: "#6600FF" }, { v: 37,   c: "#3300FF" },
  ],
};

// ─────────────────────────────────────────────────────────────────
//  HISTORIQUE DE TENDANCE (fenêtre glissante en mémoire)
// ─────────────────────────────────────────────────────────────────
const _trendHistory = {};
const TREND_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const TREND_THRESHOLD = 0.15; // delta minimum pour flèche

function updateTrend(entityId, val) {
  if (!_trendHistory[entityId]) _trendHistory[entityId] = [];
  const now = Date.now();
  _trendHistory[entityId].push({ t: now, v: val });
  // Purge entrées trop vieilles
  _trendHistory[entityId] = _trendHistory[entityId].filter(e => now - e.t < TREND_WINDOW_MS);
}

function getTrendArrow(entityId, currentVal) {
  const history = _trendHistory[entityId];
  if (!history || history.length < 2) return '';
  const oldest = history[0].v;
  const delta = currentVal - oldest;
  if (delta > TREND_THRESHOLD) return '↗';
  if (delta < -TREND_THRESHOLD) return '↘';
  return '→';
}

function getTrendColor(arrow) {
  if (arrow === '↗') return '#FF6600';
  if (arrow === '↘') return '#03bafc';
  return 'var(--secondary-text-color, rgba(255,255,255,0.4))';
}

// ─────────────────────────────────────────────────────────────────
//  GESTIONNAIRE DE PROFILS (localStorage)
//  Un profil sauvegarde : texte (tailles+couleurs), jauge+alertes, couleurs anneau
// ─────────────────────────────────────────────────────────────────
const PRESET_STORAGE_KEY = 'temp-circle-card-presets';
const BUILTIN_KEYS = ['interior', 'exterior'];

// Clés de config incluses dans un profil
const PROFILE_KEYS = [
  'font_name', 'font_value', 'font_unit', 'color_name', 'color_unit',
  'gauge_min', 'gauge_max', 'alert_min', 'alert_max',
  'ring_thickness', 'color_preset', 'custom_thresholds',
];

const PresetManager = {
  /** Retourne tous les profils : builtins + custom */
  getAll() {
    const custom = this._loadCustom();
    return {
      interior: { label: 'Intérieur (15–30°C)', thresholds: COLOR_PRESETS.interior, builtin: true, profile: null },
      exterior: { label: 'Extérieur (-4–37°C)', thresholds: COLOR_PRESETS.exterior, builtin: true, profile: null },
      ...Object.fromEntries(
        Object.entries(custom).map(([k, v]) => [k, { ...v, builtin: false }])
      ),
    };
  },

  /** Sauvegarde un profil complet */
  save(name, profile) {
    const key = this._nameToKey(name);
    if (BUILTIN_KEYS.includes(key)) throw new Error('Nom réservé (interior/exterior)');
    const custom = this._loadCustom();
    custom[key] = {
      label: name,
      thresholds: profile.custom_thresholds || COLOR_PRESETS[profile.color_preset || 'interior'],
      profile,  // stocke tout le profil
    };
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(custom));
    return key;
  },

  /** Supprime un profil custom */
  delete(key) {
    if (BUILTIN_KEYS.includes(key)) return;
    const custom = this._loadCustom();
    delete custom[key];
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(custom));
  },

  /** Résout les seuils d'une clé (pour rétrocompat) */
  resolve(key) {
    const all = this.getAll();
    return all[key] ? all[key].thresholds : COLOR_PRESETS.interior;
  },

  /** Retourne le profil complet d'une clé custom, ou null si absent/builtin */
  resolveProfile(key) {
    if (BUILTIN_KEYS.includes(key)) return null;
    const custom = this._loadCustom();
    const entry = custom[key];
    if (!entry) return null;
    // Supporte l'ancien format (sans .profile) et le nouveau (avec .profile)
    return entry.profile || null;
  },

  _loadCustom() {
    try { return JSON.parse(localStorage.getItem(PRESET_STORAGE_KEY) || '{}'); }
    catch { return {}; }
  },

  _nameToKey(name) {
    return name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_');
  },
};

// ─────────────────────────────────────────────────────────────────
//  ÉDITEUR VISUEL v2
// ─────────────────────────────────────────────────────────────────
class TempCircleCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this._savePresetName = '';  // nom tapé dans le champ "Sauvegarder sous"
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  _entities() {
    if (!this._hass) return [];
    return Object.keys(this._hass.states).sort();
  }

  _thresholds() {
    if (this._config.custom_thresholds && this._config.custom_thresholds.length > 0) {
      return this._config.custom_thresholds;
    }
    const key = this._config.color_preset || 'interior';
    return PresetManager.resolve(key);
  }

  _render() {
    this._scrollTop = this.scrollTop; // mémorise position scroll avant re-render
    const cfg = this._config;
    const entities = this._entities();
    const thresholds = this._thresholds();
    const useCustom = !!(cfg.custom_thresholds && cfg.custom_thresholds.length > 0);

    // ── datalist pour autocomplétion entités ──
    const datalistId = 'tcc-entities-list';
    const datalistHtml = `
      <datalist id="${datalistId}">
        ${entities.map(e => `<option value="${e}">`).join('')}
      </datalist>`;

    this.innerHTML = `
      <style>
        .ed { padding: 4px 0; font-family: var(--paper-font-body1_-_font-family, sans-serif); }
        .section-title {
          font-size: 10px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase;
          color: var(--primary-color, #03a9f4); padding: 10px 0 5px;
          border-bottom: 1px solid var(--divider-color, rgba(255,255,255,0.1));
          margin-bottom: 6px;
        }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
        .row.full { grid-template-columns: 1fr; }
        .field label {
          font-size: 11px; font-weight: 600; color: var(--secondary-text-color);
          display: block; margin-bottom: 3px; text-transform: uppercase;
        }
        select, input[type=text], input[type=number] {
          width: 100%; padding: 7px 9px; box-sizing: border-box;
          border: 1px solid var(--divider-color, rgba(255,255,255,0.15));
          border-radius: 6px; background: var(--secondary-background-color, #1a1a1a);
          color: var(--primary-text-color); font-size: 12px;
        }
        select:focus, input:focus { outline: none; border-color: var(--primary-color, #03a9f4); }
        /* Champ entité avec indicateur de validité */
        .entity-input { position: relative; }
        .entity-input input { padding-right: 28px; }
        .entity-dot {
          position: absolute; right: 9px; top: 50%; transform: translateY(-50%);
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--success-color, #4caf50); pointer-events: none;
        }
        .entity-dot.invalid { background: rgba(128,128,128,0.3); }
        /* Champ couleur + texte côte à côte */
        .color-row {
          display: flex; align-items: center; gap: 8px;
        }
        .color-row input[type=color] {
          width: 36px; height: 34px; padding: 2px; flex-shrink: 0;
          border-radius: 6px; border: 1px solid var(--divider-color); cursor: pointer;
          background: none;
        }
        .color-row input[type=text] { flex: 1; }
        /* Champ numérique avec unité */
        .num-row { display: flex; align-items: center; gap: 6px; }
        .num-row input[type=number] { flex: 1; }
        .num-unit { font-size: 11px; color: var(--secondary-text-color); min-width: 20px; }
        /* Seuils personnalisés */
        .threshold-list { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; max-height: 200px; overflow-y: auto; }
        .threshold-row {
          display: flex; align-items: center; gap: 6px;
          background: var(--secondary-background-color, rgba(255,255,255,0.05));
          padding: 5px 8px; border-radius: 6px;
        }
        .threshold-row input[type=number] { width: 65px; flex-shrink: 0; }
        .threshold-row input[type=color] { width: 34px; height: 28px; padding: 2px; border-radius: 4px; border: 1px solid var(--divider-color); cursor: pointer; background: none; flex-shrink:0; }
        .threshold-row .t-hex { flex:1; font-size:11px; }
        .threshold-row .del-btn {
          background: rgba(255,60,60,0.15); color: #ff6060; border: none; border-radius: 4px;
          width: 24px; height: 24px; cursor: pointer; font-size: 14px; line-height: 1;
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        }
        .add-btn, .preset-btn {
          margin-top: 6px; padding: 6px 12px; border-radius: 6px; cursor: pointer;
          font-size: 11px; font-weight: 700; border: none;
        }
        .add-btn { background: var(--primary-color, #03a9f4); color: #fff; }
        .preset-btn { background: rgba(255,255,255,0.08); color: var(--primary-text-color); margin-left: 6px; }
        .hint { font-size: 10px; color: var(--secondary-text-color); margin-top: 2px; opacity: 0.7; }
      </style>

      ${datalistHtml}

      <div class="ed">

        <!-- ── ENTITÉS ── -->
        <div class="section-title">Entités</div>
        <div class="row full"><div class="field">
          <label>Entité principale *</label>
          <div class="entity-input">
            <input type="text" data-key="entity" list="${datalistId}"
              value="${cfg.entity||''}" placeholder="sensor.temperature..." autocomplete="off">
            <span class="entity-dot ${this._hass && this._hass.states[cfg.entity] ? '' : 'invalid'}"></span>
          </div>
        </div></div>
        <div class="row">
          <div class="field">
            <label>Entité Min</label>
            <div class="entity-input">
              <input type="text" data-key="entity_min" list="${datalistId}"
                value="${cfg.entity_min||''}" placeholder="Optionnel" autocomplete="off">
              <span class="entity-dot ${cfg.entity_min && this._hass && this._hass.states[cfg.entity_min] ? '' : 'invalid'}"></span>
            </div>
          </div>
          <div class="field">
            <label>Entité Max</label>
            <div class="entity-input">
              <input type="text" data-key="entity_max" list="${datalistId}"
                value="${cfg.entity_max||''}" placeholder="Optionnel" autocomplete="off">
              <span class="entity-dot ${cfg.entity_max && this._hass && this._hass.states[cfg.entity_max] ? '' : 'invalid'}"></span>
            </div>
          </div>
        </div>

        <!-- ── AFFICHAGE ── -->
        <div class="section-title">Affichage</div>
        <div class="row">
          <div class="field">
            <label>Nom affiché</label>
            <input type="text" data-key="name" value="${cfg.name||''}" placeholder="ex: Salon">
          </div>
          <div class="field">
            <label>Style de fond</label>
            <select data-key="background_style">
              <option value="transparent" ${(cfg.background_style||'transparent')==='transparent'?'selected':''}>Transparent</option>
              <option value="glass" ${cfg.background_style==='glass'?'selected':''}>Glassmorphism</option>
              <option value="dark" ${cfg.background_style==='dark'?'selected':''}>Sombre solide</option>
            </select>
          </div>
        </div>
        <div class="row">
          <div class="field">
            <label>Action au tap</label>
            <select data-key="tap_action">
              <option value="more-info" ${(cfg.tap_action||'more-info')==='more-info'?'selected':''}>Plus d'infos</option>
              <option value="navigate" ${cfg.tap_action==='navigate'?'selected':''}>Naviguer</option>
              <option value="none" ${cfg.tap_action==='none'?'selected':''}>Aucune</option>
            </select>
          </div>
          ${cfg.tap_action === 'navigate' ? `
          <div class="field">
            <label>Chemin</label>
            <input type="text" data-key="navigate_path" value="${cfg.navigate_path||''}" placeholder="/lovelace/0">
          </div>` : '<div></div>'}
        </div>

        <!-- ── TAILLES & COULEURS TEXTE ── -->
        <div class="section-title">Texte — Tailles & Couleurs</div>
        <div class="row">
          <div class="field">
            <label>Nom — taille</label>
            <div class="num-row">
              <input type="number" data-key="font_name" value="${cfg.font_name||13}" min="8" max="28">
              <span class="num-unit">px</span>
            </div>
          </div>
          <div class="field">
            <label>Nom — couleur</label>
            <div class="color-row">
              <input type="color" data-key="color_name" value="${cfg.color_name||'#888888'}">
              <input type="text"  data-key="color_name" value="${cfg.color_name||'#888888'}" placeholder="#888888" maxlength="7">
            </div>
          </div>
        </div>
        <div class="row">
          <div class="field">
            <label>Valeur — taille</label>
            <div class="num-row">
              <input type="number" data-key="font_value" value="${cfg.font_value||32}" min="14" max="60">
              <span class="num-unit">px</span>
            </div>
          </div>
          <div class="field">
            <label>Unité / Icône — taille</label>
            <div class="num-row">
              <input type="number" data-key="font_unit" value="${cfg.font_unit||12}" min="8" max="24">
              <span class="num-unit">px</span>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="field">
            <label>Unité — couleur</label>
            <div class="color-row">
              <input type="color" data-key="color_unit" value="${cfg.color_unit||'#eeeeee'}">
              <input type="text"  data-key="color_unit" value="${cfg.color_unit||'#eeeeee'}" placeholder="#eeeeee" maxlength="7">
            </div>
          </div>
          <div class="field">
            <label>Épaisseur anneau</label>
            <div class="num-row">
              <input type="number" data-key="ring_thickness" value="${cfg.ring_thickness||5}" min="2" max="40">
              <span class="num-unit">%</span>
            </div>
          </div>
        </div>

        <!-- ── JAUGE & ALERTES ── -->
        <div class="section-title">Jauge & Alertes</div>
        <div class="row">
          <div class="field">
            <label>Min jauge</label>
            <div class="num-row">
              <input type="number" data-key="gauge_min" value="${cfg.gauge_min!==undefined?cfg.gauge_min:15}" step="0.5">
              <span class="num-unit">°</span>
            </div>
          </div>
          <div class="field">
            <label>Max jauge</label>
            <div class="num-row">
              <input type="number" data-key="gauge_max" value="${cfg.gauge_max!==undefined?cfg.gauge_max:30}" step="0.5">
              <span class="num-unit">°</span>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="field">
            <label>Alerte si temp &lt;</label>
            <div class="num-row">
              <input type="number" data-key="alert_min" value="${cfg.alert_min!==undefined?cfg.alert_min:''}" step="0.5" placeholder="—">
              <span class="num-unit">°</span>
            </div>
          </div>
          <div class="field">
            <label>Alerte si temp &gt;</label>
            <div class="num-row">
              <input type="number" data-key="alert_max" value="${cfg.alert_max!==undefined?cfg.alert_max:''}" step="0.5" placeholder="—">
              <span class="num-unit">°</span>
            </div>
          </div>
        </div>

        <!-- ── COULEURS SEUILS ── -->
        <div class="section-title">Couleurs de l'anneau</div>

        <!-- Sélecteur de preset (builtins + custom) -->
        <div class="row">
          <div class="field">
            <label>Preset actif</label>
            <div style="display:flex;gap:6px;">
              <select data-key="color_preset" style="flex:1;">
                ${Object.entries(PresetManager.getAll()).map(([k, p]) => `
                  <option value="${k}" ${(cfg.color_preset||'interior')===k?'selected':''}>${p.label}${p.builtin?'':' ✎'}</option>
                `).join('')}
              </select>
              ${!BUILTIN_KEYS.includes(cfg.color_preset||'interior') ? `
                <button class="del-preset-btn" data-preset="${cfg.color_preset}"
                  title="Supprimer ce profil"
                  style="padding:0 10px;border-radius:6px;border:none;background:rgba(255,60,60,0.15);color:#ff6060;cursor:pointer;font-size:16px;flex-shrink:0;">
                  🗑
                </button>` : ''}
            </div>
          </div>
          <div class="field" style="display:flex;flex-direction:column;gap:5px;justify-content:flex-end;">
            <button id="edit-preset-btn"
              style="padding:6px 10px;border-radius:6px;border:none;background:rgba(255,255,255,0.08);color:var(--primary-text-color);cursor:pointer;font-size:11px;font-weight:700;">
              ${useCustom ? '✕ Annuler modifs' : '✏️ Modifier seuils'}
            </button>
            ${!BUILTIN_KEYS.includes(cfg.color_preset||'interior') && !useCustom ? `
            <button id="apply-profile-btn"
              style="padding:6px 10px;border-radius:6px;border:none;background:rgba(3,169,244,0.15);color:var(--primary-color,#03a9f4);cursor:pointer;font-size:11px;font-weight:700;">
              ⬇️ Appliquer ce profil
            </button>` : ''}
          </div>
        </div>

        <!-- Éditeur de seuils (visible uniquement si useCustom) -->
        ${useCustom ? `
          <div class="threshold-list" id="threshold-list">
            ${thresholds.map((t, i) => `
              <div class="threshold-row" data-idx="${i}">
                <input type="number" class="t-val" data-idx="${i}" value="${t.v}" step="0.5" placeholder="°C">
                <input type="color"  class="t-col" data-idx="${i}" value="${t.c}">
                <input type="text"   class="t-hex" data-idx="${i}" value="${t.c}" maxlength="7" placeholder="#rrggbb">
                <button class="del-btn" data-idx="${i}">×</button>
              </div>
            `).join('')}
          </div>
          <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;align-items:center;">
            <button class="add-btn" id="add-threshold">+ Seuil</button>
            <button class="preset-btn" id="load-interior">↺ Intérieur</button>
            <button class="preset-btn" id="load-exterior">↺ Extérieur</button>
          </div>

          <!-- Barre Sauvegarder profil complet -->
          <div style="margin-top:10px;padding:10px;border-radius:8px;background:rgba(3,169,244,0.08);border:1px solid rgba(3,169,244,0.2);">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--primary-color,#03a9f4);margin-bottom:4px;">
              💾 Sauvegarder comme profil
            </div>
            <div style="font-size:10px;color:var(--secondary-text-color);margin-bottom:8px;opacity:0.8;">
              Sauvegarde : tailles/couleurs texte · jauge & alertes · couleurs anneau
            </div>
            <div style="display:flex;gap:8px;">
              <input type="text" id="preset-name-input"
                value="${this._savePresetName}"
                placeholder="Nom du profil (ex: Cave, Bureau…)"
                style="flex:1;padding:7px 9px;border-radius:6px;border:1px solid var(--divider-color,rgba(255,255,255,0.15));background:var(--secondary-background-color,#1a1a1a);color:var(--primary-text-color);font-size:12px;box-sizing:border-box;">
              <button id="save-preset-btn"
                style="padding:7px 14px;border-radius:6px;border:none;background:var(--primary-color,#03a9f4);color:#fff;cursor:pointer;font-size:12px;font-weight:700;flex-shrink:0;">
                Sauvegarder
              </button>
            </div>
            <div id="preset-save-msg" style="font-size:11px;margin-top:4px;min-height:16px;color:var(--primary-color,#03a9f4);"></div>
          </div>
        ` : ''}
      </div>
    `;

    // ── Event listeners génériques ──
    // IMPORTANT : on distingue 'input' (frappe en cours) et 'change' (validation)
    // pour éviter que _render() soit appelé à chaque caractère et vole le focus.
    this.querySelectorAll('[data-key]').forEach(el => {
      // Sync immédiate color picker ↔ champ hex (visuel uniquement, pas de fireConfig)
      if (el.type === 'color') {
        el.addEventListener('input', e => {
          const key = e.target.dataset.key;
          this.querySelectorAll(`input[type=text][data-key="${key}"]`).forEach(t => t.value = e.target.value);
          this._onFieldChange(e, true); // true = fire immédiatement (couleur)
        });
        return;
      }
      if (el.type === 'text' && el.closest('.color-row')) {
        el.addEventListener('input', e => {
          const key = e.target.dataset.key;
          const hex = e.target.value;
          if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
            this.querySelectorAll(`input[type=color][data-key="${key}"]`).forEach(c => c.value = hex);
            this._onFieldChange(e, true);
          }
        });
        return;
      }

      // Champs select → fire immédiatement (pas de problème de focus)
      if (el.tagName === 'SELECT') {
        el.addEventListener('change', e => this._onFieldChange(e, true));
        return;
      }

      // Champs texte et nombre : mise à jour _config en mémoire à chaque frappe
      // mais on n'envoie à HA que sur 'change' (blur ou Entrée) pour éviter le re-render
      el.addEventListener('input', e => this._onFieldChange(e, false));
      el.addEventListener('change', e => this._onFieldChange(e, true));
    });

    // ── Bouton "Modifier les seuils" / "Annuler" ──
    const editBtn = this.querySelector('#edit-preset-btn');
    if (editBtn) editBtn.addEventListener('click', () => {
      if (!useCustom) {
        const key = this._config.color_preset || 'interior';
        this._config = { ...this._config, custom_thresholds: [...PresetManager.resolve(key)] };
      } else {
        const { custom_thresholds, ...rest } = this._config;
        this._config = rest;
      }
      this._fireConfig();
      this._render();
    });

    // Restaure la position de scroll après render
    if (this._scrollTop) { this.scrollTop = this._scrollTop; }

    // ── Bouton "Appliquer ce profil" (hors mode édition) ──
    const applyBtn = this.querySelector('#apply-profile-btn');
    if (applyBtn) applyBtn.addEventListener('click', () => {
      const key = this._config.color_preset;
      const profile = PresetManager.resolveProfile(key);
      if (!profile) {
        alert('Aucun profil complet trouvé pour ce preset.\nSauvegarde-le d\'abord en mode "Modifier seuils".');
        return;
      }
      // Conserve les clés propres à cette carte + le type (obligatoire pour HA)
      const keep = {
        type:             this._config.type,
        entity:           this._config.entity,
        name:             this._config.name,
        entity_min:       this._config.entity_min,
        entity_max:       this._config.entity_max,
        background_style: this._config.background_style,
        tap_action:       this._config.tap_action,
        navigate_path:    this._config.navigate_path,
      };
      Object.keys(keep).forEach(k => keep[k] === undefined && delete keep[k]);
      // On retire color_preset du profil pour ne garder que celui déjà sélectionné
      const { color_preset, ...profileWithoutPreset } = profile;
      this._config = { ...keep, color_preset: key, ...profileWithoutPreset };
      this._fireConfig();
      this._render();
    });

    // ── Bouton supprimer preset custom ──
    const delPresetBtn = this.querySelector('.del-preset-btn');
    if (delPresetBtn) delPresetBtn.addEventListener('click', () => {
      const key = delPresetBtn.dataset.preset;
      const label = PresetManager.getAll()[key]?.label || key;
      if (confirm(`Supprimer le preset "${label}" ?`)) {
        PresetManager.delete(key);
        this._config = { ...this._config, color_preset: 'interior' };
        this._fireConfig();
        this._render();
      }
    });

    // ── Éditeur de seuils ──
    if (useCustom) {
      // Color picker → fire immédiat + sync hex
      this.querySelectorAll('.t-col').forEach(el => {
        el.addEventListener('input', (e) => {
          const idx = e.target.dataset.idx;
          const hexEl = this.querySelector(`.t-hex[data-idx="${idx}"]`);
          if (hexEl) hexEl.value = e.target.value;
          this._onThresholdEdit(true);
        });
      });
      // Champ hex → fire immédiat si hex valide + sync color picker
      this.querySelectorAll('.t-hex').forEach(el => {
        el.addEventListener('input', (e) => {
          const hex = e.target.value;
          const idx = e.target.dataset.idx;
          if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
            const colEl = this.querySelector(`.t-col[data-idx="${idx}"]`);
            if (colEl) colEl.value = hex;
            this._onThresholdEdit(true);
          }
        });
      });
      // Valeur numérique → update en mémoire sur 'input', fire sur 'change' seulement
      this.querySelectorAll('.t-val').forEach(el => {
        el.addEventListener('input',  () => this._onThresholdEdit(false));
        el.addEventListener('change', () => this._onThresholdEdit(true));
      });
      this.querySelectorAll('.del-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          const idx = parseInt(e.currentTarget.dataset.idx);
          const newT = [...(this._config.custom_thresholds || [])];
          newT.splice(idx, 1);
          this._config = { ...this._config, custom_thresholds: newT };
          this._fireConfig();
          this._render();
        });
      });
      const addBtn = this.querySelector('#add-threshold');
      if (addBtn) addBtn.addEventListener('click', () => {
        const last = thresholds[thresholds.length - 1] || { v: 20, c: '#00FF00' };
        const newT = [...thresholds, { v: last.v + 1, c: last.c }];
        this._config = { ...this._config, custom_thresholds: newT };
        this._fireConfig();
        this._render();
      });
      ['interior', 'exterior'].forEach(preset => {
        const btn = this.querySelector(`#load-${preset}`);
        if (btn) btn.addEventListener('click', () => {
          this._config = { ...this._config, custom_thresholds: [...COLOR_PRESETS[preset]] };
          this._fireConfig();
          this._render();
        });
      });

      // ── Sauvegarder comme nouveau profil complet ──
      const nameInput = this.querySelector('#preset-name-input');
      if (nameInput) nameInput.addEventListener('input', e => { this._savePresetName = e.target.value; });

      const saveBtn = this.querySelector('#save-preset-btn');
      const saveMsg = this.querySelector('#preset-save-msg');
      if (saveBtn) saveBtn.addEventListener('click', () => {
        const name = (this._savePresetName || '').trim();
        if (!name) { if (saveMsg) saveMsg.textContent = '⚠️ Donne un nom au profil.'; return; }
        try {
          // Extrait les clés du profil depuis la config courante
          const profile = {};
          PROFILE_KEYS.forEach(k => { if (this._config[k] !== undefined) profile[k] = this._config[k]; });
          profile.custom_thresholds = this._config.custom_thresholds || thresholds;
          const key = PresetManager.save(name, profile);
          if (saveMsg) saveMsg.textContent = `✅ Profil "${name}" sauvegardé !`;
          const { custom_thresholds, ...rest } = this._config;
          this._config = { ...rest, color_preset: key };
          this._savePresetName = '';
          this._fireConfig();
          setTimeout(() => this._render(), 900);
        } catch (err) {
          if (saveMsg) saveMsg.textContent = `❌ ${err.message}`;
        }
      });
    }
  }


  _onThresholdEdit(fireNow = true) {
    const rows = this.querySelectorAll('.threshold-row');
    const newT = [];
    rows.forEach(row => {
      const valEl = row.querySelector('.t-val');
      const colEl = row.querySelector('.t-col');
      if (valEl && colEl) {
        newT.push({ v: parseFloat(valEl.value), c: colEl.value });
      }
    });
    if (fireNow) newT.sort((a, b) => a.v - b.v);
    this._config = { ...this._config, custom_thresholds: newT };
    if (fireNow) this._fireConfig();
  }

  _onFieldChange(e, fireNow = true) {
    const key = e.target.dataset.key;
    let value = e.target.value;

    // Gestion du mode seuils → toujours re-render
    if (key === '_threshold_mode') {
      if (value === 'custom') {
        const preset = this._config.color_preset || 'interior';
        this._config = { ...this._config, custom_thresholds: [...COLOR_PRESETS[preset]] };
      } else {
        const { custom_thresholds, ...rest } = this._config;
        this._config = rest;
      }
      this._fireConfig();
      this._render();
      return;
    }

    if (['gauge_min', 'gauge_max', 'ring_thickness', 'alert_min', 'alert_max',
         'font_name', 'font_value', 'font_unit'].includes(key)) {
      value = value === '' ? undefined : parseFloat(value);
      if (value !== undefined && isNaN(value)) return;
    }
    if (value === '' || value === undefined) {
      const c = { ...this._config };
      delete c[key];
      this._config = c;
    } else {
      this._config = { ...this._config, [key]: value };
    }

    // On envoie à HA seulement si demandé (évite le re-render pendant la frappe)
    if (fireNow) {
      this._fireConfig();
      if (key === 'tap_action') this._render();
    }
  }

  _fireConfig() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    }));
  }
}

customElements.define('temp-circle-card-editor', TempCircleCardEditor);


// ─────────────────────────────────────────────────────────────────
//  CARTE PRINCIPALE v2
// ─────────────────────────────────────────────────────────────────
class TempCircleCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._prevColor = null;
    this._alertAnimFrame = null;
  }

  static getStubConfig() {
    return {
      entity: 'sensor.temperature',
      name: 'Salon',
      gauge_min: 15,
      gauge_max: 30,
      ring_thickness: 20,
      color_preset: 'interior',
      background_style: 'glass',
      tap_action: 'more-info',
    };
  }

  static getConfigElement() {
    return document.createElement('temp-circle-card-editor');
  }

  setConfig(config) {
    if (!config.entity) throw new Error('Entité principale requise.');
    this._config = {
      name: '',
      gauge_min: 15,
      gauge_max: 30,
      ring_thickness: 20,
      color_preset: 'interior',
      background_style: 'transparent',
      tap_action: 'more-info',
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() { return 3; }

  _state(entityId) {
    if (!this._hass || !entityId) return null;
    return this._hass.states[entityId] || null;
  }

  _handleTap() {
    const cfg = this._config;
    const action = cfg.tap_action || 'more-info';
    if (action === 'none') return;
    if (action === 'navigate' && cfg.navigate_path) {
      window.history.pushState(null, '', cfg.navigate_path);
      window.dispatchEvent(new CustomEvent('location-changed', { bubbles: true, composed: true }));
      return;
    }
    // more-info (défaut)
    const ev = new CustomEvent('hass-more-info', {
      detail: { entityId: cfg.entity },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(ev);
  }

  _getThresholds() {
    const cfg = this._config;
    if (cfg.custom_thresholds && cfg.custom_thresholds.length > 0) {
      return [...cfg.custom_thresholds].sort((a, b) => a.v - b.v);
    }
    return COLOR_PRESETS[cfg.color_preset] || COLOR_PRESETS.interior;
  }

  _isAlerting(val) {
    const cfg = this._config;
    if (val === null) return false;
    if (cfg.alert_min !== undefined && val < cfg.alert_min) return true;
    if (cfg.alert_max !== undefined && val > cfg.alert_max) return true;
    return false;
  }

  _cardBackground() {
    const style = this._config.background_style || 'transparent';
    if (style === 'glass') {
      return `
        background: rgba(255, 255, 255, 0.06);
        backdrop-filter: blur(12px) saturate(180%);
        -webkit-backdrop-filter: blur(12px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.10);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.08);
      `;
    }
    if (style === 'dark') {
      return `
        background: var(--ha-card-background, #1c1c1e);
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        border: 1px solid rgba(255,255,255,0.06);
      `;
    }
    return 'background: transparent; box-shadow: none; border: none;';
  }

  _render() {
    if (!this._config) return;
    const cfg = this._config;
    const entityState = this._state(cfg.entity);

    const rawVal = entityState ? parseFloat(entityState.state) : NaN;
    const val = isNaN(rawVal) ? null : rawVal;
    const unit = entityState?.attributes?.unit_of_measurement || '°C';
    const displayName = cfg.name || entityState?.attributes?.friendly_name || cfg.entity;

    const thresholds = this._getThresholds();
    const color = val !== null ? getInterpolatedColor(val, thresholds) : 'rgba(128,128,128,0.4)';

    // Tendance
    if (val !== null) updateTrend(cfg.entity, val);
    const trendArrow = val !== null ? getTrendArrow(cfg.entity, val) : '';
    const trendColor = getTrendColor(trendArrow);

    // Jauge %
    const gaugeMin = parseFloat(cfg.gauge_min);
    const gaugeMax = parseFloat(cfg.gauge_max);
    let percent = val !== null
      ? Math.min(100, Math.max(0, ((val - gaugeMin) / (gaugeMax - gaugeMin)) * 100))
      : 0;

    // Ring — SVG stroke-dasharray method
    const ringThickness = Math.min(40, Math.max(2, parseFloat(cfg.ring_thickness) || 5));

    // Tailles et couleurs de texte configurables
    const fontName   = `${cfg.font_name  || 13}px`;
    const fontValue  = `${cfg.font_value || 32}px`;
    const fontUnit   = `${cfg.font_unit  || 12}px`;
    const colorName  = cfg.color_name || 'var(--secondary-text-color, rgba(255,255,255,0.5))';
    const colorUnit  = cfg.color_unit || 'var(--primary-text-color, #eee)';

    // Min / Max stats
    const minState = this._state(cfg.entity_min);
    const maxState = this._state(cfg.entity_max);
    const valMin = minState ? parseFloat(minState.state) : null;
    const valMax = maxState ? parseFloat(maxState.state) : null;

    const alerting = this._isAlerting(val);
    const displayVal = val !== null ? val.toFixed(1) : '--';

    const emptyColor = 'rgba(128,128,128,0.12)';

    // ── Anneau via SVG stroke-dasharray — 100% compatible tous navigateurs ──
    // On utilise un cercle SVG plutôt qu'un conic-gradient pour garantir
    // l'affichage dans tous les contextes HA (mobile, ancien Chromium embarqué).
    const svgR = 45; // rayon du cercle SVG (viewBox 0 0 100 100)
    const svgCircumference = 2 * Math.PI * svgR; // ≈ 282.74
    const svgFill = percent / 100 * svgCircumference;
    const svgGap  = svgCircumference - svgFill;
    // strokeWidth = ringThickness % de 100px viewBox
    const svgStroke = ringThickness;

    const statsHtml = (valMin !== null || valMax !== null) ? `
      <div class="stats">
        ${valMin !== null ? `<span class="stat-min">↓ ${valMin.toFixed(1)}</span>` : ''}
        ${(valMin !== null && valMax !== null) ? `<span class="stat-sep"> | </span>` : ''}
        ${valMax !== null ? `<span class="stat-max">↑ ${valMax.toFixed(1)}</span>` : ''}
      </div>` : '';

    const alertClass = alerting ? 'alerting' : '';

    const cardBg = this._cardBackground();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          border-radius: 16px;
          overflow: visible;
          cursor: ${cfg.tap_action !== 'none' ? 'pointer' : 'default'};
          ${cardBg}
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        :host(:hover) {
          ${cfg.tap_action !== 'none' ? 'transform: scale(1.015); filter: brightness(1.05);' : ''}
        }
        :host(:active) {
          ${cfg.tap_action !== 'none' ? 'transform: scale(0.97);' : ''}
        }
        .card-wrapper {
          padding: 10%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          container-type: inline-size;
        }

        /* ── Conteneur SVG cercle ── */
        .circle-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
        }
        .ring-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          transform: rotate(-90deg); /* Départ en haut */
          overflow: visible;
        }
        /* Lueur douce */
        .ring-glow {
          filter: blur(3px);
          opacity: ${alerting ? '0' : '0.35'};
        }
        /* Cercle de fond (track) */
        .ring-track {
          fill: none;
          stroke: rgba(128,128,128,0.15);
          stroke-width: ${svgStroke};
          stroke-linecap: round;
        }
        /* Cercle de valeur */
        .ring-value {
          fill: none;
          stroke: ${color};
          stroke-width: ${svgStroke};
          stroke-linecap: round;
          stroke-dasharray: ${svgFill} ${svgGap};
          stroke-dashoffset: 0;
          transition: stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1), stroke 0.7s ease;
        }
        .ring-value-glow {
          fill: none;
          stroke: ${color};
          stroke-width: ${svgStroke + 4};
          stroke-linecap: round;
          stroke-dasharray: ${svgFill} ${svgGap};
          stroke-dashoffset: 0;
        }

        /* ── Contenu centré dans le cercle ── */
        .circle-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4%;
          pointer-events: none;
        }
        .circle-name {
          font-size: ${fontName};
          font-weight: 700;
          color: ${colorName};
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0 10%;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          width: 100%;
          text-align: center;
          box-sizing: border-box;
        }
        .main-value {
          font-size: ${fontValue};
          font-weight: 900;
          line-height: 1;
          color: ${color};
          transition: color 0.7s ease;
          letter-spacing: -0.03em;
          font-variant-numeric: tabular-nums;
        }
        .trend-arrow {
          font-size: calc(${fontName} * 0.9);
          color: ${trendColor};
          margin-left: 2px;
          opacity: ${trendArrow ? '1' : '0'};
          transition: opacity 0.4s;
        }
        .unit-box {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          font-size: ${fontUnit};
          font-weight: 700;
          color: ${colorUnit};
        }
        .thermo-icon {
          width: ${fontUnit};
          height: ${fontUnit};
          fill: ${color};
          transition: fill 0.7s ease;
          flex-shrink: 0;
        }

        /* ── Stats min/max ── */
        .stats {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: clamp(9px, 2.2cqw, 13px);
          font-weight: 700;
        }
        .stat-min { color: #03bafc; }
        .stat-max { color: #FF3300; }
        .stat-sep { color: var(--secondary-text-color); opacity: 0.25; font-weight: 300; }

        /* ── Alerte : clignotement de l'anneau uniquement ── */
        @keyframes alert-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .ring-value.alerting {
          animation: alert-pulse 1.1s ease-in-out infinite;
        }
      </style>

      <div class="card-wrapper">
        <div class="circle-wrap">

          <!-- SVG anneau — méthode stroke-dasharray, compatible 100% navigateurs -->
          <svg class="ring-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <!-- Lueur douce derrière l'arc -->
            <circle class="ring-value-glow ring-glow"
              cx="50" cy="50" r="${svgR}"
            />
            <!-- Track (fond gris) -->
            <circle class="ring-track"
              cx="50" cy="50" r="${svgR}"
            />
            <!-- Arc de valeur -->
            <circle class="ring-value ${alertClass}"
              cx="50" cy="50" r="${svgR}"
            />
          </svg>

          <div class="circle-content">
            <span class="circle-name">${displayName}</span>
            <span class="main-value">${displayVal}<span class="trend-arrow">${trendArrow}</span></span>
            <div class="unit-box">
              <svg class="thermo-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 13.5V5a3 3 0 0 0-6 0v8.5a5 5 0 1 0 6 0ZM12 4a1 1 0 0 1 1 1v9.17A3 3 0 1 1 11 14.17V5a1 1 0 0 1 1-1Z"/>
              </svg>
              <span>${unit}</span>
            </div>
          </div>

        </div>
        ${statsHtml}
      </div>
    `;

    // Tap action
    const wrapper = this.shadowRoot.querySelector('.card-wrapper');
    if (wrapper && cfg.tap_action !== 'none') {
      wrapper.addEventListener('click', () => this._handleTap());
    }
  }
}

// ─────────────────────────────────────────────────────────────────
//  ENREGISTREMENT + HACS
// ─────────────────────────────────────────────────────────────────
customElements.define('temp-circle-card', TempCircleCard);

window.customCards = window.customCards || [];
// Évite les doublons si le fichier est rechargé
if (!window.customCards.find(c => c.type === 'temp-circle-card')) {
  window.customCards.push({
    type: 'temp-circle-card',
    name: 'Thermomètre Circulaire',
    description: 'Anneau de température avec gradient interpolé, tendance, glassmorphism, alertes et éditeur visuel complet.',
    preview: true,
    documentationURL: 'https://github.com/votreuser/temp-circle-card',
  });
}

console.info(
  '%c TEMP-CIRCLE-CARD %c v2.0.0 ',
  'background:#03a9f4;color:#fff;padding:2px 8px;border-radius:4px 0 0 4px;font-weight:bold;font-size:12px;',
  'background:#0a0a0a;color:#03a9f4;padding:2px 8px;border-radius:0 4px 4px 0;font-weight:bold;font-size:12px;'
);
