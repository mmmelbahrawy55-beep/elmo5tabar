import React, { useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheetComponent, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useTheme } from '../../theme/ThemeContext';

interface BottomSheetProps {
  snapPoints?: string[];
  initialIndex?: number;
  children: React.ReactNode;
  handleComponent?: React.ReactNode;
  enablePanDownToClose?: boolean;
}

export interface BottomSheetRef {
  snapToIndex: (index: number) => void;
  snapToPosition: (position: number) => void;
  close: () => void;
  expand: () => void;
  collapse: () => void;
}

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  (
    {
      snapPoints = ['50%', '90%'],
      initialIndex = -1,
      children,
      handleComponent,
      enablePanDownToClose = true,
    },
    ref,
  ) => {
    const { theme } = useTheme();
    const { colors, borderRadius, spacing } = theme;
    const bottomSheetRef = useRef<BottomSheetComponent>(null);

    useImperativeHandle(ref, () => ({
      snapToIndex: (index) => bottomSheetRef.current?.snapToIndex(index),
      snapToPosition: (position) => bottomSheetRef.current?.snapToPosition(position),
      close: () => bottomSheetRef.current?.close(),
      expand: () => bottomSheetRef.current?.expand(),
      collapse: () => bottomSheetRef.current?.collapse(),
    }));

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      [],
    );

    return (
      <BottomSheetComponent
        ref={bottomSheetRef}
        index={initialIndex}
        snapPoints={snapPoints}
        enablePanDownToClose={enablePanDownToClose}
        backdropComponent={renderBackdrop}
        handleComponent={handleComponent}
        handleIndicatorStyle={{
          backgroundColor: colors.textTertiary,
          width: 40,
          height: 4,
          borderRadius: 2,
        }}
        backgroundStyle={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: borderRadius.xl,
          borderTopRightRadius: borderRadius.xl,
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxxxl,
          }}
        >
          {children}
        </BottomSheetScrollView>
      </BottomSheetComponent>
    );
  },
);

BottomSheet.displayName = 'BottomSheet';
