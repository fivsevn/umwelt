export function makeBug(species,index=0){
 const bug=document.createElement('span');bug.className=`isobug ${species.shape} ${species.pattern}`;bug.setAttribute('aria-hidden','true');
 ['--shell','--mark','--rim'].forEach((k,i)=>bug.style.setProperty(k,species.colors[i]));bug.style.setProperty('--phase',`${-index*.19}s`);
 bug.innerHTML='<i class="feelers"></i><i class="legs"></i><i class="tail"></i><b class="plates">'+Array.from({length:7},(_,n)=>`<i class="plate p${n}"></i>`).join('')+'</b><i class="head"></i>';
 return bug;
}
