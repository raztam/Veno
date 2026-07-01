import { Platform } from 'react-native';
import BackgroundService from 'react-native-background-actions';

export type BackgroundTaskConfig = {
  taskName: string;
  taskTitle: string;
  taskDesc: string;
  linkingURI?: string;
};

export function isBackgroundTaskRunning(): boolean {
  return Platform.OS === 'android' && BackgroundService.isRunning();
}

export function updateBackgroundTaskProgress(
  taskDesc: string,
  progress: number,
): void {
  if (!isBackgroundTaskRunning()) {
    return;
  }

  const normalized = Math.max(0, Math.min(100, Math.round(progress)));

  void BackgroundService.updateNotification({
    taskDesc,
    progressBar: {
      max: 100,
      value: normalized,
      indeterminate: normalized === 0,
    },
  });
}

export async function runInBackgroundTask<T>(
  config: BackgroundTaskConfig,
  work: () => Promise<T>,
): Promise<T> {
  if (Platform.OS !== 'android') {
    return work();
  }

  if (isBackgroundTaskRunning()) {
    return work();
  }

  let result: T | undefined;
  let error: unknown;

  const task = async () => {
    try {
      result = await work();
    } catch (taskError) {
      error = taskError;
    }
  };

  await BackgroundService.start(task, {
    taskName: config.taskName,
    taskTitle: config.taskTitle,
    taskDesc: config.taskDesc,
    taskIcon: {
      name: 'ic_launcher',
      type: 'mipmap',
    },
    color: '#208AEF',
    linkingURI: config.linkingURI ?? 'veno://settings',
    foregroundServiceType: ['dataSync'],
    progressBar: {
      max: 100,
      value: 0,
      indeterminate: true,
    },
  });

  if (error) {
    throw error;
  }

  if (result === undefined) {
    throw new Error(`${config.taskTitle} finished without a result.`);
  }

  return result;
}
