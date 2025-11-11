import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image as ImageIcon, X, ArrowLeft, FileText, Camera, Mic } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ErrorHandler, ErrorToast } from '@/components/common/ErrorHandler';
import { useTheme } from '@/components/common/ThemeProvider';
import { uploadImageAsync } from '@/utils/cloudinary';
import { supabase } from '@/config/supabase';

export default function ReportIssueScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();

  

  const pickImage = async () => {
    try {
      setImageLoading(true);
      setError('');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        allowsMultipleSelection: false,
      });

      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      setError('Failed to pick an image. Please try again.');
    } finally {
      setImageLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      setImageLoading(true);
      setError('');
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      setError('Failed to take photo. Please try again.');
    } finally {
      setImageLoading(false);
    }
  };



  const handleRemovePhoto = () => {
    setPhoto(null);
  };

const handleSubmit = async () => {
  // Clear previous errors
  setError('');
  
  // Validation with user-friendly messages
  if (!title.trim()) {
    setError('Please enter a title for your report');
    return;
  }
  if (!description.trim()) {
    setError('Please provide a description of the issue');
    return;
  }
  if (!building.trim()) {
    setError('Please specify the building location');
    return;
  }
  if (!room.trim()) {
    setError('Please specify the room or area');
    return;
  }

  setSubmitting(true);

  try {
    // Retrieve user from AsyncStorage
    const userData = await AsyncStorage.getItem('user');
    if (!userData) {
      throw new Error('Please log in again to submit a report');
    }

    const user = JSON.parse(userData);

    // If a local image is selected, upload to Cloudinary first and get a secure URL
    let photoUrl: string | null = null;
    if (photo) {
      try {
        const uploadRes = await uploadImageAsync(photo, { folder: 'report-photos' });
        photoUrl = uploadRes.secure_url || null;
      } catch (e: any) {
        console.error('Cloudinary upload failed:', e);
        throw new Error(e?.message || 'Failed to upload image. Please try again.');
      }
    }

    // Generate UUID helper
    const generateId = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    // Create report via Supabase
    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .insert([{
        id: generateId(),
        title: title.trim(),
        description: description.trim(),
        location: {
          building: building.trim(),
          room: room.trim(),
        },
        photo: photoUrl,
        priority: priority,
        status: 'pending',
        created_by: user.id,
        student_id: user.student_id,
        student_name: user.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (reportError) {
      console.error('Report submission error:', reportError);
      throw new Error(reportError.message || 'Failed to submit report');
    }

    console.log('✅ Report created:', reportData);
    setShowSuccess(true);
    
    // Clear form
    setTimeout(() => {
      router.back();
    }, 1500);
    
  } catch (error: any) {
    console.error('Submit error:', error);
    setError(error.message || 'Something went wrong. Please try again.');
  } finally {
    setSubmitting(false);
  }
};

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Report New Issue</Text>
      </View>

      <ScrollView style={[styles.content, { backgroundColor: '#000000' }]} showsVerticalScrollIndicator={false}>
        {/* Error Handler */}
        <ErrorHandler 
          error={error} 
          onDismiss={() => setError('')}
          onRetry={() => setError('')}
        />
        
        {/* Success Toast */}
        {showSuccess && (
          <ErrorToast 
            error="Report submitted successfully!"
            type="info"
            onDismiss={() => setShowSuccess(false)}
            duration={3000}
          />
        )}
        

        
        <Card style={{ backgroundColor: theme.colors.surface }}>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Issue Title *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Brief description of the issue"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Detailed Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Provide detailed information about the issue..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Priority Level</Text>
              <View style={styles.priorityContainer}>
                {(['low', 'medium', 'high', 'urgent'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.priorityButton,
                      { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                      priority === level && { backgroundColor: theme.colors.primary },
                      level === 'urgent' && styles.urgentButton,
                      level === 'urgent' && priority === 'urgent' && styles.urgentButtonActive,
                    ]}
                    onPress={() => setPriority(level)}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      { color: theme.colors.text },
                      priority === level && { color: '#FFFFFF' },
                      level === 'urgent' && styles.urgentButtonText,
                      level === 'urgent' && priority === 'urgent' && styles.urgentButtonTextActive,
                    ]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.locationContainer}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Location *</Text>
              <View style={styles.locationInputs}>
                <View style={[styles.inputContainer, styles.locationInput]}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Building</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                    value={building}
                    onChangeText={setBuilding}
                    placeholder="Enter building name/number"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>

                <View style={[styles.inputContainer, styles.locationInput]}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Room</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
                    value={room}
                    onChangeText={setRoom}
                    placeholder="Enter room number"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>
              </View>
            </View>

            <View style={styles.photoContainer}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Photo</Text>
              <Text style={[styles.photoDescription, { color: theme.colors.textSecondary }]}>
                Add a photo to help us better understand the issue
              </Text>

              {photo ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: photo }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={handleRemovePhoto}
                  >
                    <X size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoButtons}>
                  <TouchableOpacity 
                    style={[styles.photoButton, { flex: 1, backgroundColor: theme.colors.background, borderColor: theme.colors.border }]} 
                    onPress={pickImage}
                    disabled={imageLoading}
                  >
                    <View style={styles.photoButtonInner}>
                      {imageLoading ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                      ) : (
                        <ImageIcon size={24} color={theme.colors.primary} />
                      )}
                      <Text style={[styles.photoButtonText, { color: theme.colors.text }]}>Gallery</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.photoButton, { flex: 1, backgroundColor: theme.colors.background, borderColor: theme.colors.border }]} 
                    onPress={takePhoto}
                    disabled={imageLoading}
                  >
                    <View style={styles.photoButtonInner}>
                      {imageLoading ? (
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                      ) : (
                        <Camera size={24} color={theme.colors.primary} />
                      )}
                      <Text style={[styles.photoButtonText, { color: theme.colors.text }]}>Camera</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Button
              title={submitting ? 'Submitting...' : 'Submit Report'}
              onPress={handleSubmit}
              disabled={submitting}
              style={styles.submitButton}
            />
          </View>
        </Card>
      </ScrollView>



      {/* Error Toast */}
      {error && (
        <ErrorToast
          error={error}
          type="error"
          onDismiss={() => setError('')}
        />
      )}

      {/* Success Toast */}
      {showSuccess && (
        <ErrorToast
          error="Report submitted successfully!"
          type="info"
          onDismiss={() => setShowSuccess(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  form: {
    padding: 24,
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E0F2FE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  locationContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  locationInputs: {
    flexDirection: 'row',
    gap: 16,
  },
  locationInput: {
    flex: 1,
  },
  photoContainer: {
    gap: 12,
  },
  photoDescription: {
    fontSize: 15,
    color: '#64748B',
    letterSpacing: 0.2,
  },
  photoButton: {
    borderWidth: 2,
    borderColor: '#E0F2FE',
    borderRadius: 16,
    borderStyle: 'dashed',
    padding: 24,
  },
  photoButtonInner: {
    alignItems: 'center',
    gap: 12,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ee0808ff',
    letterSpacing: 0.2,
  },
  photoPreview: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  priorityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  priorityButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  urgentButton: {
    borderColor: '#DC2626',
  },
  urgentButtonActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  priorityButtonTextActive: {
    color: '#FFFFFF',
  },
  urgentButtonText: {
    color: '#DC2626',
  },
  urgentButtonTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    marginTop: 8,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
});
