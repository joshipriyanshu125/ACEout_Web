import { createNavigationContainerRef } from '@react-navigation/native';

/**
 * Lets code outside a screen move the stack — used when the school server
 * answers 401 and the student has to be sent back to the org sign-in.
 */
export const navigationRef = createNavigationContainerRef();

export function resetTo(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name, params }] });
  }
}
