# Outdoor Visualizer — Architecture

## Stack actuelle

- Expo SDK 58
- React Native 0.88
- React 19
- TypeScript
- Expo Router
- React Native Gesture Handler
- React Native Reanimated

## Technologies envisagées

- React Native Skia : rendu graphique et masques.
- Expo ImagePicker : capture et import photographique.
- Expo FileSystem : stockage des images.
- Expo SQLite : stockage des métadonnées des projets.

Ces dépendances seront installées et validées progressivement.

## Architecture cible

src/
  app/                Navigation Expo Router
  components/         Composants UI partagés
  features/
    editor/           Édition des zones
    materials/        Import et catalogue de matériaux
    renderer/         Moteur graphique
    projects/         Gestion des projets
  database/           Persistance locale
  services/           Appareil photo, fichiers, export
  hooks/              Hooks partagés
  constants/          Constantes et thème
  utils/              Fonctions utilitaires

## Principes techniques

1. Logique métier indépendante de la navigation.
2. Composants réutilisables sur iOS et Android.
3. Données utilisateur conservées localement.
4. Pas d'appel réseau nécessaire au fonctionnement.
5. Traitement d'image déterministe, sans IA.
6. Moteur de rendu séparé des écrans.
7. Tests sur les deux plateformes dès le développement.

## Risque technique principal

Le rendu réaliste de matériaux photographiés par un utilisateur.

Une photo peut contenir des ombres, des variations de lumière
et des raccords visibles lorsqu'elle est répétée.

Un prototype du moteur graphique devra valider :
- La qualité des textures répétées.
- Le rendu dans une zone polygonale.
- La transformation de perspective.
- Les performances sur téléphones réels.

La faisabilité d'un rendu photoréaliste n'est pas encore validée.
