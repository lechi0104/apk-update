import { checkForUpdates } from '@/services/updateService';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { AppState,AppStateStatus } from 'react-native';
const FOREGROUND_TASK = 'foreground-update-check';
let updateInterval: NodeJS.Timeout | null = null;
let isServiceRunning = false;

TaskManager.defineTask(FOREGROUND_TASK, async () => {
    try {
        await checkForUpdates();
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
});

export const startForegroundService = async () => {
    if (isServiceRunning) return;

    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'ovftank <3',
                body: 'app đang chạy <3',
                sticky: true,
                priority: 'high'
            },
            trigger: null
        });

        updateInterval = setInterval(async () => {
            try {
                await checkForUpdates();
            } catch {

            }
        }, 10000);

        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'background' && updateInterval) {
                clearInterval(updateInterval);
                updateInterval = null;
            } else if (nextAppState === 'active' && !updateInterval) {
                updateInterval = setInterval(async () => {
                    try {
                        await checkForUpdates();
                    } catch {

                    }
                }, 10000);
            }
        };

        AppState.addEventListener('change', handleAppStateChange);
        isServiceRunning = true;
    } catch (error) {
        throw new Error(`k start được service: ${error}`);
    }
};

export const stopForegroundService = async () => {
    if (!isServiceRunning) return;

    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }

    try {
        await Notifications.dismissAllNotificationsAsync();
    } catch {}

    isServiceRunning = false;
};

export const isServiceActive = () => isServiceRunning;

export const restartService = async () => {
    await stopForegroundService();
    await startForegroundService();
};
