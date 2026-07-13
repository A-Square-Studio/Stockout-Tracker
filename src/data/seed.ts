import type { StockoutItem, FutureStockoutItem } from '../types';

export const SEED_STOCKOUTS: StockoutItem[] = [
  { id: '101801',   name: 'iCE Chemical Test Kit',                                  productLine: 'Biologics',      leadTime: 6,  approxShipDate: '06/29/26', escalationOwner: 'Ryan Katzer', topLevel: [] },
  { id: '042-973',  name: '8x Biotin Labeling Reagent',                             productLine: 'Simple Western', leadTime: 4,  approxShipDate: '06/25/26', escalationOwner: 'Ryan Katzer', topLevel: ['042-973','CTC-0014','CTC-0015','DM-TP01','SWDM-LC-TP21','SWDM-TP21','SWDM-TP21-2'] },
  { id: '043-491',  name: 'Anti-Human IgG Secondary HRP A',                         productLine: 'Simple Western', leadTime: 15, approxShipDate: '07/17/26', escalationOwner: 'Ryan Katzer', topLevel: ['043-491','043-491-2','DM-005','SA-001','SWDM-025','SWDM-LC-025'] },
  { id: '043-816',  name: 'Streptavidin-NIR',                                       productLine: 'Simple Western', leadTime: 15, approxShipDate: '07/17/26', escalationOwner: 'Ryan Katzer', topLevel: ['043-816','CTC-0002','CTC-0014','CTC-0015','CTC-0017','DM-007','DM-008','DM-009','DM-010','PS-N007','PS-T004','PS-T004-1','PS-T005','PS-TR-CS4'] },
  { id: '043-860',  name: '66-440 kDa Leo Reagent Plate',                           productLine: 'Simple Western', leadTime: 9,  approxShipDate: '07/09/26', escalationOwner: 'Ryan Katzer', topLevel: ['043-860','SWPR-W016','SWSM-W016'] },
  { id: '043-864',  name: '2-40 kDa Leo Reagent Plate',                             productLine: 'Simple Western', leadTime: 3,  approxShipDate: '06/24/26', escalationOwner: 'Ryan Katzer', topLevel: ['043-864','SWPR-W017','SWPR-W018','SWPR-W019','SWSM-W017','SWSM-W018','SWSM-W019'] },
  { id: '101-0059', name: 'Cartridge, cIEF Fractionation',                          productLine: 'Biologics',      leadTime: 30, approxShipDate: '08/07/26', escalationOwner: 'Paul Leger',  topLevel: ['101-0059','104-0062','PS-MAK01-F','PS-MC02-F','PS-MDK01-F'] },
  { id: '102222',   name: 'iCE280/iCE3 pI Marker 3.59',                            productLine: 'Biologics',      leadTime: 5,  approxShipDate: '07/03/26', escalationOwner: 'Ryan Katzer', topLevel: ['102222'] },
  { id: '040-025',  name: 'pI Standard 4.2',                                        productLine: 'Simple Western', leadTime: 6,  approxShipDate: '07/06/26', escalationOwner: 'Greg Babb',   topLevel: ['040-025'] },
  { id: '041-105',  name: 'GAM Biotin Vial',                                        productLine: 'Simple Western', leadTime: 6,  approxShipDate: '07/06/26', escalationOwner: 'Greg Babb',   topLevel: ['041-105','041-127'] },
  { id: '101996',   name: 'iCE280/iCE3 pI Marker 9.50',                            productLine: 'Biologics',      leadTime: 11, approxShipDate: '07/13/26', escalationOwner: 'Ryan Katzer', topLevel: [] },
  { id: '102219',   name: 'iCE280/iCE3 pI Marker 9.77',                            productLine: 'Biologics',      leadTime: 7,  approxShipDate: '07/07/26', escalationOwner: 'Ryan Katzer', topLevel: [] },
  { id: '102224',   name: 'iCE280/iCE3 pI Marker 5.12',                            productLine: 'Biologics',      leadTime: 11, approxShipDate: '07/13/26', escalationOwner: 'Ryan Katzer', topLevel: ['042-848','042-848-1','102224'] },
  { id: '102229',   name: 'iCE280/iCE3 pI Marker 8.40',                            productLine: 'Biologics',      leadTime: 12, approxShipDate: '07/14/26', escalationOwner: 'Ryan Katzer', topLevel: [] },
  { id: 'CBS701',   name: 'Capillaries for Charge Separation (5 boxes @96 caps)',   productLine: 'Simple Western', leadTime: 9,  approxShipDate: '07/09/26', escalationOwner: 'Greg Babb',   topLevel: ['055-176','CBS1901','CBS2001','CBS2001 RT','CBS2501','CBS701','PS-N006','PS-T003'] },
];

export const SEED_FUTURE: FutureStockoutItem[] = [
  { partNumber: '040-968',      name: 'Premix G2, pH 3–10 separation gradient',                         productLine: 'Simple Western', estimatedWeeksOnHand: 0.4 },
  { partNumber: '043-327',      name: 'Wes 2-40 kDa Pre-Filled Plates',                                productLine: 'Simple Western', estimatedWeeksOnHand: 1.3 },
  { partNumber: '043-522',      name: 'Anti-Goat Secondary HRP Antib',                                 productLine: 'Simple Western', estimatedWeeksOnHand: 0.1 },
  { partNumber: '043-864',      name: '2-40 kDa Leo Reagent Plate',                                    productLine: 'Simple Western', estimatedWeeksOnHand: 1.5 },
  { partNumber: '046-016',      name: 'Maurice CE-SDS 25X Internal Standard, Lyophilized Vials',       productLine: 'Biologics',      estimatedWeeksOnHand: 2.1 },
  { partNumber: '046-027',      name: 'Maurice cIEF System Suitability Test Mix',                      productLine: 'Biologics',      estimatedWeeksOnHand: 0.5 },
  { partNumber: '102408',       name: 'iCE280/iCE3 pI Marker 8.18',                                   productLine: 'Biologics',      estimatedWeeksOnHand: 1.1 },
  { partNumber: 'A-0000249-00', name: 'HT CTK CATHOLYTE, Solution 2, 10 mL',                          productLine: 'Biologics',      estimatedWeeksOnHand: 0.1 },
];
