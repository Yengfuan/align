import { supabase } from './supabase';

class MessageService {
  /**
   * Get all messages for a care recipient's group chat
   */
  async getMessages(careRecipientId) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('care_recipient_id', careRecipientId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Send a new message to the group chat
   */
  async sendMessage(messageData) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        care_recipient_id: messageData.careRecipientId,
        sender_id: messageData.senderId,
        sender_name: messageData.senderName,
        content: messageData.content,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Subscribe to real-time messages for a care recipient
   * Returns the subscription channel for cleanup
   * Uses Supabase Broadcast (works with custom trigger using broadcast_changes)
   */
  subscribeToMessages(careRecipientId, onNewMessage) {
    const channel = supabase
      .channel(`room:${careRecipientId}`)
      .on(
        'broadcast',
        { event: 'INSERT' },
        (payload) => {
          // The broadcast_changes function sends the new record in payload
          if (payload.payload?.record) {
            onNewMessage(payload.payload.record);
          } else if (payload.new) {
            onNewMessage(payload.new);
          }
        }
      )
      .subscribe();

    return channel;
  }

  /**
   * Unsubscribe from messages channel
   */
  unsubscribeFromMessages(channel) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }

}

export default new MessageService();