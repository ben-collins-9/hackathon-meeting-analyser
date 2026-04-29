/*
  # Mock dataset — Conversations batch 3 (threads 23–35)
  Covers: multi-region launch, dark mode, onboarding A/B test,
  courier fraud, GraphQL migration, pricing changes, refactoring,
  new employee intro, food ordering bug, security review, load test.
*/

-- ─── Thread 23: Multi-region launch prep (meeting required) ──────────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000023',
  'Paris launch — go/no-go checklist and blockers',
  'general',
  '["Jon Searle", "Emma Wilson", "Henry Jenkins", "David Kim", "Sophia Nguyen", "Benjamin Stewart", "Noah Brooks", "Victoria Myers"]',
  'd56e47f3-5f3b-41b2-89b6-ab7d1bc55663',
  now() - interval '22 days',
  now() - interval '21 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000023', 'Jon Searle',       'Paris launch is in T-14 days. Sharing the go/no-go checklist. Please add your status against each item: ✅ done, 🟡 in progress, 🔴 blocked.', now() - interval '22 days' + interval '9 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000023', 'Henry Jenkins',    'Infra: EU-WEST-3 cluster is provisioned and load tested ✅. CDN config for French assets ✅. GDPR data residency confirmed — all PII stays in EU region ✅.', now() - interval '22 days' + interval '9 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000023', 'David Kim',        'DB: French locale collation configured ✅. Currency set to EUR ✅. Address format handling for French addresses 🟡 — 3 edge cases with CEDEX codes still failing validation.', now() - interval '22 days' + interval '9 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000023', 'Emma Wilson',      'Product: 23 French restaurant partners onboarded ✅. Menu translations reviewed ✅. Scheduled orders feature parity confirmed ✅.', now() - interval '22 days' + interval '9 hours 50 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000023', 'Victoria Myers',   'Customer support: French-speaking support agents hired ✅. Zendesk French locale configured ✅. Escalation paths defined ✅.', now() - interval '22 days' + interval '10 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000023', 'Sophia Nguyen',    'Legal/compliance: GDPR DPA signed ✅. Cookie consent banner — French copy 🟡 still waiting on legal sign-off. Expected today.', now() - interval '22 days' + interval '10 hours 10 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000023', 'Noah Brooks',      'Payments: Stripe France entity configured ✅. French bank payment methods (CB Visa/Mastercard) tested ✅. SEPA direct debit 🔴 — Stripe onboarding for SEPA incomplete, ETA 5 days.', now() - interval '22 days' + interval '10 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000023', 'Benjamin Stewart', 'SEPA being blocked could delay launch — it''s one of the main payment methods in France. Can we launch without it and add it post-launch, or is it a hard requirement?', now() - interval '22 days' + interval '10 hours 30 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000023', 'Jon Searle',       'That SEPA question plus the CEDEX address issue are decisions we can''t make in a thread — they have commercial implications. Let''s do a launch readiness call tomorrow at 9am. All hands on deck please.', now() - interval '22 days' + interval '10 hours 40 minutes');

