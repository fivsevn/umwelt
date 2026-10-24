// Filled integer-grid glyphs shared by the stream and settings page.
const navigationSprites = Object.freeze({
  // Stepped roof with one open doorway.
  home: '<path d="M10 2H14V4H16V6H18V8H20V10H22V12H20V22H14V16H10V22H4V12H2V10H4V8H6V6H8V4H10Z"/>',

  // Left-facing gecko: long mouth, raised eye and a slit pupil.
  stream: '<path fill-rule="evenodd" d="M12 2H18V4H20V6H22V18H20V22H14V20H10V18H6V16H2V14H12V12H2V10H4V8H8V6H10V4H12Z M14 6H18V8H20V12H18V14H14V12H12V8H14Z M16 8H18V12H16Z"/>',

  // Eight broad teeth and a square axle opening.
  settings: '<path fill-rule="evenodd" d="M10 2H14V6H16V4H20V8H18V10H22V14H18V16H20V20H16V18H14V22H10V18H8V20H4V16H6V14H2V10H6V8H4V4H8V6H10Z M10 10H14V14H10Z"/>',
});

const heartOutline = 'M4 4H10V6H14V4H20V6H22V14H20V16H18V18H16V20H14V22H10V20H8V18H6V16H4V14H2V6H4Z';
const heartCore = 'M4 6H8V8H16V6H20V12H18V14H16V16H14V18H10V16H8V14H6V12H4Z';

export const likeIcon = () => `<svg class="ui-icon pixel-heart" viewBox="0 0 24 24" fill="currentColor" stroke="none" shape-rendering="crispEdges" aria-hidden="true"><path fill-rule="evenodd" d="${heartOutline} ${heartCore}"/><path class="heart-core" d="${heartCore}"/></svg>`;
export const navigationIcon = name => `<svg class="dock-icon" viewBox="0 0 24 24" fill="currentColor" stroke="none" shape-rendering="crispEdges" aria-hidden="true">${navigationSprites[name]}</svg>`;
