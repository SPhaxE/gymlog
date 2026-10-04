/** 导航与界面图标：24×24 实心几何，颜色跟随 currentColor */
const PATHS: Record<string, string> = {
  home: 'M4 11.2 12 4l8 7.2V20h-5.2v-5.4H9.2V20H4z',
  body: 'M12 2.6a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2zM6.4 9h11.2l-.6 2.2-3.2 1V16l1.6 6h-2.3L12 17.2 10.9 22H8.6l1.6-6v-3.8l-3.2-1z',
  gains: 'M3 18.5 9.2 12l3.6 3.6L19 9.3V13h2V6h-7v2h3.6l-4.8 4.8L9.2 9.2 1.6 17.1z',
  log: 'M5 3h14v18H5zm3 4v2h8V7zm0 4v2h8v-2zm0 4v2h5v-2z',
  me: 'M12 3.2a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4zM4 20.5c.6-4 3.8-6.6 8-6.6s7.4 2.6 8 6.6z',
  close: 'M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z',
};
export type IconName = keyof typeof PATHS;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={PATHS[name]} fillRule="evenodd" /></svg>;
}
