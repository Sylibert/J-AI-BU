# GBU — Alignement Typographique du Bouton Principal

Ajustement de la composition typographique du bouton central de suivi quotidien pour reproduire fidèlement le bloc rectangulaire à deux lignes des maquettes de référence, tout en conservant le thème marron/blanc à l'état validé et le sous-texte d'annulation.

## User Review & Critical Decisions

> [!IMPORTANT]
> Les choix suivants ont été confirmés et guident la mise à jour visuelle :

- **Couleur de l'état validé confirmée** : Conservation du fond marron profond (`#2D1810`) avec bascule instantanée au toucher et transition fluide de la typographie vers le blanc (`#FFFFFF`).
- **Sous-texte d'annulation confirmé** : Conservation de la mention discrète « Appuyez pour annuler » en petit sous le bloc « NOTÉ POUR / AUJOURD’HUI ».
- **Alignement optique en bloc (d'après les captures)** : Calibrage précis des tailles et de l'interlignage des deux lignes pour que la ligne du haut (`J’AI BU` ou `NOTÉ POUR`) et la ligne du bas (`AUJOURD’HUI`) aient exactement la même largeur visuelle au centre du disque.

## 1. Overview & Core Concept

- **What It Does** : Met en valeur l'action quotidienne unique de l'application (« J’AI BU AUJOURD’HUI » / « NOTÉ POUR AUJOURD’HUI ») avec un impact graphique fort, lisible instantanément sur mobile.
- **Target Audience / Persona** : Utilisateurs mobiles sur iOS (Safari / écran d'accueil) recherchant un tracker quotidien minimaliste et tactile.
- **Key Value** : Une hiérarchie typographique équilibrée où chaque ligne forme un bloc compact et harmonieux au centre du cercle, fidèle aux captures fournies.

## 2. User Experience & Visual Design

- **Key User Flows** :
  1. **État initial (Non validé)** : Le disque jaune affiche `J’AI BU` en très gros caractères noirs sur la première ligne et `AUJOURD’HUI` juste en dessous, plus petit mais ajusté pour faire exactement la même largeur que `J’AI BU`.
  2. **Interaction au toucher (Tap)** : Bascule instantanée du fond en marron sombre (`#2D1810`), rebond élastique avec onde de choc radiale et transition fluide du texte vers le blanc.
  3. **État validé (Enregistré)** : Le disque marron affiche `NOTÉ POUR` sur la première ligne, `AUJOURD’HUI` juste en dessous avec une largeur quasi identique, et la mention « Appuyez pour annuler » en petit en dessous.
- **Visual Identity & Theme** :
  - *Aesthetic Direction* : Minimalisme utilitaire tactile inspiré des interfaces mobiles natives iOS.
  - *Color Palette & Mood* :
    - Fond d'application : Blanc cassé (`#F8F9FA`)
    - Disque état initial : Jaune vibrant (`#FFD60A` / `#FFBE0B`) et texte noir profond (`#111111`)
    - Disque état validé : Marron profond (`#2D1810`) et texte blanc (`#FFFFFF`)
  - *Typography & Hierarchy* :
    - Police du bouton : Sans-serif ultra-grasse (`Arial Black` / `Archivo Black`, graisse `900`) avec apostrophe typographique courbe (`’`).
    - **Bloc État Initial** :
      - Ligne 1 (`J’AI BU`) : `44px`, `line-height: 0.92`, `letter-spacing: 0.5px`
      - Ligne 2 (`AUJOURD’HUI`) : `22px`, `line-height: 1.0`, `letter-spacing: 0.2px`, espacement vertical ultra-serré (`2px`) pour former un bloc rectangulaire compact.
    - **Bloc État Validé** :
      - Ligne 1 (`NOTÉ POUR`) : `31px`, `line-height: 0.95`, `letter-spacing: 0.2px`
      - Ligne 2 (`AUJOURD’HUI`) : `25px`, `line-height: 1.0`, `letter-spacing: 0.1px`, espacement vertical serré (`2px`).
      - Sous-texte (`Appuyez pour annuler`) : `11px`, semi-gras, blanc adouci (`text-white/75`).

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 : Calibrage optique des largeurs de ligne (Bloc Justifié)**
  - *Chosen Approach* : Ajuster le rapport de taille entre la ligne 1 et la ligne 2 (`2:1` pour `J’AI BU` / `AUJOURD’HUI`, et `1.24:1` pour `NOTÉ POUR` / `AUJOURD’HUI`) avec suppression du contour artificiel excessif afin de retrouver le dessin net et franc des lettres de la capture.
  - *Why* : Dans les captures de référence, les deux lignes ont la même largeur horizontale et des glyphes nets sans bavure, ce qui crée l'effet de bloc graphique centré au milieu du disque.

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram** :

```
┌──────────────────────────────────────────────────────────┐
│                 Application GBU (PWA)                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Conteneur Swipe Horizontal (Tracker <-> Calendrier)│  │
│  └───────────────┬────────────────────────┬───────────┘  │
│                  ▼                        ▼              │
│  ┌──────────────────────────────┐  ┌──────────────────┐  │
│  │ Vue 1 : Bouton Central (272) │  │ Vue 2 : Histoire │  │
│  │                              │  │ & Statistiques   │  │
│  │  • État Initial (Jaune/Noir) │  │  • Ce mois-ci    │  │
│  │    [     J’AI BU     ] (44px)│  │  • Cette année   │  │
│  │    [   AUJOURD’HUI   ] (22px)│  │  • Grille Mois   │  │
│  │                              │  └──────────────────┘  │
│  │  • État Validé (Marron/Blanc)│                        │
│  │    [    NOTÉ POUR    ] (31px)│                        │
│  │    [   AUJOURD’HUI   ] (25px)│                        │
│  │    (Appuyez pour annuler)    │                        │
│  └──────────────────────────────┘                        │
└──────────────────────────────────────────────────────────┘
```

- **Interactive Component & State Mapping** :
  - Pression sur le disque central → Déclenche le retour haptique, bascule instantanément la couleur de fond (`#FFD60A` ↔ `#2D1810`), anime le rebond élastique (`satisfying-pop`), fait évoluer la couleur du texte en douceur et met à jour `localStorage` (`gbu_validated_dates`).
