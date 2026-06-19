import { GLOBAL_STYLES } from './global-styles.js';
import { PANEL_STYLES } from './panel-styles.js';

export function injectGlobalStyles(): HTMLStyleElement {
  const existingStyle = document.getElementById('ai-note-global-styles');
  if (existingStyle instanceof HTMLStyleElement) return existingStyle;

  const globalStyle = document.createElement('style');
  globalStyle.id = 'ai-note-global-styles';
  globalStyle.textContent = GLOBAL_STYLES;
  document.head.appendChild(globalStyle);
  return globalStyle;
}

export function injectPanelStyles(canvas: HTMLElement): void {
  const style = document.createElement('style');
  style.textContent = PANEL_STYLES;
  canvas.append(style);
}
