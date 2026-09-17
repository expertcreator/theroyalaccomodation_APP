import type { ImageSourcePropType } from 'react-native';

export interface AreaAttraction {
    id: string;
    name: string;
    location: string;          // pill label: "Windsor", "Ascot", "Sunningdale"
    description: string;
    image: ImageSourcePropType;
    url: string;               // official website (opens in the browser)
}