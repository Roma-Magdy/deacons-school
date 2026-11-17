-- 008: "choose your own password" screen. A new account (or one whose password an admin just reset) is shown the screen
-- once after login, and can skip it. Accounts that already exist are not shown it.
alter table users add column password_prompt boolean not null default false;
