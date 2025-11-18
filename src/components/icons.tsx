import type { SVGProps } from 'react';

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <span {...props} style={{ fontSize: props.height, display: 'inline-block' }}>⚡</span>
  ),
};
