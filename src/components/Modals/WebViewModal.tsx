import React, { useRef } from 'react';
import { Modal, View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { moderateScale } from 'react-native-size-matters';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radius, borderWidth } from '../../theme';
import Text from '../Text/Text';
import Icon from '../Icon/Icon';
import { withAlpha } from '../../utils/color';

type Props = {
    visible: boolean;
    title: string;
    url: string | null;
    onClose: () => void;
};

const WebViewModal: React.FC<Props> = ({ visible, title, url, onClose }) => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const p = theme.palette;

    const webRef = useRef<WebView>(null);

    const HIDE_CHROME = `
  (function() {
    var css = \`
      #brx-header, header#brx-header,
      #brx-footer, footer#brx-footer,
      .skip-link { display: none !important; }
      body { opacity: 1 !important; padding-top: 0 !important; margin-top: 0 !important; }
      #brx-content, main#brx-content { padding-top: 0 !important; margin-top: 0 !important; }
    \`;
    var style = document.createElement('style');
    style.setAttribute('id', 'rn-hide-chrome');
    style.innerHTML = css;
    (document.head || document.documentElement).appendChild(style);
    true;
  })();
`;

    return (
        <Modal visible={visible} supportedOrientations={['portrait', 'landscape']} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
            <View style={[styles.container, { backgroundColor: p.background.default }]}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: p.borderColor }]}>
                    <Text style={[typography.headerTitle, { color: p.text.primary, flex: 1 }]} numberOfLines={1}>
                        {title}
                    </Text>
                    <TouchableOpacity onPress={onClose} hitSlop={8} style={[styles.close, { borderColor: p.borderColor, backgroundColor: p.background.card }]}>
                        <Icon name="close" size={16} color={p.text.primary} />
                    </TouchableOpacity>
                </View>

                {/* Web content */}
                {url && (
                    <WebView
                        source={{ uri: url }}
                        startInLoadingState
                        renderLoading={() => (
                            <View style={styles.loading}>
                                <ActivityIndicator size="large" color={p.primary.main} />
                            </View>
                        )}
                        style={{ backgroundColor: p.background.default }}
                        injectedJavaScriptBeforeContentLoaded={HIDE_CHROME}
                        injectedJavaScript={HIDE_CHROME}
                        injectedJavaScriptForMainFrameOnly={true}                    // iOS: run after load
                        injectedJavaScriptBeforeContentLoadedForMainFrameOnly={true} // iOS: run early
                        onLoadEnd={() => webRef.current?.injectJavaScript(HIDE_CHROME)}  // re-apply once loaded
                    />
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', columnGap: spacing.md,
        paddingHorizontal: spacing.xl2, paddingBottom: spacing.md,
        borderBottomWidth: borderWidth.thin,
    },
    close: {
        width: moderateScale(32), height: moderateScale(32), borderRadius: radius.pill,
        borderWidth: borderWidth.thin, alignItems: 'center', justifyContent: 'center',
    },
    loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});

export default WebViewModal;