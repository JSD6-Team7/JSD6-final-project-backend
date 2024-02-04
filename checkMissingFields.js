const checkMissingFields = (activityItem, requiredFields) => {
  const missingFields = requiredFields.filter((field) => {
    return !Object.keys(activityItem).includes(field);
  });
  return missingFields;
};
export { checkMissingFields };
