import { type CheckboxFilter } from '../types';

export * from './filters';
export * from './search';

export function updateCheckboxes(
  arrayFilters: string,
  filters: CheckboxFilter[],
): CheckboxFilter[] {
  const activeStatuses = arrayFilters.split(',');

  console.log('active statuses - ', activeStatuses);
  return filters.map((filter) => {
    if (activeStatuses.includes(filter.value)) {
      filter.checked = true;
      return filter;
    } else {
      filter.checked = false;
      return filter;
    }
  });
}
