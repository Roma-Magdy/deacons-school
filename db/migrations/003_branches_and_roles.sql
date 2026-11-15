-- 003: remove the branch-leader role, use the four real branches, give staff a home branch.

-- 1. Roles. Any existing branch leaders become ordinary servants, then the role is removed.
update users set role = 'servant' where role = 'branch_leader';

do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'users'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%branch_leader%'
  loop
    execute format('alter table users drop constraint %I', c.conname);
  end loop;
end $$;

alter table users add constraint users_role_check check (role in ('kid', 'servant', 'admin'));

-- 2. Branches: الألحان، الطقس، المحفوظات، القبطي (the old "الأرشيف" branch becomes المحفوظات).
update branches set slug = 'memorization' where slug = 'archives';
update branches set name_ar = 'الألحان',    sort_order = 1 where slug = 'chants';
update branches set name_ar = 'الطقس',      sort_order = 2 where slug = 'liturgical';
update branches set name_ar = 'المحفوظات', sort_order = 3 where slug = 'memorization';
update branches set name_ar = 'القبطي',     sort_order = 4 where slug = 'coptic';

-- 3. Home branch for servants and admins. It is only a label: it never limits who can award stars.
alter table users add column branch_id bigint references branches (id);
alter table users add constraint users_branch_only_staff check (role <> 'kid' or branch_id is null);
create index users_branch_idx on users (branch_id) where branch_id is not null;

comment on column users.branch_id is 'Home branch of a servant/admin. Informational only; does not restrict awarding stars.';
comment on column reasons.is_competition is 'Competition awards may name a branch (star_awards.branch_id), but it is optional.';
