import type { PostRecord, ResolvedPost } from "@/lib/post-schema";
import { resolvePost } from "@/lib/post-schema";

export const initialPosts: PostRecord[] = [
  {
    id: "d1a8e2b4-5c91-4e72-98e3-0f1e8a7b9c11",
    slug: "cout-site-web-benin-afrique",
    status: "published",
    published_at: "2026-10-15T10:00:00Z",
    created_at: "2026-10-15T10:00:00Z",
    updated_at: "2026-10-15T10:00:00Z",
    cover_path: "cases/case-koro-foods.jpg",
    tags: ["Stratégie", "Budget", "Afrique de l'Ouest"],
    reading_time_minutes: 6,
    social_links: {
      youtube: "https://www.youtube.com/@volkastudio",
      linkedin: "https://www.linkedin.com/company/volka-studio",
      tiktok: "https://www.tiktok.com/@volkastudio",
      instagram: "",
      twitter: "",
      facebook: "",
    },
    translations: {
      fr: {
        title: "Le coût réel d'un site web au Bénin : au-delà du devis initial",
        excerpt:
          "Pourquoi un site à 150 000 FCFA finit souvent par coûter des millions en opportunités perdues, et comment budgétiser un actif digital rentable.",
        seo_title: "Prix d'un site web au Bénin & Afrique de l'Ouest | Volka Journal",
        seo_description:
          "Guide complet pour comprendre la structure tarifaire d'un site web professionnel à Cotonou et en Afrique de l'Ouest.",
        cover_alt: "Espace de travail moderne d'un studio numérique à Cotonou",
        body_md: `
Sur les marchés francophones d'Afrique de l'Ouest, le prix d'un site internet fait l'objet d'un grand écart déroutant. Entre le prestataire indépendant qui propose une vitrine à 150 000 FCFA et le cabinet international qui facture 15 millions de FCFA, les chefs d'entreprise peinent à situer la juste valeur de leur investissement.

La réalité est souvent cruelle : **un site web bon marché n'est pas une économie, c'est une perte sèche différée.**

---

### 1. La facture cachée des solutions à bas coût

Lorsqu'un prestataire facture une somme dérisoire, il ne peut pas concevoir sur mesure. Il achète un modèle préconçu (theme WordPress ou Wix) et remplace les textes :

1. **Une lenteur asphyxiante** : Ces thèmes pèsent souvent 8 à 15 Mo par page. Sur une connexion mobile 4G instable à Cotonou ou Abidjan, le visiteur attend 12 secondes avant d'abandonner.
2. **Aucune prise en compte du contexte local** : Les tunnels d'achat pensés pour l'Europe ignorent la prédominance de WhatsApp et du Mobile Money.
3. **Une maintenance fantôme** : Dès la première faille de sécurité ou mise à jour de plugin, le site tombe en panne sans personne pour intervenir.

> *"Votre site web est votre commercial le plus visible. S'il bégaie, met 10 secondes à répondre et ne ressemble à rien, vos prospects concluent que vos services sont du même acabit."*

---

### 2. Comment se décompose un investissement sérieux

Un produit digital conçu pour durer mobilise quatre compétences distinctes :

* **La stratégie de contenu et positionnement** : Définir clairement qui vous êtes, à qui vous parlez et pourquoi votre offre surclasse les alternatives.
* **Le design de marque et UI sur-mesure** : Typographie exclusive, hiérarchie visuelle, rythme de lecture qui inspire une confiance immédiate.
* **L'ingénierie logicielle** : Temps de chargement inférieur à 1,5 seconde, zéro dépendance superflue, sécurité maximale et résilience réseau.
* **La passerelle de conversion** : Formulaires allégés, synchronisation directe avec vos canaux de réponse (WhatsApp, email pro).

---

### 3. Quel budget prévoir selon votre ambition ?

Pour une PME ou un cabinet d'expertise en Afrique de l'Ouest :

* **Site vitrine d'autorité (2 à 5 millions FCFA)** : Idéal pour asseoir une crédibilité institutionnelle auprès de bailleurs, clients corporate ou partenaires internationaux.
* **Plateforme digitale & expansion (5 à 10 millions FCFA)** : Architecture sur-mesure avec back-office d'administration, flux d'onboarding et intégrations API.

Un bon site ne doit pas vous coûter de l'argent : il doit devenir votre canal d'acquisition le plus rentable dès son premier trimestre de mise en ligne.
        `,
      },
      en: {
        title: "The true cost of building a website in West Africa: beyond the initial quote",
        excerpt:
          "Why a cheap website often costs millions in lost business, and how ambitious brands budget for a digital asset that actually converts.",
        seo_title: "How much does a website cost in West Africa? | Volka Journal",
        seo_description:
          "A realistic breakdown of web development costs in Cotonou and West Africa for founders and decision makers.",
        cover_alt: "Contemporary creative studio workspace in West Africa",
        body_md: `
Across West African emerging markets, website pricing varies wildly. From a freelancer offering a site for $250 to international agencies billing $25,000, founders struggle to identify the real cost of a digital footprint.

The truth is straightforward: **a cheap website is not an economy; it is a delayed liability.**

---

### 1. The hidden tax of low-budget websites

When an agency charges next to nothing, they cannot afford custom work. They install a bloated off-the-shelf theme and replace the images:

1. **Crippling performance**: These themes routinely weigh 10MB per page. On variable 3G/4G connections in Cotonou or Lagos, visitors bounce before the second second.
2. **Ignorance of local context**: Checkout funnels built for Western debit cards ignore WhatsApp negotiation and Mobile Money workflows.
3. **Zero technical longevity**: At the first plugin vulnerability, the website breaks with no support in sight.

---

### 2. The four pillars of serious digital craft

An authoritative website is a compound of distinct disciplines:
* **Positioning strategy**: Articulating why your firm commands premium fees.
* **Bespoke UI & typography**: Establishing immediate institutional stature.
* **High-performance engineering**: Sub-1.5s load times, zero telemetry bloat, and total resilience.
* **Conversion pathways**: Streamlined friction-free routing to WhatsApp and enterprise email.
        `,
      },
    },
  },
  {
    id: "f3b9c7d1-8e2a-4a56-b712-4c6d8e9f0a22",
    slug: "mobile-first-afrique-de-l-ouest",
    status: "published",
    published_at: "2026-10-18T14:00:00Z",
    created_at: "2026-10-18T14:00:00Z",
    updated_at: "2026-10-18T14:00:00Z",
    cover_path: "cases/case-sayo.jpg",
    tags: ["Engineering", "Performance", "Mobile"],
    reading_time_minutes: 5,
    social_links: {
      youtube: "https://www.youtube.com/@volkastudio",
      tiktok: "https://www.tiktok.com/@volkastudio",
      linkedin: "",
      instagram: "",
      twitter: "",
      facebook: "",
    },
    translations: {
      fr: {
        title: "Mobile-first en Afrique de l'Ouest : concevoir pour la réalité des réseaux",
        excerpt:
          "78% du trafic ouest-africain s'effectue sur des smartphones d'entrée de gamme en connexion 3G/4G intermittente. Voici nos règles de conception strictes.",
        seo_title: "Mobile-first & Performance web en Afrique de l'Ouest | Volka",
        seo_description:
          "Comment concevoir des sites web ultra-rapides et légers pour les utilisateurs mobiles en Afrique de l'Ouest.",
        cover_alt: "Interface mobile fluide affichée sur smartphone en situation de mobilité",
        body_md: `
Concevoir pour le web ouest-africain ne consiste pas simplement à réduire la largeur d'un écran d'ordinateur. Cela exige de changer radicalement de paradigme technique.

Dans notre région, votre utilisateur type consulte votre site dans les transports, sur un smartphone Android à mémoire modeste, avec un forfait data payé au mégaoctet et une connexion qui oscille entre 3G et 4G.

---

### Nos 5 règles de fer chez Volka

#### 1. Le budget poids strict : sous les 500 Ko
Chaque ressource téléchargée a un coût financier pour l'internaute et un impact direct sur le temps d'affichage. Nous optimisons nos polices typographiques en sous-ensembles latins et servons les photographies au format WebP/AVIF avec compression chirurgicale.

#### 2. Priorité absolue au texte visible
Le visiteur doit pouvoir lire le message principal en moins d'une seconde, même si les visuels décoratifs terminent leur chargement en arrière-plan.

#### 3. Cibles tactiles généreuses (48px minimum)
Les boutons et champs de saisie doivent être manipulables d'une seule main, sans risque de fausse manipulation sur un écran aux bordures étroites.

#### 4. Aucune animation bloquante
Les animations doivent guider le regard, jamais retarder l'accès à l'information. Tout mouvement est automatiquement désactivé lorsque l'utilisateur active le mode d'économie de batterie ou d'accessibilité.

#### 5. Résilience hors-ligne partielle
Si le réseau coupe pendant que le prospect remplit un formulaire, ses données saisies sont sauvegardées localement afin qu'il ne perde aucun effort lors de la reconnexion.
        `,
      },
      en: {
        title: "Mobile-first in West Africa: engineering for low-bandwidth realities",
        excerpt:
          "78% of West African traffic happens on budget smartphones with variable connectivity. Here are our strict engineering guidelines.",
        seo_title: "Mobile-first Web Engineering in West Africa | Volka",
        seo_description:
          "How to design and build blazing fast digital experiences tailored for African mobile networks.",
        cover_alt: "Responsive mobile interface on modern smartphone",
        body_md: `
Designing for the West African web is not about shrinking a desktop layout onto a smaller canvas. It requires a foundational technical discipline.

Here, your core audience browses your brand on mid-range Android devices, on metered data plans, through cellular connections that fluctuate between 3G and 4G.

---

### Our 5 non-negotiable standards

1. **Sub-500KB initial payload**: We subset fonts and optimize imagery ruthlessly into AVIF and WebP.
2. **Instant typography render**: Copy must be legible within 800ms, regardless of background asset loading.
3. **48px minimum touch targets**: Zero misclicks on mobile viewport edges.
4. **Zero blocking motion**: Motion explains hierarchy; it must never stall reading.
5. **Form state persistence**: Network drops must never erase a prospect's typed brief.
        `,
      },
    },
  },
  {
    id: "a9c8e7f2-1b3d-4e5f-9a01-2c3d4e5f6a33",
    slug: "whatsapp-canal-conversion-digital",
    status: "published",
    published_at: "2026-10-20T09:30:00Z",
    created_at: "2026-10-20T09:30:00Z",
    updated_at: "2026-10-20T09:30:00Z",
    cover_path: "cases/case-the-palm.jpg",
    tags: ["Conversion", "WhatsApp", "E-commerce"],
    reading_time_minutes: 4,
    social_links: {
      linkedin: "https://www.linkedin.com/company/volka-studio",
      youtube: "https://www.youtube.com/@volkastudio",
      tiktok: "",
      instagram: "",
      twitter: "",
      facebook: "",
    },
    translations: {
      fr: {
        title: "WhatsApp comme canal de vente principal : anatomie d'un flux à fort taux de conversion",
        excerpt:
          "Remplacer les formulaires interminables par un dialogue direct pré-qualifié. Notre méthode pour transformer l'application de messagerie en moteur commercial.",
        seo_title: "WhatsApp & Conversion digitale en Afrique | Volka Journal",
        seo_description:
          "Comment intégrer WhatsApp sur un site web professionnel pour multiplier par 3 vos demandes qualifiées.",
        cover_alt: "Écran d'échange professionnel sur messagerie instantanée sécurisée",
        body_md: `
En Afrique subsaharienne, WhatsApp n'est pas une simple application de messagerie : **c'est le système d'exploitation du commerce.**

Pourtant, la grande majorité des sites web continuent d'imposer des formulaires froids de dix champs ou des tunnels de paiement rigides qui provoquent jusqu'à 85% d'abandon.

---

### L'erreur commune : le bouton WhatsApp "sauvage"

Mettre un simple lien \`wa.me\` sans préparation génère souvent une avalanche de messages non qualifiés : *"Bonjour, c'est combien ?"*. L'équipe commerciale perd des heures à filtrer.

---

### La méthode Volka : la pré-qualification fluide

Pour allier la chaleur de la messagerie instantanée à la rigueur d'un pipeline commercial B2B, nous appliquons une règle en 3 étapes :

1. **La sélection d'intention en amont** : Le visiteur choisit son type de projet et son échéance sur le site via des cartes interactives.
2. **Le message pré-rempli structuré** : En cliquant sur WhatsApp, l'application s'ouvre avec un texte clair déjà rédigé :
   \`"Bonjour Volka, je souhaite échanger sur une offre [Expansion] pour l'entreprise [Nom]. Échéance souhaitée : [Mois]."\`
3. **Le double canal de repli** : Pour les entreprises soumises à des audits d'achats stricts, une copie du brief est transmise simultanément par email professionnel sécurisé.

Résultat mesuré chez nos clients : **un taux de conversion supérieur de 40%** et une première réponse commerciale apportée en moins de deux heures ouvrées.
        `,
      },
      en: {
        title: "WhatsApp as a primary sales funnel: anatomy of a high-converting flow",
        excerpt:
          "Replacing abandoned carts with pre-qualified direct conversations. How we bridge modern web interfaces with instant messaging.",
        seo_title: "WhatsApp Sales Funnel in African Markets | Volka Journal",
        seo_description:
          "Best practices for integrating WhatsApp into modern B2B websites across Africa.",
        cover_alt: "Professional instant messaging interface on smartphone",
        body_md: `
In Sub-Saharan Africa, WhatsApp is not just a messaging app: **it is the operating system of commerce.**

Yet the majority of corporate websites continue to demand exhaustive forms that trigger high abandonment rates.

---

### The amateur approach vs. The engineered funnel

Placing a raw WhatsApp button on a homepage floods your team with vague inquiries.

Our engineered approach solves this:
1. **Interactive intent selector**: The visitor clicks their budget range and scope in 3 taps.
2. **Structured pre-filled message**: WhatsApp opens with their exact requirements pre-populated.
3. **Simultaneous audit logging**: The brief is logged in the admin pipeline and backed up via email.

The result is a friction-free experience with **40% higher conversion rates** and faster deal velocity.
        `,
      },
    },
  },
];

export function getStaticPosts(locale: "fr" | "en" = "fr"): ResolvedPost[] {
  return initialPosts
    .filter((p) => p.status === "published")
    .map((p) => resolvePost(p, locale));
}

export function getStaticPost(slug: string, locale: "fr" | "en" = "fr"): ResolvedPost | null {
  const record = initialPosts.find((p) => p.slug === slug);
  if (!record) return null;
  return resolvePost(record, locale);
}
