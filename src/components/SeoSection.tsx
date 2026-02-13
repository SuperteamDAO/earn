interface SeoSectionItem {
  heading: string;
  content: string;
}

interface SeoSectionProps {
  readonly sections: SeoSectionItem[];
}

export function SeoSection({ sections }: SeoSectionProps) {
  return (
    <div className="mx-auto mt-10 mb-6 max-w-7xl px-2 lg:px-6">
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.heading}>
            <h2 className="text-lg font-semibold text-slate-800">
              {section.heading}
            </h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-500">
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
