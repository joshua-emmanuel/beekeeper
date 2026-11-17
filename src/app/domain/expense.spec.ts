import { describe, expect, it } from 'vitest';
import { Expense, parseNaira, progressFor, sharesFor, splitKobo, updatePaidStatuses, validSnapshot, validateExpense } from './expense';

const base: Expense = { id:'e1', title:'Ride', totalKobo:10_000, members:[{id:'m1',name:'Ari',status:'paid'},{id:'m2',name:'Bea',status:'unpaid'},{id:'m3',name:'Cal',status:'unpaid'}], createdAt:'2026-01-01T00:00:00.000Z', updatedAt:'2026-01-01T00:00:00.000Z' };
describe('expense money rules', () => {
  it('parses decimal naira using integer kobo', () => { expect(parseNaira('25000')).toBe(2_500_000); expect(parseNaira('25000.0')).toBe(2_500_000); expect(parseNaira('0.01')).toBe(1); });
  it('rejects malformed and out of range amounts', () => { for (const value of ['0','-1','1,000','1e3','2.001','1000000.01','.50']) expect(parseNaira(value)).toBeNull(); });
  it('allocates remainder kobo in stored order', () => { expect(splitKobo(10_000,3)).toEqual([3334,3333,3333]); expect(sharesFor({...base,totalKobo:10_000}).map(m=>m.shareKobo)).toEqual([3334,3333,3333]); });
  it('derives collected and outstanding totals', () => { expect(progressFor(base)).toMatchObject({collectedKobo:3334,outstandingKobo:6666,paidCount:1,percent:33.3}); });
  it('never displays 100% while any kobo remains outstanding', () => { const e={...base,totalKobo:100,members:[{id:'a',name:'A',status:'paid' as const},{id:'b',name:'B',status:'unpaid' as const}]}; expect(progressFor(e).percent).toBeLessThan(100); });
  it('validates duplicate normalized names and minimum share', () => { expect(validateExpense(' Ride ','0.02',['Ari',' ari  '])).toContain('“ari” duplicates another member.'); expect(validateExpense('Ride','0.02',['A','B','C'])).toContain('Every member must receive at least ₦0.01.'); });
  it('preserves paid state only when member identity, normalized name and share stay the same', () => {
    const same = updatePaidStatuses(base,'New title',10_000,[{...base.members[0],name:'  ari  '},base.members[1],base.members[2]]);
    expect(same[0].status).toBe('paid');
    const changed = updatePaidStatuses(base,'Ride',9_998,base.members);
    expect(changed[0].status).toBe('unpaid');
  });
  it('validates persisted snapshots and rejects non-canonical timestamps', () => {
    expect(validSnapshot({version:1,expenses:[base]})).toBe(true);
    expect(validSnapshot({version:2,expenses:[base]})).toBe(false);
    expect(validSnapshot({version:1,expenses:[{...base,createdAt:'2026-02-31T00:00:00.000Z'}]})).toBe(false);
  });
});
