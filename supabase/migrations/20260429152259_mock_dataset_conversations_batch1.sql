/*
  # Mock dataset — Conversations batch 1 (threads 1–10)

  Inserts realistic conversation threads and messages for a 50-person
  food delivery software company (ForkRunner). All message IDs are
  proper UUIDs using gen_random_uuid().
*/

-- ─── Thread 1: Restaurant onboarding API (async-resolved) ───────────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000001',
  'Restaurant onboarding API v2 — design discussion',
  'general',
  '["Sarah Chen", "Liam Foster", "Olivia Patel", "David Kim", "Emma Wilson"]',
  'aafb4e19-3295-460a-9e70-5487d21da68e',
  now() - interval '82 days',
  now() - interval '80 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Sarah Chen',    'Hey team 👋 I''ve drafted the v2 spec for the restaurant onboarding API. Main change is moving from a 5-step wizard to a single POST /restaurants endpoint with nested objects. Thoughts?', now() - interval '82 days' + interval '9 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Liam Foster',   'Interesting. What''s the reasoning for collapsing the wizard? The stepwise flow gave us nice partial-save semantics.', now() - interval '82 days' + interval '9 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Sarah Chen',    'Drop-off rate on step 3 (menu upload) was 34% last quarter. Restaurants kept abandoning because they had to have their full menu ready before submitting contact details. With the new design, menu is optional on creation.', now() - interval '82 days' + interval '9 hours 32 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Olivia Patel',  'Makes sense from UX. From the backend side — are we handling idempotency keys? Restaurant ops sometimes retries on timeout and we''ve had duplicate entries in staging.', now() - interval '82 days' + interval '10 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'David Kim',     'Yes, planning to add X-Idempotency-Key header. I''ll also add a unique constraint on (legal_name, vat_number) to catch dupes at the DB level.', now() - interval '82 days' + interval '10 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Emma Wilson',   'Product loves this direction. One ask: can we expose a PATCH /restaurants/{id}/menu as a separate endpoint so restaurants can update menus without re-POSTing everything? Avoids accidental overwrites.', now() - interval '82 days' + interval '11 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'David Kim',     'Absolutely, that was already in the plan. PATCH for menu, hours, and contact details will be separate endpoints. Full replace only on explicit PUT.', now() - interval '82 days' + interval '11 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000001', 'Sarah Chen',    'Great alignment! I''ll update the spec and share the OpenAPI doc in the #api-specs channel. No sync needed — we''ve covered the main decisions here. 🎉', now() - interval '81 days' + interval '9 hours');

-- ─── Thread 2: Payment gateway timeout bug (meeting required) ────────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000002',
  'P0: Payment gateway timeouts hitting 8% of checkouts',
  'general',
  '["Jon Searle", "Ethan Price", "Noah Brooks", "Sophia Nguyen", "Mason Hayes", "Carter Simmons"]',
  'd56e47f3-5f3b-41b2-89b6-ab7d1bc55663',
  now() - interval '71 days',
  now() - interval '70 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Jon Searle',      '🚨 Sev-1 alert: payment timeouts spiked to 8% at 14:32 UTC. Stripe dashboard shows p99 latency at 12s. Our SLA is 3s. Investigating now.', now() - interval '71 days' + interval '14 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Ethan Price',     'Pulling APM traces. Initial look — it''s not Stripe-side. Our internal payment-service is queuing requests. Queue depth is 2,400 and growing.', now() - interval '71 days' + interval '14 hours 48 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Noah Brooks',     'Checked infra — payment-service pods are at 95% CPU. Looks like a memory leak introduced in yesterday''s deploy. Heap dumps incoming.', now() - interval '71 days' + interval '15 hours 2 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Sophia Nguyen',   'Can we roll back yesterday''s release while we investigate? v2.14.1 → v2.14.0?', now() - interval '71 days' + interval '15 hours 8 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Jon Searle',      'Rolling back now. @Mason Hayes — please put up a maintenance banner on checkout just in case.', now() - interval '71 days' + interval '15 hours 12 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Mason Hayes',     'Banner is live. Wording: "We''re experiencing brief delays with payments. Your order is safe — please wait a moment before retrying."', now() - interval '71 days' + interval '15 hours 18 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Ethan Price',     'Rollback complete. Queue clearing — down to 400. Timeout rate back to 0.3%. 🙏', now() - interval '71 days' + interval '15 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Carter Simmons',  'Found the leak in the heap dump — a connection pool in the new Stripe webhook handler was never being released. The PR added an async iterator but never called .destroy() in the finally block.', now() - interval '71 days' + interval '16 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Jon Searle',      'Good find. We need a blameless post-mortem on this one + review of our connection pool patterns. Let''s schedule a 1h session tomorrow — too many architectural questions to resolve async. I''ll send a calendar invite.', now() - interval '71 days' + interval '16 hours 45 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000002', 'Noah Brooks',     'Agreed. I''ll prep the timeline and contributing factors doc before the meeting.', now() - interval '71 days' + interval '16 hours 52 minutes');

