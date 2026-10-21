# TalentLens — ATS B2B Éthique & Recrutement Impartial

**TalentLens** est une solution logicielle ATS (Applicant Tracking System) B2B multi-organisations conçue pour les cabinets de recrutement et équipes RH exigeantes, intégrant nativement l'évaluation sans biais cognitif via un **mode aveugle strict**, la conformité intégrale au RGPD (Règlement Général sur la Protection des Données) et un journal d'audit immuable certifié WORM / RFC 3161.

---

## 🛡️ RÈGLE D'OR & PRINCIPE DE SÉCURITÉ CENTRAL

> ### ⚠️ « Le front ne masque JAMAIS les PII » *(Personally Identifiable Information)*

Dans la plupart des systèmes conventionnels, le "masquage" ou "anonymisation" est simulé côté client à l'aide de règles CSS (`filter: blur()`, `display: none`), d'un remplacement de chaîne JavaScript ou d'un composant de masque visuel. **Cette pratique est formellement interdite dans TalentLens pour les raisons suivantes :**

1. **Fuite dans les outils de développement (DevTools) :** Si les données personnelles (nom, prénom, coordonnées, adresse, photo) sont présentes dans le payload JSON HTTP transitant sur le réseau ou dans le DOM React, n'importe quel utilisateur ou extension de navigateur peut les inspecter et neutraliser l'anonymat.
2. **Fuite dans la mémoire navigateur et le state client :** Tout objet stocké dans le cache TanStack Query, Redux ou un état React persiste dans la mémoire vive de la machine cliente.
3. **Conformité RGPD & CNIL (Privacy by Design) :** L'article 25 du RGPD exige la minimisation des données dès la conception.

### L'implémentation TalentLens :
- **Ségrégation stricte côté serveur :** En mode aveugle (actif par défaut pour toutes les étapes amont du recrutement), le serveur (Server Action, Route Handler ou Repository) ne renvoie au navigateur que le DTO caviardé `CvDocumentBlindDto`.
- **Absence physique de champs PII :** Dans `CvDocumentBlindDto`, les champs `firstName`, `lastName`, `email`, `phone`, `fullAddress`, `birthDate` **n'existent pas dans la structure**. Seuls sont transmis l'identifiant pseudonymisé (ex: `Candidat #D4M9`), l'empreinte cryptographique RFC 3161 (`SHA256:8f4c...`), les compétences techniques scorées, les synthèses de parcours dé-contextualisées et les scores d'adéquation explicables.
- **Dé-caviardage (Unmasking) audité et conditionnel :** La consultation des données nominatives (`CvDocumentFullDto`) requiert :
  1. Une habilitation rôle (Recruteur assigné, Admin ou DPO).
  2. Un motif formel et obligatoire conforme à l'article 30 du RGPD (ex: « Entretien client final validé »).
  3. Une confirmation sécurisée avec ré-authentification MFA (`<ReauthDialog>`).
  4. L'écriture synchrone et non-répudiable d'un événement dans le journal d'audit immuable WORM (`AuditEvent`), horodaté et géolocalisé.
  5. Une validité temporelle limitée (par défaut 60 minutes) après laquelle le profil redevient automatiquement anonymisé.

---

## 🏛️ Architecture & Écrans Implémentés

TalentLens propose une couverture complète de 25 écrans et parcours :

