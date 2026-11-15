-- Gender is used for the Arabic greetings (باسون / تاسوني, الشاطر / الشاطرة).
-- Nullable so existing accounts keep working; the app falls back to a neutral greeting until it is set.
alter table users
  add column gender text check (gender in ('male', 'female'));
