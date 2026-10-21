# TalentLens — ATS B2B Éthique & Recrutement Impartial

**TalentLens** est une solution logicielle ATS (Applicant Tracking System) B2B multi-organisations conçue pour les cabinets de recrutement et équipes RH exigeantes, intégrant nativement l'évaluation sans biais cognitif via un **mode aveugle strict**, la conformité intégrale au RGPD (Règlement Général sur la Protection des Données) et un journal d'audit immuable certifié.

---

## 🛡️ RÈGLE D'OR & PRINCIPE DE SÉCURITÉ CENTRAL

> ### ⚠️ « Le front ne masque JAMAIS les PII » *(Personally Identifiable Information)*

Dans la plupart des systèmes conventionnels, le "masquage" ou "anonymisation" est simulé côté client à l'aide de règles CSS (`filter: blur()`, `display: none`), d'un remplacement de chaîne JavaScript ou d'un composant de masque visuel. **Cette pratique est formellement interdite dans TalentLens pour les raisons suivantes :**

1. **Fuite dans les outils de développement (DevTools) :** Si les données personnelles (nom, prénom, coordonnées, adresse, photo) sont présentes dans le payload JSON HTTP transitant sur le réseau ou dans le DOM React, n'importe quel utilisateur ou extension de navigateur peut les inspecter et neutraliser l'anonymat.
2. **Fuite dans la mémoire navigateur et le state client :** Tout objet stocké dans le cache TanStack Query, Redux ou un état React persiste dans la mémoire vive de la machine cliente.
3. **Conformité RGPD & CNIL (Privacy by Design) :** L'article 25 du RGPD exige la minimisation des données dès la conception.

### L'implémentation TalentLens :
- **Ségrégation stricte côté serveur :** En mode aveugle (actif par défaut pour toutes les étapes amont du recrutement), le serveur (Server Action, Route Handler ou Repository) ne renvoie au navigateur que le DTO caviardé `CvDocumentBlindDto`.
- **Absence physique de champs PII :** Dans `CvDocumentBlindDto`, les champs `firstName`, `lastName`, `email`, `phone`, `fullAddress`, `birthDate` **n'existent littéralement pas**. Seuls sont transmis l'identifiant pseudonymisé (ex: `Candidat #D4M9`), l'empreinte cryptographique RFC 3161 (`SHA256:8f4c...`), les compétences techniques scorées, les synthèses de parcours dé-contextualisées et les scores d'adéquation explicables.
- **Dé-caviardage (Unmasking) audité et conditionnel :** La consultation des données nominatives (`CvDocumentFullDto`) requiert :
  1. Une habilitation rôle (Recruteur assigné, Admin ou DPO).
  2. Un motif formel et obligatoire conforme à l'article 30 du RGPD (ex: « Entretien client final validé »).
  3. Une confirmation sécurisée (avec ré-authentification MFA).
  4. L'écriture synchrone et non-répudiable d'un événement dans le journal d'audit immuable WORM (`AuditEvent`), horodaté et géolocalisé.
  5. Une validité temporelle limitée (par défaut 60 minutes) après laquelle le profil redevient automatiquement anonymisé.

---

## 🏛️ Architecture Technique

TalentLens est articulé autour d'une architecture modulaire, résiliente et typée de bout en bout :

