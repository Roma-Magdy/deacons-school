-- 004: yearly promotion and the graduates archive.

-- A graduate is a kid who finished 6th grade: deactivated, hidden from the normal lists, and labelled with the year they
-- graduated. Their grade stays 6 and their stars stay in star_awards, so the history is kept (or exported, then deleted).
alter table users add column graduated_year smallint;
alter table users add constraint users_graduated_only_kids check (graduated_year is null or role = 'kid');
alter table users add constraint users_graduated_year_range check (graduated_year is null or graduated_year between 2000 and 2100);
create index users_graduated_idx on users (graduated_year) where graduated_year is not null;

comment on column users.graduated_year is 'Set when a 6th grader is archived by the yearly promotion. Null for everyone else.';

-- One row per yearly promotion, with exactly what changed, so the promotion can be undone.
-- moves: [{ "id": 12, "from": 3, "to": 4, "graduated": false, "wasActive": true }, ...]
create table promotions (
  id           bigserial primary key,
  school_year  smallint not null check (school_year between 2000 and 2100),
  created_at   timestamptz not null default now(),
  created_by   bigint references users (id),
  moves        jsonb not null,
  undone_at    timestamptz
);
