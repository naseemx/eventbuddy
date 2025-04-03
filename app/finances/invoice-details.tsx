import React, { useState, useEffect } from "react";
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
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNPrint from 'react-native-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { WebView } from 'react-native-webview';

import Header from "../../components/Header";
import { getInvoiceById } from "../../services/orderService";
import { Invoice } from "../../types";
import { useCompany } from "../../services/companyContext";
import { canGeneratePdf, ensureDocumentDirectoryExists } from "../../services/permissionService";

// PDF Generation status types
type PdfStatus = 'idle' | 'generating' | 'preview' | 'success' | 'error';
// PDF Action types
type PdfAction = 'download' | 'print' | 'send';

export default function InvoiceDetailsScreen() {
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

  // Effect to handle refresh parameter
  useEffect(() => {
    if (refresh === 'true') {
      // Trigger a refresh by updating the refreshKey
      setRefreshKey(prev => prev + 1);
      
      // Clear the refresh parameter from the URL to prevent infinite refreshes
      router.setParams({ refresh: undefined });
    }
  }, [refresh]);

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!id) {
        setError("Invoice ID is missing");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await getInvoiceById(id);
        if (data) {
          setInvoice(data);
          setError(null);
        } else {
          setError("Invoice not found");
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
        setError("Failed to load invoice details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [id, refreshKey]);

  const handleEditInvoice = () => {
    router.push(`/finances/edit-invoice?id=${id}`);
  };

  // Generate PDF HTML content
  const generatePdfHtml = () => {
    if (!invoice) return '';
    
    // Parse items if it's a string
    const invoiceItems = typeof invoice.items === 'string' 
      ? JSON.parse(invoice.items) 
      : invoice.items || [];
    
    // Status color
    const getStatusBadgeColor = (status: string) => {
      const statusLower = status.toLowerCase();
      if (statusLower === 'paid') return '#10B981';
      if (statusLower === 'pending' || statusLower === 'unpaid') return '#F59E0B';
      if (statusLower === 'overdue') return '#EF4444';
      return '#6B7280';
    };
    
    // Create items rows HTML
    const itemsRowsHtml = invoiceItems.map((item: any, index: number) => `
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="padding: 12px 8px;">${index + 1}</td>
        <td style="padding: 12px 8px;">${item.description || item.name}</td>
        <td style="padding: 12px 8px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 8px; text-align: right;">₹${(item.unit_price || item.unitPrice).toLocaleString()}</td>
        <td style="padding: 12px 8px; text-align: right;">₹${Number(item.total || (item.quantity * (item.unit_price || item.unitPrice))).toLocaleString()}</td>
      </tr>
    `).join('');
    
    // Create HTML content
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoice_number}</title>
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
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #111827;
            border-bottom: 1px solid #E5E7EB;
            padding-bottom: 8px;
            margin-bottom: 15px;
          }
          .grid {
            display: flex;
            justify-content: space-between;
          }
          .col {
            flex: 1;
          }
          .info-group {
            margin-bottom: 15px;
          }
          .info-label {
            font-weight: bold;
            margin-bottom: 3px;
            color: #6B7280;
          }
          .info-value {
            color: #111827;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background-color: #F3F4F6;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            color: #374151;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .summary {
            width: 50%;
            margin-left: auto;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
          }
          .summary-row.total {
            font-weight: bold;
            font-size: 16px;
            border-top: 2px solid #E5E7EB;
            padding-top: 12px;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            color: #6B7280;
            font-size: 11px;
            padding-top: 15px;
            border-top: 1px solid #E5E7EB;
          }
          .notes {
            margin-top: 30px;
            border-top: 1px dashed #E5E7EB;
            padding-top: 15px;
          }
          .notes-title {
            font-weight: bold;
            margin-bottom: 8px;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Header -->
          <div class="header">
            <div class="company-info">
              <div class="company-name">${companyData?.name || 'Company Name'}</div>
              <div>${companyData?.address || ''}</div>
              ${companyData?.phone ? `<div>Phone: ${companyData.phone}</div>` : ''}
              ${companyData?.email ? `<div>Email: ${companyData.email}</div>` : ''}
              ${companyData?.website ? `<div>Web: ${companyData.website}</div>` : ''}
              ${companyData?.taxId ? `<div>Tax ID: ${companyData.taxId}</div>` : ''}
            </div>
            <div>
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-number">#${invoice.invoice_number}</div>
              <div style="text-align: right; margin-top: 10px;">
                <span class="status-badge">${invoice.status}</span>
              </div>
            </div>
          </div>
          
          <!-- Info Section -->
          <div class="section grid">
            <div class="col">
              <div class="section-title">Bill To</div>
              <div class="info-group">
                <div class="info-value">${invoice.customer_name}</div>
                ${invoice.customer_email ? `<div class="info-value">${invoice.customer_email}</div>` : ''}
                ${invoice.customer_phone ? `<div class="info-value">${invoice.customer_phone}</div>` : ''}
              </div>
            </div>
            <div class="col">
              <div class="section-title">Invoice Details</div>
              <div class="info-group">
                <div class="info-label">Invoice Number:</div>
                <div class="info-value">${invoice.invoice_number}</div>
              </div>
              <div class="info-group">
                <div class="info-label">Invoice Date:</div>
                <div class="info-value">${invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div class="info-group">
                <div class="info-label">Due Date:</div>
                <div class="info-value">${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</div>
              </div>
              ${invoice.order_id ? `
              <div class="info-group">
                <div class="info-label">Order Reference:</div>
                <div class="info-value">${invoice.order_id.substring(0, 8)}</div>
              </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Items Table -->
          <div class="section">
            <div class="section-title">Invoice Items</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 5%;">#</th>
                  <th style="width: 45%;">Description</th>
                  <th style="width: 10%;" class="text-center">Qty</th>
                  <th style="width: 20%;" class="text-right">Unit Price</th>
                  <th style="width: 20%;" class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRowsHtml}
              </tbody>
            </table>
          </div>
          
          <!-- Summary -->
          <div class="summary">
            <div class="summary-row">
              <div>Subtotal</div>
              <div>₹${invoice.subtotal?.toLocaleString() || '0.00'}</div>
            </div>
            ${invoice.tax_amount && invoice.tax_amount > 0 ? `
            <div class="summary-row">
              <div>Tax (${invoice.tax_rate || 0}%)</div>
              <div>₹${invoice.tax_amount.toLocaleString()}</div>
            </div>
            ` : ''}
            <div class="summary-row">
              <div>Discount</div>
              <div>₹${invoice.discount_amount?.toLocaleString() || '0.00'}</div>
            </div>
            <div class="summary-row total">
              <div>Total</div>
              <div>₹${invoice.total_amount?.toLocaleString() || '0.00'}</div>
            </div>
          </div>
          
          <!-- Notes -->
          ${invoice.notes ? `
          <div class="notes">
            <div class="notes-title">Notes:</div>
            <div>${invoice.notes}</div>
          </div>
          ` : ''}
          
          <!-- Footer -->
          <div class="footer">
            <p>Thank you for your business!</p>
            ${companyData?.name ? `<p>${companyData.name} &copy; ${new Date().getFullYear()}</p>` : ''}
            <p>This is a computer-generated invoice and does not require a signature.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Generate and save PDF
  const generatePdf = async (action: PdfAction = 'download'): Promise<string | null> => {
    try {
      setPdfStatus('generating');
      setPdfAction(action);
      setPdfGenerationProgress('Preparing invoice data...');
      
      if (!invoice) {
        throw new Error('No invoice data available');
      }
      
      // Check permissions first
      setPdfGenerationProgress('Checking permissions...');
      const hasPermission = await canGeneratePdf();
      
      if (!hasPermission) {
        throw new Error('Storage permission denied');
      }
      
      // Ensure PDF directory exists
      const pdfDir = await ensureDocumentDirectoryExists();
      if (!pdfDir) {
        throw new Error('Could not access storage directory');
      }
      
      // Wait for company data if loading
      if (companyLoading) {
        setPdfGenerationProgress('Loading company information...');
        // Wait a bit for company data
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Generate HTML content
      setPdfGenerationProgress('Generating PDF content...');
      const htmlContent = generatePdfHtml();
      
      // Set the HTML for preview
      setPdfPreviewHtml(htmlContent);
      
      setPdfGenerationProgress('Creating PDF document...');
      
      // Generate PDF
      const fileName = `Invoice_${invoice.invoice_number}_${new Date().getTime()}`;
      const options = {
        html: htmlContent,
        fileName: fileName,
        directory: 'Documents',
        height: 842, // A4 height in points
        width: 595,  // A4 width in points
      };
      
      const pdf = await RNHTMLtoPDF.convert(options);
      
      if (!pdf || !pdf.filePath) {
        throw new Error('Failed to generate PDF');
      }
      
      console.log('PDF generated at:', pdf.filePath);
      setPdfPath(pdf.filePath);
      setPdfGenerationProgress('PDF generated successfully!');
      
      // If we're just previewing, show the preview
      if (action === 'download' || action === 'send') {
        setPdfStatus('preview');
        return pdf.filePath;
      } else if (action === 'print') {
        // For printing, go straight to print
        await handlePrintPdf(pdf.filePath);
        return pdf.filePath;
      }
      
      return pdf.filePath;
    } catch (err) {
      console.error('Error generating PDF:', err);
      setPdfStatus('error');
      Alert.alert(
        'PDF Generation Error',
        'There was an error generating the PDF. Please try again.'
      );
      return null;
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