```
├── /app                    # Routes Next.js 15 (App Router)
│   ├── layout.tsx          # Layout racine (ThemeProvider, QueryProvider, TopBar, Sidebar)
│   ├── page.tsx            # Tableau de bord principal (KPIs éthiques, alertes, dossiers)
│   ├── dossiers            # Gestion des dossiers de recrutement (#DE-2026, #CYBER-2026...)
│   ├── pipeline            # Suivi visuel des étapes de recrutement avec statut de caviardage
│   ├── recherche           # Recherche sémantique de candidats (filtres compétences, score IA)
│   ├── shortlists          # Listes courtes de candidats pour les clients
│   ├── rgpd                # Registre d'exercice des droits (Art. 15-22) & Double validation DPO
│   ├── audit               # Journal d'audit immuable conforme WORM / RFC 3161
│   ├── utilisateurs        # Gestion des membres, rôles RBAC et invitations
│   └── parametres          # Paramètres de l'organisation et gouvernance IA
│
├── /components
│   ├── shared              # Composants partagés transverses :
│   │   ├── top-bar.tsx     # Barre supérieure à 3 zones (Org, Indicateur Mode Aveugle, Profil)
│   │   ├── sidebar.tsx     # Navigation principale et sous-sections avec badges de droits
│   │   └── unmask-dialog.tsx # Modale de dé-caviardage sécurisé avec double vérification
│   └── ui                  # Composants atomiques accessibles (shadcn/ui style)
│
├── /lib
│   ├── api                 # Couche d'accès aux données abstraite (Repository Pattern)
│   │   ├── types.ts        # Interfaces des dépôts (ICvRepository, IFolderRepository...)
│   │   └── index.ts        # Sélecteur dynamique (Mock ou Supabase selon DATA_SOURCE)
│   ├── schemas             # Schémas Zod partagés client/serveur :
│   │   ├── cv-document.ts  # DTO Blind (anonymisé) vs DTO Full (nominatif audité)
│   │   ├── organization.ts # Modèles Organisation, Rôles et Membres
│   │   ├── folder.ts       # Dossiers de recrutement et critères d'évaluation
│   │   ├── pattern.ts      # Patterns d'extraction IA et détection PII
│   │   ├── candidacy.ts    # Candidatures et étapes de pipeline
│   │   ├── shortlist.ts    # Shortlists clients
│   │   ├── export.ts       # Exports conformes PDF/CSV horodatés
│   │   ├── dsr.ts          # Demandes d'exercice des droits RGPD (Art. 17 Effacement...)
│   │   └── audit.ts        # Événements du journal d'audit WORM
│   ├── mock                # Données et dépôts de simulation haute fidélité :
│   │   ├── data/           # Dataset réaliste (Horizon RH, 30 candidats, 3 dossiers)
│   │   └── repositories/   # Implémentations en mémoire respectant les règles de sécurité
│   ├── supabase            # Connecteurs et dépôts Supabase SSR
│   └── utils.ts            # Fonctions utilitaires de formatage (XOF, dates, cn)
│
├── /tests                  # Tests unitaires et d'intégration Vitest
│   ├── blind-mode-security.test.ts # Vérification stricte anti-fuite de PII
│   └── zod-schemas.test.ts         # Validation des contrats de données
│
└── /.github/workflows/ci.yml       # Intégration continue (Typecheck, Lint, Test, Build)
```

---

## 🔌 Couche d'Accès aux Données Abstraite

Pour garantir l'indépendance vis-à-vis de l'infrastructure de stockage et permettre un développement sans dépendance externe bloquante, les composants n'importent jamais la base de données directement.

Chaque domaine d'activité dispose d'une interface abstraite et de deux implémentations permutables via la variable d'environnement `DATA_SOURCE` :

```bash
# Pour utiliser les données de test haute fidélité (30 profils complets) :
DATA_SOURCE="mock"

# Pour connecter l'infrastructure Supabase en production :
DATA_SOURCE="supabase"
NEXT_PUBLIC_SUPABASE_URL="https://votre-projet.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="votre-cle-anon"
```

---

## 👥 Rôles & Habilitations (RBAC) & Table de Vérité Unique

La table de vérité `can(user, action, resource?)` dans `/lib/permissions/index.ts` fait autorité côté serveur et alimente l'ergonomie côté client via le composant `<Can action="..." />` et les hooks `usePermission()` et `useCurrentUser()`.

