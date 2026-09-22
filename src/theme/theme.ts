import type { ITheme } from './theme.types';

const baselightTheme: ITheme = {
    palette: {
        primary: {
            main: '#0B2A12',        // forest green — buttons, nav panel
            light: '#3A5A42',       // lighter sage (derived — refine if you have a spec)
            dark: '#082900',        // deepest green
            contrastText: '#FAF8F3', // cream text on green (not stark white — stays luxury)
        },
        secondary: {
            main: '#143524',
            light: '#3A5A42',
            dark: '#082900',
        },
        accent: {                 // champagne gold — thin accents ONLY, never large fills
            main: '#C7AC66',
            light: '#E9DE90',       // gradient light stop
            dark: '#916029',        // gradient dark stop
            contrastText: '#0B2A12', // dark green text on gold
        },
        success: { main: '#2F751D', light: '#EBFAF2', dark: '#008000', contrastText: '#ffffff' },
        info: { main: '#3862A7', light: '#A7E3F4', dark: '#0000FF', contrastText: '#ffffff' },
        error: { main: '#CE5057', light: '#F6DFE0', dark: '#FF0000', contrastText: '#ffffff' },
        warning: { main: '#B38900', light: '#FFDBBB', dark: '#FFA500', contrastText: '#ffffff' },
        text: {
            primary: '#1A1A1A',     // near-black on cream (softer than pure #000)
            secondary: '#FAF8F3',   // cream — for text on the dark green nav panel
            placeHolder: '#8A8A8A',
        },
        divider: '#E4DFD5',       // warm, cream-tinted (not cool gray)
        background: {
            default: '#FAF8F3',     // CREAM — the universal base (this is the key brand change)
            card: '#FFFFFF',        // white cards lift off the cream
            bottomTab: '#FFFFFF',
            dark: '#0B2A12',        // forest green — the nav panel background
            light: '#FAF8F3',
        },
        modalBackDrop: 'rgba(0,0,0,0.5)',
        transparent: 'transparent',
        borderColor: '#D8D2C6',   // warm border to match cream
    },
};

const basedarkTheme: ITheme = {
    palette: {
        primary: {
            main: '#A9CBB4',        // sage — primary text/icons on dark; lifted for contrast
            light: '#CDECDC',
            dark: '#0B2A12',
            contrastText: '#0E1710', // dark text on the sage (e.g. on a sage button)
        },
        secondary: {
            main: '#FAF8F3',
            light: '#CDECDC',
            dark: '#0B2A12',
        },
        accent: {
            main: '#C7AC66',        // champagne gold — unchanged, reads well on dark
            light: '#E9DE90',
            dark: '#B8935A',        // ← lifted from #916029 (too dim on dark)
            contrastText: '#0E1710',
        },
        success: { main: '#6BbF8A', light: '#16211A', dark: '#4B9E6A', contrastText: '#0E1710' },
        info: { main: '#6FA8D8', light: '#16211A', dark: '#3862A7', contrastText: '#0E1710' },
        error: { main: '#E0727A', light: '#2A1A1B', dark: '#CE5057', contrastText: '#0E1710' },
        warning: { main: '#D6A93A', light: '#2A2313', dark: '#B38900', contrastText: '#0E1710' },
        text: {
            primary: '#F2EFE8',     // off-white cream — good
            secondary: '#C9D2CC',   // ← was #14261A (near-black, invisible on dark). Now light-muted
            placeHolder: '#8A938C', // ← slightly green-grey to sit in the palette
        },
        divider: '#2E3730',         // ← lifted from #2A322B so dividers are actually visible
        background: {
            default: '#0E1710',     // near-black forest — good
            card: '#18241C',        // ← nudged up from #16211A for a touch more card separation
            bottomTab: '#16211A',
            dark: '#0B140E',
            light: '#1E2A21',
        },
        modalBackDrop: 'rgba(0,0,0,0.6)',  // ← was rgba(255,255,255,0.2) — see note
        transparent: 'transparent',
        borderColor: '#3A443C',     // ← lifted so borders read on dark cards
    },
};

export { baselightTheme, basedarkTheme };