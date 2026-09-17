const STORAGE_KEY='isopoda-ui-language-v1';
export const SUPPORTED_LANGUAGES=['zh','en','ja'];

const copy={
 zh:{
  documentTitle:'ISOPODA FUGUE / 等足目赋格',documentDescription:'等足目赋格。世界并不因为被看见，才开始发生。',titleBar:'ISOPODA / 等足目赋格',closeReturn:'关闭窗口，返回桌面',habitatAria:'饲养环境',newObservation:'新建观察',continueObservation:'继续观察',waitingSpecimens:'等待放入的个体',startObservation:'开始观察',habitatWindow:'ISOPODA / 饲养盒',minimizeWindow:'最小化饲养窗口',restoreWindow:'还原饲养窗口',maximizeWindow:'全屏饲养窗口',closeWindow:'关闭饲养窗口，返回首页',systemActions:'系统操作',language:'语言',music:'音乐',musicPlaceholder:'音乐开关占位',soundOn:'开启音效',soundOff:'关闭音效',soundUnavailable:'声音暂不可用',speed16:'饲养箱 16 倍速',speed64:'饲养箱 64 倍极速',environmentStatus:'饲养环境状态',habitatCanvas:'七只鼠妇的饲养盒；可拖动观察',speciesStatus:'当前鼠妇品种；点击只切换品种名称显示语言',archive:'阿西莫夫的资料库',zoomOut:'缩小观察',zoomIn:'放大观察',zoomReset:'复位观察',roundChoices:'本轮选择',journal:'本轮笔记',holdMoment:'先留在这一刻',sevenDayObservation:'七日观察',asimovMessage:'阿西莫夫的留言',restart:'再等一次偶然',viewArchive:'查看资料库',sources:'来源 / Credits',close:'关闭',specimens:'标本',previousPage:'上一页',nextPage:'下一页',recordLater:'后来',recordNow:'此刻',closeGently:'轻轻合上 →',later:'稍后 · {time} →',viewEnding:'查看结局',emptyEnding:'空白也有它的时间。',journalTitle:'阿西莫夫的笔记',journalEmpty:'这一页还没有写下什么。',journalEntry:'第 {day} 日 · {time}',sourceBack:'回到所见之物',storageNotice:'纸页暂时留不住；这一次仍可以走完。',dayNumber:'第 {day} 日',creditsLoading:'正在载入…',creditsError:'加载失败，请关闭后重试。',catalogSpecimen:'标本 / {id}',catalogReferenceType:'档案类型  海洋参考标本',catalogCollectionDate:'采集日期 {date}',catalogUnrecorded:'未记录',catalogAlias:'也有人叫它 {names}',catalogMorph:'{value} · 色型',catalogLocality:'{value} · 产地系',catalogLineage:'{value} · 培养线',catalogMarine:'MARINE REFERENCE · 海洋物种，不进入陆生饲养盒抽取。',catalogUncertain:'名字暂时写在这里，身份仍留有余地。',catalogUnseen:'未见之物，仍在发生。',englishName:'英名 · {name}'
 },
 en:{
  documentTitle:'ISOPODA FUGUE',documentDescription:'An isopod fugue. The world does not begin only when it is observed.',titleBar:'ISOPODA / Isopod Fugue',closeReturn:'Close window and return to desktop',habitatAria:'Habitat enclosure',newObservation:'New observation',continueObservation:'Continue observation',waitingSpecimens:'Specimens awaiting introduction',startObservation:'Begin observation',habitatWindow:'ISOPODA / Habitat',minimizeWindow:'Minimize habitat window',restoreWindow:'Restore habitat window',maximizeWindow:'Fullscreen habitat window',closeWindow:'Close habitat window and return home',systemActions:'System controls',language:'Language',music:'Music',musicPlaceholder:'Music toggle placeholder',soundOn:'Enable sound',soundOff:'Disable sound',soundUnavailable:'Sound is unavailable',speed16:'Habitat 16× speed',speed64:'Habitat 64× speed',environmentStatus:'Habitat conditions',habitatCanvas:'Habitat enclosure with seven isopods; drag to observe',speciesStatus:'Current isopod species; click to cycle only the species-name language',archive:'Asimov Archive',zoomOut:'Zoom out',zoomIn:'Zoom in',zoomReset:'Reset view',roundChoices:'Choices for this observation',journal:'Observation notes',holdMoment:'Stay with this moment',sevenDayObservation:'Seven-day observation',asimovMessage:'A note from Asimov',restart:'Wait for another chance',viewArchive:'Open archive',sources:'Sources / Credits',close:'Close',specimens:'Specimens',previousPage:'Previous page',nextPage:'Next page',recordLater:'Afterward',recordNow:'Now',closeGently:'Close the notebook →',later:'Later · {time} →',viewEnding:'View epilogue',emptyEnding:'Blank space has its own time.',journalTitle:'Asimov Notes',journalEmpty:'Nothing has been written on this page yet.',journalEntry:'Day {day} · {time}',sourceBack:'Back to observed material',storageNotice:'This page cannot be saved right now; this observation can still be completed.',dayNumber:'Day {day}',creditsLoading:'Loading…',creditsError:'Could not load. Close this panel and try again.',catalogSpecimen:'SPECIMEN / {id}',catalogReferenceType:'Archive type  marine reference specimen',catalogCollectionDate:'Collection date {date}',catalogUnrecorded:'not recorded',catalogAlias:'Also known as {names}',catalogMorph:'{value} · morph',catalogLocality:'{value} · locality line',catalogLineage:'{value} · culture line',catalogMarine:'MARINE REFERENCE · Marine species; excluded from the terrestrial habitat draw.',catalogUncertain:'The name stays provisional here; the identification does too.',catalogUnseen:'What has not been seen is still happening.',englishName:'English name · {name}'
 },
 ja:{
  documentTitle:'ISOPODA FUGUE / 等脚目フーガ',documentDescription:'等脚目のフーガ。世界は、観察されたときに初めて始まるわけではない。',titleBar:'ISOPODA / 等脚目フーガ',closeReturn:'ウィンドウを閉じてデスクトップへ戻る',habitatAria:'飼育環境',newObservation:'新しい観察',continueObservation:'観察を続ける',waitingSpecimens:'導入を待つ個体',startObservation:'観察を始める',habitatWindow:'ISOPODA / 飼育ケース',minimizeWindow:'飼育ウィンドウを最小化',restoreWindow:'飼育ウィンドウを元に戻す',maximizeWindow:'飼育ウィンドウを全画面表示',closeWindow:'飼育ウィンドウを閉じてホームへ戻る',systemActions:'システム操作',language:'言語',music:'音楽',musicPlaceholder:'音楽切替（準備中）',soundOn:'効果音をオン',soundOff:'効果音をオフ',soundUnavailable:'効果音は現在利用できません',speed16:'飼育ケース 16倍速',speed64:'飼育ケース 64倍速',environmentStatus:'飼育環境の状態',habitatCanvas:'7匹のワラジムシ類を観察する飼育ケース。ドラッグして観察できます',speciesStatus:'現在の種名。クリックすると種名表示の言語だけを切り替えます',archive:'アシモフ資料庫',zoomOut:'縮小',zoomIn:'拡大',zoomReset:'表示をリセット',roundChoices:'今回の選択',journal:'今回の観察メモ',holdMoment:'もう少し、この瞬間にいる',sevenDayObservation:'7日間の観察',asimovMessage:'アシモフからのメモ',restart:'もう一度、偶然を待つ',viewArchive:'資料庫を見る',sources:'出典 / Credits',close:'閉じる',specimens:'標本',previousPage:'前のページ',nextPage:'次のページ',recordLater:'その後',recordNow:'いま',closeGently:'静かに閉じる →',later:'あとで · {time} →',viewEnding:'Epilogueを見る',emptyEnding:'空白にも、それ自身の時間がある。',journalTitle:'アシモフのノート',journalEmpty:'このページには、まだ何も書かれていない。',journalEntry:'{day}日目 · {time}',sourceBack:'観察資料へ戻る',storageNotice:'いまは記録を保存できませんが、この観察は最後まで続けられます。',dayNumber:'{day}日目',creditsLoading:'読み込み中…',creditsError:'読み込めませんでした。閉じてから、もう一度お試しください。',catalogSpecimen:'標本 / {id}',catalogReferenceType:'資料種別  海生参考標本',catalogCollectionDate:'採集日 {date}',catalogUnrecorded:'記録なし',catalogAlias:'別名 {names}',catalogMorph:'{value} · モルフ',catalogLocality:'{value} · 産地系',catalogLineage:'{value} · 飼育系統',catalogMarine:'MARINE REFERENCE · 海生種の参考標本。陸生飼育ケースの抽選対象外。',catalogUncertain:'名前は仮置きのまま。分類上の同定にも余地が残る。',catalogUnseen:'まだ見ていないものも、起こり続けている。',englishName:'英名 · {name}'
 }
};

