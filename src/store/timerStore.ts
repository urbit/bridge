import create from 'zustand';
import { HOUR } from 'lib/utils/roller';

export interface TimerStore {
  nextBatchTime: number;
  nextRoll: string;
  setNextBatchTime: (nextBatchTime: number) => void;
  setNextRoll: (nextRoll: string) => void;
}

export const useTimerStore = create<TimerStore>(set => ({
  nextBatchTime: new Date().getTime() + HOUR,
  nextRoll: '0h 00m 00s',
  setNextBatchTime: (nextBatchTime: number) => set(() => ({ nextBatchTime })),
  setNextRoll: (nextRoll: string) => set(() => ({ nextRoll })),
}));
