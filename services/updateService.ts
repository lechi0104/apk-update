import * as BackgroundTask from 'expo-background-task';
import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_FETCH_TASK = 'background-fetch-update';
const VERSION_URL = 'https://raw.githubusercontent.com/lechi0104/apk-update/refs/heads/apk/version.txt';
const APK_URL = 'https://raw.githubusercontent.com/lechi0104/apk-update/refs/heads/apk/app.apk';

let db: SQLite.SQLiteDatabase;

const initDB = async () => {
    if (!db) {
        db = await SQLite.openDatabaseAsync('app_updates.db');
        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_version (
        id INTEGER PRIMARY KEY,
        version TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

        const result = await db.getFirstAsync('SELECT version FROM app_version ORDER BY id DESC LIMIT 1');
        if (!result) {
            await db.runAsync('INSERT INTO app_version (version) VALUES (?)', ['1.0.0']);
        }
    }
    return db;
};

const getCurrentVersion = async (): Promise<string> => {
    const db = await initDB();
    const result = await db.getFirstAsync<{ version: string }>('SELECT version FROM app_version ORDER BY id DESC LIMIT 1');
    return result?.version ?? '1.0.0';
};

const updateVersion = async (version: string) => {
    const db = await initDB();
    await db.runAsync('INSERT INTO app_version (version) VALUES (?)', [version]);
};

const compareVersions = (current: string, remote: string): boolean => {
    const currentParts = current.split('.').map(Number);
    const remoteParts = remote.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, remoteParts.length); i++) {
        const currentPart = currentParts[i] || 0;
        const remotePart = remoteParts[i] || 0;

        if (remotePart > currentPart) return true;
        if (remotePart < currentPart) return false;
    }
    return false;
};

const downloadAPK = async (version: string) => {
    const downloadDir = `${FileSystem.documentDirectory}downloads/`;
    await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });

    const fileName = `app_v${version}.apk`;
    const fileUri = `${downloadDir}${fileName}`;

    const downloadResult = await FileSystem.downloadAsync(APK_URL, fileUri);

    if (downloadResult.status === 200) {
        await updateVersion(version);
        return downloadResult.uri;
    } else {
        throw new Error(`download failed: ${downloadResult.status}`);
    }
};

const checkForUpdates = async () => {
    const response = await fetch(VERSION_URL);
    if (!response.ok) {
        throw new Error(`fetch failed: ${response.status}`);
    }

    const remoteVersion = (await response.text()).trim();
    const currentVersion = await getCurrentVersion();

    if (compareVersions(currentVersion, remoteVersion)) {
        await downloadAPK(remoteVersion);
    }
};

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    try {
        await checkForUpdates();
        return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
        return BackgroundTask.BackgroundTaskResult.Failed;
    }
});

export const registerBackgroundFetch = async () => {
    try {
        const status = await BackgroundTask.getStatusAsync();
        if (status === BackgroundTask.BackgroundTaskStatus.Available) {
            await BackgroundTask.registerTaskAsync(BACKGROUND_FETCH_TASK, {
                minimumInterval: 15 * 60
            });
        }
    } catch {}
};

export const unregisterBackgroundFetch = async () => {
    await BackgroundTask.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
};

export const manualCheckUpdate = async () => {
    await checkForUpdates();
};

export { getCurrentVersion };
