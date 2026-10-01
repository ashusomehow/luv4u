// Minimal in-memory stand-in for the parts of supabase-js that Kholona uses.
type Row = Record<string, unknown>;
type Filter = (row: Row) => boolean;

class Query {
  private filters: Filter[] = [];
  private op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private payload: Row | null = null;
  private opts: { count?: boolean; head?: boolean; ignoreDuplicates?: boolean; onConflict?: string } = {};
  private max = Infinity;
  private sort: { column: string; ascending: boolean } | null = null;
  private returning = false;
  private single = false;

  constructor(
    private db: FakeSupabase,
    private table: string,
  ) {}

  select(_columns?: string, opts: { count?: string; head?: boolean } = {}) {
    if (this.op === 'select') this.opts = { count: Boolean(opts.count), head: opts.head };
    else this.returning = true;
    return this;
  }
  insert(row: Row) { this.op = 'insert'; this.payload = row; return this; }
  update(row: Row) { this.op = 'update'; this.payload = row; return this; }
  upsert(row: Row, opts: { onConflict?: string; ignoreDuplicates?: boolean } = {}) {
    this.op = 'upsert'; this.payload = row; this.opts = opts; return this;
  }
  delete() { this.op = 'delete'; return this; }
  eq(column: string, value: unknown) { this.filters.push((r) => r[column] === value); return this; }
  neq(column: string, value: unknown) { this.filters.push((r) => r[column] !== value); return this; }
  is(column: string, value: null) { this.filters.push((r) => (r[column] ?? null) === value); return this; }
  gte(column: string, value: string) { this.filters.push((r) => String(r[column]) >= value); return this; }
  lt(column: string, value: string) { this.filters.push((r) => String(r[column]) < value); return this; }
  in(column: string, values: unknown[]) { this.filters.push((r) => values.includes(r[column])); return this; }
  limit(n: number) { this.max = n; return this; }
  order(column: string, o: { ascending: boolean }) { this.sort = { column, ascending: o.ascending }; return this; }
  maybeSingle() { this.single = true; return this; }

  private rows() { return (this.db.tables[this.table] ??= []); }

  private run() {
    const rows = this.rows();
    const match = (r: Row) => this.filters.every((f) => f(r));
    switch (this.op) {
      case 'insert': {
        const key = this.db.primaryKeys[this.table];
        if (key && rows.some((r) => r[key] === this.payload![key])) {
          return { data: null, error: { code: '23505', message: 'duplicate key' } };
        }
        rows.push({ ...this.payload, ...(key ? {} : { id: rows.length + 1 }) });
        return { data: null, error: null };
      }
      case 'upsert': {
        const cols = (this.opts.onConflict ?? 'id').split(',');
        const dup = rows.find((r) => cols.every((c) => r[c] === this.payload![c]));
        if (!dup) rows.push({ ...this.payload, id: rows.length + 1 });
        else if (!this.opts.ignoreDuplicates) Object.assign(dup, this.payload);
        return { data: null, error: null };
      }
      case 'update': {
        const hit = rows.filter(match);
        hit.forEach((r) => Object.assign(r, this.payload));
        return { data: this.returning ? hit.map((r) => ({ id: r.id })) : null, error: null };
      }
      case 'delete': {
        this.db.tables[this.table] = rows.filter((r) => !match(r));
        return { data: null, error: null };
      }
      default: {
        let hit = rows.filter(match);
        if (this.sort) {
          const { column, ascending } = this.sort;
          hit = [...hit].sort((a, b) => (Number(a[column]) - Number(b[column])) * (ascending ? 1 : -1));
        }
        const count = hit.length;
        hit = hit.slice(0, this.max);
        if (this.opts.head) return { data: null, count, error: null };
        if (this.single) return { data: hit[0] ?? null, error: null };
        return { data: hit, count: this.opts.count ? count : undefined, error: null };
      }
    }
  }

  then<T>(resolve: (value: ReturnType<Query['run']>) => T) {
    return Promise.resolve(this.run()).then(resolve);
  }
}

export class FakeSupabase {
  tables: Record<string, Row[]> = {};
  primaryKeys: Record<string, string> = { gifts: 'id' };
  files = new Map<string, { bytes: Buffer; contentType: string; createdAt: string }>();

  from(table: string) { return new Query(this, table); }

  storage = {
    from: (_bucket: string) => ({
      upload: async (path: string, bytes: Buffer, o: { contentType: string }) => {
        this.files.set(path, { bytes, contentType: o.contentType, createdAt: new Date().toISOString() });
        return { data: { path }, error: null };
      },
      list: async (folder: string) => {
        const prefix = `${folder}/`;
        const names = new Map<string, string>();
        for (const [path, file] of this.files) {
          if (path.startsWith(prefix)) names.set(path.slice(prefix.length).split('/')[0], file.createdAt);
        }
        return { data: [...names].map(([name, created_at]) => ({ name, created_at })), error: null };
      },
      remove: async (paths: string[]) => {
        paths.forEach((p) => this.files.delete(p));
        return { data: null, error: null };
      },
      getPublicUrl: (path: string) => ({ data: { publicUrl: `https://fake.supabase.co/storage/v1/object/public/gift-media/${path}` } }),
    }),
  };
}
