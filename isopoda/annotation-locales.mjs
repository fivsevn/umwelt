const copy={
  magicPotion:{
    en:[
      'The scientific name has not changed. What changed are the spots the players chose to preserve.',
      'White, yellow, and black have been fixed into a “potion” that never flows.'
    ],
    ja:[
      '正式な学名は変わらない。変わったのは、プレイヤーが選び残した斑点のほうだ。',
      '白、黄、黒は、流れることのない一本の「ポーション」に固定された。'
    ]
  }
};

const labels={zh:'注记',en:'Annotation',ja:'注記'};

export function annotationLabel(lang='zh'){
  return labels[lang]||labels.zh;
}

export function localizedAnnotationLines(species,lang='zh',fallback=[]){
  if(lang==='zh')return fallback;
  return copy[species?.id]?.[lang]||fallback;
}
