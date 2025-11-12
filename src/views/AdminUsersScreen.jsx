// src/views/AdminUsersScreen.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import {
  subscribeUsers,
  upsertUserDoc,
  updateUserDocFields,
  deleteUserDoc,
} from '../services/firestoreService';
import { currentUser } from '../services/authService';
import * as FileSystem from 'expo-file-system/legacy'; // ✅ usar API legacy para compatibilidad

const ROLES = ['admin', 'user'];
const ROLE_COLORS = {
  admin: { bg: '#FEE2E2', text: '#991B1B' },
  user:  { bg: '#E0F2FE', text: '#055382' },
};

export default function AdminUsersScreen() {
  const me = currentUser();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  // filtros
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('todos');

  // modal create/edit
  const [showEdit, setShowEdit] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // {id,email,displayName,role}
  const [uid, setUid] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('user');
  const [saving, setSaving] = useState(false);

  // role picker
  const [showRolePicker, setShowRolePicker] = useState(false);

  useEffect(() => {
    const unsub = subscribeUsers({
      onData: (list) => {
        setRows(list);
        setLoading(false);
      },
      onError: (e) => {
        console.error(e);
        setError('No fue posible cargar usuarios.');
        setLoading(false);
      },
    });
    return () => unsub && unsub();
  }, []);

  // helpers
  function countAdmins(list) {
    return list.reduce((acc, u) => acc + (String(u.role || 'user').toLowerCase() === 'admin' ? 1 : 0), 0);
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((u) => {
      const r = String(u.role || 'user').toLowerCase();
      const matchesQ =
        !term ||
        (u.email || '').toLowerCase().includes(term) ||
        (u.displayName || '').toLowerCase().includes(term) ||
        (u.id || '').toLowerCase().includes(term);
      const matchesRole = roleFilter === 'todos' || r === roleFilter;
      return matchesQ && matchesRole;
    });
  }, [rows, q, roleFilter]);

  function openCreate() {
    setEditingUser(null);
    setUid('');
    setEmail('');
    setDisplayName('');
    setRole('user');
    setShowEdit(true);
  }

  function openEdit(u) {
    setEditingUser(u);
    setUid(u.id);
    setEmail(u.email || '');
    setDisplayName(u.displayName || '');
    setRole(String(u.role || 'user').toLowerCase());
    setShowEdit(true);
  }

  async function onSave() {
    const uidTrim = uid.trim();
    const emailTrim = email.trim();
    if (!uidTrim) return Alert.alert('Dato faltante', 'UID es obligatorio.');
    if (!emailTrim) return Alert.alert('Dato faltante', 'Email es obligatorio.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      return Alert.alert('Email inválido', 'Verifica el formato del correo.');
    }

    try {
      setSaving(true);
      await upsertUserDoc({
        uid: uidTrim,
        email: emailTrim,
        displayName: (displayName || '').trim(),
        role: String(role || 'user').trim().toLowerCase(),
      });
      setShowEdit(false);
      setEditingUser(null);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No fue posible guardar el usuario.');
    } finally {
      setSaving(false);
    }
  }

  function onDelete(u) {
    if (u.id === me?.uid) {
      return Alert.alert('Acción no permitida', 'No puedes eliminar tu propio usuario.');
    }
    const admins = countAdmins(rows);
    const isAdmin = String(u.role || 'user').toLowerCase() === 'admin';
    if (isAdmin && admins <= 1) {
      return Alert.alert('Acción no permitida', 'No puedes eliminar al último administrador.');
    }

    Alert.alert('Eliminar', `¿Eliminar el usuario ${u.email}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUserDoc(u.id);
          } catch (e) {
            console.error(e);
            Alert.alert('Error', 'No fue posible eliminar.');
          }
        },
      },
    ]);
  }

  async function quickRoleToggle(u) {
    if (u.id === me?.uid) {
      return Alert.alert('Acción no permitida', 'No puedes cambiar tu propio rol aquí.');
    }
    const current = String(u.role || 'user').toLowerCase();
    const next = current === 'admin' ? 'user' : 'admin';

    const admins = countAdmins(rows);
    if (current === 'admin' && admins <= 1) {
      return Alert.alert('Acción no permitida', 'No puedes quitar el rol al último administrador.');
    }

    try {
      await updateUserDocFields(u.id, { role: next });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No fue posible actualizar el rol.');
    }
  }

  // ===== CSV helpers (usuarios) =====
  function csvEscape(val) {
    if (val == null) return '';
    const s = String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }
  function usersToCsv(data) {
    const header = ['uid', 'email', 'displayName', 'role'];
    const lines = [header.join(',')];
    for (const u of data) {
      lines.push([
        csvEscape(u.id),
        csvEscape(u.email || ''),
        csvEscape(u.displayName || ''),
        csvEscape(String(u.role || 'user')),
      ].join(','));
    }
    return '\uFEFF' + lines.join('\n'); // BOM UTF-8 para Excel
  }
  async function exportUsersCsv(list) {
    try {
      const data = list && list.length ? list : filtered;
      if (!data.length) return Alert.alert('Exportar', 'No hay usuarios para exportar.');
      const csv = usersToCsv(data);
      const fileUri = FileSystem.documentDirectory + `usuarios_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: 'utf8' });

      // Intento con expo-sharing si existe; si no, Share nativo
      let shared = false;
      try {
        const Sharing = await import('expo-sharing');
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Exportar usuarios' });
          shared = true;
        }
      } catch (_) {}
      if (!shared) {
        await Share.share({
          url: fileUri,
          message: 'Exportación de usuarios',
          title: 'Exportar usuarios',
        });
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No fue posible exportar el CSV.');
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.danger || '#ef4444' }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* header + filtros */}
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 }}>
          Usuarios
        </Text>

        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Buscar por email, nombre o UID"
            style={styles.input}
            autoCapitalize="none"
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity style={styles.btnPrimary} onPress={openCreate}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', marginLeft: 6 }}>Nuevo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnPrimary, { backgroundColor: '#10b981' }]}
            onPress={() => exportUsersCsv(filtered)}
          >
            <Ionicons name="download" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', marginLeft: 6 }}>Exportar</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' }}>
          {['todos', 'admin', 'user'].map((r) => {
            const active = roleFilter === r;
            const scheme =
              r === 'admin'
                ? ROLE_COLORS.admin
                : r === 'user'
                ? ROLE_COLORS.user
                : { bg: '#111827', text: '#fff' };
            return (
              <TouchableOpacity
                key={r}
                onPress={() => setRoleFilter(r)}
                style={[
                  styles.chip,
                  { backgroundColor: active ? scheme.bg : '#fff', borderColor: active ? scheme.bg : '#e5e7eb' },
                ]}
              >
                <Text style={{ color: active ? scheme.text : '#111827', fontWeight: '700' }}>{r}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={{ color: '#6B7280', marginTop: 6 }}>
          {filtered.length} {filtered.length === 1 ? 'usuario' : 'usuarios'}
        </Text>
      </View>

      {/* lista */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <UserCard
            item={item}
            onEdit={() => openEdit(item)}
            onDelete={() => onDelete(item)}
            onToggleRole={() => quickRoleToggle(item)}
          />
        )}
        ListEmptyComponent={
          <View style={{ padding: 24 }}>
            <Text style={{ color: '#6B7280' }}>No hay usuarios.</Text>
          </View>
        }
      />

      {/* modal create/edit */}
      <Modal visible={showEdit} transparent animationType="slide" onRequestClose={() => setShowEdit(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 4 }}>
              {editingUser ? 'Editar usuario' : 'Nuevo usuario'}
            </Text>
            <Text style={{ color: '#6B7280', marginBottom: 12 }}>
              {editingUser ? `UID: ${editingUser.id}` : 'Define un UID (igual al de Firebase Auth)'}
            </Text>

            <Text style={styles.label}>UID</Text>
            <TextInput
              value={uid}
              onChangeText={setUid}
              editable={!editingUser}
              placeholder="p.ej. uid de Firebase Auth"
              style={[
                styles.input,
                editingUser && { backgroundColor: '#f3f4f6', color: '#6B7280' },
              ]}
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="correo@dominio.com"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              placeholderTextColor="#9CA3AF"
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Nombre</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Nombre para mostrar"
              style={styles.input}
              placeholderTextColor="#9CA3AF"
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Rol</Text>
            <TouchableOpacity
              onPress={() => setShowRolePicker(true)}
              style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
            >
              <Text style={{ color: '#111827' }}>{role}</Text>
              <Ionicons name="chevron-down" size={18} color="#111827" />
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => setShowEdit(false)}>
                <Text style={{ color: '#111827', fontWeight: '700' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPrimary, saving && { opacity: 0.6 }]}
                onPress={onSave}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* picker de rol */}
      <Modal visible={showRolePicker} transparent animationType="slide" onRequestClose={() => setShowRolePicker(false)}>
        <View style={styles.backdrop}>
          <View style={styles.listSheet}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#f3f4f6' }}>
              <Text style={{ fontSize: 16, fontWeight: '800' }}>Selecciona rol</Text>
            </View>
            <FlatList
              data={ROLES}
              keyExtractor={(x) => x}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { setRole(item); setShowRolePicker(false); }}
                  style={{ padding: 16, borderBottomWidth: 1, borderColor: '#f3f4f6' }}
                >
                  <Text style={{ fontSize: 15 }}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setShowRolePicker(false)} style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ fontWeight: '700' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function UserCard({ item, onEdit, onDelete, onToggleRole }) {
  const r = String(item.role || 'user').toLowerCase();
  const c = ROLE_COLORS[r] || { bg: '#F3F4F6', text: '#374151' };

  return (
    <View style={styles.card}>
      <Text style={{ fontWeight: '800', marginBottom: 2 }} numberOfLines={1} ellipsizeMode="tail">
        {item.displayName || 'Sin nombre'}
      </Text>
      <Text style={{ color: '#4B5563' }} numberOfLines={1} ellipsizeMode="tail">
        {item.email || 'sin email'}
      </Text>
      <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 8 }} numberOfLines={1} ellipsizeMode="tail">
        UID: {item.id}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <View style={{ backgroundColor: c.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
          <Text style={{ color: c.text, fontWeight: '700' }}>{r}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }} />
        <IconBtn name="swap-horizontal" color="#8b5cf6" onPress={onToggleRole} />
        <IconBtn name="create" color="#0ea5e9" onPress={onEdit} />
        <IconBtn name="trash" color="#ef4444" onPress={onDelete} />
      </View>
    </View>
  );
}

function IconBtn({ name, color = '#111827', size = 22, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ padding: 8 }}>
      <Ionicons name={name} size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    color: '#111827',
  },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.primary },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, marginRight: 8, marginBottom: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '90%' },
  listSheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%' },
  label: { fontWeight: '700', fontSize: 14, marginBottom: 8, color: colors.text },
  btnGhost: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#f3f4f6' },
});
