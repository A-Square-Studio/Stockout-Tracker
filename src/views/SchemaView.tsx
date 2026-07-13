import styles from './SchemaView.module.css';

interface Field {
  name: string;
  type: string;
  pk?: boolean;
  unique?: boolean;
  note?: string;
}

interface Table {
  name: string;
  tsType: string;
  color: string;
  fields: Field[];
  endpoints?: string[];
}

const TABLES: Table[] = [
  {
    name: 'stockout_items',
    tsType: 'StockoutItem',
    color: 'blue',
    fields: [
      { name: 'id',                 type: 'TEXT',    pk: true },
      { name: 'name',               type: 'TEXT' },
      { name: 'product_line',       type: 'TEXT' },
      { name: 'lead_time',          type: 'INT' },
      { name: 'approx_ship_date',   type: 'TEXT' },
      { name: 'escalation_owner',   type: 'TEXT' },
      { name: 'top_level',          type: 'TEXT[ ]', note: 'array of top-level SKUs' },
    ],
    endpoints: [
      'GET    /api/stockouts',
      'PUT    /api/stockouts',
      'DELETE /api/stockouts',
    ],
  },
  {
    name: 'future_stockout_items',
    tsType: 'FutureStockoutItem',
    color: 'orange',
    fields: [
      { name: 'id',                       type: 'SERIAL',  pk: true },
      { name: 'part_number',              type: 'TEXT' },
      { name: 'name',                     type: 'TEXT' },
      { name: 'product_line',             type: 'TEXT' },
      { name: 'estimated_weeks_on_hand',  type: 'NUMERIC' },
    ],
    endpoints: [
      'GET /api/future-stockouts',
      'PUT /api/future-stockouts',
    ],
  },
  {
    name: 'admins',
    tsType: 'Admin',
    color: 'purple',
    fields: [
      { name: 'id',            type: 'SERIAL',  pk: true },
      { name: 'username',      type: 'TEXT',    unique: true },
      { name: 'password_hash', type: 'TEXT' },
      { name: 'first_name',    type: 'TEXT' },
      { name: 'last_name',     type: 'TEXT' },
      { name: 'email',         type: 'TEXT' },
      { name: 'is_root',       type: 'BOOLEAN' },
    ],
    endpoints: [
      'GET  /api/auth/me',
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'GET  /api/admins',
      'POST /api/admins',
      'DELETE /api/admins/:id',
    ],
  },
  {
    name: 'session',
    tsType: '(Express session store)',
    color: 'grey',
    fields: [
      { name: 'sid',    type: 'TEXT',        pk: true },
      { name: 'sess',   type: 'JSON' },
      { name: 'expire', type: 'TIMESTAMPTZ' },
    ],
  },
];

export default function SchemaView() {
  return (
    <div className={styles.wrap}>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Data Schema</h1>
        <p className={styles.pageBlurb}>
          PostgreSQL tables, TypeScript interfaces, and API endpoints for the Stockout Tracker.
        </p>
      </div>

      <div className={styles.grid}>
        {TABLES.map(table => (
          <div key={table.name} className={`${styles.card} ${styles[table.color]}`}>
            {/* Header */}
            <div className={styles.cardHead}>
              <div>
                <div className={styles.tableName}>{table.name}</div>
                <div className={styles.tsType}>interface {table.tsType}</div>
              </div>
              <span className={styles.dbBadge}>PG</span>
            </div>

            {/* Fields */}
            <div className={styles.fieldsWrap}>
              <div className={styles.fieldsLabel}>Fields</div>
              <table className={styles.fields}>
                <tbody>
                  {table.fields.map(f => (
                    <tr key={f.name} className={styles.fieldRow}>
                      <td className={styles.fieldMeta}>
                        {f.pk     && <span className={styles.tagPk}>PK</span>}
                        {f.unique && <span className={styles.tagUq}>UQ</span>}
                        {!f.pk && !f.unique && <span className={styles.tagEmpty} />}
                      </td>
                      <td className={styles.fieldName}>{f.name}</td>
                      <td className={styles.fieldType}>{f.type}</td>
                      {f.note && <td className={styles.fieldNote}>{f.note}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Endpoints */}
            {table.endpoints && (
              <div className={styles.endpointsWrap}>
                <div className={styles.fieldsLabel}>API Endpoints</div>
                <ul className={styles.endpoints}>
                  {table.endpoints.map(ep => {
                    const [method, ...rest] = ep.trim().split(/\s+/);
                    return (
                      <li key={ep} className={styles.endpoint}>
                        <span className={`${styles.method} ${styles[`method${method}`]}`}>{method}</span>
                        <span className={styles.path}>{rest.join(' ')}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Relationship note */}
      <div className={styles.relNote}>
        <div className={styles.relNoteHead}>Relationships</div>
        <ul className={styles.relList}>
          <li><span className={styles.relFrom}>stockout_items.top_level</span> — self-referencing array of finished-goods SKUs impacted by the gating item</li>
          <li><span className={styles.relFrom}>admins</span> → <span className={styles.relFrom}>session</span> — each login creates a row in <code>session</code> keyed by cookie sid</li>
          <li><span className={styles.relFrom}>future_stockout_items</span> — standalone watchlist; no FK to stockout_items (overlap by part number only)</li>
        </ul>
      </div>
    </div>
  );
}
