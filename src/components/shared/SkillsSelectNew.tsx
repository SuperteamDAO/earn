import { Plus } from 'lucide-react';
import * as React from 'react';
import { useFormContext } from 'react-hook-form';

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

import { FormMessage } from '../ui/form';

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
  maxSuggestions?: number;
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
  (
    {
      defaultValue = [],
      onChange,
      className,
      maxSuggestions = MAX_SUGGESTIONS,
    },
    ref,
  ) => {
    const [uiSkills, setUiSkills] = React.useState<Option[]>(
      convertSkillsToOptions(defaultValue),
    );
    const [logicSkills, setLogicSkills] = React.useState<Skills>(defaultValue);

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
      setLogicSkills(newBackendSkills);
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
          suggestions.length < maxSuggestions
        ) {
          suggestions.push(option);
        }
      };

      const selectedParentSkills = new Set(
        logicSkills.map((skill) => skill.skills),
      );
      if (logicSkills.length === 0) {
        // Default suggestions when no skills are selected
        const defaultSuggestions: Option[] = [
          { label: 'Frontend', value: 'parent:Frontend', group: 'Dev Skills' },
          { label: 'Backend', value: 'parent:Backend', group: 'Dev Skills' },
          {
            label: 'UI/UX Design',
            value: 'Design:UI/UX Design',
            group: 'Design',
          },
          { label: 'Writing', value: 'Content:Writing', group: 'Content' },
          {
            label: 'Digital Marketing',
            value: 'Growth:Digital Marketing',
            group: 'Growth',
          },
          {
            label: 'Community Manager',
            value: 'Community:Community Manager',
            group: 'Community',
          },
        ];

        defaultSuggestions.forEach(addSuggestion);
        return suggestions;
      }

      // Suggest unselected subskills of selected parent skills
      logicSkills.forEach(({ skills: parentSkill, subskills }) => {
        const unselectedSubskills = skillSubSkillMap[parentSkill]
          .filter(
            ({ value }) =>
              value !== 'Other' && !subskills.includes(value as SubSkillsType),
          )
          .slice(0, 4);

        unselectedSubskills.forEach(({ label, value }) => {
          addSuggestion({
            label,
            value: `${parentSkill}:${value}`,
            group: parentSkill,
          });
        });
      });

      const complementarySkillsMap: Record<ParentSkills, ParentSkills[]> = {
        Frontend: ['Backend', 'Design'],
        Backend: ['Frontend', 'Blockchain'],
        Design: ['Frontend', 'Content'],
        Blockchain: ['Backend', 'Mobile'],
        Mobile: ['Frontend', 'Backend'],
        Content: ['Community', 'Growth'],
        Growth: ['Content', 'Community'],
        Community: ['Growth', 'Content'],
        Other: [],
      };

      selectedParentSkills.forEach((parentSkill) => {
        const complementarySkills = complementarySkillsMap[parentSkill] || [];
        complementarySkills.forEach((compSkill) => {
          if (!selectedParentSkills.has(compSkill)) {
            const subskills = skillSubSkillMap[compSkill] || [];
            const unselectedSubskills = subskills
              .filter(
                ({ value }) =>
                  value !== 'Other' &&
                  !selectedValues.has(`${compSkill}:${value}`),
              )
              .slice(0, maxSuggestions - suggestions.length);

            unselectedSubskills.forEach(({ label, value }) => {
              addSuggestion({
                label,
                value: `${compSkill}:${value}`,
                group: compSkill,
              });
            });
          }
        });
      });

      return suggestions;
    }, [logicSkills, uiSkills]);

    const suggestions = React.useMemo(() => getSuggestions(), [getSuggestions]);

    const formContext = useFormContext();
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
          emptyIndicator="No skills found"
        />
        {!!formContext && <FormMessage />}
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
                <span>{suggestion.label}</span>
                <Plus className="!h-3 !w-3 text-slate-500" />
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  },
);

SkillsSelect.displayName = 'SkillsSelect';
