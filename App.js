import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import * as Location from 'expo-location';

const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;

const getWeatherTheme = (condition) => {
  const c = condition?.toLowerCase() || '';
  if (c.includes('clear')) return { bg: '#FF8C42', accent: '#FFD166', emoji: '☀️' };
  if (c.includes('cloud')) return { bg: '#6B7FA3', accent: '#A8BCDC', emoji: '☁️' };
  if (c.includes('rain') || c.includes('drizzle')) return { bg: '#3A6B8A', accent: '#74B3D4', emoji: '🌧️' };
  if (c.includes('snow')) return { bg: '#8FB4CC', accent: '#D6EAF8', emoji: '❄️' };
  if (c.includes('thunder') || c.includes('storm')) return { bg: '#2C3E50', accent: '#8E44AD', emoji: '⛈️' };
  if (c.includes('mist') || c.includes('fog') || c.includes('haze')) return { bg: '#7F8C8D', accent: '#BDC3C7', emoji: '🌫️' };
  return { bg: '#3B7DD8', accent: '#74B3D4', emoji: '🌤️' };
};

export default function App() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const getWeatherData = useCallback(async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Please enable it in your device settings.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to fetch weather data');
      }

      const data = await response.json();
      setWeather(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    await getWeatherData();
    setLoading(false);
  }, [getWeatherData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await getWeatherData();
    setRefreshing(false);
  }, [getWeatherData]);

  useEffect(() => {
    load();
  }, [load]);

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Locating you...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorDetail}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={load}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!weather) return null;

  const condition = weather.weather[0].main;
  const description = weather.weather[0].description;
  const theme = getWeatherTheme(condition);

  const temp = Math.round(weather.main.temp);
  const feelsLike = Math.round(weather.main.feels_like);
  const humidity = weather.main.humidity;
  const windSpeed = Math.round(weather.wind.speed * 3.6); // m/s → km/h
  const city = weather.name;
  const country = weather.sys.country;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.bg }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#fff"
        />
      }
    >
      <StatusBar barStyle="light-content" />

      <Text style={styles.locationText}>📍 {city}, {country}</Text>

      <Text style={styles.bigEmoji}>{theme.emoji}</Text>

      <Text style={styles.tempText}>{temp}°</Text>
      <Text style={styles.conditionText}>{description}</Text>
      <Text style={[styles.feelsLikeText, { color: theme.accent }]}>
        Feels like {feelsLike}°
      </Text>

      <View style={styles.divider} />

      <View style={styles.detailsRow}>
        <View style={styles.detailBox}>
          <Text style={styles.detailEmoji}>💧</Text>
          <Text style={styles.detailValue}>{humidity}%</Text>
          <Text style={styles.detailLabel}>Humidity</Text>
        </View>
        <View style={styles.detailBox}>
          <Text style={styles.detailEmoji}>💨</Text>
          <Text style={styles.detailValue}>{windSpeed}</Text>
          <Text style={styles.detailLabel}>km/h Wind</Text>
        </View>
      </View>

      {lastUpdated && (
        <Text style={styles.updatedText}>
          Updated at {formatTime(lastUpdated)} · Pull to refresh
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: '#3B7DD8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
    fontWeight: '500',
  },
  errorEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorDetail: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 50,
    paddingHorizontal: 30,
  },
  locationText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  bigEmoji: {
    fontSize: 100,
    marginBottom: 10,
  },
  tempText: {
    color: '#fff',
    fontSize: 96,
    fontWeight: '200',
    lineHeight: 100,
  },
  conditionText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 20,
    textTransform: 'capitalize',
    marginTop: 8,
  },
  feelsLikeText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 6,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: 30,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 40,
  },
  detailBox: {
    alignItems: 'center',
  },
  detailEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  detailValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 2,
  },
  updatedText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 40,
  },
});
