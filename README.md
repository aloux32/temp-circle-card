# 🌡️ Thermomètre Circulaire — Custom Card Home Assistant

Une custom card Lovelace affichant la température sous forme d'anneau coloré dynamique, avec gradient interpolé, indicateur de tendance, effet glassmorphism et alertes visuelles.

## ✨ Fonctionnalités

| Feature | Description |
|---|---|
| 🎨 **Gradient interpolé** | Transition fluide entre les seuils de couleur (froid → chaud) |
| 📈 **Indicateur de tendance** | Flèche ↗ ↘ → calculée sur une fenêtre glissante de 5 min |
| 🪟 **Glassmorphism** | Fond verre dépoli avec blur + reflets (optionnel) |
| 🔔 **Alertes visuelles** | Clignotement de l'anneau si temp < min ou > max configurable |
| 👆 **Tap action** | Ouvre `more-info`, navigue vers une vue, ou aucune action |
| 🎨 **Seuils personnalisés** | Éditeur visuel intégré pour créer ses propres palettes |
| 📊 **Stats Min/Max** | Affiche les entités min/max du jour en bas de la carte |
| 📱 **Responsive** | S'adapte à toute taille de tuile via container queries |

## 📦 Installation

### Via HACS (recommandé)
1. HACS → Frontend → **+ Explorer & télécharger des dépôts**
2. Rechercher `Thermomètre Circulaire`
3. Télécharger et vider le cache navigateur

### Manuel
1. Copier `temp-circle-card.js` dans `/config/www/`
2. Paramètres → Tableau de bord → **Ressources** → Ajouter :
   - URL : `/local/temp-circle-card.js`
   - Type : Module JavaScript

## ⚙️ Configuration YAML

```yaml
type: custom:temp-circle-card
entity: sensor.maison_temperature      # Requis
name: Salon                            # Optionnel (défaut: friendly_name)
gauge_min: 15                          # Borne inférieure de l'anneau
gauge_max: 30                          # Borne supérieure de l'anneau
ring_thickness: 20                     # Épaisseur anneau en % (5–50)
color_preset: interior                 # 'interior' ou 'exterior'
background_style: glass               # 'transparent' | 'glass' | 'dark'
tap_action: more-info                  # 'more-info' | 'navigate' | 'none'
# navigate_path: /lovelace/cameras    # Si tap_action: navigate
entity_min: sensor.temperature_salon_min
entity_max: sensor.temperature_salon_max
alert_min: 16                         # Alerte si temp < 16°C
alert_max: 27                         # Alerte si temp > 27°C
```

### Seuils de couleur personnalisés
```yaml
type: custom:temp-circle-card
entity: sensor.temperature
custom_thresholds:
  - v: 10
    c: "#03bafc"
  - v: 20
    c: "#00FF00"
  - v: 30
    c: "#FF0000"
```

## 🎨 Presets inclus

| Preset | Plage | Usage typique |
|---|---|---|
| `interior` | 15 – 30°C | Pièces de vie, bureau |
| `exterior` | -4 – 37°C | Terrasse, véranda, jardin |

## 📐 Exemple de grille (2×2)

```yaml
type: grid
columns: 2
cards:
  - type: custom:temp-circle-card
    entity: sensor.maison_temperature
    name: Salon
    gauge_min: 15
    gauge_max: 30
    background_style: glass
    entity_min: sensor.temperature_salon_min
    entity_max: sensor.temperature_salon_max
    alert_max: 26

  - type: custom:temp-circle-card
    entity: sensor.temp_veranda_sud_temperature
    name: Vrd Sud
    gauge_min: -4
    gauge_max: 37
    color_preset: exterior
    background_style: glass
    entity_min: sensor.temp_veranda_sud_temperature_min
    entity_max: sensor.temp_veranda_sud_temperature_max
    alert_min: 5
    alert_max: 35
```

## 📝 Changelog

### v2.0.0
- ✅ Gradient de couleur interpolé entre les seuils
- ✅ Indicateur de tendance (fenêtre glissante 5 min)
- ✅ Mode Glassmorphism
- ✅ Alertes visuelles (clignotement + badge)
- ✅ Tap action configurable
- ✅ Éditeur de seuils personnalisés dans l'UI
- ✅ Fichiers HACS

### v1.0.0
- Première version
