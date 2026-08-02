export const roundToNearestFive = (val: number): number => {
    const rem = val % 5;
    if (rem < 3) {
        return Math.floor(val / 5) * 5;
    } else {
        return Math.ceil(val / 5) * 5;
    }
};

export const calculateEstimatedFare = (dist: number): number => {
    if (!dist || isNaN(dist)) return 10;
    if (dist <= 2.5) return 10;
    return Number((10 + (dist - 2.5) * 2).toFixed(2));
};

export const formatCurrency = (n: number) => `₹${Number(n).toFixed(2)}`;
