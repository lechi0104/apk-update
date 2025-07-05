import * as IntentLauncher from 'expo-intent-launcher';
import * as Notifications from 'expo-notifications';
import { Alert,Linking,Platform } from 'react-native';

export const requestAllPermissions = async () => {
    await requestNotificationPermission();
    await requestStoragePermission();
    await requestInstallPermission();
};

const requestNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert(
            'cần quyền nha sếp',
            'cho phép thông báo nhé sốp',
            [
                { text: 'thôi', style: 'cancel' },
                { text: 'ok r đi setting', onPress: () => { Linking.openSettings(); } }
            ]
        );
        throw new Error('notification permission denied');
    }
};

const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
        try {
            await IntentLauncher.startActivityAsync(
                'android.settings.MANAGE_APP_ALL_FILES_ACCESS_PERMISSION' as any,
                {
                    data: 'package:com.ovftank.apk-update'
                }
            );
        } catch {
            Alert.alert(
                'cần quyền lưu file',
                'e xin quyền lưu file với, hihi',
                [
                    { text: 'thôi', style: 'cancel' },
                    { text: 'ok r đi setting', onPress: () => { Linking.openSettings(); } }
                ]
            );
        }
    }
};

const requestInstallPermission = async () => {
    if (Platform.OS === 'android') {
        try {
            await IntentLauncher.startActivityAsync(
                'android.settings.MANAGE_UNKNOWN_APP_SOURCES' as any,
                {
                    data: 'package:com.ovftank.apk-update'
                }
            );
        } catch {
            Alert.alert(
                'cần quyền cài app',
                'bật cài app từ nguồn khác(trong setting nha)',
                [
                    { text: 'thôi', style: 'cancel' },
                    { text: 'ok r đi setting', onPress: () => { Linking.openSettings(); } }
                ]
            );
        }
    }
};

export const installAPK = async (apkPath: string) => {
    if (Platform.OS === 'android') {
        try {
            await IntentLauncher.startActivityAsync(
                'android.intent.action.VIEW',
                {
                    data: apkPath,
                    type: 'application/vnd.android.package-archive',
                    flags: 1
                }
            );
        } catch (error) {
            Alert.alert('cài lỗi r', 'cài apk k được, có gì đó sai sai');
            throw error;
        }
    }
};

export const checkPermissions = async (): Promise<boolean> => {
    try {
        const notificationStatus = await Notifications.getPermissionsAsync();
        return notificationStatus.status === 'granted';
    } catch {
        return false;
    }
};
