/*
  # Seed 46 additional user profiles

  Creates placeholder auth.users entries (with no login credentials) and
  corresponding profiles rows so they appear in the participant picker.
  Existing 4 accounts (Ben, Craig, Jon Searle, Rory) are preserved.

  These accounts are display-name-only participants — they cannot log in.
*/

DO $$
DECLARE
  names text[] := ARRAY[
    'Alice Morgan', 'Tom Bennett', 'Sarah Chen', 'David Kim',
    'Emma Wilson', 'James Carter', 'Olivia Patel', 'Liam Foster',
    'Sophia Nguyen', 'Noah Brooks', 'Isabella Reed', 'Mason Hayes',
    'Ava Torres', 'Ethan Price', 'Mia Collins', 'Lucas Perry',
    'Charlotte Bell', 'Aiden Wood', 'Amelia Ross', 'Jackson Ward',
    'Harper Cooper', 'Logan Rivera', 'Evelyn Murphy', 'Sebastian Cook',
    'Abigail Richardson', 'Mateo Powell', 'Emily Cox', 'Jack Howard',
    'Elizabeth Barnes', 'Owen Hughes', 'Sofia Flores', 'Benjamin Stewart',
    'Avery Sanders', 'Henry Jenkins', 'Scarlett Patterson', 'Samuel Gray',
    'Victoria Myers', 'Gabriel Long', 'Madison Butler', 'Carter Simmons',
    'Penelope Foster', 'Wyatt Gonzalez', 'Layla Bryant', 'Julian Alexander',
    'Riley Russell', 'Elijah Griffin'
  ];
  name text;
  new_user_id uuid;
BEGIN
  FOREACH name IN ARRAY names LOOP
    new_user_id := gen_random_uuid();

    -- Insert into auth.users (no email/password — placeholder only)
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      lower(replace(name, ' ', '.')) || '+placeholder@meetdetect.internal',
      '',  -- no password
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('display_name', name),
      false,
      '', '', '', ''
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert profile
    INSERT INTO profiles (id, display_name)
    VALUES (new_user_id, name)
    ON CONFLICT (id) DO NOTHING;

  END LOOP;
END $$;