-- ─── Thread 24: Dark mode implementation (async-resolved) ────────────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000024',
  'Dark mode — implementation approach and token system',
  'general',
  '["Olivia Patel", "Madison Butler", "Liam Foster", "Riley Russell", "Charlotte Bell"]',
  '7c5238c4-08ea-44b6-ba8a-04e3a1f78436',
  now() - interval '20 days',
  now() - interval '19 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000024', 'Olivia Patel',     'Dark mode is finally in the roadmap for next quarter 🎉 Starting the design groundwork now. Question: should we use CSS custom properties (tokens) or a CSS-in-JS theming approach?', now() - interval '20 days' + interval '10 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000024', 'Madison Butler',   'CSS custom properties are the clear winner imo. They''re native, performant, and work without JavaScript for the initial paint. We can set them on :root for light mode and [data-theme="dark"] for dark.', now() - interval '20 days' + interval '10 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000024', 'Liam Foster',      'Agree. Also means we respect prefers-color-scheme automatically without any JS overhead. What''s our token naming convention? --color-surface-primary, --color-text-primary etc?', now() - interval '20 days' + interval '10 hours 40 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000024', 'Olivia Patel',     'I''ve been using the T-shirt sizing approach: --color-bg-1 (lightest background) through --color-bg-6 (darkest). Semantic names like --color-surface-primary make more sense though — harder to misuse.', now() - interval '20 days' + interval '10 hours 55 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000024', 'Riley Russell',    'Strong vote for semantic names. Saves the QA team from guessing what bg-4 means in a dark context 😅', now() - interval '20 days' + interval '11 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000024', 'Charlotte Bell',   'Also consider: should theme preference be persisted to user account or just localStorage? If account-level, logged-in users get their theme on any device.', now() - interval '20 days' + interval '11 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000024', 'Liam Foster',      'Account-level is the right UX but it means a DB column and API endpoint. localStorage is sufficient for v1, we can upgrade later.', now() - interval '20 days' + interval '11 hours 25 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000024', 'Olivia Patel',     'Decisions made: CSS custom properties, semantic token names (--color-surface-primary etc), localStorage for v1, system default on first visit. I''ll produce the full token spec in Figma this week. No meeting needed — thanks everyone! ✅', now() - interval '19 days' + interval '9 hours');

-- ─── Thread 25: Courier fraud detection (meeting required) ───────────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000025',
  'Courier fraud — fake delivery completions in Leeds area',
  'general',
  '["Victoria Myers", "Jon Searle", "Sophia Nguyen", "Benjamin Stewart", "Mason Hayes", "Scarlett Patterson"]',
  'fbd33dc6-1214-42c9-9879-20071216a0ca',
  now() - interval '18 days',
  now() - interval '17 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000025', 'Victoria Myers',   'Customer support has flagged a pattern: 23 orders in the Leeds area over the past week were marked as "delivered" but customers never received them. All were with 3 courier accounts created in the last month. This looks like organised fraud.', now() - interval '18 days' + interval '11 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000025', 'Jon Searle',       'Suspending the 3 accounts immediately pending investigation. @Sophia Nguyen — can you pull all data on these accounts: GPS history, delivery completion locations, device fingerprints?', now() - interval '18 days' + interval '11 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000025', 'Sophia Nguyen',    'Pulling data now. Initial finding: all 3 accounts completed deliveries but GPS shows them never leaving the restaurant. They''re marking orders as delivered from the pickup location. Our system trusted the app ''delivered'' button without a location check.', now() - interval '18 days' + interval '11 hours 40 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000025', 'Mason Hayes',      'That''s a significant system gap. We should require couriers to be within 150m of the delivery address to mark an order as delivered.', now() - interval '18 days' + interval '11 hours 50 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000025', 'Benjamin Stewart', 'Agreed on the fix but the legal and refund implications of 23 affected orders plus any we haven''t caught yet need to be carefully considered. I don''t want to handle this piecemeal.', now() - interval '18 days' + interval '12 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000025', 'Scarlett Patterson','Support have 8 more complaints that match the pattern that came in this morning. The refund requests alone are £380.', now() - interval '18 days' + interval '12 hours 10 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000025', 'Jon Searle',       'This needs immediate cross-functional alignment. I''m setting up an urgent call in 30 mins — fraud response, engineering fix prioritisation, legal implications, and customer comms. Please attend if you''re on this thread.', now() - interval '18 days' + interval '12 hours 15 minutes');