| Rôle | Description | Import / Sourcing | Pipeline / Shortlist | Exports (Anonymisé / Nominatif) | Levée d'Anonymat | Audit WORM / RGPD | Gestion Utilisateurs |
|---|---|---|---|---|---|---|---|
| **Propriétaire (`owner`)** | Direction générale du cabinet | ✅ Oui | ✅ Oui | ✅ Anonymisé / ✅ Nominatif (Ré-auth) | ✅ Oui (Ré-auth Art. 30) | ✅ Oui | ✅ Oui |
| **Administrateur (`admin`)** | Configuration globale & sécurité | ✅ Oui | ✅ Oui | ✅ Anonymisé / ✅ Nominatif (Ré-auth) | ✅ Oui (Ré-auth Art. 30) | ✅ Oui | ✅ Oui |
| **Recruteur (`recruiter`)** | Sourcing, matching, pipeline | ✅ Oui | ✅ Oui | ✅ Anonymisé / ⚠️ Nominatif si `can_export` | ⚠️ Si habilité `can_reveal_identity` | ❌ Non | ❌ Non |
| **DPO (`dpo`)** | Délégué à la Protection des Données | ❌ Non | ❌ Non | ✅ Anonymisé / ✅ Nominatif (Légal) | ❌ Non (Garant de l'impartialité) | ✅ Oui (Arbitrage & purges) | ❌ Non |
| **Lecteur (`reader` / `viewer`)** | Clients partenaires & observateurs | ❌ Non | ❌ Non | ❌ **Strictement AUCUN bouton d'export** | ❌ Strictement interdit | ❌ Non | ❌ Non |

### Permissions fines additionnelles
- `can_reveal_identity` : autorise exceptionnellement un recruteur certifié à solliciter une levée d'anonymat pour un entretien final.
- `can_export` : autorise un recruteur à générer un export nominatif dans le cadre d'un transfert client sécurisé.

---

## 🔐 Authentification & Sécurité Multi-Facteurs (MFA)

1. **Clients Supabase SSR & Middleware de Session :**
   - Cookies HTTP-only sécurisés (`tl_session`, `tl_role`, `tl_aal`).
   - Le middleware Next.js intercepte toutes les routes applicatives, redirige vers `/connexion?redirect=` en l'absence de session, et applique les en-têtes de sécurité stricts (CSP, X-Frame-Options, Permissions-Policy).
2. **Fournisseurs d'identité & Validation d'Invitation :**
   - Email professionnel + mot de passe (avec blocage visuel temporisé après tentatives infructueuses).
   - SSO Google Workspace & LinkedIn OIDC (`linkedin_oidc`).
   - La route `/auth/callback` contrôle impérativement :
     - Que l'adresse email est vérifiée auprès du fournisseur d'identité (`EMAIL_NOT_VERIFIED`).
     - Qu'une invitation active et non expirée correspond à l'email pour l'organisation (`NO_INVITATION`).
3. **Niveau MFA AAL2 Exigé pour Owner et Admin :**
   - Tout utilisateur détenant le rôle `owner` ou `admin` avec un niveau AAL1 est immédiatement intercepté et redirigé vers l'écran `/mfa-verify` avant de pouvoir accéder aux paramètres, à l'administration des utilisateurs ou au journal d'audit.
4. **Ré-authentification Récente (`requireRecentAuth`) :**
   - Helper serveur `requireRecentAuth(maxAgeSeconds)` garantissant qu'une confirmation forte (mot de passe ou code TOTP 6 chiffres) a eu lieu récemment (par défaut < 5 minutes) avant d'exécuter des actions à haut risque (dé-caviardage, purge RGPD Art. 17, export nominatif).
   - Composant interactif `<ReauthDialog>` côté client avec prise en compte du contexte sans perte de saisie.
5. **Modale de Reconnexion (`SessionExpiredDialog`) :**
   - En cas d'expiration de session, une modale non-bloquante préserve le formulaire en cours et permet la ré-authentification instantanée sans déchargement de page.

---

## 🧪 Tests & Qualité de Code

Le projet est couvert par une suite complète de tests garantissant la non-régression de l'ensemble des règles de sécurité :

1. **`tests/permissions-matrix.test.ts` :** Validation exhaustive de la matrice complète rôle × action, des permissions fines et du garde serveur `requirePermission()`.
2. **`tests/auth-flow-and-mfa.test.ts` :** Vérification du rejet OAuth sans invitation, de l'obligation AAL2 et des erreurs `ReauthRequiredError`.
3. **`tests/e2e-scenarios.test.ts` :** Validation unitaire des 4 scénarios d'acceptation requis :
   - Accès sans session refusé avec redirection `?redirect=`.
   - Connexion OAuth sans invitation refusée avec message explicite.
   - Admin en AAL1 redirigé vers `/mfa-verify`.
   - Lecteur ne voit aucun bouton d'export.
4. **`tests/e2e/auth-rbac.spec.ts` :** Spécifications Playwright de navigation E2E.
5. **`tests/blind-mode-security.test.ts` :** Vérification stricte anti-fuite de PII dans les DTO aveugles.
6. **`tests/zod-schemas.test.ts` :** Intégrité des contrats de données Zod.

Exécution des commandes :

```bash
# Vérification du typage TypeScript strict
pnpm typecheck

# Analyse statique ESLint (0 warning, 0 error)
pnpm lint

# Exécution des tests unitaires et d'intégration Vitest (25/25 validés)
pnpm test

# Exécution de la suite E2E Playwright
pnpm e2e

# Compilation pour la production Next.js App Router
pnpm build
```

---

## ⚙️ Intégration Continue (CI)

Le pipeline GitHub Actions (`.github/workflows/ci.yml`) s'exécute automatiquement à chaque soumission de code :
- **Node.js 20**
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
