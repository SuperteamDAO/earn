import { LuArrowRight, LuFile, LuLandmark, LuZap } from 'react-icons/lu';

import { type TSXTYPE } from '../utils';

export const TsxTypeIcon: React.FC<{ type: TSXTYPE }> = ({
  type,
  ...props
}) => {
  const IconComponent = (() => {
    switch (type) {
      case 'st-earn':
        return LuZap;
      case 'grants':
        return LuLandmark;
      case 'miscellaneous':
        return LuFile;
      case 'all':
      default:
        return LuArrowRight;
    }
  })();

  return <IconComponent {...props} />;
};
