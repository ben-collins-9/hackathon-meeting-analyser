/*
  # Mock dataset — Conversations batch 2 (threads 11–22)
  Threads cover: customer escalations, code reviews, architecture,
  Kubernetes scaling, marketing, performance, retro, social events.
*/

-- ─── Thread 11: Customer escalation — order tracking broken (meeting required)
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000011',
  'Customer escalation: tracking page showing wrong courier location',
  'general',
  '["Victoria Myers", "Jon Searle", "Liam Foster", "Sophia Nguyen", "Scarlett Patterson"]',
  'fbd33dc6-1214-42c9-9879-20071216a0ca',
  now() - interval '45 days',
  now() - interval '44 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000011', 'Victoria Myers',   'Urgent escalation from our top restaurant partner, Pasta Palace. Their customers are seeing the courier stuck at the restaurant even when the food has been picked up. We have 4 active complaints and it''s been going on since yesterday.', now() - interval '45 days' + interval '10 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000011', 'Jon Searle',       'On it. @Liam Foster — is this related to the SSE implementation that went out Tuesday?', now() - interval '45 days' + interval '10 hours 10 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000011', 'Liam Foster',      'Checking now. The SSE stream looks healthy. The location events are being published to Redis... wait. I see the issue. The courier app is sending location updates but the event key includes the OLD order ID before reassignment. The customer''s stream is subscribed to the new order ID.', now() - interval '45 days' + interval '10 hours 28 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000011', 'Sophia Nguyen',    'So when an order gets reassigned to a different courier, the tracking breaks?', now() - interval '45 days' + interval '10 hours 32 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000011', 'Liam Foster',      'Exactly. Order reassignment was added 3 weeks ago and this edge case wasn''t caught. Hot fix is a 10-min job but we need to discuss whether we bridge the old/new IDs in Redis or fix it in the courier app. There are trade-offs either way that I can''t make alone.', now() - interval '45 days' + interval '10 hours 40 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000011', 'Victoria Myers',   'Can we get a quick 30 min call? I want to understand the scope before I go back to Pasta Palace with an ETA.', now() - interval '45 days' + interval '10 hours 45 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000011', 'Jon Searle',       'Agree — let''s do a call now. I''m inviting Liam, Sophia, and Victoria. Scarlett can you join to take notes for the incident report?', now() - interval '45 days' + interval '10 hours 47 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000011', 'Scarlett Patterson','On the call in 2 mins 🙋', now() - interval '45 days' + interval '10 hours 49 minutes');

-- ─── Thread 12: Code review — payment retry logic (async-resolved) ───────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000012',
  'PR review: payment retry logic with exponential backoff',
  'general',
  '["Ethan Price", "Carter Simmons", "Jon Searle", "Sophia Nguyen"]',
  '83b65b3b-71cb-43d1-9a84-cec7fdb48197',
  now() - interval '43 days',
  now() - interval '42 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000012', 'Ethan Price',      'PR #889 is up for review: adds exponential backoff + jitter to failed payment retries. Previously we were doing 3 instant retries which was hammering Stripe during outages. Now we do max 4 retries with 2^n + random jitter seconds between each.', now() - interval '43 days' + interval '11 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000012', 'Carter Simmons',   'Good change. One question on line 87 — why are we catching Error broadly instead of specifically catching StripeCardError vs StripeNetworkError? The retry logic should only apply to transient failures, not card declines.', now() - interval '43 days' + interval '11 hours 30 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000012', 'Ethan Price',      'Great point, that''s a genuine bug. Card declines should fail immediately — retrying a declined card is pointless and confusing. Fixing now.', now() - interval '43 days' + interval '11 hours 45 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000012', 'Jon Searle',       'Also: are we persisting the retry count per payment attempt? If the service restarts mid-retry we''d start from scratch which could cause a customer to be retried 8 times total instead of 4.', now() - interval '43 days' + interval '12 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000012', 'Ethan Price',      'Not currently — good catch. I''ll add a retry_count column to the payment_attempts table so we can resume correctly after a restart.', now() - interval '43 days' + interval '12 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000012', 'Sophia Nguyen',    'Minor nit: the constant MAX_RETRIES = 4 should probably live in config rather than be hardcoded in the service. Different environments might want different values.', now() - interval '43 days' + interval '12 hours 30 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000012', 'Ethan Price',      'Updated PR with all feedback: specific error handling, persistent retry count, configurable MAX_RETRIES. Thanks for the thorough review — all addressed without a meeting needed 👍', now() - interval '42 days' + interval '10 hours');

