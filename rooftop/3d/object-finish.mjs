// Construction details are placed on the actual parts rather than overlaid noise.
export function finishObject(api, g, type, w, d, h) {
  const { box, beam, cyl, P, shade } = api;
  if (/shelf|stand|plantcart|pottingbench|lowplatform/.test(type)) {
    const wood = /wood|ladder|foam|lowplatform|potting/.test(type);
    const color = wood ? "#9e8051" : "#909f9d";
    if(!["woodshelf","ladderstand"].includes(type))for (const x of [-w*.45, w*.45]) for (const z of [-d*.43, d*.43]) {
      box(g, x, h+.015, z, wood ? .13 : .10, .04, wood ? .13 : .10, color, wood ? "wood" : "metal");
      for (const y of [h*.48, h*.9])
        box(g, x, y, z+.047, .038, .04, .025, color, "metal");
    }
    if (type === "shelf" || type === "wirestand") {
      for (const y of [.18, h*.52, h*.92])
        for (const x of [-w*.48, w*.48])
          box(g, x, y-.07, 0, .045, .09, d*.9, P.metalDark, "metal");
    }
    if (type === "pottingbench") {
      for (const x of [-w*.36, -w*.22, w*.30]) {
        box(g, x, h+.55, -d*.38, .035, .075, .025, P.metalLight);
        beam(g, [x,h+.45,-d*.36], [x,h+.31,-d*.30], .025, P.metalDark);
      }
    }
  }
  if (["table", "bench", "stool", "gardenbench", "foldingchair"].includes(type)) {
    const y = type === "gardenbench" ? h*.50 : type === "foldingchair" ? h*.52 : h;
    for (const z of [-d*.43, d*.43])
      box(g, 0, y-.15, z, w*.93, .16, .075, P.woodDark, "wood");
    for (const x of [-w*.43, w*.43])
      for (const z of [-d*.40, d*.40])
        box(g, x, y+.058, z, .036, .014, .036, "#c2ad80", "metal");
    if (type === "table") {
      for (const x of [-w*.43,w*.43])
        box(g, x, h*.27, 0, .10, .09, d*.85, P.woodDark, "wood");
    }
  }
  if (["crate", "redbox", "fish", "fishbox", "foambox", "mossbox", "seedtray"].includes(type)) {
    const foam = /foam|mossbox/.test(type), color = foam ? P.white : type === "redbox" ? "#a17966" : P.blue;
    for (const z of [-d*.5, d*.5])
      box(g, 0, h+.025, z, w+.10, .065, .10, shade(color,1.12), foam?"enamel":"metal");
    for (const x of [-w*.5, w*.5]) {
      box(g, x, h+.025, 0, .10, .065, d+.10, shade(color,1.12), foam?"enamel":"metal");
      if (!foam) {
        box(g, x*1.045, h*.74, 0, .019, .09, d*.32, P.blueDark);
        box(g, x*1.05, h*.82, 0, .025, .025, d*.36, "#779494");
      }
    }
    for (const x of [-w*.43, w*.43]) for (const z of [-d*.43,d*.43])
      box(g,x,.027,z,.10,.055,.10,shade(color,.8),"metal");
    if (foam) for (const z of [-d*.53,d*.53]) {
      box(g, -w*.21, h*.50, z, w*.23, .045, .013, "#b2b5a0", "enamel");
      box(g, w*.29, h*.31, z, w*.14, .028, .013, "#a4aa96", "enamel");
    }
  }
  if (["storagechest","room-wardrobe","room-dresser"].includes(type)) {
    const front=d*.558;
    if (type === "room-wardrobe") for(const x of [-w*.245,w*.245]) {
      // Raised rails around two recessed fields, with a dark inner rebate.
      for(const y of [h*.34,h*.72]) {
        const height=h*.28,width=w*.365;
        box(g,x,y,front-.005,width,height,.016,"#57432c","wood");
        box(g,x,y,front+.009,width*.89,height*.83,.018,y>h*.5?"#a77c48":"#8e663d","wood");
        for(const xx of [x-width*.52,x+width*.52]) {
          box(g,xx,y,front+.034,.066,height+.07,.072,"#ad8850","wood");
          box(g,xx+.023,y,front+.074,.018,height+.04,.012,"#c4a06a","wood");
        }
        for(const yy of[y-height*.53,y+height*.53]) {
          box(g,x,yy,front+.032,width+.08,.065,.07,"#987444","wood");
          box(g,x,yy+.021,front+.070,width+.04,.016,.012,"#c4a06a","wood");
        }
      }
      for(const y of[h*.23,h*.83])box(g,x+(x<0?-w*.21:w*.21),y,front+.018,.031,.12,.025,"#777364","metal");
      box(g,x+(x<0?.16:-.16),h*.55,front+.075,.045,.11,.04,"#b7a676","metal");
    }
    if(type === "room-dresser") for(let j=0;j<3;j++) {
      const y=h*(.25+j*.29),width=w*.81,height=h*.185;
      box(g,0,y,front-.012,width,height,.014,"#5c462e","wood");
      box(g,0,y,front+.015,width*.94,height*.79,.024,j===2?"#b08a50":"#9a713f","wood");
      box(g,0,y+height*.46,front+.037,width,.025,.022,"#c2a06a","wood");
      box(g,0,y-height*.47,front+.023,width,.03,.02,"#70522e","wood");
      for(const x of [-w*.25,w*.25]) {
        box(g,x,y,front+.038,.14,.065,.021,"#786a48","metal");
        beam(g,[x-.05,y,front+.057],[x-.05,y-.055,front+.08],.018,"#b5a171");
        beam(g,[x+.05,y,front+.057],[x+.05,y-.055,front+.08],.018,"#b5a171");
        beam(g,[x-.05,y-.055,front+.08],[x+.05,y-.055,front+.08],.021,"#b5a171");
      }
    }
    if(type === "storagechest") {
      for(const x of [-w*.30,w*.30]) {
        box(g,x,h+.095,-d*.45,.24,.035,.12,P.metalDark,"metal");
        box(g,x,h*.4,d*.52,.08,h*.72,.024,"#9c865e","metal");
      }
      box(g,0,h*.80,d*.53,.18,.17,.035,P.metal,"metal");
      box(g,0,h*.78,d*.56,.035,.05,.015,P.metalDark);
    }
  }
  if(type === "solarlamp") {
    const y=h*.75;
    for(const x of [-.19,.19]) for(const z of [-.19,.19])
      box(g,x,y,z,.035,.34,.035,P.metalDark,"metal");
    box(g,0,y-.18,0,.45,.05,.45,P.metalDark,"metal");
    cyl(g,0,h*.17,0,.11,.16,.13,P.metalDark,8,"metal");
    cyl(g,0,h*.65,0,.10,.07,.09,P.metalLight,8,"metal");
    for(let j=0;j<3;j++)
      box(g,-.083+j*.083,h*.942,0,.018,.009,.23,"#758b8c");
  }
  if(type === "tasklamp") {
    cyl(g,.22,h*.63,0,.375,.375,.036,P.blueDark,12,"metal");
    box(g,-.22,h*.47,.076,.057,.045,.025,P.metalLight);
    box(g,0,.12,.20,.09,.025,.06,"#a6a996");
  }
  if(type === "tinlantern") {
    cyl(g,0,h*.12,0,w*.38,w*.38,.045,"#656f68",12,"metal");
    cyl(g,0,h*.80,0,w*.37,w*.37,.045,"#b2ad90",12,"metal");
  }
}