-- ─── Thread 3: Delivery tracking real-time updates (async-resolved) ──────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000003',
  'Real-time delivery tracking — WebSocket vs SSE decision',
  'general',
  '["Liam Foster", "Gabriel Long", "Isabella Reed", "Tom Bennett", "Rory"]',
  'cf49e12c-9c66-488f-92cc-5ec3ea9d3115',
  now() - interval '68 days',
  now() - interval '67 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Liam Foster',    'Quick question for the group: for the live courier tracking on the customer app, should we go WebSocket or SSE? I''ve been going back and forth.', now() - interval '68 days' + interval '10 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Gabriel Long',   'SSE is simpler — it''s one-directional (server→client) which is all we need for tracking. Auto-reconnect is built in. WebSocket is overkill unless customers need to send data back.', now() - interval '68 days' + interval '10 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Isabella Reed',  'Agree with Gabriel. Also SSE works over HTTP/2 multiplexing so it won''t eat up connections on mobile networks. Important for delivery tracking which is inherently low-bandwidth.', now() - interval '68 days' + interval '10 hours 45 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Tom Bennett',    'One thing: iOS Safari had SSE issues until iOS 16. What''s our min iOS target?', now() - interval '68 days' + interval '11 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Rory',           'Min iOS is 16.1 per our app store listing. So we''re fine!', now() - interval '68 days' + interval '11 hours 8 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Liam Foster',    'Perfect. SSE it is. I''ll implement the /orders/{id}/track endpoint. Will use Redis pub/sub on the backend to fan out courier location events. Should have a PoC by Friday.', now() - interval '68 days' + interval '11 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Gabriel Long',   'Nice. Make sure you include a "last event ID" mechanism so clients can catch up after a reconnect without losing position updates.', now() - interval '68 days' + interval '11 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000003', 'Liam Foster',    'Already planned 👌 PoC is up in the tracking-sse-poc repo — ping me if you want a walkthrough.', now() - interval '67 days' + interval '15 hours');

-- ─── Thread 4: Sprint 41 planning (meeting required) ─────────────────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000004',
  'Sprint 41 planning — capacity and priorities',
  'general',
  '["Emma Wilson", "Sarah Chen", "Liam Foster", "Ethan Price", "Olivia Patel", "Benjamin Stewart", "Charlotte Bell", "Logan Rivera"]',
  '900c81a8-8cd2-4a39-85a8-6f903bc97eec',
  now() - interval '63 days',
  now() - interval '62 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Emma Wilson',     'Sprint 41 planning thread! We have 3 big tickets competing for priority: (1) scheduled orders feature, (2) courier app offline mode, (3) restaurant analytics dashboard. We have roughly 60 story points of capacity.', now() - interval '63 days' + interval '9 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Sarah Chen',      'Scheduled orders is our Q3 OKR and customers have been asking for months. I''d push hard for that one.', now() - interval '63 days' + interval '9 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Ethan Price',     'Offline mode for couriers is a safety thing — we''ve had complaints about the app crashing in tunnels during peak hours. That one feels urgent.', now() - interval '63 days' + interval '9 hours 28 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Benjamin Stewart','Analytics dashboard was promised to our top 20 restaurant partners by end of month. There might be contractual implications if we slip.', now() - interval '63 days' + interval '9 hours 40 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Charlotte Bell',  'Estimated points: scheduled orders = 34pts, offline mode = 28pts, analytics = 21pts. Total = 83pts. We can''t do all three at full fidelity.', now() - interval '63 days' + interval '10 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Logan Rivera',    'Could we ship a v1 of analytics (just revenue + order count) in 8pts and defer the full dashboard to S42?', now() - interval '63 days' + interval '10 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Benjamin Stewart','That might satisfy the contract — the promise was "basic analytics visibility". Let me check the partner agreements and come back.', now() - interval '63 days' + interval '10 hours 22 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000004', 'Emma Wilson',     'We''re going in circles and there are dependency questions I can''t answer in text. Let''s do a 90-min planning session tomorrow morning — I''ll send invites. Come prepared with estimates updated in Jira.', now() - interval '63 days' + interval '11 hours');

