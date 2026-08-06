import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSavedPlaces, addSavedPlace, deleteSavedPlace } from '@/services/apiService';
import { getPlacePredictions } from '@/hooks/location/getPlacePredictions';
import { getPlaceDetails } from '@/hooks/location/getPlaceDetails';
import { getCurrentLocation } from '@/services/locationServices';

interface Place {
  _id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface Prediction {
  description: string;
  place_id: string;
}

const LABELS = ['Home', 'Work', 'Gym', 'Custom'];

export default function SavedPlacesScreen() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const [label, setLabel] = useState('Home');
  const [customLabel, setCustomLabel] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Prediction[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchPlaces = useCallback(async () => {
    try {
      const data = await getSavedPlaces();
      setPlaces(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load saved places');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPlaces();
    }, [fetchPlaces])
  );

  const openModal = () => {
    setLabel('Home');
    setCustomLabel('');
    setQuery('');
    setResults([]);
    setModalVisible(true);
  };

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }
    try {
      const loc = await getCurrentLocation();
      if (!loc) return;
      const predictions = await getPlacePredictions(text, loc.latitude, loc.longitude);
      setResults(predictions);
    } catch (err) {
      console.log('Autocomplete error:', err);
    }
  };

  const handleSave = async () => {
    const resolvedLabel = label === 'Custom' && customLabel.trim() ? customLabel.trim() : label;
    if (!resolvedLabel) {
      Alert.alert('Error', 'Please choose a label for this place.');
      return;
    }
    if (!query) {
      Alert.alert('Error', 'Please search and select an address.');
      return;
    }
    // Find the selected prediction to fetch its coordinates
    const selection = results.find((r) => r.description === query);
    if (!selection) {
      Alert.alert('Error', 'Please select an address from the suggestions.');
      return;
    }

    setSaving(true);
    try {
      const coords = await getPlaceDetails(selection.place_id);
      if (!coords) throw new Error('No coordinates');

      await addSavedPlace({
        label: resolvedLabel,
        address: query,
        latitude: coords.lat,
        longitude: coords.lng,
      });
      setModalVisible(false);
      fetchPlaces();
      Alert.alert('Success', 'Place saved!');
    } catch (err) {
      Alert.alert('Error', 'Failed to save place');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (place: Place) => {
    Alert.alert('Delete Place', `Remove "${place.label}" from saved places?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSavedPlace(place._id);
            setPlaces((prev) => prev.filter((p) => p._id !== place._id));
          } catch (err) {
            Alert.alert('Error', 'Failed to delete place');
          }
        },
      },
    ]);
  };

  const renderPlace = ({ item }: { item: Place }) => (
    <View style={styles.placeCard}>
      <View style={styles.placeIcon}>
        <MaterialCommunityIcons name="map-marker" size={22} color="#3B82F6" />
      </View>
      <View style={styles.placeInfo}>
        <Text style={styles.placeLabel}>{item.label}</Text>
        <Text style={styles.placeAddress} numberOfLines={2}>
          {item.address}
        </Text>
      </View>
      <TouchableOpacity onPress={() => confirmDelete(item)} style={styles.deleteBtn}>
        <MaterialCommunityIcons name="delete-outline" size={22} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Places</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item._id}
          renderItem={renderPlace}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <TouchableOpacity style={styles.addCard} onPress={openModal}>
              <View style={styles.addIcon}>
                <MaterialCommunityIcons name="plus" size={26} color="#3B82F6" />
              </View>
              <View style={styles.placeInfo}>
                <Text style={styles.addTitle}>Add New Place</Text>
                <Text style={styles.addDesc}>Save a frequently used location</Text>
              </View>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="map-marker-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No saved places</Text>
              <Text style={styles.emptyDesc}>
                Save your home, workplace or favourite spots for quick booking.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add a Place</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Label</Text>
            <View style={styles.labelRow}>
              {LABELS.map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[styles.labelChip, label === l && styles.labelChipActive]}
                  onPress={() => setLabel(l)}
                >
                  <Text style={[styles.labelChipText, label === l && styles.labelChipTextActive]}>
                    {l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {label === 'Custom' && (
              <TextInput
                style={styles.input}
                placeholder="Custom label (e.g. Airport)"
                placeholderTextColor="#9CA3AF"
                value={customLabel}
                onChangeText={setCustomLabel}
              />
            )}

            <Text style={styles.fieldLabel}>Search Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Search for a location"
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={handleSearch}
              autoCorrect={false}
            />
            {results.length > 0 && (
              <View style={styles.resultsBox}>
                {results.slice(0, 6).map((r) => (
                  <TouchableOpacity
                    key={r.place_id}
                    style={styles.resultItem}
                    onPress={() => {
                      Keyboard.dismiss();
                      setQuery(r.description);
                      setResults([]);
                    }}
                  >
                    <MaterialCommunityIcons name="map-marker-outline" size={18} color="#4F46E5" />
                    <Text style={styles.resultText} numberOfLines={1}>
                      {r.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Place'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  addIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  addDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  placeIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeInfo: {
    flex: 1,
  },
  placeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeAddress: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
  },
  deleteBtn: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
    marginTop: 12,
  },
  labelRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  labelChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  labelChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  labelChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  labelChipTextActive: {
    color: '#3B82F6',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  resultsBox: {
    marginTop: 8,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resultText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  saveBtn: {
    marginTop: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});
