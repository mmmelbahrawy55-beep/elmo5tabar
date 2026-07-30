import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, {
  Marker,
  Callout,
  PROVIDER_GOOGLE,
  Region,
} from 'react-native-maps';
import { useTheme } from '../../theme/ThemeContext';

interface BranchLocation {
  id: string;
  name: string;
  nameAr: string;
  latitude: number;
  longitude: number;
  distance?: number;
  isOpen: boolean;
}

interface BranchMapProps {
  branches: BranchLocation[];
  initialRegion?: Region;
  onMarkerPress?: (branch: BranchLocation) => void;
  selectedBranchId?: string;
  showUserLocation?: boolean;
}

export const BranchMap: React.FC<BranchMapProps> = ({
  branches,
  initialRegion,
  onMarkerPress,
  selectedBranchId,
  showUserLocation = true,
}) => {
  const { theme } = useTheme();
  const { colors, borderRadius, spacing, typography } = theme;
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(
    initialRegion || {
      latitude: 24.7136,
      longitude: 46.6753,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    },
  );

  const defaultRegion: Region = {
    latitude: 24.7136,
    longitude: 46.6753,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  const fitAllMarkers = () => {
    if (branches.length > 0 && mapRef.current) {
      const coordinates = branches.map((b) => ({
        latitude: b.latitude,
        longitude: b.longitude,
      }));
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }
  };

  useEffect(() => {
    if (branches.length > 0) {
      fitAllMarkers();
    }
  }, [branches]);

  return (
    <View style={{ flex: 1, borderRadius: borderRadius.lg, overflow: 'hidden' }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={defaultRegion}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={true}
        showsCompass={true}
      >
        {branches.map((branch) => (
          <Marker
            key={branch.id}
            coordinate={{
              latitude: branch.latitude,
              longitude: branch.longitude,
            }}
            title={branch.nameAr}
            description={branch.name}
            pinColor={branch.id === selectedBranchId ? colors.primary : colors.secondary}
            onPress={() => onMarkerPress?.(branch)}
          >
            <Callout>
              <View style={{ padding: spacing.sm }}>
                <Text
                  style={{
                    fontSize: typography.fontSize.md,
                    fontWeight: '600',
                    color: colors.text,
                    fontFamily: typography.fontFamily.arabic.bold,
                  }}
                >
                  {branch.nameAr}
                </Text>
                {branch.distance !== undefined && (
                  <Text
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.textSecondary,
                      marginTop: spacing.xxs,
                    }}
                  >
                    {branch.distance.toFixed(1)} km
                  </Text>
                )}
                <Text
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: branch.isOpen ? colors.success : colors.error,
                    marginTop: spacing.xxs,
                  }}
                >
                  {branch.isOpen ? 'Open Now' : 'Closed'}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};