-- ─── Thread 5: DB schema for scheduled orders (async-resolved) ───────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000005',
  'DB schema for scheduled orders feature',
  'general',
  '["David Kim", "Carter Simmons", "Noah Brooks", "Sarah Chen", "Sophia Nguyen"]',
  'fcef9714-1287-4521-a70b-6a756762c61f',
  now() - interval '60 days',
  now() - interval '59 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'David Kim',       'Sharing the proposed schema for scheduled orders. Core addition is a scheduled_orders table with order_id FK, scheduled_for TIMESTAMPTZ, window_minutes INT, status ENUM. Thoughts?', now() - interval '60 days' + interval '10 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'Carter Simmons',  'Should scheduled_for be stored in UTC and converted at display time? Want to make sure we don''t have timezone drama like the birthday-discount bug last year 😅', now() - interval '60 days' + interval '10 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'David Kim',       'Yes, always UTC in the DB. The API layer will accept ISO 8601 with tz offset and normalise to UTC before persisting.', now() - interval '60 days' + interval '10 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'Noah Brooks',     'What''s the indexing strategy? If we''re polling for "orders due in the next 15 minutes" we''ll need a partial index on scheduled_for WHERE status = pending.', now() - interval '60 days' + interval '11 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'David Kim',       'Good call. Adding: CREATE INDEX idx_scheduled_orders_pending ON scheduled_orders (scheduled_for) WHERE status = ''pending'';', now() - interval '60 days' + interval '11 hours 10 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'Sarah Chen',      'Can we also add a restaurant_id column? Product wants restaurants to see their upcoming scheduled orders in the dashboard without joining through the orders table.', now() - interval '60 days' + interval '11 hours 25 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'Sophia Nguyen',   'Agreed — denormalising restaurant_id here is worth it given the query pattern.', now() - interval '60 days' + interval '11 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000005', 'David Kim',       'All feedback incorporated. Migration is in PR #847. Adding composite index on (restaurant_id, scheduled_for) too. Thanks everyone — no meeting needed, this thread covered it all 👍', now() - interval '59 days' + interval '9 hours');

-- ─── Thread 6: Courier app onboarding UX (async-resolved) ────────────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000006',
  'Courier app onboarding UX review — Figma v3',
  'general',
  '["Olivia Patel", "Madison Butler", "Emma Wilson", "Riley Russell", "Avery Sanders"]',
  '7c5238c4-08ea-44b6-ba8a-04e3a1f78436',
  now() - interval '57 days',
  now() - interval '56 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Olivia Patel',   'Dropping the Figma link for courier app onboarding v3. Main change is replacing the 6-screen document upload flow with a single-screen camera capture. Keen to get design + product eyes on it.', now() - interval '57 days' + interval '14 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Madison Butler', 'Love the simplification! One concern: the camera permission request comes before we''ve explained WHY we need it. GDPR and user trust best practices say we should prime users before the system prompt.', now() - interval '57 days' + interval '14 hours 30 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Olivia Patel',   'Totally valid. I''ll add an explainer screen before the permission request — something like "We need camera access to verify your documents. Your photos are only used for background checks."', now() - interval '57 days' + interval '14 hours 45 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Emma Wilson',    'The progress indicator on screen 2 says "Step 2 of 4" but with the new flow there are only 3 screens. Copy needs updating.', now() - interval '57 days' + interval '15 hours 10 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Riley Russell',  'Also the CTA button on the final screen says "Submit Documents" but it should say "Submit Application" since couriers submit more than just docs at that point.', now() - interval '57 days' + interval '15 hours 25 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Avery Sanders',  'From a QA angle: are we testing with actual camera hardware or mocked? The previous version had issues with HEIC files on older iPhones.', now() - interval '57 days' + interval '15 hours 40 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000006', 'Olivia Patel',   'Great catches all. Updated Figma with: permission primer screen, fixed step count, updated CTA. Will test on real devices including iPhone 12 for HEIC. Sharing v3.1 in #design-reviews shortly. ✅', now() - interval '56 days' + interval '10 hours');

