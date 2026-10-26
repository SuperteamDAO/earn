import * as React from 'react';

import { useContainerSize } from '../hooks/use-container-size';

interface MeasuredContainerProps<T extends React.ElementType> {
  as: T;
  name: string;
  children?: React.ReactNode;
}

export const MeasuredContainer = React.forwardRef(
  <T extends React.ElementType>(
    {
      as: Component,
      name,
      children,
      style = {},
      ...props
    }: MeasuredContainerProps<T> & React.ComponentProps<T>,
    ref: React.Ref<HTMLElement>,
  ) => {
    const innerRef = React.useRef<HTMLElement>(null);
    const rect = useContainerSize(innerRef);

    // Callers read the handle after mount, when the element is there.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- forwardRef's handle type has no null
    React.useImperativeHandle(ref, () => innerRef.current as HTMLElement);

    const customStyle = {
      [`--${name}-width`]: `${rect.width}px`,
      [`--${name}-height`]: `${rect.height}px`,
    };

    return (
      <Component {...props} ref={innerRef} style={{ ...customStyle, ...style }}>
        {children}
      </Component>
    );
  },
);

MeasuredContainer.displayName = 'MeasuredContainer';
