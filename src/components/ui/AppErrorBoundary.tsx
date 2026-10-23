import { Component, type PropsWithChildren } from 'react';
import { ErrorState } from './StateViews';

export default class AppErrorBoundary extends Component<PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <ErrorState message="Giao diện gặp lỗi. Bạn có thể thử mở lại." onRetry={() => this.setState({ failed: false })} />;
    return this.props.children;
  }
}
