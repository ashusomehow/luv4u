# Creator referrals

Creators share **kholona.in/r/CODE** or tell followers to type **CODE** on the unlock page. The buyer gets
₹30 off (₹169, set by `REFERRAL_DISCOUNT_INR`), and the paid sale is credited to the creator.

## Rules (also on the Terms page)

| Weekly sales (Mon–Sun, India time) | Commission, on every sale that week |
|---|---|
| 1–9 | 20% |
| 10–19 | 30% |
| 20+ | 50% |

- Commission is on what buyers paid (₹169). Paid by IMPS every Friday for the week before; under ₹100 rolls over.
- A creator's own purchases never count (matched on hashed phone or email from Razorpay).
- A buyer who buys again the same week is flagged for review but counts unless you leave the sale out.
- Tiers live in `lib/referrals.ts` (`TIERS`, `MIN_PAYOUT_PAISE`). Changing them changes past unpaid weeks too, so change them only at the start of a week.

## Setup (once)

1. Run `supabase/migrations/0008_referrals.sql` in the Supabase SQL editor. Until then, codes are ignored and everyone pays ₹199.
2. Optional: set `REFERRAL_DISCOUNT_INR` on Vercel (default 30; 0 keeps crediting creators without a discount).
3. `ADMIN_TOKEN` must be set (it already is): it unlocks the tracker.

## Adding a creator

Open **kholona.in/admin/referrals**, paste the admin token, **+ Add creator**: code (e.g. `PRIYA`), name, handle, phone,
and bank details for IMPS (account holder, account number, IFSC, PAN). Then **Details** → **Copy link** and
**Copy stats link** and send both to the creator. The stats link is private: it shows their sales, tier, progress to the
next tier and payouts, never who bought. **New stats link** replaces a leaked one.

`kholona.in/r/CODE?to=proposal` opens the proposal page instead of birthday (also `love`, `apology`, `anniversary`,
`thanks`, `congrats`, `missyou`).

## Every Friday

1. Open the tracker. **Pay this Friday** is the total; each creator's **Due now** covers every finished, unpaid week.
2. Check sales marked ⚠ in **Details**. Leave out refunds and anything suspicious.
3. **Payout CSV** has names, accounts, IFSC and amounts for your bank's bulk IMPS, or pay one by one.
4. Press **Mark paid** and enter the IMPS reference (UTR). The creator's page shows it.

## Tax

Commission is income for the creator. Above ₹20,000 in a financial year, section 194H TDS (2%) may apply: collect PAN
and confirm with your CA.
