-- Deacons School: initial schema.
-- Star totals are always computed from star_awards (a ledger), never stored as a counter.

create table shapes (
  id              bigserial primary key,
  slug            text not null unique,
  name_ar         text not null,
  emoji           text,                       -- placeholder until designed images exist
  image_url       text,                       -- designed image, replaces emoji when set
  stars_required  integer not null default 0 check (stars_required >= 0),
  sort_order      integer not null default 0
);

create table terms (
  id          bigserial primary key,
  name        text not null,
  start_date  date not null,
  end_date    date not null check (end_date >= start_date),
  is_active   boolean not null default false
);
-- at most one active term at a time
create unique index terms_one_active on terms (is_active) where is_active;

create table branches (
  id          bigserial primary key,
  slug        text not null unique,
  name_ar     text not null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true
);

create table reasons (
  id              bigserial primary key,
  slug            text not null unique,
  name_ar         text not null,
  is_competition  boolean not null default false,  -- competition awards must name a branch
  sort_order      integer not null default 0,
  is_active       boolean not null default true
);

create table users (
  id               bigserial primary key,
  phone            text not null unique,           -- normalized, e.g. +201012345678
  password_hash    text not null,
  full_name        text not null,
  role             text not null check (role in ('kid', 'servant', 'admin')),
  grade            smallint check (grade between 3 and 6),
  shape_id         bigint references shapes (id),
  is_active        boolean not null default true,
  failed_attempts  integer not null default 0,
  locked_until     timestamptz,
  created_at       timestamptz not null default now(),
  -- only kids have a grade
  check ((role = 'kid') = (grade is not null))
);
create index users_grade_idx on users (grade) where role = 'kid';

create table star_awards (
  id          bigserial primary key,
  kid_id      bigint not null references users (id),
  amount      integer not null check (amount > 0),
  reason_id   bigint not null references reasons (id),
  branch_id   bigint references branches (id),
  term_id     bigint not null references terms (id),
  awarded_by  bigint not null references users (id),
  note        text,
  created_at  timestamptz not null default now(),
  voided_at   timestamptz,
  voided_by   bigint references users (id),
  check ((voided_at is null) = (voided_by is null))
);
create index star_awards_kid_idx    on star_awards (kid_id) where voided_at is null;
create index star_awards_term_idx   on star_awards (term_id, kid_id) where voided_at is null;
create index star_awards_branch_idx on star_awards (branch_id, kid_id) where voided_at is null;
