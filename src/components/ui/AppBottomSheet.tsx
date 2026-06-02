import React, { useCallback, useEffect, useRef } from 'react';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

interface AppBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  snapPoints?: (string | number)[];
  children: React.ReactNode;
  enableDynamicSizing?: boolean;
}

/**
 * A reliable wrapper around BottomSheetModal that handles the present/dismiss
 * lifecycle correctly — the modal is only mounted when `visible` is true,
 * auto-presents on mount, and calls `onClose` exactly once on dismiss.
 *
 * Usage:
 *   <AppBottomSheet visible={isOpen} onClose={() => setIsOpen(false)}>
 *     <BottomSheetScrollView>...</BottomSheetScrollView>
 *   </AppBottomSheet>
 */
export default function AppBottomSheet({
  visible,
  onClose,
  snapPoints,
  children,
  enableDynamicSizing,
}: AppBottomSheetProps) {
  // Don't render anything when not visible — guarantees a fresh ref each time.
  if (!visible) return null;

  return (
    <AppBottomSheetInner
      onClose={onClose}
      snapPoints={snapPoints}
      enableDynamicSizing={enableDynamicSizing}
    >
      {children}
    </AppBottomSheetInner>
  );
}

function AppBottomSheetInner({
  onClose,
  snapPoints: snapPointsProp,
  children,
  enableDynamicSizing,
}: Omit<AppBottomSheetProps, 'visible'>) {
  const ref = useRef<BottomSheetModal>(null);
  const snapPoints = React.useMemo(
    () => snapPointsProp ?? ['50%', '90%', '100%'],
    [snapPointsProp],
  );

  // Present immediately on mount.
  useEffect(() => {
    // requestAnimationFrame ensures the BottomSheetModal layout is ready.
    const id = requestAnimationFrame(() => {
      ref.current?.present();
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      index={1}
      snapPoints={snapPoints}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: '#141714', borderRadius: 20 }}
      handleIndicatorStyle={{ backgroundColor: '#4a5e4c' }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      enableDynamicSizing={enableDynamicSizing}
      enablePanDownToClose
    >
      {children}
    </BottomSheetModal>
  );
}
