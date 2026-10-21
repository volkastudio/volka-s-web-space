import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const seedCases = [
  {
    slug: "koro-foods",
    kind: "concept",
    client: "Kòrò Foods",
    year: "2025",
    location: "Cotonou, Bénin",
    offer: "Autorité",
    status: "published",
    sort_order: 1,
    featured: true,
    cover_image_file: "case-koro-foods.jpg",
    translations: {
      en: {
        tagline: "A pantry brand with the poise of an export house.",
        discipline: "Brand identity",
        sector: "Food & retail",
        imageAlt: "Kòrò Foods packaging system in cream and gold on a deep green surface",
        summary:
          "A regional food producer with excellent products and packaging that undersold every one of them.",
        context:
          "Kòrò had spent six years building a trusted supply chain for shea, hibiscus, honey and cold-pressed oils. Buyers in Lagos and Paris loved the product and hesitated at the shelf. Nothing about the packaging suggested the standard inside the jar.",
        challenge:
          "The brand needed to read as premium to an export buyer without losing the warmth that made it loved locally. Every earlier attempt had drifted into either generic minimalism or heavy-handed pattern work.",
        execution:
          "We built an identity around a single engraved landscape motif, a restrained gold-on-cream palette, and a typographic system disciplined enough to survive twelve SKUs. Packaging, market stall signage and the wholesale deck all draw from one kit.",
        services: [
          "Brand strategy",
          "Naming architecture",
          "Identity system",
          "Packaging design",
          "Brand guidelines",
        ],
        deliverables: [
          "Primary and secondary logo suite",
          "Twelve-SKU packaging system",
          "Illustrated motif library",
          "42-page brand guide",
          "Wholesale and retail collateral",
        ],
        results: [
          { value: "3×", label: "Wholesale enquiries in the first quarter" },
          { value: "2", label: "New export markets opened" },
          { value: "+38%", label: "Average basket value in retail" },
        ],
      },
      fr: {
        tagline: "Une marque d'épicerie fine taillée pour l'exportation.",
        discipline: "Identité de marque",
        sector: "Alimentation & distribution",
        imageAlt: "Système de packaging Kòrò Foods crème et or sur fond vert profond",
        summary:
          "Un producteur agroalimentaire régional aux produits d'exception, dont le packaging sous-estimait chaque bocal.",
        context:
          "Kòrò avait bâti en six ans une filière d'approvisionnement irréprochable pour le karité, l'hibiscus, le miel et les huiles pressées à froid. Les acheteurs à Lagos et Paris adoraient le produit mais hésitaient en rayon. Rien ne reflétait l'exigence artisanale du contenu.",
        challenge:
          "La marque devait séduire un acheteur international haut de gamme sans perdre la chaleur qui faisait son succès local. Les tentatives précédentes oscillaient entre un minimalisme froid et des motifs surchargés.",
        execution:
          "Nous avons créé une identité autour d'un motif paysager gravé, d'une palette or et crème épurée, et d'un système typographique rigoureux capable de décliner 12 références. Du packaging aux stands, tout procède d'un même langage.",
        services: [
          "Stratégie de marque",
          "Architecture de gamme",
          "Système d'identité",
          "Design packaging",
          "Charte graphique",
        ],
        deliverables: [
          "Logos principal et secondaires",
          "Système packaging 12 références",
          "Banque de motifs illustrés",
          "Guide de marque 42 pages",
          "Supports de vente B2B et retail",
        ],
        results: [
          { value: "3×", label: "Demandes wholesale au premier trimestre" },
          { value: "2", label: "Nouveaux marchés d'export ouverts" },
          { value: "+38%", label: "Panier moyen en point de vente" },
        ],
      },
    },
  },
  {
    slug: "sayo",
    kind: "concept",
    client: "Sayo",
    year: "2025",
    location: "Lagos, Nigeria",
    offer: "Expansion",
    status: "published",
    sort_order: 2,
    featured: true,
    cover_image_file: "case-sayo.jpg",
    translations: {
      en: {
        tagline: "Making a young fintech feel like an institution.",
        discipline: "Digital platform",
        sector: "Financial services",
        imageAlt: "Sayo mobile app shown on two phones with a calm green and cream interface",
        summary:
          "A personal finance app that needed to earn trust in the first eight seconds of use.",
        context:
          "Sayo had strong retention among users who made it past onboarding, and heavy drop-off before it. The interface was capable but spoke like a prototype.",
        challenge:
          "Financial confidence is a design problem. The product had to feel calm, legible and unmistakably safe on low-end Android devices and patchy networks alike.",
        execution:
          "We rebuilt the design system around a quiet green palette, generous typographic hierarchy and a one-decision-per-screen onboarding flow. Marketing site, product UI and support content now share one voice.",
        services: [
          "Product design system",
          "Onboarding UX",
          "Marketing site",
          "Design ops",
          "Content strategy",
        ],
        deliverables: [
          "Component library across 60+ screens",
          "Rebuilt onboarding flow",
          "Marketing site and app store assets",
          "Accessibility and low-bandwidth guidelines",
        ],
        results: [
          { value: "−41%", label: "Onboarding drop-off" },
          { value: "1.4s", label: "First paint on 3G connections" },
          { value: "4.8★", label: "Average rating across 12k reviews" },
        ],
      },
      fr: {
        tagline: "Faire d'une jeune fintech une institution de confiance.",
        discipline: "Plateforme digitale",
        sector: "Services financiers",
        imageAlt: "Application mobile Sayo sur deux téléphones avec interface verte et crème",
        summary:
          "Une application de finances personnelles qui devait inspirer confiance dès les huit premières secondes.",
        context:
          "Sayo affichait une forte rétention chez les utilisateurs ayant franchi l'onboarding, mais perdait la majorité avant. L'interface fonctionnait mais ressemblait encore à un prototype.",
        challenge:
          "La confiance financière est un problème de design. Le produit devait paraître serein, lisible et sûr sur des smartphones d'entrée de gamme et des réseaux instables.",
        execution:
          "Nous avons refondu le design system autour d'une palette verte apaisante, d'une hiérarchie typographique généreuse et d'un onboarding à une seule décision par écran.",
        services: [
          "Design system produit",
          "UX onboarding",
          "Site vitrine",
          "Design ops",
          "Stratégie de contenu",
        ],
        deliverables: [
          "Bibliothèque de composants sur 60+ écrans",
          "Parcours d'onboarding repensé",
          "Site marketing et assets app stores",
          "Guide d'accessibilité et basse bande passante",
        ],
        results: [
          { value: "−41%", label: "Taux d'abandon à l'onboarding" },
          { value: "1.4s", label: "Temps de chargement sur réseau 3G" },
          { value: "4.8★", label: "Note moyenne sur les stores" },
        ],
      },
    },
  },
  {
    slug: "the-palm",
    kind: "concept",
    client: "The Palm",
    year: "2024",
    location: "Ouidah, Bénin",
    offer: "Autorité",
    status: "published",
    sort_order: 3,
    featured: false,
    cover_image_file: "case-the-palm.jpg",
    translations: {
      en: {
        tagline: "An eco-retreat that sells stillness, not spectacle.",
        discipline: "Brand identity",
        sector: "Hospitality & travel",
        imageAlt: "The Palm stationery and room key card in deep slate and natural paper",
        summary:
          "A coastal retreat built with local earth and solar power that needed a brand as deliberate as its architecture.",
        context:
          "The Palm was designed by a Beninese architect using compressed earth blocks and timber from managed groves. The founders did not want a resort identity; they wanted the site to feel like a private residence left open to friends.",
        challenge:
          "Every hospitality reference in the region pointed towards faux-colonial luxury or generic tropical resort tropes. The Palm needed an identity that felt rooted in coastal Bénin without performing folklore.",
        execution:
          "We drew a quiet typographic mark, selected uncoated, cotton-rich paper stocks, and paired them with a palette of lagoon grey, sun-bleached clay and terracotta.",
        services: [
          "Brand positioning",
          "Visual identity",
          "Signage system",
          "Print collateral",
          "Booking experience",
        ],
        deliverables: [
          "Primary wordmark and monogram",
          "Wayfinding and room signage",
          "Menu and collateral templates",
          "Direct booking web experience",
          "Editorial photography art direction",
        ],
        results: [
          { value: "84%", label: "Direct bookings without OTA commissions" },
          { value: "4.2 mo", label: "Advance booking window for high season" },
          { value: "0", label: "Single-use plastics in the identity kit" },
        ],
      },
      fr: {
        tagline: "Un éco-refuge qui célèbre le calme plutôt que le spectacle.",
        discipline: "Identité de marque",
        sector: "Hôtellerie & voyage",
        imageAlt: "Papeterie et clé de chambre The Palm en papier naturel et ardoise",
        summary:
          "Un domaine côtier construit en terre crue et énergie solaire, nécessitant une identité aussi soignée que son architecture.",
        context:
          "The Palm a été conçu par un architecte béninois en briques de terre compressée et bois local. Les fondateurs refusaient le cliché du resort balnéaire ; ils souhaitaient l'atmosphère intime d'une résidence privée.",
        challenge:
          "Toutes les références régionales penchaient vers un luxe néo-colonial ou des poncifs tropicaux. The Palm exigeait une identité enracinée dans le littoral béninois sans artifice folklorique.",
        execution:
          "Nous avons composé une marque typographique sobre, sélectionné des papiers texturés non couchés et harmonisé une palette gris lagune, argile et terracotta.",
        services: [
          "Positionnement de marque",
          "Identité visuelle",
          "Système de signalétique",
          "Papeterie et supports",
          "Expérience de réservation",
        ],
        deliverables: [
          "Wordmark principal et monogramme",
          "Signalétique et numérotation des suites",
          "Modèles de menus et papeterie",
          "Site de réservation directe",
          "Direction artistique photo",
        ],
        results: [
          { value: "84%", label: "Réservations directes sans commission OTA" },
          { value: "4.2 mois", label: "Délai moyen de réservation en haute saison" },
          { value: "0", label: "Plastique à usage unique dans l'identité" },
        ],
      },
    },
  },
  {
    slug: "atelier-noir",
    kind: "concept",
    client: "Atelier Noir",
    year: "2024",
    location: "Dakar, Sénégal",
    offer: "Expansion",
    status: "published",
    sort_order: 4,
    featured: false,
    cover_image_file: "case-atelier-noir.jpg",
    translations: {
      en: {
        tagline: "Giving architectural rigour the web presence it deserves.",
        discipline: "Digital platform",
        sector: "Architecture & design",
        imageAlt: "Atelier Noir portfolio website shown on a widescreen monitor",
        summary:
          "An architecture practice whose work outclassed every way it was being presented.",
        context:
          "Atelier Noir won work through relationships and lost it in the shortlist stage, where clients compared them against international firms with polished portfolios.",
        challenge:
          "Show the rigour of the practice without the noise of a typical agency site, and make the project archive easy to extend as the studio grows.",
        execution:
          "A restrained editorial system: one typeface, generous white space, project pages built around drawings and finished photography in sequence. The studio updates everything itself.",
        services: [
          "Visual identity",
          "Website design",
          "Project templates",
          "Photography direction",
        ],
        deliverables: [
          "Identity refresh and typographic system",
          "Portfolio site with self-managed project pages",
          "Proposal and tender document templates",
        ],
        results: [
          { value: "+3", label: "Shortlist invitations in six months" },
          { value: "2×", label: "Average project value" },
          { value: "0", label: "Developer hours needed to publish a project" },
        ],
      },
      fr: {
        tagline: "Donner à la rigueur architecturale la vitrine qu'elle mérite.",
        discipline: "Plateforme digitale",
        sector: "Architecture & design",
        imageAlt: "Site portfolio Atelier Noir affiché sur grand écran",
        summary:
          "Un cabinet d'architecture d'avant-garde dont les réalisations dépassaient largement la qualité de sa présentation.",
        context:
          "Atelier Noir remportait des projets par son réseau mais perdait des appels d'offres en phase finale face à des cabinets internationaux aux portfolios irréprochables.",
        challenge:
          "Démontrer la rigueur conceptuelle sans le bruit des sites d'agences conventionnels, et permettre une extension fluide des archives au fil des livraisons.",
        execution:
          "Un système éditorial épuré : une typographie singulière, des respirations généreuses et des pages projets articulant plans techniques et photographies d'architecture.",
        services: [
          "Identité visuelle",
          "Design de site web",
          "Gabarits de projets",
          "Direction photographique",
        ],
        deliverables: [
          "Rafraîchissement d'identité et typographie",
          "Site portfolio administrable en autonomie",
          "Modèles de dossiers de candidature et d'appels d'offres",
        ],
        results: [
          { value: "+3", label: "Sélections en phase finale en 6 mois" },
          { value: "2×", label: "Valeur moyenne des projets signés" },
          { value: "0", label: "Heures de développement pour publier un projet" },
        ],
      },
    },
  },
];