-- ─── Thread 7: Welcome new team member (social) ───────────────────────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000007',
  'Welcome Victoria to the team!',
  'general',
  '["Jon Searle", "Emma Wilson", "Sarah Chen", "Liam Foster", "Victoria Myers", "Tom Bennett", "Ethan Price", "Noah Brooks"]',
  'd56e47f3-5f3b-41b2-89b6-ab7d1bc55663',
  now() - interval '54 days',
  now() - interval '54 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Jon Searle',      'Everyone — please welcome Victoria Myers who''s joining us today as our new Head of Customer Success! Victoria brings 8 years of SaaS experience and a passion for food tech 🙌', now() - interval '54 days' + interval '9 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Emma Wilson',     'Welcome Victoria!! So excited to have you on board 🎉', now() - interval '54 days' + interval '9 hours 5 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Sarah Chen',      'Welcome! Looking forward to getting the customer feedback loop tighter with you involved 👏', now() - interval '54 days' + interval '9 hours 8 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Victoria Myers',  'Thanks everyone!! Super excited to be here. Already loving the energy. Looking forward to meeting you all properly. Also — who''s the office pizza expert? Asking for important reasons 🍕', now() - interval '54 days' + interval '9 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Tom Bennett',     'That would be me 🙋 I take pizza extremely seriously. We need to talk.', now() - interval '54 days' + interval '9 hours 18 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Ethan Price',     'Welcome Victoria! Fair warning: Tom''s pizza opinions are... strongly held 😂', now() - interval '54 days' + interval '9 hours 22 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Noah Brooks',     'Welcome!! If you need anything for your dev environment setup feel free to ping me directly 🤙', now() - interval '54 days' + interval '9 hours 30 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000007', 'Liam Foster',     'Welcome aboard! Fair warning on the codebase — it''s mostly well-documented. Mostly. 😅', now() - interval '54 days' + interval '9 hours 35 minutes');

-- ─── Thread 8: API rate limiting strategy (async-resolved) ───────────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000008',
  'API rate limiting — restaurant portal hitting 429s',
  'general',
  '["Carter Simmons", "David Kim", "Logan Rivera", "Ethan Price", "Henry Jenkins"]',
  '0ce0d1ec-0d4c-469b-8a84-95b53a4320ec',
  now() - interval '51 days',
  now() - interval '50 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Carter Simmons',  'Getting reports from restaurant partners that the portal is throwing 429s during their morning menu updates. They batch-update ~200 items at 8am. Our rate limit is 100 req/min per API key.', now() - interval '51 days' + interval '11 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'David Kim',       'Options: (1) raise the per-key limit to 500/min, (2) add a bulk /menu/items endpoint that accepts an array, (3) tiered limits for verified partners. Thoughts?', now() - interval '51 days' + interval '11 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Logan Rivera',    'Option 1 is a quick fix but doesn''t solve the underlying problem. Option 2 is the right long-term answer.', now() - interval '51 days' + interval '11 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Ethan Price',     'Agreed on option 2. A bulk endpoint also lets us validate the whole batch transactionally — either all items update or none. Much better semantics.', now() - interval '51 days' + interval '11 hours 50 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Henry Jenkins',   'From an infra standpoint, a bulk endpoint is much friendlier on our DB connection pool too. One connection for 200 updates vs 200 connections.', now() - interval '51 days' + interval '12 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'Carter Simmons',  'Short term fix: I''ll raise affected partners'' limits to 500/min as a manual override. Should buy us 2 weeks.', now() - interval '51 days' + interval '12 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000008', 'David Kim',       'Done — I''ve opened ticket PLAT-1203 for the bulk endpoint. ETA: end of sprint. No meeting needed, we''re aligned ✅', now() - interval '50 days' + interval '9 hours');

