interface IThemeColorGroup {
    main: string;
    light: string;
    dark: string;
    contrastText: string;
}

interface IThemePalette {
    primary: IThemeColorGroup;
    secondary: {
        main: string;
        light: string;
        dark: string;
    };
    accent: IThemeColorGroup;   // champagne gold — thin accents only
    success: IThemeColorGroup;
    info: IThemeColorGroup;
    error: IThemeColorGroup;
    warning: IThemeColorGroup;
    text: {
        primary: string;
        secondary: string;
        placeHolder: string;
    };
    divider: string;
    background: {
        default: string;
        card: string;
        bottomTab: string;
        dark: string;
        light: string;
    };
    modalBackDrop: string;
    transparent: string;
    borderColor: string;
}

interface ITheme {
    palette: IThemePalette;
}

export type { ITheme, IThemePalette };