```
├── /app
│   ├── layout.tsx                     # Layout racine (ThemeProvider, QueryProvider, TopBar, Sidebar)
│   ├── page.tsx                       # Tableau de bord principal (KPIs éthiques, alertes, dossiers)
│   ├── (app)
│   │   ├── dossiers/                  # Dossiers de recrutement (#DE-2026, #CYB-88...)
│   │   │   └── [id]/                  # Vue détaillée, pipeline, shortlists, membres, paramètres
│   │   ├── pipeline/                  # Pipeline Kanban tactile snap-x avec statut de caviardage
│   │   ├── cv/[id]/                   # Fiche candidat, document PDF/SVG caviardé & bboxes
│   │   ├── a-verifier/                # File d'arbitrage humain, détection d'injections & bboxes
│   │   ├── recherche/                 # Recherche multicritères avec garde-fous anti-discrimination
│   │   ├── cartographie/              # Cartographie vectorielle 2D / 3D Three.js des compétences
│   │   ├── matching/                  # Analyse d'adéquation candidat/poste explicable
│   │   ├── shortlists/                # Listes courtes de candidats avec assistant d'export
│   │   ├── exports/                   # Historique des exports certifiés, décompte 7j & révocation
│   │   ├── chatbot/                   # Assistant conversationnel RH éthique
│   │   ├── import/                    # Import de CV par glisser-déposer avec parsing Zéro-PII
│   │   └── patterns/                  # Référentiel des compétences et profils types
│   ├── admin/
│   │   ├── audit/                     # Registre d'audit WORM, Merkle 100%, tiroir & export SOC-2
│   │   └── utilisateurs/              # Gestion des membres, invitations, rôles RBAC & révocations
│   ├── audit/                         # Redirection automatique vers /admin/audit
│   ├── rgpd/                          # Tableau de bord de conformité CNIL & demandes DSR
│   │   └── demandes/[id]/             # Double validation DPO pour droit à l'oubli (Art. 17)
│   ├── parametres/                    # Paramètres onglets (Zod, Unsaved changes, 2FA ReauthDialog)
│   ├── connexion/                     # Connexion Email/Password & Google SSO OAuth
│   ├── mfa-setup/ & mfa-verify/       # Enrôlement & élévation de privilège AAL1 -> AAL2
│   ├── invitation/[token]/            # Parcours d'acceptation par jeton SHA-256
│   └── offline/                       # Écran de repli hors-ligne sans PII pour la PWA
│
├── /components
│   ├── shared/                        # TopBar, Sidebar, ReauthDialog, BlindBadge, Can, ThemeProvider
│   ├── a-verifier/                    # LeftPane, QueueHeader, ShortcutsDialog
│   ├── export/                        # ExportWizardModal (Plafond 200, WORM, Nominatif 2FA)
│   ├── cv/                            # CvViewContainer, BoundingBoxes, UnmaskDialog
│   └── ui/                            # Composants atomiques accessibles
│
├── /lib
│   ├── api/                           # Repositories abstraits (ICvRepository, IExportRepository...)
│   ├── auth/                          # Contexte auth, sessions SSR, AAL1/AAL2, recent-auth
│   ├── exports/                       # Générateur de documents serveur RFC 4180 / PDF filigranés
│   ├── permissions/                   # Table can(user, action), RBAC, matrice de droits
│   └── schemas/                       # Schémas Zod partagés client/serveur
│
└── /tests                             # 22 fichiers de tests unitaires et d'intégration Vitest
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
- `can_reveal_identity` : autorise un recruteur certifié à solliciter une levée d'anonymat pour un entretien final avec justification obligatoire.
- `can_export` : autorise un recruteur à générer un export nominatif dans le cadre d'un transfert client sécurisé (plafonné à 200 profils).

---

## 🔐 Authentification, AAL2 & Sécurité Forte

1. **Sécurité des Sessions & Middleware :**
   - Cookies HTTP-only sécurisés (`tl_session`, `tl_role`, `tl_aal`).
   - Redirection vers `/connexion?redirect=` en l'absence de session.
   - En-têtes HTTP de sécurité stricts (CSP, X-Frame-Options, Permissions-Policy).
2. **Fournisseurs d'identité & Validation d'Invitation :**
   - Email professionnel + mot de passe robuste (validé par Zod).
   - SSO Google Workspace & LinkedIn OIDC avec rejet si l'adresse email n'a pas fait l'objet d'une invitation active (`NO_INVITATION`).
3. **Niveau MFA AAL2 Exigé pour Owner et Admin :**
   - Tout utilisateur détenant le rôle `owner` ou `admin` avec un niveau AAL1 est automatiquement redirigé vers `/mfa-verify` avant de pouvoir accéder aux pages d'administration, d'audit ou de paramètres.
4. **Ré-authentification Récente (`<ReauthDialog>`) :**
   - Contrôle systématique par mot de passe ou code TOTP 6 chiffres avant toute opération sensible (dé-caviardage de profil, export nominatif, modification de la politique MFA ou des délais de purge RGPD).
5. **Modale de Reconnexion (`SessionExpiredDialog`) :**
   - Préservation des formulaires et contexte de saisie en cas d'expiration de session.

---

## 📦 PWA & Résilience Hors-Ligne

- **Conformité PWA** : `app/manifest.ts` configuré avec métadonnées, icônes SVG/PNG et orientation responsive.
- **Service Worker (`public/sw.js`)** :
  - Mise en cache intelligente de l'application shell et des ressources statiques (`cache-first`).
  - **Exclusion stricte et absolue de mise en cache sur `/api/*`** pour interdire tout stockage local de données personnelles ou sensibles.
- **Écran de repli (`/offline`)** : Interface de déconnexion native sans données PII permettant de retenter la connexion instantanément.

---

## 🧪 Tests & Couverture de Qualité

Le projet est validé par une suite complète de **22 fichiers de tests et 211 cas de test automatisés** sans aucun échec :

| Suite de Tests | Nombre de Tests | Domaine Validé |
| :--- | :---: | :--- |
| `tests/zero-pii-integration.test.ts` | 11 tests | Zéro fuite de PII, respect absolu des DTOs aveugles |
| `tests/blind-mode-security.test.ts` | 2 tests | Caviardage natif côté serveur |
| `tests/permissions-matrix.test.ts` | 7 tests | Matrice complète RBAC, rôles et permissions fines |
| `tests/auth-flow-and-mfa.test.ts` | 6 tests | Flux d'authentification, interception AAL1/AAL2 |
| `tests/e2e-scenarios.test.ts` | 4 tests | Scénarios critiques d'accès et redirections |
| `tests/invitation-flow.test.ts` | 8 tests | Hachage SHA-256 des tokens, expirations |
| `tests/exports.test.ts` | 10 tests | Plafond 200, validité 7j, filigrane WORM, SHA-256 |
| `tests/rgpd-governance.test.ts` | 13 tests | Registre Art. 30, alertes de purge CNIL |
| `tests/rgpd-dsr.test.ts` | 11 tests | Droits à l'oubli Art. 17 avec double validation DPO |
| `tests/admin-utilisateurs.test.ts` | 16 tests | Gestion des membres, rôles et sessions distantes |
| `tests/recherche.test.ts` | 15 tests | Recherche multicritères, garde-fous anti-discrimination |
| `tests/patterns.test.ts` | 22 tests | Détection des biais, patterns d'adéquation |
| `tests/cv-screen.test.ts` | 14 tests | Affichage de document scellé et bboxes |
| `tests/cartographie.test.ts` | 8 tests | Rendu vectoriel 2D/3D Three.js des clusters |
| `tests/matching.test.ts` | 10 tests | Explicabilité des scores de matching |
| `tests/pipeline.test.ts` | 6 tests | Transitions d'étapes et drag-and-drop Kanban |
| `tests/import-flow.test.ts` | 10 tests | Parsing Zéro-PII lors de l'import |
| `tests/dashboard.test.ts` | 7 tests | KPIs, résilience et états vides |
| `tests/chatbot.test.ts` | 10 tests | Assistant conversationnel spécialisé RH éthique |
| `tests/dossiers.test.ts` | 11 tests | Gestion des dossiers et switch mode aveugle |
| `tests/zod-schemas.test.ts` | 6 tests | Intégrité des contrats de données |
| `tests/pwa-security.test.ts` | 4 tests | Conformité manifest, cache SW sans API, page /offline |

### Commandes utiles :

```bash
# Vérification du typage TypeScript strict
npm run typecheck

# Analyse statique ESLint (0 erreur, 0 avertissement)
npm run lint

# Exécution des 211 tests automatisés Vitest
npx vitest run

# Compilation de production Next.js
npm run build
```
