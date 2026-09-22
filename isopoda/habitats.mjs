// Stable save IDs. No browser or engine dependency: this is the shared configuration boundary.
const configs=[
 {id:'terrestrial',days:7,names:['腐殖层','Forest litter','腐植層'],scene:'forest',aquatic:false,defaults:{},species:null},
 {id:'freshwater',days:3,names:['淡水腐殖池','Freshwater pool','淡水の腐葉池'],scene:'freshwater',aquatic:true,species:['aquaticus','meridianus','coxalis'],defaults:{flow:30,oxygen:68,light:38,cover:65,detritus:55,salinity:0,tide:100,algae:55},palette:['#273b32','#344439','#4e5140','#68634b'],plants:14,rocks:4,wood:true,motion:['crawl','cling','crawl'],metrics:['flow','oxygen','detritus'],tides:null},
 {id:'intertidal',days:3,names:['潮间带岩池','Intertidal rock pool','潮間帯の潮だまり'],scene:'intertidal',aquatic:true,species:['serratum','pelagica','granulosa'],defaults:{flow:58,oxygen:80,light:62,cover:62,detritus:30,salinity:34,tide:24,algae:35},palette:['#324743','#405552','#69736a','#9b9880'],plants:6,rocks:13,wood:false,motion:['cling','crawl','cling'],metrics:['tide','salinity','flow'],tides:[24,72,94,41,86,58,18,64,90]},
 {id:'shallow-marine',days:3,names:['浅海藻场','Shallow seaweed bed','浅海の藻場'],scene:'shallow-marine',aquatic:true,species:['balthica','emarginata','neglecta'],defaults:{flow:46,oxygen:76,light:54,cover:72,detritus:42,salinity:35,tide:100,algae:78},palette:['#203e3d','#355452','#6d7660','#969375'],plants:24,rocks:5,wood:false,motion:['cling','swim','drift'],metrics:['flow','algae','detritus'],tides:null}
];
export const HABITATS=Object.freeze(configs.map(h=>Object.freeze({...h,encounterPool:h.aquatic?h.id:null,endingPool:h.aquatic?[`${h.id}-calm`,`${h.id}-care`,`${h.id}-trace`]:null})));
export function habitatConfig(value){const id=typeof value==='string'?value:value?.habitatId;return HABITATS.find(h=>h.id===(id||'terrestrial'))||HABITATS[0]}
export function eligibleSpecies(p,id='terrestrial'){const h=habitatConfig(id);return h.species?h.species.includes(p.id):p.game?.habitatEligible!==false}
export function cycleHabitat(id,direction){return HABITATS[(HABITATS.findIndex(h=>h.id===id)+direction+HABITATS.length)%HABITATS.length].id}
export function advanceWater(s){const h=habitatConfig(s);if(!h.aquatic)return;const turn=(s.day-1)*3+s.period;
 if(h.tides)s.tide=h.tides[turn%h.tides.length];
 s.light=[42,70,18][s.period];s.oxygen=Math.max(5,Math.min(100,s.oxygen+(s.flow-35)*.055-(s.detritus-35)*.035));
 s.detritus=Math.max(0,s.detritus-2);s.salinity=Math.max(0,Math.min(42,s.salinity+(h.tides?(s.tide<40?.7:-.4):0)));
}
