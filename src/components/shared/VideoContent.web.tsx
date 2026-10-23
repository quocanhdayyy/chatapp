export type VideoContentProps = { uri: string; name: string };

export default function VideoContent({ uri, name }: VideoContentProps) {
  return <video src={uri} controls playsInline preload="metadata" aria-label={name} style={{ width: '100%', height: '100%', objectFit: 'contain' }}><track kind="captions" /></video>;
}
