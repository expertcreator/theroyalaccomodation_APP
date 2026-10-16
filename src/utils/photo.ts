import ImagePicker from 'react-native-image-crop-picker';
import { showToast } from './ToastNotifier';

// Opens the gallery with a square crop and returns a local JPEG path (or null if
// cancelled / not allowed). The crop is resized on the phone, so even a huge
// camera photo uploads as ~50–150 KB.
export const pickAvatar = async (): Promise<string | null> => {
    try {
        const image = await ImagePicker.openPicker({
            mediaType: 'photo',
            width: 512,
            height: 512,
            cropping: true,
            cropperCircleOverlay: true,   // circular crop guide, matches the round avatar
            compressImageQuality: 0.8,
            forceJpg: true,               // iOS HEIC → JPEG, so the upload is always image/jpeg
        });
        return image.path;
    } catch (e: any) {
        // User cancelling the picker throws — treat as no-op, not an error.
        if (e?.code === 'E_PICKER_CANCELLED') return null;
        if (e?.code === 'E_NO_LIBRARY_PERMISSION') {
            showToast('warning', 'Please allow access to your photos in Settings.');
            return null;
        }
        console.warn('Avatar pick failed', e);
        showToast('danger', "Couldn't open your photos. Please try again.");
        return null;
    }
};
