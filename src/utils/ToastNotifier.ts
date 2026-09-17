import { moderateScale } from 'react-native-size-matters';
import { Toast } from 'react-native-toast-notifications';
import { fontSizes } from '../theme';

type ToastType = 'normal' | 'success' | 'warning' | 'danger';
type ToastPlacement = 'top' | 'bottom';

export const showToast = (
    type: ToastType = 'normal',
    message: string,
    placement?: ToastPlacement,
    duration?: number,
) => {
    Toast.show(
        message,
        {
            type,
            placement: placement ?? 'bottom',
            duration: duration ?? 3000,
            textStyle: {
                fontSize: moderateScale(fontSizes.xs),
            }
        });
};