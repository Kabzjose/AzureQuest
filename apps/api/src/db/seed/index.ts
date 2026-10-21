/**
 * Idempotent seed script for AzureQuest.
 *
 * Uses ON CONFLICT DO UPDATE so it is safe to run repeatedly.
 * All content is original and aligned with the public AZ-900 skills outline
 * on Microsoft Learn (checked: October 2024).
 *
 * IMPORTANT: This is an unofficial study tool. Not affiliated with or endorsed
 * by Microsoft. Content is based only on the publicly available AZ-900 skills
 * outline on Microsoft Learn.
 */

import 'dotenv/config';
import { db, pool } from '../client';
import { concepts, scenarios, decisions } from '../schema';
import { v4 as uuidv4 } from 'uuid';
import { sql } from 'drizzle-orm';
import type { OptionFull } from '@azurequest/shared';
import { logger } from '../../utils/logger';

// ─── Stable IDs for cross-references ──────────────────────────────────────
// Using fixed UUIDs so re-seeding doesn't break foreign key references.

const CONCEPT_IDS = {
  availabilityZones: 'c0000001-0000-0000-0000-000000000001',
  scalability: 'c0000001-0000-0000-0000-000000000002',
  elasticity: 'c0000001-0000-0000-0000-000000000003',
  payAsYouGo: 'c0000001-0000-0000-0000-000000000004',
  sharedResponsibility: 'c0000001-0000-0000-0000-000000000005',
  rbac: 'c0000001-0000-0000-0000-000000000006',
  azurePolicy: 'c0000001-0000-0000-0000-000000000007',
  resourceLocks: 'c0000001-0000-0000-0000-000000000008',
  iaas: 'c0000001-0000-0000-0000-000000000009',
  paas: 'c0000001-0000-0000-0000-000000000010',
  saas: 'c0000001-0000-0000-0000-000000000011',
  blobStorage: 'c0000001-0000-0000-0000-000000000012',
  azureSqlDatabase: 'c0000001-0000-0000-0000-000000000013',
  regions: 'c0000001-0000-0000-0000-000000000014',
  regionPairs: 'c0000001-0000-0000-0000-000000000015',
  costManagement: 'c0000001-0000-0000-0000-000000000016',
  azureMonitor: 'c0000001-0000-0000-0000-000000000017',
  appService: 'c0000001-0000-0000-0000-000000000018',
  entraId: 'c0000001-0000-0000-0000-000000000019',
  mfa: 'c0000001-0000-0000-0000-000000000020',
  managementGroups: 'c0000001-0000-0000-0000-000000000021',
  sla: 'c0000001-0000-0000-0000-000000000022',
  storageRedundancy: 'c0000001-0000-0000-0000-000000000023',
};

// ─── Concepts seed data ────────────────────────────────────────────────────

