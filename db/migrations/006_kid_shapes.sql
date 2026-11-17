-- 006: remember which shapes a kid has unlocked, so a shape never disappears if a star is cancelled later.
-- Free shapes (stars_required = 0) need no row. Totals still come from star_awards; this table only remembers unlocks.
create table kid_shapes (
  kid_id       bigint not null references users (id) on delete cascade,
  shape_id     bigint not null references shapes (id),
  unlocked_at  timestamptz not null default now(),
  primary key (kid_id, shape_id)
);

-- Everyone who already has enough lifetime stars gets the shapes they have earned so far.
insert into kid_shapes (kid_id, shape_id)
select t.kid_id, s.id
  from (select kid_id, sum(amount) as total from star_awards where voided_at is null group by kid_id) t
  join shapes s on s.stars_required > 0 and s.stars_required <= t.total
on conflict do nothing;
