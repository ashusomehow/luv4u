-- "Find my gift" (/find): a buyer whose page closed after paying (Instagram often closes its browser on the way back
-- from Paytm or GPay) gets their gift's link back with the UPI reference number their payment app shows, plus the phone
-- number they gave Razorpay. The reference (RRN, 12 digits) is saved when a payment is confirmed. Without this
-- migration everything still works; only the UPI-reference lookup does (the Razorpay payment id "pay_…" always does).
alter table public.payments add column if not exists rrn text;
create index if not exists idx_payments_rrn on public.payments (rrn) where rrn is not null;
