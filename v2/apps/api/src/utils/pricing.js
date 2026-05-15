export const discountedPrice = (price = 0, discount = 0) => {
  const discountAmount = Math.ceil((Number(price) * Number(discount || 0)) / 100);
  return Math.max(0, Number(price) - discountAmount);
};
