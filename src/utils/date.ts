// Local-date helpers for the booking calendar. No timezone surprises:
// everything works off local Y/M/D, and ISO strings are built by hand.

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 'YYYY-MM-DD' for a local date.
export const toISO = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Strip the time part so day comparisons are clean.
export const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const isSameDay = (a: Date, b: Date): boolean => toISO(a) === toISO(b);

// First day of a month, n months away (n can be negative).
export const addMonths = (d: Date, n: number): Date => new Date(d.getFullYear(), d.getMonth() + n, 1);

// Nights from a to b. Same day = 0; the next day = 1 night.
export const nightsBetween = (a: Date, b: Date): number =>
    Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / (1000 * 60 * 60 * 24));

// "Thu, 18 Jun"
export const formatDayLabel = (d: Date): string =>
    `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;

// "June 2025"
export const formatMonthLabel = (d: Date): string =>
    `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

// Build one month's grid, Monday-first. `null` cells are blank padding
// so the real days line up under the right weekday columns.
export const buildMonthGrid = (year: number, month: number): (Date | null)[] => {
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // JS getDay(): 0=Sun … 6=Sat. Convert to Monday-start (Mon=0 … Sun=6).
    const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;

    const cells: (Date | null)[] = [];
    for (let i = 0; i < leadingBlanks; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
    while (cells.length % 7 !== 0) cells.push(null); // pad final row to 7
    return cells;
};

export const formatMonthShort = (d: Date): string => MONTHS_SHORT[d.getMonth()];

// "18–21 Jun" (same month) or "30 Jun – 2 Jul" (spanning months)
export const formatDateRange = (a: Date, b: Date): string => {
    const sameMonth = a.getMonth() === b.getMonth();
    return sameMonth
        ? `${a.getDate()}–${b.getDate()} ${formatMonthShort(a)}`
        : `${a.getDate()} ${formatMonthShort(a)} – ${b.getDate()} ${formatMonthShort(b)}`;
};