-- ─── Thread 13: Kubernetes HPA scaling issues (meeting required) ─────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000013',
  'K8s HPA not scaling fast enough during lunch rush',
  'general',
  '["Henry Jenkins", "Noah Brooks", "Jon Searle", "Sebastian Cook", "Sophia Nguyen"]',
  'b402ab52-9e67-4fbf-be4e-924f54aecc92',
  now() - interval '41 days',
  now() - interval '40 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000013', 'Henry Jenkins',    'Yesterday''s 12:30 lunch rush caused a 40-second latency spike on the order-service. HPA kicked in but the new pods weren''t ready until 8 minutes after load started. Our scale-up time needs to be under 3 minutes.', now() - interval '41 days' + interval '9 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000013', 'Noah Brooks',      'The issue is our HPA is based on CPU which is a lagging indicator. By the time CPU spikes, we''re already in trouble. We should consider scaling on request queue depth instead.', now() - interval '41 days' + interval '9 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000013', 'Sebastian Cook',   'We could also pre-scale 15 minutes before known peak times. We know lunch rush is 12:00-13:30 every day. A scheduled scale-up at 11:45 would help a lot.', now() - interval '41 days' + interval '9 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000013', 'Jon Searle',       'Pre-scaling makes sense for predictable peaks but we still need reactive scaling for unexpected spikes. What about KEDA for event-driven autoscaling?', now() - interval '41 days' + interval '9 hours 50 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000013', 'Henry Jenkins',    'KEDA is interesting but it''s a significant infrastructure change. The startup probe settings might also be part of the problem — our pods take 90s to report ready even when they''re healthy.', now() - interval '41 days' + interval '10 hours 5 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000013', 'Sophia Nguyen',    'This has a lot of moving parts. Can we get 45 mins together to whiteboard the options? I don''t want to make infra changes of this magnitude without everyone aligned.', now() - interval '41 days' + interval '10 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000013', 'Henry Jenkins',    'Agreed — let''s book it. I''ll pull the metrics from yesterday''s incident to present at the session. @Jon Searle can you send the invite?', now() - interval '41 days' + interval '10 hours 25 minutes');

-- ─── Thread 14: Marketing — summer campaign asset review (async-resolved) ────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000014',
  'Summer campaign — app store screenshots review',
  'general',
  '["Penelope Foster", "Madison Butler", "Olivia Patel", "Emma Wilson", "Scarlett Patterson"]',
  '02da89b6-e2f3-482a-93b7-023f91c80a0e',
  now() - interval '39 days',
  now() - interval '38 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000014', 'Penelope Foster',  'Sharing the new App Store screenshots for the summer campaign. We''re refreshing all 8 screens to showcase the new tracking UI and scheduled orders. Feedback needed by Thursday for the submission deadline.', now() - interval '39 days' + interval '14 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000014', 'Madison Butler',   'Love the vibe! Screen 3 (the map view) looks amazing. One thing — the font on the delivery ETA overlay is too small on the 6.7" screenshots. It''ll be illegible on the App Store preview.', now() - interval '39 days' + interval '14 hours 30 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000014', 'Olivia Patel',     'Screen 6 shows the old bottom navigation bar that we replaced in v3.1. Can you update that one to the new tab bar design?', now() - interval '39 days' + interval '14 hours 45 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000014', 'Emma Wilson',      'The headline copy on screen 1 says "Order in seconds" — given our avg checkout time is 2 minutes, this might attract complaints. Can we say "Order in a flash" or similar instead?', now() - interval '39 days' + interval '15 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000014', 'Scarlett Patterson','From a customer side: the restaurant photos on screen 2 are stock photos. Customers sometimes call out fake imagery in reviews. Can we use real partner restaurant photos instead?', now() - interval '39 days' + interval '15 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000014', 'Penelope Foster',  'All great points. Updating: larger ETA font, new nav bar, headline tweak, and I''ll ping our restaurant partners for photo permissions. Will have v2 ready by Wednesday. Thanks! 🙏', now() - interval '38 days' + interval '9 hours');

