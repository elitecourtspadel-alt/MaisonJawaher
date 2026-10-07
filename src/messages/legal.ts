/**
 * The privacy policy and the terms of use, once per language.
 * A block is a paragraph (string) or a bullet list (string[]).
 * {email}, {phone} and {place} are replaced with the shop's details from the portal settings.
 * Keep the wording in step with what the site really does (analytics, cookies, what an order stores).
 */
export type LegalBlock = string | string[];
export type LegalSection = { id: string; title: string; blocks: LegalBlock[] };
export type LegalDoc = { title: string; subtitle: string; updatedLabel: string; updated: string; contactTitle: string; contactBody: string; sections: LegalSection[] };
export type LegalKey = 'privacy' | 'terms';

const en: Record<LegalKey, LegalDoc> = {
  privacy: {
    title: 'Privacy policy',
    subtitle: 'What we do with your information, in plain words.',
    updatedLabel: 'Last updated', updated: '3 October 2026',
    contactTitle: 'A question about your information?', contactBody: 'Write to us at {email} and we will answer personally.',
    sections: [
      {
        id: 'who', title: 'Who we are',
        blocks: [
          'Maison Jawaher is a small jewelry brand based in Morocco. We design our pieces here, finish them by hand and sell them through this website, with delivery across the country and payment in cash when the parcel arrives.',
          'This page explains what information the website collects, why, and what you can do about it. We have tried to keep it short and honest. If something is unclear, ask us.',
        ],
      },
      {
        id: 'principles', title: 'The short version',
        blocks: [
          [
            'You do not need an account to browse or to order. We do not ask you to register and we do not build a profile about you.',
            'We only use what you send us to answer you or to deliver your order. Nothing more.',
            'We do not sell your details, we do not rent them out and we do not use them for advertising lists.',
            'We look at visit statistics, which are anonymous and only describe the site as a whole, to understand which pages are useful.',
          ],
        ],
      },
      {
        id: 'order', title: 'When you place an order',
        blocks: [
          'To deliver your order we need to know who it is for and where it goes. When you send the order form we receive:',
          ['your name and phone number', 'your email address, only if you chose to give it', 'your city and delivery address', 'the note you wrote, if any', 'the pieces you ordered, the total, the date and the language you were using'],
          'We use this to call or message you to confirm the order, to prepare and deliver it, and to help you if something is wrong. If you gave an email address we also send you a confirmation. This is the only reason we keep order details. Nobody is added to a mailing list because they ordered.',
        ],
      },
      {
        id: 'contact', title: 'When you write to us',
        blocks: [
          'If you use the contact form we receive your name, email address, the message you wrote and, if you chose to add it, your phone number and a subject. We use them only to reply to you. We keep a copy of the message in our private inbox so that we can follow up, and we delete it when it is no longer needed. You can ask us to delete it sooner at any time.',
        ],
      },
      {
        id: 'visits', title: 'Visit statistics',
        blocks: [
          'When it is switched on, we use Google Analytics to count visits. It tells us in aggregate how many people visit, which pages they open, what kind of device they use and roughly which country they come from. We have asked Google to anonymise IP addresses and we have turned off advertising features, so this information is not used to follow you around the web.',
          'We never link these statistics to your name, your phone number or your orders. If you prefer not to be counted, you can block analytics in your browser or with a content blocker, and the site will work exactly the same.',
        ],
      },
      {
        id: 'storage', title: 'Cookies and what stays on your device',
        blocks: [
          'We keep a few small things in your browser so that the site works the way you left it:',
          ['your cart, so it is still there when you come back (stored on your device, not on our servers, until you order or empty it)', 'your language choice (a small cookie called mj-locale, kept for a year)', 'your colour mode, light or dark (stored on your device)'],
          'When analytics is switched on, Google Analytics also sets its own cookies to tell one visit from another. We use no advertising or tracking cookies. You can delete any of these at any time from your browser settings.',
        ],
      },
      {
        id: 'location', title: 'Choosing your language',
        blocks: ['The first time you open the site we use the approximate country of your connection to show it in French (in Morocco and in countries where French is widely spoken) or in English. We do not store your location. If you pick a language yourself with the language menu in the header, we remember that choice and it always wins.'],
      },
      {
        id: 'sharing', title: 'Who else sees your information',
        blocks: [
          'Only the people who need it to do their job:',
          ['the delivery company, who receives your name, phone number and address so that the parcel reaches you', 'the services that run the website for us: hosting and database, and the email service that sends our messages', 'Google, for the visit statistics described above'],
          'These services act on our instructions and are not allowed to use your information for their own purposes. We may also disclose information if the law requires it.',
        ],
      },
      {
        id: 'keeping', title: 'How long we keep it',
        blocks: ['Order details are kept for as long as we need them to deliver and support your order, and for as long as the law requires us to keep sales records. Messages are kept only as long as it takes to deal with them. Visit statistics are anonymous and are kept in aggregate form.'],
      },
      {
        id: 'rights', title: 'Your rights',
        blocks: [
          'Under Moroccan law on the protection of personal data (Law 09-08) you can ask us to show you what we hold about you, to correct it, or to delete it, and you can object to us using it. Send your request to {email} and tell us the name and phone number you used so that we can find it. We will reply as soon as we can.',
          'If you feel we have not handled your information properly you can also contact the national data protection authority, the CNDP.',
        ],
      },
      {
        id: 'security', title: 'Keeping it safe',
        blocks: ['The site is served over a secure connection, the admin area is protected by a login and optional two-step verification, and only the people who handle orders can see them. No system is perfectly safe, but we take reasonable care and we never ask for card numbers: you pay in cash on delivery.'],
      },
      {
        id: 'changes', title: 'Changes to this page',
        blocks: ['If we change what we do with your information we will update this page and the date at the top. Please look at it from time to time.'],
      },
    ],
  },
  terms: {
    title: 'Terms of use',
    subtitle: 'The rules for using the website and ordering from us.',
    updatedLabel: 'Last updated', updated: '3 October 2026',
    contactTitle: 'Anything unclear?', contactBody: 'Write to us at {email} or message us on WhatsApp and we will explain.',
    sections: [
      {
        id: 'about', title: 'About these terms',
        blocks: [
          'These terms apply when you visit maisonjawaher.com or order from Maison Jawaher. By using the website or placing an order you agree to them. If you do not agree, please do not use the site.',
          'Maison Jawaher is a jewelry brand based in {place}. You can reach us at {email} or on {phone}.',
        ],
      },
      {
        id: 'products', title: 'Our pieces',
        blocks: ['We describe and photograph every piece as carefully as we can. Our jewelry is finished by hand, so small differences between pieces are normal, and colours can look a little different on different screens. Sizes, weights and materials are given as a guide.'],
      },
      {
        id: 'prices', title: 'Prices and availability',
        blocks: [
          'Prices are shown in Moroccan dirhams (MAD) when they are shown at all. Some pieces are listed as “price on request”: in that case we tell you the price when we contact you, before anything is final.',
          'We can change prices and stop selling a piece at any time. A change never affects an order we have already confirmed with you. Because pieces are made in small batches, a piece can sell out between the moment you add it to your cart and the moment we confirm your order. If that happens we will tell you.',
        ],
      },
      {
        id: 'orders', title: 'How ordering works',
        blocks: [
          'There is no online checkout. When you send your order through the website you are asking us to sell you those pieces. The sale is agreed once we have contacted you by phone or WhatsApp and confirmed the details, the price and the delivery. Until then you can change your mind and we can decline an order, for example if a piece is no longer available or we cannot reach you.',
          'Please give us a correct name, phone number and address. We cannot deliver an order we cannot confirm.',
        ],
      },
      {
        id: 'payment', title: 'Payment',
        blocks: ['You pay in cash, in dirhams, when the parcel is handed to you. The website never asks for a card number or a bank detail. If a delivery fee applies we tell you its amount when we confirm your order.'],
      },
      {
        id: 'delivery', title: 'Delivery',
        blocks: ['We deliver across Morocco. We tell you the expected delivery time when we confirm your order. Delivery times are an estimate and can be affected by the carrier or by events outside our control. Please check your parcel when you receive it and tell us right away if something is wrong.'],
      },
      {
        id: 'problems', title: 'Problems, returns and refunds',
        blocks: [
          'If a piece arrives damaged, is not what you ordered, or has a fault, contact us within 7 days of receiving it, with a photo if you can. We will repair it, replace it or refund you, whichever suits you better and is possible.',
          'This does not take away any rights the law gives you as a consumer, including under Moroccan consumer protection law (Law 31-08).',
        ],
      },
      {
        id: 'use', title: 'Using the website',
        blocks: [
          'Please use the site honestly. In particular, please do not:',
          ['place false or joke orders', 'try to break into, overload or interfere with the website or its forms', 'copy the website automatically in bulk (scraping) or reuse our photos and texts commercially without asking'],
          'We may block access to anyone who abuses the site.',
        ],
      },
      {
        id: 'ip', title: 'Our content',
        blocks: ['The name Maison Jawaher, the logo, the designs, the photographs and the texts on this site belong to us or to the people who made them for us. You are welcome to share a link or a picture of a piece on social media with credit to us. Anything beyond that needs our written permission.'],
      },
      {
        id: 'liability', title: 'Our responsibility',
        blocks: ['We do our best to keep the website running and its information correct, but we cannot promise that it will always be available or free of mistakes. To the extent the law allows, we are not responsible for losses that come from using the website, other than those the law does not let us exclude. Nothing here limits our responsibility for a faulty piece as described above.'],
      },
      {
        id: 'privacy', title: 'Your information',
        blocks: ['How we handle the information you give us is explained in our privacy policy, which is part of these terms.'],
      },
      {
        id: 'law', title: 'Governing law',
        blocks: ['These terms are governed by Moroccan law. If we cannot settle a disagreement together, the competent courts of Morocco will deal with it.'],
      },
      {
        id: 'changes', title: 'Changes to these terms',
        blocks: ['We may update these terms from time to time. The date at the top shows the latest version. An order is always governed by the terms that applied on the day you placed it.'],
      },
    ],
  },
};

