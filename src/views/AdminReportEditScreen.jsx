// src/views/AdminReportEditScreen.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import colors from '../theme/colors';
import { updateIncidentDoc } from '../services/firestoreService';
import AssignmentPicker from '../components/AssignmentPicker';

export default function AdminReportEditScreen({ route, navigation }) {
  const incident = route?.params?.incident;
  const [assignTo, setAssignTo] = useState({
    groupId: incident?.assignedToGroupId || '',
    groupLabel: incident?.assignedToGroupLabel || '',
    unitId: incident?.assignedToUnitId || '',
    unitLabel: incident?.assignedToUnitLabel || '',
  });

  const handleSave = async () => {
    try {
      await updateIncidentDoc(incident.id, {
        assignedToGroupId: assignTo.groupId || null,
        assignedToGroupLabel: assignTo.groupLabel || null,
        assignedToUnitId: assignTo.unitId || null,
        assignedToUnitLabel: assignTo.unitLabel || null,
      });
      Alert.alert('OK', 'Reporte actualizado');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Editar reporte</Text>

      <AssignmentPicker value={assignTo} onChange={setAssignTo} />

      <TouchableOpacity style={styles.btn} onPress={handleSave}>
        <Text style={styles.btnText}>Guardar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: colors.bg },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: colors.text },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
