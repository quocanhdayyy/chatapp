import { Text } from 'react-native';
export type VideoContentProps = { uri: string; name: string };
export default function VideoContent({ name }: VideoContentProps) { return <Text>{name}: trình phát này dành cho bản web.</Text>; }
