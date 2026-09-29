import { Alert, Platform } from 'react-native';

/**
 * Pede confirmação ao usuário (window.confirm na web, Alert no nativo).
 *   await confirmar('Remover este item?')                       // botão "Remover"
 *   await confirmar('Negar esta prescrição?', 'Negar')          // botão parametrizável
 */
export function confirmar(mensagem: string, textoConfirmar = 'Remover', titulo = 'Confirmar'): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(mensagem));
  }
  return new Promise((resolve) => {
    Alert.alert(
      titulo,
      mensagem,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: textoConfirmar, style: 'destructive', onPress: () => resolve(true) },
      ],
      // Android: tocar fora do diálogo também precisa resolver a Promise.
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}