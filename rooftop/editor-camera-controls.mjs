import { stationActionGlyph } from './observer-ui.mjs';

// The two editor pages use the same view controls, independently of placement.
export function attachEditorCameraControls(host, onAction) {
  if (!host) return;
  host.className = 'edit-camera-controls';
  host.setAttribute('role', 'group');
  host.setAttribute('aria-label', '场景视角');
  const groups = [
    ['camera-pan', '移动视角', [['left','向左移动','left'],['up','向前移动','up'],['down','向后移动','down'],['right','向右移动','right']]],
    ['camera-zoom', '视角远近', [['near','拉近','near'],['far','拉远','far']]],
    ['camera-orbit', '转向与复位', [['turn-left','向左转','↶'],['turn-right','向右转','↷'],['reset','复位','复位']]],
  ];
  host.replaceChildren();
  for (const [className, label, actions] of groups) {
    const group = document.createElement('div');
    group.className = className;
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', label);
    for (const [action, name, icon] of actions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.editCamera = action;
      button.setAttribute('aria-label', name);
      button.title = name;
      if (action === 'reset' || action.startsWith('turn-')) button.textContent = icon;
      else button.textContent = stationActionGlyph(action);
      button.onclick = () => onAction(action);
      group.append(button);
    }
    host.append(group);
  }
}
