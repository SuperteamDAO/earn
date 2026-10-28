export const ApprovalStageConnectingLine = ({
  isStartComplete,
  isEndComplete,
}: {
  isStartComplete: boolean;
  isEndComplete: boolean;
}) => (
  <div className="absolute top-9 left-4 h-12 w-1">
    {isStartComplete && isEndComplete ? (
      <div className="h-full bg-green-600" />
    ) : isStartComplete ? (
      <>
        <div className="h-1/3 bg-green-600" />
        <div className="h-2/3 bg-slate-200" />
      </>
    ) : (
      <div className="h-full bg-slate-200" />
    )}
  </div>
);