-- ─── Thread 15: Sprint 40 retrospective (async-resolved) ─────────────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000015',
  'Sprint 40 retrospective — wins, learnings, actions',
  'general',
  '["Emma Wilson", "Liam Foster", "Ethan Price", "David Kim", "Olivia Patel", "Noah Brooks", "Charlotte Bell"]',
  '900c81a8-8cd2-4a39-85a8-6f903bc97eec',
  now() - interval '37 days',
  now() - interval '36 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000015', 'Emma Wilson',      'Sprint 40 retro thread! Drop your wins 🟢, what didn''t go well 🔴, and suggestions 💡 below. I''ll collate into action items.', now() - interval '37 days' + interval '9 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000015', 'Liam Foster',      '🟢 Shipping the SSE tracking PoC was satisfying — great team support. 🔴 The order reassignment edge case should have been caught in code review. 💡 Add order-reassignment test scenarios to our integration test suite.', now() - interval '37 days' + interval '9 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000015', 'Ethan Price',      '🟢 Payment retry PR feedback was excellent — async code review worked perfectly. 🔴 We overcommitted again. 83 points planned vs 60 capacity. 💡 Let''s enforce a buffer of 15% for unknowns every sprint.', now() - interval '37 days' + interval '9 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000015', 'David Kim',        '🟢 DB schema discussion was super efficient in the thread — no meeting needed. Love when that works. 🔴 PR review turnaround was slow mid-sprint, blocking some stories. 💡 Timebox first-review to 24 hours max.', now() - interval '37 days' + interval '9 hours 50 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000015', 'Olivia Patel',     '🟢 Design-dev collaboration felt smoother this sprint. 🔴 Still getting design specs too late — we need Figma finals at least 3 days before development starts. 💡 Add a "design freeze" milestone to sprint planning.', now() - interval '37 days' + interval '10 hours 5 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000015', 'Noah Brooks',      '🟢 Fixed the CI flakiness — builds are 100% reliable now 🎉 🔴 The P0 payment incident highlighted we need more load testing before releases. 💡 Mandatory load test for any payment-path changes.', now() - interval '37 days' + interval '10 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000015', 'Charlotte Bell',   '🟢 Team energy was great this sprint. 🔴 Standup is still running 25+ mins. 💡 Hard 15-min cap, blockers go to async threads.', now() - interval '37 days' + interval '10 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000015', 'Emma Wilson',      'Brilliant retro everyone. Action items logged in Jira: (1) order reassignment tests, (2) 15% sprint buffer, (3) 24h PR review SLA, (4) design freeze milestone, (5) load test gate, (6) 15-min standup cap. See you at planning! ✅', now() - interval '36 days' + interval '9 hours');

-- ─── Thread 16: Search performance — slow restaurant search (meeting required)
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000016',
  'Search latency regression — restaurant search p95 at 4.2s',
  'general',
  '["Carter Simmons", "David Kim", "Noah Brooks", "Henry Jenkins", "Jon Searle", "Logan Rivera"]',
  '0ce0d1ec-0d4c-469b-8a84-95b53a4320ec',
  now() - interval '35 days',
  now() - interval '34 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000016', 'Carter Simmons',   'DataDog flagged a regression in restaurant search: p95 latency jumped from 800ms to 4.2s over the last 48 hours. No deployment in that window. Could be data growth or an index issue.', now() - interval '35 days' + interval '11 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000016', 'David Kim',        'Running EXPLAIN ANALYZE on the search query now. Seeing a sequential scan on the restaurants table — 340k rows. The GiST index on location might not be being used.', now() - interval '35 days' + interval '11 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000016', 'Noah Brooks',      'Could be a stats issue — if the query planner''s row estimates are way off it might choose a seq scan over the index. When did we last run ANALYZE?', now() - interval '35 days' + interval '11 hours 25 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000016', 'David Kim',        'Last ANALYZE was 3 weeks ago. The restaurant count grew 40% this month (new city launch). The planner is working from very stale stats.', now() - interval '35 days' + interval '11 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000016', 'Henry Jenkins',    'Running ANALYZE restaurants now. Will report back.', now() - interval '35 days' + interval '11 hours 40 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000016', 'Henry Jenkins',    'ANALYZE complete. p95 is back to 750ms 🎉 Query is now using the GiST index properly. Immediate crisis averted.', now() - interval '35 days' + interval '12 hours 5 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000016', 'Jon Searle',       'Great, but we need to prevent this recurring. Autovacuum should be handling this. Something is blocking it. This deserves a proper investigation — can we schedule 45 mins? I want to come out of that with autovacuum tuning changes and monitoring alerts.', now() - interval '35 days' + interval '12 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000016', 'Carter Simmons',   'Agreed — I''ll set up the invite for tomorrow. Come with your autovacuum knowledge 😅', now() - interval '35 days' + interval '12 hours 25 minutes');

