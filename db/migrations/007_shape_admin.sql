-- 007: lets the admin manage shapes.
--  * is_hidden: a hidden shape disappears from the picker, but kids already wearing it keep it.
--  * image_data / image_type: uploaded artwork, stored in the database and served from /shape-image/<id>.
--    image_url keeps pointing at the picture (it already exists), so every screen shows it with no other change.
alter table shapes add column is_hidden boolean not null default false;
alter table shapes add column image_data bytea;
alter table shapes add column image_type text;
alter table shapes add constraint shapes_has_picture check (emoji is not null or image_url is not null);
