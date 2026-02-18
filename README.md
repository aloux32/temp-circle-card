# 🌡️ Thermomètre Circulaire — Custom Card Home Assistant

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![GitHub release](https://img.shields.io/github/release/aloux32/temp-circle-card.svg)](https://github.com/aloux32/temp-circle-card/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Une custom card Lovelace qui affiche une température sous forme d'**anneau SVG coloré dynamique**.  
Gradient interpolé, indicateur de tendance, glassmorphism, alertes visuelles, éditeur visuel complet avec système de profils sauvegardables.

![Aperçu de la carte](https://raw.githubusercontent.com/aloux32/temp-circle-card/main/preview.png)
> *Remplace `preview.png` par une capture d'écran de ta carte après installation.*

---

## ✨ Fonctionnalités

| | Fonctionnalité | Description |
|---|---|---|
| 🎨 | **Gradient interpolé** | La couleur de l'anneau transite fluidement entre les seuils (froid → chaud), sans saut brusque |
| 📈 | **Indicateur de tendance** | Flèche ↗ ↘ → calculée sur une fenêtre glissante de 5 minutes |
| 🪟 | **Glassmorphism** | Fond verre dépoli avec blur et reflets, ou fond sombre, ou transparent |
| 🔔 | **Alertes visuelles** | L'anneau clignote si la température passe sous un seuil min ou dépasse un seuil max |
| 👆 | **Tap action** | Ouvre `more-info`, navigue vers une vue HA, ou aucune action |
| 🎨 | **Éditeur de seuils** | Modifie, ajoute ou supprime des seuils de couleur directement dans l'interface HA |
| 💾 | **Profils sauvegardables** | Sauvegarde un profil complet (tailles, couleurs, jauge, alertes, seuils) et applique-le en un clic sur n'importe quelle carte |
| 🖊️ | **Tailles & couleurs texte** | Nom, valeur numérique, unité : taille et couleur configurables indépendamment |
| 📊 | **Stats Min/Max** | Affiche les entités min et max du jour en bas de la carte |
| 📱 | **Responsive** | S'adapte parfaitement à toutes les tailles de tuile de la grille HA |
| 🔧 | **Éditeur visuel (GUI)** | Zéro YAML obligatoire — tout se configure via l'interface de HA |

---

## 📦 Installation

### Via HACS (recommandé)

#### Dépôt personnalisé
1. Dans HA → **HACS** → icône ⋮ → **Dépôts personnalisés**
2. URL : `https://github.com/aloux32/temp-circle-card`
3. Catégorie : **Lovelace** → **Ajouter**
4. Cherche `Thermomètre Circulaire` → **Télécharger**
5. Vide le cache navigateur (**Ctrl+Shift+R**)

#### Catalogue officiel HACS *(si disponible)*
1. HACS → Frontend → **+ Explorer & télécharger des dépôts**
2. Rechercher `Thermomètre Circulaire` → **Télécharger**
3. Vide le cache navigateur

### Installation manuelle

1. Télécharge `temp-circle-card.js` depuis les [Releases](https://github.com/aloux32/temp-circle-card/releases)
2. Copie-le dans `/config/www/temp-circle-card.js`
3. Dans HA → **Paramètres** → **Tableau de bord** → **Ressources** → **Ajouter** :
   - URL : `/local/temp-circle-card.js?v=2`
   - Type : **Module JavaScript**
4. Vide le cache navigateur (**Ctrl+Shift+R**)

> ⚠️ **Important** : à chaque mise à jour du fichier, incrémente le numéro dans l'URL (`?v=3`, `?v=4`…) pour forcer le rechargement du cache.

---

## ⚙️ Configuration YAML complète

```yaml
type: custom:temp-circle-card

# ── Entités ──────────────────────────────────────────
entity: sensor.maison_temperature         # Requis
entity_min: sensor.temperature_salon_min  # Optionnel — entité min du jour
entity_max: sensor.temperature_salon_max  # Optionnel — entité max du jour

# ── Affichage ─────────────────────────────────────────
name: Salon                               # Nom affiché (défaut: friendly_name)
background_style: glass                   # 'transparent' | 'glass' | 'dark'
tap_action: more-info                     # 'more-info' | 'navigate' | 'none'
navigate_path: /lovelace/0               # Si tap_action: navigate

# ── Tailles & couleurs du texte ───────────────────────
font_name: 13                             # Taille du nom en px (8–28)
font_value: 32                            # Taille de la valeur en px (14–60)
font_unit: 12                             # Taille de l'unité/icône en px (8–24)
color_name: "#888888"                     # Couleur hexadécimale du nom
color_unit: "#eeeeee"                     # Couleur hexadécimale de l'unité

# ── Jauge ─────────────────────────────────────────────
gauge_min: 15                             # Borne inférieure de l'anneau
gauge_max: 30                             # Borne supérieure de l'anneau
ring_thickness: 5                         # Épaisseur de l'anneau en % (2–40)

# ── Alertes ───────────────────────────────────────────
alert_min: 16                             # L'anneau clignote si temp < cette valeur
alert_max: 27                             # L'anneau clignote si temp > cette valeur

# ── Couleurs ──────────────────────────────────────────
color_preset: interior                    # 'interior' | 'exterior' | clé profil custom
```

### Seuils de couleur entièrement personnalisés

```yaml
type: custom:temp-circle-card
entity: sensor.temperature
custom_thresholds:
  - v: 10
    c: "#03bafc"
  - v: 18
    c: "#00FF00"
  - v: 25
    c: "#FF6600"
  - v: 30
    c: "#FF0000"
```

---

## 🎨 Presets de couleur inclus

| Preset | Plage | Usage typique |
|---|---|---|
| `interior` | 15 – 30°C | Salon, chambre, bureau |
| `exterior` | -4 – 37°C | Terrasse, véranda, jardin |

---

## 💾 Système de profils

Les **profils** permettent de sauvegarder un ensemble de réglages complet et de l'appliquer en un clic sur n'importe quelle carte.

Un profil sauvegarde :
- Les tailles et couleurs du texte (nom, valeur, unité)
- Les bornes de jauge et seuils d'alerte
- L'épaisseur de l'anneau
- Les couleurs (preset ou seuils personnalisés)

**Créer un profil :**
1. Configure une carte à ton goût via l'éditeur visuel
2. Dans la section **Couleurs de l'anneau** → **✏️ Modifier seuils**
3. Descends jusqu'à la zone bleue **💾 Sauvegarder comme profil**
4. Donne un nom → **Sauvegarder**

**Appliquer un profil sur une autre carte :**
1. Dans l'éditeur → **Couleurs de l'anneau** → sélectionne ton profil dans la liste
2. Clique **⬇️ Appliquer ce profil**
3. Seuls l'entité, le nom et le style de fond restent inchangés

> Les profils sont stockés dans le `localStorage` du navigateur. Ils persistent entre les sessions sur le même appareil.

---

## 📐 Exemple — Grille 2×2

```yaml
type: grid
columns: 2
cards:
  - type: custom:temp-circle-card
    entity: sensor.maison_temperature
    name: Salon
    gauge_min: 15
    gauge_max: 30
    ring_thickness: 5
    color_preset: interior
    background_style: glass
    entity_min: sensor.temperature_salon_min
    entity_max: sensor.temperature_salon_max
    alert_min: 16
    alert_max: 26

  - type: custom:temp-circle-card
    entity: sensor.temp_veranda_sud_temperature
    name: Vrd Sud
    gauge_min: -4
    gauge_max: 37
    ring_thickness: 5
    color_preset: exterior
    background_style: glass
    entity_min: sensor.temp_veranda_sud_temperature_min
    entity_max: sensor.temp_veranda_sud_temperature_max
    alert_min: 5
    alert_max: 35
```

---

## 🔧 Référence complète des options

| Option | Type | Défaut | Description |
|---|---|---|---|
| `entity` | string | **Requis** | Entité principale de température |
| `entity_min` | string | — | Entité température min du jour |
| `entity_max` | string | — | Entité température max du jour |
| `name` | string | friendly_name | Nom affiché dans le cercle |
| `background_style` | string | `transparent` | `transparent` \| `glass` \| `dark` |
| `tap_action` | string | `more-info` | `more-info` \| `navigate` \| `none` |
| `navigate_path` | string | — | Chemin si `tap_action: navigate` |
| `font_name` | number | `13` | Taille du nom en px |
| `font_value` | number | `32` | Taille de la valeur en px |
| `font_unit` | number | `12` | Taille de l'unité/icône en px |
| `color_name` | string | `#888888` | Couleur hexadécimale du nom |
| `color_unit` | string | `#eeeeee` | Couleur hexadécimale de l'unité |
| `gauge_min` | number | `15` | Valeur minimale de l'anneau |
| `gauge_max` | number | `30` | Valeur maximale de l'anneau |
| `ring_thickness` | number | `5` | Épaisseur de l'anneau en % (2–40) |
| `alert_min` | number | — | Seuil bas d'alerte (clignotement) |
| `alert_max` | number | — | Seuil haut d'alerte (clignotement) |
| `color_preset` | string | `interior` | `interior` \| `exterior` \| clé profil custom |
| `custom_thresholds` | list | — | Liste de seuils `{v: valeur, c: "#hex"}` |

---

## 📝 Changelog

### v2.0.0
- ✅ Anneau SVG via `stroke-dasharray` — compatible tous navigateurs et appareils HA
- ✅ Gradient de couleur interpolé entre les seuils (transition fluide)
- ✅ Indicateur de tendance ↗ ↘ → sur fenêtre glissante de 5 minutes
- ✅ Style glassmorphism (backdrop-filter blur)
- ✅ Alertes visuelles par clignotement de l'anneau
- ✅ Tap action configurable (more-info, navigate, none)
- ✅ Éditeur visuel complet sans YAML obligatoire
- ✅ Saisie libre des entités avec autocomplétion native (datalist HTML)
- ✅ Tailles et couleurs du texte configurables indépendamment
- ✅ Système de profils sauvegardables et réutilisables (localStorage)
- ✅ Fix focus perdu lors de la saisie dans l'éditeur
- ✅ Fix scroll en haut lors de l'édition des seuils de couleur
- ✅ HACS-ready (hacs.json, README, releases, licence MIT)

### v1.0.0
- ✅ Première version publique

---

## 🤝 Contribuer

Les contributions sont les bienvenues !

1. Fork ce dépôt
2. Crée une branche : `git checkout -b feature/ma-fonctionnalite`
3. Commit : `git commit -m 'Ajoute ma fonctionnalité'`
4. Push : `git push origin feature/ma-fonctionnalite`
5. Ouvre une **Pull Request**

Pour signaler un bug ou proposer une amélioration → [Issues](https://github.com/aloux32/temp-circle-card/issues)

---

## 📄 Licence

MIT © [aloux32](https://github.com/aloux32)