const specimenLocale={
 spinicornis:{
  en:{name:'Painted Woodlouse'},
  ja:{name:null,englishName:'Painted Woodlouse'},
  literature:{
   en:['The yellow is not scattered at random; it traces a direction along the dark midline.','It looks as though someone painted it. Its English common name simply says so: Painted Woodlouse.'],
   ja:['黄色は背中に無造作に散っているのではなく、暗い正中線に沿って方向を描いている。','まるで彩色されたように見える。そのため英名は、そのまま Painted Woodlouse と呼ばれる。']
  }
 }
};

function normalize(value){return SUPPORTED_LANGUAGES.includes(value)?value:'zh'}
let language=normalize((()=>{try{return localStorage.getItem(STORAGE_KEY)}catch{return null}})());

export function getLanguage(){return language}
export function t(key,vars={},lang=language){
 const table=copy[normalize(lang)]||copy.zh;let value=table[key]??copy.zh[key]??key;
 for(const [name,replacement] of Object.entries(vars))value=value.replaceAll(`{${name}}`,String(replacement));
 return value;
}

function setDocumentLanguage(){
 const html=document.documentElement;html.dataset.uiLanguage=language;html.lang=language==='zh'?'zh-CN':language;
 document.title=t('documentTitle');const description=document.querySelector('meta[name="description"]');if(description)description.content=t('documentDescription');
}

