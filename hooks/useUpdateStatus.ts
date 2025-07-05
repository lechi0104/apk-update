import { getCurrentVersion } from '@/services/updateService';
import NetInfo from '@react-native-community/netinfo';
import { useCallback,useEffect,useState } from 'react';
import { AppState,AppStateStatus } from 'react-native';

export const useUpdateStatus = () => {
    const [currentVersion, setCurrentVersion] = useState('');
    const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
    const [isOnline, setIsOnline] = useState(true);

    const loadCurrentVersion = useCallback(async () => {
        if (!isOnline) {
            return;
        }

        try {
            const version = await getCurrentVersion();
            setCurrentVersion(version);
            setLastCheckTime(new Date());
        } catch {

        }
    }, [isOnline]);

    useEffect(() => {
        loadCurrentVersion();

        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                loadCurrentVersion();
            }
        };

        const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

        const unsubscribeNetInfo = NetInfo.addEventListener(state => {
            setIsOnline(state.isConnected ?? false);
        });

        NetInfo.fetch().then(state => {
            setIsOnline(state.isConnected ?? false);
        });

        return () => {
            appStateSubscription?.remove();
            unsubscribeNetInfo();
        };
    }, [loadCurrentVersion]);

    const refreshVersion = async () => {
        await loadCurrentVersion();
    };

    return {
        currentVersion,
        lastCheckTime,
        isOnline,
        refreshVersion
    };
};
