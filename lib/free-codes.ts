import { supabase } from './supabase';

/**
 * Free unlock codes (migration 0009): typed in the code box on the unlock page, they unlock a gift without
 * payment. For testing and for gifting. A free unlock is not a sale: no Razorpay order, no Meta Purchase, no
 * creator credit. Like referrals, everything fails closed: if the table is missing or a lookup breaks, the
 * code is simply not valid and the buyer pays as usual.
 */

export interface FreeCode {
  code: string;
  note: string | null;
  max_uses: number | null;
  uses: number;
  active: boolean;
}

const usable = (row: FreeCode | null): row is FreeCode => !!row && row.active && (row.max_uses === null || row.uses < row.max_uses);

/** An active free code with uses left, or null. Never throws. */
export async function findFreeCode(code: string | null): Promise<FreeCode | null> {
  if (!code) return null;
  try {
    const { data, error } = await supabase().from('free_codes').select('*').eq('code', code).maybeSingle();
    if (error) throw error;
    const row = (data as FreeCode | null) ?? null;
    return usable(row) ? row : null;
  } catch (error) {
    console.warn('Free code lookup failed (treating as no code):', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Uses one go of a free code for this gift. The count only moves if nobody else used the code in between
 * (compare and set), so a code with one use left can never unlock two gifts. Returns whether it worked.
 */
export async function redeemFreeCode(code: string, giftId: string): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const row = await findFreeCode(code);
    if (!row) return false;
    const { data, error } = await supabase().from('free_codes').update({ uses: row.uses + 1 }).eq('code', code).eq('uses', row.uses).select('code');
    if (error) throw error;
    if (!data?.length) continue; // someone else used it at the same moment: look again
    const { error: logError } = await supabase().from('free_code_uses').insert({ code, gift_id: giftId });
    if (logError) console.warn('Free code used but not logged:', { code, gift: giftId, error: logError.message });
    return true;
  }
  return false;
}
