import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import PageTransition from "../../components/animations/PageTransition";
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Send,
  Download,
  DollarSign,
  Edit,
  Printer,
  Check,
  XCircle,
} from "lucide-react-native";
import * as RNHTMLtoPDF from 'react-native-html-to-pdf';
import * as RNPrint from 'react-native-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { WebView } from 'react-native-webview';

import Header from "../../components/Header";
import { getInvoiceById } from "../../services/orderService";
import { Invoice, InvoiceItem } from "../../types";
import { useCompany } from "../../services/companyContext";
import { canGeneratePdf, ensureDocumentDirectoryExists } from "../../services/permissionService";

// PDF Generation status types
type PdfStatus = 'idle' | 'generating' | 'preview' | 'success' | 'error';
// PDF Action types
type PdfAction = 'download' | 'print' | 'send' | 'preview';

// HTML escape utility
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

function InvoiceDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id, refresh } = useLocalSearchParams<{ id: string, refresh?: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // PDF generation state
  const [pdfStatus, setPdfStatus] = useState<PdfStatus>('idle');
  const [pdfAction, setPdfAction] = useState<PdfAction>('download');
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [pdfPreviewHtml, setPdfPreviewHtml] = useState<string | null>(null);
  const [pdfGenerationProgress, setPdfGenerationProgress] = useState<string>('');
  
  // Get company information from context
  const { companyData, loading: companyLoading } = useCompany();

  // Cleanup function for temporary files
  const cleanupTempFiles = async () => {
    if (pdfPath) {
      try {
        await FileSystem.deleteAsync(pdfPath, { idempotent: true });
      } catch (error) {
        console.error('Error cleaning up temp files:', error);
      }
    }
  };

  // Effect to handle refresh parameter
  useEffect(() => {
    if (refresh === 'true') {
      setRefreshKey(prev => prev + 1);
      router.setParams({ refresh: undefined });
    }
  }, [refresh]);

  useEffect(() => {
    let isMounted = true;

    const fetchInvoiceDetails = async () => {
      if (!id) {
        setError("Invoice ID is missing");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await getInvoiceById(id);
        if (isMounted) {
        if (data) {
          setInvoice(data);
          setError(null);
        } else {
          setError("Invoice not found");
          }
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : "Failed to load invoice details";
          setError(errorMessage);
        }
      } finally {
        if (isMounted) {
        setIsLoading(false);
        }
      }
    };

    fetchInvoiceDetails();

    return () => {
      isMounted = false;
      cleanupTempFiles();
    };
  }, [id, refreshKey]);

  const handleEditInvoice = () => {
    router.push(`/finances/edit-invoice?id=${id}`);
  };

  // Generate PDF HTML content with memoization
  const generatePdfHtml = useMemo(() => {
    if (!invoice) return '';
    
    // Parse items if it's a string
    const invoiceItems: InvoiceItem[] = typeof invoice.items === 'string' 
      ? JSON.parse(invoice.items) 
      : Array.isArray(invoice.items) ? invoice.items : [];
    
    // Status color
    const getStatusBadgeColor = (status: string) => {
      const statusLower = status.toLowerCase();
      if (statusLower === 'paid') return '#10B981';
      if (statusLower === 'pending' || statusLower === 'unpaid') return '#F59E0B';
      if (statusLower === 'overdue') return '#EF4444';
      return '#6B7280';
    };
    
    // Create items rows HTML with escaped values
    const itemsRowsHtml = invoiceItems.map((item: InvoiceItem, index: number) => `
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="padding: 12px 8px;">${index + 1}</td>
        <td style="padding: 12px 8px;">${escapeHtml(item.description || item.name || '')}</td>
        <td style="padding: 12px 8px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 8px; text-align: right;">₹${(item.unit_price || item.unitPrice || 0).toLocaleString()}</td>
        <td style="padding: 12px 8px; text-align: right;">₹${Number(item.total || (item.quantity * (item.unit_price || item.unitPrice || 0))).toLocaleString()}</td>
      </tr>
    `).join('');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${escapeHtml(invoice.invoice_number)}</title>
        <style>
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #374151;
            font-size: 12px;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 0 auto;
            background-color: white;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .company-info {
            text-align: left;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 5px;
          }
          .invoice-title {
            text-align: right;
            font-size: 28px;
            font-weight: bold;
            color: #4F46E5;
            margin-bottom: 5px;
          }
          .invoice-number {
            text-align: right;
            font-size: 16px;
            color: #6B7280;
          }
          .status-badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 15px;
            color: white;
            font-weight: bold;
            background-color: ${getStatusBadgeColor(invoice.status)};
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="company-info">
              <div class="company-name">${escapeHtml(companyData?.name || '')}</div>
              <div>${escapeHtml(companyData?.address || '')}</div>
              <div>Phone: ${escapeHtml(companyData?.phone || '')}</div>
              <div>Email: ${escapeHtml(companyData?.email || '')}</div>
            </div>
            <div>
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-number">#${escapeHtml(invoice.invoice_number)}</div>
              <div class="status-badge">${escapeHtml(invoice.status)}</div>
            </div>
          </div>
          
          <div class="section">
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <thead>
                <tr style="background-color: #F3F4F6;">
                  <th style="padding: 12px 8px; text-align: left;">#</th>
                  <th style="padding: 12px 8px; text-align: left;">Description</th>
                  <th style="padding: 12px 8px; text-align: center;">Quantity</th>
                  <th style="padding: 12px 8px; text-align: right;">Unit Price</th>
                  <th style="padding: 12px 8px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRowsHtml}
              </tbody>
            </table>
          </div>
          
          <div style="margin-top: 30px; text-align: right;">
            <div style="font-size: 18px; font-weight: bold;">
              Total Amount: ₹${invoice.total_amount.toLocaleString()}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }, [invoice, companyData]);

  // Generate and save PDF
  const generatePdf = async (action: PdfAction = 'download') => {
    try {
      setPdfStatus('generating');
      setPdfAction(action);
      
      // Check permissions
      const hasPermission = await canGeneratePdf();
      if (!hasPermission) {
        throw new Error('Permission denied to generate PDF');
      }
      
      // Ensure directory exists
      await ensureDocumentDirectoryExists();
      
      // Generate PDF
      const fileName = `invoice_${invoice?.invoice_number}_${Date.now()}.pdf`;
      const htmlContent = generatePdfHtml;
      const options = {
        html: htmlContent,
        fileName,
        directory: Platform.select({
          ios: 'Documents',
          android: `${FileSystem.documentDirectory}`
        }),
        base64: false
      };

      const file = await RNHTMLtoPDF.convert(options);
      if (!file?.filePath) {
        throw new Error('Failed to generate PDF');
      }
      
      setPdfPath(file.filePath);
      setPdfStatus('success');

      // Handle different actions
      switch (action) {
        case 'download':
          await Sharing.shareAsync(file.filePath, {
            mimeType: 'application/pdf',
            dialogTitle: `Invoice ${invoice?.invoice_number}`
          });
          break;
        case 'print':
          await RNPrint.print({ filePath: file.filePath });
          break;
        case 'send':
          setPdfPreviewHtml(generatePdfHtml);
          break;
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      setPdfStatus('error');
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to generate PDF'
      );
    } finally {
      // Cleanup temporary files
      if (pdfPath && action !== 'preview') {
        await cleanupTempFiles();
      }
    }
  };

  // Handle print PDF
  const handlePrintPdf = async (filePath: string) => {
    try {
      setPdfGenerationProgress('Preparing to print...');
      
      await RNPrint.print({ filePath });
      
      setPdfStatus('success');
      setPdfGenerationProgress('Print job sent successfully!');
      
      // After a delay, reset back to idle
      setTimeout(() => {
        setPdfStatus('idle');
      }, 2000);
    } catch (err) {
      console.error('Error printing PDF:', err);
      setPdfStatus('error');
      Alert.alert(
        'Print Error',
        'There was an error printing the document. Please try again.'
      );
    }
  };

  // Handle PDF download
  const handleDownloadPdf = async (filePath: string) => {
    try {
      setPdfGenerationProgress('Saving file...');
      
      // On Android, use native sharing to save/download
      if (Platform.OS === 'android') {
        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          // Use FileSystem to ensure file is accessible
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          
          if (!fileInfo.exists) {
            throw new Error('File does not exist at path: ' + filePath);
          }
          
          await Sharing.shareAsync('file://' + filePath, {
            dialogTitle: `Save Invoice ${invoice?.invoice_number}`,
            mimeType: 'application/pdf',
            UTI: 'com.adobe.pdf'
          });
        } else {
          throw new Error('Sharing is not available on this device');
        }
      } else {
        // On iOS, file is already saved to Documents directory
        Alert.alert(
          'PDF Saved',
          `PDF has been saved as "Invoice_${invoice?.invoice_number}.pdf" in your Documents folder.`
        );
      }
      
      setPdfStatus('success');
      setPdfGenerationProgress('File saved successfully!');
      
      // After a delay, reset back to idle
      setTimeout(() => {
        setPdfStatus('idle');
      }, 2000);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setPdfStatus('error');
      Alert.alert(
        'Download Error',
        'There was an error saving the document. Please try again: ' + (err instanceof Error ? err.message : String(err))
      );
    }
  };

  // Handle send PDF
  const handleSendPdf = async (filePath: string) => {
    try {
      setPdfGenerationProgress('Preparing to share...');
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        // Use FileSystem to ensure file is accessible
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        if (!fileInfo.exists) {
          throw new Error('File does not exist at path: ' + filePath);
        }
        
        await Sharing.shareAsync('file://' + filePath, {
          dialogTitle: `Share Invoice ${invoice?.invoice_number}`,
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf'
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
      
      setPdfStatus('success');
      setPdfGenerationProgress('File shared successfully!');
      
      // After a delay, reset back to idle
      setTimeout(() => {
        setPdfStatus('idle');
      }, 2000);
    } catch (err) {
      console.error('Error sharing PDF:', err);
      setPdfStatus('error');
      Alert.alert(
        'Sharing Error',
        'There was an error sharing the document. Please try again: ' + (err instanceof Error ? err.message : String(err))
      );
    }
  };

  // Handle action buttons
  const handleSendInvoice = () => {
    generatePdf('send');
  };

  const handleDownloadInvoice = () => {
    generatePdf('download');
  };

  const handlePrintInvoice = () => {
    generatePdf('print');
  };

  const handleConfirmAction = () => {
    if (!pdfPath) return;
    
    if (pdfAction === 'download') {
      handleDownloadPdf(pdfPath);
    } else if (pdfAction === 'send') {
      handleSendPdf(pdfPath);
    }
  };

  const handleCancelAction = () => {
    setPdfStatus('idle');
    setPdfPath(null);
    setPdfPreviewHtml(null);
  };

  const handleRecordPayment = () => {
    router.push({
      pathname: "/finances/record-payment",
      params: { invoiceId: id }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
      case "unpaid":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  if (error || !invoice) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <Header
          title="Invoice Details"
          leftIcon={<ArrowLeft size={24} color="#000" />}
          onLeftPress={() => router.back()}
        />
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 mb-4">{error || "Invoice not found"}</Text>
          <TouchableOpacity
            className="bg-blue-500 px-4 py-2 rounded-lg"
            onPress={() => router.back()}
          >
            <Text className="text-white font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Parse items if it's a string
  const invoiceItems = typeof invoice.items === 'string' 
    ? JSON.parse(invoice.items) 
    : invoice.items || [];

  return (
    // @ts-ignore - PageTransition correctly receives children via its child elements
    <PageTransition type="slide">
      <SafeAreaView className="flex-1 bg-gray-100">
        <Header
          title="Invoice Details"
          leftIcon={<ArrowLeft size={24} color="#000" />}
          onLeftPress={() => router.back()}
        />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom }}
        >
          {/* Invoice Header */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900">
                  {invoice.invoice_number}
                </Text>
                <View className="flex-row items-center mt-2">
                  <Calendar size={16} color="#6B7280" />
                  <Text className="text-gray-600 ml-2">
                    Issued: {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
                <View className="flex-row items-center mt-1">
                  <Calendar size={16} color="#6B7280" />
                  <Text className="text-gray-600 ml-2">
                    Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
              </View>
              <View
                className={`px-3 py-1.5 rounded-full ${getStatusColor(invoice.status)}`}
              >
                <Text className="text-xs font-medium">{invoice.status}</Text>
              </View>
            </View>

            <View className="flex-row justify-between mt-2">
              <TouchableOpacity
                className="flex-row items-center bg-blue-50 px-4 py-2.5 rounded-xl"
                onPress={handleEditInvoice}
              >
                <Edit size={16} color="#3B82F6" />
                <Text className="text-blue-600 font-medium ml-2">Edit</Text>
              </TouchableOpacity>
              {invoice.status.toLowerCase() !== "paid" && (
                <TouchableOpacity
                  className="flex-row items-center bg-green-50 px-4 py-2.5 rounded-xl"
                  onPress={handleRecordPayment}
                >
                  <DollarSign size={16} color="#10B981" />
                  <Text className="text-green-600 font-medium ml-2">
                    Record Payment
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-between mb-5">
            <TouchableOpacity
              className="flex-1 bg-indigo-500 py-3 rounded-lg flex-row items-center justify-center mr-1"
              onPress={handleSendInvoice}
              disabled={pdfStatus !== 'idle'}
            >
              <Send size={16} color="#FFFFFF" />
              <Text className="text-white font-medium ml-2">Send</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-indigo-500 py-3 rounded-lg flex-row items-center justify-center mx-1"
              onPress={handleDownloadInvoice}
              disabled={pdfStatus !== 'idle'}
            >
              <Download size={16} color="#FFFFFF" />
              <Text className="text-white font-medium ml-2">Download</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-indigo-500 py-3 rounded-lg flex-row items-center justify-center ml-1"
              onPress={handlePrintInvoice}
              disabled={pdfStatus !== 'idle'}
            >
              <Printer size={16} color="#FFFFFF" />
              <Text className="text-white font-medium ml-2">Print</Text>
            </TouchableOpacity>
          </View>

          {/* Customer Info */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Customer Information
            </Text>
            <TouchableOpacity
              className="flex-row items-center mb-2"
              onPress={() => router.push(`/customers/view?id=${invoice.customer_id || '1'}`)}
            >
              <User size={16} color="#3B82F6" />
              <Text className="text-blue-600 font-medium ml-2">
                {invoice.customer_name}
              </Text>
            </TouchableOpacity>
            {invoice.customer_email && (
              <Text className="text-gray-600 mb-1">{invoice.customer_email}</Text>
            )}
            {invoice.customer_phone && (
              <Text className="text-gray-600">{invoice.customer_phone}</Text>
            )}
          </View>

          {/* Invoice Items */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Invoice Items
            </Text>
            {invoiceItems.length > 0 ? (
              invoiceItems.map((item: any, index: number) => (
                <View
                  // @ts-ignore - key is valid for React components
                  key={item.id || index}
                  className="flex-row justify-between items-center p-3 mb-2 bg-gray-50 rounded-lg"
                >
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">
                      {item.description || item.name}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {item.quantity} x ₹{item.unit_price || item.unitPrice}
                    </Text>
                  </View>
                  <Text className="font-semibold text-gray-900">
                    ₹{Number(item.total || (item.quantity * (item.unit_price || item.unitPrice))).toLocaleString()}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-gray-500 italic">No items found</Text>
            )}
          </View>

          {/* Payment Summary */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Payment Summary
            </Text>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600">Subtotal</Text>
              <Text className="font-medium">₹{invoice.subtotal?.toLocaleString() || '0.00'}</Text>
            </View>
            {invoice.tax_amount && invoice.tax_amount > 0 && (
              <View className="flex-row justify-between mb-1">
                <Text className="text-gray-600">Tax ({invoice.tax_rate || 0}%)</Text>
                <Text className="font-medium">₹{invoice.tax_amount.toLocaleString()}</Text>
              </View>
            )}
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600">Discount</Text>
              <Text className="font-medium">₹{invoice.discount_amount?.toLocaleString() || '0.00'}</Text>
            </View>
            <View className="h-[1px] bg-gray-200 my-2" />
            <View className="flex-row justify-between">
              <Text className="font-bold">Total</Text>
              <Text className="font-bold text-lg">₹{invoice.total_amount?.toLocaleString() || '0.00'}</Text>
            </View>
          </View>

          {/* Invoice Notes */}
          {invoice.notes && (
            <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
              <Text className="text-lg font-bold mb-2 text-gray-900">Notes</Text>
              <Text className="text-gray-600">{invoice.notes}</Text>
            </View>
          )}

          {/* Related Order */}
          {invoice.order_id && (
            <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
              <Text className="text-lg font-bold mb-2 text-gray-900">Related Order</Text>
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => router.push(`/orders/view?id=${invoice.order_id}` as any)}
              >
                <FileText size={16} color="#3B82F6" />
                <Text className="text-blue-600 font-medium ml-2">
                  View Order #{invoice.order_id.substring(0, 8)}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        
        {/* PDF Generation Status Modal */}
        {pdfStatus === 'generating' && (
          <View className="absolute inset-0 bg-black bg-opacity-50 justify-center items-center">
            <View className="bg-white p-6 rounded-xl w-4/5 items-center">
              <ActivityIndicator size="large" color="#4F46E5" style={{ marginBottom: 15 }} />
              <Text className="text-lg font-bold text-gray-900 mb-2">Generating PDF</Text>
              <Text className="text-gray-600 text-center mb-3">{pdfGenerationProgress}</Text>
            </View>
          </View>
        )}
        
        {/* PDF Preview Modal */}
        {pdfStatus === 'preview' && pdfPreviewHtml && (
          <Modal
            animationType="slide"
            transparent={false}
            visible={true}
            onRequestClose={handleCancelAction}
          >
            <SafeAreaView className="flex-1 bg-gray-100">
              <View className="bg-white p-4 flex-row justify-between items-center border-b border-gray-200">
                <Text className="text-xl font-bold">Invoice Preview</Text>
                <TouchableOpacity onPress={handleCancelAction}>
                  <XCircle size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <View className="flex-1">
                <WebView
                  originWhitelist={['*']}
                  source={{ html: pdfPreviewHtml }}
                  style={{ flex: 1 }}
                />
              </View>
              
              <View className="bg-white p-4 flex-row justify-end border-t border-gray-200">
                <TouchableOpacity
                  className="bg-gray-200 py-2 px-4 rounded-lg mr-3"
                  onPress={handleCancelAction}
                >
                  <Text className="font-medium">Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="bg-green-500 py-2 px-4 rounded-lg flex-row items-center"
                  onPress={handleConfirmAction}
                >
                  <Check size={18} color="#FFFFFF" />
                  <Text className="text-white font-medium ml-1">
                    {pdfAction === 'download' ? 'Download' : 'Send'}
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Modal>
        )}
        
        {/* Success/Error Status */}
        {(pdfStatus === 'success' || pdfStatus === 'error') && (
          <View className="absolute inset-0 bg-black bg-opacity-50 justify-center items-center">
            <View className="bg-white p-6 rounded-xl w-4/5 items-center">
              {pdfStatus === 'success' ? (
                <>
                  <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
                    <Check size={32} color="#10B981" />
                  </View>
                  <Text className="text-lg font-bold text-gray-900 mb-2">Success!</Text>
                </>
              ) : (
                <>
                  <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
                    <XCircle size={32} color="#EF4444" />
                  </View>
                  <Text className="text-lg font-bold text-gray-900 mb-2">Error</Text>
                </>
              )}
              <Text className="text-gray-600 text-center">{pdfGenerationProgress}</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </PageTransition>
  );
}

export default InvoiceDetailsScreen;
