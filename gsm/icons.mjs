// Native SVG UI glyphs and integer-grid avatars, kept editable with this page.
const paths = {
 stream:'M3 4H21V17H10V21H6V17H3ZM7 9H9M11 9H13M15 9H17',
 home:'M3 11V9H6V6H9V3H15V6H18V9H21V11M5 10V21H10V15H14V21H19V10',
 explore:'M9 3H15V5H19V9H21V15H19V19H15V21H9V19H5V15H3V9H5V5H9ZM15 9H11L9 15H13Z',
 bookmark:'M6 3H18V21L12 17L6 21Z',profile:'M9 3H15V5H17V11H15V13H9V11H7V5H9ZM4 22V18H7V16H17V18H20V22',
 reply:'M3 4H21V16H11L6 21V16H3Z',repost:'M4 8H19L15 4M20 16H5L9 20M4 8V13M20 16V11',
 like:'M12 6L9 3H5L2 6V11L12 21L22 11V6L19 3H15Z',plus:'M12 3V21M3 12H21',search:'M4 3H12V5H15V13H12V16H4V13H1V5H4ZM14 15L21 22',
 leaf:'M5 19V11H7V7H12V5H21V11H19V15H15V17H9M3 21L15 9',arrow:'M4 12H20M14 6L20 12L14 18',close:'M5 5L19 19M19 5L5 19',
};
export const icon = name => `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter" aria-hidden="true"><path d="${paths[name] || paths.leaf}"/></svg>`;
// Dock icons use filled integer-grid pixels, rather than stroked UI glyphs.
const navigationSprites = {
 // Small shaded objects share the gecko's contour and top-left light; pink echoes the masthead.
 home: `<path d="M9 2H13V4H15V6H17V4H20V8H21V10H23V12H21V21H4V20H3V12H1V10H3V8H5V6H7V4H9Z" fill="#344c43"/>
  <path d="M18 5H19V9H18Z" fill="#bfd0a5"/>
  <path d="M9 3H12V5H14V7H16V9H18V11H3V10H4V9H6V7H8V5H9Z" fill="#e8afad"/>
  <path d="M12 4H13V5H15V7H17V9H19V10H21V11H18V10H16V8H14V6H12Z" fill="#c47f8e"/>
  <path d="M9 3H12V4H9ZM7 5H9V6H7ZM5 7H7V8H5ZM3 9H5V10H3Z" fill="#fff3d4"/>
  <path d="M8 8H10V9H8ZM12 10H15V11H12ZM4 11H20V12H4Z" fill="#9e5764"/>
  <path d="M5 12H17V20H5Z" fill="#e1dfb4"/>
  <path d="M5 12H17V13H6V19H5Z" fill="#fff3d4"/>
  <path d="M17 12H20V20H17ZM6 19H17V20H6Z" fill="#bfd0a5"/>
  <path d="M19 13H20V20H18V19H19ZM5 20H20V21H5Z" fill="#68816b"/>
  <path d="M7 14H10V17H7ZM12 14H16V20H12Z" fill="#68816b"/>
  <path d="M8 14H10V16H8Z" fill="#fff3d4"/>
  <path d="M13 15H15V20H13Z" fill="#344c43"/>
  <path d="M14 16H15V17H14Z" fill="#e8afad"/>`,
 // Original three-quarter gecko: long snout, raised eye with slit pupil, spotted brow and pale jaw.
 stream: `<path d="M11 3H17V4H20V6H22V9H23V15H22V18H21V21H14V20H11V18H7V17H4V15H2V14H1V10H3V8H6V6H9V4H11Z" fill="#344c43"/>
  <path d="M11 4H17V5H20V7H21V10H22V15H21V17H20V20H15V19H12V17H8V16H5V14H3V13H2V10H4V9H7V7H10V5H11Z" fill="#bfd0a5"/>
  <path d="M11 4H17V5H19V7H14V8H10V10H7V11H3V10H4V9H7V7H10V5H11Z" fill="#e1dfb4"/>
  <path d="M14 6H18V7H20V9H21V12H20V14H17V15H14V14H12V12H11V9H12V7H14Z" fill="#68816b"/>
  <path d="M14 7H18V8H19V10H20V12H19V13H16V14H14V13H13V11H12V9H13V8H14Z" fill="#fff3d4"/>
  <path d="M16 8H18V12H17V13H16Z" fill="#344c43"/>
  <path d="M14 8H15V9H14Z" fill="#ffffff"/>
  <path d="M3 13H6V14H11V15H16V14H19V15H20V18H18V19H15V18H12V17H8V16H5V14H3Z" fill="#fff3d4"/>
  <path d="M3 12H4V13H7V14H13V13H17V14H14V15H7V14H4V13H3Z" fill="#68816b"/>
  <path d="M4 10H5V11H4ZM8 7H10V8H8ZM11 5H13V6H11ZM17 5H19V6H17ZM7 11H9V12H7ZM20 15H21V17H20ZM17 18H19V19H17Z" fill="#68816b"/>`,
 // Eight flat-ended teeth around an open, centered axle hole.
 settings: `<path d="M10 1h4v1H10ZM10 2h1v1H10ZM13 2h1v1H13ZM10 3h1v1H10ZM13 3h1v1H13ZM5 4h2v1H5ZM10 4h1v1H10ZM13 4h1v1H13ZM17 4h2v1H17ZM4 5h1v1H4ZM7 5h3v1H7ZM14 5h3v1H14ZM19 5h1v1H19ZM4 6h1v1H4ZM19 6h1v1H19ZM5 7h1v1H5ZM10 7h4v1H10ZM18 7h1v1H18ZM5 8h1v1H5ZM8 8h3v1H8ZM13 8h3v1H13ZM18 8h1v1H18ZM5 9h1v1H5ZM8 9h1v1H8ZM18 9h1v1H18ZM1 10h4v1H1ZM7 10h2v1H7ZM19 10h4v1H19ZM1 11h1v1H1ZM7 11h1v1H7ZM22 11h1v1H22ZM1 12h1v1H1ZM7 12h1v1H7ZM22 12h1v1H22ZM1 13h4v1H1ZM7 13h2v1H7ZM19 13h4v1H19ZM5 14h1v1H5ZM8 14h1v1H8ZM18 14h1v1H18ZM5 15h1v1H5ZM8 15h1v1H8ZM18 15h1v1H18ZM5 16h1v1H5ZM18 16h1v1H18ZM4 17h1v1H4ZM19 17h1v1H19ZM4 18h1v1H4ZM7 18h3v1H7ZM14 18h3v1H14ZM19 18h1v1H19ZM5 19h2v1H5ZM10 19h1v1H10ZM13 19h1v1H13ZM17 19h2v1H17ZM10 20h1v1H10ZM13 20h1v1H13ZM10 21h1v1H10ZM13 21h1v1H13ZM10 22h4v1H10Z" fill="#344c43"/>
  <path d="M12 3h1v1H12ZM12 4h1v1H12ZM17 5h2v1H17ZM16 6h1v1H16ZM18 6h1v1H18ZM17 7h1v1H17ZM19 11h3v1H19ZM3 12h2v1H3ZM6 16h1v1H6ZM5 17h1v1H5ZM7 17h1v1H7ZM5 18h2v1H5ZM11 19h1v1H11ZM11 20h1v1H11ZM11 21h1v1H11Z" fill="#e8afad"/>
  <path d="M10 5h4v1H10ZM6 6h1v1H6ZM10 6h4v1H10ZM17 6h1v1H17ZM7 7h3v1H7ZM14 7h3v1H14ZM7 8h1v1H7ZM16 8h1v1H16ZM7 9h1v1H7ZM16 9h1v1H16ZM5 10h2v1H5ZM17 10h2v1H17ZM5 11h2v1H5ZM17 11h2v1H17ZM5 12h2v1H5ZM17 12h2v1H17ZM5 13h2v1H5ZM17 13h2v1H17ZM7 14h1v1H7ZM16 14h1v1H16ZM7 15h1v1H7ZM16 15h1v1H16ZM7 16h3v1H7ZM14 16h3v1H14ZM6 17h1v1H6ZM10 17h4v1H10ZM17 17h1v1H17ZM10 18h4v1H10Z" fill="#e1dfb4"/>
  <path d="M11 2h2v1H11ZM11 3h1v1H11ZM11 4h1v1H11ZM5 5h2v1H5ZM5 6h1v1H5ZM7 6h3v1H7ZM14 6h2v1H14ZM6 7h1v1H6ZM6 8h1v1H6ZM6 9h1v1H6ZM15 9h1v1H15ZM15 10h2v1H15ZM2 11h3v1H2ZM16 11h1v1H16ZM2 12h1v1H2ZM16 12h1v1H16ZM15 13h2v1H15ZM6 14h1v1H6ZM15 14h1v1H15ZM6 15h1v1H6ZM9 15h2v1H9ZM13 15h3v1H13ZM10 16h4v1H10Z" fill="#fff3d4"/>
  <path d="M17 8h1v1H17ZM17 9h1v1H17ZM19 12h3v1H19ZM17 14h1v1H17ZM17 15h1v1H17ZM17 16h1v1H17ZM8 17h2v1H8ZM14 17h3v1H14ZM18 17h1v1H18ZM17 18h2v1H17ZM12 19h1v1H12ZM12 20h1v1H12ZM12 21h1v1H12Z" fill="#c47f8e"/>`,
};
export const navigationIcon = name => `<svg class="dock-icon" viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${navigationSprites[name]}</svg>`;
const grids = {
 isopod:['......1..1......','.......11.......','......2222......','.....233332.....','....12333321....','.....222222.....','....12333321....','.....222222.....','....12333321....','.....222222.....','....12333321....','.....233332.....','......2222......'],
 gecko:['....22....22....','...2332222332...','...2313333132...','....23333332....','.....233332.....','...2223333222...','..2..233332..2..','.....233332.....','......2332......','...2223333222...','..2...2332...2..','.......232......','.......232......','........22......','.........222....'],
 snake:['.....22222......','....2333332.....','....2313312.....','.....23332......','.......232......','..222..232......','.23332.232......','.232.22232......','.232.23332......','.232..222.......','.232............','.23322222222....','..23333333332...','...222222222....'],
 snail:['...2.2..........','...323.....222..','...232...223332.','...232..23322332','...232..23233232','...232..23322332','...233222333332.','....2333333332..','.....22222222...'],
 moth:['..22.......22...','..232.....232...','..2332.2.2332...','.2333322233332..','.2331332331332..','.2333332333332..','..23333233332...','...233323332....','...233323332....','....2332332.....','.....22222......','.......2........'],
 plant:['.......22.......','......2332......','..222.2332......','.233322332222...','..233323323332..','...2222333332...','.......23222....','.......232......','...1111111111...','....13333331....','....13333331....','.....111111.....'],
};
export function avatar(profile) {
 const palette = ['transparent','#324f46','#59786a','#b8c49b'];
 const rects = grids[profile.avatar].flatMap((row,y)=>[...row].flatMap((v,x)=>v==='.'?[]:[`<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[Number(v)]}"/>`])).join('');
 return `<span class="avatar ${profile.color}"><svg viewBox="-2 -2 20 20" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg></span>`;
}
