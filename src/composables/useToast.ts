import { reactive } from 'vue';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
  leaving: boolean;
};

const state = reactive({
  items: [] as ToastItem[],
});

let nextId = 0;

function remove(id: number) {
  const index = state.items.findIndex((item) => item.id === id);
  if (index >= 0) {
    state.items.splice(index, 1);
  }
}

function push(message: string, tone: ToastTone = 'info', timeout = 3200) {
  const item: ToastItem = {
    id: ++nextId,
    message,
    tone,
    leaving: false,
  };
  state.items.push(item);
  // 先播放离场动画，再移出数组，避免提示突然消失。
  window.setTimeout(() => {
    item.leaving = true;
    window.setTimeout(() => remove(item.id), 260);
  }, timeout);
}

export function useToast() {
  return {
    items: state.items,
    remove,
    success: (message: string) => push(message, 'success'),
    error: (message: string) => push(message, 'error', 4200),
    info: (message: string) => push(message, 'info'),
    warning: (message: string) => push(message, 'warning', 3800),
  };
}