const conceptsData = [
  {
    id: CONCEPT_IDS.availabilityZones,
    domain: 'architecture-services',
    name: 'Availability Zones',
    summary: 'Physically separate datacenters within an Azure region, each with independent power, cooling, and networking. Deploying across zones protects against datacenter-level failures.',
    learnUrl: 'https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview',
    analogyBase: 'Think of Availability Zones like bank branches in different towns. If the branch in Westlands loses power, your account is still accessible at the branch in Ngong Road or Thika Road.',
    analogyBaseSw: 'Fikiria Availability Zones kama matawi ya benki katika miji tofauti. Ikiwa tawi la Westlands litapoteza umeme, akaunti yako bado inaweza kufikiwa kwenye tawi la Ngong Road au Thika Road.',
  },
  {
    id: CONCEPT_IDS.scalability,
    domain: 'cloud-concepts',
    name: 'Scalability',
    summary: 'The ability to increase resources (scale up/out) to handle greater demand, or decrease (scale down/in) when demand drops. Azure supports both vertical scaling (larger VM) and horizontal scaling (more instances).',
    learnUrl: 'https://learn.microsoft.com/en-us/azure/well-architected/scalability/overview',
    analogyBase: 'Scalability is like a matatu route operator adding more vehicles during morning rush hour. When demand is high, you add more matatus; when it is low, you park some.',
    analogyBaseSw: 'Scalability ni kama opereta wa njia ya matatu kuongeza magari wakati wa msongamano asubuhi. Mahitaji yakiwa mengi, unaongeza matatu zaidi; mahitaji yakipungua, unaweka baadhi garaje.',
  },
  {
    id: CONCEPT_IDS.elasticity,
    domain: 'cloud-concepts',
    name: 'Elasticity',
    summary: 'Automatically scaling resources up or down in response to real-time demand, then releasing them when no longer needed — so you only pay for what you use.',
    learnUrl: 'https://learn.microsoft.com/en-us/azure/well-architected/scalability/overview',
    analogyBase: 'Elasticity is like airtime bundles that auto-renew when your data runs out and pause when you stop using them — you only pay for the time you are actively connected.',
    analogyBaseSw: 'Elasticity ni kama mfuko wa data ambao hujirudia unapoisha na kusimama unapoacha kutumia — unalipa tu wakati unapotumia.',
  },
  {
    id: CONCEPT_IDS.payAsYouGo,
    domain: 'cloud-concepts',
    name: 'Pay-as-you-go / Consumption model',
    summary: 'You pay only for the cloud resources you use, for as long as you use them — no upfront hardware cost. This shifts spending from capital expenditure (CapEx) to operational expenditure (OpEx).',
    learnUrl: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/understand-work-scope',
    analogyBase: 'Like buying prepaid airtime — you buy exactly what you need now, rather than paying a large lump sum for a phone line you may not fully use.',
    analogyBaseSw: 'Kama kununua airtime ya prepaid — unalipa tu unachohitaji sasa, badala ya kulipa kiasi kikubwa kwa laini ambayo huenda usitumie kikamilifu.',
  },
  {
    id: CONCEPT_IDS.sharedResponsibility,
    domain: 'cloud-concepts',
    name: 'Shared Responsibility Model',
    summary: 'Security responsibilities are split between Microsoft and the customer. Microsoft always manages physical security, hardware, and network fabric. The customer always manages their data and access. The division of everything in between depends on the service type (IaaS/PaaS/SaaS).',
    learnUrl: 'https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility',
    analogyBase: 'Like renting a house: the landlord (Microsoft) is responsible for the building structure, roof, and plumbing. You (the tenant/customer) are responsible for locking your door and looking after your belongings inside.',
    analogyBaseSw: 'Kama kupanga nyumba: mwenye nyumba (Microsoft) anajali muundo wa jengo, paa, na mabomba. Wewe (mpangaji/mteja) unajibika kwa kufunga mlango wako na kutunza vitu vyako ndani.',
  },
  {
    id: CONCEPT_IDS.rbac,
    domain: 'management-governance',
    name: 'Azure Role-Based Access Control (RBAC)',
    summary: 'Controls who can do what with Azure resources. You assign roles (Owner, Contributor, Reader, or custom) to users, groups, or service principals at a specific scope (subscription, resource group, or resource).',
    learnUrl: 'https://learn.microsoft.com/en-us/azure/role-based-access-control/overview',
    analogyBase: 'RBAC is like deciding who gets which keys to the office building. The security guard (Owner) has a master key; a visitor (Reader) gets a temporary badge that only opens the reception area.',
    analogyBaseSw: 'RBAC ni kama kuamua nani anapata funguo gani za jengo la ofisi. Mlinzi (Owner) ana ufunguo mkuu; mgeni (Reader) anapata beji ya muda ambayo inafungua mapokezi tu.',
  },
  {
    id: CONCEPT_IDS.azurePolicy,
    domain: 'management-governance',
    name: 'Azure Policy',
    summary: 'Enforces organisational standards and assesses compliance at scale. Policies define rules that resources must follow — e.g. "all resources must have a Cost Center tag" or "only allowed regions may be used".',
    learnUrl: 'https://learn.microsoft.com/en-us/azure/governance/policy/overview',
    analogyBase: 'Azure Policy is like the building code or planning rules for a neighbourhood. The rules say "all new buildings must have a fire exit" — it does not matter who owns the building; the rule applies to everyone.',
    analogyBaseSw: 'Azure Policy ni kama kanuni za ujenzi kwa mtaa. Kanuni zinasema "majengo yote mapya lazima yawe na mlango wa dharura" — haijali nani anamiliki jengo; kanuni zinaweza kwa kila mtu.',
  },
  {
    id: CONCEPT_IDS.resourceLocks,
    domain: 'management-governance',
    name: 'Resource Locks',
    summary: 'Prevent accidental deletion or modification of Azure resources. Two lock types: ReadOnly (no changes) and Delete (prevents deletion but allows modifications).',
    learnUrl: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/lock-resources',
    analogyBase: 'A resource lock is like putting a padlock on the SACCO vault. Even the chairperson cannot open it without going through the unlocking procedure first — it protects against accidental or rushed decisions.',
    analogyBaseSw: 'Kufunga rasilimali ni kama kuweka kufuli kwenye sanduku la SACCO. Hata mwenyekiti hawezi kuifungua bila kwanza kufuata utaratibu wa kufungua — inalinda dhidi ya maamuzi ya haraka au ya bahati mbaya.',
  },
  {
    id: CONCEPT_IDS.iaas,
    domain: 'cloud-concepts',
    name: 'Infrastructure as a Service (IaaS)',
    summary: 'The cloud provider gives you raw compute, storage, and networking. You manage the OS, runtime, applications, and data. Maximum control, maximum responsibility.',
    learnUrl: 'https://learn.microsoft.com/en-us/azure/architecture/guide/design-principles/compute-options',
    analogyBase: 'IaaS is like buying an empty plot of land. You get the land (infrastructure), but you must build the house (OS), furnish it (runtime), and stock it (application) yourself.',
    analogyBaseSw: 'IaaS ni kama kununua kiwanja tupu. Unapata ardhi (miundombinu), lakini lazima ujenga nyumba (OS), uipake samani (runtime), na kuijaza (programu) mwenyewe.',
  },
  {
    id: CONCEPT_IDS.paas,
    domain: 'cloud-concepts',
    name: 'Platform as a Service (PaaS)',
    summary: 'The cloud provider manages infrastructure and OS, and provides a ready platform (runtime, middleware, databases). You focus on deploying and managing your application and data.',
    learnUrl: 'https://learn.microsoft.com/en-us/azure/architecture/guide/design-principles/compute-options',
    analogyBase: 'PaaS is like renting a market stall that already has the counter, shelving, and electricity. You just bring your goods and start selling — you focus on your business, not on building the stall.',
    analogyBaseSw: 'PaaS ni kama kupanga stendi sokoni ambayo tayari ina kaunta, rafu, na umeme. Unaleta bidhaa zako tu na kuanza kuuza — unajikita kwenye biashara yako, si kwenye kujenga stendi.',
  },
  {
    id: CONCEPT_IDS.saas,
    domain: 'cloud-concepts',
    name: 'Software as a Service (SaaS)',
    summary: 'Fully managed software delivered over the internet. You use the application but manage almost nothing — examples include Microsoft 365 and Dynamics 365.',
    learnUrl: 'https://learn.microsoft.com/en-us/azure/architecture/guide/design-principles/compute-options',
    analogyBase: 'SaaS is like eating at a restaurant. You just sit, order, and eat. You manage nothing — not the kitchen, not the ingredients, not the cooking. You only interact with the finished product.',
    analogyBaseSw: 'SaaS ni kama kula kwenye mkahawa. Unakaa, unaagiza, na kula. Hujali chochote — si jiko, si viungo, si upikaji. Unashughulikia bidhaa iliyokamilika tu.',
  },
  {
    id: CONCEPT_IDS.blobStorage,
    domain: 'architecture-services',
    name: 'Azure Blob Storage',
    summary: 'Object storage optimised for storing massive amounts of unstructured data such as images, videos, documents, and backups. Accessed via HTTPS/REST.',
    learnUrl: 'https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction',
    analogyBase: 'Blob Storage is like a large warehouse. You can store almost anything in it — boxes of different sizes, shapes, and types — and retrieve any item using its location code (URL) from anywhere.',
    analogyBaseSw: 'Blob Storage ni kama ghala kubwa. Unaweza kuhifadhi karibu chochote ndani yake — masanduku ya ukubwa, maumbo, na aina tofauti — na kupata kitu chochote ukitumia nambari yake ya eneo (URL) kutoka mahali popote.',
  },
  {
    id: CONCEPT_IDS.azureSqlDatabase,
    domain: 'architecture-services',
    name: 'Azure SQL Database',
    summary: 'A fully managed relational database (PaaS) built on SQL Server. Microsoft handles patching, backups, and high availability; you manage your data and queries.',
    learnUrl: 'https://learn.microsoft.com/en-us/azure/azure-sql/database/sql-database-paas-overview',
    analogyBase: 'Azure SQL Database is like a digital ledger maintained by a trusted accountant (Microsoft). You record your transactions and query them; the accountant keeps the books safe, backed up, and always available.',
    analogyBaseSw: 'Azure SQL Database ni kama daftari la kidijitali linalosimamiwa na mhasibu anayeaminika (Microsoft). Unaandika shughuli zako na kuzihoji; mhasibu anaweka vitabu salama, vikiwa na nakala, na vinapatikana wakati wote.',
  },
  {
    id: CONCEPT_IDS.regions,
    domain: 'architecture-services',
    name: 'Azure Regions',
    summary: 'A geographic area containing one or more datacenters, networked together with low-latency connections. Choosing a region close to users reduces latency and may meet data residency requirements.',
    learnUrl: 'https://learn.microsoft.com/en-us/azure/reliability/overview#regions-and-availability-zones',
    analogyBase: 'Azure regions are like M-Pesa agents in different counties. Choosing the agent closest to your customers reduces travel time (latency) and keeps transactions within the local regulatory area (data residency).',
    analogyBaseSw: 'Mikoa ya Azure ni kama mawakala wa M-Pesa katika kaunti tofauti. Kuchagua wakala aliye karibu na wateja wako hupunguza muda wa kusafiri (latency) na kuweka shughuli ndani ya eneo la udhibiti wa ndani (makazi ya data).',
  },
  {
    id: CONCEPT_IDS.regionPairs,
    domain: 'architecture-services',
    name: 'Region Pairs',
    summary: 'Most Azure regions are paired with another region in the same geography. If one region in a pair experiences an outage, Azure prioritises recovery of the paired region and staggers updates to reduce simultaneous downtime.',
    learnUrl: 'https://learn.microsoft.com/en-us/azure/reliability/cross-region-replication-azure',
    analogyBase: 'Region pairs are like two sister Mpesa branches in different cities that always back each other up. If one city has a network outage, the other one handles its transactions and holds its records safely.',
    // TODO: human review — Swahili analogy pending
    analogyBaseSw: undefined,
  },
  {
    id: CONCEPT_IDS.costManagement,
    domain: 'management-governance',
    name: 'Azure Cost Management',
    summary: 'A suite of tools for monitoring, allocating, and optimising cloud spend. Includes budgets, alerts, cost analysis dashboards, and recommendations to right-size resources.',
    learnUrl: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/overview-cost-management',
    analogyBase: 'Azure Cost Management is like an M-Pesa statement combined with a budget planner. You can see exactly where every shilling went, set spending limits, and get an alert before you overspend.',
    analogyBaseSw: 'Azure Cost Management ni kama taarifa ya M-Pesa pamoja na mpangaji wa bajeti. Unaweza kuona hasa kila shilingi ilikwenda wapi, kuweka mipaka ya matumizi, na kupata onyo kabla ya kutumia zaidi.',
  },
  {
    id: CONCEPT_IDS.azureMonitor,
    domain: 'management-governance',
    name: 'Azure Monitor',
    summary: 'A comprehensive monitoring service that collects, analyses, and acts on telemetry from Azure and on-premises resources. Includes metrics, logs (Log Analytics), alerts, and dashboards.',
    learnUrl: 'https://learn.microsoft.com/en-us/azure/azure-monitor/overview',
    analogyBase: 'Azure Monitor is like the control panel on a matatu dashboard — it shows speed (performance metrics), fuel (resource usage), engine temperature (alerts), and logs every trip (audit logs) so the operator knows exactly what happened.',
    // TODO: human review — Swahili analogy pending
    analogyBaseSw: undefined,
  },
  {
    id: CONCEPT_IDS.appService,
    domain: 'architecture-services',
    name: 'Azure App Service',
    summary: 'A fully managed PaaS platform for hosting web applications, REST APIs, and mobile back ends. Supports multiple languages (Node.js, Python, .NET, Java). Microsoft manages the underlying infrastructure.',
    learnUrl: 'https://learn.microsoft.com/en-us/azure/app-service/overview',
    analogyBase: 'App Service is like a fully kitted-out ready-to-use market stall in Gikomba. The stall structure, power, and plumbing are all done — you just bring your products (code) and open for business.',
    analogyBaseSw: 'App Service ni kama stendi iliyoandaliwa kikamilifu tayari kutumika. Muundo wa stendi, umeme, na mabomba yote yamefanywa — unaleta bidhaa zako (code) tu na kufungua biashara.',
  },
  {
    id: CONCEPT_IDS.entraId,
    domain: 'architecture-services',
    name: 'Microsoft Entra ID (formerly Azure AD)',
    summary: 'A cloud-based identity and access management service. Handles authentication (verifying who you are) and provides the foundation for authorisation. Supports SSO, MFA, and conditional access.',
    learnUrl: 'https://learn.microsoft.com/en-us/entra/identity/fundamentals/whatis',
    analogyBase: 'Entra ID is like a unified ID card system for all government services. One ID card (single identity) grants you access to NHIF, KRA, and Huduma Centre — you prove who you are once, and the system decides what you are allowed to access.',
    analogyBaseSw: 'Entra ID ni kama mfumo wa kitambulisho kimoja kwa huduma zote za serikali. Kitambulisho kimoja (utambulisho mmoja) kinakupa ufikiaji wa NHIF, KRA, na Huduma Centre — unathibitisha ni nani mara moja, na mfumo unaamua unaweza kufikia nini.',
  },
  {
    id: CONCEPT_IDS.mfa,
    domain: 'architecture-services',
    name: 'Multi-Factor Authentication (MFA)',
    summary: 'Requires users to provide two or more verification factors to gain access. Combines something you know (password), something you have (phone), and/or something you are (biometric). Significantly reduces account compromise risk.',
    learnUrl: 'https://learn.microsoft.com/en-us/entra/identity/authentication/concept-mfa-howitworks',
    analogyBase: 'MFA is like an ATM requiring both your card (something you have) and your PIN (something you know). Having only one of them is not enough to withdraw money.',
    analogyBaseSw: 'MFA ni kama ATM inayohitaji kadi yako (kitu unacho) na PIN yako (kitu unachojua). Kuwa na kimoja tu hakutoshi kutoa pesa.',
  },
  {
    id: CONCEPT_IDS.managementGroups,
    domain: 'management-governance',
    name: 'Management Groups',
    summary: 'Containers that help organise Azure subscriptions into a hierarchy. Policies and RBAC applied to a management group cascade down to all subscriptions and resources within it.',
    learnUrl: 'https://learn.microsoft.com/en-us/azure/governance/management-groups/overview',
    analogyBase: 'Management groups are like county governments in Kenya. A policy set at the national level (root management group) applies to all counties (subscriptions). The county can add its own local rules, but cannot remove the national ones.',
    // TODO: human review — Swahili analogy pending
    analogyBaseSw: undefined,
  },
  {
    id: CONCEPT_IDS.sla,
    domain: 'architecture-services',
    name: 'Service Level Agreements (SLAs)',
    summary: 'Microsoft\'s formal commitment for service uptime and connectivity. Expressed as a percentage (e.g. 99.9%). Composite SLAs multiply individual service SLAs; using Availability Zones often increases the SLA.',
    learnUrl: 'https://azure.microsoft.com/en-us/support/legal/sla/',
    analogyBase: 'An SLA is like a Safaricom network reliability guarantee — they commit to keeping your service up 99.9% of the time, and there is a credit/refund process if they fall short.',
    // TODO: human review — Swahili analogy pending
    analogyBaseSw: undefined,
  },
  {
    id: CONCEPT_IDS.storageRedundancy,
    domain: 'architecture-services',
    name: 'Storage Redundancy (LRS / ZRS / GRS / GZRS)',
    summary: 'Azure Storage automatically stores multiple copies of your data. LRS = 3 copies in one datacenter. ZRS = 3 copies across zones. GRS = LRS + async copy to a paired region. GZRS = ZRS + GRS.',
    learnUrl: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy',
    analogyBase: 'Storage redundancy is like keeping copies of important documents: LRS is keeping three copies in your house; GRS is keeping one copy at home and one at your parents\' house in another town — if your house burns down, the documents survive.',
    // TODO: human review — Swahili analogy pending
    analogyBaseSw: undefined,
  },
];

