import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

// Seed data (mirrors src/data/seed.ts)
const SEED_STOCKOUTS = [
  { id:'101801',   name:'iCE Chemical Test Kit',                                 product_line:'Biologics',      lead_time:6,  approx_ship_date:'06/29/26', escalation_owner:'Ryan Katzer', top_level:[] },
  { id:'042-973',  name:'8x Biotin Labeling Reagent',                            product_line:'Simple Western', lead_time:4,  approx_ship_date:'06/25/26', escalation_owner:'Ryan Katzer', top_level:['042-973','CTC-0014','CTC-0015','DM-TP01','SWDM-LC-TP21','SWDM-TP21','SWDM-TP21-2'] },
  { id:'043-491',  name:'Anti-Human IgG Secondary HRP A',                        product_line:'Simple Western', lead_time:15, approx_ship_date:'07/17/26', escalation_owner:'Ryan Katzer', top_level:['043-491','043-491-2','DM-005','SA-001','SWDM-025','SWDM-LC-025'] },
  { id:'043-816',  name:'Streptavidin-NIR',                                      product_line:'Simple Western', lead_time:15, approx_ship_date:'07/17/26', escalation_owner:'Ryan Katzer', top_level:['043-816','CTC-0002','CTC-0014','CTC-0015','CTC-0017','DM-007','DM-008','DM-009','DM-010','PS-N007','PS-T004','PS-T004-1','PS-T005','PS-TR-CS4'] },
  { id:'043-860',  name:'66-440 kDa Leo Reagent Plate',                          product_line:'Simple Western', lead_time:9,  approx_ship_date:'07/09/26', escalation_owner:'Ryan Katzer', top_level:['043-860','SWPR-W016','SWSM-W016'] },
  { id:'043-864',  name:'2-40 kDa Leo Reagent Plate',                            product_line:'Simple Western', lead_time:3,  approx_ship_date:'06/24/26', escalation_owner:'Ryan Katzer', top_level:['043-864','SWPR-W017','SWPR-W018','SWPR-W019','SWSM-W017','SWSM-W018','SWSM-W019'] },
  { id:'101-0059', name:'Cartridge, cIEF Fractionation',                         product_line:'Biologics',      lead_time:30, approx_ship_date:'08/07/26', escalation_owner:'Paul Leger',  top_level:['101-0059','104-0062','PS-MAK01-F','PS-MC02-F','PS-MDK01-F'] },
  { id:'102222',   name:'iCE280/iCE3 pI Marker 3.59',                           product_line:'Biologics',      lead_time:5,  approx_ship_date:'07/03/26', escalation_owner:'Ryan Katzer', top_level:['102222'] },
  { id:'040-025',  name:'pI Standard 4.2',                                       product_line:'Simple Western', lead_time:6,  approx_ship_date:'07/06/26', escalation_owner:'Greg Babb',   top_level:['040-025'] },
  { id:'041-105',  name:'GAM Biotin Vial',                                       product_line:'Simple Western', lead_time:6,  approx_ship_date:'07/06/26', escalation_owner:'Greg Babb',   top_level:['041-105','041-127'] },
  { id:'101996',   name:'iCE280/iCE3 pI Marker 9.50',                           product_line:'Biologics',      lead_time:11, approx_ship_date:'07/13/26', escalation_owner:'Ryan Katzer', top_level:[] },
  { id:'102219',   name:'iCE280/iCE3 pI Marker 9.77',                           product_line:'Biologics',      lead_time:7,  approx_ship_date:'07/07/26', escalation_owner:'Ryan Katzer', top_level:[] },
  { id:'102224',   name:'iCE280/iCE3 pI Marker 5.12',                           product_line:'Biologics',      lead_time:11, approx_ship_date:'07/13/26', escalation_owner:'Ryan Katzer', top_level:['042-848','042-848-1','102224'] },
  { id:'102229',   name:'iCE280/iCE3 pI Marker 8.40',                           product_line:'Biologics',      lead_time:12, approx_ship_date:'07/14/26', escalation_owner:'Ryan Katzer', top_level:[] },
  { id:'CBS701',   name:'Capillaries for Charge Separation (5 boxes @96 caps)', product_line:'Simple Western', lead_time:9,  approx_ship_date:'07/09/26', escalation_owner:'Greg Babb',   top_level:['055-176','CBS1901','CBS2001','CBS2001 RT','CBS2501','CBS701','PS-N006','PS-T003'] },
];

const SEED_FUTURE = [
  { part_number:'040-968',      name:'Premix G2, pH 3–10 separation gradient',                        product_line:'Simple Western', estimated_weeks_on_hand:0.4 },
  { part_number:'043-327',      name:'Wes 2-40 kDa Pre-Filled Plates',                               product_line:'Simple Western', estimated_weeks_on_hand:1.3 },
  { part_number:'043-522',      name:'Anti-Goat Secondary HRP Antib',                                product_line:'Simple Western', estimated_weeks_on_hand:0.1 },
  { part_number:'043-864',      name:'2-40 kDa Leo Reagent Plate',                                   product_line:'Simple Western', estimated_weeks_on_hand:1.5 },
  { part_number:'046-016',      name:'Maurice CE-SDS 25X Internal Standard, Lyophilized Vials',      product_line:'Biologics',      estimated_weeks_on_hand:2.1 },
  { part_number:'046-027',      name:'Maurice cIEF System Suitability Test Mix',                     product_line:'Biologics',      estimated_weeks_on_hand:0.5 },
  { part_number:'102408',       name:'iCE280/iCE3 pI Marker 8.18',                                  product_line:'Biologics',      estimated_weeks_on_hand:1.1 },
  { part_number:'A-0000249-00', name:'HT CTK CATHOLYTE, Solution 2, 10 mL',                         product_line:'Biologics',      estimated_weeks_on_hand:0.1 },
];

export async function initDb() {
  // Seed default admin if table is empty
  const { rows: adminRows } = await pool.query('SELECT COUNT(*) FROM admins');
  if (parseInt(adminRows[0].count) === 0) {
    const hash = await bcrypt.hash('Admin1234!', 10);
    await pool.query(
      `INSERT INTO admins (username, password_hash, first_name, last_name, email, is_root)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['admin', hash, 'Admin', '', '', true],
    );
    // Do not log the default password — change it immediately after first login
    console.log('Seeded default admin account. Log in as "admin" and change your password immediately.');
  }

  // Seed stockout items if empty
  const { rows: sRows } = await pool.query('SELECT COUNT(*) FROM stockout_items');
  if (parseInt(sRows[0].count) === 0) {
    for (const s of SEED_STOCKOUTS) {
      await pool.query(
        `INSERT INTO stockout_items (id, name, product_line, lead_time, approx_ship_date, escalation_owner, top_level)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [s.id, s.name, s.product_line, s.lead_time, s.approx_ship_date, s.escalation_owner, s.top_level],
      );
    }
    console.log(`Seeded ${SEED_STOCKOUTS.length} stockout items`);
  }

  // Seed future stockout items if empty
  const { rows: fRows } = await pool.query('SELECT COUNT(*) FROM future_stockout_items');
  if (parseInt(fRows[0].count) === 0) {
    for (const f of SEED_FUTURE) {
      await pool.query(
        `INSERT INTO future_stockout_items (part_number, name, product_line, estimated_weeks_on_hand)
         VALUES ($1,$2,$3,$4)`,
        [f.part_number, f.name, f.product_line, f.estimated_weeks_on_hand],
      );
    }
    console.log(`Seeded ${SEED_FUTURE.length} future stockout items`);
  }
}
