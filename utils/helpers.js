exports.haveSameValues = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return false;

  return arr1.every((val) => arr2.includes(val));
};
