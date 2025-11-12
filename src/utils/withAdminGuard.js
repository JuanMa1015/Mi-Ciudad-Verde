// src/utils/withAdminGuard.js
import React from 'react';
import { View, Text } from 'react-native';

export default function withAdminGuard(Component) {
  return function Guarded({ user, ...props }) {
    if (!user || user.role !== 'admin') {
      return (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:24 }}>
          <Text>No tienes permisos para ver esta pantalla.</Text>
        </View>
      );
    }
    return <Component {...props} />;
  };
}