-- ─── Thread 26: Onboarding A/B test results (async-resolved) ─────────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000026',
  'A/B test results: streamlined checkout flow',
  'general',
  '["Emma Wilson", "Sarah Chen", "Penelope Foster", "Olivia Patel", "Carter Simmons"]',
  '900c81a8-8cd2-4a39-85a8-6f903bc97eec',
  now() - interval '16 days',
  now() - interval '15 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000026', 'Emma Wilson',      'A/B test results are in for the streamlined checkout! Variant B (single-page checkout) vs Control (3-step flow): Conversion rate: +14.3% (stat sig at p<0.01). Order completion time: -38 seconds. Cart abandonment: -22%. This is a clear win. 🎉', now() - interval '16 days' + interval '10 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000026', 'Sarah Chen',       'Outstanding results! What was the sample size and test duration?', now() - interval '16 days' + interval '10 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000026', 'Emma Wilson',      '12,400 users over 21 days. Even split 50/50. The improvement held across all device types and user segments — new users showed the biggest gain (+21% conversion).', now() - interval '16 days' + interval '10 hours 25 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000026', 'Olivia Patel',     'From a design perspective — are there any edge cases where the single-page flow is worse? Complex orders with multiple restaurants?', now() - interval '16 days' + interval '10 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000026', 'Carter Simmons',   'The multi-restaurant orders subgroup (about 8% of orders) showed neutral results — neither better nor worse. Single-restaurant orders drove all the improvement.', now() - interval '16 days' + interval '10 hours 45 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000026', 'Penelope Foster',  'Great data. From a marketing angle, the checkout improvement story will be useful for our B2B pitch to restaurant partners — better conversion = more orders for them.', now() - interval '16 days' + interval '10 hours 55 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000026', 'Emma Wilson',      'Decision: rolling Variant B out to 100% of users next sprint. No meeting needed — the data speaks for itself! I''ll update the roadmap and inform restaurant partners. ✅', now() - interval '15 days' + interval '9 hours');

-- ─── Thread 27: GraphQL migration discussion (meeting required) ──────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000027',
  'Should we migrate the customer API from REST to GraphQL?',
  'general',
  '["Liam Foster", "David Kim", "Carter Simmons", "Ethan Price", "Gabriel Long", "Jon Searle", "Benjamin Stewart"]',
  'cf49e12c-9c66-488f-92cc-5ec3ea9d3115',
  now() - interval '14 days',
  now() - interval '13 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000027', 'Liam Foster',      'Raising this for discussion: our mobile clients are significantly over-fetching data. The /orders/recent endpoint returns 47 fields but the app only uses 9. A GraphQL API would solve this elegantly. Thoughts on whether this is worth the migration cost?', now() - interval '14 days' + interval '11 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000027', 'David Kim',        'The over-fetching problem is real and hurts battery life on mobile. But GraphQL brings its own complexity: N+1 query problems, caching is harder, and our backend team would need to learn a new paradigm.', now() - interval '14 days' + interval '11 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000027', 'Carter Simmons',   'Have we considered just adding field selection to our REST API? Something like ?fields=id,status,restaurant.name would solve the over-fetching without a full GraphQL migration.', now() - interval '14 days' + interval '11 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000027', 'Ethan Price',      'Sparse fieldsets are a good middle ground. It''s the JSON:API spec approach. But GraphQL has advantages beyond field selection — nested queries, subscriptions for real-time updates, type safety with generated clients.', now() - interval '14 days' + interval '11 hours 50 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000027', 'Gabriel Long',     'We''d also need to handle auth, rate limiting, and observability differently for GraphQL. Not impossible but it''s not a trivial migration. What''s the estimated impact on mobile performance that justifies the investment?', now() - interval '14 days' + interval '12 hours 5 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000027', 'Benjamin Stewart', 'This is a big architectural decision with implications for the whole platform roadmap. We need proper analysis of the trade-offs, not a thread discussion. Can we do a structured ADR (Architecture Decision Record) session?', now() - interval '14 days' + interval '12 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000027', 'Jon Searle',       'Agreed with Ben. Let''s do a proper RFC process. Liam, can you draft an ADR with the proposal, alternatives, and decision criteria? We''ll then review as a group in a 90-min architecture session. I''ll book next Thursday.', now() - interval '14 days' + interval '12 hours 30 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000027', 'Liam Foster',      'On it. ADR draft will be in the docs repo by Tuesday.', now() - interval '14 days' + interval '12 hours 35 minutes');

