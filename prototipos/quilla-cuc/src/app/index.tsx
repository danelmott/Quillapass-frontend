import { Redirect } from 'expo-router';

import { useApp } from '@/state/AppContext';

export default function Entrada() {
  const { perfil } = useApp();
  return <Redirect href={perfil ? '/(tabs)' : '/bienvenida'} />;
}
