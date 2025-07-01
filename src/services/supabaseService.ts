
import { supabase } from '@/integrations/supabase/client';

export interface TryOnSession {
  id: string;
  model_image_url: string;
  dress_image_url: string;
  result_image_url: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export const supabaseService = {
  // Upload image to storage
  async uploadImage(file: File, path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('tryon-images')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('tryon-images')
      .getPublicUrl(data.path);

    return publicUrl;
  },

  // Create a new try-on session
  async createSession(modelImageUrl: string, dressImageUrl: string): Promise<TryOnSession> {
    const { data, error } = await supabase
      .from('tryon_sessions')
      .insert({
        model_image_url: modelImageUrl,
        dress_image_url: dressImageUrl,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Session creation error:', error);
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return data as TryOnSession;
  },

  // Update session with result
  async updateSession(sessionId: string, resultImageUrl: string, status: 'completed' | 'failed' = 'completed'): Promise<void> {
    const { error } = await supabase
      .from('tryon_sessions')
      .update({
        result_image_url: resultImageUrl,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Session update error:', error);
      throw new Error(`Failed to update session: ${error.message}`);
    }
  },

  // Listen to session updates
  subscribeToSession(sessionId: string, callback: (session: TryOnSession) => void) {
    const channel = supabase
      .channel('session-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tryon_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          callback(payload.new as TryOnSession);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
