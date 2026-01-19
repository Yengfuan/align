import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import api from '../services/api';
import message_service from '../services/message-service';
import { Colors, TextStyles, InputStyles, ButtonStyles, ContainerStyles, BorderRadius, Shadows } from '../styles/CommonStyles';

export default function CaregiverGroupChat({ route, navigation }) {
  const { recipient, caregiver } = route.params;

  // Fetch caregivers from Supabase
  const [caregivers, setCaregivers] = useState([]);
  const [loadingCaregivers, setLoadingCaregivers] = useState(true);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollViewRef = React.useRef(null);

  useEffect(() => {
    fetchCaregivers();
    fetchMessages();

    // Subscribe to real-time messages
    const channel = message_service.subscribeToMessages(recipient.id, (newMsg) => {
      setMessages((prev) => {
        // Avoid duplicates (in case we just sent this message)
        if (prev.some(m => m.uuid === newMsg.uuid)) {
          return prev;
        }
        return [...prev, newMsg];
      });
    });

    // Fallback: Poll for new messages every 5 seconds in case broadcast fails
    const pollInterval = setInterval(() => {
      fetchMessagesQuietly();
    }, 3000);

    // Cleanup subscription and polling on unmount
    return () => {
      message_service.unsubscribeFromMessages(channel);
      clearInterval(pollInterval);
    };
  }, [recipient.id]);

  // Quiet fetch that doesn't show loading state (for polling)
  const fetchMessagesQuietly = async () => {
    try {
      const data = await message_service.getMessages(recipient.id);
      setMessages((prev) => {
        // Only update if there are new messages
        if (data.length !== prev.length ||
            (data.length > 0 && prev.length > 0 && data[data.length - 1].uuid !== prev[prev.length - 1].uuid)) {
          return data;
        }
        return prev;
      });
    } catch (error) {
      // Silent fail for background polling
      console.log('Background poll failed:', error);
    }
  };

  const fetchCaregivers = async () => {
    try {
      setLoadingCaregivers(true);
      const assignments = await api.getAssignedCaregivers(recipient.id);
      const caregiverList = assignments
        .filter(a => a.caregivers)
        .map(a => ({ id: a.caregivers.id, name: a.caregivers.name }));
      setCaregivers(caregiverList);
    } catch (error) {
      console.error('Error fetching caregivers:', error);
      setCaregivers([]);
    } finally {
      setLoadingCaregivers(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoadingMessages(true);
      const data = await message_service.getMessages(recipient.id);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      setSending(true);
      const sentMessage = await message_service.sendMessage({
        careRecipientId: recipient.id,
        senderId: caregiver.id,
        senderName: caregiver.name,
        content: messageContent,
      });
      // Add the sent message to the list immediately (optimistic update)
      setMessages((prev) => {
        if (prev.some(m => m.uuid === sentMessage.uuid)) {
          return prev;
        }
        return [...prev, sentMessage];
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore the message if sending failed
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Care Team Chat</Text>
        <Text style={styles.headerSubtitle}>Discussion about {recipient.name}</Text>
        <View style={styles.participantsContainer}>
          <Text style={styles.participantsLabel}>Participants:</Text>
          {loadingCaregivers ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : caregivers.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {caregivers.map((cg) => (
                <View key={cg.id} style={styles.participantBadge}>
                  <View style={styles.participantAvatar}>
                    <Text style={styles.participantAvatarText}>
                      {cg.name ? cg.name.split(' ').map(n => n[0]).join('') : '?'}
                    </Text>
                  </View>
                  <Text style={styles.participantName}>{cg.name || 'Unknown'}</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noParticipantsText}>No caregivers assigned</Text>
          )}
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {loadingMessages ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet. Start the conversation!</Text>
          </View>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.sender_id === caregiver.id;
            return (
              <View
                key={msg.uuid}
                style={[
                  styles.messageBox,
                  isOwnMessage ? styles.ownMessage : styles.otherMessage,
                ]}
              >
                {!isOwnMessage && (
                  <Text style={styles.senderName}>{msg.sender_name}</Text>
                )}
                <Text style={styles.messageText}>{msg.content}</Text>
                <Text style={styles.messageTime}>{formatTime(msg.created_at)}</Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor={Colors.gray500}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (newMessage.trim() === '' || sending) && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={newMessage.trim() === '' || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  header: {
    backgroundColor: Colors.white,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    ...Shadows.small,
  },
  headerTitle: {
    ...TextStyles.h3,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...TextStyles.small,
    color: Colors.gray600,
    marginBottom: 12,
  },
  participantsContainer: {
    marginTop: 8,
  },
  participantsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray700,
    marginBottom: 8,
  },
  participantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  participantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF9A76',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  participantAvatarText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  participantName: {
    fontSize: 13,
    color: Colors.gray700,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageBox: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: BorderRadius.md,
    marginBottom: 12,
    ...Shadows.small,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF9A76',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    color: Colors.gray600,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 24,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    alignItems: 'flex-end',
    ...Shadows.small,
  },
  input: {
    flex: 1,
    ...InputStyles.rounded,
    marginRight: 12,
    minHeight: 44,
    maxHeight: 100,
    textAlignVertical: 'center',
    paddingTop: 12,
  },
  sendButton: {
    backgroundColor: '#FF9A76',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  noParticipantsText: {
    fontSize: 13,
    color: Colors.gray500,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.gray600,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray500,
    textAlign: 'center',
  },
});
