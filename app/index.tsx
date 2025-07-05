import { useUpdateStatus } from '@/hooks/useUpdateStatus';
import { requestAllPermissions } from '@/services/permissionService';
import { manualCheckUpdate, registerBackgroundFetch } from '@/services/updateService';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
export default function HomeScreen() {
    const [isChecking, setIsChecking] = useState(false);
    const [isServiceActive, setIsServiceActive] = useState(false);
    const { currentVersion, refreshVersion } = useUpdateStatus();

    useEffect(() => {
        initApp();
    }, []);

    const initApp = async () => {
        try {
            await registerBackgroundFetch();

            await requestAllPermissions();

            const { startForegroundService, isServiceActive: checkServiceStatus } = await import('@/services/foregroundService');
            await startForegroundService();
            setIsServiceActive(checkServiceStatus());
        } catch (error) {
            Alert.alert('ối zồi ôi', `app bị lỗi rồi sếp ơi: ${error}`);
            throw error;
        }
    };

    const toggleService = async () => {
        try {
            const { startForegroundService, stopForegroundService, isServiceActive: checkServiceStatus } = await import('@/services/foregroundService');

            if (isServiceActive) {
                await stopForegroundService();
            } else {
                await startForegroundService();
            }

            setIsServiceActive(checkServiceStatus());
        } catch (error) {
            Alert.alert('wtf', `service bị nghẽn r thì phải: ${error}`);
        }
    };

    const handleManualCheck = async () => {
        setIsChecking(true);
        try {
            await manualCheckUpdate();
            await refreshVersion();
        } catch {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'ối zồi ôi',
                    body: 'đứt cáp r'
                },
                trigger: null
            });

            Alert.alert('lỗi r', 'quét k được, check mạng nha đạik');
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.text}>@ovftank</Text>
            <Text style={styles.version}>v{currentVersion}</Text>

            <TouchableOpacity style={[styles.button, isChecking && styles.buttonDisabled]} onPress={handleManualCheck} disabled={isChecking}>
                <View style={styles.buttonContent}>
                    {isChecking && <ActivityIndicator size='small' color='#fff' style={styles.spinner} />}
                    <Text style={styles.buttonText}>{isChecking ? 'đang quét...' : 'quét ngay'}</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.serviceButton]} onPress={toggleService}>
                <Text style={styles.buttonText}>{isServiceActive ? 'tắt chạy nền' : 'bật chạy nền'}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        padding: 20
    },
    text: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 15,
        color: '#000000',
        letterSpacing: 2,
        textTransform: 'uppercase',
        textShadowColor: '#00000020',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4
    },
    version: {
        fontSize: 14,
        color: '#000000',
        marginBottom: 40,
        fontFamily: 'monospace',
        letterSpacing: 1,
        opacity: 0.8
    },
    button: {
        backgroundColor: '#000000',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 0,
        minWidth: 140,
        borderWidth: 2,
        borderColor: '#000000',
        shadowColor: '#000000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 0,
        elevation: 8
    },
    buttonDisabled: {
        backgroundColor: '#00000060',
        borderColor: '#00000060'
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    spinner: {
        marginRight: 8
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 1,
        textTransform: 'uppercase',
        fontFamily: 'monospace'
    },
    serviceButton: {
        backgroundColor: '#333333',
        marginTop: 15
    }
});