-- ─── Thread 17: Google Maps integration — courier routing (async-resolved) ───
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000017',
  'Google Maps Directions API — alternative routing providers',
  'general',
  '["Liam Foster", "Henry Jenkins", "David Kim", "Gabriel Long", "Jon Searle"]',
  'cf49e12c-9c66-488f-92cc-5ec3ea9d3115',
  now() - interval '33 days',
  now() - interval '32 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000017', 'Liam Foster',      'Heads up: our Google Maps bill hit £18k last month, up from £9k the previous month. The new tracking feature tripled our Directions API calls. We need to look at alternatives or caching.', now() - interval '33 days' + interval '10 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000017', 'Henry Jenkins',    'Have we considered HERE Maps or Mapbox? Both have aggressive startup pricing. Mapbox is roughly 30% cheaper at our volume.', now() - interval '33 days' + interval '10 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000017', 'David Kim',        'Before switching providers, are we calling the Directions API every time a courier moves? We only need routing at order assignment, not on every GPS ping. If we''re calling it per-ping that''s a massive waste.', now() - interval '33 days' + interval '10 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000017', 'Gabriel Long',     'Oh. Looking at the tracking-service code... we ARE calling Directions API on every GPS event 😬 That''s a bug, not a feature. We should call it once on assignment and recalculate only when the courier deviates significantly from the route.', now() - interval '33 days' + interval '10 hours 50 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000017', 'Liam Foster',      'Just did the math: if we reduce calls by 90% with the route deviation approach, our bill drops to ~£2k/month. That''s more impactful than switching providers. Let me fix this first.', now() - interval '33 days' + interval '11 hours 5 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000017', 'Jon Searle',       'Please do. A 90% cost reduction is huge. The provider switch can be a separate longer-term decision. Good find.', now() - interval '33 days' + interval '11 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000017', 'Liam Foster',      'Fix is in PR #912. Route recalculation now only triggers when the courier is >200m off the expected path. In staging the API call rate dropped 88%. Async decisions made, no meeting needed ✅', now() - interval '32 days' + interval '15 hours');

-- ─── Thread 18: Office birthday celebration (social) ─────────────────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000018',
  'Noah''s birthday — Friday office surprise!',
  'general',
  '["Emma Wilson", "Charlotte Bell", "Tom Bennett", "Mia Collins", "Riley Russell", "Avery Sanders", "Penelope Foster"]',
  '900c81a8-8cd2-4a39-85a8-6f903bc97eec',
  now() - interval '31 days',
  now() - interval '30 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000018', 'Emma Wilson',      'Hey team 🤫 Noah''s birthday is Friday! He''ll be in the office all day. Can we organise something? Cake at minimum, maybe some balloons?', now() - interval '31 days' + interval '9 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000018', 'Charlotte Bell',   'Yes!! I''ll order the cake from that bakery on Bethnal Green Road — the one that did the incredible custom cake for the product launch. Noah loves chocolate, right?', now() - interval '31 days' + interval '9 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000018', 'Tom Bennett',      'Can confirm Noah is a chocolate enthusiast. Deep chocolate with raspberry is his favourite combo 🎂', now() - interval '31 days' + interval '9 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000018', 'Mia Collins',      'I''ll handle decorations! Balloons and a banner. Any theme ideas? I was thinking something nerdy/tech themed to match the vibe.', now() - interval '31 days' + interval '9 hours 25 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000018', 'Riley Russell',    'We could do a "Happy Deployment Day" theme instead of birthday 😂 Noah would love that.', now() - interval '31 days' + interval '9 hours 28 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000018', 'Emma Wilson',      'Ha! Love it. Shall we do 4pm in the kitchen? Most people should be around by then.', now() - interval '31 days' + interval '9 hours 32 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000018', 'Avery Sanders',    '4pm works. Should we do a card as well? I can pass it around before then.', now() - interval '31 days' + interval '9 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000018', 'Penelope Foster',  'Yes to the card! I''ll get one this lunchtime and bring it in. We can all sign it during standup 😄', now() - interval '31 days' + interval '9 hours 40 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000018', 'Charlotte Bell',   'Cake ordered ✅ Raspberry chocolate ganache. Noah is going to love it 🎉', now() - interval '30 days' + interval '11 hours');

