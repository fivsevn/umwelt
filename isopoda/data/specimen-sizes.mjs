// Approximate adult reference lengths for archive rulers. Never infer a mean from a maximum.
// Range midpoints are illustration anchors, not measured population means.
export const ADULT_SIZE_REFERENCES={
 giganteus:{mm:250,url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4304853/',title:'McClain et al. 2015 — Sizing ocean giants',basis:'Adult female mean 22.1 cm and male mean 27.7 cm; rounded midpoint 25 cm is an illustrative adult reference, not a pooled population mean.',level:'A1'},
 aquaticus:{mm:7,url:'https://link.springer.com/article/10.1007/s00265-026-03776-8',title:'Consistent behavioural variation in Asellus aquaticus does not correlate with individual metabolism (2026)',basis:'Study sample mean 7 mm (72 individuals from a pond near Lund); local sample reference, not a universal species mean.',level:'A1'},
 balthica:{mm:17,url:'https://www.marlin.ac.uk/species/detail/2087',title:'MarLIN — Idotea balthica',basis:'Male range 10–30 mm; female range 10–18 mm. Equal-sex midpoint of range midpoints is 17 mm; an illustrative reference, not a measured population mean.',level:'A2'},
 magnificus:{mm:27.5,url:'https://scuttleandsqueak.com/care-guides/isopods/porcellio-magnificus',title:'Scuttle & Squeak — Porcellio magnificus care guide',basis:'Breeder guide adult reference 25–30 mm; midpoint used as an approximate captive adult reference, not a wild population mean.',level:'C'}
};
export const adultSizeSourceId=id=>'archive-adult-size-'+id;
export const ADULT_SIZE_SOURCES=Object.entries(ADULT_SIZE_REFERENCES).map(([id,ref])=>({id:adultSizeSourceId(id),level:ref.level,type:'APPROXIMATE ADULT SIZE',title:ref.title,url:ref.url,supports:[id+'.adult-size-reference'],note:ref.basis}));
