import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type LoginCityscapeProps = {
  style?: StyleProp<ViewStyle>;
};

/**
 * Fondo skyline del login (ilustración de la maqueta). Anclado abajo, detrás de la card.
 */
export function LoginCityscape({ style }: LoginCityscapeProps) {
  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Image
        source={require('../../assets/images/login-bg-skyline.jpg')}
        style={styles.image}
        contentFit="cover"
        contentPosition="bottom"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