const textBindings=[
 ['#titleCard .window-title span','titleBar'],['#startBtn','newObservation'],['#continueBtn','continueObservation'],['#arrivalCard .panel-caption','waitingSpecimens'],['#settleBtn','startObservation'],['#activityLabel','habitatWindow'],['#nextBtn','holdMoment'],['#endCard .ending-date span:last-child','sevenDayObservation'],['#endCard .afterword .panel-caption','asimovMessage'],['#restartBtn','restart'],['#endingCatalogBtn','viewArchive'],['#specimensTab','specimens']
];
const attributeBindings=[
 ['.launch-close','aria-label','closeReturn'],['#emptyHabitat','aria-label','habitatAria'],['#windowMinimize','aria-label','minimizeWindow'],['#windowMaximize','aria-label','maximizeWindow'],['#windowClose','aria-label','closeWindow'],['.window-system-menu','aria-label','systemActions'],['.language-menu','aria-label','language'],['#musicBtn','aria-label','music'],['#musicBtn','title','musicPlaceholder'],['#soundBtn','aria-label','soundOn'],['#soundBtn','title','soundOn'],['#speedFastBtn','aria-label','speed16'],['#speedTurboBtn','aria-label','speed64'],['#instruments','aria-label','environmentStatus'],['#habitat','aria-label','habitatCanvas'],['#speciesStatus','aria-label','speciesStatus'],['#catalogBtn','aria-label','archive'],['#zoomOut','aria-label','zoomOut'],['#zoomIn','aria-label','zoomIn'],['#zoomReset','aria-label','zoomReset'],['#actions','aria-label','roundChoices'],['#journalBtn','aria-label','journal'],['#sourcesBtn','aria-label','sources'],['#closeDrawer','aria-label','close'],['#pagePrev','aria-label','previousPage'],['#pageNext','aria-label','nextPage']
];

export function applyStaticTranslations(){
 setDocumentLanguage();
 for(const [selector,key] of textBindings){const el=document.querySelector(selector);if(el)el.textContent=t(key)}
 for(const [selector,attribute,key] of attributeBindings){document.querySelectorAll(selector).forEach(el=>el.setAttribute(attribute,t(key)))}
 document.querySelectorAll('[data-system-lang]').forEach(button=>{
  const lang=button.dataset.systemLang;button.setAttribute('aria-label',lang==='zh'?'中文':lang==='en'?'English':'日本語');
 });
}

export function setLanguage(next,{announce=true}={}){
 const value=normalize(next);language=value;
 try{localStorage.setItem(STORAGE_KEY,value)}catch{}
 applyStaticTranslations();
 if(announce)window.dispatchEvent(new CustomEvent('isopoda:languagechange',{detail:{language:value}}));
 return value;
}

export function formatDate(value,lang=language){
 if(!value)return t('catalogUnrecorded',{},lang);
 const match=String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);if(!match)return String(value);
 const [,year,month,day]=match;if(lang==='zh')return `${year}-${month}-${day}`;if(lang==='ja')return `${Number(year)}年${Number(month)}月${Number(day)}日`;
 const date=new Date(Number(year),Number(month)-1,Number(day),12);return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(date);
}

export function formatShortDate(date,lang=language){
 const year=date.getFullYear(),month=date.getMonth()+1,day=date.getDate();
 if(lang==='zh')return `${String(month).padStart(2,'0')}/${String(day).padStart(2,'0')}`;
 if(lang==='ja')return `${month}月${day}日`;
 return new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short'}).format(date);
}

function scientificName(species){return species?.taxonomy?.acceptedScientificName||species?.taxon||species?.trade?.designation||species?.id||'—'}
export function speciesPrimaryName(species,lang=language){
 if(!species)return '—';const locale=specimenLocale[species.id]?.[lang];
 if(lang==='zh')return species.names?.zhCN||species.name||scientificName(species);
 if(locale?.name)return locale.name;
 if(lang==='en'){
  if(species.trade?.tradeName)return species.trade.tradeName;
  if(species.names?.en&&['vernacular','hobby_vernacular','trade_name','taxon_label'].includes(species.names.enNameType))return species.names.en;
  return scientificName(species);
 }
 if(species.names?.ja)return species.names.ja;
 if(species.trade?.tradeName)return species.trade.tradeName;
 return scientificName(species);
}

export function speciesSecondaryName(species,lang=language){
 if(!species)return '';
 if(lang==='zh')return species.label||species.names?.en||'';
 if(lang==='en')return '';
 const locale=specimenLocale[species.id]?.ja;if(locale?.englishName)return t('englishName',{name:locale.englishName},'ja');
 if(species.names?.en&&['vernacular','hobby_vernacular','trade_name'].includes(species.names.enNameType))return t('englishName',{name:species.names.en},'ja');
 return '';
}

export function speciesLiteratureLines(species,lang=language){
 if(lang==='zh')return species?.literature?.lines||[];
 return specimenLocale[species?.id]?.literature?.[lang]||species?.literature?.lines||[];
}

setDocumentLanguage();
