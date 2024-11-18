import { Plus } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  MultiSelect,
  type MultiSelectRef,
  type Option,
} from '@/components/ui/multi-select';
import {
  type ParentSkills,
  type Skills,
  skillSubSkillMap,
  type SubSkillsType,
} from '@/interface/skills';

const SELECTABLE_PARENTS = [
  'Frontend',
  'Backend',
  'Blockchain',
  'Mobile',
] as const;
type SelectableParent = (typeof SELECTABLE_PARENTS)[number];

const MAX_SUGGESTIONS = 6;

interface SkillsSelectProps {
  defaultValue?: Skills;
  onChange: (skills: Skills) => void;
  className?: string;
}

const convertSkillsToOptions = (skills: Skills): Option[] => {
  const options: Option[] = [];

  skills.forEach(({ skills: parentSkill, subskills }) => {
    const isSelectableParent = SELECTABLE_PARENTS.includes(
      parentSkill as SelectableParent,
    );

    if (isSelectableParent) {
      options.push({
        label: parentSkill,
        value: `parent:${parentSkill}`,
        group: 'Dev Skills',
      });
    }

    subskills.forEach((subskill) => {
      const parentSkillMap = skillSubSkillMap[parentSkill];
      const subskillData = parentSkillMap.find((s) => s.value === subskill);
      if (subskillData) {
        options.push({
          label: subskillData.label,
          value: `${parentSkill}:${subskill}`,
          group: parentSkill,
        });
      }
    });
  });

  return options;
};