async function seed() {
  console.log("Starting Case Studies database seed...");

  for (const item of seedCases) {
    const { cover_image_file, ...caseData } = item;
    let coverPath = `cases/${cover_image_file}`;

    // Try uploading the asset if exists
    const localAssetPath = path.resolve(__dirname, `../src/assets/${cover_image_file}`);
    if (fs.existsSync(localAssetPath)) {
      try {
        const fileBuffer = fs.readFileSync(localAssetPath);
        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(coverPath, fileBuffer, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) {
          console.warn(`[seed] Storage upload warning for ${coverPath}:`, uploadError.message);
        } else {
          console.log(`[seed] Uploaded image ${coverPath} to media bucket.`);
        }
      } catch (uploadErr) {
        console.warn(`[seed] Storage skipped:`, uploadErr);
      }
    }

    const row = {
      ...caseData,
      cover_path: coverPath,
      gallery: [],
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: upsertData, error: upsertError } = await supabase
      .from("case_studies")
      .upsert(row, { onConflict: "slug" })
      .select("id, slug, client");

    if (upsertError) {
      console.error(`[seed] Failed to upsert ${item.slug}:`, upsertError.message);
    } else {
      console.log(`[seed] Successfully upserted "${item.client}" (${item.slug}). Result:`, upsertData);
    }
  }

  // Verify rows in table
  const { data: allCases, error: queryError } = await supabase
    .from("case_studies")
    .select("id, slug, client, status, featured, sort_order");

  console.log("Current case_studies in database:", queryError ? queryError.message : allCases);
  console.log("Seeding complete!");
}

seed().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
