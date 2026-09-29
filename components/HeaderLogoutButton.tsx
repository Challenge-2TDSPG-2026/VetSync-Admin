import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { AppIcon } from './AppIcon';

export function HeaderLogoutButton() {
  const { logout } = useAuth();
  return (
    <Pressable onPress={logout} style={s.btn} hitSlop={10}>
      <AppIcon name="log-out-outline" size={21} color="#fff" />
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { paddingHorizontal: 14, paddingVertical: 6 },
});
