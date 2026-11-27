import { useQueryClient } from '@tanstack/react-query';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, TextInput, View } from 'react-native';

import { FlowScreen } from '@/components/commerce/flow-screen';
import { Notice } from '@/components/commerce/notice';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, LoadingState } from '@/components/ui';
import { Brand, MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { merchantByQrQuery } from '@/hooks/use-commerce-queries';
import { describeError, type FriendlyError } from '@/lib/commerce-errors';
import { env } from '@/lib/env';
import { DEMO_MERCHANTS } from '@/mocks';

/**
 * G5: lector QR con `expo-camera`. Al leer un código lo resuelve con el backend
 * (`POST /commerce/qr/resolve`, que valida la firma HMAC) y abre el comercio.
 * Si no hay cámara (web, emulador) o la persona no da permiso, puede escribir el código.
 */
export default function ScanScreen() {
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [focused, setFocused] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<FriendlyError | null>(null);
  const [manualCode, setManualCode] = useState('');
  // Evita procesar el mismo QR varias veces: la cámara lo reporta en cada cuadro.
  const handlingRef = useRef(false);

  // Solo una vista de cámara puede estar activa: se desmonta al salir de la pantalla.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const resolve = async (payload: string) => {
    if (handlingRef.current || payload.trim() === '') return;
    handlingRef.current = true;
    setError(null);
    setResolving(true);
    try {
      await queryClient.fetchQuery(merchantByQrQuery(payload));
      router.replace({ pathname: '/comercio', params: { qr: payload } });
    } catch (err) {
      setError(describeError(err));
    } finally {
      setResolving(false);
    }
  };

  const scanAgain = () => {
    setError(null);
    handlingRef.current = false;
  };

  const onScanned = (result: BarcodeScanningResult) => {
    void resolve(result.data);
  };

  const cameraGranted = permission?.granted === true;
  const showCamera = cameraGranted && focused && !error;

  return (
    <FlowScreen>
      <ThemedText type="body" style={styles.text}>
        Apunta la cámara al código QR que muestra el comercio en su caja.
      </ThemedText>

      {permission === null ? (
        <View style={styles.viewfinder}>
          <LoadingState message="Preparando la cámara…" />
        </View>
      ) : !cameraGranted ? (
        <Notice
          tone="info"
          title="Necesitamos la cámara"
          message={
            permission.canAskAgain
              ? 'La usamos solo para leer el QR del comercio. No tomamos fotos.'
              : 'El permiso de cámara está desactivado para QuillaPass. Actívalo en Ajustes o escribe el código abajo.'
          }
          actions={[
            permission.canAskAgain
              ? { label: 'Permitir cámara', onPress: () => void requestPermission() }
              : { label: 'Abrir ajustes', onPress: () => void Linking.openSettings() },
          ]}
        />
      ) : (
        <View style={styles.viewfinder}>
          {showCamera ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={resolving ? undefined : onScanned}
              accessibilityLabel="Visor de la cámara para leer el código QR"
            />
          ) : null}
          <View pointerEvents="none" style={styles.frame} />
          {resolving ? (
            <View style={styles.overlay} accessibilityLiveRegion="polite">
              <ActivityIndicator color={Brand.amarillo} size="large" />
              <ThemedText type="label" style={styles.overlayText}>
                Buscando el comercio…
              </ThemedText>
            </View>
          ) : null}
        </View>
      )}

      {error ? (
        <Notice
          tone="danger"
          title={error.title}
          message={error.message}
          actions={[{ label: 'Escanear de nuevo', onPress: scanAgain }]}
        />
      ) : null}

      <Card style={styles.card}>
        <ThemedText type="subheading" style={styles.text}>
          ¿No puedes escanear?
        </ThemedText>
        <ThemedText type="caption" style={styles.muted}>
          Escribe el código que aparece debajo del QR.
        </ThemedText>
        <TextInput
          value={manualCode}
          onChangeText={setManualCode}
          placeholder="Código del comercio"
          placeholderTextColor={Brand.textoSuave}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={() => {
            handlingRef.current = false;
            void resolve(manualCode);
          }}
          accessibilityLabel="Código del comercio"
          style={styles.input}
        />
        <Button
          label="Buscar comercio"
          variant="secondary"
          loading={resolving}
          disabled={manualCode.trim() === ''}
          onPress={() => {
            handlingRef.current = false;
            void resolve(manualCode);
          }}
        />
      </Card>

      {env.useMocks ? (
        <Card style={styles.demo}>
          <ThemedText type="label" style={styles.text}>
            Modo demo (solo con mocks)
          </ThemedText>
          <ThemedText type="caption" style={styles.muted}>
            Simula el escaneo del QR impreso de un comercio sembrado.
          </ThemedText>
          {DEMO_MERCHANTS.map((merchant) => (
            <Button
              key={merchant.id}
              label={`QR de ${merchant.name}`}
              variant="secondary"
              disabled={resolving}
              onPress={() => {
                handlingRef.current = false;
                void resolve(merchant.qrPayload);
              }}
            />
          ))}
        </Card>
      ) : null}
    </FlowScreen>
  );
}

const styles = StyleSheet.create({
  text: {
    color: Brand.texto,
  },
  muted: {
    color: Brand.textoSuave,
  },
  viewfinder: {
    height: 320,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Brand.azulSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 220,
    height: 220,
    borderWidth: 4,
    borderColor: Brand.amarillo,
    borderRadius: Radius.md,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20,35,52,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  overlayText: {
    color: Brand.blanco,
  },
  card: {
    backgroundColor: Brand.blanco,
  },
  demo: {
    backgroundColor: Brand.blanco,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Brand.textoSuave,
  },
  input: {
    minHeight: MinTouchTarget + 4,
    borderWidth: 1,
    borderColor: Brand.textoSuave,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    color: Brand.texto,
    backgroundColor: Brand.blanco,
  },
});
