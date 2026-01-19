import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import api from '../services/api';
import gemini from '../services/gemini'

/**
 * Component to display AI-powered analysis of shift notes
 * Provides suggestions and priorities for the next shift
 */
const ShiftAIAnalysis = ({ shiftId, careRecipientName }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSummary, setExpandedSummary] = useState(true);
  const [expandedPriorities, setExpandedPriorities] = useState(true);
  const [expandedSuggestions, setExpandedSuggestions] = useState(true);

  const analyzeShift = async () => {
    setLoading(true);
    setError(null);
    console.log("analyzeShift called with shiftId:", shiftId);
    try {
      const result = await gemini.analyzeShiftNotes(shiftId);
      console.log("Analysis result:", result);
      setAnalysis(result);
      setExpandedSummary(true);
      setExpandedPriorities(true);
      setExpandedSuggestions(true);
    } catch (err) {
      setError(err.message || 'Failed to analyze shift notes');
      console.error('Error analyzing shift:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Analyze Button */}
      <View style={styles.header}>
        <Text style={styles.title}>AI Shift Analysis</Text>
        <TouchableOpacity
          style={styles.analyzeButton}
          onPress={analyzeShift}
          disabled={loading}
        >
          <Text style={styles.analyzeButtonText}>
            {loading ? 'Analyzing...' : 'Get Suggestions'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            Analyzing shift notes with AI...
          </Text>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <Text style={styles.errorHint}>
            Make sure the backend server is running and Gemini API is configured.
          </Text>
        </View>
      )}

      {/* Analysis Results */}
      {analysis && !loading && (
        <ScrollView
          style={styles.resultsContainer}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
        >
          {/* Summary Section */}
          {analysis.summary && (
            <View style={styles.section}>
              <TouchableOpacity
                onPress={() => setExpandedSummary(!expandedSummary)}
                style={styles.sectionHeader}
              >
                <Text style={styles.sectionTitle}>
                  📋 Summary
                </Text>
                <Text style={styles.expandIcon}>
                  {expandedSummary ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
              {expandedSummary && (
                <Text style={styles.summaryText}>{analysis.summary}</Text>
              )}
            </View>
          )}

          {/* Priorities Section */}
          {analysis.priorities && analysis.priorities.length > 0 && (
            <View style={styles.section}>
              <TouchableOpacity
                onPress={() => setExpandedPriorities(!expandedPriorities)}
                style={styles.sectionHeader}
              >
                <Text style={styles.sectionTitle}>🔴 Top Priorities</Text>
                <Text style={styles.expandIcon}>
                  {expandedPriorities ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
              {expandedPriorities && analysis.priorities.map((priority, index) => (
                <View key={index} style={styles.priorityItem}>
                  <View style={styles.priorityBullet} />
                  <Text style={styles.priorityText}>{priority}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Suggestions Section */}
          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <View style={styles.section}>
              <TouchableOpacity
                onPress={() => setExpandedSuggestions(!expandedSuggestions)}
                style={styles.sectionHeader}
              >
                <Text style={styles.sectionTitle}>💡 Suggestions for Next Shift</Text>
                <Text style={styles.expandIcon}>
                  {expandedSuggestions ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
              {expandedSuggestions && analysis.suggestions.map((suggestion, index) => (
                <View key={index} style={styles.suggestionItem}>
                  <Text style={styles.suggestionBullet}>•</Text>
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Empty State */}
          {!analysis.summary &&
            (!analysis.suggestions || analysis.suggestions.length === 0) &&
            (!analysis.priorities || analysis.priorities.length === 0) && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No analysis available. This shift may not have any notes yet.
                </Text>
              </View>
            )}
        </ScrollView>
      )}

      {/* Initial State - No Analysis Yet */}
      {!analysis && !loading && !error && (
        <View style={styles.initialState}>
          <Text style={styles.initialStateIcon}>🤖</Text>
          <Text style={styles.initialStateText}>
            Get AI-powered suggestions for the next shift
          </Text>
          <Text style={styles.initialStateHint}>
            Tap "Get Suggestions" to analyze shift notes
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  analyzeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  analyzeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  errorText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorHint: {
    color: '#856404',
    fontSize: 12,
  },
  resultsContainer: {
    maxHeight: 400,
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  expandIcon: {
    fontSize: 12,
    color: '#666',
  },
  summaryText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    fontStyle: 'italic',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#DC3545',
  },
  priorityBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC3545',
    marginTop: 6,
    marginRight: 10,
  },
  priorityText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingLeft: 8,
  },
  suggestionBullet: {
    fontSize: 18,
    color: '#007AFF',
    marginRight: 8,
    marginTop: -2,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  initialState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  initialStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  initialStateText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  initialStateHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default ShiftAIAnalysis;