const fr: Record<LegalKey, LegalDoc> = {
  privacy: {
    title: 'Politique de confidentialité',
    subtitle: 'Ce que nous faisons de vos informations, en termes simples.',
    updatedLabel: 'Dernière mise à jour', updated: '3 octobre 2026',
    contactTitle: 'Une question sur vos informations ?', contactBody: 'Écrivez-nous à {email} et nous vous répondrons personnellement.',
    sections: [
      {
        id: 'who', title: 'Qui sommes-nous',
        blocks: [
          'Maison Jawaher est une petite maison de bijoux basée au Maroc. Nous dessinons nos pièces ici, nous les finissons à la main et nous les vendons sur ce site, avec livraison partout au Maroc et paiement en espèces à la réception du colis.',
          'Cette page explique quelles informations le site recueille, pourquoi, et ce que vous pouvez faire à ce sujet. Nous avons voulu rester courts et honnêtes. Si quelque chose n’est pas clair, demandez-nous.',
        ],
      },
      {
        id: 'principles', title: 'En bref',
        blocks: [
          [
            'Pas besoin de compte pour parcourir le site ou commander. Nous ne vous demandons pas de vous inscrire et nous ne constituons aucun profil sur vous.',
            'Nous n’utilisons ce que vous nous envoyez que pour vous répondre ou livrer votre commande. Rien d’autre.',
            'Nous ne vendons pas vos coordonnées, nous ne les louons pas et nous ne les utilisons pas pour des listes publicitaires.',
            'Nous consultons des statistiques de visite, anonymes et qui décrivent le site dans son ensemble, pour savoir quelles pages sont utiles.',
          ],
        ],
      },
      {
        id: 'order', title: 'Lorsque vous passez commande',
        blocks: [
          'Pour livrer votre commande, nous devons savoir pour qui elle est et où elle va. Quand vous envoyez le formulaire de commande, nous recevons :',
          ['votre nom et votre numéro de téléphone', 'votre adresse e-mail, uniquement si vous avez choisi de la donner', 'votre ville et votre adresse de livraison', 'la note que vous avez écrite, le cas échéant', 'les pièces commandées, le total, la date et la langue que vous utilisiez'],
          'Nous les utilisons pour vous appeler ou vous écrire afin de confirmer la commande, pour la préparer et la livrer, et pour vous aider en cas de problème. Si vous avez donné une adresse e-mail, nous vous envoyons aussi une confirmation. C’est la seule raison pour laquelle nous conservons les détails d’une commande. Personne n’est ajouté à une liste de diffusion parce qu’il a commandé.',
        ],
      },
      {
        id: 'contact', title: 'Lorsque vous nous écrivez',
        blocks: [
          'Si vous utilisez le formulaire de contact, nous recevons votre nom, votre adresse e-mail, votre message et, si vous avez choisi de les ajouter, votre numéro de téléphone et un objet. Nous les utilisons uniquement pour vous répondre. Une copie du message est conservée dans notre boîte de réception privée pour assurer le suivi, et nous la supprimons lorsqu’elle n’est plus utile. Vous pouvez nous demander de la supprimer plus tôt à tout moment.',
        ],
      },
      {
        id: 'visits', title: 'Statistiques de visite',
        blocks: [
          'Lorsqu’il est activé, nous utilisons Google Analytics pour compter les visites. Il nous indique, de façon globale, combien de personnes visitent le site, quelles pages elles ouvrent, quel type d’appareil elles utilisent et à peu près de quel pays elles viennent. Nous avons demandé à Google d’anonymiser les adresses IP et nous avons désactivé les fonctions publicitaires : ces informations ne servent donc pas à vous suivre sur le web.',
          'Nous ne relions jamais ces statistiques à votre nom, à votre numéro de téléphone ou à vos commandes. Si vous préférez ne pas être comptabilisé, vous pouvez bloquer les outils d’analyse dans votre navigateur ou avec un bloqueur de contenu, et le site fonctionnera exactement de la même façon.',
        ],
      },
      {
        id: 'storage', title: 'Cookies et données conservées sur votre appareil',
        blocks: [
          'Nous gardons quelques petites informations dans votre navigateur pour que le site reste tel que vous l’avez laissé :',
          ['votre panier, pour le retrouver à votre retour (stocké sur votre appareil, pas sur nos serveurs, jusqu’à ce que vous commandiez ou le vidiez)', 'votre choix de langue (un petit cookie nommé mj-locale, conservé un an)', 'votre mode d’affichage, clair ou sombre (stocké sur votre appareil)'],
          'Lorsque l’analyse est activée, Google Analytics dépose aussi ses propres cookies pour distinguer une visite d’une autre. Nous n’utilisons aucun cookie publicitaire ni de pistage. Vous pouvez supprimer chacun de ces éléments à tout moment dans les réglages de votre navigateur.',
        ],
      },
      {
        id: 'location', title: 'Le choix de la langue',
        blocks: ['La première fois que vous ouvrez le site, nous utilisons le pays approximatif de votre connexion pour l’afficher en français (au Maroc et dans les pays où le français est largement parlé) ou en anglais. Nous ne conservons pas votre position. Si vous choisissez vous-même une langue avec le menu de l’en-tête, nous mémorisons ce choix et c’est toujours lui qui prime.'],
      },
      {
        id: 'sharing', title: 'Qui d’autre voit vos informations',
        blocks: [
          'Seulement les personnes qui en ont besoin pour faire leur travail :',
          ['le transporteur, qui reçoit votre nom, votre numéro de téléphone et votre adresse pour que le colis vous parvienne', 'les services qui font fonctionner le site pour nous : l’hébergement et la base de données, et le service d’e-mail qui envoie nos messages', 'Google, pour les statistiques de visite décrites ci-dessus'],
          'Ces services agissent selon nos instructions et n’ont pas le droit d’utiliser vos informations pour leur propre compte. Nous pouvons aussi communiquer des informations si la loi l’exige.',
        ],
      },
      {
        id: 'keeping', title: 'Combien de temps nous les gardons',
        blocks: ['Les détails d’une commande sont conservés le temps nécessaire pour livrer et suivre votre commande, et aussi longtemps que la loi nous impose de conserver les justificatifs de vente. Les messages sont conservés uniquement le temps de les traiter. Les statistiques de visite sont anonymes et conservées sous forme agrégée.'],
      },
      {
        id: 'rights', title: 'Vos droits',
        blocks: [
          'Conformément à la loi marocaine relative à la protection des données personnelles (loi 09-08), vous pouvez nous demander de vous montrer ce que nous détenons sur vous, de le corriger ou de le supprimer, et vous pouvez vous opposer à son utilisation. Envoyez votre demande à {email} en indiquant le nom et le numéro de téléphone utilisés afin que nous puissions retrouver vos informations. Nous vous répondrons dès que possible.',
          'Si vous estimez que vos informations n’ont pas été traitées correctement, vous pouvez aussi vous adresser à la Commission nationale de contrôle de la protection des données à caractère personnel (CNDP).',
        ],
      },
      {
        id: 'security', title: 'Leur sécurité',
        blocks: ['Le site est servi par une connexion sécurisée, l’espace d’administration est protégé par une connexion et une vérification en deux étapes facultative, et seules les personnes qui traitent les commandes peuvent les voir. Aucun système n’est parfaitement sûr, mais nous y veillons raisonnablement et nous ne demandons jamais de numéro de carte : vous payez en espèces à la livraison.'],
      },
      {
        id: 'changes', title: 'Modifications de cette page',
        blocks: ['Si nous changeons ce que nous faisons de vos informations, nous mettrons cette page et la date en haut à jour. N’hésitez pas à y jeter un œil de temps en temps.'],
      },
    ],
  },
  terms: {
    title: 'Conditions d’utilisation',
    subtitle: 'Les règles pour utiliser le site et commander chez nous.',
    updatedLabel: 'Dernière mise à jour', updated: '3 octobre 2026',
    contactTitle: 'Un point à éclaircir ?', contactBody: 'Écrivez-nous à {email} ou envoyez-nous un message sur WhatsApp, nous vous expliquerons.',
    sections: [
      {
        id: 'about', title: 'À propos de ces conditions',
        blocks: [
          'Ces conditions s’appliquent lorsque vous visitez maisonjawaher.com ou commandez chez Maison Jawaher. En utilisant le site ou en passant commande, vous les acceptez. Si vous n’êtes pas d’accord, merci de ne pas utiliser le site.',
          'Maison Jawaher est une maison de bijoux basée à {place}. Vous pouvez nous joindre à {email} ou au {phone}.',
        ],
      },
      {
        id: 'products', title: 'Nos pièces',
        blocks: ['Nous décrivons et photographions chaque pièce avec le plus grand soin. Nos bijoux sont finis à la main : de petites différences d’une pièce à l’autre sont donc normales, et les couleurs peuvent paraître légèrement différentes selon les écrans. Les tailles, poids et matières sont donnés à titre indicatif.'],
      },
      {
        id: 'prices', title: 'Prix et disponibilité',
        blocks: [
          'Les prix sont indiqués en dirhams marocains (MAD) lorsqu’ils sont affichés. Certaines pièces sont proposées « sur demande » : dans ce cas, nous vous donnons le prix lorsque nous vous contactons, avant que quoi que ce soit ne soit définitif.',
          'Nous pouvons modifier les prix et cesser de vendre une pièce à tout moment. Une modification n’affecte jamais une commande que nous avons déjà confirmée avec vous. Comme les pièces sont produites en petites séries, une pièce peut être épuisée entre le moment où vous l’ajoutez à votre panier et celui où nous confirmons votre commande. Si cela arrive, nous vous le dirons.',
        ],
      },
      {
        id: 'orders', title: 'Comment fonctionne la commande',
        blocks: [
          'Il n’y a pas de paiement en ligne. Lorsque vous envoyez votre commande via le site, vous nous demandez de vous vendre ces pièces. La vente est conclue lorsque nous vous avons contacté par téléphone ou WhatsApp et confirmé les détails, le prix et la livraison. Jusque-là, vous pouvez changer d’avis et nous pouvons refuser une commande, par exemple si une pièce n’est plus disponible ou si nous ne parvenons pas à vous joindre.',
          'Merci de nous donner un nom, un numéro de téléphone et une adresse exacts. Nous ne pouvons pas livrer une commande que nous ne pouvons pas confirmer.',
        ],
      },
      {
        id: 'payment', title: 'Paiement',
        blocks: ['Vous payez en espèces, en dirhams, à la remise du colis. Le site ne demande jamais de numéro de carte ni de coordonnées bancaires. Si des frais de livraison s’appliquent, nous vous en indiquons le montant lors de la confirmation de votre commande.'],
      },
      {
        id: 'delivery', title: 'Livraison',
        blocks: ['Nous livrons partout au Maroc. Nous vous indiquons le délai de livraison prévu lorsque nous confirmons votre commande. Les délais sont une estimation et peuvent être modifiés par le transporteur ou par des événements indépendants de notre volonté. Merci de vérifier votre colis à sa réception et de nous signaler immédiatement tout problème.'],
      },
      {
        id: 'problems', title: 'Problèmes, retours et remboursements',
        blocks: [
          'Si une pièce arrive abîmée, n’est pas celle que vous avez commandée ou présente un défaut, contactez-nous dans les 7 jours suivant sa réception, avec une photo si possible. Nous la réparerons, la remplacerons ou vous rembourserons, selon ce qui vous convient le mieux et qui est possible.',
          'Cela ne vous prive d’aucun des droits que la loi vous reconnaît en tant que consommateur, notamment au titre de la loi marocaine de protection du consommateur (loi 31-08).',
        ],
      },
      {
        id: 'use', title: 'Utilisation du site',
        blocks: [
          'Merci d’utiliser le site honnêtement. En particulier, merci de ne pas :',
          ['passer de fausses commandes ou des commandes pour plaisanter', 'tenter de pirater, de surcharger ou de perturber le site ou ses formulaires', 'copier le site de façon automatisée et massive (scraping) ni réutiliser nos photos et nos textes à des fins commerciales sans nous demander'],
          'Nous pouvons bloquer l’accès de toute personne qui abuse du site.',
        ],
      },
      {
        id: 'ip', title: 'Nos contenus',
        blocks: ['Le nom Maison Jawaher, le logo, les créations, les photographies et les textes de ce site nous appartiennent ou appartiennent à ceux qui les ont réalisés pour nous. Vous pouvez volontiers partager un lien ou une image d’une pièce sur les réseaux sociaux en nous citant. Toute autre utilisation nécessite notre autorisation écrite.'],
      },
      {
        id: 'liability', title: 'Notre responsabilité',
        blocks: ['Nous faisons de notre mieux pour que le site fonctionne et que ses informations soient exactes, mais nous ne pouvons pas promettre qu’il sera toujours disponible ni exempt d’erreurs. Dans la mesure permise par la loi, nous ne sommes pas responsables des pertes résultant de l’utilisation du site, sauf celles que la loi ne nous permet pas d’exclure. Rien ici ne limite notre responsabilité en cas de pièce défectueuse, comme décrit plus haut.'],
      },
      {
        id: 'privacy', title: 'Vos informations',
        blocks: ['La façon dont nous traitons les informations que vous nous donnez est expliquée dans notre politique de confidentialité, qui fait partie de ces conditions.'],
      },
      {
        id: 'law', title: 'Droit applicable',
        blocks: ['Ces conditions sont régies par le droit marocain. Si nous ne parvenons pas à régler un différend à l’amiable, les tribunaux marocains compétents en connaîtront.'],
      },
      {
        id: 'changes', title: 'Modifications de ces conditions',
        blocks: ['Nous pouvons mettre à jour ces conditions de temps à autre. La date en haut indique la dernière version. Une commande est toujours régie par les conditions en vigueur le jour où vous l’avez passée.'],
      },
    ],
  },
};

export const legal = { en, fr };
