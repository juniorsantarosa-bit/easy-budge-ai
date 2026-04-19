-- Storage bucket for uploaded budget templates and logos
insert into storage.buckets (id, name, public)
values ('orcafacil', 'orcafacil', true)
on conflict (id) do nothing;

-- Public read, anyone insert (no auth in MVP — local-only model storage in app)
create policy "Public read orcafacil"
on storage.objects for select
using (bucket_id = 'orcafacil');

create policy "Public insert orcafacil"
on storage.objects for insert
with check (bucket_id = 'orcafacil');

create policy "Public update orcafacil"
on storage.objects for update
using (bucket_id = 'orcafacil');

create policy "Public delete orcafacil"
on storage.objects for delete
using (bucket_id = 'orcafacil');
