import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ComercioCard, QRMuestra } from '@/components/dominio';
import { Card, Gap, Icon, Screen, Segmented, Txt } from '@/components/ui';
import { COMERCIOS } from '@/data/mock';
import { useApp } from '@/state/AppContext';
import { colors, fonts, formatCOP, radius, space } from '@/theme';

export default function PagarQR() {
  const { perfil, saldo } = useApp();
  const [vista, setVista] = useState<'escanear' | 'mi-codigo'>('escanear');
  const idUsuario = `QP-${(perfil?.correo ?? 'demo').length.toString().padStart(4, '0')}-BAQ`;

  return (
    <Screen>
      <Segmented
        options={[
          { id: 'escanear', label: 'Escanear comercio' },
          { id: 'mi-codigo', label: 'Mi código' },
        ]}
        value={vista}
        onChange={setVista}
      />
      <Gap />
      {vista === 'escanear' ? (
        <>
          <View style={styles.visor}>
            <View style={styles.marco}>
              <Icon name="qr-code-outline" size={64} color="rgba(255,255,255,0.55)" />
            </View>
            <Gap h={space.md} />
            <Txt v="small" color="rgba(255,255,255,0.8)" style={{ textAlign: 'center' }}>
              Apunta al código QR del comercio para abrir su ficha y pagar con tu saldo.
            </Txt>
          </View>
          <Gap />
          <Txt v="label">Modo demo: elige el comercio escaneado</Txt>
          <Gap h={space.sm} />
          <View style={{ gap: space.sm }}>
            {COMERCIOS.map((c) => (
              <ComercioCard key={c.id} c={c} />
            ))}
          </View>
        </>
      ) : (
        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaMarca}>
            QUILLA<Text style={{ color: colors.amarillo }}>PASS</Text>
          </Text>
          <Txt v="small" color="rgba(255,255,255,0.8)">
            Tarjeta de {perfil?.nombre}
          </Txt>
          <Gap />
          <View style={{ alignItems: 'center' }}>
            <QRMuestra valor={idUsuario} size={190} />
            <Gap h={space.md} />
            <Text style={styles.id}>{idUsuario}</Text>
          </View>
          <Gap />
          <Card style={{ backgroundColor: colors.azulSuave, borderColor: 'transparent' }}>
            <Txt v="small" color="rgba(255,255,255,0.85)">
              Muestra este código en puntos habilitados y comercios. También funciona impreso en la tarjeta física de
              Quilla Pass. Saldo disponible: {formatCOP(saldo)}.
            </Txt>
          </Card>
          <Gap h={space.sm} />
          <Text style={styles.link} onPress={() => router.push('/billetera')}>
            Ver mis movimientos
          </Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  visor: { backgroundColor: colors.azul, borderRadius: radius.lg, padding: space.xl, alignItems: 'center' },
  marco: {
    width: 200,
    height: 200,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: colors.amarillo,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarjeta: { backgroundColor: colors.azul, borderRadius: radius.lg, padding: space.xl },
  tarjetaMarca: { fontFamily: fonts.black, fontSize: 24, color: colors.blanco },
  id: { fontFamily: fonts.black, fontSize: 18, letterSpacing: 3, color: colors.amarillo },
  link: { fontFamily: fonts.extra, fontSize: 15, color: colors.amarillo, textAlign: 'center' },
});