-- ─── Thread 9: Team lunch coordination (social) ───────────────────────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000009',
  'Team lunch — where are we going this Friday?',
  'general',
  '["Tom Bennett", "Riley Russell", "Mia Collins", "Owen Hughes", "Avery Sanders", "Charlotte Bell", "Logan Rivera", "Ben"]',
  '9277a32e-2040-4684-9bd2-29c4a818f498',
  now() - interval '49 days',
  now() - interval '48 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000009', 'Tom Bennett',     'Friday lunch crew — where are we going? Votes please! I''m nominating the new Thai place on Shoreditch High St 🍜', now() - interval '49 days' + interval '10 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000009', 'Riley Russell',   'Seconded! That place looks amazing. Also accepting the Italian on Curtain Road as a backup option 🍝', now() - interval '49 days' + interval '10 hours 12 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000009', 'Mia Collins',     'Thai works for me! Does anyone know if they have vegetarian options? 🌱', now() - interval '49 days' + interval '10 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000009', 'Owen Hughes',     'Just checked — they have a whole veggie section. The tofu pad thai gets great reviews.', now() - interval '49 days' + interval '10 hours 25 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000009', 'Avery Sanders',   'Thai it is! What time? 12:30 or 1pm?', now() - interval '49 days' + interval '10 hours 30 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000009', 'Charlotte Bell',  '12:30 please — I have a 2:30 call I can''t push 🙏', now() - interval '49 days' + interval '10 hours 32 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000009', 'Logan Rivera',    '12:30 works. Shall I book? They''re often busy on Fridays.', now() - interval '49 days' + interval '10 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000009', 'Tom Bennett',     'Please do! Party of 8. Tell them we work for a food delivery company — maybe we''ll get VIP treatment 😂', now() - interval '49 days' + interval '10 hours 38 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000009', 'Logan Rivera',    'Booked! Sabai Thai, Friday 12:30, table for 8. See you all there 🎉', now() - interval '49 days' + interval '11 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000009', 'Ben',             'Can I crash this? I promise not to talk about work 😄', now() - interval '49 days' + interval '11 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000009', 'Tom Bennett',     'The more the merrier! I''ll let the restaurant know it''s 9 now.', now() - interval '49 days' + interval '11 hours 20 minutes');

-- ─── Thread 10: CI/CD pipeline flakiness (async-resolved) ────────────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000010',
  'CI pipeline failing intermittently — integration test flakiness',
  'general',
  '["Noah Brooks", "Henry Jenkins", "Sophia Nguyen", "Ethan Price", "Sebastian Cook"]',
  '791fb4de-cd00-4a71-bca6-acf0dfdf97d2',
  now() - interval '47 days',
  now() - interval '46 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000010', 'Noah Brooks',     'The order-service integration tests are failing about 30% of the time on CI but pass locally 100% of the time. Classic flaky test situation. Anyone seen this before?', now() - interval '47 days' + interval '9 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000010', 'Henry Jenkins',   'Almost always a timing issue when it''s local-vs-CI. What''s the test doing — any sleeps or time-dependent assertions?', now() - interval '47 days' + interval '9 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000010', 'Sophia Nguyen',   'I''ve seen this. CI containers are slower and the test is probably assuming a DB write completes in under 100ms when sometimes it takes 300ms+.', now() - interval '47 days' + interval '9 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000010', 'Noah Brooks',     'Found it — await sleep(100) before asserting the order status in test line 847. Rookie move from 6 months ago 😬 Replacing with a proper polling/await pattern.', now() - interval '47 days' + interval '10 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000010', 'Ethan Price',     'While you''re in there — I''d use a test helper like waitForExpect() from the npm package. Retries assertion up to N times with backoff. Way more robust than manual polling.', now() - interval '47 days' + interval '10 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000010', 'Sebastian Cook',  'Also check if the test DB is shared between test runs. If parallel CI jobs share the same DB you can get state contamination. Each job should spin its own schema.', now() - interval '47 days' + interval '10 hours 30 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000010', 'Noah Brooks',     'Both issues confirmed and fixed in PR #861. Used waitForExpect, isolated test DB per job. CI is now 100% green over last 20 runs. Closing this one ✅', now() - interval '46 days' + interval '14 hours');