-- ─── Thread 19: Push notification delivery rate (async-resolved) ─────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000019',
  'Push notification delivery rate dropping — investigating FCM issues',
  'general',
  '["Gabriel Long", "Carter Simmons", "Logan Rivera", "Sophia Nguyen", "Mason Hayes"]',
  'ab3c7844-9a2a-40fb-bb09-6a29a5c0b7ff',
  now() - interval '29 days',
  now() - interval '28 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000019', 'Gabriel Long',     'Our push notification delivery rate on Android has dropped from 94% to 78% over the last week. FCM dashboard shows no issues on their end. Something on our side changed.', now() - interval '29 days' + interval '10 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000019', 'Carter Simmons',   'Are we handling FCM token refresh correctly? Tokens expire and if we''re not updating them when the app receives a new one, delivery will fail silently.', now() - interval '29 days' + interval '10 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000019', 'Logan Rivera',     'Looking at the notification-service code... we are handling token refresh, but I see we added a 7-day cache on tokens in last sprint. If the token refreshes but the cache still has the old one, we''d be sending to stale tokens.', now() - interval '29 days' + interval '10 hours 40 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000019', 'Sophia Nguyen',    'That would explain the timing — the 7-day cache means we started seeing failures 7 days after we deployed it. Classic slow-burn bug.', now() - interval '29 days' + interval '10 hours 50 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000019', 'Gabriel Long',     'Fix: invalidate the cache when FCM returns a token refresh error (404 on send). We should also proactively reduce the cache TTL to 24h.', now() - interval '29 days' + interval '11 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000019', 'Mason Hayes',      'Should we also send a re-registration prompt to affected users whose tokens we couldn''t refresh? About 16% of our active users might have stale tokens.', now() - interval '29 days' + interval '11 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000019', 'Gabriel Long',     'Good idea. I''ll add a silent push to trigger token re-registration on affected devices. PR #923 up for review. Delivery rate should recover within 48 hours of this shipping. ✅', now() - interval '28 days' + interval '9 hours');

-- ─── Thread 20: Accessibility audit findings (meeting required) ──────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000020',
  'Accessibility audit results — WCAG 2.1 AA gaps',
  'general',
  '["Olivia Patel", "Madison Butler", "Avery Sanders", "Emma Wilson", "Liam Foster", "Riley Russell"]',
  '7c5238c4-08ea-44b6-ba8a-04e3a1f78436',
  now() - interval '27 days',
  now() - interval '26 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000020', 'Olivia Patel',     'The accessibility audit report is in. We have 3 critical and 8 serious WCAG 2.1 AA violations. Sharing the full report here.', now() - interval '27 days' + interval '9 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000020', 'Madison Butler',   'Critical ones: (1) checkout button has no accessible name — screen readers read it as "button", (2) colour contrast on the grey-on-grey secondary text is 2.8:1, needs 4.5:1, (3) delivery map has no keyboard navigation.', now() - interval '27 days' + interval '9 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000020', 'Avery Sanders',    'I can fix the accessible name issue today — just aria-label additions. The colour contrast will need design updates to the colour system. 8 colours affected.', now() - interval '27 days' + interval '9 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000020', 'Emma Wilson',      'The colour system changes could have knock-on effects across the whole app. That''s not a quick fix — we need to be careful.', now() - interval '27 days' + interval '9 hours 50 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000020', 'Liam Foster',      'Keyboard navigation on the map is a significant engineering effort. I''d estimate 3-4 days to do it properly. Do we have a timeline on when we need to be WCAG compliant?', now() - interval '27 days' + interval '10 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000020', 'Riley Russell',    'From a QA perspective: I can write the accessibility test suite in parallel to the fixes, but I need to understand the priority order first.', now() - interval '27 days' + interval '10 hours 15 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000020', 'Olivia Patel',     'The scope here is bigger than I can coordinate in a thread. Can we get design, engineering, and product in a room for an hour to triage and sequence these? I''ll book something for tomorrow morning.', now() - interval '27 days' + interval '10 hours 25 minutes');

