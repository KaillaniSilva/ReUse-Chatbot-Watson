import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface SectionCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Card reutilizável para agrupar conteúdo em blocos visuais.
 * Usado para destacar seções como "Proposta" e "O problema" na tela inicial.
 */
export function SectionCard({ children, style }: SectionCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F5F9F5',
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0EDE0',
  },
});