// ─── Scenarios ─────────────────────────────────────────────────────────────

const SCENARIO_IDS = {
  universityRegistration: '00000000-0000-4000-8000-000000000001',
  startupLaunch: '00000000-0000-4000-8000-000000000002',
  saccoportal: '00000000-0000-4000-8000-000000000003',
  accidentalDeletion: '00000000-0000-4000-8000-000000000004',
  ecommercespike: '00000000-0000-4000-8000-000000000005',
  ngoGovernance: '00000000-0000-4000-8000-000000000006',
  clinicRecords: '00000000-0000-4000-8000-000000000007',
};

type ScenarioSeed = {
  id: string;
  domains: string[];
  title: string;
  story: string;
  context: string;
  requirements: string[];
  difficulty: number;
  conceptIds: string[];
  status: string;
  aiGenerated: boolean;
  verified: boolean;
  decisionsData: Array<{
    id: string;
    prompt: string;
    type: 'single' | 'multi';
    orderIndex: number;
    options: OptionFull[];
  }>;
};

const scenariosData: ScenarioSeed[] = [
  // ════════════════════════════════════════════════════════════════
  // Scenario 1: University Registration Week
  // ════════════════════════════════════════════════════════════════
  {
    id: SCENARIO_IDS.universityRegistration,
    domains: ['architecture-services', 'management-governance'],
    title: 'University Registration Week',
    context: 'Kenyan university',
    story: `## Registration Week at Umoja University

Umoja University in Nairobi has 15,000 students. Every semester, registration week is a **nightmare**: the on-premises server crashes on the first morning because all students try to register at exactly the same time.

The IT director, Ms. Wanjiku, has been given budget and a mandate: **move the student registration portal to Azure and make sure it never crashes on registration day again**.

The portal is a Node.js web application with a PostgreSQL database. During registration week, traffic spikes **10× above normal** for about 3 days, then returns to baseline. Outside those peaks, the server sits largely idle.

Ms. Wanjiku needs your help to make the right architecture decisions.`,
    requirements: [
      'Handle 10× traffic spikes during registration week (≈3 days)',
      'Return to baseline capacity outside peak periods to control costs',
      'Store student documents (transcripts, ID scans) reliably',
      'Ensure the operations team can tell immediately when something goes wrong',
      'Restrict database access to only the application service identity',
    ],
    difficulty: 1,
    conceptIds: [
      CONCEPT_IDS.appService,
      CONCEPT_IDS.scalability,
      CONCEPT_IDS.elasticity,
      CONCEPT_IDS.blobStorage,
      CONCEPT_IDS.rbac,
      CONCEPT_IDS.azureMonitor,
    ],
    status: 'published',
    aiGenerated: false,
    verified: true,
    decisionsData: [
      {
        id: 'd1000001-0000-0000-0000-000000000001',
        prompt: 'Ms. Wanjiku needs to host the Node.js registration portal on Azure. Which compute option best fits the need to scale automatically during registration week and minimise infrastructure management overhead?',
        type: 'single',
        orderIndex: 0,
        options: [
          {
            id: uuidv4(),
            label: 'Azure App Service with auto-scaling rules',
            isCorrect: true,
            feedback: 'Azure App Service is a PaaS offering. Microsoft manages the underlying OS, patching, and infrastructure. You deploy your Node.js code and configure auto-scaling rules — scale out to more instances during registration week, scale back in when demand drops. This matches the requirement perfectly with the least management overhead.',
            consequence: 'The portal scales from 2 to 20 instances automatically on registration morning. Students register without interruption, and the university only pays for the extra capacity during those 3 days.',
            mistakeType: undefined,
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Azure Virtual Machines with manual scaling',
            isCorrect: false,
            feedback: 'VMs (IaaS) give you full control but require you to manage the OS, patching, and scaling manually. Manual scaling means someone must monitor traffic and manually add or remove VMs — a slow and error-prone process during a registration rush. The management overhead is also much higher.',
            consequence: 'The operations team is caught off-guard when traffic spikes. By the time they spin up extra VMs manually, registration is already down for 45 minutes and students are queuing at the physical registrar\'s office.',
            mistakeType: 'service-mixup',
            confusedWithConceptId: CONCEPT_IDS.iaas,
          },
          {
            id: uuidv4(),
            label: 'Azure Functions (serverless)',
            isCorrect: false,
            feedback: 'Azure Functions is great for event-driven, short-duration tasks. However, a registration portal is a stateful web application with persistent HTTP sessions and database connections — it is not naturally event-driven. Refactoring would require significant work, and cold starts could cause delays during the first registration rush.',
            consequence: 'After migrating to Functions, the team spends two weeks refactoring session handling. Cold-start latency frustrates students on the first morning. The project timeline slips.',
            mistakeType: 'requirements-misread',
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Azure Kubernetes Service (AKS)',
            isCorrect: false,
            feedback: 'AKS is powerful for containerised microservices at scale, but it adds significant operational complexity (cluster management, pod configuration, ingress controllers). For a single Node.js app that needs to scale, App Service provides the same auto-scaling with far less overhead. AKS would be over-engineering for this use case.',
            consequence: 'The team spends 3 months learning Kubernetes before they can deploy anything. Registration week arrives before the cluster is production-ready.',
            mistakeType: 'overengineering',
            confusedWithConceptId: undefined,
          },
        ],
      },
      {
        id: 'd1000001-0000-0000-0000-000000000002',
        prompt: 'Students upload scanned documents (ID, transcripts, fee receipts) during registration. These files are large, unstructured, and need to be stored reliably and accessed via the web portal. Which Azure service should store these files?',
        type: 'single',
        orderIndex: 1,
        options: [
          {
            id: uuidv4(),
            label: 'Azure Blob Storage',
            isCorrect: true,
            feedback: 'Blob Storage is designed exactly for unstructured data like images, PDFs, and other binary files. It is cheap, scalable to petabytes, and objects are accessed via HTTPS URLs — perfect for a web portal to retrieve and display uploaded documents.',
            consequence: 'Documents upload in seconds. Students can view their submitted transcripts immediately in the portal. Storage costs are a fraction of what on-premises NAS storage would cost.',
            mistakeType: undefined,
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Azure SQL Database',
            isCorrect: false,
            feedback: 'Azure SQL Database is a relational database meant for structured, queryable data (tables with rows and columns). Storing binary files (BLOBs) in a SQL database is an anti-pattern — it inflates database size, slows queries, and makes backup and restore harder. SQL databases are for structured metadata, not file storage.',
            consequence: 'The database grows to 500GB after one registration week as binary files are stored as SQL rows. Queries slow to a crawl, backups take hours, and the cost per GB is 10× higher than Blob Storage.',
            mistakeType: 'service-mixup',
            confusedWithConceptId: CONCEPT_IDS.azureSqlDatabase,
          },
          {
            id: uuidv4(),
            label: 'Azure Files',
            isCorrect: false,
            feedback: 'Azure Files provides managed file shares (like a network drive, via SMB/NFS). It works well for shared file systems accessed by VMs or applications that need a mount point. However, Blob Storage is the preferred and more cost-effective choice for storing large numbers of individual files accessed via HTTP/HTTPS in a web app.',
            consequence: 'Azure Files works, but costs are higher and the HTTP access pattern requires extra setup. Performance under 15,000 concurrent uploads during registration is also a concern.',
            mistakeType: 'service-mixup',
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Disk storage attached to the App Service VM',
            isCorrect: false,
            feedback: 'App Service instances do not have persistent local disk storage — files saved to the local file system on one instance are not visible to other instances (which is critical when you have 20 instances during registration week). Local disk storage on PaaS is ephemeral and not shared.',
            consequence: 'Students who upload to instance A cannot see their files when they are routed to instance B. Support tickets flood in. The team has to manually re-collect all documents.',
            mistakeType: 'vocabulary-gap',
            confusedWithConceptId: undefined,
          },
        ],
      },
      {
        id: 'd1000001-0000-0000-0000-000000000003',
        prompt: 'The operations team needs to be alerted immediately if the portal\'s response time exceeds 5 seconds or if the error rate crosses 1%. Which Azure service enables this?',
        type: 'single',
        orderIndex: 2,
        options: [
          {
            id: uuidv4(),
            label: 'Azure Monitor with alert rules',
            isCorrect: true,
            feedback: 'Azure Monitor collects metrics and logs from all Azure services, including App Service (response time, request count, error rate). You can create alert rules that trigger notifications (email, SMS, Teams) when a metric breaches a threshold. This is exactly the right tool for the requirement.',
            consequence: 'On registration morning, Azure Monitor detects a spike in response time at 7:58 AM and sends Ms. Wanjiku an alert. The auto-scaler kicks in at 8:00 AM. The portal stays up and students never notice.',
            mistakeType: undefined,
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Azure Cost Management',
            isCorrect: false,
            feedback: 'Azure Cost Management tracks and optimises spending, not application performance. It can alert you when your cloud bill exceeds a budget threshold, but it cannot monitor application response times or error rates.',
            consequence: 'The team sets up Cost Management alerts. The portal goes down for 2 hours during registration and no operational alert fires. They only find out when students start calling. Cost Management was watching the wrong thing.',
            mistakeType: 'service-mixup',
            confusedWithConceptId: CONCEPT_IDS.costManagement,
          },
          {
            id: uuidv4(),
            label: 'Azure Security Centre (Defender for Cloud)',
            isCorrect: false,
            feedback: 'Microsoft Defender for Cloud focuses on security posture and threat detection (vulnerabilities, misconfigurations, security alerts), not application performance metrics like response time or error rates.',
            consequence: 'Security Centre reports that the app has no WAF — a valid security finding — but no alert fires for the performance degradation. The team misses the opportunity to catch the bottleneck early.',
            mistakeType: 'service-mixup',
            confusedWithConceptId: undefined,
          },
        ],
      },
      {
        id: 'd1000001-0000-0000-0000-000000000004',
        prompt: 'The IT team wants to ensure that only the registration portal\'s application identity can read and write to the Azure SQL Database — no developer should be able to directly query production data. Which mechanism achieves this principle of least privilege?',
        type: 'single',
        orderIndex: 3,
        options: [
          {
            id: uuidv4(),
            label: 'Assign the App Service a Managed Identity and grant it only db_datareader/db_datawriter roles in Azure SQL',
            isCorrect: true,
            feedback: 'A Managed Identity is an Azure-managed service principal. The App Service authenticates to Azure SQL using this identity — no connection string with username/password is stored in code or config. RBAC on the database ensures the identity has only the minimum permissions needed. This is the least-privilege best practice.',
            consequence: 'No developer can accidentally (or intentionally) use the app\'s credentials to run ad-hoc queries against production. The audit log shows only the managed identity accessing the database. Developers use separate, read-only accounts for their own access.',
            mistakeType: undefined,
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Store the database admin password in the app\'s environment variables',
            isCorrect: false,
            feedback: 'Storing a database admin password in environment variables gives the application (and anyone who can read those variables) full admin access to the database — far more than it needs. This violates least privilege and creates a significant security risk if the app is compromised.',
            consequence: 'A junior developer accidently logs the environment variables to the console. The database admin password is now in the application logs. An attacker who gains log access can wipe the entire database.',
            mistakeType: 'vocabulary-gap',
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Use Azure Policy to restrict database access',
            isCorrect: false,
            feedback: 'Azure Policy enforces resource configuration rules (e.g. "require TLS" or "allowed regions") — it does not manage who can log in to a specific database. Database-level access control is done with RBAC and database roles, not Azure Policy.',
            consequence: 'The team adds a Policy requiring TLS on all SQL databases — a good security practice — but it does not stop developers from logging in with admin credentials. The least-privilege goal is not achieved.',
            mistakeType: 'service-mixup',
            confusedWithConceptId: CONCEPT_IDS.azurePolicy,
          },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // Scenario 2: Startup Launch on a Budget
  // ════════════════════════════════════════════════════════════════
  {
    id: SCENARIO_IDS.startupLaunch,
    domains: ['cloud-concepts', 'architecture-services'],
    title: 'Startup Launch on a Budget',
    context: 'Nairobi tech startup',
    story: `## Bootstrapping SokoConnect

Kamau and his co-founder are building **SokoConnect**, a marketplace connecting Nairobi farmers directly with urban buyers. They have a React frontend, a Node.js API, and a PostgreSQL database. They need to launch in 4 weeks.

Their budget is tight: they cannot afford a DevOps engineer, and they want to spend as little as possible on infrastructure while they validate their idea with early users.

They have been reading about Azure and are trying to decide between running everything themselves on virtual machines or using higher-level managed services. Help them make the right call.`,
    requirements: [
      'Launch within 4 weeks with a 2-person team',
      'Minimise operational overhead — no dedicated DevOps engineer',
      'Keep costs predictable and as low as possible during validation phase',
      'Ensure the database is backed up automatically',
    ],
    difficulty: 1,
    conceptIds: [
      CONCEPT_IDS.iaas,
      CONCEPT_IDS.paas,
      CONCEPT_IDS.appService,
      CONCEPT_IDS.azureSqlDatabase,
      CONCEPT_IDS.payAsYouGo,
    ],
    status: 'published',
    aiGenerated: false,
    verified: true,
    decisionsData: [
      {
        id: 'd2000001-0000-0000-0000-000000000001',
        prompt: 'For the Node.js API, should Kamau choose Azure Virtual Machines (IaaS) or Azure App Service (PaaS)?',
        type: 'single',
        orderIndex: 0,
        options: [
          {
            id: uuidv4(),
            label: 'Azure App Service (PaaS)',
            isCorrect: true,
            feedback: 'App Service abstracts away the OS, patching, and infrastructure. Kamau deploys his code and App Service handles the rest. With a 2-person team and a 4-week deadline, the time saved by not managing a VM is enormous. App Service also has a free tier and scales when needed.',
            consequence: 'Kamau deploys the Node.js API in a single afternoon using the Azure CLI. He spends the rest of the week on product features, not server configuration. The app launches on time.',
            mistakeType: undefined,
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Azure Virtual Machines (IaaS)',
            isCorrect: false,
            feedback: 'VMs give maximum control, but require the team to: install and configure Node.js, manage OS updates, configure firewalls, set up monitoring, handle SSL certificates, and ensure the VM stays up. With a 2-person team and a tight timeline, this overhead will likely cause them to miss their launch date.',
            consequence: 'The team spends 2 weeks configuring the VM, installing dependencies, debugging SSH access, and setting up nginx. They run out of time and delay the launch by 3 weeks.',
            mistakeType: 'service-mixup',
            confusedWithConceptId: CONCEPT_IDS.iaas,
          },
        ],
      },
      {
        id: 'd2000001-0000-0000-0000-000000000002',
        prompt: 'For the database, which option best fits the startup\'s requirements (automatic backups, no DBA needed, predictable cost)?',
        type: 'single',
        orderIndex: 1,
        options: [
          {
            id: uuidv4(),
            label: 'Azure Database for PostgreSQL – Flexible Server',
            isCorrect: true,
            feedback: 'Azure Database for PostgreSQL (Flexible Server) is a fully managed PaaS database. Microsoft handles backups (automatic, point-in-time restore), high availability, patching, and performance tuning. The team just manages their schema and data — exactly what a startup without a DBA needs.',
            consequence: 'Automatic backups run every night. When Kamau accidentally drops a table in week 2, he restores to a point 30 minutes before the accident in 5 minutes. Zero data lost.',
            mistakeType: undefined,
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'PostgreSQL on an Azure Virtual Machine',
            isCorrect: false,
            feedback: 'Installing PostgreSQL on a VM means the team is responsible for: manual backups (writing and scheduling backup scripts), OS patches, PostgreSQL version upgrades, and disk management. Missing any of these can lead to data loss. With no dedicated DBA, this is a high-risk choice.',
            consequence: 'The team forgets to set up backup scripts in the rush to launch. Three weeks in, a disk failure corrupts the database. They have no backup. All user registrations are lost.',
            mistakeType: 'service-mixup',
            confusedWithConceptId: CONCEPT_IDS.iaas,
          },
          {
            id: uuidv4(),
            label: 'Azure Cosmos DB',
            isCorrect: false,
            feedback: 'Cosmos DB is a globally distributed, multi-model NoSQL database. It is powerful but more complex and expensive than a managed PostgreSQL for a startup\'s relational data needs. Their existing codebase uses PostgreSQL with SQL queries — migrating to a NoSQL model would require significant refactoring and is over-engineering for their current stage.',
            consequence: 'The team spends 3 weeks refactoring all SQL queries to Cosmos DB document model. They also discover Cosmos DB pricing is significantly higher than Flexible Server at their current scale. Budget overrun and launch delayed.',
            mistakeType: 'overengineering',
            confusedWithConceptId: undefined,
          },
        ],
      },
      {
        id: 'd2000001-0000-0000-0000-000000000003',
        prompt: 'Kamau is worried about unexpected cloud bills. Which Azure feature should he set up first to stay within budget?',
        type: 'single',
        orderIndex: 2,
        options: [
          {
            id: uuidv4(),
            label: 'Azure Cost Management budget alert',
            isCorrect: true,
            feedback: 'Azure Cost Management lets you set a monthly budget and configure alerts that fire via email when you reach a threshold (e.g. 80% of budget). It is free to use and gives Kamau early warning before the bill becomes a surprise. This is the correct first step for any new Azure user.',
            consequence: 'Kamau sets a $50/month budget with a 90% alert. In month 2, an alert fires when a misconfigured job generates unexpected storage traffic. He catches and fixes it before the bill exceeds $50.',
            mistakeType: undefined,
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Buy a 3-year Reserved Instance upfront',
            isCorrect: false,
            feedback: 'Reserved Instances offer up to 72% discount, but require a 1- or 3-year commitment paid upfront or monthly. For a startup in validation phase with unpredictable usage, locking into a 3-year commitment is risky — if the product pivots or fails, money is wasted. Pay-as-you-go is more appropriate at this stage.',
            consequence: 'Kamau pays for a 3-year reserved VM instance. Six months later, SokoConnect pivots to a mobile app architecture and the reserved VM is no longer needed. The prepaid cost cannot be fully recovered.',
            mistakeType: 'requirements-misread',
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Enable Azure Advisor recommendations only',
            isCorrect: false,
            feedback: 'Azure Advisor provides helpful optimisation recommendations (cost, security, reliability) but it is reactive — it tells you after inefficiencies have occurred. It does not proactively alert you when your spending approaches a limit. Cost Management budget alerts are the right proactive tool.',
            consequence: 'Azure Advisor shows a recommendation to right-size the database server, which saves $10/month. But with no budget alert, Kamau only discovers his $180 bill at the end of the month — far exceeding the $50 he expected.',
            mistakeType: 'service-mixup',
            confusedWithConceptId: undefined,
          },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // Scenario 3: SACCO Member Portal
  // ════════════════════════════════════════════════════════════════
  {
    id: SCENARIO_IDS.saccoportal,
    domains: ['cloud-concepts', 'architecture-services'],
    title: 'SACCO Member Portal',
    context: 'Kenyan SACCO',
    story: `## Securing the Umoja SACCO Portal

Umoja SACCO has 8,000 members across Nairobi. They are moving their member portal (loan applications, statement downloads, savings tracking) to Azure.

Their security officer, Ms. Atieno, is very concerned. Members' financial data is sensitive. She needs to understand how security responsibilities are shared, how members will authenticate securely, and how to make sure only authorised staff can approve loans.

Help Ms. Atieno and the IT team make the right identity and security decisions.`,
    requirements: [
      'Members must authenticate securely; passwords alone are not enough',
      'Loan officers can approve loans; clerks can only view applications',
      'Understand which security responsibilities Microsoft handles vs. the SACCO',
    ],
    difficulty: 2,
    conceptIds: [
      CONCEPT_IDS.sharedResponsibility,
      CONCEPT_IDS.entraId,
      CONCEPT_IDS.mfa,
      CONCEPT_IDS.rbac,
    ],
    status: 'published',
    aiGenerated: false,
    verified: true,
    decisionsData: [
      {
        id: 'd3000001-0000-0000-0000-000000000001',
        prompt: 'The SACCO runs its portal on Azure App Service with Azure SQL Database. Which of the following items is Microsoft responsible for securing under the shared responsibility model for PaaS? (Select all that apply)',
        type: 'multi',
        orderIndex: 0,
        options: [
          {
            id: uuidv4(),
            label: 'Physical security of the datacenter',
            isCorrect: true,
            feedback: 'In ALL service models (IaaS, PaaS, SaaS), Microsoft is always responsible for physical security of the datacenters. This is non-negotiable and never shifts to the customer.',
            consequence: 'Members\' data sits on servers in physically secured, access-controlled datacenters that the SACCO never needs to think about.',
            mistakeType: undefined,
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'The underlying server OS and runtime',
            isCorrect: true,
            feedback: 'In a PaaS model (App Service, Azure SQL Database), Microsoft manages the OS, patching, and runtime. The SACCO doesn\'t need to apply Windows patches or worry about OS vulnerabilities.',
            consequence: 'A critical OS vulnerability is patched by Microsoft within 24 hours of release — without the SACCO\'s IT team doing anything.',
            mistakeType: undefined,
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Member data stored in the database',
            isCorrect: false,
            feedback: 'Customer data is ALWAYS the customer\'s responsibility, in all service models. Microsoft provides the infrastructure and tools to protect data (encryption, backups), but the SACCO decides what data to store, how to classify it, who can access it, and how long to keep it.',
            consequence: 'If the SACCO stores unencrypted member PINs in the database and a breach occurs, that is the SACCO\'s liability — not Microsoft\'s. Data governance is the customer\'s responsibility.',
            mistakeType: 'vocabulary-gap',
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Identity and access management for SACCO staff accounts',
            isCorrect: false,
            feedback: 'Who gets access to SACCO staff accounts, what roles they are assigned, and whether MFA is enforced — these are all the SACCO\'s responsibility. Microsoft provides the tools (Entra ID, RBAC), but the SACCO must configure and manage them.',
            consequence: 'If the SACCO doesn\'t enforce MFA for staff accounts and a loan officer\'s account is phished, the resulting fraudulent loan approvals are the SACCO\'s problem to resolve.',
            mistakeType: 'vocabulary-gap',
            confusedWithConceptId: undefined,
          },
        ],
      },
      {
        id: 'd3000001-0000-0000-0000-000000000002',
        prompt: 'To secure member logins, the SACCO wants to require a second verification step beyond a password. Which Azure feature should they enable?',
        type: 'single',
        orderIndex: 1,
        options: [
          {
            id: uuidv4(),
            label: 'Multi-Factor Authentication (MFA) via Microsoft Entra ID',
            isCorrect: true,
            feedback: 'MFA adds a second factor (a code sent to a member\'s phone via SMS or the Authenticator app) on top of the password. This dramatically reduces the risk of account takeover even if a member\'s password is compromised. Entra ID provides MFA natively and can enforce it for all sign-ins.',
            consequence: 'A member\'s password is stolen in a phishing attack. The attacker cannot log in because they don\'t have the member\'s phone. The account is safe.',
            mistakeType: undefined,
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Require longer passwords (16+ characters)',
            isCorrect: false,
            feedback: 'Longer passwords improve security against brute-force attacks, but they do not protect against phishing (where a user gives away their password directly), credential stuffing, or keyloggers. MFA protects against all of these because even the correct password alone is not enough.',
            consequence: 'Members set 16-character passwords. Six months later, a phishing campaign tricks 50 members into entering their credentials on a fake site. Long passwords offer no protection here — MFA would have stopped every single one of those compromises.',
            mistakeType: 'vocabulary-gap',
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Azure DDoS Protection',
            isCorrect: false,
            feedback: 'Azure DDoS Protection defends against Distributed Denial of Service attacks — flooding the service with traffic to make it unavailable. It does not help with authentication security for individual member accounts.',
            consequence: 'DDoS protection is configured. The portal stays up under a traffic flood. But member accounts are still protected only by passwords. Account takeovers continue because DDoS protection is the wrong tool for authentication security.',
            mistakeType: 'service-mixup',
            confusedWithConceptId: undefined,
          },
        ],
      },
      {
        id: 'd3000001-0000-0000-0000-000000000003',
        prompt: 'The SACCO has two types of staff: Loan Officers (can approve or reject loans) and Clerks (can only view applications, cannot approve). How should the SACCO implement this access distinction in Azure?',
        type: 'single',
        orderIndex: 2,
        options: [
          {
            id: uuidv4(),
            label: 'Assign different Azure RBAC roles to Loan Officers and Clerks at the resource group level',
            isCorrect: true,
            feedback: 'RBAC lets you assign roles (custom or built-in) to users or groups at a defined scope. A "Loan Officer" role can be granted write permissions on the loan approval resource; a "Clerk" role gets only read permissions. This is the correct way to implement least-privilege access differentiation in Azure.',
            consequence: 'A clerk accidentally tries to approve a loan in the portal. The action is denied and an audit log entry is created. The separation of duties is enforced at the platform level.',
            mistakeType: undefined,
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Use Azure Policy to prevent Clerks from approving loans',
            isCorrect: false,
            feedback: 'Azure Policy enforces resource configuration rules across your Azure environment (e.g. "require specific resource tags" or "only certain VM sizes allowed"). It is not designed to control access to application-level actions like approving a loan — that is what RBAC is for.',
            consequence: 'The team applies a Policy that looks like it restricts Clerk access, but it actually only prevents Clerks from creating new Azure resources. A Clerk can still approve loans through the application because application-level access was never actually restricted.',
            mistakeType: 'service-mixup',
            confusedWithConceptId: CONCEPT_IDS.azurePolicy,
          },
          {
            id: uuidv4(),
            label: 'Give Clerks the same admin access as Loan Officers but instruct them not to approve loans',
            isCorrect: false,
            feedback: 'Relying on policy-only instructions ("don\'t do X") without technical controls is not a security control. This violates the principle of least privilege and creates audit, compliance, and liability problems. If a Clerk approves a loan accidentally or maliciously, there is no technical barrier that was bypassed.',
            consequence: 'Three months later, a Clerk accidentally approves a KES 500,000 loan to the wrong member. Because there was no technical control, the SACCO has no system-enforced audit trail and must resolve the issue manually.',
            mistakeType: 'vocabulary-gap',
            confusedWithConceptId: undefined,
          },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // Scenario 4: Accidental Deletion Scare
  // ════════════════════════════════════════════════════════════════
  {
    id: SCENARIO_IDS.accidentalDeletion,
    domains: ['management-governance'],
    title: 'Accidental Deletion Scare',
    context: 'Financial services firm',
    story: `## The Midnight Deletion Incident

Baraka Financial Services runs their core banking API on Azure. Last week, a junior developer—while cleaning up a dev environment—accidentally deleted a **production resource group**, taking down the banking API for 4 hours.

The CTO is furious. He wants technical guardrails, not just policies written in a Word document. He asks the platform team: "How do we make sure this never happens again?"

The team needs to apply the right controls to protect production resources from accidental or unauthorised changes.`,
    requirements: [
      'Prevent accidental deletion of production resources',
      'Allow authorised engineers to still make configuration changes (e.g. scaling)',
      'Ensure no one—not even admins—can delete without going through a deliberate process',
    ],
    difficulty: 2,
    conceptIds: [
      CONCEPT_IDS.resourceLocks,
      CONCEPT_IDS.rbac,
      CONCEPT_IDS.azurePolicy,
    ],
    status: 'published',
    aiGenerated: false,
    verified: true,
    decisionsData: [
      {
        id: 'd4000001-0000-0000-0000-000000000001',
        prompt: 'What is the best Azure mechanism to prevent accidental deletion of the production resource group, while still allowing engineers to modify resources (e.g. scale up a VM)?',
        type: 'single',
        orderIndex: 0,
        options: [
          {
            id: uuidv4(),
            label: 'Apply a Delete lock on the production resource group',
            isCorrect: true,
            feedback: 'A Delete lock (CanNotDelete) prevents deletion of a resource or resource group, but allows reads and modifications. Even an Owner role cannot delete the resource without first removing the lock — and removing the lock is a deliberate, audited action. This is exactly the right control for this scenario.',
            consequence: 'The next developer who accidentally runs a delete command gets a clear error: "Resource is locked." The lock must be explicitly removed before deletion — forcing a deliberate, conscious decision. No more accidental deletions.',
            mistakeType: undefined,
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Remove the Owner role from all developers and only give Contributor',
            isCorrect: false,
            feedback: 'Contributors can create and manage resources but cannot delete resource groups or assign roles. This is a valid RBAC control, but it does not provide the strong "deliberate process" guarantee that a lock does. A Contributor CAN delete individual resources within the group, just not the group itself. Depending on what was deleted, this may not be sufficient.',
            consequence: 'Junior developers can no longer delete the resource group. However, a Contributor accidentally deletes the production database (a resource inside the group). Without a lock on the database resource, deletion succeeds.',
            mistakeType: 'service-mixup',
            confusedWithConceptId: CONCEPT_IDS.rbac,
          },
          {
            id: uuidv4(),
            label: 'Apply an Azure Policy that denies delete operations on production resources',
            isCorrect: false,
            feedback: 'Azure Policy is primarily designed to enforce configuration standards (e.g. allowed SKUs, required tags, allowed regions), not to serve as an access control mechanism. While deny-effect policies can block some operations, Resource Locks are the purpose-built, simpler, and more reliable tool for protecting against deletion.',
            consequence: 'The team writes a complex Policy with a deny effect on delete operations. It works for some resource types but not all — edge cases exist where the policy does not trigger correctly. A critical storage account is deleted 3 months later. Locks would have been simpler and more reliable.',
            mistakeType: 'service-mixup',
            confusedWithConceptId: CONCEPT_IDS.azurePolicy,
          },
          {
            id: uuidv4(),
            label: 'Apply a ReadOnly lock on the production resource group',
            isCorrect: false,
            feedback: 'A ReadOnly lock prevents both deletion AND modification. While this stops accidental deletion, it also blocks legitimate configuration changes — engineers cannot scale resources, update settings, or deploy new versions. This is too restrictive for a live production environment and would block normal operations.',
            consequence: 'The ReadOnly lock prevents all accidental deletions. However, on the next deployment day, engineers cannot update the App Service configuration or scale the database. The deployment is blocked for 2 hours while the team debates whether to remove the lock.',
            mistakeType: 'requirements-misread',
            confusedWithConceptId: undefined,
          },
        ],
      },
      {
        id: 'd4000001-0000-0000-0000-000000000002',
        prompt: 'The CTO also wants to ensure that ALL new resources created in the production subscription must have a "Environment: Production" tag, to make cost tracking and auditing easier. Which tool enforces this at scale?',
        type: 'single',
        orderIndex: 1,
        options: [
          {
            id: uuidv4(),
            label: 'Azure Policy with a "require tag" policy definition',
            isCorrect: true,
            feedback: 'Azure Policy can enforce tagging standards: a policy in "Deny" mode prevents any resource from being created without the required tag. You can also use an "Append" effect to automatically add the tag. This ensures consistent tagging across the entire subscription regardless of who creates the resource.',
            consequence: 'Every new resource in production is automatically required to have the "Environment: Production" tag. Cost Management now accurately groups and allocates all production costs. The monthly cost report takes 10 minutes instead of a day.',
            mistakeType: undefined,
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Send an email to all developers reminding them to add tags',
            isCorrect: false,
            feedback: 'Manual reminders are not a scalable or reliable governance control. People forget, are too busy, or might not see the email. Azure Policy is the automated, policy-as-code approach that enforces rules regardless of who creates the resource and whether they read the email.',
            consequence: 'The tagging email is ignored by 60% of developers. After 3 months, 40% of production resources are untagged. Cost Management cannot accurately allocate costs by team. The manual tag cleanup takes 2 days.',
            mistakeType: 'vocabulary-gap',
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Use RBAC to grant only Admins the ability to create resources',
            isCorrect: false,
            feedback: 'Restricting resource creation to Admins would severely slow down development — every new resource would require an Admin to create it, creating a bottleneck. RBAC controls who can do what, but it does not enforce what metadata (tags) must be present when they do it. That is Azure Policy\'s job.',
            consequence: 'Only Admins can create resources. Development slows down dramatically as teams wait for Admin approval for every new resource. Tagging compliance does not improve because Admins are too busy to remember tags either.',
            mistakeType: 'service-mixup',
            confusedWithConceptId: CONCEPT_IDS.rbac,
          },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // Scenario 5: Seasonal E-commerce Spike
  // ════════════════════════════════════════════════════════════════
  {
    id: SCENARIO_IDS.ecommercespike,
    domains: ['architecture-services', 'cloud-concepts'],
    title: 'Seasonal E-commerce Spike',
    context: 'Nairobi retailer',
    story: `## Black Friday Comes to Nairobi

MegaMall Online is Nairobi's fastest-growing e-commerce platform. They are planning a 48-hour "Nairobi Sale" promotion — modelled after Black Friday — where they expect traffic to increase **50× above their normal load**.

Last year the site crashed within 10 minutes of the sale starting. They lost an estimated KES 5 million in sales. This year, they have moved to Azure and want to architect for the spike correctly.

Their CTO, Mr. Otieno, has three priorities: stay up during the spike, recover instantly if one part fails, and not pay for 50× capacity all year round.`,
    requirements: [
      'Handle a 50× traffic spike for a 48-hour window',
      'Maintain availability even if one Azure datacenter has a problem',
      'Return to normal capacity (and cost) after the sale ends',
    ],
    difficulty: 2,
    conceptIds: [
      CONCEPT_IDS.scalability,
      CONCEPT_IDS.elasticity,
      CONCEPT_IDS.availabilityZones,
      CONCEPT_IDS.sla,
      CONCEPT_IDS.payAsYouGo,
    ],
    status: 'published',
    aiGenerated: false,
    verified: true,
    decisionsData: [
      {
        id: 'd5000001-0000-0000-0000-000000000001',
        prompt: 'To handle the 50× traffic spike cost-effectively, which Azure capability should MegaMall use?',
        type: 'single',
        orderIndex: 0,
        options: [
          {
            id: uuidv4(),
            label: 'Azure App Service auto-scaling (elasticity)',
            isCorrect: true,
            feedback: 'Elasticity means automatically scaling resources in response to real-time demand and releasing them when no longer needed. App Service auto-scaling can scale out to dozens of instances for the 48-hour sale period, then automatically scale back in — so MegaMall only pays for the extra capacity during the sale.',
            consequence: 'At 6:00 AM when the Nairobi Sale begins, traffic spikes immediately. App Service detects CPU at 85% and scales from 2 to 40 instances in under 5 minutes. The site stays up. 48 hours later, traffic returns to normal and instances scale back to 2. The total extra cost: ≈ KES 45,000 — a fraction of the KES 5 million lost last year.',
            mistakeType: undefined,
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Purchase 50× Reserved Instances for the whole year',
            isCorrect: false,
            feedback: 'Reserved Instances are a discount mechanism for predictable, steady-state workloads — you commit to using a certain number of VMs for 1-3 years. Buying 50× RIs for a 48-hour spike means paying for that capacity all year round, which is 180× more expensive than using elastic scaling. This eliminates the entire cost benefit of the cloud.',
            consequence: 'MegaMall commits to 50× Reserved Instances for a year. The Nairobi Sale goes well, but they pay for 50 instances 365 days a year at full price. The cloud bill is KES 2.2 million/year more than it would have been with elastic scaling.',
            mistakeType: 'requirements-misread',
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Manually add servers two days before the sale and remove them after',
            isCorrect: false,
            feedback: 'Manual scaling works, but it is slow, error-prone, and requires someone to be on call to execute it. If traffic spikes faster than expected or at an unexpected time, the site goes down before the team can react. Auto-scaling reacts in minutes; humans take much longer.',
            consequence: 'The team manually adds servers the day before the sale. But traffic spikes 4 hours earlier than expected when a tweet goes viral. The site is down for 90 minutes before the team can add more servers.',
            mistakeType: 'vocabulary-gap',
            confusedWithConceptId: undefined,
          },
        ],
      },
      {
        id: 'd5000001-0000-0000-0000-000000000002',
        prompt: 'Mr. Otieno wants the highest possible availability SLA during the sale. His current deployment runs in a single Azure datacenter in one region. What change would most improve the SLA?',
        type: 'single',
        orderIndex: 1,
        options: [
          {
            id: uuidv4(),
            label: 'Deploy the application across multiple Availability Zones in the same region',
            isCorrect: true,
            feedback: 'Availability Zones are physically separate datacenters within a region, each with independent power and cooling. By deploying across 3 zones, if one zone experiences a power or hardware failure, the other two handle traffic seamlessly. This raises the App Service SLA from 99.95% (single datacenter) toward 99.99%. This is the right first step before considering multi-region.',
            consequence: 'During the sale, a cooling failure affects Zone 1. Traffic is automatically redirected to instances in Zone 2 and Zone 3. Users experience a brief slowdown but the site stays up. Zero revenue lost. The operations team gets an Azure Monitor alert and resolves Zone 1 within 2 hours.',
            mistakeType: undefined,
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Deploy to multiple regions globally',
            isCorrect: false,
            feedback: 'Multi-region deployment offers higher availability than Availability Zones, but adds significant complexity: data replication, global load balancing (Azure Front Door or Traffic Manager), consistency decisions, and much higher cost. For MegaMall\'s primarily Nairobi-based customer base, deploying across Availability Zones in a single region is the right balance of availability and complexity.',
            consequence: 'MegaMall deploys to three regions globally. Complexity is high — the team spends 3 weeks configuring geo-replication and Front Door. The extra cost is significant. 95% of their customers are in Nairobi and experience no meaningful latency improvement.',
            mistakeType: 'overengineering',
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Increase VM size (scale up) in the single datacenter',
            isCorrect: false,
            feedback: 'Scaling up (vertical scaling) makes a single VM larger. It does not help with availability — a larger VM in a single datacenter still fails completely if that datacenter has a power or cooling issue. Availability Zones protect against datacenter-level failures, which scaling up does not address.',
            consequence: 'MegaMall upgrades to the largest VM size available. During the Nairobi Sale, a power issue in the single datacenter brings it down. The larger VM goes down just as quickly as a smaller one. The site is offline for 2 hours.',
            mistakeType: 'vocabulary-gap',
            confusedWithConceptId: CONCEPT_IDS.scalability,
          },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // Scenario 6: Governance for a Growing NGO
  // ════════════════════════════════════════════════════════════════
  {
    id: SCENARIO_IDS.ngoGovernance,
    domains: ['management-governance'],
    title: 'Governance for a Growing NGO',
    context: 'Pan-African NGO',
    story: `## Taming the Azure Sprawl at AfricaHope

AfricaHope NGO operates across 12 African countries. They started with one Azure subscription for their Nairobi office, but now have 14 subscriptions managed by different country teams.

Each team creates resources without consistent naming, tagging, or security settings. Last quarter, their cloud bill was KES 4.2 million — up from KES 1.1 million — and no one can explain where the money went.

The new CTO, Dr. Amara, is bringing in structure. She wants governance that scales as they add new country subscriptions, without creating a bureaucratic bottleneck.`,
    requirements: [
      'Apply the same security and compliance policies to all 14 subscriptions centrally',
      'Track costs per country team and per project across all subscriptions',
      'Allow country teams to self-serve within guardrails, without central Admin approval for every resource',
    ],
    difficulty: 3,
    conceptIds: [
      CONCEPT_IDS.managementGroups,
      CONCEPT_IDS.azurePolicy,
      CONCEPT_IDS.costManagement,
      CONCEPT_IDS.rbac,
    ],
    status: 'published',
    aiGenerated: false,
    verified: true,
    decisionsData: [
      {
        id: 'd6000001-0000-0000-0000-000000000001',
        prompt: 'Dr. Amara wants to apply one set of security policies (e.g. require encryption at rest, allowed regions, mandatory tags) to all 14 subscriptions at once. Which Azure feature makes this possible without configuring each subscription individually?',
        type: 'single',
        orderIndex: 0,
        options: [
          {
            id: uuidv4(),
            label: 'Create a Management Group hierarchy and apply Azure Policy Initiative at the Management Group level',
            isCorrect: true,
            feedback: 'Management Groups allow you to organise subscriptions into a hierarchy (e.g. AfricaHope Root → East Africa, West Africa → individual country subscriptions). Policies and RBAC applied to a Management Group automatically cascade to all subscriptions within it. A Policy Initiative bundles multiple policies together for easier assignment. This is exactly the right tool for governing multiple subscriptions at scale.',
            consequence: 'Dr. Amara creates an "AfricaHope Root" management group containing all 14 subscriptions. She assigns a Policy Initiative requiring: encryption at rest, allowed regions (Africa only), and mandatory "Country" and "Project" tags. Within 48 hours, all 14 subscriptions are governed. New subscriptions added later automatically inherit the rules.',
            mistakeType: undefined,
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Apply Azure Policy to each of the 14 subscriptions individually',
            isCorrect: false,
            feedback: 'Applying policies subscription-by-subscription works but does not scale. With 14 subscriptions (and growing), each new subscription requires a manual policy assignment. This creates operational overhead and risks inconsistency — a new subscription created by a country team may not get the policies applied immediately.',
            consequence: 'The team applies policies to all 14 subscriptions. A 15th subscription is created by the Uganda team and missed in the process. Resources in Uganda are created without mandatory tags and in a non-approved region for 3 weeks before anyone notices.',
            mistakeType: 'requirements-misread',
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Send each country team a policy document and rely on them to comply',
            isCorrect: false,
            feedback: 'Policy documents with no technical enforcement are not governance — they are guidelines. With 14 independent country teams, compliance will be inconsistent. Technical controls enforced by Azure Policy are the only scalable way to ensure consistent governance.',
            consequence: 'Most teams ignore the policy document or interpret it differently. After 6 months, an audit finds 40% of resources are in non-approved configurations. Manual remediation takes 3 weeks.',
            mistakeType: 'vocabulary-gap',
            confusedWithConceptId: undefined,
          },
        ],
      },
      {
        id: 'd6000001-0000-0000-0000-000000000002',
        prompt: 'AfricaHope wants to see cloud costs broken down by country team and project without restructuring their Azure subscriptions. What is the most practical first step?',
        type: 'multi',
        orderIndex: 1,
        options: [
          {
            id: uuidv4(),
            label: 'Enforce mandatory "Country" and "Project" tags on all resources using Azure Policy',
            isCorrect: true,
            feedback: 'Tags are key-value pairs attached to Azure resources. By enforcing mandatory "Country" and "Project" tags via Policy, every resource is labelled with the team that owns it. Azure Cost Management can then filter and group costs by tag — giving Dr. Amara a breakdown per country and per project.',
            consequence: 'Every resource now has "Country: Kenya" and "Project: HealthClinicApp" labels. Cost Management shows Dr. Amara that Uganda spent KES 1.1M, Nigeria spent KES 800K, and the Nairobi HQ spent KES 2.3M — and exactly which projects drove those costs.',
            mistakeType: undefined,
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Use Azure Cost Management to create budget alerts per subscription',
            isCorrect: true,
            feedback: 'Cost Management lets you set budgets at the subscription level and configure alerts when spending reaches a threshold (e.g. 80%). This gives each country team visibility and early warning of overspending, without requiring central Admin approval for every purchase.',
            consequence: 'The Kenya subscription budget is set to KES 600,000/month with an 80% alert. In month 2, the Kenya team gets an alert at KES 480,000. They review and find an idle development VM running 24/7. Shutting it down saves KES 80,000/month.',
            mistakeType: undefined,
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Create a separate Azure account for each country',
            isCorrect: false,
            feedback: 'Creating completely separate Azure accounts (tenants) makes central governance almost impossible — you cannot apply Management Groups across tenants, and Cost Management does not aggregate across tenants. Subscriptions within the same tenant under a Management Group hierarchy is the right structure.',
            consequence: 'After creating 12 separate tenants, the central team discovers they cannot apply unified policies, cannot see consolidated costs, and must manage 12 separate billing relationships. They spend 2 months consolidating back into a single tenant.',
            mistakeType: 'overengineering',
            confusedWithConceptId: undefined,
          },
        ],
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════
  // Scenario 7: Moving a Clinic's Records to the Cloud
  // ════════════════════════════════════════════════════════════════
  {
    id: SCENARIO_IDS.clinicRecords,
    domains: ['architecture-services', 'cloud-concepts'],
    title: "Moving a Clinic's Records to the Cloud",
    context: 'Kenyan private clinic',
    story: `## Digi-Health Clinic Goes Cloud

Digi-Health Clinic in Mombasa has 5,000 patient records stored on an ageing on-premises server. The server is 7 years old, has failed twice in the past year, and has no off-site backup.

The clinic's administrator, Mrs. Fatuma, wants to migrate to Azure. But she has concerns:
- Kenya has data protection laws (the Data Protection Act 2019). Can patient records legally leave Kenya?
- If Azure's main region goes down, will records be permanently lost?
- Who is responsible for securing the patient data?

Help Mrs. Fatuma make informed decisions about region choice, storage redundancy, and data security.`,
    requirements: [
      'Patient data must remain within Kenya or at most the East Africa region (data residency)',
      'Protect against permanent data loss if one Azure site fails',
      'Ensure the clinic understands its own security obligations (shared responsibility)',
    ],
    difficulty: 2,
    conceptIds: [
      CONCEPT_IDS.regions,
      CONCEPT_IDS.regionPairs,
      CONCEPT_IDS.storageRedundancy,
      CONCEPT_IDS.sharedResponsibility,
    ],
    status: 'published',
    aiGenerated: false,
    verified: true,
    decisionsData: [
      {
        id: 'd7000001-0000-0000-0000-000000000001',
        prompt: 'Mrs. Fatuma is worried about data residency. The clinic must store patient data within East Africa. Which approach correctly addresses this concern?',
        type: 'single',
        orderIndex: 0,
        options: [
          {
            id: uuidv4(),
            label: 'Choose an Azure region located in East/South Africa (e.g. South Africa North) and review the data residency guarantees in the Microsoft Customer Agreement',
            isCorrect: true,
            feedback: 'Azure regions are geographically bound data centers. By explicitly selecting a region in Africa (e.g. South Africa North in Johannesburg, or East Africa if available), you ensure data is stored in that geography. You should also review the Microsoft Customer Agreement and the Microsoft Trust Center to understand exact data residency guarantees and any exceptions. Note: as of 2024, Azure\'s African regions are South Africa North and South Africa West — verify current availability on the Azure website. // VERIFY against Microsoft Learn',
            consequence: 'Patient data is stored in South Africa North. Mrs. Fatuma can demonstrate to the Data Protection Commissioner that all personal health data is processed within Africa, with contractual guarantees from Microsoft. Compliance risk is managed.',
            mistakeType: undefined,
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Use whichever region is cheapest — data residency is not a real legal requirement',
            isCorrect: false,
            feedback: 'The Kenya Data Protection Act (2019) and equivalent laws in many African countries do impose data residency obligations, particularly for sensitive categories of data such as health records. Ignoring these requirements creates regulatory risk, potential fines, and loss of patient trust. Data residency is a real and important consideration.',
            consequence: 'The clinic stores data in a US region to save costs. A year later, a data protection audit finds the clinic in breach. A fine is issued, and the clinic must migrate all data back to an African region at significant cost and disruption.',
            mistakeType: 'vocabulary-gap',
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Use any Azure region — Microsoft guarantees that data never leaves the region you choose',
            isCorrect: false,
            feedback: 'Microsoft generally keeps data within the selected geography for data at rest, but some services (like support diagnostics or certain AI features) may process data outside the region. You need to review the specific Microsoft Customer Agreement and service terms to understand the exact data boundary commitments. "Any region" with an assumption of absolute data residency is not precise enough for regulated health data.',
            consequence: 'The clinic assumes absolute data residency without reviewing the terms. During a compliance audit, they cannot demonstrate exactly where data processing occurs for all services. The auditor raises a concern about specific diagnostic data flows.',
            mistakeType: 'vocabulary-gap',
            confusedWithConceptId: undefined,
          },
        ],
      },
      {
        id: 'd7000001-0000-0000-0000-000000000002',
        prompt: 'Mrs. Fatuma wants to ensure that even if the Azure datacenter in her chosen region completely fails, patient records are not permanently lost. Which storage redundancy option protects against a complete datacenter failure?',
        type: 'single',
        orderIndex: 1,
        options: [
          {
            id: uuidv4(),
            label: 'Geo-Redundant Storage (GRS)',
            isCorrect: true,
            feedback: 'GRS stores 3 copies of your data in the primary region (like LRS) AND asynchronously replicates to a secondary paired region. If the primary region is completely unavailable, data can be recovered from the secondary region. This protects against a complete regional failure. Note: consider whether the secondary region is within the required data residency boundary — GRS pairs are within the same geographic area (e.g. Africa). // VERIFY the exact GRS pairing for South Africa North against Microsoft Learn.',
            consequence: 'A major flood destroys the primary Azure datacenter. Microsoft initiates a failover to the paired region. Patient records are recoverable. Mrs. Fatuma\'s clinic has business continuity despite a catastrophic event.',
            mistakeType: undefined,
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Locally Redundant Storage (LRS)',
            isCorrect: false,
            feedback: 'LRS stores 3 synchronous copies of your data within a single datacenter. It protects against disk and server failures within that datacenter, but if the entire datacenter is destroyed (fire, flood, power failure), all 3 copies are lost. LRS does not protect against a complete datacenter failure.',
            consequence: 'The clinic uses LRS. A catastrophic fire destroys the datacenter. All 3 LRS copies are in the same building. All patient records are permanently lost. The clinic has no backup. This is the exact same situation as the old failing on-premises server — just more expensive.',
            mistakeType: 'vocabulary-gap',
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Zone-Redundant Storage (ZRS)',
            isCorrect: false,
            feedback: 'ZRS spreads 3 copies across different Availability Zones within the same region. This protects against individual zone failures (a specific datacenter building going down). However, if the entire region is affected (e.g. a city-wide power grid failure or regional network outage), ZRS does not protect you — all zones are still within the same geographic area.',
            consequence: 'The clinic uses ZRS. A regional network outage affects all Availability Zones in the region simultaneously. All ZRS copies are unreachable. Without GRS, there is no data in another region to fall back to.',
            mistakeType: 'service-mixup',
            confusedWithConceptId: CONCEPT_IDS.availabilityZones,
          },
        ],
      },
      {
        id: 'd7000001-0000-0000-0000-000000000003',
        prompt: 'Mrs. Fatuma asks: "If we move to Azure, does Microsoft protect all our patient data automatically?" Which statement correctly describes the shared responsibility for security?',
        type: 'single',
        orderIndex: 2,
        options: [
          {
            id: uuidv4(),
            label: 'Microsoft secures the infrastructure; the clinic is responsible for data access controls, encryption settings, and who is authorised to access patient records',
            isCorrect: true,
            feedback: 'Under the Shared Responsibility Model, Microsoft is responsible for the physical datacenter, hardware, and network security (and, for PaaS services, the OS and platform). But the clinic remains responsible for: configuring who can access patient data (access controls), ensuring data is encrypted (usually enabled by default but must be verified), and managing authentication for clinic staff. Microsoft provides the tools; the clinic must use them correctly.',
            consequence: 'The clinic configures RBAC so only doctors and nurses can access patient records. Encryption at rest is enabled and verified. MFA is enforced for all clinic staff logins. When a new receptionist joins, access is provisioned carefully. Security is a shared effort and the clinic actively owns their part.',
            mistakeType: undefined,
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'Microsoft is responsible for all security once data is in Azure — the clinic has no security obligations',
            isCorrect: false,
            feedback: 'This is incorrect and dangerous. The Shared Responsibility Model makes clear that customers always retain responsibility for their data, identity management, and access control — regardless of service model. If the clinic leaves patient records accessible to all staff with no access controls, that is the clinic\'s security failure, not Microsoft\'s.',
            consequence: 'The clinic assumes Microsoft handles everything. They do not configure access controls. A receptionist can access all patient records, including HIV and mental health diagnoses. A data breach occurs and the clinic is liable under the Data Protection Act.',
            mistakeType: 'vocabulary-gap',
            confusedWithConceptId: undefined,
          },
          {
            id: uuidv4(),
            label: 'The clinic is responsible for everything, including the physical security of the Azure datacenters',
            isCorrect: false,
            feedback: 'Physical datacenter security is always Microsoft\'s responsibility — the customer never has to worry about who can physically access the server hardware. The split in the shared responsibility model exists precisely so that customers can benefit from Microsoft\'s massive investment in physical security without having to manage it themselves.',
            consequence: 'The clinic wastes time requesting physical security audits of Azure datacenters, which Microsoft does not grant to individual customers. They could have used that time configuring proper access controls, which is their actual responsibility.',
            mistakeType: 'vocabulary-gap',
            confusedWithConceptId: undefined,
          },
        ],
      },
    ],
  },
];

// ─── Main seed function ────────────────────────────────────────────────────

async function seed() {
  logger.info('Starting idempotent seed...');

  // 1. Seed concepts
  logger.info(`Seeding ${conceptsData.length} concepts...`);
  for (const concept of conceptsData) {
    await db.execute(sql`
      INSERT INTO concepts (id, domain, name, summary, learn_url, analogy_base, analogy_base_sw)
      VALUES (
        ${concept.id}::uuid,
        ${concept.domain},
        ${concept.name},
        ${concept.summary},
        ${concept.learnUrl},
        ${concept.analogyBase},
        ${concept.analogyBaseSw ?? null}
      )
      ON CONFLICT (id) DO UPDATE SET
        domain = EXCLUDED.domain,
        name = EXCLUDED.name,
        summary = EXCLUDED.summary,
        learn_url = EXCLUDED.learn_url,
        analogy_base = EXCLUDED.analogy_base,
        analogy_base_sw = EXCLUDED.analogy_base_sw
    `);
  }
  logger.info('Concepts seeded.');

  // 2. Seed scenarios and their decisions
  logger.info(`Seeding ${scenariosData.length} scenarios...`);
  for (const scenario of scenariosData) {
    const { decisionsData: scenarioDecisions, ...scenarioRow } = scenario;

    // Upsert scenario
    await db.execute(sql`
      INSERT INTO scenarios (
        id, domains, title, story, context, requirements, difficulty,
        concept_ids, status, ai_generated, verified
      ) VALUES (
        ${scenarioRow.id}::uuid,
        ${JSON.stringify(scenarioRow.domains)}::json,
        ${scenarioRow.title},
        ${scenarioRow.story},
        ${scenarioRow.context},
        ${JSON.stringify(scenarioRow.requirements)}::json,
        ${scenarioRow.difficulty},
        ${JSON.stringify(scenarioRow.conceptIds)}::json,
        ${scenarioRow.status},
        ${scenarioRow.aiGenerated},
        ${scenarioRow.verified}
      )
      ON CONFLICT (id) DO UPDATE SET
        domains = EXCLUDED.domains,
        title = EXCLUDED.title,
        story = EXCLUDED.story,
        context = EXCLUDED.context,
        requirements = EXCLUDED.requirements,
        difficulty = EXCLUDED.difficulty,
        concept_ids = EXCLUDED.concept_ids,
        status = EXCLUDED.status,
        ai_generated = EXCLUDED.ai_generated,
        verified = EXCLUDED.verified
    `);

    // Upsert decisions for this scenario
    for (const decision of scenarioDecisions) {
      await db.execute(sql`
        INSERT INTO decisions (id, scenario_id, prompt, type, options, order_index)
        VALUES (
          ${decision.id}::uuid,
          ${scenarioRow.id}::uuid,
          ${decision.prompt},
          ${decision.type},
          ${JSON.stringify(decision.options)}::json,
          ${decision.orderIndex}
        )
        ON CONFLICT (id) DO UPDATE SET
          prompt = EXCLUDED.prompt,
          type = EXCLUDED.type,
          options = EXCLUDED.options,
          order_index = EXCLUDED.order_index
      `);
    }

    logger.info(`Seeded scenario: ${scenarioRow.title}`);
  }

  logger.info('Seed complete. ✅');
}

seed()
  .catch((err) => {
    logger.error({ err }, 'Seed failed');
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
