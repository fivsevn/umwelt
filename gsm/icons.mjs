// Filled integer-grid heart glyphs shared by the stream and settings page.
const heartOutline = 'M4 4H10V6H14V4H20V6H22V14H20V16H18V18H16V20H14V22H10V20H8V18H6V16H4V14H2V6H4Z';
const heartCore = 'M4 6H8V8H16V6H20V12H18V14H16V16H14V18H10V16H8V14H6V12H4Z';

export const likeIcon = () => `<svg class="ui-icon pixel-heart" viewBox="0 0 24 24" fill="currentColor" stroke="none" shape-rendering="crispEdges" aria-hidden="true"><path fill-rule="evenodd" d="${heartOutline} ${heartCore}"/><path class="heart-core" d="${heartCore}"/></svg>`;

export const commentIcon = () => `<svg class="ui-icon" viewBox="0 0 24 24" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true"><path fill-rule="evenodd" d="M4 3H20V5H22V17H20V19H10V21H6V19H4V17H2V5H4ZM4 5V17H8V19H10V17H20V5Z"/></svg>`;
