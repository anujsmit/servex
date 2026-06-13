// app/(protected)/(customer)/service-status/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../../context/AuthContext';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

interface ServiceRequest {
  id: string;
  type: string;
  address: string;
  status: string;
  paymentAmount: string;
  customerNotes: string;
  adminNotes: string;
  createdAt: string;
  assignedAt: string;
  startedWorkAt: string;
  completedAt: string;
  assignedMistriId: string;
  mistriDetails?: {
    id: string;
    fullName: string;
    phoneNumber: string;
    profilePhotoUrl: string;
    averageRating: string;
  };
}

export default function ServiceStatusScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequestStatus();
    
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchRequestStatus, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchRequestStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/service-requests/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${user?.token}`,
          },
        }
      );
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setRequest(data.request);
        if (data.mistriDetails) {
          setRequest(prev => ({ ...prev, mistriDetails: data.mistriDetails }));
        }
        setError(null);
      } else {
        setError(data.message || 'Failed to load request');
      }
    } catch (error) {
      setError('Network error. Please pull to refresh.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = () => {
    const steps = [
      { key: 'pending_approval', label: 'Request Submitted', icon: 'check-circle-outline' },
      { key: 'assigned', label: 'Professional Assigned', icon: 'people-outline' },
      { key: 'started', label: 'Work Started', icon: 'construct-outline' },
      { key: 'completed', label: 'Completed', icon: 'checkbox-outline' },
    ];
    
    let currentIndex = 0;
    if (request?.status === 'assigned') currentIndex = 1;
    if (request?.startedWorkAt) currentIndex = 2;
    if (request?.status === 'completed') currentIndex = 3;
    
    return { steps, currentIndex };
  };

  const callMistri = () => {
    if (request?.mistriDetails?.phoneNumber) {
      Linking.openURL(`tel:${request.mistriDetails.phoneNumber}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e67e22" />
      </View>
    );
  }

  if (error || !request) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error-outline" size={48} color="#dc2626" />
        <Text style={styles.errorText}>{error || 'Request not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchRequestStatus}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { steps, currentIndex } = getStatusStep();

  return (
    <ScrollView style={styles.container}>
      {/* Status Header */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Service Request Status</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {request.status === 'pending_approval' && 'Awaiting Admin Approval'}
            {request.status === 'assigned' && 'Professional Assigned'}
            {request.status === 'completed' && 'Completed'}
            {request.status === 'canceled' && 'Canceled'}
          </Text>
        </View>
      </View>

      {/* Progress Steps */}
      <View style={styles.progressCard}>
        {steps.map((step, index) => (
          <View key={step.key} style={styles.stepContainer}>
            <View style={styles.stepIconContainer}>
              <View style={[
                styles.stepCircle,
                index <= currentIndex && styles.stepCircleActive,
              ]}>
                <Ionicons
                  name={step.icon as any}
                  size={20}
                  color={index <= currentIndex ? '#fff' : '#94a3b8'}
                />
              </View>
              {index < steps.length - 1 && (
                <View style={[
                  styles.stepLine,
                  index < currentIndex && styles.stepLineActive,
                ]} />
              )}
            </View>
            <View style={styles.stepContent}>
              <Text style={[
                styles.stepLabel,
                index <= currentIndex && styles.stepLabelActive,
              ]}>
                {step.label}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Assigned Professional Details */}
      {request.mistriDetails && request.status !== 'pending_approval' && (
        <View style={styles.mistriCard}>
          <Text style={styles.sectionTitle}>Assigned Professional</Text>
          <View style={styles.mistriInfo}>
            <View style={styles.mistriAvatar}>
              {request.mistriDetails.profilePhotoUrl ? (
                <Image source={{ uri: request.mistriDetails.profilePhotoUrl }} style={styles.avatar} />
              ) : (
                <MaterialIcons name="person" size={32} color="#fff" />
              )}
            </View>
            <View style={styles.mistriDetails}>
              <Text style={styles.mistriName}>{request.mistriDetails.fullName}</Text>
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={14} color="#fbbf24" />
                <Text style={styles.ratingText}>
                  {request.mistriDetails.averageRating || 'New'} ⭐
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.callButton} onPress={callMistri}>
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Payment Details */}
      {request.paymentAmount && (
        <View style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Total Amount:</Text>
            <Text style={styles.paymentAmount}>
              NPR {parseFloat(request.paymentAmount).toLocaleString()}
            </Text>
          </View>
          <Text style={styles.paymentNote}>
            Payment to be made directly to the professional after service completion
          </Text>
        </View>
      )}

      {/* Service Details */}
      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Service Details</Text>
        <View style={styles.detailRow}>
          <MaterialIcons name="build" size={18} color="#64748b" />
          <Text style={styles.detailText}>{request.type}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="location-on" size={18} color="#64748b" />
          <Text style={styles.detailText}>{request.address}</Text>
        </View>
        {request.customerNotes && (
          <View style={styles.detailRow}>
            <MaterialIcons name="note" size={18} color="#64748b" />
            <Text style={styles.detailText}>{request.customerNotes}</Text>
          </View>
        )}
        {request.adminNotes && (
          <View style={styles.adminNoteContainer}>
            <MaterialIcons name="info" size={18} color="#e67e22" />
            <Text style={styles.adminNoteText}>{request.adminNotes}</Text>
          </View>
        )}
      </View>

      {/* Timeline */}
      <View style={styles.timelineCard}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.timelineItem}>
          <Text style={styles.timelineLabel}>Requested:</Text>
          <Text style={styles.timelineValue}>
            {new Date(request.createdAt).toLocaleString()}
          </Text>
        </View>
        {request.assignedAt && (
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Assigned:</Text>
            <Text style={styles.timelineValue}>
              {new Date(request.assignedAt).toLocaleString()}
            </Text>
          </View>
        )}
        {request.startedWorkAt && (
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Work Started:</Text>
            <Text style={styles.timelineValue}>
              {new Date(request.startedWorkAt).toLocaleString()}
            </Text>
          </View>
        )}
        {request.completedAt && (
          <View style={styles.timelineItem}>
            <Text style={styles.timelineLabel}>Completed:</Text>
            <Text style={styles.timelineValue}>
              {new Date(request.completedAt).toLocaleString()}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 14, color: '#dc2626', textAlign: 'center', marginTop: 12 },
  retryButton: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#e67e22', borderRadius: 8 },
  retryButtonText: { color: '#fff', fontWeight: '600' },
  
  statusCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  statusTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 12 },
  statusBadge: { backgroundColor: '#e67e2210', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  statusText: { fontSize: 13, fontWeight: '500', color: '#e67e22' },
  
  progressCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 },
  stepContainer: { flexDirection: 'row', marginBottom: 16 },
  stepIconContainer: { alignItems: 'center', marginRight: 12 },
  stepCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  stepCircleActive: { backgroundColor: '#e67e22' },
  stepLine: { width: 2, height: 30, backgroundColor: '#e2e8f0', marginTop: -2 },
  stepLineActive: { backgroundColor: '#e67e22' },
  stepContent: { flex: 1, justifyContent: 'center' },
  stepLabel: { fontSize: 14, color: '#94a3b8' },
  stepLabelActive: { color: '#0f172a', fontWeight: '500' },
  
  mistriCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 12 },
  mistriInfo: { flexDirection: 'row', alignItems: 'center' },
  mistriAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#e67e22', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  mistriDetails: { flex: 1 },
  mistriName: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  ratingText: { fontSize: 12, color: '#64748b' },
  callButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e67e22', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 6 },
  callButtonText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  
  paymentCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  paymentLabel: { fontSize: 14, color: '#64748b' },
  paymentAmount: { fontSize: 20, fontWeight: '700', color: '#e67e22' },
  paymentNote: { fontSize: 12, color: '#94a3b8', marginTop: 8, textAlign: 'center' },
  
  detailsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  detailText: { flex: 1, fontSize: 14, color: '#334155' },
  adminNoteContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f2f5', gap: 10 },
  adminNoteText: { flex: 1, fontSize: 13, color: '#e67e22', fontStyle: 'italic' },
  
  timelineCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  timelineItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  timelineLabel: { fontSize: 13, color: '#64748b' },
  timelineValue: { fontSize: 13, color: '#0f172a' },
});