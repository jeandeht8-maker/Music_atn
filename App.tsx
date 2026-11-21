import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Song = {
  id: string;
  attributes: {
    name: string;
    artistName: string;
    albumName?: string;
    artwork?: { url: string; width?: number; height?: number };
    url: string;
    durationInMillis?: number;
  };
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
const STOREFRONT = process.env.EXPO_PUBLIC_APPLE_MUSIC_STOREFRONT || 'us';

function artworkUrl(url?: string) {
  return url?.replace('{w}', '160').replace('{h}', '160');
}

function durationLabel(duration?: number) {
  if (!duration) return '';
  const seconds = Math.floor(duration / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function searchMusic() {
    const term = query.trim();
    if (!term) {
      setSongs([]);
      setError('Escribe una canción, artista o álbum para buscar.');
      return;
    }
    if (!API_BASE_URL) {
      setError('Configura EXPO_PUBLIC_API_URL para conectar con el servidor de tokens.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const tokenResponse = await fetch(`${API_BASE_URL}/api/developer-token`);
      if (!tokenResponse.ok) throw new Error('No se pudo obtener el token de Apple Music.');
      const { token } = (await tokenResponse.json()) as { token: string };

      const params = new URLSearchParams({ term, types: 'songs', limit: '25' });
      const catalogResponse = await fetch(
        `https://api.music.apple.com/v1/catalog/${STOREFRONT}/search?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!catalogResponse.ok) {
        throw new Error(`Apple Music respondió con el código ${catalogResponse.status}.`);
      }
      const data = await catalogResponse.json();
      setSongs((data.results?.songs?.data ?? []) as Song[]);
      if ((data.results?.songs?.data ?? []).length === 0) setError('No encontramos canciones para esa búsqueda.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Ocurrió un error al buscar música.');
      setSongs([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Text style={styles.eyebrow}>MUSIC ATN</Text>
        <Text style={styles.title}>Tu música,{ '\n' }a tu manera.</Text>
        <Text style={styles.subtitle}>Busca en el catálogo de Apple Music.</Text>

        <View style={styles.searchRow}>
          <TextInput
            accessibilityLabel="Buscar canciones, artistas o álbumes"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={searchMusic}
            placeholder="Canción, artista o álbum"
            placeholderTextColor="#858595"
            returnKeyType="search"
            style={styles.input}
          />
          <TouchableOpacity accessibilityRole="button" onPress={searchMusic} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Buscar</Text>
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator color="#ff375f" style={styles.loader} /> : null}
        {!!error && <Text accessibilityLiveRegion="polite" style={styles.message}>{error}</Text>}

        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View style={styles.songRow}>
              {item.attributes.artwork?.url ? (
                <Image source={{ uri: artworkUrl(item.attributes.artwork.url) }} style={styles.artwork} />
              ) : <View style={[styles.artwork, styles.artworkPlaceholder]} />}
              <View style={styles.songInfo}>
                <Text numberOfLines={1} style={styles.songTitle}>{item.attributes.name}</Text>
                <Text numberOfLines={1} style={styles.artist}>{item.attributes.artistName}</Text>
                <Text numberOfLines={1} style={styles.album}>
                  {item.attributes.albumName}{item.attributes.durationInMillis ? ` · ${durationLabel(item.attributes.durationInMillis)}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="link"
                accessibilityLabel={`Abrir ${item.attributes.name} en Apple Music`}
                onPress={() => Linking.openURL(item.attributes.url)}
                style={styles.openButton}
              >
                <Text style={styles.openButtonText}>Abrir</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={!loading && !error ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>♫</Text>
              <Text style={styles.emptyTitle}>Empieza por buscar</Text>
              <Text style={styles.emptyText}>Los resultados vienen directamente del catálogo de Apple Music.</Text>
            </View>
          ) : null}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#101014' },
  container: { flex: 1, paddingHorizontal: 22, paddingTop: 22 },
  eyebrow: { color: '#ff375f', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#fff', fontSize: 38, fontWeight: '800', lineHeight: 43, marginTop: 12 },
  subtitle: { color: '#a5a5b2', fontSize: 15, marginTop: 10, marginBottom: 24 },
  searchRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, minHeight: 50, color: '#fff', backgroundColor: '#202027', borderRadius: 12, paddingHorizontal: 15, fontSize: 15 },
  searchButton: { backgroundColor: '#ff375f', borderRadius: 12, justifyContent: 'center', paddingHorizontal: 18 },
  searchButtonText: { color: '#fff', fontWeight: '700' },
  loader: { marginTop: 24 },
  message: { color: '#ff9bac', marginTop: 16 },
  list: { paddingTop: 18, paddingBottom: 30 },
  songRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 14 },
  artwork: { width: 58, height: 58, borderRadius: 8, backgroundColor: '#2a2a33' },
  artworkPlaceholder: { backgroundColor: '#2a2a33' },
  songInfo: { flex: 1, marginHorizontal: 12 },
  songTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  artist: { color: '#c3c3cd', fontSize: 13, marginTop: 3 },
  album: { color: '#858595', fontSize: 12, marginTop: 3 },
  openButton: { borderColor: '#4b4b57', borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  openButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 66 },
  emptyIcon: { color: '#ff375f', fontSize: 44 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptyText: { color: '#858595', fontSize: 14, lineHeight: 21, marginTop: 8, textAlign: 'center' },
});
