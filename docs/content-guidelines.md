# AzureQuest Content Guidelines

> All scenarios are original content aligned with the publicly available AZ-900 skills outline on Microsoft Learn. No real exam questions are reproduced.

## Scenario Authoring Checklist

Every published scenario must pass all items before seeding:

### Accuracy
- [ ] All technical claims verified against the current [AZ-900 skills outline](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900)
- [ ] Each correct answer is unambiguously correct for the given requirements
- [ ] Wrong options are plausible but clearly distinguishable with knowledge
- [ ] `mistakeType` accurately describes why a learner might choose each wrong option
- [ ] `confusedWithConceptId` correctly identifies what the learner confused
- [ ] No items marked `// VERIFY against Microsoft Learn` remain unresolved

### Originality
- [ ] Story is original fiction, not adapted from real exam materials
- [ ] Context is African-specific (Kenya, East Africa, or pan-African)
- [ ] No Microsoft or Azure branding misused

### Pedagogy
- [ ] The scenario teaches a decision, not just a definition
- [ ] Requirements are specific enough to narrow to one correct architecture choice
- [ ] Per-option feedback explains *why* — not just "this is correct"
- [ ] Consequences are vivid and memorable (the "consequence reveal" moment)
- [ ] Concepts tested match the `conceptIds` array

### Analogies
- [ ] `analogyBase` is technically accurate (the analogy cannot mislead)
- [ ] Analogy is from the verified list OR marked `// TODO: human review`
- [ ] If the analogy breaks down, this is noted explicitly
- [ ] Swahili analogy (`analogyBaseSw`) reviewed by a Swahili speaker, OR marked `// TODO: human review`

### Metadata
- [ ] `difficulty` (1=beginner, 2=intermediate, 3=advanced) correctly reflects cognitive load
- [ ] `domains[]` lists all domains tested
- [ ] `status: 'published'` only set after all checks pass
- [ ] `aiGenerated: false` and `verified: true` for all seeded content

---

## Domain Coverage Map

| Scenario | Cloud Concepts | Arch & Services | Mgmt & Governance |
|----------|---------------|-----------------|-------------------|
| University Registration | — | ✅ (App Service, Blob, AZ) | ✅ (RBAC, Monitor) |
| Startup Launch | ✅ (IaaS/PaaS, cost model) | ✅ (App Service, SQL DB) | — |
| SACCO Portal | ✅ (Shared Responsibility) | ✅ (Entra ID, MFA) | ✅ (RBAC) |
| Accidental Deletion | — | — | ✅ (Locks, RBAC, Policy) |
| Seasonal Spike | ✅ (Elasticity, pay-as-you-go) | ✅ (AZs, SLAs) | — |
| NGO Governance | — | — | ✅ (Mgmt Groups, Policy, Cost) |
| Clinic Records | ✅ (Shared Responsibility) | ✅ (Regions, Redundancy) | — |

---

## Verified Analogies

| Concept | Analogy | Status |
|---------|---------|--------|
| Availability Zones | Bank branches in different towns | ✅ Verified |
| Scalability | Matatu operator adding vehicles at rush hour | ✅ Verified |
| Elasticity | Airtime/data bundle that auto-renews | ✅ Verified |
| Pay-as-you-go | Prepaid airtime | ✅ Verified |
| Shared Responsibility | Renting a house (landlord vs tenant) | ✅ Verified |
| RBAC | Who gets which keys to the office | ✅ Verified |
| Azure Policy | Building code (fire exits for everyone) | ✅ Verified |
| Resource Locks | Padlock on the SACCO vault | ✅ Verified |
| IaaS | Empty plot of land | ✅ Verified |
| PaaS | Ready-to-use market stall | ✅ Verified |
| SaaS | Eating at a restaurant | ✅ Verified |
| Blob Storage | Large warehouse with location codes | ✅ Verified |
| Azure SQL Database | Digital ledger maintained by trusted accountant | ✅ Verified |
| Azure Regions | M-Pesa agents in different counties | ✅ Verified |
| Cost Management | M-Pesa statement + budget planner | ✅ Verified |
| Azure Monitor | Matatu dashboard control panel | ✅ Verified |
| MFA | ATM requiring card + PIN | ✅ Verified |
| App Service | Fully kitted stall in Gikomba market | ✅ Verified |
| Entra ID | Unified government ID card system | ✅ Verified |
| Management Groups | County vs national government layers | ✅ Verified |
| Region Pairs | Sister M-Pesa branches backing each other up | ⚠️ TODO: human review |
| SLA | Safaricom network reliability guarantee | ⚠️ TODO: human review |
| Storage Redundancy | Copies at home vs at parents' house | ⚠️ TODO: human review |

---

## How to Add a New Scenario

1. Write the scenario in the seed file (`apps/api/src/db/seed/index.ts`) using the established structure
2. Assign a stable UUID for `id` (increment the last digit of the existing IDs)
3. Set `status: 'draft'` until all checklist items are complete
4. Mark any uncertain technical facts with `// VERIFY against Microsoft Learn`
5. Mark any unreviewed analogies with `// TODO: human review`
6. Run `npm run db:seed` (idempotent) to upsert the scenario
7. Complete all checklist items
8. Set `status: 'published'` and re-seed

## Things to Never Include

- Real AZ-900 exam questions (even paraphrased to be "similar")
- Microsoft Azure logos or trademarks
- Claims that AzureQuest is official or affiliated with Microsoft
- Technical claims without verification against Microsoft Learn
- Analogies that technically mislead (even if culturally resonant)
