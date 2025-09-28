import { buildDateRangePayload } from "./tableHelper";
import { cloneDeep } from "lodash";

/**
 * 
 * @param selectedFilter - current selected filter
 * @param selectedAttributeFilter - current selected attribute filter
 * @param filterListSortParams - sorting params for filter list
 * @param dateRange  - date range for filtering tasks
 * @param isAssigned  - boolean to check if tasks are assigned to current user
 * @returns 
 */
//  Type mapping between Form.io and Camunda
 const sortableList = {
  phoneNumber: "String",
  checkbox: "Boolean",
  currency: "Integer",
  radio: "String",
  datetime: "String",
  select: "String",
  selectboxes:"String",
  time:"String",
  url:"String",
  day:"String",
  textfield:"String",
  number:"Integer",
  textarea:"String",
  address:"String",
  email:"String",
  tags:"String"
}; 
export const sortableKeysSet = new Set(Object.keys(sortableList));

// Constants for sort column types
export const ENABLED_SORT_FIELDS = new Set([
  "applicationId",
  "submitterName", 
  "formName"
]);

/**
 * Generate reset sort orders in the new key format
 * @param options - Array of sort options with value and label
 * @returns Object with reset sort orders in new format
 */
export const generateResetSortOrders = (options) => {
  return options.reduce((acc, option) => {
    const key = `${option.value}|static`;
    acc[key] = { sortOrder: "asc" };
    return acc;
  }, {});
};

export const createReqPayload = (
  selectedFilter,
  selectedAttributeFilter,
  filterListSortParams,
  dateRange,
  isAssigned,
  isFormVariable=false
) => {
  const clonedFilter = cloneDeep(selectedFilter); 
  const {
    processVariables: attributeProcessVariable,
    assignee: attributeAssignee,
  } = selectedAttributeFilter?.criteria || {};
  const processVariables = {
    processVariables:
      attributeProcessVariable || clonedFilter?.criteria?.processVariables,
  };
  const assignee = {
    assignee: attributeAssignee || clonedFilter?.criteria?.assignee,
  };
  // here we are taking the sorting from filterListsortparams instead of taking of inside the selectedFilter

  // Extract original sortKey from the new format (e.g., "created|static" -> "created")
  const originalSortKey = filterListSortParams?.activeKey?.split('|')[0];
  
  // Build sort filter
  const newFilter = isFormVariable || ENABLED_SORT_FIELDS.has(originalSortKey)
    ? {
        sortBy: "processVariable",
        sortOrder: filterListSortParams?.[filterListSortParams?.activeKey]?.sortOrder,
        parameters: {
          variable: originalSortKey, 
          type:
          sortableList[
              filterListSortParams?.[filterListSortParams?.activeKey]?.type
            ] ||
            filterListSortParams?.[filterListSortParams?.activeKey]?.type ||
            null,
        },
      }
    : {
        sortBy: originalSortKey,
        sortOrder:
          filterListSortParams?.[filterListSortParams?.activeKey]?.sortOrder,
      };

  const date = buildDateRangePayload(dateRange);
  const updatedFilter = {
    ...clonedFilter,
    criteria: {
      ...clonedFilter?.criteria,
      ...(processVariables.processVariables?.length && processVariables),
      ...(assignee.assignee && assignee),
      ...date,
      sorting: [newFilter],
      ...(isAssigned && { assigneeExpression: "${ currentUser() }" }),
    },
  };
  return updatedFilter;
};