-- ─── Thread 21: Third-party food safety cert integration (async-resolved) ────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000021',
  'Hygiene rating API integration — FSA data feed',
  'general',
  '["David Kim", "Sarah Chen", "Liam Foster", "Gabriel Long", "Benjamin Stewart"]',
  'fcef9714-1287-4521-a70b-6a756762c61f',
  now() - interval '25 days',
  now() - interval '24 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000021', 'David Kim',        'The FSA (Food Standards Agency) has a free public API for hygiene ratings. Product wants us to show ratings on restaurant listings. I''ve looked at the API — it''s REST, decent docs, and the data is updated weekly. Should be straightforward to integrate.', now() - interval '25 days' + interval '10 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000021', 'Sarah Chen',       'How do we match our restaurants to their FSA records? Do we use business name + postcode?', now() - interval '25 days' + interval '10 hours 20 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000021', 'David Kim',        'The FSA API accepts BusinessName + PostCode as search params. Match rate in my test was ~73% on our current restaurant list. Remaining 27% would need manual linking.', now() - interval '25 days' + interval '10 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000021', 'Benjamin Stewart', 'What do we show when we can''t match? A "Not yet rated" badge? We should be careful not to imply something negative about restaurants that just aren''t in the FSA system yet (e.g. new openings).', now() - interval '25 days' + interval '10 hours 50 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000021', 'Liam Foster',      'Agree with Ben. "Awaiting rating" is friendlier than "Not rated". Or we could just hide the badge when no data is available.', now() - interval '25 days' + interval '11 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000021', 'Gabriel Long',     'Hiding it is the safest option. We don''t want unmatched restaurants to look suspicious. Show the badge only when we have confirmed data.', now() - interval '25 days' + interval '11 hours 10 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000021', 'David Kim',        'Agreed. Plan: daily sync job pulls FSA data, fuzzy-matches on name+postcode, stores the hygiene_rating on the restaurants table, badge only shown when rating is confirmed. Opening ticket PLAT-1267. No meeting needed — clear direction! ✅', now() - interval '24 days' + interval '9 hours');

-- ─── Thread 22: Casual — weekend plans & hobby chat (social) ─────────────────
INSERT INTO conversations (id, title, platform, participants, user_id, created_at, updated_at) VALUES (
  'c1000000-0000-0000-0000-000000000022',
  'Weekend plans — anyone doing anything fun?',
  'general',
  '["Tom Bennett", "Riley Russell", "Owen Hughes", "Mia Collins", "Sebastian Cook", "Craig", "Charlotte Bell"]',
  '9277a32e-2040-4684-9bd2-29c4a818f498',
  now() - interval '23 days',
  now() - interval '23 days'
);

INSERT INTO messages (id, conversation_id, author, content, sent_at) VALUES
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000022', 'Tom Bennett',      'Happy Friday everyone 🎉 Anyone doing anything interesting this weekend?', now() - interval '23 days' + interval '16 hours'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000022', 'Riley Russell',    'Going to a ceramics class on Saturday! First time ever. Expecting to make something vaguely bowl-shaped and call it art 🏺', now() - interval '23 days' + interval '16 hours 10 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000022', 'Owen Hughes',      'Ha! My wife did that — she came home with something she called a "vase". It was... a shape. Enjoy it though, they say it''s very meditative!', now() - interval '23 days' + interval '16 hours 18 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000022', 'Mia Collins',      'I''m hiking in the Brecon Beacons if the weather holds 🏔️ Training for a half marathon so need the miles.', now() - interval '23 days' + interval '16 hours 25 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000022', 'Sebastian Cook',   'Nice! The weather forecast looks okay for Sunday at least. I''m doing a food photography course Saturday — very on-brand for where I work 📸🍕', now() - interval '23 days' + interval '16 hours 30 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000022', 'Craig',            'Catching up on sleep mostly 😴 Also have a sourdough on the go so there''s that. Anyone want a loaf next week?', now() - interval '23 days' + interval '16 hours 35 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000022', 'Charlotte Bell',   'Craig YES please 🙋 I will trade you homemade brownies for sourdough any time.', now() - interval '23 days' + interval '16 hours 38 minutes'),
  (gen_random_uuid(), 'c1000000-0000-0000-0000-000000000022', 'Tom Bennett',      'Heading to a food market in Maltby Street Sunday — doing food research 🤣 As one does. Have a good one everyone!', now() - interval '23 days' + interval '16 hours 42 minutes');