-- ─── Thread 28: Delivery fee pricing update (async-resolved) ─────────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000028',
  'Dynamic delivery fee rollout — logic review',
  'general',
  '["Emma Wilson", "Benjamin Stewart", "Carter Simmons", "David Kim", "Sarah Chen"]',
  '900c81a8-8cd2-4a39-85a8-6f903bc97eec',
  now() - interval '12 days',
  now() - interval '11 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000028', 'Emma Wilson',      'Sharing the logic for dynamic delivery fees. Core formula: base_fee + distance_multiplier * km + surge_multiplier (1.0 - 2.5x during peak). Surge kicks in when demand/supply ratio exceeds 1.4. Does this match what engineering is building?', now() - interval '12 days' + interval '10 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000028', 'Carter Simmons',   'Matches the spec we have. One question: what''s the fee cap? We should have a max fee so customers aren''t charged £15 for a £10 order during surge.', now() - interval '12 days' + interval '10 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000028', 'Emma Wilson',      'Good point — cap is £5.99 regardless of surge. I missed that in the spec. Adding now.', now() - interval '12 days' + interval '10 hours 30 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000028', 'Benjamin Stewart', 'We should also show customers the reason for surge pricing — something like "High demand in your area" on the checkout. Transparency reduces negative reactions.', now() - interval '12 days' + interval '10 hours 40 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000028', 'David Kim',        'Do we round fees to 2dp or 5p increments? Psychological pricing — £2.99 feels lower than £3.00.', now() - interval '12 days' + interval '10 hours 50 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000028', 'Sarah Chen',       'Deliveroo rounds to 5p increments, Uber Eats does 2dp. I''d go 5p — simpler for customers to reason about.', now() - interval '12 days' + interval '11 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000028', 'Emma Wilson',      'All good points captured. Updated spec: £5.99 cap, surge reason shown on checkout, 5p rounding. PR can proceed. Thanks team — async discussion worked perfectly here ✅', now() - interval '11 days' + interval '9 hours');

-- ─── Thread 29: Refactoring order-service (async-resolved) ───────────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000029',
  'Order-service refactor — splitting the monolith domain',
  'general',
  '["Ethan Price", "Noah Brooks", "Carter Simmons", "Sophia Nguyen", "Jon Searle"]',
  '83b65b3b-71cb-43d1-9a84-cec7fdb48197',
  now() - interval '11 days',
  now() - interval '10 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000029', 'Ethan Price',      'The order-service is becoming unwieldy — 14,000 lines across 3 files. I want to propose splitting it into: order-lifecycle (status transitions), order-fulfillment (courier assignment, tracking), and order-billing (pricing, refunds). Thoughts?', now() - interval '11 days' + interval '10 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000029', 'Noah Brooks',      'That split makes sense domain-wise. Are these separate microservices or just module boundaries within the same service? I''d lean toward module boundaries first — less operational overhead.', now() - interval '11 days' + interval '10 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000029', 'Carter Simmons',   'Agree — start with internal modules, extract to microservices only if scaling demands it. The strangler fig pattern works well here.', now() - interval '11 days' + interval '10 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000029', 'Sophia Nguyen',    'One thing to be careful of: order-lifecycle and order-billing are tightly coupled around the "paid" state transition. Make sure the module boundary doesn''t create circular dependencies.', now() - interval '11 days' + interval '10 hours 50 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000029', 'Ethan Price',      'Good catch Sophia — I''ll make payment events fire through an internal event bus so billing subscribes to lifecycle events rather than calling directly. Decouples them.', now() - interval '11 days' + interval '11 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000029', 'Jon Searle',       'This is a sensible approach. Start the refactor as internal modules, keep the existing API surface unchanged, and we can extract services later if needed. Green light from me. Create the tracking ticket.', now() - interval '11 days' + interval '11 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000029', 'Ethan Price',      'Ticket PLAT-1298 created. Will start with the order-billing module as it has the clearest boundary. ETA for initial refactor: 2 sprints. ✅', now() - interval '10 days' + interval '9 hours');

