import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import gemini from '../services/gemini'

/**
 * Simple banner component that auto-loads and displays AI-generated shift summary
 * Use this at the top of shift detail screens for quick context
 */
const ShiftSummaryBanner = ({ shiftId }) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSummary();
  }, [shiftId]);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await gemini.getShiftSummary(shiftId);
      setSummary(result.summary || 'No summary available');
    } catch (err) {
      setError(err.message);
      console.error('Failed to load summary:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Generating AI summary...</Text>
      </View>
    );
  }

  if (error) {
    return null; // Silently fail - summary is optional
  }

  if (!summary) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>✨</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>AI Summary</Text>
        <Text style={styles.summaryText}>{summary}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
});

export default ShiftSummaryBanner;
