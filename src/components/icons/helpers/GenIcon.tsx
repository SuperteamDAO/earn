import { createElement } from 'react';

import { DefaultContext, IconContext } from './IconContext';

export interface IconTree {
  tag: string;
  attr: { [key: string]: string };
  child?: IconTree[];
}

function Tree2Element(tree?: IconTree[]): React.ReactElement[] | undefined {
  return (
    tree &&
    tree.map((node, i) =>
      createElement(
        node.tag,
        { key: i, ...node.attr },
        Tree2Element(node.child),
      ),
    )
  );
}

export function GenIcon(data: IconTree) {
  return function IconComponent(props: IconBaseProps) {
    return (
      <IconBase attr={{ ...data.attr }} {...props}>
        {Tree2Element(data.child)}
      </IconBase>
    );
  };
}

export interface IconBaseProps extends React.SVGAttributes<SVGElement> {
  children?: React.ReactNode;
  size?: string | number;
  color?: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

export type IconType = (props: IconBaseProps) => React.ReactNode;
export function IconBase(
  props: IconBaseProps & { attr?: Record<string, string> },
): React.JSX.Element {
  const elem = (conf: IconContext) => {
    const { attr, size, title, ...svgProps } = props;
    const computedSize = size || conf.size || '1em';
    let className;
    if (conf.className) className = conf.className;
    if (props.className)
      className = (className ? className + ' ' : '') + props.className;

    return (
      <svg
        stroke="currentColor"
        fill="currentColor"
        strokeWidth="0"
        {...conf.attr}
        {...attr}
        {...svgProps}
        className={className}
        style={{
          color: props.color || conf.color,
          ...conf.style,
          ...props.style,
        }}
        height={computedSize}
        width={computedSize}
        xmlns="http://www.w3.org/2000/svg"
      >
        {title && <title>{title}</title>}
        {props.children}
      </svg>
    );
  };

  return IconContext !== undefined ? (
    <IconContext.Consumer>
      {(conf: IconContext) => elem(conf)}
    </IconContext.Consumer>
  ) : (
    elem(DefaultContext)
  );
}