-- ─── Thread 30: Shared interest — food tech discussions (social) ──────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000030',
  'Interesting read: ghost kitchens and the future of food delivery',
  'general',
  '["Tom Bennett", "Benjamin Stewart", "Emma Wilson", "Sarah Chen", "Sebastian Cook", "Rory"]',
  '9277a32e-2040-4684-9bd2-29c4a818f498',
  now() - interval '10 days',
  now() - interval '10 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000030', 'Tom Bennett',      'Sharing this FT article on ghost kitchens — the numbers are wild. The average ghost kitchen has 40% lower overheads than a traditional restaurant and 3x the output per square metre. Is this where all our restaurant partners are heading?', now() - interval '10 days' + interval '12 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000030', 'Benjamin Stewart', 'We''re already seeing it — 18% of our new restaurant signups this year were ghost kitchens vs 4% last year. The growth is real. Our onboarding flow needs to handle them differently though — no physical address for customers to visit.', now() - interval '10 days' + interval '12 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000030', 'Emma Wilson',      'That''s interesting from a product standpoint. Should we show "delivery only" badges on ghost kitchen restaurants? Some customers feel uneasy ordering from a restaurant they can''t physically visit.', now() - interval '10 days' + interval '12 hours 25 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000030', 'Sarah Chen',       'The hygiene rating integration we''re building becomes even more important for ghost kitchens — customers can''t do a vibe check on the place before ordering.', now() - interval '10 days' + interval '12 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000030', 'Sebastian Cook',   'The really interesting development is AI-optimised menu pricing for ghost kitchens. Some operators are changing prices hourly based on local demand. We should think about whether our platform can surface that data.', now() - interval '10 days' + interval '12 hours 45 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000030', 'Rory',             'This is making me hungry and I literally work at a food delivery company. 😂', now() - interval '10 days' + interval '12 hours 50 minutes');

-- ─── Thread 31: Load test results before Paris launch (async-resolved) ───────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000031',
  'Paris launch load test results — sign-off needed',
  'general',
  '["Henry Jenkins", "Noah Brooks", "Jon Searle", "Sebastian Cook", "Sophia Nguyen"]',
  'b402ab52-9e67-4fbf-be4e-924f54aecc92',
  now() - interval '9 days',
  now() - interval '8 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000031', 'Henry Jenkins',    'Load test results for Paris launch are in. Simulated 5,000 concurrent users (our projected peak for week 1). Key results: order-service p99: 380ms ✅ (SLA: 500ms). Search p99: 620ms ✅. Payment p99: 1.2s ✅. All within thresholds.', now() - interval '9 days' + interval '11 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000031', 'Noah Brooks',      'HPA triggered correctly at 60% load and new pods were ready in 2m40s — well under our 3m target after the config changes. Infrastructure is looking solid.', now() - interval '9 days' + interval '11 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000031', 'Sebastian Cook',   'One area of concern: the notification-service hit 89% CPU at peak. It didn''t fail but there''s no headroom. I''d recommend scaling that pod horizontally before launch.', now() - interval '9 days' + interval '11 hours 25 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000031', 'Henry Jenkins',    'Good catch. Bumping notification-service min replicas from 2 to 4 now. Easy config change.', now() - interval '9 days' + interval '11 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000031', 'Sophia Nguyen',    'Should we do a follow-up test at 8,000 users? Paris could outperform projections if the initial press coverage is strong.', now() - interval '9 days' + interval '11 hours 45 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000031', 'Henry Jenkins',    'Good idea — running an 8k test now. Will share results this afternoon.', now() - interval '9 days' + interval '11 hours 50 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000031', 'Henry Jenkins',    '8k test results: all services within SLA, notification-service now healthy at 62% CPU with 4 replicas. No further action needed — giving infrastructure the green light for Paris launch 🚀 @Jon Searle signing off here.', now() - interval '8 days' + interval '14 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000031', 'Jon Searle',       'Infrastructure approved ✅ Nice work team.', now() - interval '8 days' + interval '14 hours 10 minutes');

