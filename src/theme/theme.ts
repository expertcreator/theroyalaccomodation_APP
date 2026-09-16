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
            main: '#8FB89C',        // lighter sage so it's visible on dark
            light: '#CDECDC',
            dark: '#0B2A12',
            contrastText: '#0E1710',
        },
        secondary: {
            main: '#FAF8F3',
            light: '#CDECDC',
            dark: '#0B2A12',
        },
        accent: {
            main: '#C7AC66',
            light: '#E9DE90',
            dark: '#916029',
            contrastText: '#0E1710',
        },
        success: { main: '#2F751D', light: '#EBFAF2', dark: '#008000', contrastText: '#ffffff' },
        info: { main: '#3862A7', light: '#A7E3F4', dark: '#0000FF', contrastText: '#ffffff' },
        error: { main: '#CE5057', light: '#F6DFE0', dark: '#FF0000', contrastText: '#ffffff' },
        warning: { main: '#B38900', light: '#FFDBBB', dark: '#FFA500', contrastText: '#ffffff' },
        text: {
            primary: '#F2EFE8',     // off-white cream
            secondary: '#14261A',
            placeHolder: '#9A9A9A',
        },
        divider: '#2A322B',
        background: {
            default: '#0E1710',     // near-black forest (warmer than #121212)
            card: '#16211A',
            bottomTab: '#16211A',
            dark: '#0E1710',
            light: '#16211A',
        },
        modalBackDrop: 'rgba(255,255,255,0.2)',
        transparent: 'transparent',
        borderColor: '#38423A',
    },
};

export { baselightTheme, basedarkTheme };