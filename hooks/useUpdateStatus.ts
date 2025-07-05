import { getCurrentVersion } from '@/services/updateService';
import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useUpdateStatus = () => {
  const [currentVersion, setCurrentVersion] = useState('');
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadCurrentVersion();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        loadCurrentVersion();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  const loadCurrentVersion = async () => {
    try {
      const version = await getCurrentVersion();
      setCurrentVersion(version);
      setLastCheckTime(new Date());
    } catch (error) {
      console.log('lỗi load version:', error);
    }
  };

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
