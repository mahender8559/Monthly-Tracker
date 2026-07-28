function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getBillingCycle(month: string, startDay: number) {
  const monthEnd = new Date(`${month} 1`);
  const dateAtCycleDay = (year: number, monthIndex: number) => {
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    return new Date(year, monthIndex, Math.min(startDay, lastDay));
  };
  // A cycle is named for the month in which it ends. For example, the
  // August cycle with a start day of 28 runs from 28 July to 27 August.
  const start = dateAtCycleDay(monthEnd.getFullYear(), monthEnd.getMonth() - 1);
  const end = dateAtCycleDay(monthEnd.getFullYear(), monthEnd.getMonth());
  const endInclusive = new Date(end);
  endInclusive.setDate(endInclusive.getDate() - 1);

  return {
    startDate: formatDate(start),
    endDateExclusive: formatDate(end),
    label: `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${endInclusive.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
  };
}