-- ─── Thread 32: Security review — OWASP findings (meeting required) ──────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000032',
  'Security pen test report — 2 high-severity findings',
  'general',
  '["Jon Searle", "Carter Simmons", "David Kim", "Sophia Nguyen", "Noah Brooks", "Henry Jenkins"]',
  'd56e47f3-5f3b-41b2-89b6-ab7d1bc55663',
  now() - interval '7 days',
  now() - interval '6 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000032', 'Jon Searle',       'The external pen test report is in. 2 high severity, 4 medium, 11 low. High severity: (1) IDOR on /api/orders/{id} — authenticated users can access any order by guessing IDs. (2) Missing rate limiting on password reset endpoint allowing brute-force of reset tokens.', now() - interval '7 days' + interval '10 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000032', 'Carter Simmons',   'The IDOR is serious. We should have been checking order ownership before returning data. How did this pass code review?', now() - interval '7 days' + interval '10 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000032', 'David Kim',        'Looking at the auth middleware — the ownership check was in the write path (POST/PUT) but not the read path (GET). The assumption was "read is harmless" which is obviously wrong. I''ll patch this today.', now() - interval '7 days' + interval '10 hours 25 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000032', 'Sophia Nguyen',    'The password reset rate limiting is a simpler fix — 5 attempts per hour per email, after which we lock for 24h. I can have that in a PR within 2 hours.', now() - interval '7 days' + interval '10 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000032', 'Noah Brooks',      'While we''re fixing these — are there other endpoints that might have the same IDOR pattern? /api/restaurants/{id}, /api/couriers/{id}? We need a systematic audit.', now() - interval '7 days' + interval '10 hours 45 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000032', 'Jon Searle',       'The two immediate fixes can go ahead. But the broader audit of all endpoints — that needs to be coordinated so we don''t miss anything. I want to schedule a security remediation session for the full team. The medium findings need triaging too. Booking for tomorrow 2pm.', now() - interval '7 days' + interval '11 hours');

-- ─── Thread 33: Restaurant partner feedback summary (async-resolved) ─────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000033',
  'Q3 restaurant partner NPS — key themes and actions',
  'general',
  '["Victoria Myers", "Emma Wilson", "Sarah Chen", "Benjamin Stewart", "Penelope Foster"]',
  'fbd33dc6-1214-42c9-9879-20071216a0ca',
  now() - interval '5 days',
  now() - interval '4 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000033', 'Victoria Myers',   'Q3 restaurant NPS results: 47 (up from 38 in Q2 🎉). Key themes from open-text responses: Top positives: "Easy onboarding" (mentioned 34x), "Good order volume" (28x), "Reliable platform" (22x). Top pain points: "Commission feels high" (41x), "Menu update process slow" (29x), "Analytics lacking" (25x).', now() - interval '5 days' + interval '10 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000033', 'Emma Wilson',      'The analytics feedback is timely — we''re building that this sprint. Good to have the validation. Can we highlight this to the engineering team as motivation?', now() - interval '5 days' + interval '10 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000033', 'Sarah Chen',       'The menu update process feedback aligns with the bulk API endpoint we''re building. The PLAT-1203 ticket directly addresses this. Should be resolved next sprint.', now() - interval '5 days' + interval '10 hours 30 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000033', 'Benjamin Stewart', 'Commission is a commercial conversation we can''t solve technically. But showing restaurants more value through the analytics dashboard might shift the perception.', now() - interval '5 days' + interval '10 hours 40 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000033', 'Penelope Foster',  'From marketing: we should be creating case studies around the most successful restaurant partners. "Restaurant X increased orders by 40% using our platform" kind of content. Could turn NPS detractors into promoters.', now() - interval '5 days' + interval '10 hours 50 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000033', 'Victoria Myers',   'Excellent inputs. Actions: (1) analytics dashboard — in sprint ✅, (2) bulk menu API — in sprint ✅, (3) case study programme — Penelope to lead, (4) commission review — flagging to leadership for Q4 commercial review. Thanks everyone — clear direction without a meeting needed ✅', now() - interval '4 days' + interval '9 hours');

