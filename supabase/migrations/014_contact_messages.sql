-- 014 — Contact form: people send a message from the Help centre instead of
-- seeing a personal email address; admins read them on the dashboard.
-- Run once in Supabase → SQL Editor, after 013. Safe to re-run.

create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete set null, -- set when the sender was logged in
  name        text not null check (char_length(name) between 1 and 100),
  email       text not null check (char_length(email) between 3 and 200),
  subject     text not null check (subject in ('booking', 'payment', 'account', 'safety', 'hosting', 'other')),
  message     text not null check (char_length(message) between 10 and 2000),
  booking_ref text check (booking_ref is null or char_length(booking_ref) <= 20),
  status      text not null default 'open' check (status in ('open', 'handled')),
  created_at  timestamptz not null default now()
);

alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated; -- only through the functions below

-- Anyone (logged in or not) can send a message. At most 3 per email address
-- per hour, so the form can't be used to flood the inbox.
create or replace function public.submit_contact_message(
  p_name text, p_email text, p_subject text, p_message text, p_booking_ref text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Please enter a valid email address so we can reply.';
  end if;
  if (select count(*) from public.contact_messages
       where lower(email) = lower(trim(p_email)) and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'You’ve sent several messages in the last hour. We’ll reply soon — please wait before sending another.';
  end if;

  insert into public.contact_messages (user_id, name, email, subject, message, booking_ref)
  values (auth.uid(), trim(p_name), lower(trim(p_email)), p_subject, trim(p_message), nullif(upper(trim(p_booking_ref)), ''));
end;
$$;

create or replace function public.admin_contact_messages()
returns setof public.contact_messages
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only.';
  end if;
  return query select * from public.contact_messages where status = 'open' order by created_at;
end;
$$;

create or replace function public.resolve_contact_message(p_message_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only.';
  end if;
  update public.contact_messages set status = 'handled' where id = p_message_id;
end;
$$;

revoke execute on function public.submit_contact_message(text, text, text, text, text) from public;
revoke execute on function public.admin_contact_messages() from public, anon;
revoke execute on function public.resolve_contact_message(uuid) from public, anon;
grant execute on function public.submit_contact_message(text, text, text, text, text) to anon, authenticated;
grant execute on function public.admin_contact_messages() to authenticated;
grant execute on function public.resolve_contact_message(uuid) to authenticated;