export const SkillsSelect = React.forwardRef<MultiSelectRef, SkillsSelectProps>(
  ({ defaultValue = [], onChange, className }, ref) => {
    const [uiSkills, setUiSkills] = React.useState<Option[]>(
      convertSkillsToOptions(defaultValue),
    );
    const [backendSkills, setBackendSkills] =
      React.useState<Skills>(defaultValue);

    const getSelectableOptions = React.useMemo(() => {
      const options: Option[] = [];

      SELECTABLE_PARENTS.forEach((parent) => {
        options.push({
          label: parent,
          value: `parent:${parent}`,
          group: 'Dev Skills',
        });

        skillSubSkillMap[parent].forEach(({ label, value }) => {
          if (value !== 'Other') {
            options.push({
              label,
              value: `${parent}:${value}`,
              group: parent,
            });
          }
        });
      });

      Object.entries(skillSubSkillMap).forEach(([parent, subskills]) => {
        if (
          !SELECTABLE_PARENTS.includes(parent as SelectableParent) &&
          parent !== 'Other'
        ) {
          subskills.forEach(({ label, value }) => {
            if (value !== 'Other') {
              options.push({
                label,
                value: `${parent}:${value}`,
                group: parent,
              });
            }
          });
        }
      });

      skillSubSkillMap.Other.forEach(({ label, value }) => {
        options.push({
          label,
          value: `Other:${value}`,
          group: 'Other Skills',
        });
      });

      return options;
    }, []);

    const transformToBackendSkills = React.useCallback(
      (options: Option[]): Skills => {
        const skillMap = new Map<ParentSkills, Set<SubSkillsType>>();
        const parentSkills = new Set<ParentSkills>();

        options.forEach((option) => {
          const [prefix, value] = option.value.split(':');

          if (prefix === 'parent') {
            const isSelectableParent = SELECTABLE_PARENTS.includes(
              value as SelectableParent,
            );
            if (isSelectableParent) {
              parentSkills.add(value as ParentSkills);
              if (!skillMap.has(value as ParentSkills)) {
                skillMap.set(value as ParentSkills, new Set());
              }
            }
          } else {
            const parentSkill = prefix as ParentSkills;
            if (!skillMap.has(parentSkill)) {
              skillMap.set(parentSkill, new Set());
            }
            skillMap.get(parentSkill)?.add(value as SubSkillsType);

            // Auto-add parent in backend state
            if (
              SELECTABLE_PARENTS.includes(parentSkill as SelectableParent) &&
              !parentSkills.has(parentSkill)
            ) {
              parentSkills.add(parentSkill);
            }
          }
        });

        const skills: Skills = [];
        skillMap.forEach((subskills, parentSkill) => {
          if (subskills.size > 0 || parentSkills.has(parentSkill)) {
            skills.push({
              skills: parentSkill,
              subskills: Array.from(subskills),
            });
          }
        });

        return skills;
      },
      [],
    );

    const handleChange = (options: Option[]) => {
      setUiSkills(options);
      const newBackendSkills = transformToBackendSkills(options);
      setBackendSkills(newBackendSkills);
      onChange(newBackendSkills);
    };

    const handleSuggestionClick = (suggestion: Option) => {
      handleChange([...uiSkills, suggestion]);
    };

    const getSuggestions = React.useCallback((): Option[] => {
      const suggestions: Option[] = [];
      const selectedValues = new Set(uiSkills.map((opt) => opt.value));

      const addSuggestion = (option: Option) => {
        if (
          !selectedValues.has(option.value) &&
          suggestions.length < MAX_SUGGESTIONS
        ) {
          suggestions.push(option);
        }
      };

      if (backendSkills.length === 0) {
        addSuggestion({
          label: 'Frontend',
          value: 'parent:Frontend',
          group: 'Dev Skills',
        });
        addSuggestion({
          label: 'Backend',
          value: 'parent:Backend',
          group: 'Dev Skills',
        });
        addSuggestion({
          label: 'UI/UX Design',
          value: 'Design:UI/UX Design',
          group: 'Design',
        });
        addSuggestion({
          label: 'Community Manager',
          value: 'Community:Community Manager',
          group: 'Community',
        });
        addSuggestion({
          label: 'Digital Marketing',
          value: 'Growth:Digital Marketing',
          group: 'Growth',
        });
        addSuggestion({
          label: 'Writing',
          value: 'Content:Writing',
          group: 'Content',
        });
        return suggestions;
      }

      const categories = new Map<string, Set<string>>();
      backendSkills.forEach(({ skills: parentSkill, subskills }) => {
        categories.set(parentSkill, new Set(subskills));
      });

      backendSkills.forEach(({ skills: parentSkill, subskills }) => {
        if (
          ['Frontend', 'Backend', 'Blockchain', 'Mobile'].includes(parentSkill)
        ) {
          ['Frontend', 'Backend', 'Blockchain', 'Mobile'].forEach((skill) => {
            if (!categories.has(skill)) {
              addSuggestion({
                label: skill,
                value: `parent:${skill}`,
                group: 'Dev Skills',
              });
            }
          });

          if (subskills.length < 2) {
            skillSubSkillMap[parentSkill as ParentSkills]
              .slice(0, 3)
              .forEach(({ label, value }) => {
                if (
                  value !== 'Other' &&
                  !subskills.includes(value as SubSkillsType)
                ) {
                  addSuggestion({
                    label,
                    value: `${parentSkill}:${value}`,
                    group: parentSkill,
                  });
                }
              });
          }
        }

        if (['Design', 'Growth'].includes(parentSkill)) {
          const partner = parentSkill === 'Design' ? 'Growth' : 'Design';
          if (!categories.has(partner)) {
            skillSubSkillMap[partner as ParentSkills]
              .slice(0, 2)
              .forEach(({ label, value }) => {
                if (value !== 'Other') {
                  addSuggestion({
                    label,
                    value: `${partner}:${value}`,
                    group: partner,
                  });
                }
              });
          }
        }

        if (['Community', 'Content'].includes(parentSkill)) {
          const partner = parentSkill === 'Community' ? 'Content' : 'Community';
          if (!categories.has(partner)) {
            skillSubSkillMap[partner as ParentSkills]
              .slice(0, 2)
              .forEach(({ label, value }) => {
                if (value !== 'Other') {
                  addSuggestion({
                    label,
                    value: `${partner}:${value}`,
                    group: partner,
                  });
                }
              });
          }
        }

        if (parentSkill === 'Growth' && !categories.has('Other')) {
          skillSubSkillMap.Other.slice(0, 2).forEach(({ label, value }) => {
            addSuggestion({ label, value: `Other:${value}`, group: 'Other' });
          });
        }
      });

      return suggestions;
    }, [backendSkills, uiSkills]);

    const suggestions = React.useMemo(() => getSuggestions(), [getSuggestions]);

    return (
      <div className="space-y-2">
        <MultiSelect
          ref={ref}
          options={getSelectableOptions}
          value={uiSkills}
          onChange={handleChange}
          placeholder="Select skills..."
          className={className}
          groupBy="group"
        />
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion.value}
                variant="outline"
                size="sm"
                className="h-fit w-fit px-2 py-1"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.label}
                <Plus className="text-slate.500 !h-3 !w-3" />
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  },
);

SkillsSelect.displayName = 'SkillsSelect';