-- ─── Thread 34: On-call rota coordination (async-resolved) ───────────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000034',
  'On-call rota Q4 — who''s covering what',
  'general',
  '["Noah Brooks", "Ethan Price", "Carter Simmons", "Sophia Nguyen", "Henry Jenkins", "Sebastian Cook"]',
  '791fb4de-cd00-4a71-bca6-acf0dfdf97d2',
  now() - interval '3 days',
  now() - interval '3 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000034', 'Noah Brooks',      'Q4 on-call rota needs filling. We have 13 weeks to cover. PagerDuty schedule is set up — just needs names. Who can take which weeks? I''ll go first: happy to take weeks 1 and 7.', now() - interval '3 days' + interval '14 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000034', 'Ethan Price',      'I can do weeks 2 and 9. Away on holiday weeks 11-12 so please can someone cover those.', now() - interval '3 days' + interval '14 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000034', 'Carter Simmons',   'Weeks 3 and 11. Happy to cover for Ethan''s holiday.', now() - interval '3 days' + interval '14 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000034', 'Sophia Nguyen',    'Weeks 4 and 10. Can someone cover week 6? I have a conference that week.', now() - interval '3 days' + interval '14 hours 25 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000034', 'Henry Jenkins',    'I can do weeks 5 and 6 (covering for Sophia). Also week 13 to close out the year.', now() - interval '3 days' + interval '14 hours 30 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000034', 'Sebastian Cook',   'That leaves weeks 8 and 12 — I''ll take both. Thanks for covering my gaps everyone 🙏', now() - interval '3 days' + interval '14 hours 40 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000034', 'Noah Brooks',      'Rota sorted ✅ Updating PagerDuty now. Everyone should get a confirmation email shortly. Reminder: on-call briefing doc is in Notion under Engineering/Operations.', now() - interval '3 days' + interval '15 hours');

-- ─── Thread 35: Quick question — Stripe webhook signature (async-resolved) ───
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000035',
  'Quick Q: Stripe webhook signature validation failing in staging',
  'general',
  '["Mason Hayes", "Ethan Price", "Carter Simmons"]',
  'ed47c2b5-bd54-4c4c-b2ae-8c565de39b5a',
  now() - interval '2 days',
  now() - interval '2 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000035', 'Mason Hayes',      'Getting 400s on Stripe webhook events in staging. Error: "No signatures found matching the expected signature for payload". The webhook secret is definitely set in the env vars. Any ideas?', now() - interval '2 days' + interval '11 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000035', 'Ethan Price',      'Classic issue — are you parsing the raw request body before passing it to stripe.webhooks.constructEvent()? If you call JSON.parse() on the body first, the signature check fails because the payload has been mutated.', now() - interval '2 days' + interval '11 hours 12 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000035', 'Mason Hayes',      'Oh my god. That''s exactly it — I added express.json() middleware globally and it''s parsing the body before the webhook route gets it. Need to use express.raw() for the webhook endpoint specifically.', now() - interval '2 days' + interval '11 hours 18 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000035', 'Carter Simmons',   'Yep! The fix: app.post(''/webhooks/stripe'', express.raw({type: ''application/json''}), stripeWebhookHandler). The raw middleware must come before any JSON parsing middleware on that specific route.', now() - interval '2 days' + interval '11 hours 22 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000035', 'Mason Hayes',      'Working now! Thanks both — that would have taken me ages to debug alone 😅 Adding a comment to the code explaining why the raw middleware is needed.', now() - interval '2 days' + interval '11 hours 35 minutes');
