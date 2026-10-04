import { router as expoRouter, Href } from 'expo-router';

let isNavigating = false;
let lastNavTime = 0;
const NAVIGATION_LOCK_MS = 600;

/**
 * An toàn điều hướng giữa các màn hình, chống tình trạng bấm liên tục (spam/double-click)
 * dẫn tới việc Expo Router / Stack Navigator đẩy (push) nhiều màn hình trùng lặp lên Stack.
 */
export const safeNavigate = (
  to: Href | string,
  options?: { replace?: boolean; delayMs?: number }
): boolean => {
  const now = Date.now();
  if (isNavigating || now - lastNavTime < NAVIGATION_LOCK_MS) {
    return false;
  }
  isNavigating = true;
  lastNavTime = now;

  const execute = () => {
    try {
      if (options?.replace) {
        expoRouter.replace(to as any);
      } else {
        // Dùng navigate thay vì push để tìm route đã tồn tại hoặc tạo 1 route duy nhất
        expoRouter.navigate(to as any);
      }
    } catch (error) {
      console.warn('[SafeNavigation] Navigation error:', error);
    } finally {
      setTimeout(() => {
        isNavigating = false;
      }, NAVIGATION_LOCK_MS);
    }
  };

  if (options?.delayMs && options.delayMs > 0) {
    setTimeout(execute, options.delayMs);
  } else {
    execute();
  }

  return true;
};

/**
 * An toàn quay lại màn hình trước, chống bấm back liên tục
 */
export const safeBack = (): boolean => {
  const now = Date.now();
  if (isNavigating || now - lastNavTime < 350) {
    return false;
  }
  isNavigating = true;
  lastNavTime = now;

  try {
    if (expoRouter.canGoBack()) {
      expoRouter.back();
    }
  } catch (error) {
    console.warn('[SafeNavigation] Back error:', error);
  } finally {
    setTimeout(() => {
      isNavigating = false;
    }, 350);
  }
  return true;
};

export const safeRouter = {
  navigate: (href: Href | string, options?: { replace?: boolean; delayMs?: number }) => safeNavigate(href, options),
  push: (href: Href | string, options?: { replace?: boolean; delayMs?: number }) => safeNavigate(href, options),
  replace: (href: Href | string) => safeNavigate(href, { replace: true }),
  back: () => safeBack(),
  canGoBack: () => expoRouter.canGoBack(),
};

export const useSafeRouter = () => safeRouter;
