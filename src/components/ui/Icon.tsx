import Svg, { Path } from 'react-native-svg';
import { theme } from '../../core/theme';

const paths = {
  thumb: 'M7 10H3v11h4V10Zm0 0 5-8a3 3 0 0 1 2 3l-1 5h6a2 2 0 0 1 2 2l-2 7a3 3 0 0 1-3 2H7',
  down: 'm6 9 6 6 6-6',
  share: 'M14 3v5C6 8 3 12 3 20c2-5 5-7 11-7v5l8-7-8-8Z',
  more: 'M5 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm7 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm7 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z',
  camera: 'M3 7h4l2-3h6l2 3h4v13H3V7Zm13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  map: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  briefcase: 'M8 7V3h8v4M3 7h18v14H3V7Zm0 6h18m-11 0v3h4v-3',
  school: 'm2 9 10-5 10 5-10 5L2 9Zm4 2v7l6 3 6-3v-7m4-2v8',
  mail: 'M3 5h18v14H3V5Zm0 0 9 8 9-8',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  home: 'M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
  users: 'M15 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM3 21v-2a7 7 0 0 1 14 0v2M18 4a4 4 0 0 1 0 8m1 3a6 6 0 0 1 3 5v1',
  search: 'M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
  plus: 'M12 5v14M5 12h14',
  image: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM3 16l6-6 5 5 3-3 4 4M16 7h.01',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  comment: 'M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.5a9 9 0 0 1-.9-4A8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5Z',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  back: 'M20 12H4m6-6-6 6 6 6',
  chevron: 'm9 5 7 7-7 7',
  logout: 'M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4m6-13 5 5-5 5M8 12h12',
  refresh: 'M20 7v5h-5M4 17v-5h5M5.5 7a7.5 7.5 0 0 1 12.4-2L20 8M4 16l2.1 3a7.5 7.5 0 0 0 12.4-2',
  edit: 'm15 5 4 4M4 20l4-1 12-12a2.8 2.8 0 0 0-4-4L4 15l-1 6 6-1',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
  spark: 'm12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7L12 2Z',
  leaf: 'M20 3C8 2 2 8 6 15s16 4 14-12ZM5 21 17 8',
  check: 'm5 12 4 4L19 6',
  close: 'm6 6 12 12M6 18 18 6',
  lock: 'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5V10Zm7 4v3',
} as const;

export type IconName = keyof typeof paths;

export default function Icon({ name, size = 20, color = theme.colors.text, filled = false }: { name: IconName; size?: number; color?: string; filled?: boolean }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <Path d={paths[name]} stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" fill={filled ? color : 'none'} />
  </Svg>;
}
