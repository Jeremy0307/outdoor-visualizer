# Outdoor Visualizer — Roadmap

## Vision

Application mobile iOS et Android permettant aux artisans et particuliers de simuler des aménagements extérieurs à partir de photographies réelles.

Principes :
- Une seule base de code iOS et Android.
- Fonctionnement 100 % hors ligne.
- Aucune intelligence artificielle.
- Utilisation simple, adaptée aux artisans non techniques.
- Import de photographies de véritables matériaux.
- Aucune dépendance à un catalogue fournisseur.

## Phase 0 — Fondations
- [x] Créer le dépôt GitHub.
- [x] Initialiser Expo SDK 58 et TypeScript.
- [x] Lancer l'application sur iPhone.
- [ ] Tester le lancement sur Android.
- [ ] Configurer les tests et la CI.
- [ ] Définir l'architecture.
- [ ] Préparer le backlog GitHub.

## Phase 1 — Gestion des photographies
- [ ] Photographier un chantier.
- [ ] Importer une photo depuis la galerie.
- [ ] Afficher, zoomer et déplacer la photo.
- [ ] Gérer les autorisations iOS et Android.

## Phase 2 — Éditeur de zones
- [ ] Dessiner un polygone au doigt.
- [ ] Déplacer les sommets.
- [ ] Ajouter ou supprimer des points.
- [ ] Gérer plusieurs zones.
- [ ] Annuler et rétablir les modifications.

## Phase 3 — Matériaux personnalisés
- [ ] Photographier un matériau réel.
- [ ] Importer une photo existante.
- [ ] Recadrer l'échantillon.
- [ ] Atténuer les raccords de répétition.
- [ ] Enregistrer le matériau localement.
- [ ] Constituer un catalogue personnel.

## Phase 4 — Moteur de rendu
- [ ] Appliquer une texture dans un polygone.
- [ ] Répéter la texture.
- [ ] Ajuster son échelle et sa rotation.
- [ ] Corriger manuellement la perspective.
- [ ] Comparer plusieurs matériaux.
- [ ] Optimiser les performances mobiles.

## Phase 5 — Projets et export
- [ ] Enregistrer un projet localement.
- [ ] Réouvrir et modifier un projet.
- [ ] Exporter une simulation.
- [ ] Générer un avant/après.
- [ ] Partager le résultat.

## Phase 6 — Bêta
- [ ] Tester avec de vrais artisans.
- [ ] Tester sur iPhone et Android.
- [ ] Vérifier le fonctionnement sans Internet.
- [ ] Corriger les problèmes de rendu.
- [ ] Préparer la distribution bêta.

## Critères de validation

Une fonctionnalité n'est terminée que si :
1. Elle fonctionne sur iOS et Android.
2. Elle fonctionne hors connexion.
3. Elle ne nécessite aucune IA.
4. Elle a été testée sur des photos réelles.
5. Elle ne provoque aucune régression connue.

## Hors périmètre V1

- Génération d'images par IA.
- Reconnaissance automatique des surfaces.
- Réalité augmentée en direct.
- Synchronisation cloud.
- Comptes utilisateurs obligatoires.
- Import de modèles 3D.
