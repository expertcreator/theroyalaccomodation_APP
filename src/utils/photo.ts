import ImagePicker from 'react-native-image-crop-picker';

// Opens the gallery, square crop, returns a local file path (or null if cancelled).
export const pickAvatar = async (): Promise<string | null> => {
    try {
        const image = await ImagePicker.openPicker({
            // width: 400,
            // height: 400,
            // cropping: true,
            // cropperCircleOverlay: true,   // circular crop guide, matches the round avatar
            mediaType: 'photo',
            // compressImageQuality: 0.8,    // reasonable size for an avatar
        });
        return image.path;
    } catch (e: any) {
        // User cancelling the picker throws — treat as no-op, not an error.
        if (e?.code === 'E_PICKER_CANCELLED') return null;
        console.warn('Avatar pick failed', e);
        return null;
    }
};